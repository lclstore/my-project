const express = require('express');
const jwt = require('jsonwebtoken');
const { queryOne, queryOneWithConversion, BusinessHelper } = require('../config/database');
const { ERROR_CODES, sendSuccess, sendError } = require('../utils/response');
const { addToBlacklist, getTokenExpiresIn } = require('../utils/tokenBlacklist');
const { validateApiData } = require('../utils/validator');

const router = express.Router();
// 生成JWT Token
const generateToken = (userId, email) => {
    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};
/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户通过邮箱和密码登录系统，返回JWT令牌和用户信息
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "liuchenglong@laien.io"
 *             password: "e10adc3949ba59abbe56e057f20f883e"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 errCode:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 errMessage:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT访问令牌
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     id:
 *                       type: integer
 *                       description: 用户ID
 *                       example: 103
 *                     email:
 *                       type: string
 *                       description: 用户邮箱
 *                       example: "liuchenglong@laien.io"
 *                     name:
 *                       type: string
 *                       description: 用户名称
 *                       example: "lcl012310y"
 *                     avatar:
 *                       type: string
 *                       description: 用户头像URL
 *                       example: "https://amber.7mfitness.com/user/image/22049bdd-e6ee-49a3-a16e-0b4e387b6304.png"
 *                     status:
 *                       type: string
 *                       description: 用户状态
 *                       example: "ENABLED"
 *                     type:
 *                       type: string
 *                       description: 用户类型
 *                       example: "ADMIN"
 *                     createTime:
 *                       type: string
 *                       description: 创建时间
 *                       example: "2025-06-05 09:27:06"
 *                     createUser:
 *                       type: string
 *                       description: 创建者
 *                       example: "admin"
 *                 message:
 *                   type: string
 *                   example: "登录成功"
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errCode:
 *                   type: string
 *                   example: "MISSING_REQUIRED_FIELDS"
 *                 errMessage:
 *                   type: string
 *                   example: "邮箱和密码不能为空"
 *                 data:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: 认证失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errCode:
 *                   type: string
 *                   example: "INVALID_CREDENTIALS"
 *                 errMessage:
 *                   type: string
 *                   example: "用户名或密码错误"
 *                 data:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// 登录接口
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return sendError(res, ERROR_CODES.MISSING_REQUIRED_FIELDS, '邮箱和密码不能为空', 400);
        }

        // 查找用户
        const user = await queryOne(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        if (!user) {
            return sendError(res, ERROR_CODES.USER_NOT_FOUND, '用户不存在', 401);
        }

        // 验证密码（前端已MD5加密）
        // 前端传来的password已经是MD5加密后的字符串，直接与数据库比较
        if (password !== user.password) {
            return sendError(res, ERROR_CODES.INVALID_CREDENTIALS, '用户名或密码错误', 401);
        }

        // 生成Token
        const token = generateToken(user.id, user.email);

        // 返回成功响应
        sendSuccess(res, {
            token,
            ...user
        }, '登录成功');

    } catch (error) {
        console.error('登录错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '服务器内部错误', 500);
    }
});

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: 用户退出登录
 *     description: 用户退出登录系统，清除客户端令牌
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 退出登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 errCode:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 errMessage:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: "退出登录成功"
 *       401:
 *         description: 认证失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errCode:
 *                   type: string
 *                   example: "MISSING_TOKEN"
 *                 errMessage:
 *                   type: string
 *                   example: "缺少认证令牌"
 *                 data:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 退出登录接口
router.post('/logout', (req, res) => {
    try {
        // 从请求头获取token
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

        // 获取token的剩余过期时间
        const expiresIn = getTokenExpiresIn(token);

        // 将token添加到黑名单
        addToBlacklist(token, expiresIn);

        console.log(`用户 ${req.user.email} 退出登录，token已加入黑名单`);

        sendSuccess(res, null, '退出登录成功');
    } catch (error) {
        console.error('退出登录错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '服务器内部错误', 500);
    }
});

/**
 * @swagger
 * /api/user/getMyInfo:
 *   get:
 *     summary: 获取当前用户信息
 *     description: 获取当前登录用户的详细信息
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取用户信息成功
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
 *                   example: "获取用户信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "lcl"
 *                     email:
 *                       type: string
 *                       example: "liuchenglong@laien.io"
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/avatar.jpg"
 *                     type:
 *                       type: string
 *                       example: "ADMIN"
 *                     status:
 *                       type: string
 *                       example: "ENABLED"
 *                     createUser:
 *                       type: string
 *                       example: "admin"
 *                     createTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-08T15:39:10.000Z"
 *                     updateTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-08T15:39:10.000Z"
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
// 获取当前用户信息接口
router.get('/getMyInfo', async (req, res) => {
    try {
        // 从数据库获取用户详细信息（自动转换字段命名）
        const user = await queryOneWithConversion(
            'SELECT  * FROM user WHERE id = ?',
            [req.user.userId]
        );

        if (!user) {
            return sendError(res, ERROR_CODES.USER_NOT_FOUND, '用户不存在', 404);
        }

        // 返回用户信息（字段已自动转换为 camelCase）
        sendSuccess(res, user);

    } catch (error) {
        console.error('获取用户信息错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '服务器内部错误', 500);
    }
});

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: 根据ID获取用户信息
 *     description: 根据用户ID获取指定用户的详细信息，需要token验证
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 获取用户信息成功
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
 *                   example: "获取用户信息成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "lcl"
 *                     email:
 *                       type: string
 *                       example: "liuchenglong@laien.io"
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/avatar.jpg"
 *                     type:
 *                       type: string
 *                       example: "ADMIN"
 *                     status:
 *                       type: string
 *                       example: "ENABLED"
 *                     createUser:
 *                       type: string
 *                       example: "admin"
 *                     createTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-08T15:39:10.000Z"
 *                     updateTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-08T15:39:10.000Z"
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
 *       404:
 *         description: 用户不存在
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

        // 验证ID参数
        if (!id || isNaN(parseInt(id))) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '用户ID必须是有效的数字', 400);
        }

        const userId = parseInt(id);

        // 从数据库获取用户详细信息（排除密码字段，自动转换字段命名）
        const user = await queryOneWithConversion(
            'SELECT id, name, email, avatar, type, status, create_user, create_time, update_time FROM user WHERE id = ?',
            [userId]
        );

        if (!user) {
            return sendError(res, ERROR_CODES.USER_NOT_FOUND, '用户不存在', 404);
        }

        // 返回用户信息（字段已自动转换为 camelCase）
        sendSuccess(res, user);

    } catch (error) {
        console.error('获取用户信息错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '获取用户信息失败', 500);
    }
});

/**
 * @swagger
 * /api/user/page:
 *   get:
 *     summary: 分页获取用户列表
 *     description: 分页获取用户列表，支持关键词搜索（姓名或邮箱）
 *     tags: [User]
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
 *         description: 搜索关键词（支持姓名或邮箱模糊搜索，包含@符号按邮箱搜索，否则按姓名搜索）
 *         example: "lcl"
 *     responses:
 *       200:
 *         description: 获取用户列表成功
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
 *                   example: "获取用户列表成功"
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
 *                         example: "lcl"
 *                       email:
 *                         type: string
 *                         example: "liuchenglong@laien.io"
 *                       avatar:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       type:
 *                         type: string
 *                         example: "ADMIN"
 *                       status:
 *                         type: string
 *                         example: "ENABLED"
 *                       createUser:
 *                         type: string
 *                         example: "admin"
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
        const { keywords } = req.query;

        // 构建查询条件
        let whereClause = '';
        let whereParams = [];

        if (keywords) {
            if (keywords.includes('@')) {
                // 包含@符号，按邮箱搜索
                whereClause = 'email LIKE ?';
                whereParams = [`%${keywords}%`];
            } else {
                // 不包含@符号，按姓名搜索
                whereClause = 'name LIKE ?';
                whereParams = [`%${keywords}%`];
            }
        }

        // 使用公共业务逻辑处理分页查询
        const result = await BusinessHelper.paginateWithValidation(
            'user',
            req,
            {
                where: whereClause,
                whereParams: whereParams,
                orderBy: 'create_time DESC',
                fields: 'id, name, email, avatar, type, status, create_user, create_time, update_time' // 排除密码字段
            }
        );

        if (result.success) {
            res.json(result);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('获取用户列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '获取用户列表失败', 500);
    }
});

/**
 * @swagger
 * /api/user/add:
 *   post:
 *     summary: 添加新用户
 *     description: 添加新用户到系统中
 *     tags: [User]
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
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用户姓名
 *                 example: "张三"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *                 example: "zhangsan@example.com"
 *               password:
 *                 type: string
 *                 pattern: "^[a-f0-9]{32}$"
 *                 description: 用户密码（MD5加密后的32位十六进制字符串）
 *                 example: "e10adc3949ba59abbe56e057f20f883e"
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 description: 用户头像URL
 *                 example: "https://example.com/avatar.jpg"
 *               type:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *                 description: 用户类型（可选，默认为USER）
 *                 example: "USER"
 *               status:
 *                 type: string
 *                 enum: [ENABLED, DISABLED]
 *                 description: 用户状态（可选，默认为ENABLED）
 *                 example: "ENABLED"
 *     responses:
 *       200:
 *         description: 添加用户成功
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
 *                   example: "添加用户成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
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
 *         description: 邮箱已存在
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
router.post('/add', async (req, res) => {
    try {
        const { name, email, password, avatar, type, status } = req.body;

        // 使用validator库进行参数验证
        const validationResult = validateApiData('user', req.body);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        // 检查邮箱是否已存在
        const existingUser = await queryOne(
            'SELECT id FROM user WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return sendError(res, ERROR_CODES.USER_ALREADY_EXISTS, '邮箱已存在', 409);
        }

        // 准备插入数据
        const userData = {
            name,
            email,
            password, // 前端传来的密码（可能是明文或MD5）
            avatar: avatar || null,
            type: type || 'USER', // 默认为普通用户
            status: status || 'ENABLED', // 默认为启用状态
            create_user: req.user.email || 'system' // 使用当前登录用户作为创建者
        };

        // 使用BusinessHelper插入数据
        const result = await BusinessHelper.insertWithValidation(
            'user',
            userData
        );

        if (result.success) {
            sendSuccess(res, result.data, '添加用户成功');
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('添加用户错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '添加用户失败', 500);
    }
});


/**
 * @swagger
 * /api/user/update:
 *   post:
 *     summary: 更新用户信息
 *     description: 根据用户ID更新用户信息，需要管理员权限
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用户姓名
 *                 example: "李四"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *                 example: "lisi@example.com"
 *               password:
 *                 type: string
 *                 pattern: "^[a-f0-9]{32}$"
 *                 description: 用户密码（MD5加密后的32位十六进制字符串，可选）
 *                 example: "e10adc3949ba59abbe56e057f20f883e"
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 description: 用户头像URL
 *                 example: "https://example.com/new-avatar.jpg"
 *               type:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *                 description: 用户类型
 *                 example: "USER"
 *               status:
 *                 type: string
 *                 enum: [ENABLED, DISABLED]
 *                 description: 用户状态
 *                 example: "ENABLED"
 *     responses:
 *       200:
 *         description: 更新用户成功
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
 *                   example: "更新用户成功"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
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
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 邮箱已存在
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
router.post('/update', async (req, res) => {
    try {

        const { name, email, password, avatar, type, status, id } = req.body;

        // 验证ID参数
        if (!id || isNaN(parseInt(id))) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '用户ID必须是有效的数字', 400);
        }

        const userId = parseInt(id);

        // 构建更新数据 - 前端传什么就更新什么
        const updateData = req.body;


        // 使用BusinessHelper更新数据
        const result = await BusinessHelper.updateWithValidation(
            'user',
            userId,
            updateData
        );

        if (result.success) {
            sendSuccess(res, null, '更新用户成功');
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('更新用户错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '更新用户失败', 500);
    }
});

/**
 * @swagger
 * /api/user/enable:
 *   post:
 *     summary: 批量启用用户
 *     description: 批量启用指定用户账户，将用户状态设置为ENABLED
 *     tags: [User]
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
 *                 description: 用户ID数组
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 批量启用用户成功
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
 *                   example: "批量启用用户成功"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
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
router.post('/enable', async (req, res) => {
    try {
        const { idList } = req.body;

        // 验证idList参数
        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList必须是非空数组', 400);
        }

        // 验证数组中的每个ID都是有效数字
        for (const id of idList) {
            if (!id || isNaN(parseInt(id))) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '用户ID必须是有效的数字', 400);
            }
        }

        // 批量更新用户状态
        const { DatabaseHelper } = require('../config/database');
        const placeholders = idList.map(() => '?').join(',');
        const result = await DatabaseHelper.update(
            'user',
            { status: 'ENABLED' },
            `id IN (${placeholders})`,
            idList
        );

        if (result.success && result.affectedRows > 0) {
            sendSuccess(res, { affectedRows: result.affectedRows }, '批量启用用户成功');
        } else {
            sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量启用用户失败', 500);
        }

    } catch (error) {
        console.error('批量启用用户错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量启用用户失败', 500);
    }
});

/**
 * @swagger
 * /api/user/disable:
 *   post:
 *     summary: 批量禁用用户
 *     description: 批量禁用指定用户账户，将用户状态设置为DISABLED
 *     tags: [User]
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
 *                 description: 用户ID数组
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 批量禁用用户成功
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
 *                   example: "批量禁用用户成功"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
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
router.post('/disable', async (req, res) => {
    try {
        const { idList } = req.body;

        // 验证idList参数
        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList必须是非空数组', 400);
        }

        // 验证数组中的每个ID都是有效数字
        for (const id of idList) {
            if (!id || isNaN(parseInt(id))) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '用户ID必须是有效的数字', 400);
            }
        }

        // 防止禁用自己
        if (idList.includes(req.user.userId)) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '不能禁用自己的账户', 400);
        }

        // 批量更新用户状态
        const { DatabaseHelper } = require('../config/database');
        const placeholders = idList.map(() => '?').join(',');
        const result = await DatabaseHelper.update(
            'user',
            { status: 'DISABLED' },
            `id IN (${placeholders})`,
            idList
        );

        if (result.success && result.affectedRows > 0) {
            sendSuccess(res, { affectedRows: result.affectedRows }, '批量禁用用户成功');
        } else {
            sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量禁用用户失败', 500);
        }

    } catch (error) {
        console.error('批量禁用用户错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量禁用用户失败', 500);
    }
});

/**
 * @swagger
 * /api/user/profileSave:
 *   post:
 *     summary: 修改个人信息
 *     description: 用户修改自己的个人信息，用户ID从token中获取
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用户姓名
 *                 example: "张三"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *                 example: "zhangsan@example.com"
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 description: 用户头像URL
 *                 example: "https://example.com/avatar.jpg"
 *               password:
 *                 type: string
 *                 pattern: "^[a-f0-9]{32}$"
 *                 description: 新密码（MD5加密后的32位十六进制字符串，可选）
 *                 example: "e10adc3949ba59abbe56e057f20f883e"
 *     responses:
 *       200:
 *         description: 修改个人信息成功
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
 *                   example: "修改个人信息成功"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
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
 *         description: 邮箱已存在
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
router.post('/profileSave', async (req, res) => {
    try {
        const { name, email, avatar, password } = req.body;
        const userId = req.user.userId; // 从token中获取用户ID

        // 构建更新数据 - 只更新提供的字段
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (password !== undefined) updateData.password = password;

        // 处理邮箱更新（需要检查唯一性）
        if (email !== undefined) {
            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return sendError(res, ERROR_CODES.INVALID_CREDENTIALS, '邮箱格式不正确', 400);
            }

            // 检查邮箱是否被其他用户使用
            const emailExists = await queryOne(
                'SELECT id FROM user WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (emailExists) {
                return sendError(res, ERROR_CODES.USER_ALREADY_EXISTS, '邮箱已被其他用户使用', 409);
            }

            updateData.email = email;
        }

        // 如果没有要更新的数据
        if (Object.keys(updateData).length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '没有提供要更新的数据', 400);
        }

        // 使用BusinessHelper更新数据
        const result = await BusinessHelper.updateWithValidation(
            'user',
            userId,
            updateData
        );

        if (result.success) {
            sendSuccess(res, null, '修改个人信息成功');
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('修改个人信息错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '修改个人信息失败', 500);
    }
});

module.exports = router;
