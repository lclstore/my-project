const express = require('express');
const { sendSuccess, sendError } = require('../utils/response');
const { ERROR_CODES } = require('../utils/response');
const {
    BusinessHelper,
    query
} = require('../config/database');
const { validateApiData } = require('../utils/validator');
const { batchLogicalDelete } = require('../utils/commonHelper');


const router = express.Router();

/**
 * @swagger
 * /api/sound/save:
 *   post:
 *     summary: 保存音频资源
 *     description: 新增或修改音频资源记录（有id为修改，无id为新增）
 *     tags: [Sound]
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
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "保存音频资源成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 音频资源不存在（修改时）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/save', async (req, res) => {
    try {
        const {
            id,
            name,
            genderCode,
            usageCode,
            femaleAudioUrl,
            femaleAudioDuration,
            maleAudioUrl,
            maleAudioDuration,
            translation,
            femaleScript,
            maleScript,
            status
        } = req.body;

        // 准备数据
        const soundData = {
            name,
            genderCode,
            usageCode,
            femaleAudioUrl: femaleAudioUrl || null,
            femaleAudioDuration: femaleAudioDuration || null,
            maleAudioUrl: maleAudioUrl || null,
            maleAudioDuration: maleAudioDuration || null,
            translation,
            femaleScript: femaleScript || null,
            maleScript: maleScript || null,
            status
        };



        // 根据状态选择验证规则
        let validationKey = 'sound';
        if (soundData.status === 'DRAFT') {
            validationKey = 'name';  // 草稿状态只验证必要字段
        }

        // 使用validator库进行参数验证
        const validationResult = validateApiData(validationKey, soundData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        // 先用 name 查询数据库，检查是否有记录（过滤逻辑删除的数据）
        const existingNameRecords = await query('SELECT id, name FROM sound WHERE name = ? AND is_deleted = 0', [name]);

        if (id) {
            // 修改操作：如果存在同名记录且不是当前记录，则不允许修改
            const conflictRecord = existingNameRecords.find(record => record.id !== parseInt(id));
            if (conflictRecord) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'name已存在，请使用其他name', 200);
            }
        } else {
            // 新增操作：如果存在同名记录，则不允许新增
            if (existingNameRecords.length > 0) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'name已存在，请使用其他name', 200);
            }
        }

        let result;

        if (id) {
            // 修改操作
            if (isNaN(parseInt(id))) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'ID参数无效', 400);
            }

            // 检查记录是否存在（过滤逻辑删除的数据）
            const existingRecord = await query('SELECT id FROM sound WHERE id = ? AND is_deleted = 0', [parseInt(id)]);
            if (existingRecord.length === 0) {
                return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, '音频资源不存在', 404);
            }

            // 使用BusinessHelper更新数据
            result = await BusinessHelper.updateWithValidation(
                'sound',
                parseInt(id),
                soundData,
                [],
                'sound'
            );

            if (result.success) {
                sendSuccess(res, { id: parseInt(id) }, '修改音频资源成功');
            } else {
                sendError(res, result.error, result.message, result.statusCode);
            }
        } else {
            // 新增操作
            result = await BusinessHelper.insertWithValidation(
                'sound',
                soundData
            );

            if (result.success) {
                sendSuccess(res, { id: result.insertId }, '新增音频资源成功');
            } else {
                sendError(res, result.error, result.message, result.statusCode);
            }
        }

    } catch (error) {
        console.error('保存音频资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '保存音频资源失败', 500);
    }
});

/**
 * @swagger
 * /api/sound/del:
 *   post:
 *     summary: 批量删除音频资源
 *     description: 根据ID列表批量删除音频资源
 *     tags: [Sound]
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
 *                 description: 要删除的音频资源ID列表
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 删除成功
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
 *                     deletedCount:
 *                       type: integer
 *                       example: 3
 *                     failedIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: []
 *                 message:
 *                   type: string
 *                   example: "批量删除音频资源成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/del', async (req, res) => {
    try {
        const { idList } = req.body;

        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList参数无效，必须是非空数组', 400);
        }

        // 验证所有ID都是有效的数字
        const validIds = [];
        const invalidIds = [];

        idList.forEach(id => {
            if (id && !isNaN(parseInt(id))) {
                validIds.push(parseInt(id));
            } else {
                invalidIds.push(id);
            }
        });

        if (invalidIds.length > 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, `无效的ID: ${invalidIds.join(', ')}`, 400);
        }

        // 使用逻辑删除
        const result = await batchLogicalDelete('sound', validIds);

        // 返回结果，包含删除的数据信息（供中间件记录日志使用）
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData // 包含删除的数据信息
        }, result.message);

    } catch (error) {
        console.error('批量删除音频资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量删除音频资源失败', 500);
    }
});

/**
 * @swagger
 * /api/sound/enable:
 *   post:
 *     summary: 批量启用音频资源
 *     description: 根据ID列表批量启用音频资源
 *     tags: [Sound]
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
 *                 description: 要启用的音频资源ID列表
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 启用成功
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
 *                     updatedCount:
 *                       type: integer
 *                       example: 3
 *                     failedIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: []
 *                 message:
 *                   type: string
 *                   example: "批量启用音频资源成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/enable', async (req, res) => {
    try {
        const { idList } = req.body;

        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList参数无效，必须是非空数组', 400);
        }

        // 验证所有ID都是有效的数字
        const validIds = [];
        const invalidIds = [];

        idList.forEach(id => {
            if (id && !isNaN(parseInt(id))) {
                validIds.push(parseInt(id));
            } else {
                invalidIds.push(id);
            }
        });

        if (invalidIds.length > 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, `无效的ID: ${invalidIds.join(', ')}`, 400);
        }

        // 检查哪些记录存在（过滤逻辑删除的数据）
        const placeholders = validIds.map(() => '?').join(',');
        const existingRecords = await query(`SELECT id FROM sound WHERE id IN (${placeholders}) AND is_deleted = 0`, validIds);
        const existingIds = existingRecords.map(record => record.id);
        const notFoundIds = validIds.filter(id => !existingIds.includes(id));

        if (existingIds.length === 0) {
            return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, '没有找到要启用的音频资源', 404);
        }

        // 批量启用存在的记录
        const updateResult = await query(
            `UPDATE sound SET status = 'ENABLED' WHERE id IN (${existingIds.map(() => '?').join(',')})`,
            existingIds
        );

        const result = {
            updatedCount: updateResult.affectedRows,
            failedIds: notFoundIds
        };

        let message = `成功启用 ${result.updatedCount} 个音频资源`;
        if (notFoundIds.length > 0) {
            message += `，${notFoundIds.length} 个ID不存在: ${notFoundIds.join(', ')}`;
        }

        sendSuccess(res, result, message);

    } catch (error) {
        console.error('批量启用音频资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量启用音频资源失败', 500);
    }
});

/**
 * @swagger
 * /api/sound/disable:
 *   post:
 *     summary: 批量禁用音频资源
 *     description: 根据ID列表批量禁用音频资源
 *     tags: [Sound]
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
 *                 description: 要禁用的音频资源ID列表
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 禁用成功
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
 *                     updatedCount:
 *                       type: integer
 *                       example: 3
 *                     failedIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: []
 *                 message:
 *                   type: string
 *                   example: "批量禁用音频资源成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/disable', async (req, res) => {
    try {
        const { idList } = req.body;

        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList参数无效，必须是非空数组', 400);
        }

        // 验证所有ID都是有效的数字
        const validIds = [];
        const invalidIds = [];

        idList.forEach(id => {
            if (id && !isNaN(parseInt(id))) {
                validIds.push(parseInt(id));
            } else {
                invalidIds.push(id);
            }
        });

        if (invalidIds.length > 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, `无效的ID: ${invalidIds.join(', ')}`, 400);
        }

        // 检查哪些记录存在（过滤逻辑删除的数据）
        const placeholders = validIds.map(() => '?').join(',');
        const existingRecords = await query(`SELECT id FROM sound WHERE id IN (${placeholders}) AND is_deleted = 0`, validIds);
        const existingIds = existingRecords.map(record => record.id);
        const notFoundIds = validIds.filter(id => !existingIds.includes(id));

        if (existingIds.length === 0) {
            return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, '没有找到要禁用的音频资源', 404);
        }

        // 批量禁用存在的记录
        const updateResult = await query(
            `UPDATE sound SET status = 'DISABLED' WHERE id IN (${existingIds.map(() => '?').join(',')})`,
            existingIds
        );

        const result = {
            updatedCount: updateResult.affectedRows,
            failedIds: notFoundIds
        };

        let message = `成功禁用 ${result.updatedCount} 个音频资源`;
        if (notFoundIds.length > 0) {
            message += `，${notFoundIds.length} 个ID不存在: ${notFoundIds.join(', ')}`;
        }

        sendSuccess(res, result, message);

    } catch (error) {
        console.error('批量禁用音频资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量禁用音频资源失败', 500);
    }
});

/**
 * @swagger
 * /api/sound/page:
 *   get:
 *     summary: 分页查询音频资源列表
 *     description: 分页获取音频资源列表，支持关键词搜索
 *     tags: [Sound]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: 每页数量
 *         example: 10
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码（从1开始）
 *         example: 1
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: 关键词搜索（支持ID全匹配和name模糊匹配）
 *         example: "欢迎"
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: "id"
 *         description: 排序字段
 *         example: "id"
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: "DESC"
 *         description: 排序方向
 *         example: "DESC"
 *       - in: query
 *         name: statusList
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [DRAFT, ENABLED, DISABLED]
 *         description: 状态筛选列表
 *         example: ["ENABLED", "DISABLED"]
 *       - in: query
 *         name: genderCodeList
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [FEMALE, MALE, FEMALE_AND_MALE]
 *         description: 性别筛选列表
 *         example: ["FEMALE", "MALE"]
 *       - in: query
 *         name: usageCodeList
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [FLOW, GENERAL]
 *         description: 用途筛选列表
 *         example: ["FLOW"]
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
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "欢迎语音"
 *                       genderCode:
 *                         type: string
 *                         example: "FEMALE"
 *                       usageCode:
 *                         type: string
 *                         example: "GENERAL"
 *                       status:
 *                         type: string
 *                         example: "ENABLED"
 *                       createTime:
 *                         type: string
 *                         example: "2025-08-14 10:30:45"
 *                 pageIndex:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 10
 *                 totalCount:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 notEmpty:
 *                   type: boolean
 *                   example: true
 *                 empty:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/page', async (req, res) => {
    try {
        const { keywords, orderBy, orderDirection, statusList, genderCodeList, usageCodeList } = req.query;
        const { toSnakeCase } = require('../utils/fieldConverter');
        const { QueryConditionBuilder, SOUND_ENUMS } = require('../utils/enumHelper');
        const { validateApiData } = require('../utils/validator');

        // 使用公共参数处理工具
        const { parseArrayParam, parsePaginationParams, parseSortParams } = require('../utils/paramHelper');

        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        if (genderCodeList) queryParams.genderCodeList = parseArrayParam(genderCodeList);
        if (usageCodeList) queryParams.usageCodeList = parseArrayParam(usageCodeList);

        if (Object.keys(queryParams).length > 0) {
            const validation = validateApiData(queryParams, 'sound.query');
            if (!validation.valid) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validation.error, 400);
            }
        }

        // 转换排序字段名：前端字段名(camelCase) -> 数据库字段名(snake_case)
        const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';

        // 构建查询条件
        const conditionBuilder = new QueryConditionBuilder();

        // 添加关键词搜索条件
        if (keywords && keywords.trim()) {
            const trimmedKeywords = keywords.trim();

            // 检查是否为纯数字（ID精确匹配）
            if (/^\d+$/.test(trimmedKeywords)) {
                // 先按ID精确匹配
                conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));

                // 检查ID匹配是否有结果，如果没有则按名称模糊搜索（过滤逻辑删除的数据）
                const idCheckSql = `SELECT COUNT(*) as count FROM sound WHERE id = ? AND is_deleted = 0`;
                const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);

                if (idCheckResult[0].count === 0) {
                    // ID没有匹配结果，重置条件构建器，改为名称模糊搜索
                    conditionBuilder.reset();

                    // 重新添加其他筛选条件
                    if (queryParams.statusList && queryParams.statusList.length > 0) {
                        conditionBuilder.addArrayCondition('status', queryParams.statusList, SOUND_ENUMS.STATUS);
                    }
                    if (queryParams.genderCodeList && queryParams.genderCodeList.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('genderCode'), queryParams.genderCodeList, SOUND_ENUMS.GENDER);
                    }
                    if (queryParams.usageCodeList && queryParams.usageCodeList.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('usageCode'), queryParams.usageCodeList, SOUND_ENUMS.USAGE);
                    }

                    // 添加名称模糊搜索
                    conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
                }
            } else {
                // 非纯数字（包含文本或混合），按名称模糊搜索
                conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
            }
        }

        // 添加状态筛选条件
        if (queryParams.statusList && queryParams.statusList.length > 0) {
            conditionBuilder.addArrayCondition('status', queryParams.statusList, SOUND_ENUMS.STATUS);
        }

        // 添加性别筛选条件
        if (queryParams.genderCodeList && queryParams.genderCodeList.length > 0) {
            conditionBuilder.addArrayCondition(toSnakeCase('genderCode'), queryParams.genderCodeList, SOUND_ENUMS.GENDER);
        }

        // 添加用途筛选条件
        if (queryParams.usageCodeList && queryParams.usageCodeList.length > 0) {
            conditionBuilder.addArrayCondition(toSnakeCase('usageCode'), queryParams.usageCodeList, SOUND_ENUMS.USAGE);
        }

        // 构建最终查询条件
        const { where, params } = conditionBuilder.build();

        // 构建查询选项，添加逻辑删除过滤
        const options = {
            orderBy: `${dbOrderBy} ${orderDirection || 'DESC'}`
        };

        // 添加逻辑删除过滤条件
        const isDeletedCondition = 'is_deleted = 0';

        if (where) {
            options.where = `(${where}) AND ${isDeletedCondition}`;
            options.whereParams = params;
        } else {
            options.where = isDeletedCondition;
            options.whereParams = [];
        }

        // 使用公共业务逻辑处理分页查询
        const result = await BusinessHelper.paginateWithValidation(
            'sound',
            req,
            options
        );

        if (result.success) {
            res.json(result);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('获取音频资源列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '获取音频资源列表失败', 500);
    }
});

/**
 * @swagger
 * /api/sound/{id}:
 *   get:
 *     summary: 通过ID查询音频资源
 *     description: 根据ID获取音频资源详细信息
 *     tags: [Sound]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 音频资源ID
 *         example: 1
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
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "欢迎语音"
 *                     genderCode:
 *                       type: string
 *                       example: "FEMALE"
 *                     usageCode:
 *                       type: string
 *                       example: "GENERAL"
 *                     femaleAudioUrl:
 *                       type: string
 *                       example: "https://example.com/female.mp3"
 *                     femaleAudioDuration:
 *                       type: integer
 *                       example: 30
 *                     maleAudioUrl:
 *                       type: string
 *                       example: "https://example.com/male.mp3"
 *                     maleAudioDuration:
 *                       type: integer
 *                       example: 35
 *                     translation:
 *                       type: integer
 *                       example: 1
 *                     femaleScript:
 *                       type: string
 *                       example: "Hello world"
 *                     maleScript:
 *                       type: string
 *                       example: "Hello world"
 *                     status:
 *                       type: string
 *                       example: "ENABLED"
 *                     createTime:
 *                       type: string
 *                       example: "2025-08-14 10:30:45"
 *                     updateTime:
 *                       type: string
 *                       example: "2025-08-14 10:30:45"
 *                 message:
 *                   type: string
 *                   example: "获取音频资源成功"
 *       404:
 *         description: 音频资源不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'ID参数无效', 400);
        }

        // 查询音频资源详细信息（过滤逻辑删除的数据）
        const { convertToFrontendFormat } = require('../utils/fieldConverter');
        const soundRecord = await query('SELECT * FROM sound WHERE id = ? AND is_deleted = 0', [parseInt(id)]);

        if (soundRecord.length === 0) {
            return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, '音频资源不存在', 404);
        }

        // 转换字段格式
        const convertedData = convertToFrontendFormat(soundRecord[0]);

        sendSuccess(res, convertedData, '获取音频资源成功');

    } catch (error) {
        console.error('查询音频资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询音频资源失败', 500);
    }
});

module.exports = router;
