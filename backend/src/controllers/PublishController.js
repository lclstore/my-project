/**
 * 发布管理控制器
 * 处理发布相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const PublishService = require('../services/PublishService');

class PublishController extends BaseController {
  constructor() {
    const publishService = new PublishService();
    super({
      service: publishService,
      entityName: '发布记录'
    });

    this.publishService = publishService;
  }

  /**
   * @swagger
   * /publish/publish:
   *   post:
   *     tags: [Publish]
   *     summary: 新增发布记录
   *     description: 创建新的发布记录，操作人从token中获取
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - env
   *               - status
   *             properties:
   *               env:
   *                 type: string
   *                 enum: [PRODUCTION, PRE_PRODUCTION]
   *                 description: 环境
   *                 example: "PRE_PRODUCTION"
   *               remark:
   *                 type: string
   *                 description: 说明
   *                 example: "修复登录问题"
   *               status:
   *                 type: string
   *                 enum: [WAITTING, SUCCESS, FAIL, PROCESSING]
   *                 description: 状态
   *                 example: "WAITTING"
   *     responses:
   *       200:
   *         description: 新增发布记录成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  async createPublish(req, res) {
    try {
      // 从token中获取用户ID
      const createUser = req.user?.userId;
      if (!createUser) {
        return res.error('UNAUTHORIZED', '用户信息缺失', 401);
      }

      const publishData = {
        ...req.body,
        createUser
      };

      const result = await this.publishService.createPublish(publishData);

      if (result.success) {
        return res.success(
          { id: result.id },
          result.message || '新增发布记录成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('新增发布记录失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '新增发布记录失败', 500);
    }
  }

  /**
   * @swagger
   * /publish/page:
   *   get:
   *     tags: [Publish]
   *     summary: 分页查询发布记录
   *     description: 支持关键词搜索、状态筛选、排序等功能
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageIndex
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: keywords
   *         schema:
   *           type: string
   *         description: 关键词搜索
   *       - in: query
   *         name: env
   *         schema:
   *           type: string
   *         description: 环境筛选
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: 状态筛选
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           default: id
   *         description: 排序字段
   *       - in: query
   *         name: orderDirection
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: 排序方向
   *     responses:
   *       200:
   *         description: 查询成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                 totalCount:
   *                   type: integer
   *                   example: 100
   *                 pageIndex:
   *                   type: integer
   *                   example: 1
   *                 pageSize:
   *                   type: integer
   *                   example: 10
   *                 message:
   *                   type: string
   *                   example: "获取发布记录列表成功"
   */
  async getPage(req, res) {
    try {
      const result = await this.publishService.getPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取发布记录列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取发布记录列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取发布记录列表失败', 500);
    }
  }

  /**
   * @swagger
   * /publish/detail/{id}:
   *   get:
   *     tags: [Publish]
   *     summary: 获取发布记录详情
   *     description: 根据ID获取发布记录的详细信息
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 发布记录ID
   *     responses:
   *       200:
   *         description: 获取成功
   *       404:
   *         description: 发布记录不存在
   *       500:
   *         description: 服务器内部错误
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.publishService.getDetail(id);

      if (result.success) {
        return res.success(result.data, '获取发布记录详情成功');
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error('获取发布记录详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '获取发布记录详情失败', 500);
    }
  }

  /**
   * @swagger
   * /publish/update/{id}:
   *   put:
   *     tags: [Publish]
   *     summary: 更新发布记录状态
   *     description: 更新指定发布记录的状态
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 发布记录ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [WAITTING, SUCCESS, FAIL, PROCESSING]
   *                 description: 状态
   *               remark:
   *                 type: string
   *                 description: 说明
   *     responses:
   *       200:
   *         description: 更新成功
   *       400:
   *         description: 请求参数错误
   *       404:
   *         description: 发布记录不存在
   *       500:
   *         description: 服务器内部错误
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const updateUser = req.user?.userId;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      if (!updateUser) {
        return res.error('UNAUTHORIZED', '用户信息缺失', 401);
      }

      const updateData = {
        ...req.body,
        updateUser
      };

      const result = await this.publishService.updateStatus(id, updateData);

      if (result.success) {
        return res.success(null, result.message || '更新发布记录成功');
      } else {
        return res.error(result.errCode, result.errMessage, result.statusCode || 400);
      }
    } catch (error) {
      this.logger.error('更新发布记录失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '更新发布记录失败', 500);
    }
  }
}

module.exports = PublishController;
