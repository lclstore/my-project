


const express = require('express');
const { sendSuccess, sendError } = require('../utils/response');
const { ERROR_CODES } = require('../utils/response');
const {
    BusinessHelper
} = require('../config/database');
const { validateApiData } = require('../utils/validator');

const router = express.Router();

/**
 * @swagger
 * /api/publish/publish:
 *   post:
 *     summary: 新增发布记录
 *     description: 创建新的发布记录，操作人从token中获取
 *     tags: [Publish]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - env
 *               - status
 *             properties:
 *               env:
 *                 type: string
 *                 enum: [PRODUCTION, PRE_PRODUCTION]
 *                 description: 环境
 *                 example: "PRE_PRODUCTION"
 *               remark:
 *                 type: string
 *                 description: 说明
 *                 example: "修复登录问题"
 *               status:
 *                 type: string
 *                 enum: [WAITTING, SUCCESS, FAIL, PROCESSING]
 *                 description: 状态
 *                 example: "WAITTING"
 *     responses:
 *       200:
 *         description: 新增发布记录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "新增发布记录成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 版本号已存在
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
router.post('/publish', async (req, res) => {
    try {
        const { env, remark } = req.body;
        const createUser = req.user.userId; // 从token中获取用户ID
        // 准备插入数据
        const publishData = {
            env,
            remark: remark || null,
            status: 'SUCCESS', // 默认为成功
            createUser
        };
        // 使用validator库进行参数验证
        const validationResult = validateApiData('publish', publishData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }



        // 使用BusinessHelper插入数据
        const result = await BusinessHelper.insertWithValidation(
            'publish',
            publishData
        );

        if (result.success) {
            sendSuccess(res, { version: result.insertId }, '新增发布记录成功');
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('新增发布记录错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '新增发布记录失败', 500);
    }
});

/**
 * @swagger
 * /api/publish/page:
 *   get:
 *     summary: 分页获取发布记录列表
 *     description: 分页获取发布记录列表，操作人显示为邮箱
 *     tags: [Publish]
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
 *         name: env
 *         schema:
 *           type: string
 *           enum: [PRODUCTION, PRE_PRODUCTION]
 *         description: 环境筛选
 *         example: "PRE_PRODUCTION"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [WAITTING, SUCCESS, FAIL, PROCESSING]
 *         description: 状态筛选
 *         example: "SUCCESS"
 *     responses:
 *       200:
 *         description: 获取发布记录列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "获取发布记录列表成功"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       version:
 *                         type: integer
 *                         example: 1
 *                       env:
 *                         type: string
 *                         example: "PRE_PRODUCTION"
 *                       remark:
 *                         type: string
 *                         nullable: true
 *                         example: "修复登录问题"
 *                       status:
 *                         type: string
 *                         example: "SUCCESS"
 *                       createUser:
 *                         type: string
 *                         description: 操作人邮箱
 *                         example: "admin@example.com"
 *                       createTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-08T15:39:10.000Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 未授权
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
        const { orderBy, orderDirection } = req.query;
        const orderByName = orderBy === 'id' ? 'p.version' : `p.${orderBy}`; // 处理排序字段：id映射到version

        // 使用 BusinessHelper.paginateWithValidation 的自定义SQL功能来优化查询
        const result = await BusinessHelper.paginateWithValidation(
            'publish',
            req,
            {
                // 自定义计数查询
                customCountSql: 'SELECT COUNT(*) as total FROM publish',
                countParams: [],

                // 自定义数据查询（使用LEFT JOIN优化，避免N+1查询问题）
                customSql: `
                    SELECT
                        p.version,
                        p.env,
                        p.remark,
                        p.status,
                        u.email as createUser,
                        p.create_time
                    FROM publish p
                    LEFT JOIN user u ON p.create_user = u.id
                    ORDER BY ${orderByName} ${orderDirection || 'DESC'}
                    LIMIT ? OFFSET ?
                `,
                sqlParams: [] // 额外的SQL参数（除了LIMIT和OFFSET）
            }
        );

        if (result.success) {
            res.json(result.data);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('获取发布记录列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '获取发布记录列表失败', 500);
    }
});

module.exports = router;
