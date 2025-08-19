const express = require('express');
const { sendSuccess, sendError } = require('../utils/response');
const {
    queryOneWithConversion,
    BusinessHelper
} = require('../config/database');
const router = express.Router();

/**
 * @swagger
 * /api/home/info:
 *   get:
 *     summary: 获取应用信息
 *     description: 获取应用基本信息，需要token验证
 *     tags: [Home]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取应用信息成功
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
 *                   example: "获取应用信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     appIcon:
 *                       type: string
 *                       example: "https://example.com/icon.png"
 *                     appStoreName:
 *                       type: string
 *                       example: "全栈应用系统"
 *                     appCode:
 *                       type: string
 *                       example: "fullstack-app"
 *                     createTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-01-01T00:00:00.000Z"
 *                     updateTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-01-02T00:00:00.000Z"
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 应用信息不存在
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
router.get('/info', async (req, res) => {
    try {
        // 获取应用信息通过id查询最后一条
        const appInfo = await queryOneWithConversion(
            'SELECT app_icon, app_store_name, app_code, create_time, update_time FROM app_info ORDER BY id DESC LIMIT 1'
        );
        // 返回应用信息（字段已自动转换为 camelCase）
        sendSuccess(res, appInfo, '获取应用信息成功');

    } catch (error) {
        console.error('获取应用信息错误:', error);
        sendError(res, 'INTERNAL_ERROR', '获取应用信息失败', 500);
    }
});

/**
 * @swagger
 * /api/home/save:
 *   post:
 *     summary: 保存应用信息
 *     description: 添加新的应用信息，所有字段都是必填的，需要token验证
 *     tags: [Home]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appIcon
 *               - appStoreName
 *             properties:
 *               appIcon:
 *                 type: string
 *                 description: 应用图标URL
 *                 example: "https://example.com/icon.png"
 *               appStoreName:
 *                 type: string
 *                 description: 应用商店名称
 *                 example: "全栈应用系统"
 *               appCode:
 *                 type: string
 *                 description: 应用代码（可选）
 *                 example: "fullstack-app"
 *     responses:
 *       200:
 *         description: 保存应用信息成功
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
 *                   example: "保存应用信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
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
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/save', async (req, res) => {
    // 使用接口级别的验证
    const result = await BusinessHelper.insertWithValidation(
        'app_info',
        req.body,
        [], // 不需要自定义验证，URL验证已在接口配置中定义
        'app_info' // 指定接口验证配置
    );

    if (result.success) {
        sendSuccess(res, result.data, result.message);
    } else {
        sendError(res, result.error, result.message, result.statusCode);
    }
});


/**
 * @swagger
 * /api/home/helps/page:
 *   get:
 *     summary: 获取帮助列表
 *     description: 分页获取帮助文档列表，需要token验证
 *     tags: [Home]
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
 *     responses:
 *       200:
 *         description: 获取帮助列表成功
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
 *                   example: "获取帮助列表成功"
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
 *                         example: "用户指南"
 *                       url:
 *                         type: string
 *                         example: "https://example.com/help/user-guide"
 *                       createTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-01-01T00:00:00.000Z"
 *                       updateTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-01-02T00:00:00.000Z"
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
router.get('/helps/page', async (req, res) => {

    // 使用公共业务逻辑处理分页查询
    const result = await BusinessHelper.paginateWithValidation(
        'app_help',
        req,
    );

    if (result.success) {
        res.json(result);
    } else {
        sendError(res, result.error, result.message, result.statusCode);
    }
});
/**
 * @swagger
 * /api/home/addHelps:
 *   post:
 *     summary: 添加帮助信息
 *     description: 添加新的帮助信息，需要token验证
 *     tags: [Home]
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
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 description: 帮助名称
 *                 example: "用户指南"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: 帮助链接
 *                 example: "https://example.com/help/user-guide"
 *     responses:
 *       200:
 *         description: 添加帮助信息成功
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
 *                   example: "添加帮助信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
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
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/addHelps', async (req, res) => {
    // 使用接口级别的验证
    const result = await BusinessHelper.insertWithValidation(
        'app_help',
        req.body,
        [], // 不需要自定义验证，URL验证已在接口配置中定义
        'app_help' // 指定接口验证配置
    );

    if (result.success) {
        sendSuccess(res, result.data, result.message);
    } else {
        sendError(res, result.error, result.message, result.statusCode);
    }
});

/**
 * @swagger
 * /api/home/changelogs/page:
 *   get:
 *     summary: 获取变更日志列表
 *     description: 分页获取应用变更日志列表，按创建时间倒序排列，需要token验证
 *     tags: [Home]
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
 *     responses:
 *       200:
 *         description: 获取变更日志列表成功
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
 *                   example: "获取变更日志列表成功"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       version:
 *                         type: string
 *                         example: "v1.0.0"
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2023-01-01"
 *                       newInfo:
 *                         type: string
 *                         example: "修复了登录问题，优化了性能"
 *                       createTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-01-01T00:00:00.000Z"
 *                       updateTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-01-02T00:00:00.000Z"
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
router.get('/changelogs/page', async (req, res) => {
    // 使用公共业务逻辑处理分页查询
    const result = await BusinessHelper.paginateWithValidation(
        'app_change_logs',
        req,
        {
            orderBy: 'create_time DESC',
            timeFormat: 'date'  // 指定时间格式：date = 年月日
        }
    );

    if (result.success) {
        // 临时调试：打印一下数据看看时间字段是否被正确转换
        res.json(result);
    } else {
        sendError(res, result.error, result.message, result.statusCode);
    }
});
/**
 * @swagger
 * /api/home/addChangeLogs:
 *   post:
 *     summary: 添加变更日志
 *     description: 添加新的应用变更日志，需要token验证
 *     tags: [Home]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *               - date
 *               - newInfo
 *             properties:
 *               version:
 *                 type: string
 *                 description: 版本号
 *                 example: "v1.0.0"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 变更日期
 *                 example: "2023-01-01"
 *               newInfo:
 *                 type: string
 *                 description: 新功能信息
 *                 example: "修复了登录问题，优化了性能"
 *     responses:
 *       200:
 *         description: 添加变更日志成功
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
 *                   example: "添加变更日志成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
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
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/addChangeLogs', async (req, res) => {
    // 使用接口级别的验证
    const result = await BusinessHelper.insertWithValidation(
        'app_change_logs',
        req.body,
        [],
        'app_change_logs' // 指定接口验证配置
    );

    if (result.success) {
        sendSuccess(res, result.data, result.message);
    } else {
        sendError(res, result.error, result.message, result.statusCode);
    }
});


module.exports = router;
