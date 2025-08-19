/**
 * OpLogs 操作日志管理接口
 */

const express = require('express');
const router = express.Router();
const { BusinessHelper, DatabaseHelper, query } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { convertToFrontendFormat, toSnakeCase } = require('../utils/fieldConverter');
const { parseArrayParam } = require('../utils/paramHelper');
const { QueryConditionBuilder } = require('../utils/enumHelper');

/**
 * @swagger
 * /api/opLogs/page:
 *   get:
 *     summary: 分页查询操作日志列表
 *     tags: [OpLogs]
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
 *         description: 关键词搜索（支持ID精确匹配和业务类型、操作人模糊搜索）
 *       - in: query
 *         name: bizType
 *         schema:
 *           type: string
 *         description: 业务类型列表（逗号分隔）
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: operationTime
 *         description: 排序字段（如：id, operationTime, createTime）
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
 *                         description: 主键ID
 *                       bizType:
 *                         type: string
 *                         description: 业务类型
 *                       dataId:
 *                         type: integer
 *                         description: 数据ID
 *                       dataInfo:
 *                         type: string
 *                         description: 数据信息
 *                       operationType:
 *                         type: string
 *                         description: 操作类型
 *                       dataAfter:
 *                         type: string
 *                         description: 操作后数据
 *                       operationUser:
 *                         type: string
 *                         description: 操作人邮箱（通过用户ID查询获得）
 *                       operationTime:
 *                         type: string
 *                         format: date-time
 *                         description: 操作时间
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
            bizType,
            orderBy,
            orderDirection
        } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (bizType) {
            // 将前端的连字符格式转换为数据库的下划线格式
            const bizTypeArray = parseArrayParam(bizType);
            queryParams.bizType = bizTypeArray.map(type => type.replace(/-/g, '_'));
        }

        // 转换排序字段名：前端字段名(camelCase) -> 数据库字段名(snake_case)
        const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'operation_time';
        const dbOrderDirection = orderDirection || 'desc';

        // 构建查询条件
        const conditionBuilder = new QueryConditionBuilder();

        // 添加关键词搜索条件（智能搜索：纯数字先ID匹配，无结果则多字段搜索）
        if (keywords && keywords.trim()) {
            const trimmedKeywords = keywords.trim();

            // 检查是否为纯数字（ID精确匹配）
            if (/^\d+$/.test(trimmedKeywords)) {
                // 先按ID精确匹配
                conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));

                // 检查ID匹配是否有结果，如果没有则按多字段模糊搜索
                const idCheckSql = `SELECT COUNT(*) as count FROM op_logs WHERE id = ?`;
                const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);

                if (idCheckResult[0].count === 0) {
                    // ID没有匹配结果，重置条件构建器，改为多字段模糊搜索
                    conditionBuilder.reset();

                    // 重新添加其他筛选条件
                    if (queryParams.bizType && queryParams.bizType.length > 0) {
                        conditionBuilder.addArrayCondition('biz_type', queryParams.bizType);
                    }

                    // 添加多字段模糊搜索（业务类型、操作人、数据信息）
                    conditionBuilder.addCondition(
                        '(biz_type LIKE ? OR operation_user LIKE ? OR data_info LIKE ?)',
                        [`%${trimmedKeywords}%`, `%${trimmedKeywords}%`, `%${trimmedKeywords}%`]
                    );
                }
            } else {
                // 非纯数字（包含文本或混合），按多字段模糊搜索
                conditionBuilder.addCondition(
                    '(biz_type LIKE ? OR operation_user LIKE ? OR data_info LIKE ?)',
                    [`%${trimmedKeywords}%`, `%${trimmedKeywords}%`, `%${trimmedKeywords}%`]
                );
            }
        }

        // 添加其他筛选条件（如果没有关键词搜索或关键词搜索为非纯数字）
        if (!keywords || !/^\d+$/.test(keywords.trim())) {
            // 数组参数
            if (queryParams.bizType && queryParams.bizType.length > 0) {
                conditionBuilder.addArrayCondition('biz_type', queryParams.bizType);
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
            pageIndex: parseInt(pageIndex)
        };

        // 构建WHERE条件用于自定义SQL
        let whereClause = '';
        let sqlParams = [];

        if (where) {
            whereClause = `WHERE ${where}`;
            sqlParams = params;
        }

        // 使用连表查询获取用户email
        const customOptions = {
            // 自定义计数查询
            customCountSql: `
                SELECT COUNT(*) as total
                FROM op_logs ol
                LEFT JOIN user u ON ol.operation_user REGEXP '^[0-9]+$' AND u.id = CAST(ol.operation_user AS UNSIGNED)
                ${whereClause}
            `,
            countParams: sqlParams,

            // 自定义数据查询（使用LEFT JOIN连表查询用户email）
            customSql: `
                SELECT
                    ol.*,
                    CASE
                        WHEN ol.operation_user REGEXP '^[0-9]+$' THEN COALESCE(u.email, CONCAT('用户ID:', ol.operation_user))
                        ELSE ol.operation_user
                    END as email
                FROM op_logs ol
                LEFT JOIN user u ON ol.operation_user REGEXP '^[0-9]+$' AND u.id = CAST(ol.operation_user AS UNSIGNED)
                ${whereClause}
                ORDER BY ${options.orderBy || 'ol.id DESC'}
                LIMIT ? OFFSET ?
            `,
            sqlParams: sqlParams
        };

        // 使用BusinessHelper进行分页查询
        const result = await BusinessHelper.paginateWithValidation('op_logs', { query: req.query }, customOptions);

        if (result.success) {
            // 转换字段名，将email替换为operationUser
            const enhancedData = result.data.data.map(item => {
                const { email, ...rest } = item;
                return {
                    ...rest,
                    operationUser: email || item.operationUser
                };
            });

            // 返回增强后的结果
            res.json({
                ...result.data,
                data: enhancedData
            });
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('分页查询操作日志错误:', error);
        sendError(res, 'QUERY_FAILED', '分页查询操作日志失败', 500);
    }
});

/**
 * @swagger
 * /api/opLogs/detail/{id}:
 *   get:
 *     summary: 获取操作日志详情
 *     tags: [OpLogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 操作日志ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: 操作日志不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 'INVALID_PARAMS', '无效的操作日志ID', 400);
        }

        const opLogId = parseInt(id);

        // 使用连表查询获取操作日志详情和用户email
        const detailSql = `
            SELECT
                ol.*,
                CASE
                    WHEN ol.operation_user REGEXP '^[0-9]+$' THEN COALESCE(u.email, CONCAT('用户ID:', ol.operation_user))
                    ELSE ol.operation_user
                END as email
            FROM op_logs ol
            LEFT JOIN user u ON ol.operation_user REGEXP '^[0-9]+$' AND u.id = CAST(ol.operation_user AS UNSIGNED)
            WHERE ol.id = ?
        `;

        const detailResult = await query(detailSql, [opLogId]);

        if (!detailResult || detailResult.length === 0) {
            return sendError(res, 'NOT_FOUND', '操作日志不存在', 404);
        }

        const opLogData = detailResult[0];

        // 转换字段格式
        const enhancedData = convertToFrontendFormat({
            ...opLogData,
            operationUser: opLogData.email || opLogData.operation_user
        });

        // 移除临时字段
        delete enhancedData.email;

        sendSuccess(res, enhancedData, '获取操作日志详情成功');

    } catch (error) {
        console.error('获取操作日志详情错误:', error);
        sendError(res, 'QUERY_FAILED', '获取操作日志详情失败', 500);
    }
});

module.exports = router;
