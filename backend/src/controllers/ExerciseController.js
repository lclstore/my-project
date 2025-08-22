/**
 * 动作资源控制器
 * 处理动作资源相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const ExerciseService = require('../services/ExerciseService');

class ExerciseController extends BaseController {
  constructor() {
    const exerciseService = new ExerciseService();
    super({
      service: exerciseService,
      entityName: '动作资源'
    });

    this.exerciseService = exerciseService;
  }

  /**
   * @swagger
   * /exercise/save:
   *   post:
   *     tags: [Exercise]
   *     summary: 保存动作资源（新增/修改）
   *     description: |
   *       新增或修改动作资源信息。支持草稿状态的灵活保存：
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
   *                 description: 动作资源ID（修改时必填）
   *                 example: 123
   *               name:
   *                 type: string
   *                 description: 动作名称
   *                 example: "标准俯卧撑"
   *               coverImgUrl:
   *                 type: string
   *                 format: uri
   *                 description: 封面图URL（完整状态必填）
   *                 example: "https://example.com/cover.jpg"
   *               met:
   *                 type: integer
   *                 description: MET值（完整状态必填）
   *                 example: 8
   *               structureTypeCode:
   *                 type: string
   *                 enum: [WARM_UP, MAIN, COOL_DOWN]
   *                 description: 结构类型（完整状态必填）
   *                 example: "MAIN"
   *               genderCode:
   *                 type: string
   *                 enum: [FEMALE, MALE]
   *                 description: 性别（完整状态必填）
   *                 example: "MALE"
   *               difficultyCode:
   *                 type: string
   *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
   *                 description: 难度等级（完整状态必填）
   *                 example: "INTERMEDIATE"
   *               equipmentCode:
   *                 type: string
   *                 enum: [NO_EQUIPMENT, CHAIR]
   *                 description: 所需器械（完整状态必填）
   *                 example: "NO_EQUIPMENT"
   *               positionCode:
   *                 type: string
   *                 enum: [STANDING, SEATED]
   *                 description: 动作姿势（完整状态必填）
   *                 example: "STANDING"
   *               injuredCodes:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE]
   *                 description: 受伤类型限制数组
   *                 example: ["NONE"]
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ENABLED, DISABLED]
   *                 description: 状态
   *                 example: "ENABLED"
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
   *                       description: 动作资源ID
   *                       example: 123
   *                 message:
   *                   type: string
   *                   example: "新增动作资源成功"
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
        result = await this.exerciseService.update(id, data);
        if (result.success) {
          return res.success({ id }, '修改动作资源成功');
        }
      } else {
        // 新增操作
        result = await this.exerciseService.create(data);
        if (result.success) {
          return res.success({ id: result.insertId }, '新增动作资源成功');
        }
      }

      // 处理错误
      const statusCode = result.errCode === 'RECORD_NOT_FOUND' ? 404 : 400;
      return res.error(result.errCode, result.errMessage, statusCode);

    } catch (error) {
      this.logger.error('保存动作资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存动作资源失败', 500);
    }
  }

  /**
   * @swagger
   * /exercise/detail/{id}:
   *   get:
   *     tags: [Exercise]
   *     summary: 通过ID查询动作资源详情
   *     description: 根据ID获取单个动作资源的详细信息
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: 动作资源ID
   *         example: 123
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
   *                   type: object
   *                   description: 动作资源详情
   *                 message:
   *                   type: string
   *                   example: "查询动作资源成功"
   *       400:
   *         description: 参数错误
   *       404:
   *         description: 动作资源不存在
   *       500:
   *         description: 服务器错误
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.error('INVALID_PARAMETERS', 'ID参数无效', 400);
      }

      const result = await this.exerciseService.getById(parseInt(id));

      if (result.success) {
        return res.success(result.data, '查询动作资源成功');
      } else {
        const statusCode = result.errCode === 'RECORD_NOT_FOUND' ? 404 : 400;
        return res.error(result.errCode, result.errMessage, statusCode);
      }
    } catch (error) {
      this.logger.error('查询动作资源详情失败:', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', '查询动作资源失败', 500);
    }
  }

  /**
   * @swagger
   * /exercise/page:
   *   get:
   *     tags: [Exercise]
   *     summary: 分页查询动作资源列表
   *     description: |
   *       分页获取动作资源列表，支持多种搜索和筛选功能：
   *       - 智能搜索：纯数字关键词优先按ID精确匹配，无结果则回退到名称模糊搜索
   *       - 多条件筛选：支持按状态、结构类型、性别、难度、器械、部位等多维度筛选
   *       - 排序和分页：支持自定义排序字段和方向
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: keywords
   *         schema:
   *           type: string
   *         description: 关键词搜索
   *         example: "俯卧撑"
   *       - in: query
   *         name: statusList
   *         schema:
   *           type: string
   *         description: 状态筛选，多个用逗号分隔
   *         example: "ENABLED,DRAFT"
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
      const result = await this.exerciseService.getList(req.query);

      if (result.success) {
        return res.json(result);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('查询动作资源列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '查询动作资源列表失败', 500);
    }
  }

  /**
   * @swagger
   * /exercise/enable:
   *   post:
   *     tags: [Exercise]
   *     summary: 批量启用动作资源
   *     description: 批量启用指定的动作资源，将状态设置为 ENABLED
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
   *                 description: 要启用的动作资源ID数组
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

      const result = await this.exerciseService.batchUpdateStatus(idList, 'ENABLED');

      if (result.success) {
        return res.success({
          successCount: result.affectedRows,
          failedIds: []
        }, `批量启用动作资源成功，共启用${result.affectedRows}个`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量启用动作资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量启用动作资源失败', 500);
    }
  }

  /**
   * @swagger
   * /exercise/disable:
   *   post:
   *     tags: [Exercise]
   *     summary: 批量禁用动作资源
   *     description: 批量禁用指定的动作资源，将状态设置为 DISABLED
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
   *                 description: 要禁用的动作资源ID数组
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

      const result = await this.exerciseService.batchUpdateStatus(idList, 'DISABLED');

      if (result.success) {
        return res.success({
          successCount: result.affectedRows,
          failedIds: []
        }, `批量禁用动作资源成功，共禁用${result.affectedRows}个`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量禁用动作资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量禁用动作资源失败', 500);
    }
  }

  /**
   * @swagger
   * /exercise/del:
   *   post:
   *     tags: [Exercise]
   *     summary: 批量删除动作资源（逻辑删除）
   *     description: |
   *       批量删除指定的动作资源，使用逻辑删除方式。
   *       将 is_deleted 字段设置为 1，数据仍保留在数据库中。
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
   *                 description: 要删除的动作资源ID数组
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

      const result = await this.exerciseService.batchDelete(idList);

      if (result.success) {
        return res.success({
          successCount: result.deletedCount,
          failedIds: []
        }, `批量删除动作资源成功，共删除${result.deletedCount}个`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量删除动作资源失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量删除动作资源失败', 500);
    }
  }
}

module.exports = ExerciseController;
