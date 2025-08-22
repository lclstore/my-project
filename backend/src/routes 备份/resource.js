/**
 * Resource 资源管理接口
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
 * /api/resource/save:
 *   post:
 *     summary: 保存resource
 *     tags: [Resources]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - applicationCode
 *               - genderCode
 *               - coverImgUrl
 *               - detailImgUrl
 *               - status
 *             properties:
 *               id:
 *                 type: integer
 *                 description: resource ID（更新时需要）
 *               name:
 *                 type: string
 *                 description: resource名称
 *               description:
 *                 type: string
 *                 description: 描述
 *               applicationCode:
 *                 type: string
 *                 enum: [PLAN, WORKOUT]
 *                 description: application code
 *               genderCode:
 *                 type: string
 *                 enum: [FEMALE, MALE]
 *                 description: 性别code
 *               coverImgUrl:
 *                 type: string
 *                 description: 封面图
 *               detailImgUrl:
 *                 type: string
 *                 description: 详情图
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
        const { id, name, description, applicationCode, genderCode, coverImgUrl, detailImgUrl, status } = req.body;

        // 基本参数验证
        if (!name || !status) {
            return sendError(res, 'INVALID_PARAMS', 'name和status为必填字段', 400);
        }

        // 构建resource数据对象
        const resourceData = {
            name,
            description,
            applicationCode,
            genderCode,
            coverImgUrl,
            detailImgUrl,
            status
        };

        // 根据状态选择验证规则
        let validationKey = 'resource';
        if (resourceData.status === 'DRAFT') {
            validationKey = 'resource.draft';  // 草稿状态只验证必要字段
        }

        // 使用validator库进行参数验证
        const validationResult = validateApiData(validationKey, resourceData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        const result = await transaction(async (connection) => {
            let resourceId = id;

            if (id) {
                // 更新现有resource
                resourceId = parseInt(id);

                const existingRecord = await query('SELECT id FROM resource WHERE id = ? AND is_deleted = 0', [resourceId]);
                if (existingRecord.length === 0) {
                    throw new Error('Resource不存在');
                }

                const updateSql = `
                    UPDATE resource 
                    SET name = ?, description = ?, application_code = ?, gender_code = ?, 
                        cover_img_url = ?, detail_img_url = ?, status = ?, update_time = NOW()
                    WHERE id = ? AND is_deleted = 0
                `;
                const updateParams = sanitizeParams([
                    name,
                    description,
                    applicationCode,
                    genderCode,
                    coverImgUrl,
                    detailImgUrl,
                    status,
                    resourceId
                ]);

                const [updateResult] = await connection.execute(updateSql, updateParams);
                if (updateResult.affectedRows === 0) {
                    throw new Error('Resource不存在或未发生变化');
                }
            } else {
                // 创建新resource
                const insertSql = `
                    INSERT INTO resource (name, description, application_code, gender_code, cover_img_url, detail_img_url, status, create_time, update_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                const insertParams = sanitizeParams([
                    name,
                    description,
                    applicationCode,
                    genderCode,
                    coverImgUrl,
                    detailImgUrl,
                    status
                ]);

                const [insertResult] = await connection.execute(insertSql, insertParams);
                resourceId = insertResult.insertId;
            }

            return { resourceId };
        });

        sendSuccess(res, { id: result.resourceId }, id ? '更新resource成功' : '创建resource成功');

    } catch (error) {
        console.error('保存resource错误:', error);
        sendError(res, 'SAVE_FAILED', error.message || '保存resource失败', 500);
    }
});

/**
 * @swagger
 * /api/resource/enable:
 *   post:
 *     summary: 批量启用resource
 *     tags: [Resources]
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
 *                 description: resource ID列表
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

        const result = await batchUpdateStatus('resource', idList, 'ENABLED', '启用');
        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量启用resource错误:', error);
        sendError(res, 'ENABLE_FAILED', error.message || '批量启用resource失败', 500);
    }
});

/**
 * @swagger
 * /api/resource/disable:
 *   post:
 *     summary: 批量禁用resource
 *     tags: [Resources]
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
 *                 description: resource ID列表
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

        const result = await batchUpdateStatus('resource', idList, 'DISABLED', '禁用');
        sendSuccess(res, result, result.message);

    } catch (error) {
        console.error('批量禁用resource错误:', error);
        sendError(res, 'DISABLE_FAILED', error.message || '批量禁用resource失败', 500);
    }
});

/**
 * @swagger
 * /api/resource/del:
 *   post:
 *     summary: 批量删除resource
 *     tags: [Resources]
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
 *                 description: resource ID列表
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

        const result = await batchLogicalDelete('resource', idList);
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData
        }, result.message);

    } catch (error) {
        console.error('批量删除resource错误:', error);
        sendError(res, 'DELETE_FAILED', error.message || '批量删除resource失败', 500);
    }
});

/**
 * @swagger
 * /api/resource/page:
 *   get:
 *     summary: 分页查询resource列表
 *     tags: [Resources]
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
 *         name: applicationCodeList
 *         schema:
 *           type: string
 *         description: application code列表（逗号分隔，如：PLAN,WORKOUT）
 *       - in: query
 *         name: genderCode
 *         schema:
 *           type: string
 *           enum: [FEMALE, MALE]
 *         description: 性别code
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
            applicationCodeList,
            genderCode,
            orderBy,
            orderDirection
        } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        if (applicationCodeList) queryParams.applicationCodeList = parseArrayParam(applicationCodeList);

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
                const idCheckSql = `SELECT COUNT(*) as count FROM resource WHERE id = ? AND is_deleted = 0`;
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
                    if (queryParams.applicationCodeList && queryParams.applicationCodeList.length > 0) {
                        conditionBuilder.addArrayCondition('application_code', queryParams.applicationCodeList);
                    }
                    if (genderCode) {
                        conditionBuilder.addStringCondition('gender_code', genderCode, 'exact');
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
            if (queryParams.applicationCodeList && queryParams.applicationCodeList.length > 0) {
                conditionBuilder.addArrayCondition('application_code', queryParams.applicationCodeList);
            }

            // 单个参数
            if (genderCode) {
                conditionBuilder.addStringCondition('gender_code', genderCode, 'exact');
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
        const result = await BusinessHelper.paginateWithValidation('resource', { query: req.query }, options);

        if (result.success) {
            res.json(result);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('分页查询resource错误:', error);
        sendError(res, 'QUERY_FAILED', '分页查询resource失败', 500);
    }
});

/**
 * @swagger
 * /api/resource/detail/{id}:
 *   get:
 *     summary: 获取resource详情
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: resource ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: resource不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 'INVALID_PARAMS', '无效的resource ID', 400);
        }

        const resourceId = parseInt(id);

        // 查询resource信息
        const resourceResult = await BusinessHelper.findByIdWithValidation('resource', resourceId, { is_deleted: 0 });

        if (!resourceResult.success) {
            return sendError(res, resourceResult.error, resourceResult.message, resourceResult.statusCode || 404);
        }

        sendSuccess(res, resourceResult.data, '获取resource详情成功');

    } catch (error) {
        console.error('获取resource详情错误:', error);
        sendError(res, 'QUERY_FAILED', '获取resource详情失败', 500);
    }
});

module.exports = router;
