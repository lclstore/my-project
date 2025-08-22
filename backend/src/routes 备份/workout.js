/**
 * Workout 训练管理接口
 */

const express = require('express');
const router = express.Router();
const { BusinessHelper, query, transaction } = require('../config/database');
const { batchUpdateStatus, batchLogicalDelete, sanitizeParams } = require('../utils/commonHelper');
const { sendSuccess, sendError, ERROR_CODES } = require('../utils/response');
const { convertToFrontendFormat, toSnakeCase } = require('../utils/fieldConverter');
const { parseArrayParam, parsePaginationParams } = require('../utils/paramHelper');
const { QueryConditionBuilder } = require('../utils/enumHelper');
const { validateApiData } = require('../utils/validator');



/**
 * @swagger
 * components:
 *   schemas:
 *     WorkoutInput:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: workout ID（修改时必填）
 *           example: 142
 *         name:
 *           type: string
 *           description: workout名称
 *           example: "全身燃脂训练"
 *         description:
 *           type: string
 *           description: 描述
 *           example: "高强度全身燃脂训练，适合中级健身者"
 *         premium:
 *           type: integer
 *           description: 是否需要订阅（0不需要 1需要）
 *           example: 0
 *         newStartTime:
 *           type: string
 *           format: date-time
 *           description: NEW 开始时间
 *           example: "2025-07-30 00:00:00"
 *         newEndTime:
 *           type: string
 *           format: date-time
 *           description: NEW 结束时间
 *           example: "2025-08-29 00:00:00"
 *         coverImgUrl:
 *           type: string
 *           description: 封面图
 *           example: "https://example.com/cover.png"
 *         detailImgUrl:
 *           type: string
 *           description: 详情图
 *           example: "https://example.com/detail.png"
 *         thumbnailImgUrl:
 *           type: string
 *           description: 缩略图
 *           example: "https://example.com/thumbnail.png"
 *         completeImgUrl:
 *           type: string
 *           description: 完成图
 *           example: "https://example.com/complete.png"
 *         genderCode:
 *           type: string
 *           enum: [FEMALE, MALE]
 *           description: 性别code
 *           example: "MALE"
 *         difficultyCode:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *           description: 难度code
 *           example: "BEGINNER"
 *         positionCode:
 *           type: string
 *           enum: [STANDING, SEATED]
 *           description: 部位code
 *           example: "STANDING"
 *         injuredCodes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE]
 *           description: 受伤类型code数组
 *           example: ["NONE"]
 *         calorie:
 *           type: integer
 *           description: 卡路里
 *           example: 300
 *         duration:
 *           type: integer
 *           description: 时长（秒）
 *           example: 1800
 *         status:
 *           type: string
 *           enum: [DRAFT, ENABLED, DISABLED]
 *           description: 状态
 *           example: "ENABLED"
 *         exerciseGroupList:
 *           type: array
 *           description: 动作组列表
 *           items:
 *             type: object
 *             properties:
 *               structureName:
 *                 type: string
 *                 description: structure name
 *                 example: "热身"
 *               structureRound:
 *                 type: integer
 *                 description: structure round
 *                 example: 1
 *               exerciseList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 动作ID列表
 *                 example: [1, 2, 3]
 *     Workout:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 142
 *         name:
 *           type: string
 *           example: "全身燃脂训练"
 *         description:
 *           type: string
 *           example: "高强度全身燃脂训练"
 *         premium:
 *           type: integer
 *           example: 0
 *         newStartTime:
 *           type: string
 *           example: "2025-07-30 00:00:00"
 *         newEndTime:
 *           type: string
 *           example: "2025-08-29 00:00:00"
 *         coverImgUrl:
 *           type: string
 *           example: "https://example.com/cover.png"
 *         detailImgUrl:
 *           type: string
 *           example: "https://example.com/detail.png"
 *         thumbnailImgUrl:
 *           type: string
 *           example: "https://example.com/thumbnail.png"
 *         completeImgUrl:
 *           type: string
 *           example: "https://example.com/complete.png"
 *         genderCode:
 *           type: string
 *           example: "MALE"
 *         difficultyCode:
 *           type: string
 *           example: "BEGINNER"
 *         positionCode:
 *           type: string
 *           example: "STANDING"
 *         injuredCodes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["NONE"]
 *         calorie:
 *           type: integer
 *           example: 300
 *         duration:
 *           type: integer
 *           example: 1800
 *         status:
 *           type: string
 *           example: "ENABLED"
 *         fileStatus:
 *           type: string
 *           example: "SUCCESSFUL"
 *         audioJsonLanguages:
 *           type: array
 *           items:
 *             type: string
 *           example: ["en"]
 *         createTime:
 *           type: string
 *           format: date-time
 *         updateTime:
 *           type: string
 *           format: date-time
 *     WorkoutPageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Workout'
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
 * @swagger
 * /api/workout/save:
 *   post:
 *     summary: 保存workout（新增/修改）
 *     description: |
 *       新增或修改workout信息，支持复杂的结构化数据保存：
 *       - 主表信息：基本信息、图片、时间等
 *       - 受伤类型：多选数组，存储到关联表
 *       - 动作组结构：支持多个动作组，每组包含多个动作
 *     tags: [Workout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutInput'
 *           examples:
 *             create:
 *               summary: 新增示例
 *               value:
 *                 name: "全身燃脂训练"
 *                 description: "高强度全身燃脂训练"
 *                 premium: 0
 *                 newStartTime: "2025-07-30 00:00:00"
 *                 newEndTime: "2025-08-29 00:00:00"
 *                 coverImgUrl: "https://example.com/cover.png"
 *                 detailImgUrl: "https://example.com/detail.png"
 *                 thumbnailImgUrl: "https://example.com/thumbnail.png"
 *                 completeImgUrl: "https://example.com/complete.png"
 *                 genderCode: "MALE"
 *                 difficultyCode: "BEGINNER"
 *                 positionCode: "STANDING"
 *                 injuredCodes: ["NONE"]
 *                 calorie: 300
 *                 duration: 1800
 *                 status: "ENABLED"
 *                 exerciseGroupList:
 *                   - structureName: "热身"
 *                     structureRound: 1
 *                     exerciseList: [1, 2, 3]
 *                   - structureName: "主要训练"
 *                     structureRound: 3
 *                     exerciseList: [4, 5, 6, 7]
 *             update:
 *               summary: 修改示例
 *               value:
 *                 id: 142
 *                 name: "改进版全身燃脂训练"
 *                 description: "升级版高强度全身燃脂训练"
 *                 premium: 1
 *                 genderCode: "MALE"
 *                 difficultyCode: "INTERMEDIATE"
 *                 positionCode: "STANDING"
 *                 injuredCodes: ["NONE"]
 *                 calorie: 350
 *                 duration: 2100
 *                 status: "ENABLED"
 *                 exerciseGroupList:
 *                   - structureName: "热身"
 *                     structureRound: 1
 *                     exerciseList: [1, 2]
 *                   - structureName: "主要训练"
 *                     structureRound: 4
 *                     exerciseList: [4, 5, 6, 7, 8]
 *                   - structureName: "放松"
 *                     structureRound: 1
 *                     exerciseList: [9, 10]
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
 *                           description: workout ID
 *                           example: 142
 *             example:
 *               success: true
 *               data:
 *                 id: 142
 *               message: "保存workout成功"
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               errCode: "INVALID_PARAMETERS"
 *               errMessage: "参数无效"
 *       500:
 *         description: 服务器错误
 */
router.post('/save', async (req, res) => {
    try {
        const { id, exerciseGroupList, injuredCodes, ...workoutData } = req.body;

        // 基本参数验证
        if (!workoutData.name || !workoutData.status) {
            return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'name和status为必填字段', 400);
        }

        // 使用事务处理复杂的数据保存
        const result = await transaction(async (connection) => {
            let workoutId;

            if (id) {
                // 修改模式
                workoutId = parseInt(id);

                // 更新主表（只更新未删除的数据）
                const updateSql = `
                    UPDATE workout SET
                        name = ?, description = ?, premium = ?, new_start_time = ?, new_end_time = ?,
                        cover_img_url = ?, detail_img_url = ?, thumbnail_img_url = ?, complete_img_url = ?,
                        gender_code = ?, difficulty_code = ?, position_code = ?, calorie = ?, duration = ?,
                        status = ?, group_code = ?, show_in_page = ?, update_time = NOW()
                    WHERE id = ? AND is_deleted = 0
                `;
                const updateParams = sanitizeParams([
                    workoutData.name, workoutData.description, workoutData.premium,
                    workoutData.newStartTime, workoutData.newEndTime,
                    workoutData.coverImgUrl, workoutData.detailImgUrl,
                    workoutData.thumbnailImgUrl, workoutData.completeImgUrl,
                    workoutData.genderCode, workoutData.difficultyCode, workoutData.positionCode,
                    workoutData.calorie, workoutData.duration, workoutData.status,
                    workoutData.groupCode, workoutData.showInPage, workoutId
                ]);

                const [updateResult] = await connection.execute(updateSql, updateParams);
                if (updateResult.affectedRows === 0) {
                    throw new Error('Workout不存在或未发生变化');
                }

                // 删除旧的关联数据（关联表数据使用物理删除，因为需要重新建立关联关系）
                await connection.execute('DELETE FROM workout_injured WHERE workout_id = ?', [workoutId]);
                await connection.execute('DELETE FROM workout_structure_exercise WHERE workout_structure_id IN (SELECT id FROM workout_structure WHERE workout_id = ?)', [workoutId]);
                await connection.execute('DELETE FROM workout_structure WHERE workout_id = ?', [workoutId]);
            } else {
                // 新增模式
                const insertSql = `
                    INSERT INTO workout (
                        name, description, premium, new_start_time, new_end_time,
                        cover_img_url, detail_img_url, thumbnail_img_url, complete_img_url,
                        gender_code, difficulty_code, position_code, calorie, duration, status,
                        group_code, show_in_page
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const insertParams = sanitizeParams([
                    workoutData.name, workoutData.description, workoutData.premium,
                    workoutData.newStartTime, workoutData.newEndTime,
                    workoutData.coverImgUrl, workoutData.detailImgUrl,
                    workoutData.thumbnailImgUrl, workoutData.completeImgUrl,
                    workoutData.genderCode, workoutData.difficultyCode, workoutData.positionCode,
                    workoutData.calorie, workoutData.duration, workoutData.status,
                    workoutData.groupCode, workoutData.showInPage
                ]);

                const [insertResult] = await connection.execute(insertSql, insertParams);
                workoutId = insertResult.insertId;
            }

            // 保存受伤类型关联数据
            if (injuredCodes && Array.isArray(injuredCodes) && injuredCodes.length > 0) {
                const injuredSql = 'INSERT INTO workout_injured (workout_id, injured_code) VALUES (?, ?)';
                for (const injuredCode of injuredCodes) {
                    await connection.execute(injuredSql, sanitizeParams([workoutId, injuredCode]));
                }
            }

            // 保存动作组结构数据
            if (exerciseGroupList && Array.isArray(exerciseGroupList) && exerciseGroupList.length > 0) {
                for (let i = 0; i < exerciseGroupList.length; i++) {
                    const group = exerciseGroupList[i];

                    // 插入结构数据
                    const structureSql = `
                        INSERT INTO workout_structure (workout_id, structure_name, structure_round, sort_order)
                        VALUES (?, ?, ?, ?)
                    `;
                    const [structureResult] = await connection.execute(structureSql, sanitizeParams([
                        workoutId, group.structureName, group.structureRound, i + 1
                    ]));
                    const structureId = structureResult.insertId;

                    // 插入动作关联数据
                    if (group.exerciseList && Array.isArray(group.exerciseList) && group.exerciseList.length > 0) {
                        const exerciseSql = `
                            INSERT INTO workout_structure_exercise (workout_structure_id, exercise_id, sort_order)
                            VALUES (?, ?, ?)
                        `;
                        for (let j = 0; j < group.exerciseList.length; j++) {
                            await connection.execute(exerciseSql, sanitizeParams([
                                structureId, group.exerciseList[j], j + 1
                            ]));
                        }
                    }
                }
            }

            return { workoutId };
        });

        sendSuccess(res, { id: result.workoutId }, id ? '修改workout成功' : '新增workout成功');

    } catch (error) {
        console.error('保存workout错误:', error);
        if (error.message.includes('不存在')) {
            sendError(res, ERROR_CODES.RECORD_NOT_FOUND, error.message, 404);
        } else {
            sendError(res, ERROR_CODES.INTERNAL_ERROR, '保存workout失败', 500);
        }
    }
});

/**
 * @swagger
 * /api/workout/detail/{id}:
 *   get:
 *     summary: 通过ID查询workout详情
 *     description: |
 *       根据ID获取单个workout的详细信息，包括：
 *       - 基本信息
 *       - 受伤类型数组
 *       - 动作组结构（包含动作列表）
 *     tags: [Workout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: workout ID
 *         example: 142
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
 *                       allOf:
 *                         - $ref: '#/components/schemas/Workout'
 *                         - type: object
 *                           properties:
 *                             exerciseGroupList:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   structureName:
 *                                     type: string
 *                                   structureRound:
 *                                     type: integer
 *                                   exerciseList:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                         name:
 *                                           type: string
 *                                         coverImgUrl:
 *                                           type: string
 *                                         met:
 *                                           type: integer
 *                                         structureTypeCode:
 *                                           type: string
 *                                           enum: [WARM_UP, MAIN, COOL_DOWN]
 *                                         genderCode:
 *                                           type: string
 *                                           enum: [FEMALE, MALE]
 *                                         difficultyCode:
 *                                           type: string
 *                                           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *                                         equipmentCode:
 *                                           type: string
 *                                           enum: [NO_EQUIPMENT, CHAIR]
 *                                         positionCode:
 *                                           type: string
 *                                           enum: [STANDING, SEATED]
 *                                         injuredCodes:
 *                                           type: array
 *                                           items:
 *                                             type: string
 *                                         howtodoScript:
 *                                           type: string
 *                                         guidanceScript:
 *                                           type: string
 *                                         frontVideoUrl:
 *                                           type: string
 *                                         sideVideoUrl:
 *                                           type: string
 *                                         status:
 *                                           type: string
 *                                           enum: [DRAFT, ENABLED, DISABLED]
 *       404:
 *         description: workout不存在
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

        const workoutId = parseInt(id);

        // 使用BusinessHelper查询主表信息（只查询未删除的数据）
        const result = await BusinessHelper.findByIdWithValidation('workout', workoutId, { is_deleted: 0 });

        if (!result.success) {
            return sendError(res, ERROR_CODES.RECORD_NOT_FOUND, 'Workout不存在', 404);
        }

        // 查询受伤类型
        const injuredSql = 'SELECT injured_code FROM workout_injured WHERE workout_id = ?';
        const injuredResult = await query(injuredSql, [workoutId]);
        const injuredCodes = injuredResult.map(item => item.injured_code);

        // 查询动作组结构（包含完整的动作信息）
        const structureSql = `
            SELECT ws.id, ws.structure_name, ws.structure_round, ws.sort_order,
                   wse.exercise_id, wse.sort_order as exercise_sort_order,
                   e.name as exercise_name, e.cover_img_url as exercise_cover_img_url,
                   e.met as exercise_met, e.structure_type_code as exercise_structure_type_code,
                   e.gender_code as exercise_gender_code, e.difficulty_code as exercise_difficulty_code,
                   e.equipment_code as exercise_equipment_code, e.position_code as exercise_position_code,
                   e.injured_codes as exercise_injured_codes, e.name_audio_url as exercise_name_audio_url,
                   e.name_audio_url_duration as exercise_name_audio_url_duration,
                   e.howtodo_script as exercise_howtodo_script, e.howtodo_audio_url as exercise_howtodo_audio_url,
                   e.howtodo_audio_url_duration as exercise_howtodo_audio_url_duration,
                   e.guidance_script as exercise_guidance_script, e.guidance_audio_url as exercise_guidance_audio_url,
                   e.guidance_audio_url_duration as exercise_guidance_audio_url_duration,
                   e.front_video_url as exercise_front_video_url, e.front_video_url_duration as exercise_front_video_url_duration,
                   e.side_video_url as exercise_side_video_url, e.side_video_url_duration as exercise_side_video_url_duration,
                   e.status as exercise_status
            FROM workout_structure ws
            LEFT JOIN workout_structure_exercise wse ON ws.id = wse.workout_structure_id
            LEFT JOIN exercise e ON wse.exercise_id = e.id
            WHERE ws.workout_id = ?
            ORDER BY ws.sort_order, wse.sort_order
        `;
        const structureResult = await query(structureSql, [workoutId]);

        // 组织动作组数据（包含完整的动作信息）
        const exerciseGroupList = [];
        const structureMap = new Map();

        structureResult.forEach(row => {
            if (!structureMap.has(row.id)) {
                structureMap.set(row.id, {
                    structureName: row.structure_name,
                    structureRound: row.structure_round,
                    exerciseList: []
                });
                exerciseGroupList.push(structureMap.get(row.id));
            }

            if (row.exercise_id) {
                // 构建完整的动作信息对象（基于实际的exercise表结构）
                const exerciseInfo = {
                    id: row.exercise_id,
                    name: row.exercise_name,
                    coverImgUrl: row.exercise_cover_img_url,
                    met: row.exercise_met,
                    structureTypeCode: row.exercise_structure_type_code,
                    genderCode: row.exercise_gender_code,
                    difficultyCode: row.exercise_difficulty_code,
                    equipmentCode: row.exercise_equipment_code,
                    positionCode: row.exercise_position_code,
                    injuredCodes: row.exercise_injured_codes,
                    nameAudioUrl: row.exercise_name_audio_url,
                    nameAudioUrlDuration: row.exercise_name_audio_url_duration,
                    howtodoScript: row.exercise_howtodo_script,
                    howtodoAudioUrl: row.exercise_howtodo_audio_url,
                    howtodoAudioUrlDuration: row.exercise_howtodo_audio_url_duration,
                    guidanceScript: row.exercise_guidance_script,
                    guidanceAudioUrl: row.exercise_guidance_audio_url,
                    guidanceAudioUrlDuration: row.exercise_guidance_audio_url_duration,
                    frontVideoUrl: row.exercise_front_video_url,
                    frontVideoUrlDuration: row.exercise_front_video_url_duration,
                    sideVideoUrl: row.exercise_side_video_url,
                    sideVideoUrlDuration: row.exercise_side_video_url_duration,
                    status: row.exercise_status
                };

                structureMap.get(row.id).exerciseList.push(exerciseInfo);
            }
        });

        // 组装最终数据
        const workoutData = result.data;
        workoutData.injuredCodes = injuredCodes;
        workoutData.exerciseGroupList = exerciseGroupList;

        sendSuccess(res, workoutData, '查询workout详情成功');

    } catch (error) {
        console.error('查询workout详情错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询workout详情失败', 500);
    }
});

/**
 * @swagger
 * /api/workout/page:
 *   get:
 *     summary: 分页查询workout列表
 *     description: |
 *       分页查询workout列表，支持多种筛选条件：
 *       - 基本分页参数
 *       - 状态筛选
 *       - 性别筛选
 *       - 难度筛选
 *       - 关键词搜索（名称）
 *     tags: [Workout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: statusList
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [DRAFT, ENABLED, DISABLED]
 *         description: 状态筛选，可用值:DRAFT,ENABLED,DISABLED，示例值(DRAFT)
 *         example: ["DRAFT"]
 *       - in: query
 *         name: genderCodes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [FEMALE, MALE]
 *         description: 性别code，可用值:FEMALE,MALE，示例值(FEMALE)
 *         example: ["FEMALE"]
 *       - in: query
 *         name: difficultyCodes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *         description: 难度code，可用值:BEGINNER,INTERMEDIATE,ADVANCED，示例值(BEGINNER)
 *         example: ["BEGINNER"]
 *       - in: query
 *         name: positionCodes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [STANDING, SEATED]
 *         description: 部位code，可用值:STANDING,SEATED，示例值(STANDING)
 *         example: ["STANDING"]
 *       - in: query
 *         name: injuredCodes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE]
 *         description: 受伤类型code，可用值:SHOULDER,BACK,WRIST,KNEE,ANKLE,HIP,NONE，示例值(SHOULDER)
 *         example: ["SHOULDER"]
 *       - in: query
 *         name: fileStatusList
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [WAITING, PROCESSING, SUCCESSFUL, FAILED]
 *         description: 文件任务状态，可用值:WAITING,PROCESSING,SUCCESSFUL,FAILED，示例值(WAITING)
 *         example: ["WAITING"]
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: |
 *           关键词搜索，支持智能匹配：
 *           - 纯数字：优先ID精确匹配，无结果则名称模糊搜索
 *           - 文本：名称模糊搜索
 *         example: "全身训练"
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutPageResponse'
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/page', async (req, res) => {
    try {
        const {
            keywords,
            statusList,
            genderCodes,
            difficultyCodes,
            positionCodes,
            injuredCodes,
            fileStatusList,
            orderBy,
            orderDirection
        } = req.query;

        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        if (genderCodes) queryParams.genderCodes = parseArrayParam(genderCodes);
        if (difficultyCodes) queryParams.difficultyCodes = parseArrayParam(difficultyCodes);
        if (positionCodes) queryParams.positionCodes = parseArrayParam(positionCodes);
        if (injuredCodes) queryParams.injuredCodes = parseArrayParam(injuredCodes);
        if (fileStatusList) queryParams.fileStatusList = parseArrayParam(fileStatusList);

        // 验证参数
        if (Object.keys(queryParams).length > 0) {
            const validation = validateApiData('workout.query', queryParams);
            if (!validation.valid) {
                return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validation.errors.join(', '), 400);
            }
        }

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
                const idCheckSql = `SELECT COUNT(*) as count FROM workout WHERE id = ? AND is_deleted = 0`;
                const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);

                if (idCheckResult[0].count === 0) {
                    // ID没有匹配结果，重置条件构建器，改为名称模糊搜索
                    conditionBuilder.reset();

                    // 重新添加逻辑删除过滤条件
                    conditionBuilder.addNumberCondition('is_deleted', 0);

                    // 重新添加其他筛选条件
                    if (queryParams.statusList && queryParams.statusList.length > 0) {
                        conditionBuilder.addArrayCondition('status', queryParams.statusList, 'BizWorkoutStatusEnums');
                    }
                    if (queryParams.genderCodes && queryParams.genderCodes.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('genderCode'), queryParams.genderCodes, 'BizWorkoutGenderEnums');
                    }
                    if (queryParams.difficultyCodes && queryParams.difficultyCodes.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('difficultyCode'), queryParams.difficultyCodes, 'BizWorkoutDifficultyEnums');
                    }
                    if (queryParams.positionCodes && queryParams.positionCodes.length > 0) {
                        conditionBuilder.addArrayCondition(toSnakeCase('positionCode'), queryParams.positionCodes, 'BizWorkoutPositionEnums');
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
                conditionBuilder.addArrayCondition('status', queryParams.statusList, 'BizStatusEnums');
            }
            if (queryParams.genderCodes && queryParams.genderCodes.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('genderCode'), queryParams.genderCodes, 'BizExerciseGenderEnums');
            }
            if (queryParams.difficultyCodes && queryParams.difficultyCodes.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('difficultyCode'), queryParams.difficultyCodes, 'BizExerciseDifficultyEnums');
            }
            if (queryParams.positionCodes && queryParams.positionCodes.length > 0) {
                conditionBuilder.addArrayCondition(toSnakeCase('positionCode'), queryParams.positionCodes, 'BizExercisePositionEnums');
            }
        }

        // 构建查询选项
        const options = {
            orderBy: `${dbOrderBy} ${dbOrderDirection === 'asc' ? 'ASC' : 'DESC'}`,
            excludeFields: ['is_deleted']  // 排除 is_deleted 字段
        };

        const { where, params } = conditionBuilder.build();
        if (where) {
            options.where = where;
            options.whereParams = params;
        }

        // 使用BusinessHelper进行分页查询
        const result = await BusinessHelper.paginateWithValidation('workout', req, options);

        if (!result.success) {
            return sendError(res, result.error, result.message, result.statusCode);
        }

        let injuredMap = new Map();



        // 为每个workout添加受伤类型数据并进行字段转换
        const processedData = result.data.map(item => {
            item.injuredCodes = injuredMap.get(item.id) || [];
            return convertToFrontendFormat(item);
        });


        // 返回统一的列表结构（BusinessHelper.paginateWithValidation已经提供了基础结构）
        res.json(result);

    } catch (error) {
        console.error('查询workout列表错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, '查询workout列表失败', 500);
    }
});

/**
 * @swagger
 * /api/workout/del:
 *   post:
 *     summary: 删除workout
 *     description: 根据ID数组删除workout（逻辑删除）
 *     tags: [Workout]
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
 *                 description: workout ID数组
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 deletedCount: 3
 *               message: "删除workout成功"
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/del', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchLogicalDelete('workout', idList);
        sendSuccess(res, {
            deletedCount: result.deletedCount,
            deletedData: result.deletedData
        }, result.message);
    } catch (error) {
        console.error('删除workout错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '删除workout失败', 500);
    }
});

/**
 * @swagger
 * /api/workout/enable:
 *   post:
 *     summary: 启用workout
 *     description: 根据ID数组批量启用workout
 *     tags: [Workout]
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
 *                 description: workout ID数组
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 启用成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 updatedCount: 3
 *               message: "启用workout成功"
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/enable', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchUpdateStatus('workout', idList, 'ENABLED', '启用');
        sendSuccess(res, { updatedCount: result.updatedCount }, result.message);
    } catch (error) {
        console.error('启用workout错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '启用workout失败', 500);
    }
});

/**
 * @swagger
 * /api/workout/disable:
 *   post:
 *     summary: 禁用workout
 *     description: 根据ID数组批量禁用workout
 *     tags: [Workout]
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
 *                 description: workout ID数组
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 禁用成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               data:
 *                 updatedCount: 3
 *               message: "禁用workout成功"
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/disable', async (req, res) => {
    try {
        const { idList } = req.body;
        const result = await batchUpdateStatus('workout', idList, 'DISABLED', '禁用');
        sendSuccess(res, { updatedCount: result.updatedCount }, result.message);
    } catch (error) {
        console.error('禁用workout错误:', error);
        sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message || '禁用workout失败', 500);
    }
});

module.exports = router;
