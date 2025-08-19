/**
 * Playlist 播放列表管理接口
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
const { SimpleOpLogRecorder, getOperationUser, generateDataInfo } = require('../utils/opLogHelper');

/**
 * @swagger
 * /api/playlist/save:
 *   post:
 *     summary: 保存playlist
 *     tags: [Playlist]
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
 *                 description: playlist ID（更新时需要）
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
 *                 description: music列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     bizMusicId:
 *                       type: integer
 *                       description: music ID
 *                     premium:
 *                       type: integer
 *                       description: 是否需要订阅（0不需要 1需要）
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
        const { id, name, type, premium, status, musicList = [] } = req.body;

        // 基本参数验证
        if (!name || premium === undefined || premium === null || !status) {
            return sendError(res, 'INVALID_PARAMS', 'name、premium和status为必填字段', 400);
        }

        // 构建playlist数据对象
        const playlistData = {
            name,
            type,
            premium,
            status,
            musicList
        };

        // 根据状态选择验证规则
        let validationKey = 'playlist';
        if (playlistData.status === 'DRAFT') {
            validationKey = 'playlist.draft';  // 草稿状态只验证必要字段
        }

        // 使用validator库进行参数验证
        const validationResult = validateApiData(validationKey, playlistData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        const result = await transaction(async (connection) => {
            let playlistId = id;

            if (id) {
                // 更新现有playlist
                playlistId = parseInt(id);

                const existingRecord = await query('SELECT id FROM playlist WHERE id = ? AND is_deleted = 0', [playlistId]);
                if (existingRecord.length === 0) {
                    throw new Error('Playlist不存在');
                }

                const updateSql = `
                    UPDATE playlist 
                    SET name = ?, type = ?, premium = ?, status = ?, update_time = NOW()
                    WHERE id = ? AND is_deleted = 0
                `;
                const updateParams = sanitizeParams([
                    name,
                    type,
                    parseInt(premium),
                    status,
                    playlistId
                ]);

                const [updateResult] = await connection.execute(updateSql, updateParams);
                if (updateResult.affectedRows === 0) {
                    throw new Error('Playlist不存在或未发生变化');
                }

                // 删除现有的music记录
                await connection.execute('DELETE FROM playlist_music WHERE playlist_id = ?', [playlistId]);
            } else {
                // 创建新playlist
                const insertSql = `
                    INSERT INTO playlist (name, type, premium, status, create_time, update_time)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `;
                const insertParams = sanitizeParams([
                    name,
                    type,
                    parseInt(premium),
                    status
                ]);

                const [insertResult] = await connection.execute(insertSql, insertParams);
                playlistId = insertResult.insertId;
            }

            // 保存musicList
            if (musicList && musicList.length > 0) {
                for (let i = 0; i < musicList.length; i++) {
                    const music = musicList[i];
                    const musicSql = `
                        INSERT INTO playlist_music (playlist_id, biz_music_id, premium, sort_order, create_time, update_time)
                        VALUES (?, ?, ?, ?, NOW(), NOW())
                    `;
                    const musicParams = sanitizeParams([
                        playlistId,
                        parseInt(music.bizMusicId),
                        parseInt(music.premium || 0),
                        i + 1 // sort_order从1开始
                    ]);

                    await connection.execute(musicSql, musicParams);
                }
            }

            return { playlistId };
        });

        // 记录操作日志
        const operationUser = getOperationUser(req);
        const dataInfo = generateDataInfo({ name });
        const isUpdate = !!id;

        if (isUpdate) {
            await SimpleOpLogRecorder.recordUpdate(
                req,
                'playlist',
                result.playlistId,
                dataInfo,
                { name, type, premium, status, musicListCount: musicList?.length || 0 },
                null // dataBefore - 可以在实际项目中查询更新前的数据
            );
        } else {
            await SimpleOpLogRecorder.recordAdd(
                req,
                'playlist',
                result.playlistId,
                dataInfo,
                { name, type, premium, status, musicListCount: musicList?.length || 0 }
            );
        }

        sendSuccess(res, { id: result.playlistId }, id ? '更新playlist成功' : '创建playlist成功');

    } catch (error) {
        console.error('保存playlist错误:', error);
        sendError(res, 'SAVE_FAILED', error.message || '保存playlist失败', 500);
    }
});

/**
 * @swagger
 * /api/playlist/enable:
 *   post:
 *     summary: 批量启用playlist
 *     tags: [Playlist]
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
 *                 description: playlist ID列表
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

        const result = await batchUpdateStatus('playlist', idList, 'ENABLED', '启用');

        // 记录操作日志
        await SimpleOpLogRecorder.recordEnable(
            req,
            'playlist',
            idList[0],
            `批量启用playlist，共${idList.length}条`,
            { operation: 'batch_enable', idList, count: idList.length }
        );

        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量启用playlist错误:', error);
        sendError(res, 'ENABLE_FAILED', error.message || '批量启用playlist失败', 500);
    }
});

/**
 * @swagger
 * /api/playlist/disable:
 *   post:
 *     summary: 批量禁用playlist
 *     tags: [Playlist]
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
 *                 description: playlist ID列表
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

        const result = await batchUpdateStatus('playlist', idList, 'DISABLED', '禁用');

        // 记录操作日志
        await SimpleOpLogRecorder.recordDisable(
            req,
            'playlist',
            idList[0],
            `批量禁用playlist，共${idList.length}条`,
            { operation: 'batch_disable', idList, count: idList.length }
        );

        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量禁用playlist错误:', error);
        sendError(res, 'DISABLE_FAILED', error.message || '批量禁用playlist失败', 500);
    }
});

/**
 * @swagger
 * /api/playlist/del:
 *   post:
 *     summary: 批量删除playlist
 *     tags: [Playlist]
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
 *                 description: playlist ID列表
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

        const result = await batchLogicalDelete('playlist', idList);

        // 返回结果，包含删除的数据信息（供中间件记录日志使用）
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData
        }, result.message);

    } catch (error) {
        console.error('批量删除playlist错误:', error);
        sendError(res, 'DELETE_FAILED', error.message || '批量删除playlist失败', 500);
    }
});

/**
 * @swagger
 * /api/playlist/page:
 *   get:
 *     summary: 分页查询playlist列表
 *     tags: [Playlist]
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
 *         name: typeList
 *         schema:
 *           type: string
 *         description: 类型列表（逗号分隔，如：REGULAR,YOGA）
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       premium:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       musicCount:
 *                         type: integer
 *                         description: music数量
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
            typeList,
            premium,
            orderBy,
            orderDirection
        } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        if (typeList) queryParams.typeList = parseArrayParam(typeList);

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
                const idCheckSql = `SELECT COUNT(*) as count FROM playlist WHERE id = ? AND is_deleted = 0`;
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
                    if (queryParams.typeList && queryParams.typeList.length > 0) {
                        conditionBuilder.addArrayCondition('type', queryParams.typeList);
                    }
                    if (premium !== undefined && premium !== null) {
                        conditionBuilder.addNumberCondition('premium', parseInt(premium));
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
            // 数组参数
            if (queryParams.statusList && queryParams.statusList.length > 0) {
                conditionBuilder.addArrayCondition('status', queryParams.statusList);
            }
            if (queryParams.typeList && queryParams.typeList.length > 0) {
                conditionBuilder.addArrayCondition('type', queryParams.typeList);
            }
            // 单值参数
            if (premium !== undefined && premium !== null) {
                conditionBuilder.addNumberCondition('premium', parseInt(premium));
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
        const result = await BusinessHelper.paginateWithValidation('playlist', { query: req.query }, options);

        if (result.success) {
            // 为每条记录查询musicCount
            const enhancedData = await Promise.all(result.data.map(async (item) => {
                // 查询music数量
                const musicCountSql = `
                    SELECT COUNT(*) as count
                    FROM playlist_music
                    WHERE playlist_id = ?
                `;
                const musicCountResult = await query(musicCountSql, [item.id]);
                const musicCount = musicCountResult[0].count;

                return {
                    ...item,
                    musicCount
                };
            }));

            // 返回增强后的结果
            res.json({
                ...result,
                data: enhancedData
            });
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('分页查询playlist错误:', error);
        sendError(res, 'QUERY_FAILED', '分页查询playlist失败', 500);
    }
});

/**
 * @swagger
 * /api/playlist/detail/{id}:
 *   get:
 *     summary: 获取playlist详情
 *     tags: [Playlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: playlist ID
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     premium:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     musicList:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bizMusicId:
 *                             type: integer
 *                             description: music ID
 *                           premium:
 *                             type: integer
 *                             description: 是否需要订阅
 *                           sortOrder:
 *                             type: integer
 *                             description: 排序顺序
 *                           id:
 *                             type: integer
 *                             description: 音乐ID
 *                           name:
 *                             type: string
 *                             description: 音乐名称
 *                           displayName:
 *                             type: string
 *                             description: 音乐显示名称
 *                           audioUrl:
 *                             type: string
 *                             description: 音频文件地址
 *                           audioDuration:
 *                             type: integer
 *                             description: 音频时长
 *                           status:
 *                             type: string
 *                             description: 音乐状态
 *                           createTime:
 *                             type: string
 *                             description: 音乐创建时间
 *                           updateTime:
 *                             type: string
 *                             description: 音乐更新时间
 *       404:
 *         description: playlist不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 'INVALID_PARAMS', '无效的playlist ID', 400);
        }

        const playlistId = parseInt(id);

        // 查询playlist基本信息
        const playlistResult = await BusinessHelper.findByIdWithValidation('playlist', playlistId, { is_deleted: 0 });

        if (!playlistResult.success) {
            return sendError(res, playlistResult.error, playlistResult.message, playlistResult.statusCode || 404);
        }

        const playlistData = playlistResult.data;

        // 查询关联的music列表，包含完整的music信息
        const musicSql = `
            SELECT
                pm.biz_music_id,
                pm.premium,
                pm.sort_order,
                m.name,
                m.display_name,
                m.audio_url,
                m.audio_duration,
                m.status as music_status,
                m.create_time as music_create_time,
                m.update_time as music_update_time
            FROM playlist_music pm
            LEFT JOIN music m ON pm.biz_music_id = m.id AND m.is_deleted = 0
            WHERE pm.playlist_id = ?
            ORDER BY pm.sort_order, pm.id
        `;
        const musicResult = await query(musicSql, [playlistId]);

        // 转换musicList，包含完整的music信息，使用公共方法转换前端字段
        const musicList = musicResult.map(music => {
            // 构建music信息对象
            const musicInfo = {
                id: music.biz_music_id,
                ...music,
            };

            // 使用公共方法转换music字段
            const convertedMusicInfo = convertToFrontendFormat(musicInfo);

            // 返回完整的musicList项，包含关联信息和转换后的music信息
            return convertedMusicInfo
        });

        // 组合返回数据
        const responseData = {
            ...playlistData,
            musicList
        };

        sendSuccess(res, responseData, '获取playlist详情成功');

    } catch (error) {
        console.error('获取playlist详情错误:', error);
        sendError(res, 'QUERY_FAILED', '获取playlist详情失败', 500);
    }
});

module.exports = router;
