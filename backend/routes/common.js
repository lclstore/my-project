/**
 * Common 公共接口模块
 */

const express = require('express');
const router = express.Router();
const { DatabaseHelper } = require('../config/database');
const { sendSuccess, sendError, ERROR_CODES } = require('../utils/response');

/**
 * @swagger
 * components:
 *   schemas:
 *     Language:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 主键ID
 *           example: 1
 *         code:
 *           type: string
 *           description: 语言编码
 *           example: "zh-CN"
 *         name:
 *           type: string
 *           description: 语言名称
 *           example: "中文"
 *         createTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *           example: "2025-01-15T10:30:00Z"
 *     LanguageListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             type: string
 *           description: 语言编码数组
 *           example: ["zh-CN", "en-US", "ja-JP", "ko-KR", "es-ES"]
 *         message:
 *           type: string
 *           example: "查询语言列表成功"
 *         errCode:
 *           type: string
 *           nullable: true
 *           example: null
 *         errMessage:
 *           type: string
 *           nullable: true
 *           example: null
 */

/**
 * @swagger
 * /api/common/language/list:
 *   get:
 *     summary: 查询语言列表
 *     description: |
 *       获取系统支持的所有语言列表，用于前端语言选择器等场景。
 *       返回所有可用的语言编码和名称。
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LanguageListResponse'
 *             example:
 *               success: true
 *               data: ["zh-CN", "en-US", "ja-JP", "ko-KR", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-PT", "ru-RU"]
 *               message: "查询语言列表成功"
 *               errCode: null
 *               errMessage: null
 *       500:
 *         description: 服务器错误
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
 *                   example: "INTERNAL_ERROR"
 *                 errMessage:
 *                   type: string
 *                   example: "查询语言列表失败"
 */
router.get('/language/list', async (req, res) => {
    try {
        // 使用BusinessHelper查询语言数据
        const options = {
            fields: 'code'
        };

        const result = await DatabaseHelper.select('language', options);

        if (!result.success) {
            return sendError(res, ERROR_CODES.INTERNAL_ERROR, result.message || '查询语言列表失败', 500);
        }

        // 提取code字段，返回字符串数组格式 ['en', 'de', 'fr']
        const languageCodes = result.data.map(item => item.code);

        sendSuccess(res, languageCodes);

    } catch (error) {
        console.error('查询语言列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询语言列表失败', 500);
    }
});

module.exports = router;
