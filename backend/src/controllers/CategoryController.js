/**
 * 分类控制器
 * 处理分类相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const CategoryService = require('../services/CategoryService');

class CategoryController extends BaseController {
  constructor() {
    const categoryService = new CategoryService();
    super({
      service: categoryService,
      entityName: '分类'
    });

    this.categoryService = categoryService;
  }

  /**
   * @swagger
   * /category:
   *   post:
   *     tags: [Category]
   *     summary: 创建分类
   *     description: 创建新的分类
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 description: 分类名称
   *                 example: "健身训练"
   *               description:
   *                 type: string
   *                 maxLength: 500
   *                 description: 分类描述
   *                 example: "各种健身训练相关的资源"
   *               parentId:
   *                 type: integer
   *                 description: 父级分类ID
   *                 example: 1
   *               sortOrder:
   *                 type: integer
   *                 minimum: 0
   *                 description: 排序顺序
   *                 example: 10
   *               icon:
   *                 type: string
   *                 description: 图标
   *                 example: "fitness"
   *               color:
   *                 type: string
   *                 description: 颜色
   *                 example: "#ff5722"
   *     responses:
   *       201:
   *         description: 创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                           description: 新创建的分类ID
   *       400:
   *         description: 请求参数错误
   *       409:
   *         description: 分类名称已存在
   */
  async createCategory(req, res) {
    return this.create(req, res);
  }

  /**
   * @swagger
   * /category/{id}:
   *   put:
   *     tags: [Category]
   *     summary: 更新分类
   *     description: 更新指定分类的信息
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 description: 分类名称
   *               description:
   *                 type: string
   *                 maxLength: 500
   *                 description: 分类描述
   *               parentId:
   *                 type: integer
   *                 description: 父级分类ID
   *               sortOrder:
   *                 type: integer
   *                 minimum: 0
   *                 description: 排序顺序
   *               status:
   *                 type: integer
   *                 enum: [0, 1]
   *                 description: 状态
   *               icon:
   *                 type: string
   *                 description: 图标
   *               color:
   *                 type: string
   *                 description: 颜色
   *     responses:
   *       200:
   *         description: 更新成功
   *       404:
   *         description: 分类不存在
   *       409:
   *         description: 分类名称已存在
   */
  async updateCategory(req, res) {
    return this.update(req, res);
  }

  /**
   * @swagger
   * /category/{id}:
   *   delete:
   *     tags: [Category]
   *     summary: 删除分类
   *     description: 删除指定分类
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     responses:
   *       200:
   *         description: 删除成功
   *       400:
   *         description: 该分类下有子分类，无法删除
   *       404:
   *         description: 分类不存在
   */
  async deleteCategory(req, res) {
    return this.delete(req, res);
  }

  /**
   * @swagger
   * /category/{id}:
   *   get:
   *     tags: [Category]
   *     summary: 获取分类详情
   *     description: 根据ID获取分类详细信息
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
   *       404:
   *         description: 分类不存在
   */
  async getCategoryById(req, res) {
    return this.getDetail(req, res);
  }

  /**
   * @swagger
   * /category/list:
   *   get:
   *     tags: [Category]
   *     summary: 获取分类列表
   *     description: 获取分页的分类列表
   *     parameters:
   *       - $ref: '#/components/parameters/PageIndex'
   *       - $ref: '#/components/parameters/PageSize'
   *       - $ref: '#/components/parameters/Status'
   *       - name: parentId
   *         in: query
   *         description: 父级分类ID
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedResponse'
   */
  async getCategoryList(req, res) {
    return this.getList(req, res);
  }

  /**
   * @swagger
   * /category/all:
   *   get:
   *     tags: [Category]
   *     summary: 获取所有分类
   *     description: 获取所有分类（不分页）
   *     parameters:
   *       - $ref: '#/components/parameters/Status'
   *       - name: parentId
   *         in: query
   *         description: 父级分类ID
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: 获取成功
   */
  async getAllCategories(req, res) {
    return this.getAll(req, res);
  }

  /**
   * @swagger
   * /category/tree:
   *   get:
   *     tags: [Category]
   *     summary: 获取分类树
   *     description: 获取层级结构的分类树
   *     parameters:
   *       - name: parentId
   *         in: query
   *         description: 父级分类ID（不传则从根级开始）
   *         schema:
   *           type: integer
   *       - name: maxLevel
   *         in: query
   *         description: 最大层级深度
   *         schema:
   *           type: integer
   *           maximum: 10
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         allOf:
   *                           - $ref: '#/components/schemas/Category'
   *                           - type: object
   *                             properties:
   *                               children:
   *                                 type: array
   *                                 items:
   *                                   $ref: '#/components/schemas/Category'
   */
  async getCategoryTree(req, res) {
    try {
      const { parentId, maxLevel } = req.query;
      const result = await this.categoryService.getCategoryTree(
        parentId ? parseInt(parentId) : null,
        maxLevel ? parseInt(maxLevel) : null
      );

      if (result.success) {
        return res.success(result.data, '获取分类树成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取分类树失败:', {
        error: error.message,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取分类树失败', 500);
    }
  }

  /**
   * @swagger
   * /category/top:
   *   get:
   *     tags: [Category]
   *     summary: 获取顶级分类
   *     description: 获取所有顶级分类
   *     parameters:
   *       - name: orderBy
   *         in: query
   *         description: 排序方式
   *         schema:
   *           type: string
   *           default: "sort_order ASC"
   *     responses:
   *       200:
   *         description: 获取成功
   */
  async getTopCategories(req, res) {
    try {
      const { orderBy = 'sort_order ASC' } = req.query;
      const result = await this.categoryService.getTopCategories(orderBy);

      if (result.success) {
        return res.success(result.data, '获取顶级分类成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取顶级分类失败:', {
        error: error.message,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取顶级分类失败', 500);
    }
  }

  /**
   * @swagger
   * /category/{id}/children:
   *   get:
   *     tags: [Category]
   *     summary: 获取子分类
   *     description: 获取指定分类的直接子分类
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *       - name: orderBy
   *         in: query
   *         description: 排序方式
   *         schema:
   *           type: string
   *           default: "sort_order ASC"
   *     responses:
   *       200:
   *         description: 获取成功
   */
  async getChildren(req, res) {
    try {
      const { id } = req.params;
      const { orderBy = 'sort_order ASC' } = req.query;

      const result = await this.categoryService.getChildren(parseInt(id), orderBy);

      if (result.success) {
        return res.success(result.data, '获取子分类成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取子分类失败:', {
        error: error.message,
        params: req.params,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取子分类失败', 500);
    }
  }

  /**
   * @swagger
   * /category/{id}/breadcrumb:
   *   get:
   *     tags: [Category]
   *     summary: 获取分类面包屑导航
   *     description: 获取指定分类的面包屑导航路径
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Category'
   */
  async getBreadcrumb(req, res) {
    try {
      const { id } = req.params;
      const result = await this.categoryService.getBreadcrumb(parseInt(id));

      if (result.success) {
        return res.success(result.data, '获取面包屑导航成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取面包屑导航失败:', {
        error: error.message,
        params: req.params
      });
      return res.error('INTERNAL_ERROR', '获取面包屑导航失败', 500);
    }
  }

  /**
   * @swagger
   * /category/search:
   *   get:
   *     tags: [Category]
   *     summary: 搜索分类
   *     description: 根据关键词搜索分类
   *     parameters:
   *       - $ref: '#/components/parameters/Keywords'
   *       - $ref: '#/components/parameters/PageIndex'
   *       - $ref: '#/components/parameters/PageSize'
   *       - $ref: '#/components/parameters/Status'
   *       - name: parentId
   *         in: query
   *         description: 父级分类ID
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: 搜索成功
   */
  async searchCategories(req, res) {
    return this.search(req, res);
  }

  /**
   * @swagger
   * /category/batch-sort:
   *   post:
   *     tags: [Category]
   *     summary: 批量更新排序
   *     description: 批量更新分类的排序顺序
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sortData
   *             properties:
   *               sortData:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - id
   *                     - sortOrder
   *                   properties:
   *                     id:
   *                       type: integer
   *                       description: 分类ID
   *                     sortOrder:
   *                       type: integer
   *                       description: 排序顺序
   *     responses:
   *       200:
   *         description: 更新成功
   */
  async batchUpdateSort(req, res) {
    try {
      const { sortData } = req.body;
      const result = await this.categoryService.batchUpdateSort(sortData);

      if (result.success) {
        return res.success(null, result.message);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量更新排序失败:', {
        error: error.message,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量更新排序失败', 500);
    }
  }

  /**
   * @swagger
   * /category/batch-delete:
   *   post:
   *     tags: [Category]
   *     summary: 批量删除分类
   *     description: 批量删除分类
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ids
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 分类ID列表
   *     responses:
   *       200:
   *         description: 批量删除成功
   */
  async batchDeleteCategories(req, res) {
    return this.batchDelete(req, res);
  }

  /**
   * @swagger
   * /category/batch-update-status:
   *   post:
   *     tags: [Category]
   *     summary: 批量更新分类状态
   *     description: 批量更新分类状态
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ids
   *               - status
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: integer
   *               status:
   *                 type: integer
   *                 enum: [0, 1]
   *     responses:
   *       200:
   *         description: 批量更新成功
   */
  async batchUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body;
      const result = await this.categoryService.batchUpdateStatus(ids, status);

      if (result.success) {
        return res.success(null, result.message);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量更新分类状态失败:', {
        error: error.message,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量更新分类状态失败', 500);
    }
  }

  /**
   * @swagger
   * /category/stats:
   *   get:
   *     tags: [Category]
   *     summary: 获取分类统计信息
   *     description: 获取分类相关的统计数据
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   */
  async getCategoryStats(req, res) {
    return this.getStats(req, res);
  }

  /**
   * @swagger
   * /category/{id}/move:
   *   post:
   *     tags: [Category]
   *     summary: 移动分类
   *     description: 移动分类到新的父级分类下
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               newParentId:
   *                 type: integer
   *                 nullable: true
   *                 description: 新父级分类ID，null表示移动到顶级
   *     responses:
   *       200:
   *         description: 移动成功
   */
  async moveCategory(req, res) {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;

      const result = await this.categoryService.moveCategory(parseInt(id), newParentId);

      if (result.success) {
        return res.success(null, result.message);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('移动分类失败:', {
        error: error.message,
        params: req.params,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '移动分类失败', 500);
    }
  }

  /**
   * @swagger
   * /category/{id}/copy:
   *   post:
   *     tags: [Category]
   *     summary: 复制分类
   *     description: 复制现有分类
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               newName:
   *                 type: string
   *                 description: 新分类名称，不传则自动生成
   *               newParentId:
   *                 type: integer
   *                 description: 新父级分类ID，不传则使用原父级
   *     responses:
   *       201:
   *         description: 复制成功
   */
  async copyCategory(req, res) {
    try {
      const { id } = req.params;
      const { newName, newParentId } = req.body;

      const result = await this.categoryService.copyCategory(parseInt(id), newName, newParentId);

      if (result.success) {
        return res.success({ id: result.insertId }, result.message, 201);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('复制分类失败:', {
        error: error.message,
        params: req.params,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '复制分类失败', 500);
    }
  }

  /**
   * @swagger
   * /category/check-name:
   *   post:
   *     tags: [Category]
   *     summary: 检查分类名称是否可用
   *     description: 检查分类名称在指定父级下是否已存在
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: 分类名称
   *               parentId:
   *                 type: integer
   *                 description: 父级分类ID
   *               excludeId:
   *                 type: integer
   *                 description: 排除的分类ID（用于编辑时）
   *     responses:
   *       200:
   *         description: 检查成功
   */
  async checkNameAvailable(req, res) {
    try {
      const { name, parentId, excludeId } = req.body;
      const result = await this.categoryService.checkNameAvailable(name, parentId, excludeId);

      if (result.success) {
        return res.success(result.data, '检查完成');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('检查分类名称可用性失败:', {
        error: error.message,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '检查分类名称可用性失败', 500);
    }
  }

  /**
   * @swagger
   * /category/{id}/path:
   *   get:
   *     tags: [Category]
   *     summary: 获取分类路径
   *     description: 获取分类的完整路径字符串
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *       - name: separator
   *         in: query
   *         description: 路径分隔符
   *         schema:
   *           type: string
   *           default: " > "
   *     responses:
   *       200:
   *         description: 获取成功
   */
  async getCategoryPath(req, res) {
    try {
      const { id } = req.params;
      const { separator = ' > ' } = req.query;

      const result = await this.categoryService.getCategoryPath(parseInt(id), separator);

      if (result.success) {
        return res.success(result.data, '获取分类路径成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取分类路径失败:', {
        error: error.message,
        params: req.params,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取分类路径失败', 500);
    }
  }
}

module.exports = CategoryController;