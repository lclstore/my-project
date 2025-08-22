/**
 * Exercise 动作资源管理接口
 */

const express = require('express');
const router = express.Router();
const { BusinessHelper, query } = require('../config/database');
const { sendSuccess, sendError, ERROR_CODES } = require('../utils/response');
const { validateApiData } = require('../utils/validator');
const { parseArrayParam, parsePaginationParams } = require('../utils/paramHelper');
const { toSnakeCase, convertExerciseToFrontendFormat } = require('../utils/fieldConverter');
const { QueryConditionBuilder } = require('../utils/enumHelper');



/**
 * @swagger
 * components:
 *   schemas:
 *     Exercise:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 动作资源ID
 *           example: 123
 *         name:
 *           type: string
 *           description: 动作名称
 *           example: "标准俯卧撑"
 *         coverImgUrl:
 *           type: string
 *           format: uri
 *           description: 封面图URL
 *           example: "https://example.com/cover.jpg"
 *         met:
 *           type: integer
 *           description: MET值（代谢当量）
 *           example: 8
 *         structureTypeCode:
 *           type: string
 *           enum: [WARM_UP, MAIN, COOL_DOWN]
 *           description: 结构类型
 *           example: "MAIN"
 *         genderCode:
 *           type: string
 *           enum: [FEMALE, MALE]
 *           description: 性别
 *           example: "MALE"
 *         difficultyCode:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *           description: 难度等级
 *           example: "INTERMEDIATE"
 *         equipmentCode:
 *           type: string
 *           enum: [NO_EQUIPMENT, CHAIR]
 *           description: 所需器械
 *           example: "NO_EQUIPMENT"
 *         positionCode:
 *           type: string
 *           enum: [STANDING, SEATED]
 *           description: 动作姿势
 *           example: "STANDING"
 *         injuredCodes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE]
 *           description: 受伤类型限制数组
 *           example: ["NONE"]
 *         nameAudioUrl:
 *           type: string
 *           format: uri
 *           description: 名称音频地址
 *           example: "https://example.com/name.mp3"
 *         nameAudioUrlDuration:
 *           type: integer
 *           description: 名称音频时长(秒)
 *           example: 3
 *         howtodoScript:
 *           type: string
 *           description: How to do文本说明
 *           example: "双手撑地，身体保持直线，上下推动"
 *         howtodoAudioUrl:
 *           type: string
 *           format: uri
 *           description: How to do音频地址
 *           example: "https://example.com/howtodo.mp3"
 *         howtodoAudioUrlDuration:
 *           type: integer
 *           description: How to do音频时长(秒)
 *           example: 30
 *         guidanceScript:
 *           type: string
 *           description: 指导文本
 *           example: "注意保持身体直线，避免塌腰"
 *         guidanceAudioUrl:
 *           type: string
 *           format: uri
 *           description: 指导音频地址
 *           example: "https://example.com/guidance.mp3"
 *         guidanceAudioUrlDuration:
 *           type: integer
 *           description: 指导音频时长(秒)
 *           example: 45
 *         frontVideoUrl:
 *           type: string
 *           format: uri
 *           description: 正机位视频地址
 *           example: "https://example.com/front.mp4"
 *         frontVideoUrlDuration:
 *           type: integer
 *           description: 正机位视频时长(秒)
 *           example: 60
 *         sideVideoUrl:
 *           type: string
 *           format: uri
 *           description: 侧机位视频地址
 *           example: "https://example.com/side.mp4"
 *         sideVideoUrlDuration:
 *           type: integer
 *           description: 侧机位视频时长(秒)
 *           example: 60
 *         status:
 *           type: string
 *           enum: [DRAFT, ENABLED, DISABLED]
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
 *     ExerciseInput:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: 动作资源ID（修改时必填）
 *           example: 123
 *         name:
 *           type: string
 *           description: 动作名称
 *           example: "标准俯卧撑"
 *         coverImgUrl:
 *           type: string
 *           format: uri
 *           description: 封面图URL（完整状态必填）
 *           example: "https://example.com/cover.jpg"
 *         met:
 *           type: integer
 *           description: MET值（完整状态必填）
 *           example: 8
 *         structureTypeCode:
 *           type: string
 *           enum: [WARM_UP, MAIN, COOL_DOWN]
 *           description: 结构类型（完整状态必填）
 *           example: "MAIN"
 *         genderCode:
 *           type: string
 *           enum: [FEMALE, MALE]
 *           description: 性别（完整状态必填）
 *           example: "MALE"
 *         difficultyCode:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *           description: 难度等级（完整状态必填）
 *           example: "INTERMEDIATE"
 *         equipmentCode:
 *           type: string
 *           enum: [NO_EQUIPMENT, CHAIR]
 *           description: 所需器械（完整状态必填）
 *           example: "NO_EQUIPMENT"
 *         positionCode:
 *           type: string
 *           enum: [STANDING, SEATED]
 *           description: 动作姿势（完整状态必填）
 *           example: "STANDING"
 *         injuredCodes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE]
 *           description: 受伤类型限制数组
 *           example: ["NONE"]
 *         nameAudioUrl:
 *           type: string
 *           format: uri
 *           description: 名称音频地址（完整状态必填）
 *           example: "https://example.com/name.mp3"
 *         nameAudioUrlDuration:
 *           type: integer
 *           description: 名称音频时长(秒)（完整状态必填）
 *           example: 3
 *         howtodoScript:
 *           type: string
 *           description: How to do文本说明（完整状态必填）
 *           example: "双手撑地，身体保持直线，上下推动"
 *         howtodoAudioUrl:
 *           type: string
 *           format: uri
 *           description: How to do音频地址（完整状态必填）
 *           example: "https://example.com/howtodo.mp3"
 *         howtodoAudioUrlDuration:
 *           type: integer
 *           description: How to do音频时长(秒)（完整状态必填）
 *           example: 30
 *         guidanceScript:
 *           type: string
 *           description: 指导文本（可选）
 *           example: "注意保持身体直线，避免塌腰"
 *         guidanceAudioUrl:
 *           type: string
 *           format: uri
 *           description: 指导音频地址（完整状态必填）
 *           example: "https://example.com/guidance.mp3"
 *         guidanceAudioUrlDuration:
 *           type: integer
 *           description: 指导音频时长(秒)（完整状态必填）
 *           example: 45
 *         frontVideoUrl:
 *           type: string
 *           format: uri
 *           description: 正机位视频地址（完整状态必填）
 *           example: "https://example.com/front.mp4"
 *         frontVideoUrlDuration:
 *           type: integer
 *           description: 正机位视频时长(秒)（完整状态必填）
 *           example: 60
 *         sideVideoUrl:
 *           type: string
 *           format: uri
 *           description: 侧机位视频地址（完整状态必填）
 *           example: "https://example.com/side.mp4"
 *         sideVideoUrlDuration:
 *           type: integer
 *           description: 侧机位视频时长(秒)（完整状态必填）
 *           example: 60
 *         status:
 *           type: string
 *           enum: [DRAFT, ENABLED, DISABLED]
 *           description: 状态
 *           example: "ENABLED"
 *     ExercisePageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Exercise'
 *         pageIndex:
 *           type: integer
 *           example: 1
 *         pageSize:
 *           type: integer
 *           example: 10
 *         totalCount:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 10
 *         notEmpty:
 *           type: boolean
 *           example: true
 *         empty:
 *           type: boolean
 *           example: false
 *         errCode:
 *           type: string
 *           nullable: true
 *           example: null
 *         errMessage:
 *           type: string
 *           nullable: true
 *           example: null
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 操作是否成功
 *           example: true
 *         data:
 *           type: object
 *           description: 返回数据
 *         message:
 *           type: string
 *           description: 响应消息
 *           example: "操作成功"
 *         errCode:
 *           type: string
 *           description: 错误代码
 *           example: "INVALID_PARAMETERS"
 *         errMessage:
 *           type: string
 *           description: 错误消息
 *           example: "参数无效"
 *
 * /templateCms/web/exercise/save:
 *   post:
 *     summary: 保存动作资源（新增/修改）
 *     description: |
 *       新增或修改动作资源信息。支持草稿状态的灵活保存：
 *       - 草稿状态（DRAFT）：只需要 name 和 status 字段
 *       - 完整状态（ENABLED/DISABLED）：需要所有必填字段
 *       - 名称唯一性：系统会检查名称是否重复
 *     tags: [Exercise]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExerciseInput'
 *           examples:
 *             draft:
 *               summary: 草稿状态示例
 *               description: 创建草稿时只需要最少字段
 *               value:
 *                 name: "俯卧撑"
 *                 status: "DRAFT"
 *             complete:
 *               summary: 完整状态示例
 *               description: 创建完整动作资源的所有必填字段
 *               value:
 *                 name: "标准俯卧撑"
 *                 coverImgUrl: "https://example.com/cover.jpg"
 *                 met: 8
 *                 structureTypeCode: "MAIN"
 *                 genderCode: "MALE"
 *                 difficultyCode: "INTERMEDIATE"
 *                 equipmentCode: "NO_EQUIPMENT"
 *                 positionCode: "STANDING"
 *                 injuredCodes: ["NONE"]
 *                 nameAudioUrl: "https://example.com/name.mp3"
 *                 nameAudioUrlDuration: 3
 *                 howtodoScript: "双手撑地，身体保持直线，上下推动"
 *                 howtodoAudioUrl: "https://example.com/howtodo.mp3"
 *                 howtodoAudioUrlDuration: 30
 *                 guidanceScript: "注意保持身体直线"
 *                 guidanceAudioUrl: "https://example.com/guidance.mp3"
 *                 guidanceAudioUrlDuration: 45
 *                 frontVideoUrl: "https://example.com/front.mp4"
 *                 frontVideoUrlDuration: 60
 *                 sideVideoUrl: "https://example.com/side.mp4"
 *                 sideVideoUrlDuration: 60
 *                 status: "ENABLED"
 *             update:
 *               summary: 修改示例
 *               description: 修改现有动作资源
 *               value:
 *                 id: 123
 *                 name: "改进版俯卧撑"
 *                 coverImgUrl: "https://example.com/new-cover.jpg"
 *                 met: 9
 *                 structureTypeCode: "MAIN"
 *                 genderCode: "MALE"
 *                 difficultyCode: "ADVANCED"
 *                 equipmentCode: "NO_EQUIPMENT"
 *                 positionCode: "STANDING"
 *                 injuredCodes: ["NONE"]
 *                 nameAudioUrl: "https://example.com/name.mp3"
 *                 nameAudioUrlDuration: 3
 *                 howtodoScript: "双手撑地，身体保持直线，缓慢上下推动"
 *                 howtodoAudioUrl: "https://example.com/howtodo.mp3"
 *                 howtodoAudioUrlDuration: 35
 *                 guidanceScript: "注意保持身体直线，控制节奏"
 *                 guidanceAudioUrl: "https://example.com/guidance.mp3"
 *                 guidanceAudioUrlDuration: 50
 *                 frontVideoUrl: "https://example.com/front.mp4"
 *                 frontVideoUrlDuration: 65
 *                 sideVideoUrl: "https://example.com/side.mp4"
 *                 sideVideoUrlDuration: 65
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
 *                           description: 动作资源ID
 *                           example: 123
 *             examples:
 *               success:
 *                 summary: 成功响应
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 123
 *                   message: "新增动作资源成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             examples:
 *               validation_error:
 *                 summary: 验证错误
 *                 value:
 *                   success: false
 *                   errCode: "INVALID_PARAMETERS"
 *                   errMessage: "【coverImgUrl】为必填项"
 *                   data: null
 *               duplicate_name:
 *                 summary: 名称重复
 *                 value:
 *                   success: false
 *                   errCode: "INVALID_PARAMETERS"
 *                   errMessage: "name已存在，请使用其他name"
 *                   data: null
 *       404:
 *         description: 记录不存在（修改时）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "RECORD_NOT_FOUND"
 *               errMessage: "动作资源不存在"
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
 *               errMessage: "保存动作资源失败"
 *               data: null
 */
router.post('/save', async (req, res) => {
    try {
        const {
            id,
            name,
            coverImgUrl,
            met,
            structureTypeCode,
            genderCode,
            difficultyCode,
            equipmentCode,
            positionCode,
            injuredCodes,
            nameAudioUrl,
            nameAudioUrlDuration,
            howtodoScript,
            howtodoAudioUrl,
            howtodoAudioUrlDuration,
            guidanceScript,
            guidanceAudioUrl,
            guidanceAudioUrlDuration,
            frontVideoUrl,
            frontVideoUrlDuration,
            sideVideoUrl,
            sideVideoUrlDuration,
            status
        } = req.body;

        // 构建动作资源数据对象
        const exerciseData = {
            name,
            coverImgUrl,
            met,
            structureTypeCode,
            genderCode,
            difficultyCode,
            equipmentCode,
            positionCode,
            injuredCodes,
            nameAudioUrl,
            nameAudioUrlDuration,
            howtodoScript,
            howtodoAudioUrl,
            howtodoAudioUrlDuration,
            guidanceScript,
            guidanceAudioUrl,
            guidanceAudioUrlDuration,
            frontVideoUrl,
            frontVideoUrlDuration,
            sideVideoUrl,
            sideVideoUrlDuration,
            status
        };

        // 根据状态选择验证规则
        let validationKey = 'exercise';
        if (exerciseData.status === 'DRAFT') {
            validationKey = 'exercise.draft';  // 草稿状态只验证必要字段
        }

        // 使用validator库进行参数验证
        const validationResult = validateApiData(validationKey, exerciseData);
        if (!validationResult.valid) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
        }

        // 先查询所有同名的未删除记录
        const allSameNameRecords = await query('SELECT id, name, gender_code FROM exercise WHERE name = ? AND is_deleted = 0', [name]);

        let existingNameRecords = [];

        if (genderCode) {
            // 如果当前记录有性别信息，检查是否有同名同性别的记录
            existingNameRecords = allSameNameRecords.filter(record => record.gender_code === genderCode);

            // 如果没有同名同性别的记录，但有同名无性别的记录（草稿），也视为冲突
            if (existingNameRecords.length === 0) {
                const draftRecords = allSameNameRecords.filter(record => record.gender_code === null);
                if (draftRecords.length > 0) {
                    existingNameRecords = draftRecords;
                }
            }
        } else {
            // 如果当前记录没有性别信息（草稿状态），检查是否有任何同名记录
            existingNameRecords = allSameNameRecords;
        }

        if (id) {
            // 修改操作：如果存在同名同性别记录且不是当前记录，则不允许修改
            const conflictRecord = existingNameRecords.find(record => record.id !== parseInt(id));
            if (conflictRecord) {
                const errorMessage = genderCode ?
                    `name和性别组合已存在，请使用其他name或性别` :
                    `name已存在，请使用其他name`;
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, errorMessage, 200);
            }
        } else {
            // 新增操作：如果存在同名同性别记录，则不允许新增
            if (existingNameRecords.length > 0) {
                const errorMessage = genderCode ?
                    `name和性别组合已存在，请使用其他name或性别` :
                    `name已存在，请使用其他name`;
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, errorMessage, 200);
            }
        }

        let result;

        if (id) {
            // 修改操作
            if (isNaN(parseInt(id))) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'ID参数无效', 400);
            }

            // 检查记录是否存在
            const existingRecord = await query('SELECT id FROM exercise WHERE id = ?', [parseInt(id)]);
            if (existingRecord.length === 0) {
                return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, '动作资源不存在', 404);
            }

            // 使用BusinessHelper更新数据
            result = await BusinessHelper.updateWithValidation(
                'exercise',
                parseInt(id),
                exerciseData,
                [],
                'exercise'
            );

            if (result.success) {
                sendSuccess(res, { id: parseInt(id) }, '修改动作资源成功');
            } else {
                sendError(res, result.error, result.message, result.statusCode);
            }
        } else {
            // 新增操作 - 默认设置 is_deleted = 0
            const insertData = {
                ...exerciseData,
                is_deleted: 0
            };

            result = await BusinessHelper.insertWithValidation(
                'exercise',
                insertData
            );

            if (result.success) {
                sendSuccess(res, { id: result.insertId }, '新增动作资源成功');
            } else {
                sendError(res, result.error, result.message, result.statusCode);
            }
        }

    } catch (error) {
        console.error('保存动作资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '保存动作资源失败', 500);
    }
});

/**
 * @swagger
 * /api/exercise/{id}:
 *   get:
 *     summary: 通过ID查询动作资源信息
 *     description: 根据ID获取单个动作资源的详细信息
 *     tags: [Exercise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 动作资源ID
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     coverImgUrl:
 *                       type: string
 *                     met:
 *                       type: integer
 *                     structureTypeCode:
 *                       type: string
 *                     genderCode:
 *                       type: string
 *                     difficultyCode:
 *                       type: string
 *                     equipmentCode:
 *                       type: string
 *                     positionCode:
 *                       type: string
 *                     injuredCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     nameAudioUrl:
 *                       type: string
 *                     nameAudioUrlDuration:
 *                       type: integer
 *                     howtodoScript:
 *                       type: string
 *                     howtodoAudioUrl:
 *                       type: string
 *                     howtodoAudioUrlDuration:
 *                       type: integer
 *                     guidanceScript:
 *                       type: string
 *                     guidanceAudioUrl:
 *                       type: string
 *                     guidanceAudioUrlDuration:
 *                       type: integer
 *                     frontVideoUrl:
 *                       type: string
 *                     frontVideoUrlDuration:
 *                       type: integer
 *                     sideVideoUrl:
 *                       type: string
 *                     sideVideoUrlDuration:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     createTime:
 *                       type: string
 *                       format: date-time
 *                     updateTime:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 动作资源不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 验证ID参数
        if (isNaN(parseInt(id))) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'ID参数无效', 400);
        }

        // 使用BusinessHelper查询数据，过滤已删除的记录，并使用自定义字段转换
        const result = await BusinessHelper.findByIdWithValidation('exercise', parseInt(id), { is_deleted: 0 }, convertExerciseToFrontendFormat);

        if (result.success) {
            sendSuccess(res, result.data, '查询动作资源成功');
        } else {
            if (result.error === 'RECORD_NOT_FOUND') {
                sendError(res, ERROR_CODES.RECORD_NOT_FOUND, '动作资源不存在', 404);
            } else {
                sendError(res, result.error, result.message, result.statusCode);
            }
        }

    } catch (error) {
        console.error('查询动作资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询动作资源失败', 500);
    }
});

/**
 * @swagger
 * /templateCms/web/exercise/detail/{id}:
 *   get:
 *     summary: 通过ID查询动作资源详情
 *     description: |
 *       根据ID获取单个动作资源的详细信息，包括所有字段数据。
 *       返回的字段名会自动转换为前端格式（camelCase）。
 *     tags: [Exercise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 动作资源ID
 *         example: 123
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
 *                       $ref: '#/components/schemas/Exercise'
 *             example:
 *               success: true
 *               data:
 *                 id: 123
 *                 name: "标准俯卧撑"
 *                 coverImgUrl: "https://example.com/cover.jpg"
 *                 met: 8
 *                 structureTypeCode: "MAIN"
 *                 genderCode: "MALE"
 *                 difficultyCode: "INTERMEDIATE"
 *                 equipmentCode: "NO_EQUIPMENT"
 *                 positionCode: "STANDING"
 *                 injuredCodes: ["NONE"]
 *                 nameAudioUrl: "https://example.com/name.mp3"
 *                 nameAudioUrlDuration: 3
 *                 howtodoScript: "双手撑地，身体保持直线，上下推动"
 *                 howtodoAudioUrl: "https://example.com/howtodo.mp3"
 *                 howtodoAudioUrlDuration: 30
 *                 guidanceScript: "注意保持身体直线"
 *                 guidanceAudioUrl: "https://example.com/guidance.mp3"
 *                 guidanceAudioUrlDuration: 45
 *                 frontVideoUrl: "https://example.com/front.mp4"
 *                 frontVideoUrlDuration: 60
 *                 sideVideoUrl: "https://example.com/side.mp4"
 *                 sideVideoUrlDuration: 60
 *                 status: "ENABLED"
 *                 createTime: "2025-08-14T16:35:32.000Z"
 *                 updateTime: "2025-08-14T16:35:32.000Z"
 *               message: "查询动作资源成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "INVALID_PARAMETERS"
 *               errMessage: "ID参数无效"
 *               data: null
 *       404:
 *         description: 动作资源不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "RECORD_NOT_FOUND"
 *               errMessage: "动作资源不存在"
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
 *               errMessage: "查询动作资源失败"
 *               data: null
 *
 * /templateCms/web/exercise/page:
 *   get:
 *     summary: 分页查询动作资源列表
 *     description: |
 *       分页获取动作资源列表，支持多种搜索和筛选功能：
 *
 *       **智能搜索功能：**
 *       - 纯数字关键词：优先按ID精确匹配，无结果则回退到名称模糊搜索
 *       - 文本关键词：按名称进行模糊搜索
 *       - 混合内容：按名称进行模糊搜索
 *
 *       **多条件筛选：**
 *       - 支持按状态、结构类型、性别、难度、器械、部位等多维度筛选
 *       - 多个值用逗号分隔，如：`statusList=ENABLED,DRAFT`
 *
 *       **排序和分页：**
 *       - 支持自定义排序字段和方向
 *       - 支持分页查询，默认每页10条记录
 *     tags: [Exercise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: |
 *           关键词搜索，支持智能匹配：
 *           - 纯数字：优先ID精确匹配，无结果则名称模糊搜索
 *           - 文本：名称模糊搜索
 *         example: "俯卧撑"
 *       - in: query
 *         name: statusList
 *         schema:
 *           type: string
 *         description: 状态筛选，多个用逗号分隔
 *         example: "ENABLED,DRAFT"
 *       - in: query
 *         name: structureTypeCodeList
 *         schema:
 *           type: string
 *         description: 结构类型筛选，多个用逗号分隔
 *         example: "WARM_UP,MAIN"
 *       - in: query
 *         name: genderCodeList
 *         schema:
 *           type: string
 *         description: 性别筛选，多个用逗号分隔
 *         example: "FEMALE,MALE"
 *       - in: query
 *         name: difficultyCodeList
 *         schema:
 *           type: string
 *         description: 难度筛选，多个用逗号分隔
 *         example: "BEGINNER,INTERMEDIATE"
 *       - in: query
 *         name: equipmentCodeList
 *         schema:
 *           type: string
 *         description: 器械筛选，多个用逗号分隔
 *         example: "NO_EQUIPMENT,CHAIR"
 *       - in: query
 *         name: positionCodeList
 *         schema:
 *           type: string
 *         description: 部位筛选，多个用逗号分隔
 *         example: "STANDING,SEATED"
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码（从1开始）
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量（最大100）
 *         example: 10
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: id
 *         description: 排序字段（支持所有字段名，使用camelCase格式）
 *         example: "createTime"
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: 排序方向
 *         example: "DESC"
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExercisePageResponse'
 *             examples:
 *               success:
 *                 summary: 成功响应示例
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 123
 *                       name: "标准俯卧撑"
 *                       coverImgUrl: "https://example.com/cover.jpg"
 *                       met: 8
 *                       structureTypeCode: "MAIN"
 *                       genderCode: "MALE"
 *                       difficultyCode: "INTERMEDIATE"
 *                       equipmentCode: "NO_EQUIPMENT"
 *                       positionCode: "STANDING"
 *                       injuredCodes: ["NONE"]
 *                       status: "ENABLED"
 *                       createTime: "2025-08-14T16:35:32.000Z"
 *                       updateTime: "2025-08-14T16:35:32.000Z"
 *                     - id: 124
 *                       name: "深蹲"
 *                       coverImgUrl: "https://example.com/squat.jpg"
 *                       met: 6
 *                       structureTypeCode: "MAIN"
 *                       genderCode: "FEMALE"
 *                       difficultyCode: "BEGINNER"
 *                       equipmentCode: "NO_EQUIPMENT"
 *                       positionCode: "STANDING"
 *                       injuredCodes: ["KNEE"]
 *                       status: "ENABLED"
 *                       createTime: "2025-08-14T16:40:15.000Z"
 *                       updateTime: "2025-08-14T16:40:15.000Z"
 *                   pageIndex: 1
 *                   pageSize: 10
 *                   totalCount: 25
 *                   totalPages: 3
 *                   notEmpty: true
 *                   empty: false
 *                   errCode: null
 *                   errMessage: null
 *               empty:
 *                 summary: 空结果示例
 *                 value:
 *                   success: true
 *                   data: []
 *                   pageIndex: 1
 *                   pageSize: 10
 *                   totalCount: 0
 *                   totalPages: 0
 *                   notEmpty: false
 *                   empty: true
 *                   errCode: null
 *                   errMessage: null
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             examples:
 *               validation_error:
 *                 summary: 筛选参数验证错误
 *                 value:
 *                   success: false
 *                   errCode: "INVALID_PARAMETERS"
 *                   errMessage: "状态列表包含无效值，允许的值: DRAFT, ENABLED, DISABLED"
 *                   data: null
 *               page_error:
 *                 summary: 分页参数错误
 *                 value:
 *                   success: false
 *                   errCode: "INVALID_PARAMETERS"
 *                   errMessage: "页码必须大于0"
 *                   data: null
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "INTERNAL_ERROR"
 *               errMessage: "查询动作资源列表失败"
 *               data: null
 */
router.get('/page', async (req, res) => {
    try {
        const {
            keywords,
            statusList,
            structureTypeCodeList,
            genderCodeList,
            difficultyCodeList,
            equipmentCodeList,
            positionCodeList,
            orderBy,
            orderDirection
        } = req.query;

        // 使用公共参数处理工具
        const { parseArrayParam } = require('../utils/paramHelper');

        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        if (structureTypeCodeList) queryParams.structureTypeCodeList = parseArrayParam(structureTypeCodeList);
        if (genderCodeList) queryParams.genderCodeList = parseArrayParam(genderCodeList);
        if (difficultyCodeList) queryParams.difficultyCodeList = parseArrayParam(difficultyCodeList);
        if (equipmentCodeList) queryParams.equipmentCodeList = parseArrayParam(equipmentCodeList);
        if (positionCodeList) queryParams.positionCodeList = parseArrayParam(positionCodeList);

        if (Object.keys(queryParams).length > 0) {
            const validation = validateApiData('exercise.query', queryParams);
            if (!validation.valid) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validation.errors.join(', '), 400);
            }
        }

        // 转换排序字段名：前端字段名(camelCase) -> 数据库字段名(snake_case)
        const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';

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
                const idCheckSql = `SELECT COUNT(*) as count FROM exercise WHERE id = ? AND is_deleted = 0`;
                const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);

                if (idCheckResult[0].count === 0) {
                    // ID没有匹配结果，重置条件构建器，改为名称模糊搜索
                    conditionBuilder.reset();

                    // 重新添加逻辑删除过滤条件
                    conditionBuilder.addNumberCondition('is_deleted', 0);

                    // 重新添加其他筛选条件
                    if (queryParams.statusList && queryParams.statusList.length > 0) {
                        conditionBuilder.addArrayCondition('status', queryParams.statusList, 'BizExerciseStatusEnums');
                    }
                    if (queryParams.structureTypeCodeList && queryParams.structureTypeCodeList.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('structureTypeCode'), queryParams.structureTypeCodeList, 'BizExerciseStructureTypeEnums');
                    }
                    if (queryParams.genderCodeList && queryParams.genderCodeList.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('genderCode'), queryParams.genderCodeList, 'BizExerciseGenderEnums');
                    }
                    if (queryParams.difficultyCodeList && queryParams.difficultyCodeList.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('difficultyCode'), queryParams.difficultyCodeList, 'BizExerciseDifficultyEnums');
                    }
                    if (queryParams.equipmentCodeList && queryParams.equipmentCodeList.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('equipmentCode'), queryParams.equipmentCodeList, 'BizExerciseEquipmentEnums');
                    }
                    if (queryParams.positionCodeList && queryParams.positionCodeList.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('positionCode'), queryParams.positionCodeList, 'BizExercisePositionEnums');
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
            if (queryParams.statusList && queryParams.statusList.length > 0) {
                conditionBuilder.addArrayCondition('status', queryParams.statusList, 'BizExerciseStatusEnums');
            }
            if (queryParams.structureTypeCodeList && queryParams.structureTypeCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('structureTypeCode'), queryParams.structureTypeCodeList, 'BizExerciseStructureTypeEnums');
            }
            if (queryParams.genderCodeList && queryParams.genderCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('genderCode'), queryParams.genderCodeList, 'BizExerciseGenderEnums');
            }
            if (queryParams.difficultyCodeList && queryParams.difficultyCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('difficultyCode'), queryParams.difficultyCodeList, 'BizExerciseDifficultyEnums');
            }
            if (queryParams.equipmentCodeList && queryParams.equipmentCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('equipmentCode'), queryParams.equipmentCodeList, 'BizExerciseEquipmentEnums');
            }
            if (queryParams.positionCodeList && queryParams.positionCodeList.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('positionCode'), queryParams.positionCodeList, 'BizExercisePositionEnums');
            }
        }

        // 构建查询选项
        const options = {
            orderBy: dbOrderBy,
            orderDirection: orderDirection || 'DESC',
            excludeFields: ['is_deleted']  // 排除 is_deleted 字段
        };

        const { where, params } = conditionBuilder.build();
        if (where) {
            options.where = where;
            options.whereParams = params;
        }

        // 使用公共业务逻辑处理分页查询
        const result = await BusinessHelper.paginateWithValidation(
            'exercise',
            req,
            options
        );

        if (result.success) {
            res.json(result);
        } else {
            sendError(res, result.error, result.message, result.statusCode);
        }

    } catch (error) {
        console.error('查询动作资源列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询动作资源列表失败', 500);
    }
});

/**
 * @swagger
 * /templateCms/web/exercise/enable:
 *   post:
 *     summary: 批量启用动作资源
 *     description: |
 *       批量启用指定的动作资源，将状态设置为 ENABLED。
 *       支持同时启用多个动作资源。
 *     tags: [Exercise]
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
 *                 description: 要启用的动作资源ID数组
 *                 example: [123, 124, 125]
 *                 minItems: 1
 *           example:
 *             idList: [123, 124, 125]
 *     responses:
 *       200:
 *         description: 批量启用成功
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
 *                         successCount:
 *                           type: integer
 *                           description: 成功启用的数量
 *                           example: 3
 *                         failedIds:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           description: 启用失败的ID列表
 *                           example: []
 *             example:
 *               success: true
 *               data:
 *                 successCount: 3
 *                 failedIds: []
 *               message: "批量启用动作资源成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "INVALID_PARAMETERS"
 *               errMessage: "idList不能为空"
 *               data: null
 *       500:
 *         description: 服务器错误
 */
router.post('/enable', async (req, res) => {
    try {
        const { idList } = req.body;

        // 验证参数
        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList不能为空', 400);
        }

        // 验证ID格式
        const validIds = idList.filter(id => Number.isInteger(id) && id > 0);
        if (validIds.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList包含无效的ID', 400);
        }

        // 批量启用
        const updateSql = `UPDATE exercise SET status = 'ENABLED', update_time = CURRENT_TIMESTAMP WHERE id IN (${validIds.map(() => '?').join(',')}) AND is_deleted = 0`;
        const result = await query(updateSql, validIds);

        const successCount = result.affectedRows;
        const failedIds = validIds.length > successCount ?
            validIds.slice(successCount) : [];

        sendSuccess(res, {
            successCount,
            failedIds
        }, `批量启用动作资源成功，共启用${successCount}个`);

    } catch (error) {
        console.error('批量启用动作资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量启用动作资源失败', 500);
    }
});

/**
 * @swagger
 * /templateCms/web/exercise/disable:
 *   post:
 *     summary: 批量禁用动作资源
 *     description: |
 *       批量禁用指定的动作资源，将状态设置为 DISABLED。
 *       支持同时禁用多个动作资源。
 *     tags: [Exercise]
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
 *                 description: 要禁用的动作资源ID数组
 *                 example: [123, 124, 125]
 *                 minItems: 1
 *           example:
 *             idList: [123, 124, 125]
 *     responses:
 *       200:
 *         description: 批量禁用成功
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
 *                         successCount:
 *                           type: integer
 *                           description: 成功禁用的数量
 *                           example: 3
 *                         failedIds:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           description: 禁用失败的ID列表
 *                           example: []
 *             example:
 *               success: true
 *               data:
 *                 successCount: 3
 *                 failedIds: []
 *               message: "批量禁用动作资源成功"
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/disable', async (req, res) => {
    try {
        const { idList } = req.body;

        // 验证参数
        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList不能为空', 400);
        }

        // 验证ID格式
        const validIds = idList.filter(id => Number.isInteger(id) && id > 0);
        if (validIds.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList包含无效的ID', 400);
        }

        // 批量禁用
        const updateSql = `UPDATE exercise SET status = 'DISABLED', update_time = CURRENT_TIMESTAMP WHERE id IN (${validIds.map(() => '?').join(',')}) AND is_deleted = 0`;
        const result = await query(updateSql, validIds);

        const successCount = result.affectedRows;
        const failedIds = validIds.length > successCount ?
            validIds.slice(successCount) : [];

        sendSuccess(res, {
            successCount,
            failedIds
        }, `批量禁用动作资源成功，共禁用${successCount}个`);

    } catch (error) {
        console.error('批量禁用动作资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量禁用动作资源失败', 500);
    }
});

/**
 * @swagger
 * /templateCms/web/exercise/del:
 *   post:
 *     summary: 批量删除动作资源（逻辑删除）
 *     description: |
 *       批量删除指定的动作资源，使用逻辑删除方式。
 *       将 is_deleted 字段设置为 1，数据仍保留在数据库中。
 *       删除后的数据不会在查询中显示。
 *     tags: [Exercise]
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
 *                 description: 要删除的动作资源ID数组
 *                 example: [123, 124, 125]
 *                 minItems: 1
 *           example:
 *             idList: [123, 124, 125]
 *     responses:
 *       200:
 *         description: 批量删除成功
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
 *                         successCount:
 *                           type: integer
 *                           description: 成功删除的数量
 *                           example: 3
 *                         failedIds:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           description: 删除失败的ID列表
 *                           example: []
 *             example:
 *               success: true
 *               data:
 *                 successCount: 3
 *                 failedIds: []
 *               message: "批量删除动作资源成功"
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/del', async (req, res) => {
    try {
        const { idList } = req.body;

        // 验证参数
        if (!idList || !Array.isArray(idList) || idList.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList不能为空', 400);
        }

        // 验证ID格式
        const validIds = idList.filter(id => Number.isInteger(id) && id > 0);
        if (validIds.length === 0) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList包含无效的ID', 400);
        }

        // 批量逻辑删除
        const updateSql = `UPDATE exercise SET is_deleted = 1, update_time = CURRENT_TIMESTAMP WHERE id IN (${validIds.map(() => '?').join(',')}) AND is_deleted = 0`;
        const result = await query(updateSql, validIds);

        const successCount = result.affectedRows;
        const failedIds = validIds.length > successCount ?
            validIds.slice(successCount) : [];

        sendSuccess(res, {
            successCount,
            failedIds
        }, `批量删除动作资源成功，共删除${successCount}个`);

    } catch (error) {
        console.error('批量删除动作资源错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '批量删除动作资源失败', 500);
    }
});

module.exports = router;
