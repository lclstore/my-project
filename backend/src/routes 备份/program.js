/**
 * Programs 训练计划管理接口
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
 * /api/program/save:
 *   post:
 *     summary: 保存programs（新增或修改）
 *     tags: [Programs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: program ID（修改时必填）
 *               name:
 *                 type: string
 *                 description: program名称
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
 *                 description: Duration Week
 *               difficultyCode:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *                 description: 难度code
 *               equipmentCode:
 *                 type: string
 *                 enum: [DUMBBELLS, RESISTANCE_BAND, NONE]
 *                 description: 器械code
 *               newStartTime:
 *                 type: string
 *                 format: date-time
 *                 description: NEW开始时间
 *               newEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: NEW结束时间
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ENABLED, DISABLED]
 *                 description: 状态
 *               workoutList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: workout ID列表
 *     responses:
 *       200:
 *         description: 操作成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/save', async (req, res) => {
    try {
        const {
            id,
            name,
            coverImgUrl,
            detailImgUrl,
            description,
            showTypeCode,
            durationWeek,
            difficultyCode,
            equipmentCode,
            newStartTime,
            newEndTime,
            status,
            workoutList
        } = req.body;

        // 构建program数据对象
        const programData = {
            name,
            coverImgUrl,
            detailImgUrl,
            description,
            showTypeCode,
            durationWeek,
            difficultyCode,
            equipmentCode,
            newStartTime,
            newEndTime,
            status: status || 'DRAFT'
        };

        // 使用validator进行参数验证
        const validationResult = validateApiData('program', programData);
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
            const existingRecord = await query('SELECT id FROM program WHERE id = ? AND is_deleted = 0', [parseInt(id)]);
            if (existingRecord.length === 0) {
                return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, 'programs不存在', 404);
            }

            // 使用BusinessHelper更新数据
            result = await BusinessHelper.updateWithValidation(
                'program',
                parseInt(id),
                programData,
                [],
                'program'
            );

            if (!result.success) {
                return sendError(res, result.error, result.message, result.statusCode);
            }

            // 处理workout关联数据
            if (workoutList !== undefined) {
                await transaction(async (connection) => {
                    // 删除原有的workout关联
                    await connection.execute('DELETE FROM program_workout WHERE program_id = ?', [parseInt(id)]);

                    // 保存新的workout关联数据
                    if (workoutList && Array.isArray(workoutList) && workoutList.length > 0) {
                        const workoutSql = 'INSERT INTO program_workout (program_id, workout_id, sort) VALUES (?, ?, ?)';
                        for (let i = 0; i < workoutList.length; i++) {
                            await connection.execute(workoutSql, sanitizeParams([parseInt(id), workoutList[i], i + 1]));
                        }
                    }
                });
            }

            sendSuccess(res, { id: parseInt(id) }, '修改program成功');
        } else {
            // 新增操作 - 默认设置 is_deleted = 0
            const insertData = {
                ...programData,
                is_deleted: 0
            };

            result = await BusinessHelper.insertWithValidation(
                'program',
                insertData,
                [],
                'program'
            );

            if (!result.success) {
                return sendError(res, result.error, result.message, result.statusCode);
            }

            const programId = result.insertId;

            // 保存workout关联数据
            if (workoutList && Array.isArray(workoutList) && workoutList.length > 0) {
                await transaction(async (connection) => {
                    const workoutSql = 'INSERT INTO program_workout (program_id, workout_id, sort) VALUES (?, ?, ?)';
                    for (let i = 0; i < workoutList.length; i++) {
                        await connection.execute(workoutSql, sanitizeParams([programId, workoutList[i], i + 1]));
                    }
                });
            }

            sendSuccess(res, { id: programId }, '新增program成功');
        }

    } catch (error) {
        console.error('保存program错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '保存program失败', 500);
    }
});

/**
 * @swagger
 * /api/program/detail/{id}:
 *   get:
 *     summary: 获取programs详情
 *     tags: [Programs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: program ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: programs不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const programId = parseInt(id);

        if (isNaN(programId)) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'ID参数无效', 400);
        }

        // 使用BusinessHelper查询program基本信息
        const programResult = await BusinessHelper.findByIdWithValidation('program', programId);

        if (!programResult.success) {
            return sendError(res, ERROR_CODES.NOT_FOUND, 'programs不存在', 404);
        }

        const programData = programResult.data;

        // 查询关联的workout列表（包含完整的workout信息）
        const workoutSql = `
            SELECT w.id, w.name, w.description, w.premium, w.new_start_time, w.new_end_time,
                   w.cover_img_url, w.detail_img_url, w.thumbnail_img_url, w.complete_img_url,
                   w.gender_code, w.difficulty_code, w.position_code, w.calorie, w.duration,
                   w.status, w.file_status, w.audio_json_languages,
                   pw.sort
            FROM program_workout pw
            INNER JOIN workout w ON pw.workout_id = w.id AND w.is_deleted = 0
            WHERE pw.program_id = ?
            ORDER BY pw.sort, w.id
        `;
        const workoutResult = await query(workoutSql, [programId]);

        // 批量查询workout的受伤类型
        const workoutIds = workoutResult.map(item => item.id);
        let injuredMap = new Map();

        if (workoutIds.length > 0) {
            const injuredSql = `
                SELECT wi.workout_id, wi.injured_code
                FROM workout_injured wi
                WHERE wi.workout_id IN (${workoutIds.map(() => '?').join(',')})
                ORDER BY wi.workout_id, wi.sort
            `;
            const injuredResult = await query(injuredSql, workoutIds);

            // 按workout_id分组
            injuredResult.forEach(item => {
                if (!injuredMap.has(item.workout_id)) {
                    injuredMap.set(item.workout_id, []);
                }
                injuredMap.get(item.workout_id).push(item.injured_code);
            });
        }

        // 处理workout数据，添加受伤类型信息
        const processedWorkouts = workoutResult.map(workout => {
            const convertedWorkout = convertToFrontendFormat(workout);
            // 添加受伤类型数组
            convertedWorkout.injuredCodes = injuredMap.get(workout.id) || [];
            return convertedWorkout;
        });

        // 构建最终响应数据
        const responseData = {
            ...programData,
            workoutList: processedWorkouts
        };

        sendSuccess(res, responseData, '获取program详情成功');

    } catch (error) {
        console.error('获取program详情错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '获取program详情失败', 500);
    }
});

/**
 * @swagger
 * /api/program/list:
 *   get:
 *     summary: 分页查询programs列表
 *     tags: [Programs]
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: 关键词搜索
 *       - in: query
 *         name: statusList
 *         schema:
 *           type: string
 *         description: 状态列表，逗号分隔
 *       - in: query
 *         name: showTypeCodeList
 *         schema:
 *           type: string
 *         description: 展示类型列表，逗号分隔
 *       - in: query
 *         name: difficultyCodeList
 *         schema:
 *           type: string
 *         description: 难度列表，逗号分隔
 *       - in: query
 *         name: equipmentCodeList
 *         schema:
 *           type: string
 *         description: 器械列表，逗号分隔

 *     responses:
 *       200:
 *         description: 查询成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/list', async (req, res) => {
    try {
        const {
            pageSize = 10,
            pageIndex = 1,
            keywords,
            statusList,
            showTypeCodeList,
            difficultyCodeList,
            equipmentCodeList
        } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        if (showTypeCodeList) queryParams.showTypeCodeList = parseArrayParam(showTypeCodeList);
        if (difficultyCodeList) queryParams.difficultyCodeList = parseArrayParam(difficultyCodeList);
        if (equipmentCodeList) queryParams.equipmentCodeList = parseArrayParam(equipmentCodeList);

        // 验证参数
        if (Object.keys(queryParams).length > 0) {
            const validation = validateApiData('program.query', queryParams);
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
                const idCheckSql = `SELECT COUNT(*) as count FROM program WHERE id = ? AND is_deleted = 0`;
                const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);

                if (idCheckResult[0].count === 0) {
                    // ID没有匹配结果，重置条件构建器，改为名称模糊搜索
                    conditionBuilder.reset();

                    // 重新添加逻辑删除过滤条件
                    conditionBuilder.addNumberCondition('is_deleted', 0);

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
                conditionBuilder.addArrayCondition('status', queryParams.statusList, 'BizStatusEnums');
            }
            if (queryParams.showTypeCodeList && queryParams.showTypeCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('showTypeCode'), queryParams.showTypeCodeList);
            }
            if (queryParams.difficultyCodeList && queryParams.difficultyCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('difficultyCode'), queryParams.difficultyCodeList);
            }
            if (queryParams.equipmentCodeList && queryParams.equipmentCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('equipmentCode'), queryParams.equipmentCodeList);
            }
        }

        // 构建查询条件
        const { where, params } = conditionBuilder.build();

        // 构建查询选项 - 固定按sort字段排序
        const options = {
            where,
            whereParams: params,
            orderBy: 'sort ASC, id DESC',
            pageSize: parseInt(pageSize),
            pageIndex: parseInt(pageIndex)
        };

        // 使用BusinessHelper进行分页查询
        const result = await BusinessHelper.paginateWithValidation('program', { query: req.query }, options);

        if (result.success) {
            res.json(result);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('分页查询program错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '分页查询program失败', 500);
    }
});

/**
 * @swagger
 * /api/program/list:
 *   get:
 *     summary: 查询所有program列表（不分页，无参数）
 *     tags: [Programs]
 *     responses:
 *       200:
 *         description: 查询成功
 *       500:
 *         description: 服务器错误
 */
router.get('/list', async (req, res) => {
    try {
        // 构建查询选项 - 只查询未删除的数据，按sort字段排序
        const options = {
            where: 'is_deleted = 0',
            whereParams: [],
            orderBy: 'sort ASC, id DESC'
        };

        // 使用DatabaseHelper查询所有数据（不分页）
        const result = await DatabaseHelper.select('program', options);

        if (!result.success) {
            return sendError(res, result.error, result.message, result.statusCode);
        }

        // 进行字段转换，将数据库字段转换为前端格式
        const processedData = result.data.map(item => convertToFrontendFormat(item));

        // 返回统一的列表结构
        sendSuccess(res, processedData, '查询program列表成功');

    } catch (error) {
        console.error('查询program列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询program列表失败', 500);
    }
});

/**
 * @swagger
 * /api/program/del:
 *   post:
 *     summary: 批量删除programs（逻辑删除）
 *     tags: [Programs]
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
 *                 description: program ID列表
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
        const result = await batchLogicalDelete('program', idList);
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData
        }, result.message);
    } catch (error) {
        console.error('删除program错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '删除program失败', 500);
    }
});

/**
 * @swagger
 * /api/program/enable:
 *   post:
 *     summary: 批量启用programs
 *     tags: [Programs]
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
 *                 description: program ID列表
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
        const result = await batchUpdateStatus('program', idList, 'ENABLED', '启用');
        sendSuccess(res, result, result.message);
    } catch (error) {
        console.error('启用program错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '启用program失败', 500);
    }
});

/**
 * @swagger
 * /api/program/disable:
 *   post:
 *     summary: 批量禁用programs
 *     tags: [Programs]
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
 *                 description: program ID列表
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
        const result = await batchUpdateStatus('program', idList, 'DISABLED', '禁用');
        sendSuccess(res, result, result.message);
    } catch (error) {
        console.error('禁用program错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '禁用program失败', 500);
    }
});

/**
 * @swagger
 * /api/program/sort:
 *   post:
 *     summary: 批量排序programs
 *     tags: [Programs]
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
 *                 description: program ID列表（按排序顺序）
 *     responses:
 *       200:
 *         description: 排序成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/sort', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchUpdateSort('program', idList);
        sendSuccess(res, {
            updatedCount: result.updatedCount
        }, result.message);
    } catch (error) {
        console.error('program排序错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || 'program排序失败', 500);
    }
});

module.exports = router;
