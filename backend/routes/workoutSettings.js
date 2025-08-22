/**
 * Workout Settings 路由
 * 管理训练设置的单例配置
 */

const express = require('express');
const { BusinessHelper, query } = require('../config/database');
const { sendSuccess, sendError, ERROR_CODES } = require('../utils/response');
const { validateApiData } = require('../utils/validator');
const { convertToFrontendFormatWithOptions } = require('../utils/fieldConverter');

// Manually implement toSnakeCase to ensure correctness
const toSnakeCase = (str) => {
    if (!str) return '';
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkoutSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 设置ID
 *           example: 1
 *         introVideoReps:
 *           type: integer
 *           description: intro video 次数
 *           example: 3
 *         introAudioBizSoundId:
 *           type: integer
 *           description: intro audio 对应 sound id
 *           example: 101
 *         introAudioStartTime:
 *           type: integer
 *           description: intro audio 开始时间(秒)
 *           example: 5
 *         introAudioClosed:
 *           type: boolean
 *           description: intro audio 是否可关闭
 *           example: true
 *         previewVideoReps:
 *           type: integer
 *           description: preview video 次数
 *           example: 2
 *         previewFirstAudioBizSoundId:
 *           type: integer
 *           description: preview first audio 对应 sound id
 *           example: 102
 *         previewFirstAudioStartTime:
 *           type: integer
 *           description: preview first audio 开始时间(秒)
 *           example: 3
 *         previewFirstAudioClosed:
 *           type: boolean
 *           description: preview first audio 是否可关闭
 *           example: false
 *         previewNextAudioBizSoundId:
 *           type: integer
 *           description: preview next audio 对应 sound id
 *           example: 103
 *         previewNextAudioStartTime:
 *           type: integer
 *           description: preview next audio 开始时间(秒)
 *           example: 2
 *         previewNextAudioClosed:
 *           type: boolean
 *           description: preview next audio 是否可关闭
 *           example: true
 *         previewLastAudioBizSoundId:
 *           type: integer
 *           description: preview last audio 对应 sound id
 *           example: 104
 *         previewLastAudioStartTime:
 *           type: integer
 *           description: preview last audio 开始时间(秒)
 *           example: 1
 *         previewLastAudioClosed:
 *           type: boolean
 *           description: preview last audio 是否可关闭
 *           example: true
 *         previewNameAudioStartTime:
 *           type: integer
 *           description: preview name audio 开始时间(秒)
 *           example: 0
 *         previewNameAudioClosed:
 *           type: boolean
 *           description: preview name audio 是否可关闭
 *           example: false
 *         previewThreeAudioBizSoundId:
 *           type: integer
 *           description: preview 3 audio 对应 sound id
 *           example: 105
 *         previewThreeAudioEndTime:
 *           type: integer
 *           description: preview 3 audio 结束时间(秒)
 *           example: 10
 *         previewThreeAudioClosed:
 *           type: boolean
 *           description: preview 3 audio 是否可关闭
 *           example: true
 *         previewTwoAudioBizSoundId:
 *           type: integer
 *           description: preview 2 audio 对应 sound id
 *           example: 106
 *         previewTwoAudioEndTime:
 *           type: integer
 *           description: preview 2 audio 结束时间(秒)
 *           example: 8
 *         previewTwoAudioClosed:
 *           type: boolean
 *           description: preview 2 audio 是否可关闭
 *           example: true
 *         previewOneAudioBizSoundId:
 *           type: integer
 *           description: preview 1 audio 对应 sound id
 *           example: 107
 *         previewOneAudioEndTime:
 *           type: integer
 *           description: preview 1 audio 结束时间(秒)
 *           example: 6
 *         previewOneAudioClosed:
 *           type: boolean
 *           description: preview 1 audio 是否可关闭
 *           example: true
 *         executionGoAudioBizSoundId:
 *           type: integer
 *           description: execution go audio 对应 sound id
 *           example: 108
 *         executionGoAudioStartTime:
 *           type: integer
 *           description: execution go audio 开始时间(秒)
 *           example: 0
 *         executionGoAudioClosed:
 *           type: boolean
 *           description: execution go audio 是否可关闭
 *           example: false
 *         executionVideoReps:
 *           type: integer
 *           description: execution video 次数
 *           example: 1
 *         executionGuidanceAudioStartTime:
 *           type: integer
 *           description: execution guidance audio 开始时间(秒)
 *           example: 5
 *         executionGuidanceAudioClosed:
 *           type: boolean
 *           description: execution guidance audio 是否可关闭
 *           example: true
 *         executionHalfwayAudioStartTime:
 *           type: integer
 *           description: execution halfway audio 开始时间(秒)
 *           example: 15
 *         executionHalfwayAudioClosed:
 *           type: boolean
 *           description: execution halfway audio 是否可关闭
 *           example: true
 *         executionThreeAudioBizSoundId:
 *           type: integer
 *           description: execution 3 audio 对应 sound id
 *           example: 109
 *         executionThreeAudioEndTime:
 *           type: integer
 *           description: execution 3 audio 结束时间(秒)
 *           example: 25
 *         executionThreeAudioClosed:
 *           type: boolean
 *           description: execution 3 audio 是否可关闭
 *           example: true
 *         executionTwoAudioBizSoundId:
 *           type: integer
 *           description: execution 2 audio 对应 sound id
 *           example: 110
 *         executionTwoAudioEndTime:
 *           type: integer
 *           description: execution 2 audio 结束时间(秒)
 *           example: 27
 *         executionTwoAudioClosed:
 *           type: boolean
 *           description: execution 2 audio 是否可关闭
 *           example: true
 *         executionOneAudioBizSoundId:
 *           type: integer
 *           description: execution 1 audio 对应 sound id
 *           example: 111
 *         executionOneAudioEndTime:
 *           type: integer
 *           description: execution 1 audio 结束时间(秒)
 *           example: 29
 *         executionOneAudioClosed:
 *           type: boolean
 *           description: execution 1 audio 是否可关闭
 *           example: true
 *         executionBeepAudioBizSoundId:
 *           type: integer
 *           description: execution beep audio 对应 sound id
 *           example: 112
 *         executionBeepAudioEndTime:
 *           type: integer
 *           description: execution beep audio 结束时间(秒)
 *           example: 30
 *         executionBeepAudioClosed:
 *           type: boolean
 *           description: execution beep audio 是否可关闭
 *           example: false
 *         executionRestAudioBizSoundId:
 *           type: integer
 *           description: execution rest audio 对应 sound id
 *           example: 113
 *         executionRestAudioEndTime:
 *           type: integer
 *           description: execution rest audio 结束时间(秒)
 *           example: 60
 *         executionRestAudioClosed:
 *           type: boolean
 *           description: execution rest audio 是否可关闭
 *           example: true
 *         executionHalfwayAudioBizSoundIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: execution halfway audio 对应 sound id 数组
 *           example: [114, 115, 116]
 *         introVideoCycleCode:
 *           type: string
 *           enum: [FRONT_TO_SIDE, SIDE_TO_FRONT]
 *           description: intro Video Cycle
 *           example: "FRONT_TO_SIDE"
 *         previewVideoCycleCode:
 *           type: string
 *           enum: [FRONT_TO_SIDE, SIDE_TO_FRONT]
 *           description: preview Video Cycle
 *           example: "SIDE_TO_FRONT"
 *         executionVideoCycleCode:
 *           type: string
 *           enum: [FRONT_TO_SIDE, SIDE_TO_FRONT]
 *           description: execution Video Cycle
 *           example: "FRONT_TO_SIDE"
 *         status:
 *           type: string
 *           enum: [ENABLED, DISABLED]
 *           description: 状态
 *           example: "ENABLED"
 *         createTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *           example: "2025-08-14T16:35:32.000Z"
 *         updateTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *           example: "2025-08-14T16:35:32.000Z"
 * 
 * /templateCms/web/workoutSettings/detail:
 *   get:
 *     summary: 查询训练设置详情
 *     description: |
 *       获取训练设置的详细信息。由于系统只维护一条设置记录，
 *       此接口返回当前的训练设置配置。如果没有设置记录，返回空数据。
 *     tags: [WorkoutSetttings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/WorkoutSettings'
 *                         - type: 'null'
 *             examples:
 *               with_data:
 *                 summary: 有设置数据
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     introVideoReps: 3
 *                     introAudioBizSoundId: 101
 *                     introAudioStartTime: 5
 *                     introAudioClosed: true
 *                     previewVideoReps: 2
 *                     status: "ENABLED"
 *                     createTime: "2025-08-14T16:35:32.000Z"
 *                     updateTime: "2025-08-14T16:35:32.000Z"
 *                   message: "查询训练设置成功"
 *               no_data:
 *                 summary: 无设置数据
 *                 value:
 *                   success: true
 *                   data: null
 *                   message: "暂无训练设置"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "INTERNAL_ERROR"
 *               errMessage: "查询训练设置失败"
 *               data: null
 */
router.get('/detail', async (req, res) => {
    try {
        // 查询训练设置（只会有一条记录）
        const sql = 'SELECT * FROM workout_setting WHERE is_deleted = 0 LIMIT 1';
        const results = await query(sql);

        if (results.length > 0) {
            // 转换字段名并排除 is_deleted 字段
            const convertedData = convertToFrontendFormatWithOptions(results[0], {
                timeFormat: 'datetime',
                excludeFields: ['is_deleted']
            });

            sendSuccess(res, convertedData, '查询训练设置成功');
        } else {
            sendSuccess(res, null, '暂无训练设置');
        }

    } catch (error) {
        console.error('查询训练设置错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询训练设置失败', 500);
    }
});

/**
 * @swagger
 * /templateCms/web/workoutSettings/save:
 *   post:
 *     summary: 保存训练设置
 *     description: |
 *       保存训练设置配置。由于系统只维护一条设置记录：
 *       - 如果没有记录，则创建新记录
 *       - 如果已有记录，则更新现有记录
 *     tags: [WorkoutSetttings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               introVideoReps:
 *                 type: integer
 *                 description: intro video 次数
 *                 example: 3
 *               introAudioBizSoundId:
 *                 type: integer
 *                 description: intro audio 对应 sound id
 *                 example: 101
 *               introAudioStartTime:
 *                 type: integer
 *                 description: intro audio 开始时间(秒)
 *                 example: 5
 *               introAudioClosed:
 *                 type: boolean
 *                 description: intro audio 是否可关闭
 *                 example: true
 *               previewVideoReps:
 *                 type: integer
 *                 description: preview video 次数
 *                 example: 2
 *               previewFirstAudioBizSoundId:
 *                 type: integer
 *                 description: preview first audio 对应 sound id
 *                 example: 102
 *               previewFirstAudioStartTime:
 *                 type: integer
 *                 description: preview first audio 开始时间(秒)
 *                 example: 3
 *               previewFirstAudioClosed:
 *                 type: boolean
 *                 description: preview first audio 是否可关闭
 *                 example: false
 *               previewNextAudioBizSoundId:
 *                 type: integer
 *                 description: preview next audio 对应 sound id
 *                 example: 103
 *               previewNextAudioStartTime:
 *                 type: integer
 *                 description: preview next audio 开始时间(秒)
 *                 example: 2
 *               previewNextAudioClosed:
 *                 type: boolean
 *                 description: preview next audio 是否可关闭
 *                 example: true
 *               previewLastAudioBizSoundId:
 *                 type: integer
 *                 description: preview last audio 对应 sound id
 *                 example: 104
 *               previewLastAudioStartTime:
 *                 type: integer
 *                 description: preview last audio 开始时间(秒)
 *                 example: 1
 *               previewLastAudioClosed:
 *                 type: boolean
 *                 description: preview last audio 是否可关闭
 *                 example: true
 *               previewNameAudioStartTime:
 *                 type: integer
 *                 description: preview name audio 开始时间(秒)
 *                 example: 0
 *               previewNameAudioClosed:
 *                 type: boolean
 *                 description: preview name audio 是否可关闭
 *                 example: false
 *               previewThreeAudioBizSoundId:
 *                 type: integer
 *                 description: preview 3 audio 对应 sound id
 *                 example: 105
 *               previewThreeAudioEndTime:
 *                 type: integer
 *                 description: preview 3 audio 结束时间(秒)
 *                 example: 10
 *               previewThreeAudioClosed:
 *                 type: boolean
 *                 description: preview 3 audio 是否可关闭
 *                 example: true
 *               previewTwoAudioBizSoundId:
 *                 type: integer
 *                 description: preview 2 audio 对应 sound id
 *                 example: 106
 *               previewTwoAudioEndTime:
 *                 type: integer
 *                 description: preview 2 audio 结束时间(秒)
 *                 example: 8
 *               previewTwoAudioClosed:
 *                 type: boolean
 *                 description: preview 2 audio 是否可关闭
 *                 example: true
 *               previewOneAudioBizSoundId:
 *                 type: integer
 *                 description: preview 1 audio 对应 sound id
 *                 example: 107
 *               previewOneAudioEndTime:
 *                 type: integer
 *                 description: preview 1 audio 结束时间(秒)
 *                 example: 6
 *               previewOneAudioClosed:
 *                 type: boolean
 *                 description: preview 1 audio 是否可关闭
 *                 example: true
 *               executionGoAudioBizSoundId:
 *                 type: integer
 *                 description: execution go audio 对应 sound id
 *                 example: 108
 *               executionGoAudioStartTime:
 *                 type: integer
 *                 description: execution go audio 开始时间(秒)
 *                 example: 0
 *               executionGoAudioClosed:
 *                 type: boolean
 *                 description: execution go audio 是否可关闭
 *                 example: false
 *               executionVideoReps:
 *                 type: integer
 *                 description: execution video 次数
 *                 example: 1
 *               executionGuidanceAudioStartTime:
 *                 type: integer
 *                 description: execution guidance audio 开始时间(秒)
 *                 example: 5
 *               executionGuidanceAudioClosed:
 *                 type: boolean
 *                 description: execution guidance audio 是否可关闭
 *                 example: true
 *               executionHalfwayAudioStartTime:
 *                 type: integer
 *                 description: execution halfway audio 开始时间(秒)
 *                 example: 15
 *               executionHalfwayAudioClosed:
 *                 type: boolean
 *                 description: execution halfway audio 是否可关闭
 *                 example: true
 *               executionThreeAudioBizSoundId:
 *                 type: integer
 *                 description: execution 3 audio 对应 sound id
 *                 example: 109
 *               executionThreeAudioEndTime:
 *                 type: integer
 *                 description: execution 3 audio 结束时间(秒)
 *                 example: 25
 *               executionThreeAudioClosed:
 *                 type: boolean
 *                 description: execution 3 audio 是否可关闭
 *                 example: true
 *               executionTwoAudioBizSoundId:
 *                 type: integer
 *                 description: execution 2 audio 对应 sound id
 *                 example: 110
 *               executionTwoAudioEndTime:
 *                 type: integer
 *                 description: execution 2 audio 结束时间(秒)
 *                 example: 27
 *               executionTwoAudioClosed:
 *                 type: boolean
 *                 description: execution 2 audio 是否可关闭
 *                 example: true
 *               executionOneAudioBizSoundId:
 *                 type: integer
 *                 description: execution 1 audio 对应 sound id
 *                 example: 111
 *               executionOneAudioEndTime:
 *                 type: integer
 *                 description: execution 1 audio 结束时间(秒)
 *                 example: 29
 *               executionOneAudioClosed:
 *                 type: boolean
 *                 description: execution 1 audio 是否可关闭
 *                 example: true
 *               executionBeepAudioBizSoundId:
 *                 type: integer
 *                 description: execution beep audio 对应 sound id
 *                 example: 112
 *               executionBeepAudioEndTime:
 *                 type: integer
 *                 description: execution beep audio 结束时间(秒)
 *                 example: 30
 *               executionBeepAudioClosed:
 *                 type: boolean
 *                 description: execution beep audio 是否可关闭
 *                 example: false
 *               executionRestAudioBizSoundId:
 *                 type: integer
 *                 description: execution rest audio 对应 sound id
 *                 example: 113
 *               executionRestAudioEndTime:
 *                 type: integer
 *                 description: execution rest audio 结束时间(秒)
 *                 example: 60
 *               executionRestAudioClosed:
 *                 type: boolean
 *                 description: execution rest audio 是否可关闭
 *                 example: true
 *               executionHalfwayAudioBizSoundIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: execution halfway audio 对应 sound id 数组
 *                 example: [114, 115, 116]
 *               introVideoCycleCode:
 *                 type: string
 *                 enum: [FRONT_TO_SIDE, SIDE_TO_FRONT]
 *                 description: intro Video Cycle
 *                 example: "FRONT_TO_SIDE"
 *               previewVideoCycleCode:
 *                 type: string
 *                 enum: [FRONT_TO_SIDE, SIDE_TO_FRONT]
 *                 description: preview Video Cycle
 *                 example: "SIDE_TO_FRONT"
 *               executionVideoCycleCode:
 *                 type: string
 *                 enum: [FRONT_TO_SIDE, SIDE_TO_FRONT]
 *                 description: execution Video Cycle
 *                 example: "FRONT_TO_SIDE"
 *               status:
 *                 type: string
 *                 enum: [ENABLED, DISABLED]
 *                 description: 状态
 *                 example: "ENABLED"
 *           examples:
 *             draft:
 *               summary: 草稿状态示例
 *               description: 创建草稿时只需要状态字段
 *               value:
 *                 status: "DRAFT"
 *             complete:
 *               summary: 完整配置示例
 *               description: 完整的训练设置配置
 *               value:
 *                 introVideoReps: 3
 *                 introAudioBizSoundId: 101
 *                 introAudioStartTime: 5
 *                 introAudioClosed: true
 *                 previewVideoReps: 2
 *                 previewFirstAudioBizSoundId: 102
 *                 previewFirstAudioStartTime: 3
 *                 previewFirstAudioClosed: false
 *                 executionGoAudioBizSoundId: 108
 *                 executionGoAudioStartTime: 0
 *                 executionGoAudioClosed: false
 *                 executionVideoReps: 1
 *                 executionHalfwayAudioBizSoundIds: [114, 115, 116]
 *                 introVideoCycleCode: "FRONT_TO_SIDE"
 *                 previewVideoCycleCode: "SIDE_TO_FRONT"
 *                 executionVideoCycleCode: "FRONT_TO_SIDE"
 *                 status: "ENABLED"
 *     responses:
 *       200:
 *         description: 保存成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: 设置ID
 *                           example: 1
 *             examples:
 *               create:
 *                 summary: 创建成功
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                   message: "创建训练设置成功"
 *               update:
 *                 summary: 更新成功
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                   message: "更新训练设置成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "INVALID_PARAMETERS"
 *               errMessage: "【status】为必填项"
 *               data: null
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "INTERNAL_ERROR"
 *               errMessage: "保存训练设置失败"
 *               data: null
 */
router.post('/save', async (req, res) => {
    try {
        const workoutSettingsData = req.body;

        // 基础验证：status 字段必填
        if (!workoutSettingsData.status) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '【status】为必填项', 400);
        }

        // 验证 status 枚举值
        const validStatuses = ['DRAFT', 'ENABLED', 'DISABLED'];
        if (!validStatuses.includes(workoutSettingsData.status)) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'status 值无效，允许的值: DRAFT, ENABLED, DISABLED', 400);
        }

        // 验证 video cycle code 枚举值
        const validCycleCodes = ['FRONT_TO_SIDE', 'SIDE_TO_FRONT'];
        const cycleFields = ['introVideoCycleCode', 'previewVideoCycleCode', 'executionVideoCycleCode'];

        for (const field of cycleFields) {
            if (workoutSettingsData[field] && !validCycleCodes.includes(workoutSettingsData[field])) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, `${field} 值无效，允许的值: FRONT_TO_SIDE, SIDE_TO_FRONT`, 400);
            }
        }

        // 验证数组字段
        if (workoutSettingsData.executionHalfwayAudioBizSoundIds) {
            if (!Array.isArray(workoutSettingsData.executionHalfwayAudioBizSoundIds)) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'executionHalfwayAudioBizSoundIds 必须是数组', 400);
            }
        }

        // 定义数据库中实际存在的字段白名单（前端字段名）
        const allowedFields = [
            'introVideoReps',
            'introAudioBizSoundId',
            'introAudioStartTime',
            'introAudioClosed',
            'previewVideoReps',
            'previewFirstAudioBizSoundId',
            'previewFirstAudioStartTime',
            'previewFirstAudioClosed',
            'previewNextAudioBizSoundId',
            'previewNextAudioStartTime',
            'previewNextAudioClosed',
            'previewLastAudioBizSoundId',
            'previewLastAudioStartTime',
            'previewLastAudioClosed',
            'previewNameAudioStartTime',
            'previewNameAudioClosed',
            'previewThreeAudioBizSoundId',
            'previewThreeAudioEndTime',
            'previewThreeAudioClosed',
            'previewTwoAudioBizSoundId',
            'previewTwoAudioEndTime',
            'previewTwoAudioClosed',
            'previewOneAudioBizSoundId',
            'previewOneAudioEndTime',
            'previewOneAudioClosed',
            'previewRestAudioStartTime',  // 添加缺失的字段
            'previewRestAudioClosed',     // 添加缺失的字段
            'executionGoAudioBizSoundId',
            'executionGoAudioStartTime',
            'executionGoAudioClosed',
            'executionVideoReps',
            'executionGuidanceAudioStartTime',  // 添加缺失的字段
            'executionGuidanceAudioClosed',     // 添加缺失的字段
            'executionHalfwayAudioStartTime',   // 添加缺失的字段
            'executionHalfwayAudioClosed',      // 添加缺失的字段
            'executionThreeAudioBizSoundId',
            'executionThreeAudioEndTime',
            'executionThreeAudioClosed',
            'executionTwoAudioBizSoundId',
            'executionTwoAudioEndTime',
            'executionTwoAudioClosed',
            'executionOneAudioBizSoundId',
            'executionOneAudioEndTime',
            'executionOneAudioClosed',
            'executionBeepAudioBizSoundId',
            'executionBeepAudioEndTime',
            'executionBeepAudioClosed',
            'executionRestAudioBizSoundId',
            'executionRestAudioEndTime',
            'executionRestAudioClosed',
            'executionHalfwayAudioBizSoundIds',
            'introVideoCycleCode',
            'previewVideoCycleCode',
            'executionVideoCycleCode',
            'status'
        ];

        // 转换字段名：前端字段名(camelCase) -> 数据库字段名(snake_case)
        // 只处理白名单中的字段，忽略其他字段
        const dbData = {};
        for (const [key, value] of Object.entries(workoutSettingsData)) {
            // 只处理白名单中的字段
            if (allowedFields.includes(key) && value !== undefined && value !== null) {
                const dbKey = toSnakeCase(key);

                // 处理 JSON 字段
                if (key === 'executionHalfwayAudioBizSoundIds') {
                    dbData[dbKey] = JSON.stringify(value);
                } else {
                    dbData[dbKey] = value;
                }
            }
        }

        // 检查是否已存在记录
        const existingRecords = await query('SELECT id FROM workout_setting WHERE is_deleted = 0 LIMIT 1');

        let result;
        let message;

        if (existingRecords.length > 0) {
            // 更新现有记录
            const existingId = existingRecords[0].id;

            // 构建更新 SQL
            const updateFields = [];
            const updateValues = [];

            for (const [key, value] of Object.entries(dbData)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }

            // 添加更新时间
            updateFields.push('update_time = CURRENT_TIMESTAMP');
            updateValues.push(existingId);

            const updateSql = `UPDATE workout_setting SET ${updateFields.join(', ')} WHERE id = ?`;
            await query(updateSql, updateValues);

            result = { id: existingId };
            message = '更新训练设置成功';

        } else {
            // 创建新记录
            // 设置默认值
            dbData.is_deleted = 0;

            // 构建插入 SQL
            const fields = Object.keys(dbData);
            const placeholders = fields.map(() => '?');
            const values = Object.values(dbData);

            const insertSql = `INSERT INTO workout_setting (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            const insertResult = await query(insertSql, values);

            result = { id: insertResult.insertId };
            message = '创建训练设置成功';
        }

        sendSuccess(res, result, message);

    } catch (error) {
        console.error('保存训练设置错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '保存训练设置失败', 500);
    }
});

module.exports = router;
