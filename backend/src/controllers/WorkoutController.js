/**
 * 训练管理控制器
 * 处理训练相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const WorkoutService = require('../services/WorkoutService');

class WorkoutController extends BaseController {
  constructor() {
    const workoutService = new WorkoutService();
    super({
      service: workoutService,
      entityName: '训练'
    });

    this.workoutService = workoutService;
  }

  /**
   * @swagger
   * /workout/save:
   *   post:
   *     tags: [Workout]
   *     summary: 保存训练（新增/修改）
   *     description: |
   *       新增或修改训练信息。支持草稿状态的灵活保存：
   *       - 草稿状态（DRAFT）：只需要 name 和 status 字段
   *       - 完整状态（ENABLED/DISABLED）：需要所有必填字段
   *       - 名称唯一性：系统会检查名称是否重复
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
   *               - status
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 训练ID（修改时必填）
   *                 example: 142
   *               name:
   *                 type: string
   *                 description: 训练名称
   *                 example: "全身燃脂训练"
   *               description:
   *                 type: string
   *                 description: 描述
   *                 example: "高强度全身燃脂训练，适合中级健身者"
   *               premium:
   *                 type: integer
   *                 description: 是否需要订阅（0不需要 1需要）
   *                 example: 0
   *               newStartTime:
   *                 type: string
   *                 format: date-time
   *                 description: NEW 开始时间
   *                 example: "2025-07-30 00:00:00"
   *               newEndTime:
   *                 type: string
   *                 format: date-time
   *                 description: NEW 结束时间
   *                 example: "2025-08-30 23:59:59"
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ENABLED, DISABLED]
   *                 description: 状态
   *                 example: "ENABLED"
   *               exerciseList:
   *                 type: array
   *                 description: 动作列表
   *                 items:
   *                   type: object
   *                   properties:
   *                     exerciseId:
   *                       type: integer
   *                       description: 动作ID
   *                     sort:
   *                       type: integer
   *                       description: 排序
   *                     reps:
   *                       type: integer
   *                       description: 次数
   *                     duration:
   *                       type: integer
   *                       description: 时长（秒）
   *     responses:
   *       200:
   *         description: 保存成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 142
   *                 message:
   *                   type: string
   *                   example: "保存训练成功"
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  async save(req, res) {
    try {
      const result = await this.workoutService.save(req.body);

      if (result.success) {
        return res.success(
          { id: result.id },
          result.message || '保存训练成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('保存训练失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存训练失败', 500);
    }
  }

  /**
   * @swagger
   * /workout/page:
   *   get:
   *     tags: [Workout]
   *     summary: 分页查询训练列表
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
   *         description: 关键词搜索（支持ID精确匹配和名称模糊搜索）
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: 状态列表（逗号分隔）
   *       - in: query
   *         name: premium
   *         schema:
   *           type: integer
   *         description: 是否需要订阅（0不需要 1需要）
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
   *                   example: "获取训练列表成功"
   */
  async getPage(req, res) {
    try {
      const result = await this.workoutService.getPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取训练列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取训练列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取训练列表失败', 500);
    }
  }

  /**
   * @swagger
   * /workout/detail/{id}:
   *   get:
   *     tags: [Workout]
   *     summary: 获取训练详情
   *     description: 根据ID获取训练的详细信息，包括关联的动作列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 训练ID
   *         example: 142
   *     responses:
   *       200:
   *         description: 获取成功
   *       404:
   *         description: 训练不存在
   *       500:
   *         description: 服务器内部错误
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.workoutService.getDetail(id);

      if (result.success) {
        return res.success(result.data, '获取训练详情成功');
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error('获取训练详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '获取训练详情失败', 500);
    }
  }

  /**
   * @swagger
   * /workout/enable:
   *   post:
   *     tags: [Workout]
   *     summary: 批量启用训练
   *     description: 批量启用指定的训练
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
   *                 description: 训练ID列表
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: 启用成功
   *       400:
   *         description: 请求参数错误
   *       500:
   *         description: 服务器内部错误
   */
  async enable(req, res) {
    try {
      const result = await this.workoutService.batchUpdateStatus(req.body.ids, 'ENABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量启用训练成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量启用训练失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量启用训练失败', 500);
    }
  }

  /**
   * @swagger
   * /workout/disable:
   *   post:
   *     tags: [Workout]
   *     summary: 批量禁用训练
   *     description: 批量禁用指定的训练
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
   *                 description: 训练ID列表
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: 禁用成功
   *       400:
   *         description: 请求参数错误
   *       500:
   *         description: 服务器内部错误
   */
  async disable(req, res) {
    try {
      const result = await this.workoutService.batchUpdateStatus(req.body.ids, 'DISABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量禁用训练成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量禁用训练失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量禁用训练失败', 500);
    }
  }

  /**
   * @swagger
   * /workout/del:
   *   post:
   *     tags: [Workout]
   *     summary: 批量删除训练
   *     description: 批量逻辑删除指定的训练
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
   *                 description: 训练ID列表
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: 删除成功
   *       400:
   *         description: 请求参数错误
   *       500:
   *         description: 服务器内部错误
   */
  async del(req, res) {
    try {
      const result = await this.workoutService.batchDelete(req.body.ids);

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量删除训练成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量删除训练失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量删除训练失败', 500);
    }
  }
}

module.exports = WorkoutController;
