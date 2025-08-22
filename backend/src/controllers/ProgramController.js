/**
 * 训练计划管理控制器
 * 处理训练计划相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const ProgramService = require('../services/ProgramService');

class ProgramController extends BaseController {
  constructor() {
    const programService = new ProgramService();
    super({
      service: programService,
      entityName: '训练计划'
    });

    this.programService = programService;
  }

  /**
   * @swagger
   * /program/save:
   *   post:
   *     tags: [Program]
   *     summary: 保存训练计划（新增/修改）
   *     description: |
   *       新增或修改训练计划信息。支持草稿状态的灵活保存：
   *       - 草稿状态（DRAFT）：只需要 name 和 status 字段
   *       - 完整状态（ENABLED/DISABLED）：需要所有必填字段
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
   *                 description: 训练计划ID（修改时必填）
   *                 example: 123
   *               name:
   *                 type: string
   *                 description: 训练计划名称
   *                 example: "初级训练计划"
   *               coverImgUrl:
   *                 type: string
   *                 description: 封面图URL
   *               detailImgUrl:
   *                 type: string
   *                 description: 详情图URL
   *               description:
   *                 type: string
   *                 description: 描述
   *               showTypeCode:
   *                 type: string
   *                 enum: [HORIZONTAL, CARD]
   *                 description: 展示类型
   *               durationWeek:
   *                 type: integer
   *                 description: 持续周数
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ENABLED, DISABLED]
   *                 description: 状态
   *               workoutList:
   *                 type: array
   *                 description: 训练列表
   *                 items:
   *                   type: object
   *                   properties:
   *                     workoutId:
   *                       type: integer
   *                       description: 训练ID
   *                     sort:
   *                       type: integer
   *                       description: 排序
   *                     week:
   *                       type: integer
   *                       description: 周数
   *                     day:
   *                       type: integer
   *                       description: 天数
   *     responses:
   *       200:
   *         description: 保存成功
   *       400:
   *         description: 请求参数错误
   *       500:
   *         description: 服务器内部错误
   */
  async save(req, res) {
    try {
      const result = await this.programService.save(req.body);

      if (result.success) {
        return res.success(
          { id: result.id },
          result.message || '保存训练计划成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('保存训练计划失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存训练计划失败', 500);
    }
  }

  /**
   * @swagger
   * /program/page:
   *   get:
   *     tags: [Program]
   *     summary: 分页查询训练计划列表
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
   *         name: status
   *         schema:
   *           type: string
   *         description: 状态列表（逗号分隔）
   *       - in: query
   *         name: showTypeCode
   *         schema:
   *           type: string
   *         description: 展示类型
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
   */
  async getPage(req, res) {
    try {
      const result = await this.programService.getPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取训练计划列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取训练计划列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取训练计划列表失败', 500);
    }
  }

  /**
   * @swagger
   * /program/detail/{id}:
   *   get:
   *     tags: [Program]
   *     summary: 获取训练计划详情
   *     description: 根据ID获取训练计划的详细信息，包括关联的训练列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 训练计划ID
   *     responses:
   *       200:
   *         description: 获取成功
   *       404:
   *         description: 训练计划不存在
   *       500:
   *         description: 服务器内部错误
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.programService.getDetail(id);

      if (result.success) {
        return res.success(result.data, '获取训练计划详情成功');
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error('获取训练计划详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '获取训练计划详情失败', 500);
    }
  }

  /**
   * @swagger
   * /program/enable:
   *   post:
   *     tags: [Program]
   *     summary: 批量启用训练计划
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
   *                 description: 训练计划ID列表
   *     responses:
   *       200:
   *         description: 启用成功
   */
  async enable(req, res) {
    try {
      const result = await this.programService.batchUpdateStatus(req.body.ids, 'ENABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量启用训练计划成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量启用训练计划失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量启用训练计划失败', 500);
    }
  }

  /**
   * @swagger
   * /program/disable:
   *   post:
   *     tags: [Program]
   *     summary: 批量禁用训练计划
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
   *                 description: 训练计划ID列表
   *     responses:
   *       200:
   *         description: 禁用成功
   */
  async disable(req, res) {
    try {
      const result = await this.programService.batchUpdateStatus(req.body.ids, 'DISABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量禁用训练计划成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量禁用训练计划失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量禁用训练计划失败', 500);
    }
  }

  /**
   * @swagger
   * /program/del:
   *   post:
   *     tags: [Program]
   *     summary: 批量删除训练计划
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
   *                 description: 训练计划ID列表
   *     responses:
   *       200:
   *         description: 删除成功
   */
  async del(req, res) {
    try {
      const result = await this.programService.batchDelete(req.body.ids);

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量删除训练计划成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量删除训练计划失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量删除训练计划失败', 500);
    }
  }
}

module.exports = ProgramController;
