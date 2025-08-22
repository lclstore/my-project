/**
 * Template 模板管理接口
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

/**
 * @swagger
 * /api/template/save:
 *   post:
 *     summary: 保存template
 *     tags: [Templates]
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
 *                 description: template ID（更新时需要）
 *               name:
 *                 type: string
 *                 description: template名称
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
 *               unitList:
 *                 type: array
 *                 description: unit列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     structureName:
 *                       type: string
 *                       description: template unit名称
 *                     structureTypeCode:
 *                       type: string
 *                       enum: [WARM_UP, MAIN, COOL_DOWN]
 *                       description: exercise 结构类型code
 *                     count:
 *                       type: integer
 *                       description: exercise 数量
 *                     round:
 *                       type: integer
 *                       description: exercise 循环次数
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
        const { id, name, description, durationCode, days, status, unitList = [] } = req.body;

        // 基本参数验证
        if (!name || !status) {
            return sendError(res, 'INVALID_PARAMS', 'name和status为必填字段', 400);
        }

        // 构建template数据对象
        const templateData = {
            name,
            description,
            durationCode,
            days,
            status,
            unitList
        };

        // 根据状态选择验证规则
        let validationKey = 'template';
        if (templateData.status === 'DRAFT') {
            validationKey = 'template.draft';  // 草稿状态只验证必要字段
        }

        // 使用validator库进行参数验证
        const validationResult = validateApiData(validationKey, templateData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        const result = await transaction(async (connection) => {
            let templateId = id;

            if (id) {
                // 更新现有template
                templateId = parseInt(id);

                const existingRecord = await query('SELECT id FROM template WHERE id = ? AND is_deleted = 0', [templateId]);
                if (existingRecord.length === 0) {
                    throw new Error('Template不存在');
                }

                const updateSql = `
                    UPDATE template
                    SET name = ?, description = ?, duration_code = ?, days = ?, status = ?, update_time = NOW()
                    WHERE id = ? AND is_deleted = 0
                `;
                const updateParams = sanitizeParams([
                    name,
                    description,
                    durationCode,
                    days ? parseInt(days) : null,
                    status,
                    templateId
                ]);

                const [updateResult] = await connection.execute(updateSql, updateParams);
                if (updateResult.affectedRows === 0) {
                    throw new Error('Template不存在或未发生变化');
                }

                // 删除现有的unit记录
                await connection.execute('DELETE FROM template_unit WHERE template_id = ?', [templateId]);
            } else {
                // 创建新template
                const insertSql = `
                    INSERT INTO template (name, description, duration_code, days, status, create_time, update_time)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `;
                const insertParams = sanitizeParams([
                    name,
                    description,
                    durationCode,
                    days ? parseInt(days) : null,
                    status
                ]);

                const [insertResult] = await connection.execute(insertSql, insertParams);
                templateId = insertResult.insertId;
            }

            // 保存unitList
            if (unitList && unitList.length > 0) {
                for (let i = 0; i < unitList.length; i++) {
                    const unit = unitList[i];
                    const unitSql = `
                        INSERT INTO template_unit (template_id, structure_name, structure_type_code, count, round, sort_order, create_time, update_time)
                        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `;
                    const unitParams = sanitizeParams([
                        templateId,
                        unit.structureName,
                        unit.structureTypeCode,
                        unit.count ? parseInt(unit.count) : null,
                        unit.round ? parseInt(unit.round) : null,
                        i + 1 // sort_order从1开始
                    ]);

                    await connection.execute(unitSql, unitParams);
                }
            }

            return { templateId };
        });

        sendSuccess(res, { id: result.templateId }, id ? '更新template成功' : '创建template成功');

    } catch (error) {
        console.error('保存template错误:', error);
        sendError(res, 'SAVE_FAILED', error.message || '保存template失败', 500);
    }
});

/**
 * @swagger
 * /api/template/enable:
 *   post:
 *     summary: 批量启用template
 *     tags: [Templates]
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
 *                 description: template ID列表
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

        const result = await batchUpdateStatus('template', idList, 'ENABLED', '启用');
        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量启用template错误:', error);
        sendError(res, 'ENABLE_FAILED', error.message || '批量启用template失败', 500);
    }
});

/**
 * @swagger
 * /api/template/disable:
 *   post:
 *     summary: 批量禁用template
 *     tags: [Templates]
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
 *                 description: template ID列表
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

        const result = await batchUpdateStatus('template', idList, 'DISABLED', '禁用');
        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量禁用template错误:', error);
        sendError(res, 'DISABLE_FAILED', error.message || '批量禁用template失败', 500);
    }
});

/**
 * @swagger
 * /api/template/del:
 *   post:
 *     summary: 批量删除template
 *     tags: [Templates]
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
 *                 description: template ID列表
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

        const result = await batchLogicalDelete('template', idList);
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData
        }, result.message);

    } catch (error) {
        console.error('批量删除template错误:', error);
        sendError(res, 'DELETE_FAILED', error.message || '批量删除template失败', 500);
    }
});

/**
 * @swagger
 * /api/template/page:
 *   get:
 *     summary: 分页查询template列表
 *     tags: [Templates]
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
 *         name: name
 *         schema:
 *           type: string
 *         description: template名称（模糊查询，兼容旧版）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ENABLED, DISABLED]
 *         description: 状态（单个值，兼容旧版）
 *       - in: query
 *         name: statusList
 *         schema:
 *           type: string
 *         description: 状态列表（逗号分隔，如：DRAFT,ENABLED）
 *       - in: query
 *         name: durationCode
 *         schema:
 *           type: string
 *           enum: [MIN_5_10, MIN_10_15, MIN_15_20, MIN_20_30]
 *         description: 时长代码（单个值，兼容旧版）
 *       - in: query
 *         name: durationCodeList
 *         schema:
 *           type: string
 *         description: 时长代码列表（逗号分隔，如：MIN_5_10,MIN_10_15）
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
            name,
            status,
            durationCode,
            statusList,
            durationCodeList,
            orderBy,
            orderDirection
        } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        if (durationCodeList) queryParams.durationCodeList = parseArrayParam(durationCodeList);

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
                const idCheckSql = `SELECT COUNT(*) as count FROM template WHERE id = ? AND is_deleted = 0`;
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
                    if (queryParams.durationCodeList && queryParams.durationCodeList.length > 0) {
                        conditionBuilder.addArrayCondition('duration_code', queryParams.durationCodeList);
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
            // 兼容旧的单个参数
            if (name) {
                conditionBuilder.addStringCondition('name', name, 'like');
            }
            if (status) {
                conditionBuilder.addStringCondition('status', status, 'exact');
            }
            if (durationCode) {
                conditionBuilder.addStringCondition('duration_code', durationCode, 'exact');
            }

            // 新的数组参数
            if (queryParams.statusList && queryParams.statusList.length > 0) {
                conditionBuilder.addArrayCondition('status', queryParams.statusList);
            }
            if (queryParams.durationCodeList && queryParams.durationCodeList.length > 0) {
                conditionBuilder.addArrayCondition('duration_code', queryParams.durationCodeList);
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
        const result = await BusinessHelper.paginateWithValidation('template', { query: req.query }, options);

        if (result.success) {
            res.json(result);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('分页查询template错误:', error);
        sendError(res, 'QUERY_FAILED', '分页查询template失败', 500);
    }
});

/**
 * @swagger
 * /api/template/detail/{id}:
 *   get:
 *     summary: 获取template详情
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: template ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: template不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 'INVALID_PARAMS', '无效的template ID', 400);
        }

        const templateId = parseInt(id);

        // 查询template基本信息
        const templateResult = await BusinessHelper.findByIdWithValidation('template', templateId, { is_deleted: 0 });

        if (!templateResult.success) {
            return sendError(res, templateResult.error, templateResult.message, templateResult.statusCode || 404);
        }

        const templateData = templateResult.data;

        // 查询关联的unit列表
        const unitSql = `
            SELECT structure_name, structure_type_code, count, round, sort_order
            FROM template_unit
            WHERE template_id = ?
            ORDER BY sort_order, id
        `;
        const unitResult = await query(unitSql, [templateId]);

        // 转换unit数据格式
        const unitList = unitResult.map(unit => convertToFrontendFormat(unit));

        // 组合返回数据
        const responseData = {
            ...templateData,
            unitList
        };

        sendSuccess(res, responseData, '获取template详情成功');

    } catch (error) {
        console.error('获取template详情错误:', error);
        sendError(res, 'QUERY_FAILED', '获取template详情失败', 500);
    }
});

module.exports = router;
