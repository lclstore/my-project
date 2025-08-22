/**
 * 音频资源控制器
 * 处理音频资源相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const SoundService = require('../services/SoundService');

class SoundController extends BaseController {
  constructor() {
    const soundService = new SoundService();
    super({
      service: soundService,
      entityName: '音频资源'
    });

    this.soundService = soundService;
  }

  /**
   * @swagger
   * /sound/save:
   *   post:
   *     tags: [Sound]
   *     summary: 保存音频资源
   *     description: 新增或修改音频资源记录（有id为修改，无id为新增）
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
   *               - genderCode
   *               - usageCode
   *               - translation
   *               - status
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 音频资源ID（修改时必传，新增时不传）
   *                 example: 1
   *               name:
   *                 type: string
   *                 description: 音频名称
   *                 example: "欢迎语音"
   *               genderCode:
   *                 type: string
   *                 enum: [FEMALE, MALE, FEMALE_AND_MALE]
   *                 description: 性别
   *                 example: "FEMALE"
   *               usageCode:
   *                 type: string
   *                 enum: [FLOW, GENERAL]
   *                 description: 用途
   *                 example: "GENERAL"
   *               femaleAudioUrl:
   *                 type: string
   *                 description: Female音频文件地址
   *                 example: "https://example.com/female.mp3"
   *               femaleAudioDuration:
   *                 type: integer
   *                 description: Female音频时长(秒)
   *                 example: 30
   *               maleAudioUrl:
   *                 type: string
   *                 description: Male音频文件地址
   *                 example: "https://example.com/male.mp3"
   *               maleAudioDuration:
   *                 type: integer
   *                 description: Male音频时长(秒)
   *                 example: 35
   *               translation:
   *                 type: integer
   *                 enum: [0, 1]
   *                 description: 是否进行翻译 1是 0否
   *                 example: 1
   *               femaleScript:
   *                 type: string
   *                 description: female 翻译脚本
   *                 example: "Hello world"
   *               maleScript:
   *                 type: string
   *                 description: male 翻译脚本
   *                 example: "Hello world"
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ENABLED, DISABLED]
   *                 description: 状态
   *                 example: "ENABLED"
   *     responses:
   *       200:
   *         description: 保存成功
   *       400:
   *         description: 参数错误
   *       404:
   *         description: 记录不存在（修改时）
   *       500:
   *         description: 服务器错误
   */
  async save(req, res) {
    try {
      const { id, ...data } = req.body;

      let result;
      if (id) {
        // 修改操作
        result = await this.soundService.update(id, data);
        if (result.success) {
          return res.success({ id }, '修改音频资源成功');
        }
      } else {
        // 新增操作
        result = await this.soundService.create(data);
        if (result.success) {
          return res.success({ id: result.insertId }, '新增音频资源成功');
        }
      }

      // 处理错误
      const statusCode = result.errCode === 'RECORD_NOT_FOUND' ? 404 : 400;
      return res.error(result.errCode, result.errMessage, statusCode);

    } catch (error) {
      this.logger.error('保存音频资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存音频资源失败', 500);
    }
  }

  /**
   * @swagger
   * /sound/detail/{id}:
   *   get:
   *     tags: [Sound]
   *     summary: 通过ID查询音频资源详情
   *     description: 根据ID获取单个音频资源的详细信息
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: 音频资源ID
   *         example: 123
   *     responses:
   *       200:
   *         description: 查询成功
   *       400:
   *         description: 参数错误
   *       404:
   *         description: 音频资源不存在
   *       500:
   *         description: 服务器错误
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.error('INVALID_PARAMETERS', 'ID参数无效', 400);
      }

      const result = await this.soundService.getById(parseInt(id));

      if (result.success) {
        return res.success(result.data, '查询音频资源成功');
      } else {
        const statusCode = result.errCode === 'RECORD_NOT_FOUND' ? 404 : 400;
        return res.error(result.errCode, result.errMessage, statusCode);
      }
    } catch (error) {
      this.logger.error('查询音频资源详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '查询音频资源失败', 500);
    }
  }

  /**
   * @swagger
   * /sound/page:
   *   get:
   *     tags: [Sound]
   *     summary: 分页查询音频资源列表
   *     description: 分页获取音频资源列表，支持多种搜索和筛选功能
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: keywords
   *         schema:
   *           type: string
   *         description: 关键词搜索
   *         example: "欢迎"
   *       - in: query
   *         name: statusList
   *         schema:
   *           type: string
   *         description: 状态筛选，多个用逗号分隔
   *         example: "ENABLED,DRAFT"
   *       - in: query
   *         name: genderCodeList
   *         schema:
   *           type: string
   *         description: 性别筛选，多个用逗号分隔
   *         example: "FEMALE,MALE"
   *       - in: query
   *         name: usageCodeList
   *         schema:
   *           type: string
   *         description: 用途筛选，多个用逗号分隔
   *         example: "FLOW,GENERAL"
   *       - in: query
   *         name: pageIndex
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码（从1开始）
   *         example: 1
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: 每页数量（最大100）
   *         example: 10
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           default: id
   *         description: 排序字段
   *         example: "createTime"
   *       - in: query
   *         name: orderDirection
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: 排序方向
   *         example: "DESC"
   *     responses:
   *       200:
   *         description: 查询成功
   *       400:
   *         description: 参数错误
   *       500:
   *         description: 服务器错误
   */
  async getPage(req, res) {
    try {
      const result = await this.soundService.getList(req.query);

      if (result.success) {
        return res.json(result);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('查询音频资源列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '查询音频资源列表失败', 500);
    }
  }

  /**
   * @swagger
   * /sound/enable:
   *   post:
   *     tags: [Sound]
   *     summary: 批量启用音频资源
   *     description: 批量启用指定的音频资源，将状态设置为 ENABLED
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idList
   *             properties:
   *               idList:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 要启用的音频资源ID数组
   *                 example: [123, 124, 125]
   *                 minItems: 1
   *     responses:
   *       200:
   *         description: 批量启用成功
   *       400:
   *         description: 参数错误
   *       500:
   *         description: 服务器错误
   */
  async enable(req, res) {
    try {
      const { idList } = req.body;

      if (!idList || !Array.isArray(idList) || idList.length === 0) {
        return res.error('INVALID_PARAMETERS', 'idList不能为空', 400);
      }

      const result = await this.soundService.batchUpdateStatus(idList, 'ENABLED');

      if (result.success) {
        return res.success({
          successCount: result.affectedRows,
          failedIds: []
        }, `批量启用音频资源成功，共启用${result.affectedRows}个`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量启用音频资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量启用音频资源失败', 500);
    }
  }

  /**
   * @swagger
   * /sound/disable:
   *   post:
   *     tags: [Sound]
   *     summary: 批量禁用音频资源
   *     description: 批量禁用指定的音频资源，将状态设置为 DISABLED
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idList
   *             properties:
   *               idList:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 要禁用的音频资源ID数组
   *                 example: [123, 124, 125]
   *                 minItems: 1
   *     responses:
   *       200:
   *         description: 批量禁用成功
   *       400:
   *         description: 参数错误
   *       500:
   *         description: 服务器错误
   */
  async disable(req, res) {
    try {
      const { idList } = req.body;

      if (!idList || !Array.isArray(idList) || idList.length === 0) {
        return res.error('INVALID_PARAMETERS', 'idList不能为空', 400);
      }

      const result = await this.soundService.batchUpdateStatus(idList, 'DISABLED');

      if (result.success) {
        return res.success({
          successCount: result.affectedRows,
          failedIds: []
        }, `批量禁用音频资源成功，共禁用${result.affectedRows}个`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量禁用音频资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量禁用音频资源失败', 500);
    }
  }

  /**
   * @swagger
   * /sound/del:
   *   post:
   *     tags: [Sound]
   *     summary: 批量删除音频资源（逻辑删除）
   *     description: 批量删除指定的音频资源，使用逻辑删除方式
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idList
   *             properties:
   *               idList:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 要删除的音频资源ID数组
   *                 example: [123, 124, 125]
   *                 minItems: 1
   *     responses:
   *       200:
   *         description: 批量删除成功
   *       400:
   *         description: 参数错误
   *       500:
   *         description: 服务器错误
   */
  async del(req, res) {
    try {
      const { idList } = req.body;

      if (!idList || !Array.isArray(idList) || idList.length === 0) {
        return res.error('INVALID_PARAMETERS', 'idList不能为空', 400);
      }

      const result = await this.soundService.batchDelete(idList);

      if (result.success) {
        return res.success({
          successCount: result.deletedCount,
          failedIds: []
        }, `批量删除音频资源成功，共删除${result.deletedCount}个`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量删除音频资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量删除音频资源失败', 500);
    }
  }
}

module.exports = SoundController;
