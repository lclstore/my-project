const express = require('express');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/database');
const { ERROR_CODES, sendSuccess, sendError } = require('../utils/response');
const { verifyToken } = require('../middleware/auth');
const { addToBlacklist, getTokenExpiresIn } = require('../utils/tokenBlacklist');

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
router.post('/logout', verifyToken, (req, res) => {
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

module.exports = router;
