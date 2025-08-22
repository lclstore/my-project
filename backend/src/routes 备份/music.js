/**
 * Music 音乐管理接口
 */

const express = require('express');
const router = express.Router();
const { BusinessHelper, DatabaseHelper, query, transaction } = require('../config/database');
const { sendSuccess, sendError, ERROR_CODES } = require('../utils/response');
const { convertToFrontendFormat, toSnakeCase } = require('../utils/fieldConverter');
const { parseArrayParam } = require('../utils/paramHelper');
const { QueryConditionBuilder } = require('../utils/enumHelper');
const { validateApiData } = require('../utils/validator');
const { sanitizeParams, batchUpdateStatus, batchLogicalDelete } = require('../utils/commonHelper');
const { SimpleOpLogRecorder, getOperationUser } = require('../utils/opLogHelper');

/**
 * @swagger
 * /api/music/save:
 *   post:
 *     summary: 保存music
 *     tags: [Music]
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
 *                 description: music ID（更新时需要）
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
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/save', async (req, res) => {
    try {
        const { id, name, displayName, audioUrl, audioDuration, status } = req.body;

        // 基本参数验证
        if (!name || !displayName || !audioDuration || !status) {
            return sendError(res, 'INVALID_PARAMS', 'name、displayName、audioDuration和status为必填字段', 400);
        }

        // 构建music数据对象
        const musicData = {
            name,
            displayName,
            audioUrl,
            audioDuration,
            status
        };

        // 根据状态选择验证规则
        let validationKey = 'music';
        if (musicData.status === 'DRAFT') {
            validationKey = 'music.draft';  // 草稿状态只验证必要字段
        }

        // 使用validator库进行参数验证
        const validationResult = validateApiData(validationKey, musicData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        const result = await transaction(async (connection) => {
            let musicId = id;

            if (id) {
                // 更新现有music
                musicId = parseInt(id);

                const existingRecord = await query('SELECT id FROM music WHERE id = ? AND is_deleted = 0', [musicId]);
                if (existingRecord.length === 0) {
                    throw new Error('Music不存在');
                }

                const updateSql = `
                    UPDATE music 
                    SET name = ?, display_name = ?, audio_url = ?, audio_duration = ?, status = ?, update_time = NOW()
                    WHERE id = ? AND is_deleted = 0
                `;
                const updateParams = sanitizeParams([
                    name,
                    displayName,
                    audioUrl,
                    parseInt(audioDuration),
                    status,
                    musicId
                ]);

                const [updateResult] = await connection.execute(updateSql, updateParams);
                if (updateResult.affectedRows === 0) {
                    throw new Error('Music不存在或未发生变化');
                }
            } else {
                // 创建新music
                const insertSql = `
                    INSERT INTO music (name, display_name, audio_url, audio_duration, status, create_time, update_time)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `;
                const insertParams = sanitizeParams([
                    name,
                    displayName,
                    audioUrl,
                    parseInt(audioDuration),
                    status
                ]);

                const [insertResult] = await connection.execute(insertSql, insertParams);
                musicId = insertResult.insertId;
            }

            return { musicId };
        });

        // 记录操作日志
        const isUpdate = !!id;
        const dataInfo = { name, displayName };
        const dataAfter = { name, displayName, audioUrl, audioDuration, status };

        if (isUpdate) {
            await SimpleOpLogRecorder.recordUpdate(
                req,
                'music',
                result.musicId,
                dataInfo,
                dataAfter
            );
        } else {
            await SimpleOpLogRecorder.recordAdd(
                req,
                'music',
                result.musicId,
                dataInfo,
                dataAfter
            );
        }

        sendSuccess(res, { id: result.musicId }, id ? '更新music成功' : '创建music成功');

    } catch (error) {
        console.error('保存music错误:', error);
        sendError(res, 'SAVE_FAILED', error.message || '保存music失败', 500);
    }
});

/**
 * @swagger
 * /api/music/enable:
 *   post:
 *     summary: 批量启用music
 *     tags: [Music]
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
 *                 description: music ID列表
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

        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, 'INVALID_PARAMS', 'idList不能为空', 400);
        }

        const result = await batchUpdateStatus('music', idList, 'ENABLED', '启用');

        // 记录操作日志
        await SimpleOpLogRecorder.recordEnable(
            req,
            'music',
            idList[0], // 使用第一个ID作为代表
            `批量启用music，共${idList.length}条`,
            { operation: 'batch_enable', idList, count: idList.length }
        );

        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量启用music错误:', error);
        sendError(res, 'ENABLE_FAILED', error.message || '批量启用music失败', 500);
    }
});

/**
 * @swagger
 * /api/music/disable:
 *   post:
 *     summary: 批量禁用music
 *     tags: [Music]
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
 *                 description: music ID列表
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

        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, 'INVALID_PARAMS', 'idList不能为空', 400);
        }

        const result = await batchUpdateStatus('music', idList, 'DISABLED', '禁用');

        // 记录操作日志
        await SimpleOpLogRecorder.recordDisable(
            req,
            'music',
            idList[0], // 使用第一个ID作为代表
            `批量禁用music，共${idList.length}条`,
            { operation: 'batch_disable', idList, count: idList.length }
        );

        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量禁用music错误:', error);
        sendError(res, 'DISABLE_FAILED', error.message || '批量禁用music失败', 500);
    }
});

/**
 * @swagger
 * /api/music/del:
 *   post:
 *     summary: 批量删除music
 *     tags: [Music]
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
 *                 description: music ID列表
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/del', async (req, res) => {
    try {
        const { idList } = req.body;

        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, 'INVALID_PARAMS', 'idList不能为空', 400);
        }

        const result = await batchLogicalDelete('music', idList);

        // 返回结果，包含删除的数据信息（供中间件记录日志使用）
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData
        }, result.message);

    } catch (error) {
        console.error('批量删除music错误:', error);
        sendError(res, 'DELETE_FAILED', error.message || '批量删除music失败', 500);
    }
});

/**
 * @swagger
 * /api/music/page:
 *   get:
 *     summary: 分页查询music列表
 *     tags: [Music]
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
 *         name: statusList
 *         schema:
 *           type: string
 *         description: 状态列表（逗号分隔，如：DRAFT,ENABLED）
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: id
 *         description: 排序字段（如：id, name, createTime）
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 查询成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/page', async (req, res) => {
    try {
        const {
            pageIndex = 1,
            pageSize = 10,
            keywords,
            statusList,
            orderBy,
            orderDirection
        } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);

        // 转换排序字段名：前端字段名(camelCase) -> 数据库字段名(snake_case)
        const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';
        const dbOrderDirection = orderDirection || 'desc';

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
                const idCheckSql = `SELECT COUNT(*) as count FROM music WHERE id = ? AND is_deleted = 0`;
                const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);

                if (idCheckResult[0].count === 0) {
                    // ID没有匹配结果，重置条件构建器，改为名称模糊搜索
                    conditionBuilder.reset();

                    // 重新添加逻辑删除过滤条件
                    conditionBuilder.addNumberCondition('is_deleted', 0);

                    // 重新添加其他筛选条件
                    if (queryParams.statusList && queryParams.statusList.length > 0) {
                        conditionBuilder.addArrayCondition('status', queryParams.statusList);
                    }

                    // 添加名称模糊搜索（支持name和displayName）
                    conditionBuilder.addCondition('(name LIKE ? OR display_name LIKE ?)', [`%${trimmedKeywords}%`, `%${trimmedKeywords}%`]);
                }
            } else {
                // 非纯数字（包含文本或混合），按名称模糊搜索
                conditionBuilder.addCondition('(name LIKE ? OR display_name LIKE ?)', [`%${trimmedKeywords}%`, `%${trimmedKeywords}%`]);
            }
        }

        // 添加其他筛选条件（如果没有关键词搜索或关键词搜索为非纯数字）
        if (!keywords || !/^\d+$/.test(keywords.trim())) {
            // 数组参数
            if (queryParams.statusList && queryParams.statusList.length > 0) {
                conditionBuilder.addArrayCondition('status', queryParams.statusList);
            }
        }

        // 构建查询条件
        const { where, params } = conditionBuilder.build();

        // 构建查询选项
        const options = {
            where,
            whereParams: params,
            orderBy: `${dbOrderBy} ${dbOrderDirection}`,
            pageSize: parseInt(pageSize),
            pageIndex: parseInt(pageIndex),
            excludeFields: ['is_deleted']  // 排除 is_deleted 字段
        };

        // 使用BusinessHelper进行分页查询
        const result = await BusinessHelper.paginateWithValidation('music', { query: req.query }, options);

        if (result.success) {
            res.json(result);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('分页查询music错误:', error);
        sendError(res, 'QUERY_FAILED', '分页查询music失败', 500);
    }
});

/**
 * @swagger
 * /api/music/detail/{id}:
 *   get:
 *     summary: 获取music详情
 *     tags: [Music]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: music ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: music不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 'INVALID_PARAMS', '无效的music ID', 400);
        }

        const musicId = parseInt(id);

        // 查询music基本信息
        const musicResult = await BusinessHelper.findByIdWithValidation('music', musicId, { is_deleted: 0 });

        if (!musicResult.success) {
            return sendError(res, musicResult.error, musicResult.message, musicResult.statusCode || 404);
        }

        const musicData = musicResult.data;

        sendSuccess(res, musicData, '获取music详情成功');

    } catch (error) {
        console.error('获取music详情错误:', error);
        sendError(res, 'QUERY_FAILED', '获取music详情失败', 500);
    }
});

module.exports = router;
