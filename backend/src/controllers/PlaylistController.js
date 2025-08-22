/**
 * 播放列表管理控制器
 * 处理播放列表相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const PlaylistService = require('../services/PlaylistService');

class PlaylistController extends BaseController {
  constructor() {
    const playlistService = new PlaylistService();
    super({
      service: playlistService,
      entityName: '播放列表'
    });

    this.playlistService = playlistService;
  }

  /**
   * @swagger
   * /playlist/save:
   *   post:
   *     tags: [Playlist]
   *     summary: 保存播放列表（新增/修改）
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
   *               - premium
   *               - status
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 播放列表ID（修改时必填）
   *               name:
   *                 type: string
   *                 description: 名称
   *               type:
   *                 type: string
   *                 enum: [REGULAR, YOGA, DANCE]
   *                 description: 类型
   *               premium:
   *                 type: integer
   *                 description: 是否需要订阅（0不需要 1需要）
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ENABLED, DISABLED]
   *                 description: 状态
   *               musicList:
   *                 type: array
   *                 description: 音乐列表
   *                 items:
   *                   type: object
   *                   properties:
   *                     musicId:
   *                       type: integer
   *                       description: 音乐ID
   *                     sort:
   *                       type: integer
   *                       description: 排序
   *     responses:
   *       200:
   *         description: 保存成功
   */
  async save(req, res) {
    try {
      const result = await this.playlistService.save(req.body);

      if (result.success) {
        return res.success(
          { id: result.id },
          result.message || '保存播放列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('保存播放列表失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存播放列表失败', 500);
    }
  }

  /**
   * @swagger
   * /playlist/page:
   *   get:
   *     tags: [Playlist]
   *     summary: 分页查询播放列表
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
   *         name: type
   *         schema:
   *           type: string
   *         description: 类型
   *       - in: query
   *         name: premium
   *         schema:
   *           type: integer
   *         description: 是否需要订阅
   *     responses:
   *       200:
   *         description: 查询成功
   */
  async getPage(req, res) {
    try {
      const result = await this.playlistService.getPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取播放列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取播放列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取播放列表失败', 500);
    }
  }

  /**
   * @swagger
   * /playlist/detail/{id}:
   *   get:
   *     tags: [Playlist]
   *     summary: 获取播放列表详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 播放列表ID
   *     responses:
   *       200:
   *         description: 获取成功
   *       404:
   *         description: 播放列表不存在
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.playlistService.getDetail(id);

      if (result.success) {
        return res.success(result.data, '获取播放列表详情成功');
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error('获取播放列表详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '获取播放列表详情失败', 500);
    }
  }

  /**
   * @swagger
   * /playlist/enable:
   *   post:
   *     tags: [Playlist]
   *     summary: 批量启用播放列表
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
   *                 description: 播放列表ID列表
   *     responses:
   *       200:
   *         description: 启用成功
   */
  async enable(req, res) {
    try {
      const result = await this.playlistService.batchUpdateStatus(req.body.ids, 'ENABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量启用播放列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量启用播放列表失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量启用播放列表失败', 500);
    }
  }

  /**
   * @swagger
   * /playlist/disable:
   *   post:
   *     tags: [Playlist]
   *     summary: 批量禁用播放列表
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
   *                 description: 播放列表ID列表
   *     responses:
   *       200:
   *         description: 禁用成功
   */
  async disable(req, res) {
    try {
      const result = await this.playlistService.batchUpdateStatus(req.body.ids, 'DISABLED');

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量禁用播放列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量禁用播放列表失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量禁用播放列表失败', 500);
    }
  }

  /**
   * @swagger
   * /playlist/del:
   *   post:
   *     tags: [Playlist]
   *     summary: 批量删除播放列表
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
   *                 description: 播放列表ID列表
   *     responses:
   *       200:
   *         description: 删除成功
   */
  async del(req, res) {
    try {
      const result = await this.playlistService.batchDelete(req.body.ids);

      if (result.success) {
        return res.success(
          { affectedRows: result.affectedRows },
          '批量删除播放列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量删除播放列表失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量删除播放列表失败', 500);
    }
  }
}

module.exports = PlaylistController;
