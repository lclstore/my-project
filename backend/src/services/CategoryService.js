/**
 * 分类服务类
 * 处理分类相关的业务逻辑
 */

const BaseService = require('../core/BaseService');
const Category = require('../models/Category');
const { ERROR_CODES } = require('../config/constants');

class CategoryService extends BaseService {
  constructor() {
    super({
      tableName: 'category',
      entityName: '分类',
      primaryKey: 'id',
      fieldMapping: {
        'id': 'id',
        'name': 'name',
        'description': 'description',
        'parentId': 'parent_id',
        'sortOrder': 'sort_order',
        'status': 'status',
        'icon': 'icon',
        'color': 'color',
        'level': 'level',
        'path': 'path',
        'createTime': 'create_time',
        'updateTime': 'update_time',
        'isDeleted': 'is_deleted'
      },
      searchableFields: ['name', 'description']
    });

    this.categoryModel = new Category();
  }

  /**
   * 创建分类
   */
  async createCategory(categoryData) {
    try {
      // 参数验证
      const validation = this.validate(categoryData, {
        name: { required: true, type: 'string', maxLength: 100 },
        description: { required: false, type: 'string', maxLength: 500 },
        parentId: { required: false, type: 'number' },
        sortOrder: { required: false, type: 'number', min: 0 }
      });

      if (!validation.valid) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: validation.errors.join(', ')
        };
      }

      const result = await this.categoryModel.createCategory(categoryData);
      return result;
    } catch (error) {
      this.logger.error('创建分类失败:', { error: error.message, categoryData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '创建分类失败'
      };
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(categoryId, categoryData) {
    try {
      // 参数验证
      const validation = this.validate(categoryData, {
        name: { required: false, type: 'string', maxLength: 100 },
        description: { required: false, type: 'string', maxLength: 500 },
        parentId: { required: false, type: 'number' },
        sortOrder: { required: false, type: 'number', min: 0 }
      });

      if (!validation.valid) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: validation.errors.join(', ')
        };
      }

      const result = await this.categoryModel.updateCategory(categoryId, categoryData);
      return result;
    } catch (error) {
      this.logger.error('更新分类失败:', { error: error.message, categoryId, categoryData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '更新分类失败'
      };
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(categoryId) {
    try {
      const result = await this.categoryModel.deleteCategory(categoryId);
      return result;
    } catch (error) {
      this.logger.error('删除分类失败:', { error: error.message, categoryId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '删除分类失败'
      };
    }
  }

  /**
   * 获取分类详情
   */
  async getCategoryById(categoryId) {
    try {
      const category = await this.categoryModel.find(categoryId);

      if (!category) {
        return {
          success: false,
          errCode: ERROR_CODES.RECORD_NOT_FOUND,
          errMessage: '分类不存在'
        };
      }

      return {
        success: true,
        data: category
      };
    } catch (error) {
      this.logger.error('获取分类详情失败:', { error: error.message, categoryId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取分类详情失败'
      };
    }
  }

  /**
   * 获取分类列表（分页）
   */
  async getCategoryList(query = {}) {
    try {
      const result = await this.getList(query);
      return result;
    } catch (error) {
      this.logger.error('获取分类列表失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取分类列表失败'
      };
    }
  }

  /**
   * 获取所有分类（不分页）
   */
  async getAllCategories(query = {}) {
    try {
      const result = await this.getAll(query);
      return result;
    } catch (error) {
      this.logger.error('获取所有分类失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取所有分类失败'
      };
    }
  }

  /**
   * 获取分类树
   */
  async getCategoryTree(parentId = null, maxLevel = null) {
    try {
      const categories = await this.categoryModel.getCategoryTree(parentId, maxLevel);

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      this.logger.error('获取分类树失败:', { error: error.message, parentId, maxLevel });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取分类树失败'
      };
    }
  }

  /**
   * 获取顶级分类
   */
  async getTopCategories(orderBy = 'sort_order ASC') {
    try {
      const categories = await this.categoryModel.getTopCategories(orderBy);

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      this.logger.error('获取顶级分类失败:', { error: error.message });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取顶级分类失败'
      };
    }
  }

  /**
   * 获取子分类
   */
  async getChildren(parentId, orderBy = 'sort_order ASC') {
    try {
      const categories = await this.categoryModel.getChildren(parentId, orderBy);

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      this.logger.error('获取子分类失败:', { error: error.message, parentId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取子分类失败'
      };
    }
  }

  /**
   * 获取分类面包屑导航
   */
  async getBreadcrumb(categoryId) {
    try {
      const breadcrumb = await this.categoryModel.getBreadcrumb(categoryId);

      return {
        success: true,
        data: breadcrumb
      };
    } catch (error) {
      this.logger.error('获取分类面包屑失败:', { error: error.message, categoryId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取分类面包屑失败'
      };
    }
  }

  /**
   * 搜索分类
   */
  async searchCategories(query = {}) {
    try {
      const result = await this.categoryModel.searchCategories(query.keywords, {
        status: query.status,
        parentId: query.parentId,
        pageIndex: query.pageIndex,
        pageSize: query.pageSize
      });

      return result;
    } catch (error) {
      this.logger.error('搜索分类失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '搜索分类失败'
      };
    }
  }

  /**
   * 批量更新排序
   */
  async batchUpdateSort(sortData) {
    try {
      // 参数验证
      if (!Array.isArray(sortData) || sortData.length === 0) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '排序数据不能为空'
        };
      }

      // 验证排序数据格式
      for (const item of sortData) {
        if (!item.id || typeof item.sortOrder !== 'number') {
          return {
            success: false,
            errCode: ERROR_CODES.VALIDATION_ERROR,
            errMessage: '排序数据格式不正确'
          };
        }
      }

      const result = await this.categoryModel.batchUpdateSort(sortData);
      return result;
    } catch (error) {
      this.logger.error('批量更新排序失败:', { error: error.message, sortData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '批量更新排序失败'
      };
    }
  }

  /**
   * 批量删除分类
   */
  async batchDeleteCategories(categoryIds) {
    try {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '分类ID列表不能为空'
        };
      }

      // 检查每个分类是否可以删除（没有子分类）
      for (const categoryId of categoryIds) {
        const children = await this.categoryModel.getChildren(categoryId);
        if (children.length > 0) {
          const category = await this.categoryModel.find(categoryId);
          return {
            success: false,
            errCode: ERROR_CODES.VALIDATION_ERROR,
            errMessage: `分类 "${category?.name || categoryId}" 下还有子分类，无法删除`
          };
        }
      }

      const result = await this.batchDelete(categoryIds);
      return result;
    } catch (error) {
      this.logger.error('批量删除分类失败:', { error: error.message, categoryIds });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '批量删除分类失败'
      };
    }
  }

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(categoryIds, status) {
    try {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '分类ID列表不能为空'
        };
      }

      const db = await this.getDatabase();
      const placeholders = categoryIds.map(() => '?').join(',');
      const sql = `
        UPDATE ${this.tableName} 
        SET status = ?, update_time = NOW() 
        WHERE id IN (${placeholders}) AND (is_deleted = 0 OR is_deleted IS NULL)
      `;

      const result = await db.query(sql, [status, ...categoryIds]);

      return {
        success: true,
        affectedRows: result.affectedRows,
        message: `成功更新${result.affectedRows}个分类状态`
      };
    } catch (error) {
      this.logger.error('批量更新分类状态失败:', { error: error.message, categoryIds, status });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '批量更新分类状态失败'
      };
    }
  }

  /**
   * 获取分类统计信息
   */
  async getCategoryStats() {
    try {
      const result = await this.categoryModel.getCategoryStats();
      return result;
    } catch (error) {
      this.logger.error('获取分类统计失败:', { error: error.message });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取分类统计失败'
      };
    }
  }

  /**
   * 移动分类（更改父级分类）
   */
  async moveCategory(categoryId, newParentId) {
    try {
      // 验证参数
      if (!categoryId) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '分类ID不能为空'
        };
      }

      // 检查分类是否存在
      const category = await this.categoryModel.find(categoryId);
      if (!category) {
        return {
          success: false,
          errCode: ERROR_CODES.RECORD_NOT_FOUND,
          errMessage: '分类不存在'
        };
      }

      // 如果新父级ID为null或0，表示移动到顶级
      if (!newParentId || newParentId === 0) {
        newParentId = null;
      }

      // 更新分类的父级
      const result = await this.categoryModel.updateCategory(categoryId, { parent_id: newParentId });

      if (result.success) {
        return {
          success: true,
          message: '分类移动成功'
        };
      } else {
        return result;
      }
    } catch (error) {
      this.logger.error('移动分类失败:', { error: error.message, categoryId, newParentId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '移动分类失败'
      };
    }
  }

  /**
   * 复制分类
   */
  async copyCategory(categoryId, newName = null, newParentId = null) {
    try {
      // 获取原分类信息
      const originalCategory = await this.categoryModel.find(categoryId);
      if (!originalCategory) {
        return {
          success: false,
          errCode: ERROR_CODES.RECORD_NOT_FOUND,
          errMessage: '原分类不存在'
        };
      }

      // 准备新分类数据
      const newCategoryData = {
        name: newName || `${originalCategory.name}_copy`,
        description: originalCategory.description,
        parent_id: newParentId !== undefined ? newParentId : originalCategory.parent_id,
        sort_order: originalCategory.sort_order,
        status: originalCategory.status,
        icon: originalCategory.icon,
        color: originalCategory.color
      };

      // 创建新分类
      const result = await this.categoryModel.createCategory(newCategoryData);

      if (result.success) {
        return {
          success: true,
          insertId: result.insertId,
          message: '分类复制成功'
        };
      } else {
        return result;
      }
    } catch (error) {
      this.logger.error('复制分类失败:', { error: error.message, categoryId, newName, newParentId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '复制分类失败'
      };
    }
  }

  /**
   * 检查分类名称是否可用
   */
  async checkNameAvailable(name, parentId = null, excludeId = null) {
    try {
      const exists = await this.categoryModel.nameExists(name, parentId, excludeId);
      return {
        success: true,
        data: {
          available: !exists
        }
      };
    } catch (error) {
      this.logger.error('检查分类名称可用性失败:', { error: error.message, name, parentId, excludeId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '检查分类名称可用性失败'
      };
    }
  }

  /**
   * 获取分类路径字符串
   */
  async getCategoryPath(categoryId, separator = ' > ') {
    try {
      const breadcrumb = await this.categoryModel.getBreadcrumb(categoryId);
      const pathArray = breadcrumb.map(category => category.name);

      return {
        success: true,
        data: {
          path: pathArray.join(separator),
          breadcrumb: breadcrumb
        }
      };
    } catch (error) {
      this.logger.error('获取分类路径失败:', { error: error.message, categoryId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取分类路径失败'
      };
    }
  }
}

module.exports = CategoryService;