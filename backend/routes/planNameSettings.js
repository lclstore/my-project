/**
 * PlanNameSettings 计划名称设置管理接口
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
 * /api/planNameSettings/save:
 *   post:
 *     summary: 保存planNameSettings
 *     tags: [PlanNameSettings]
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
 *                 description: planNameSettings ID（更新时需要）
 *               name:
 *                 type: string
 *                 description: workout名称
 *               description:
 *                 type: string
 *                 description: 描述
 *               planName:
 *                 type: string
 *                 description: plan名称
 *               stage1Name:
 *                 type: string
 *                 description: stage1名称
 *               stage2Name:
 *                 type: string
 *                 description: stage2名称
 *               stage3Name:
 *                 type: string
 *                 description: stage3名称
 *               stage4Name:
 *                 type: string
 *                 description: stage4名称
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ENABLED, DISABLED]
 *                 description: 状态
 *               ruleList:
 *                 type: array
 *                 description: rule列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     matchKey:
 *                       type: string
 *                       enum: [WISHED_TRAINING_POSITION, COMPLETED_TIMES]
 *                       description: 匹配的key
 *                     matchCondition:
 *                       type: string
 *                       enum: [EQUALS, NOT_EQUALS]
 *                       description: 匹配条件
 *                     matchValue:
 *                       type: integer
 *                       description: 匹配值
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
        const { id, name, description, planName, stage1Name, stage2Name, stage3Name, stage4Name, status, ruleList = [] } = req.body;

        // 基本参数验证
        if (!name || !status) {
            return sendError(res, 'INVALID_PARAMS', 'name和status为必填字段', 400);
        }

        // 构建planNameSettings数据对象
        const planNameSettingsData = {
            name,
            description,
            planName,
            stage1Name,
            stage2Name,
            stage3Name,
            stage4Name,
            status,
            ruleList
        };

        // 根据状态选择验证规则
        let validationKey = 'planNameSettings';
        if (planNameSettingsData.status === 'DRAFT') {
            validationKey = 'planNameSettings.draft';  // 草稿状态只验证必要字段
        }

        // 使用validator库进行参数验证
        const validationResult = validateApiData(validationKey, planNameSettingsData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        const result = await transaction(async (connection) => {
            let planNameSettingsId = id;

            if (id) {
                // 更新现有planNameSettings
                planNameSettingsId = parseInt(id);

                const existingRecord = await query('SELECT id FROM plan_name_settings WHERE id = ? AND is_deleted = 0', [planNameSettingsId]);
                if (existingRecord.length === 0) {
                    throw new Error('PlanNameSettings不存在');
                }

                const updateSql = `
                    UPDATE plan_name_settings 
                    SET name = ?, description = ?, plan_name = ?, stage1_name = ?, stage2_name = ?, stage3_name = ?, stage4_name = ?, status = ?, update_time = NOW()
                    WHERE id = ? AND is_deleted = 0
                `;
                const updateParams = sanitizeParams([
                    name,
                    description,
                    planName,
                    stage1Name,
                    stage2Name,
                    stage3Name,
                    stage4Name,
                    status,
                    planNameSettingsId
                ]);

                const [updateResult] = await connection.execute(updateSql, updateParams);
                if (updateResult.affectedRows === 0) {
                    throw new Error('PlanNameSettings不存在或未发生变化');
                }

                // 删除现有的rule记录（关联表数据使用物理删除，因为需要重新建立关联关系）
                await connection.execute('DELETE FROM plan_name_settings_rule WHERE plan_name_settings_id = ?', [planNameSettingsId]);
            } else {
                // 创建新planNameSettings
                const insertSql = `
                    INSERT INTO plan_name_settings (name, description, plan_name, stage1_name, stage2_name, stage3_name, stage4_name, status, create_time, update_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                const insertParams = sanitizeParams([
                    name,
                    description,
                    planName,
                    stage1Name,
                    stage2Name,
                    stage3Name,
                    stage4Name,
                    status
                ]);

                const [insertResult] = await connection.execute(insertSql, insertParams);
                planNameSettingsId = insertResult.insertId;
            }

            // 保存ruleList
            if (ruleList && ruleList.length > 0) {
                for (let i = 0; i < ruleList.length; i++) {
                    const rule = ruleList[i];
                    const ruleSql = `
                        INSERT INTO plan_name_settings_rule (plan_name_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                    `;
                    const ruleParams = sanitizeParams([
                        planNameSettingsId,
                        rule.matchKey,
                        rule.matchCondition,
                        rule.matchValue ? parseInt(rule.matchValue) : null,
                        i + 1 // sort_order从1开始
                    ]);

                    await connection.execute(ruleSql, ruleParams);
                }
            }

            return { planNameSettingsId };
        });

        sendSuccess(res, { id: result.planNameSettingsId }, id ? '更新planNameSettings成功' : '创建planNameSettings成功');

    } catch (error) {
        console.error('保存planNameSettings错误:', error);
        sendError(res, 'SAVE_FAILED', error.message || '保存planNameSettings失败', 500);
    }
});

/**
 * @swagger
 * /api/planNameSettings/enable:
 *   post:
 *     summary: 批量启用planNameSettings
 *     tags: [PlanNameSettings]
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
 *                 description: planNameSettings ID列表
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

        const result = await batchUpdateStatus('plan_name_settings', idList, 'ENABLED', '启用');
        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量启用planNameSettings错误:', error);
        sendError(res, 'ENABLE_FAILED', error.message || '批量启用planNameSettings失败', 500);
    }
});

/**
 * @swagger
 * /api/planNameSettings/disable:
 *   post:
 *     summary: 批量禁用planNameSettings
 *     tags: [PlanNameSettings]
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
 *                 description: planNameSettings ID列表
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

        const result = await batchUpdateStatus('plan_name_settings', idList, 'DISABLED', '禁用');
        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量禁用planNameSettings错误:', error);
        sendError(res, 'DISABLE_FAILED', error.message || '批量禁用planNameSettings失败', 500);
    }
});

/**
 * @swagger
 * /api/planNameSettings/del:
 *   post:
 *     summary: 批量删除planNameSettings
 *     tags: [PlanNameSettings]
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
 *                 description: planNameSettings ID列表
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

        const result = await batchLogicalDelete('plan_name_settings', idList, '删除');
        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量删除planNameSettings错误:', error);
        sendError(res, 'DELETE_FAILED', error.message || '批量删除planNameSettings失败', 500);
    }
});

/**
 * @swagger
 * /api/planNameSettings/page:
 *   get:
 *     summary: 分页查询planNameSettings列表
 *     tags: [PlanNameSettings]
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
 *                       description:
 *                         type: string
 *                       planName:
 *                         type: string
 *                       stage1Name:
 *                         type: string
 *                       stage2Name:
 *                         type: string
 *                       stage3Name:
 *                         type: string
 *                       stage4Name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       ruleList:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             matchKey:
 *                               type: string
 *                             matchCondition:
 *                               type: string
 *                             matchValue:
 *                               type: integer
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
                const idCheckSql = `SELECT COUNT(*) as count FROM plan_name_settings WHERE id = ? AND is_deleted = 0`;
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
        const result = await BusinessHelper.paginateWithValidation('plan_name_settings', { query: req.query }, options);

        if (result.success) {
            // 为每条记录查询ruleList
            const enhancedData = await Promise.all(result.data.map(async (item) => {
                // 查询ruleList
                const ruleSql = `
                    SELECT id, match_key, match_condition, match_value, sort_order
                    FROM plan_name_settings_rule
                    WHERE plan_name_settings_id = ?
                    ORDER BY sort_order, id
                `;
                const ruleResult = await query(ruleSql, [item.id]);
                const ruleList = ruleResult.map(rule => convertToFrontendFormat(rule));

                return {
                    ...item,
                    ruleList
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
        console.error('分页查询planNameSettings错误:', error);
        sendError(res, 'QUERY_FAILED', '分页查询planNameSettings失败', 500);
    }
});

/**
 * @swagger
 * /api/planNameSettings/detail/{id}:
 *   get:
 *     summary: 获取planNameSettings详情
 *     tags: [PlanNameSettings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: planNameSettings ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: planNameSettings不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 'INVALID_PARAMS', '无效的planNameSettings ID', 400);
        }

        const planNameSettingsId = parseInt(id);

        // 查询planNameSettings基本信息
        const planNameSettingsResult = await BusinessHelper.findByIdWithValidation('plan_name_settings', planNameSettingsId, { is_deleted: 0 });

        if (!planNameSettingsResult.success) {
            return sendError(res, planNameSettingsResult.error, planNameSettingsResult.message, planNameSettingsResult.statusCode || 404);
        }

        const planNameSettingsData = planNameSettingsResult.data;

        // 查询关联的rule列表
        const ruleSql = `
            SELECT id, match_key, match_condition, match_value, sort_order
            FROM plan_name_settings_rule
            WHERE plan_name_settings_id = ?
            ORDER BY sort_order, id
        `;
        const ruleResult = await query(ruleSql, [planNameSettingsId]);

        // 转换ruleList
        const ruleList = ruleResult.map(rule => convertToFrontendFormat(rule));

        // 组合返回数据
        const responseData = {
            ...planNameSettingsData,
            ruleList
        };

        sendSuccess(res, responseData, '获取planNameSettings详情成功');

    } catch (error) {
        console.error('获取planNameSettings详情错误:', error);
        sendError(res, 'QUERY_FAILED', '获取planNameSettings详情失败', 500);
    }
});

module.exports = router;
