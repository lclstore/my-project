/**
 * Category 分类管理接口
 */

const express = require('express');
const router = express.Router();
const { BusinessHelper, DatabaseHelper, query, transaction } = require('../config/database');
const { sendSuccess, sendError, ERROR_CODES } = require('../utils/response');
const { convertToFrontendFormat, toSnakeCase } = require('../utils/fieldConverter');
const { parseArrayParam } = require('../utils/paramHelper');
const { QueryConditionBuilder } = require('../utils/enumHelper');
const { validateApiData } = require('../utils/validator');
const { sanitizeParams, batchUpdateStatus, batchLogicalDelete, batchUpdateSort } = require('../utils/commonHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 分类名称
 *           example: "全身训练"
 *         coverImgUrl:
 *           type: string
 *           description: 封面图
 *           example: "https://example.com/cover.jpg"
 *         detailImgUrl:
 *           type: string
 *           description: 详情图
 *           example: "https://example.com/detail.jpg"
 *         description:
 *           type: string
 *           description: 描述
 *           example: "全身综合性训练分类"
 *         newStartTime:
 *           type: string
 *           format: date-time
 *           description: NEW 开始时间
 *           example: "2025-01-15T10:30:00Z"
 *         newEndTime:
 *           type: string
 *           format: date-time
 *           description: NEW 结束时间
 *           example: "2025-01-25T10:30:00Z"
 *         status:
 *           type: string
 *           enum: [DRAFT, ENABLED, DISABLED]
 *           description: 状态
 *           example: "ENABLED"
 *         createTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *           example: "2025-01-15T10:30:00Z"
 *         updateTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *           example: "2025-01-15T10:30:00Z"
 *     CategoryWithWorkouts:
 *       allOf:
 *         - $ref: '#/components/schemas/Category'
 *         - type: object
 *           properties:
 *             workoutList:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BizWorkoutPageRes'
 *               description: workout列表
 *     BizWorkoutPageRes:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: ID
 *         name:
 *           type: string
 *           description: workout名称
 *         description:
 *           type: string
 *           description: 描述
 *         premium:
 *           type: integer
 *           format: int32
 *           description: 是否需要订阅（0不需要 1需要）
 *         newStartTime:
 *           type: string
 *           format: date-time
 *           description: NEW 开始时间
 *         newEndTime:
 *           type: string
 *           format: date-time
 *           description: NEW 结束时间
 *         coverImgUrl:
 *           type: string
 *           description: 封面图
 *         detailImgUrl:
 *           type: string
 *           description: 详情图
 *         thumbnailImgUrl:
 *           type: string
 *           description: 缩略图
 *         completeImgUrl:
 *           type: string
 *           description: 完成图
 *         genderCode:
 *           type: string
 *           enum: [FEMALE, MALE]
 *           description: 性别code
 *         difficultyCode:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *           description: 难度code
 *         positionCode:
 *           type: string
 *           enum: [STANDING, SEATED]
 *           description: 部位code
 *         injuredCodes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE]
 *           description: 受伤类型code
 *         calorie:
 *           type: integer
 *           format: int32
 *           description: 卡路里
 *         duration:
 *           type: integer
 *           format: int32
 *           description: 时长
 *         status:
 *           type: string
 *           enum: [DRAFT, ENABLED, DISABLED]
 *           description: 状态
 *         fileStatus:
 *           type: string
 *           enum: [WAITING, PROCESSING, SUCCESSFUL, FAILED]
 *           description: 任务状态
 *         audioJsonLanguages:
 *           type: array
 *           items:
 *             type: string
 *           description: 已生成的音频语种
 *         groupCode:
 *           type: string
 *           enum: [GROUPA, GROUPB, GROUPC, GROUPD, GROUPE, GROUPF, GROUPG]
 *           description: group code
 *         showInPage:
 *           type: integer
 *           format: int32
 *           description: 是否要在app的category页面展示
 */

/**
 * @swagger
 * /api/category/save:
 *   post:
 *     summary: 保存category（新增或修改）
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 format: int64
 *                 description: ID（修改时必填，新增时不填）
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: 分类名称
 *                 example: "全身训练"
 *               coverImgUrl:
 *                 type: string
 *                 description: 封面图
 *                 example: "https://example.com/cover.jpg"
 *               detailImgUrl:
 *                 type: string
 *                 description: 详情图
 *                 example: "https://example.com/detail.jpg"
 *               description:
 *                 type: string
 *                 description: 描述
 *                 example: "全身综合性训练分类"
 *               newStartTime:
 *                 type: string
 *                 format: date-time
 *                 description: NEW 开始时间
 *                 example: "2025-01-15T10:30:00Z"
 *               newEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: NEW 结束时间
 *                 example: "2025-01-25T10:30:00Z"
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ENABLED, DISABLED]
 *                 description: 状态
 *                 example: "ENABLED"
 *               workoutList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: workout ID列表
 *                 example: [1, 2, 3]
 *             required:
 *               - name
 *             example:
 *               name: "全身训练"
 *               description: "全身综合性训练分类"
 *               status: "ENABLED"
 *               workoutList: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 保存成功
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
 *                           description: category ID
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *               message: "新增category成功"
 *               errCode: null
 *               errMessage: null
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/save', async (req, res) => {
    try {
        const { id, name, coverImgUrl, detailImgUrl, description, newStartTime, newEndTime, status, workoutList } = req.body;

        // 构建category数据对象
        const categoryData = {
            name,
            coverImgUrl,
            detailImgUrl,
            description,
            newStartTime,
            newEndTime,
            status: status || 'DRAFT'
        };

        // 使用validator进行参数验证
        const validationResult = validateApiData('category', categoryData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        let result;

        if (id) {
            // 修改操作
            if (isNaN(parseInt(id))) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'ID参数无效', 400);
            }

            // 检查记录是否存在
            const existingRecord = await query('SELECT id FROM category WHERE id = ? AND is_deleted = 0', [parseInt(id)]);
            if (existingRecord.length === 0) {
                return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, 'category不存在', 404);
            }

            // 使用BusinessHelper更新数据
            result = await BusinessHelper.updateWithValidation(
                'category',
                parseInt(id),
                categoryData,
                [],
                'category'
            );

            if (!result.success) {
                return sendError(res, result.error, result.message, result.statusCode);
            }

            // 处理workout关联数据
            if (workoutList !== undefined) {
                await transaction(async (connection) => {
                    // 删除原有的workout关联
                    await connection.execute('DELETE FROM category_workout WHERE category_id = ?', [parseInt(id)]);

                    // 保存新的workout关联数据
                    if (workoutList && Array.isArray(workoutList) && workoutList.length > 0) {
                        const workoutSql = 'INSERT INTO category_workout (category_id, workout_id, sort_order) VALUES (?, ?, ?)';
                        for (let i = 0; i < workoutList.length; i++) {
                            await connection.execute(workoutSql, sanitizeParams([parseInt(id), workoutList[i], i + 1]));
                        }
                    }
                });
            }

            sendSuccess(res, { id: parseInt(id) }, '修改category成功');
        } else {
            // 新增操作 - 默认设置 is_deleted = 0
            const insertData = {
                ...categoryData,
                is_deleted: 0
            };

            result = await BusinessHelper.insertWithValidation(
                'category',
                insertData,
                [],
                'category'
            );

            if (!result.success) {
                return sendError(res, result.error, result.message, result.statusCode);
            }

            const categoryId = result.insertId;

            // 保存workout关联数据
            if (workoutList && Array.isArray(workoutList) && workoutList.length > 0) {
                await transaction(async (connection) => {
                    const workoutSql = 'INSERT INTO category_workout (category_id, workout_id, sort_order) VALUES (?, ?, ?)';
                    for (let i = 0; i < workoutList.length; i++) {
                        await connection.execute(workoutSql, sanitizeParams([categoryId, workoutList[i], i + 1]));
                    }
                });
            }

            sendSuccess(res, { id: categoryId }, '新增category成功');
        }

    } catch (error) {
        console.error('保存category错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '保存category失败', 500);
    }
});

/**
 * @swagger
 * /api/category/detail/{id}:
 *   get:
 *     summary: 查询category详情
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CategoryWithWorkouts'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 name: "全身训练"
 *                 description: "全身综合性训练分类"
 *                 status: "ENABLED"
 *                 workoutList: []
 *               message: "查询category详情成功"
 *               errCode: null
 *               errMessage: null
 *       404:
 *         description: category不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        if (isNaN(categoryId) || categoryId <= 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'category ID无效', 400);
        }

        // 使用BusinessHelper查询category基本信息
        const categoryResult = await BusinessHelper.findByIdWithValidation('category', categoryId);

        if (!categoryResult.success) {
            return sendError(res, ERROR_CODES.NOT_FOUND, 'category不存在', 404);
        }

        const categoryData = categoryResult.data;

        // 查询关联的workout列表（包含完整的workout信息）
        const workoutSql = `
            SELECT w.id, w.name, w.description, w.premium, w.new_start_time, w.new_end_time,
                   w.cover_img_url, w.detail_img_url, w.thumbnail_img_url, w.complete_img_url,
                   w.gender_code, w.difficulty_code, w.position_code, w.calorie, w.duration,
                   w.status, w.file_status, w.audio_json_languages,
                   cw.sort_order
            FROM category_workout cw
            INNER JOIN workout w ON cw.workout_id = w.id AND w.is_deleted = 0
            WHERE cw.category_id = ?
            ORDER BY cw.sort_order, w.id
        `;
        const workoutResult = await query(workoutSql, [categoryId]);

        // 批量查询workout的受伤类型
        const workoutIds = workoutResult.map(item => item.id);
        let injuredMap = new Map();

        if (workoutIds.length > 0) {
            const injuredSql = `
                SELECT workout_id, injured_code
                FROM workout_injured
                WHERE workout_id IN (${workoutIds.map(() => '?').join(',')})
            `;
            const injuredResult = await query(injuredSql, workoutIds);

            injuredResult.forEach(item => {
                if (!injuredMap.has(item.workout_id)) {
                    injuredMap.set(item.workout_id, []);
                }
                injuredMap.get(item.workout_id).push(item.injured_code);
            });
        }

        // 为每个workout添加受伤类型数据并进行字段转换
        const workoutList = workoutResult.map(item => {
            item.injuredCodes = injuredMap.get(item.id) || [];
            return convertToFrontendFormat(item);
        });

        categoryData.workoutList = workoutList;

        sendSuccess(res, categoryData, '查询category详情成功');

    } catch (error) {
        console.error('查询category详情错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询category详情失败', 500);
    }
});

/**
 * @swagger
 * /api/category/list:
 *   get:
 *     summary: 查询category列表（返回所有数据）
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码（从1开始）
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页数量
 *         example: 10
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: |
 *           关键词搜索，支持智能匹配：
 *           - 纯数字：优先ID精确匹配，无结果则名称模糊搜索
 *           - 文本：名称模糊搜索
 *         example: "全身训练"
 *       - in: query
 *         name: statusList
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [DRAFT, ENABLED, DISABLED]
 *         description: 状态筛选，可用值:DRAFT,ENABLED,DISABLED，示例值(DRAFT)
 *         example: ["DRAFT"]
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *         description: 排序字段
 *         example: "createTime"
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向
 *         example: "desc"
 *     responses:
 *       200:
 *         description: 查询成功
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
 *                         data:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Category'
 *                         total:
 *                           type: integer
 *                           description: 总数量
 *                         pageIndex:
 *                           type: integer
 *                           description: 当前页码
 *                         pageSize:
 *                           type: integer
 *                           description: 每页数量
 *                         totalPages:
 *                           type: integer
 *                           description: 总页数
 *             example:
 *               success: true
 *               data:
 *                 data: []
 *                 total: 0
 *                 pageIndex: 1
 *                 pageSize: 10
 *                 totalPages: 0
 *               message: "查询category列表成功"
 *               errCode: null
 *               errMessage: null
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/list', async (req, res) => {
    try {
        const { keywords, statusList } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);

        // 验证参数
        if (Object.keys(queryParams).length > 0) {
            const validation = validateApiData('category.query', queryParams);
            if (!validation.valid) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validation.errors.join(', '), 400);
            }
        }

        // 构建查询条件
        const conditionBuilder = new QueryConditionBuilder();

        // 添加逻辑删除过滤条件
        conditionBuilder.addNumberCondition('is_deleted', 0);

        // 添加关键词搜索条件（智能搜索：纯数字先ID匹配，无结果则名称搜索）
        if (keywords && keywords.trim()) {
            const trimmedKeywords = keywords.trim();

            // 检查是否为纯数字（ID精确匹配）
            if (/^\d+$/.test(trimmedKeywords)) {
                // 先按ID精确匹配
                conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));

                // 检查ID匹配是否有结果，如果没有则按名称模糊搜索
                const idCheckSql = `SELECT COUNT(*) as count FROM category WHERE id = ? AND is_deleted = 0`;
                const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);

                if (idCheckResult[0].count === 0) {
                    // ID没有匹配结果，重置条件构建器，改为名称模糊搜索
                    conditionBuilder.reset();
                    conditionBuilder.addNumberCondition('is_deleted', 0);

                    // 重新添加其他筛选条件
                    if (queryParams.statusList && queryParams.statusList.length > 0) {
                        conditionBuilder.addArrayCondition('status', queryParams.statusList);
                    }

                    // 添加名称模糊搜索
                    conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
                }
            } else {
                // 非纯数字（包含文本或混合），按名称模糊搜索
                conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
            }
        }

        // 添加其他筛选条件（如果没有关键词搜索或关键词搜索为非纯数字）
        if (!keywords || !/^\d+$/.test(keywords.trim())) {
            if (queryParams.statusList && queryParams.statusList.length > 0) {
                conditionBuilder.addArrayCondition('status', queryParams.statusList);
            }
        }

        // 构建查询选项 - 查询所有数据（不分页）
        const { where, params } = conditionBuilder.build();
        const options = {
            orderBy: 'sort ASC, id ASC',  // 固定按sort字段升序排序
            excludeFields: ['is_deleted']  // 排除敏感字段
        };

        if (where) {
            options.where = where;
            options.whereParams = params;
        }

        // 使用DatabaseHelper查询所有数据（不分页）
        const result = await DatabaseHelper.select('category', options);

        if (!result.success) {
            return sendError(res, result.error, result.message, result.statusCode);
        }

        // 进行字段转换，将数据库字段转换为前端格式
        const processedData = result.data.map(item => convertToFrontendFormat(item));

        // 返回统一的列表结构
        sendSuccess(res, processedData, '查询category列表成功');

    } catch (error) {
        console.error('查询category列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询category列表失败', 500);
    }
});

/**
 * @swagger
 * /api/category/del:
 *   post:
 *     summary: 删除category（逻辑删除）
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   format: int64
 *                 description: category ID列表
 *                 example: [1, 2, 3]
 *             required:
 *               - idList
 *     responses:
 *       200:
 *         description: 删除成功
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
 *                         deletedCount:
 *                           type: integer
 *                           description: 删除数量
 *             example:
 *               success: true
 *               data:
 *                 deletedCount: 2
 *               message: "删除category成功"
 *               errCode: null
 *               errMessage: null
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/del', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchLogicalDelete('category', idList);
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData
        }, result.message);
    } catch (error) {
        console.error('删除category错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '删除category失败', 500);
    }
});

/**
 * @swagger
 * /api/category/enable:
 *   post:
 *     summary: 启用category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   format: int64
 *                 description: category ID列表
 *                 example: [1, 2, 3]
 *             required:
 *               - idList
 *     responses:
 *       200:
 *         description: 启用成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/enable', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchUpdateStatus('category', idList, 'ENABLED', '启用');
        sendSuccess(res, result, result.message);
    } catch (error) {
        console.error('启用category错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '启用category失败', 500);
    }
});

/**
 * @swagger
 * /api/category/disable:
 *   post:
 *     summary: 禁用category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   format: int64
 *                 description: category ID列表
 *                 example: [1, 2, 3]
 *             required:
 *               - idList
 *     responses:
 *       200:
 *         description: 禁用成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/disable', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchUpdateStatus('category', idList, 'DISABLED', '禁用');
        sendSuccess(res, result, result.message);
    } catch (error) {
        console.error('禁用category错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '禁用category失败', 500);
    }
});

/**
 * @swagger
 * /api/category/sort:
 *   post:
 *     summary: 排序category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   format: int64
 *                 description: 新的ID顺序列表
 *                 example: [10, 9, 8, 7, 5, 6, 4, 3, 2, 1]
 *             required:
 *               - idList
 *             example:
 *               idList: [10, 9, 8, 7, 5, 6, 4, 3, 2, 1]
 *     responses:
 *       200:
 *         description: 排序成功
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
 *                         updatedCount:
 *                           type: integer
 *                           description: 更新数量
 *             example:
 *               success: true
 *               data:
 *                 updatedCount: 10
 *               message: "category排序成功"
 *               errCode: null
 *               errMessage: null
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/sort', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchUpdateSort('category', idList);
        sendSuccess(res, {
            updatedCount: result.updatedCount
        }, result.message);
    } catch (error) {
        console.error('category排序错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || 'category排序失败', 500);
    }
});

module.exports = router;
