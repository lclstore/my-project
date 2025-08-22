/**
 * 模板管理控制器
 * 处理模板相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const TemplateService = require('../services/TemplateService');

class TemplateController extends BaseController {
  constructor() {
    const templateService = new TemplateService();
    super({
      service: templateService,
      entityName: '模板'
    });

    this.templateService = templateService;
  }

  /**
   * @swagger
   * /template/save:
   *   post:
   *     tags: [Template]
   *     summary: 保存模板（新增/修改）
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
   *               - durationCode
   *               - days
   *               - status
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 模板ID（修改时必填）
   *               name:
   *                 type: string
   *                 description: 模板名称
   *               description:
   *                 type: string
   *                 description: 描述
   *               durationCode:
   *                 type: string
   *                 enum: [MIN_5_10, MIN_10_15, MIN_15_20, MIN_20_30]
   *                 description: 时长
   *               days:
   *                 type: integer
   *                 description: 天数
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ENABLED, DISABLED]
   *                 description: 状态
   *     responses:
   *       200:
   *         description: 保存成功
   */
  async save(req, res) {
    try {
      const result = await this.templateService.save(req.body);

      if (result.success) {
        return res.success(
          { id: result.id },
          result.message || '保存模板成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('保存模板失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存模板失败', 500);
    }
  }

  /**
   * @swagger
   * /template/page:
   *   get:
   *     tags: [Template]
   *     summary: 分页查询模板列表
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
   *         name: durationCode
   *         schema:
   *           type: string
   *         description: 时长代码
   *     responses:
   *       200:
   *         description: 查询成功
   */
  async getPage(req, res) {
    try {
      const result = await this.templateService.getPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取模板列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取模板列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取模板列表失败', 500);
    }
  }

  /**
   * @swagger
   * /template/detail/{id}:
   *   get:
   *     tags: [Template]
   *     summary: 获取模板详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 模板ID
   *     responses:
   *       200:
   *         description: 获取成功
   *       404:
   *         description: 模板不存在
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.templateService.getDetail(id);

      if (result.success) {
        return res.success(result.data, '获取模板详情成功');
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error('获取模板详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '获取模板详情失败', 500);
    }
  }

  /**
   * @swagger
   * /template/enable:
   *   post:
   *     tags: [Template]
   *     summary: 批量启用模板
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
   *                 description: 模板ID列表
   *     responses:
   *       200:
   *         description: 启用成功
   */
  async enable(req, res) {
    try {
      const result = await this.templateService.batchUpdateStatus(req.body.ids, 'ENABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量启用模板成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量启用模板失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量启用模板失败', 500);
    }
  }

  /**
   * @swagger
   * /template/disable:
   *   post:
   *     tags: [Template]
   *     summary: 批量禁用模板
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
   *                 description: 模板ID列表
   *     responses:
   *       200:
   *         description: 禁用成功
   */
  async disable(req, res) {
    try {
      const result = await this.templateService.batchUpdateStatus(req.body.ids, 'DISABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量禁用模板成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量禁用模板失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量禁用模板失败', 500);
    }
  }

  /**
   * @swagger
   * /template/del:
   *   post:
   *     tags: [Template]
   *     summary: 批量删除模板
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
   *                 description: 模板ID列表
   *     responses:
   *       200:
   *         description: 删除成功
   */
  async del(req, res) {
    try {
      const result = await this.templateService.batchDelete(req.body.ids);

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量删除模板成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量删除模板失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量删除模板失败', 500);
    }
  }
}

module.exports = TemplateController;
