/**
 * 音乐管理控制器
 * 处理音乐相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const MusicService = require('../services/MusicService');

class MusicController extends BaseController {
  constructor() {
    const musicService = new MusicService();
    super({
      service: musicService,
      entityName: '音乐'
    });

    this.musicService = musicService;
  }

  /**
   * @swagger
   * /music/save:
   *   post:
   *     tags: [Music]
   *     summary: 保存音乐（新增/修改）
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
   *               - displayName
   *               - audioDuration
   *               - status
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 音乐ID（修改时必填）
   *               name:
   *                 type: string
   *                 description: 名称
   *               displayName:
   *                 type: string
   *                 description: 显示名称
   *               audioUrl:
   *                 type: string
   *                 description: 音频文件地址
   *               audioDuration:
   *                 type: integer
   *                 description: 音频时长（秒）
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
      const result = await this.musicService.save(req.body);

      if (result.success) {
        return res.success(
          { id: result.id },
          result.message || '保存音乐成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('保存音乐失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存音乐失败', 500);
    }
  }

  /**
   * @swagger
   * /music/page:
   *   get:
   *     tags: [Music]
   *     summary: 分页查询音乐列表
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
   *     responses:
   *       200:
   *         description: 查询成功
   */
  async getPage(req, res) {
    try {
      const result = await this.musicService.getPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取音乐列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取音乐列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取音乐列表失败', 500);
    }
  }

  /**
   * @swagger
   * /music/detail/{id}:
   *   get:
   *     tags: [Music]
   *     summary: 获取音乐详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 音乐ID
   *     responses:
   *       200:
   *         description: 获取成功
   *       404:
   *         description: 音乐不存在
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.musicService.getDetail(id);

      if (result.success) {
        return res.success(result.data, '获取音乐详情成功');
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error('获取音乐详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '获取音乐详情失败', 500);
    }
  }

  /**
   * @swagger
   * /music/enable:
   *   post:
   *     tags: [Music]
   *     summary: 批量启用音乐
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
   *                 description: 音乐ID列表
   *     responses:
   *       200:
   *         description: 启用成功
   */
  async enable(req, res) {
    try {
      const result = await this.musicService.batchUpdateStatus(req.body.ids, 'ENABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量启用音乐成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量启用音乐失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量启用音乐失败', 500);
    }
  }

  /**
   * @swagger
   * /music/disable:
   *   post:
   *     tags: [Music]
   *     summary: 批量禁用音乐
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
   *                 description: 音乐ID列表
   *     responses:
   *       200:
   *         description: 禁用成功
   */
  async disable(req, res) {
    try {
      const result = await this.musicService.batchUpdateStatus(req.body.ids, 'DISABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量禁用音乐成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量禁用音乐失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量禁用音乐失败', 500);
    }
  }

  /**
   * @swagger
   * /music/del:
   *   post:
   *     tags: [Music]
   *     summary: 批量删除音乐
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
   *                 description: 音乐ID列表
   *     responses:
   *       200:
   *         description: 删除成功
   */
  async del(req, res) {
    try {
      const result = await this.musicService.batchDelete(req.body.ids);

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量删除音乐成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量删除音乐失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量删除音乐失败', 500);
    }
  }
}

module.exports = MusicController;
