/**
 * 分类模型
 * 分类数据的操作和验证
 */

const BaseModel = require('../core/BaseModel');
const { DATA_STATUS } = require('../config/constants');

class Category extends BaseModel {
  constructor() {
    super({
      tableName: 'category',
      primaryKey: 'id',
      fillable: [
        'name',
        'description',
        'parent_id',
        'sort_order',
        'status',
        'icon',
        'color',
        'level',
        'path'
      ],
      casts: {
        parent_id: 'int',
        sort_order: 'int',
        status: 'int',
        level: 'int'
      },
      timestamps: true,
      softDeletes: true
    });
  }

  /**
   * 创建分类前的处理
   */
  async beforeCreate(data) {
    // 设置默认值
    if (!data.status) {
      data.status = DATA_STATUS.ENABLED;
    }

    if (!data.sort_order) {
      data.sort_order = 0;
    }

    // 计算层级和路径
    if (data.parent_id) {
      const parent = await this.find(data.parent_id);
      if (parent) {
        data.level = (parent.level || 0) + 1;
        data.path = parent.path ? `${parent.path},${data.parent_id}` : data.parent_id.toString();
      }
    } else {
      data.level = 1;
      data.path = '';
      data.parent_id = null;
    }

    return data;
  }

  /**
   * 更新分类前的处理
   */
  async beforeUpdate(data) {
    // 如果更新了父级分类，重新计算层级和路径
    if (data.hasOwnProperty('parent_id')) {
      if (data.parent_id) {
        const parent = await this.find(data.parent_id);
        if (parent) {
          data.level = (parent.level || 0) + 1;
          data.path = parent.path ? `${parent.path},${data.parent_id}` : data.parent_id.toString();
        }
      } else {
        data.level = 1;
        data.path = '';
        data.parent_id = null;
      }
    }

    return data;
  }

  /**
   * 获取顶级分类
   */
  async getTopCategories(orderBy = 'sort_order ASC') {
    const db = await this.getDatabase();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE (parent_id IS NULL OR parent_id = 0) 
      AND (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY ${orderBy}
    `;
    const results = await db.query(sql);
    return results.map(result => this.transform(result));
  }

  /**
   * 获取子分类
   */
  async getChildren(parentId, orderBy = 'sort_order ASC') {
    const db = await this.getDatabase();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ? 
      AND (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY ${orderBy}
    `;
    const results = await db.query(sql, [parentId]);
    return results.map(result => this.transform(result));
  }

  /**
   * 获取分类树
   */
  async getCategoryTree(parentId = null, maxLevel = null) {
    try {
      let categories;

      if (parentId) {
        categories = await this.getChildren(parentId);
      } else {
        categories = await this.getTopCategories();
      }

      // 递归获取子分类
      for (const category of categories) {
        if (!maxLevel || category.level < maxLevel) {
          category.children = await this.getCategoryTree(category.id, maxLevel);
        } else {
          category.children = [];
        }
      }

      return categories;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取分类面包屑导航
   */
  async getBreadcrumb(categoryId) {
    try {
      const category = await this.find(categoryId);
      if (!category) {
        return [];
      }

      const breadcrumb = [category];

      if (category.path) {
        const parentIds = category.path.split(',').filter(id => id);
        for (const parentId of parentIds.reverse()) {
          const parent = await this.find(parseInt(parentId));
          if (parent) {
            breadcrumb.unshift(parent);
          }
        }
      }

      return breadcrumb;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取所有后代分类ID
   */
  async getDescendantIds(parentId) {
    try {
      const db = await this.getDatabase();
      const sql = `
        SELECT id FROM ${this.tableName} 
        WHERE (path LIKE ? OR path LIKE ? OR id = ?) 
        AND (is_deleted = 0 OR is_deleted IS NULL)
      `;
      const results = await db.query(sql, [
        `%,${parentId},%`,
        `${parentId},%`,
        parentId
      ]);

      return results.map(result => result.id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查分类名称是否存在
   */
  async nameExists(name, parentId = null, excludeId = null) {
    const whereConditions = ['name = ?'];
    const params = [name];

    if (parentId) {
      whereConditions.push('parent_id = ?');
      params.push(parentId);
    } else {
      whereConditions.push('(parent_id IS NULL OR parent_id = 0)');
    }

    if (excludeId) {
      whereConditions.push('id != ?');
      params.push(excludeId);
    }

    whereConditions.push('(is_deleted = 0 OR is_deleted IS NULL)');

    const count = await this.count(whereConditions.join(' AND '), params);
    return count > 0;
  }

  /**
   * 创建分类
   */
  async createCategory(categoryData) {
    try {
      // 检查名称是否重复
      const nameExists = await this.nameExists(categoryData.name, categoryData.parent_id);
      if (nameExists) {
        return {
          success: false,
          error: 'NAME_EXISTS',
          message: '分类名称已存在'
        };
      }

      // 验证父级分类
      if (categoryData.parent_id) {
        const parent = await this.find(categoryData.parent_id);
        if (!parent) {
          return {
            success: false,
            error: 'PARENT_NOT_FOUND',
            message: '父级分类不存在'
          };
        }
      }

      // 处理数据
      const processedData = await this.beforeCreate(categoryData);

      // 创建分类
      const result = await this.create(processedData);

      return {
        success: true,
        insertId: result.insertId,
        message: '分类创建成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'CREATE_FAILED',
        message: '分类创建失败'
      };
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(categoryId, categoryData) {
    try {
      // 检查分类是否存在
      const category = await this.find(categoryId);
      if (!category) {
        return {
          success: false,
          error: 'CATEGORY_NOT_FOUND',
          message: '分类不存在'
        };
      }

      // 检查名称是否重复
      if (categoryData.name) {
        const nameExists = await this.nameExists(
          categoryData.name,
          categoryData.parent_id || category.parent_id,
          categoryId
        );
        if (nameExists) {
          return {
            success: false,
            error: 'NAME_EXISTS',
            message: '分类名称已存在'
          };
        }
      }

      // 验证父级分类（不能设置自己或自己的子分类为父级）
      if (categoryData.parent_id) {
        if (categoryData.parent_id === categoryId) {
          return {
            success: false,
            error: 'INVALID_PARENT',
            message: '不能将自己设置为父级分类'
          };
        }

        const descendantIds = await this.getDescendantIds(categoryId);
        if (descendantIds.includes(categoryData.parent_id)) {
          return {
            success: false,
            error: 'INVALID_PARENT',
            message: '不能将子分类设置为父级分类'
          };
        }

        const parent = await this.find(categoryData.parent_id);
        if (!parent) {
          return {
            success: false,
            error: 'PARENT_NOT_FOUND',
            message: '父级分类不存在'
          };
        }
      }

      // 处理数据
      const processedData = await this.beforeUpdate(categoryData);

      // 更新分类
      await this.update(categoryId, processedData);

      // 如果父级发生变化，需要更新所有子分类的层级和路径
      if (categoryData.hasOwnProperty('parent_id')) {
        await this.updateChildrenLevelAndPath(categoryId);
      }

      return {
        success: true,
        message: '分类更新成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: '分类更新失败'
      };
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(categoryId) {
    try {
      // 检查是否有子分类
      const children = await this.getChildren(categoryId);
      if (children.length > 0) {
        return {
          success: false,
          error: 'HAS_CHILDREN',
          message: '该分类下还有子分类，无法删除'
        };
      }

      // 检查是否有关联数据（这里可以根据具体业务扩展）
      // const hasRelatedData = await this.checkRelatedData(categoryId);
      // if (hasRelatedData) {
      //   return {
      //     success: false,
      //     error: 'HAS_RELATED_DATA',
      //     message: '该分类下还有相关数据，无法删除'
      //   };
      // }

      // 删除分类
      await this.delete(categoryId);

      return {
        success: true,
        message: '分类删除成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'DELETE_FAILED',
        message: '分类删除失败'
      };
    }
  }

  /**
   * 更新子分类的层级和路径
   */
  async updateChildrenLevelAndPath(parentId) {
    try {
      const children = await this.getChildren(parentId);

      for (const child of children) {
        const parent = await this.find(parentId);
        if (parent) {
          const updateData = {
            level: (parent.level || 0) + 1,
            path: parent.path ? `${parent.path},${parentId}` : parentId.toString()
          };

          await this.update(child.id, updateData);

          // 递归更新子分类的子分类
          await this.updateChildrenLevelAndPath(child.id);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 批量更新排序
   */
  async batchUpdateSort(sortData) {
    try {
      if (!Array.isArray(sortData) || sortData.length === 0) {
        return {
          success: false,
          error: 'INVALID_PARAMS',
          message: '排序数据不能为空'
        };
      }

      const db = await this.getDatabase();

      // 使用事务处理
      await db.transaction(async (query) => {
        for (const item of sortData) {
          await query(
            `UPDATE ${this.tableName} SET sort_order = ?, update_time = NOW() WHERE id = ?`,
            [item.sortOrder, item.id]
          );
        }
      });

      return {
        success: true,
        message: '排序更新成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'SORT_UPDATE_FAILED',
        message: '排序更新失败'
      };
    }
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats() {
    try {
      const db = await this.getDatabase();
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 1 THEN 1 END) as active,
          COUNT(CASE WHEN status = 0 THEN 1 END) as inactive,
          COUNT(CASE WHEN parent_id IS NULL OR parent_id = 0 THEN 1 END) as top_level,
          MAX(level) as max_level
        FROM ${this.tableName} 
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
      `;

      const result = await db.queryOne(sql);

      return {
        success: true,
        data: {
          total: parseInt(result.total),
          active: parseInt(result.active),
          inactive: parseInt(result.inactive),
          topLevel: parseInt(result.top_level),
          maxLevel: parseInt(result.max_level || 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'STATS_FAILED',
        message: '获取统计信息失败'
      };
    }
  }

  /**
   * 搜索分类
   */
  async searchCategories(keyword, options = {}) {
    try {
      const {
        status = null,
        parentId = null,
        pageIndex = 1,
        pageSize = 10
      } = options;

      const whereConditions = ['(is_deleted = 0 OR is_deleted IS NULL)'];
      const params = [];

      if (keyword) {
        whereConditions.push('(name LIKE ? OR description LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      if (status !== null) {
        whereConditions.push('status = ?');
        params.push(status);
      }

      if (parentId !== null) {
        whereConditions.push('parent_id = ?');
        params.push(parentId);
      }

      const result = await this.paginate({
        where: whereConditions.join(' AND '),
        whereParams: params,
        orderBy: 'sort_order ASC, id DESC',
        pageIndex,
        pageSize
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      return {
        success: false,
        error: 'SEARCH_FAILED',
        message: '搜索失败'
      };
    }
  }
}

module.exports = Category;