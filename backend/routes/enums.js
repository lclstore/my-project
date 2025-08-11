const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { ERROR_CODES, sendSuccessList, sendError } = require('../utils/response');
const router = express.Router();

// 枚举数据定义
const enumsData = {
  BizCategoryGroupEnums: {
    name: "BizCategoryGroupEnums",
    displayName: "BizCategoryGroupEnums",
    datas: [
      { code: 1, name: "GroupA", displayName: "Group A", enumName: "GROUPA" },
      { code: 2, name: "GroupB", displayName: "Group B", enumName: "GROUPB" },
      { code: 3, name: "GroupC", displayName: "Group C", enumName: "GROUPC" },
      { code: 4, name: "GroupD", displayName: "Group D", enumName: "GROUPD" },
      { code: 5, name: "GroupE", displayName: "Group E", enumName: "GROUPE" },
      { code: 6, name: "GroupF", displayName: "Group F", enumName: "GROUPF" },
      { code: 7, name: "GroupG", displayName: "Group G", enumName: "GROUPG" }
    ]
  },
  BizExerciseDifficultyEnums: {
    name: "BizExerciseDifficultyEnums",
    displayName: "BizExerciseDifficultyEnums",
    datas: [
      { code: 1, name: "Beginner", displayName: "Beginner", enumName: "BEGINNER" },
      { code: 2, name: "Intermediate", displayName: "Intermediate", enumName: "INTERMEDIATE" },
      { code: 3, name: "Advanced", displayName: "Advanced", enumName: "ADVANCED" }
    ]
  },
  BizExerciseEquipmentEnums: {
    name: "BizExerciseEquipmentEnums",
    displayName: "BizExerciseEquipmentEnums",
    datas: [
      { code: 1, name: "No equipment", displayName: "No equipment", enumName: "NO_EQUIPMENT" },
      { code: 2, name: "Chair", displayName: "Chair", enumName: "CHAIR" }
    ]
  },
  BizExerciseGenderEnums: {
    name: "BizExerciseGenderEnums",
    displayName: "BizExerciseGenderEnums",
    datas: [
      { code: 1, name: "Female", displayName: "Female", enumName: "FEMALE" },
      { code: 2, name: "Male", displayName: "Male", enumName: "MALE" }
    ]
  },
  BizExerciseInjuredEnums: {
    name: "BizExerciseInjuredEnums",
    displayName: "BizExerciseInjuredEnums",
    datas: [
      { code: 1, name: "Shoulder", displayName: "Shoulder", enumName: "SHOULDER" },
      { code: 2, name: "Back", displayName: "Back", enumName: "BACK" },
      { code: 3, name: "Wrist", displayName: "Wrist", enumName: "WRIST" },
      { code: 4, name: "Knee", displayName: "Knee", enumName: "KNEE" },
      { code: 5, name: "Ankle", displayName: "Ankle", enumName: "ANKLE" },
      { code: 6, name: "Hip", displayName: "Hip", enumName: "HIP" },
      { code: 0, name: "None", displayName: "None", enumName: "NONE" }
    ]
  },
  BizExercisePositionEnums: {
    name: "BizExercisePositionEnums",
    displayName: "BizExercisePositionEnums",
    datas: [
      { code: 1, name: "Standing", displayName: "Standing", enumName: "STANDING" },
      { code: 2, name: "Seated", displayName: "Seated", enumName: "SEATED" }
    ]
  },
  BizExerciseStructureTypeEnums: {
    name: "BizExerciseStructureTypeEnums",
    displayName: "BizExerciseStructureTypeEnums",
    datas: [
      { code: 1, name: "Warm Up", displayName: "Warm Up", enumName: "WARM_UP" },
      { code: 2, name: "Main", displayName: "Main", enumName: "MAIN" },
      { code: 3, name: "Cool Down", displayName: "Cool Down", enumName: "COOL_DOWN" }
    ]
  },
  BizGenerateTaskStatusEnums: {
    name: "BizGenerateTaskStatusEnums",
    displayName: "BizGenerateTaskStatusEnums",
    datas: [
      { code: 1, name: "Waiting", displayName: "Waiting", enumName: "WAITING" },
      { code: 2, name: "Processing", displayName: "Processing", enumName: "PROCESSING" },
      { code: 3, name: "Successful", displayName: "Successful", enumName: "SUCCESSFUL" },
      { code: 4, name: "Failed", displayName: "Failed", enumName: "FAILED" }
    ]
  },
  BizGenerateTaskTypeEnums: {
    name: "BizGenerateTaskTypeEnums",
    displayName: "BizGenerateTaskTypeEnums",
    datas: [
      { code: 1, name: "template generate workout", displayName: "template generate workout", enumName: "TEMPLATE_GENERATE_WORKOUT" },
      { code: 2, name: "workout generate file", displayName: "workout generate file", enumName: "WORKOUT_GENERATE_FILE" },
      { code: 3, name: "template workout generate file", displayName: "template workout generate file", enumName: "TEMPLATE_WORKOUT_GENERATE_FILE" }
    ]
  },
  BizPlanGenderEnums: {
    name: "BizPlanGenderEnums",
    displayName: "BizPlanGenderEnums",
    datas: [
      { code: 1, name: "Female", displayName: "Female", enumName: "FEMALE" },
      { code: 2, name: "Male", displayName: "Male", enumName: "MALE" }
    ]
  },
  BizPlanNameSettingsCompletedTimesEnums: {
    name: "BizPlanNameSettingsCompletedTimesEnums",
    displayName: "BizPlanNameSettingsCompletedTimesEnums",
    datas: [
      { code: 1, name: "0", displayName: "0", enumName: "ZERO" }
    ]
  },
  BizPlanNameSettingsRuleMatchConditionEnums: {
    name: "BizPlanNameSettingsRuleMatchConditionEnums",
    displayName: "BizPlanNameSettingsRuleMatchConditionEnums",
    datas: [
      { code: 1, name: "isEqualTo", displayName: "is equal to", enumName: "EQUALS" },
      { code: 2, name: "isNotEqualTo", displayName: "is not equal to", enumName: "NOT_EQUALS" }
    ]
  },
  BizPlanNameSettingsRuleMatchKeyEnums: {
    name: "BizPlanNameSettingsRuleMatchKeyEnums",
    displayName: "BizPlanNameSettingsRuleMatchKeyEnums",
    datas: [
      { code: 1, name: "Wished training position", displayName: "Wished training position", enumName: "WISHED_TRAINING_POSITION" },
      { code: 2, name: "Completed Times", displayName: "Completed Times", enumName: "COMPLETED_TIMES" }
    ]
  },
  BizPlanNameSettingsTrainingPositionEnums: {
    name: "BizPlanNameSettingsTrainingPositionEnums",
    displayName: "BizPlanNameSettingsTrainingPositionEnums",
    datas: [
      { code: 1, name: "Weight Loss", displayName: "Weight Loss", enumName: "WEIGHT_LOSS" },
      { code: 2, name: "Muscle gain", displayName: "Muscle gain", enumName: "MUSCLE_GAIN" }
    ]
  },
  BizPlanReplaceSettingsRuleMatchConditionEnums: {
    name: "BizPlanReplaceSettingsRuleMatchConditionEnums",
    displayName: "BizPlanReplaceSettingsRuleMatchConditionEnums",
    datas: [
      { code: 1, name: "isEqualTo", displayName: "is equal to", enumName: "EQUALS" },
      { code: 2, name: "isNotEqualTo", displayName: "is not equal to", enumName: "NOT_EQUALS" }
    ]
  },
  BizPlanReplaceSettingsRuleMatchKeyEnums: {
    name: "BizPlanReplaceSettingsRuleMatchKeyEnums",
    displayName: "BizPlanReplaceSettingsRuleMatchKeyEnums",
    datas: [
      { code: 1, name: "Gender", displayName: "Gender", enumName: "GENDER" },
      { code: 2, name: "User", displayName: "User", enumName: "USER" }
    ]
  },
  BizPlanUserEnums: {
    name: "BizPlanUserEnums",
    displayName: "BizPlanUserEnums",
    datas: [
      { code: 1, name: "New", displayName: "New", enumName: "NEW" },
      { code: 2, name: "All", displayName: "All", enumName: "All" }
    ]
  },
  BizPlaylistTypeEnums: {
    name: "BizPlaylistTypeEnums",
    displayName: "BizPlaylistTypeEnums",
    datas: [
      { code: 1, name: "Regular", displayName: "Regular", enumName: "REGULAR" },
      { code: 2, name: "Yoga", displayName: "Yoga", enumName: "YOGA" },
      { code: 3, name: "Dance", displayName: "Dance", enumName: "DANCE" }
    ]
  },
  BizProgramEquipmentEnums: {
    name: "BizProgramEquipmentEnums",
    displayName: "BizProgramEquipmentEnums",
    datas: [
      { code: 1, name: "Dumbbells", displayName: "Dumbbells", enumName: "DUMBBELLS" },
      { code: 2, name: "Resistance band", displayName: "Resistance band", enumName: "RESISTANCE_BAND" },
      { code: 3, name: "None", displayName: "None", enumName: "NONE" }
    ]
  },
  BizProgramShowTypeEnums: {
    name: "BizProgramShowTypeEnums",
    displayName: "BizProgramShowTypeEnums",
    datas: [
      { code: 1, name: "Horizontal", displayName: "Horizontal", enumName: "HORIZONTAL" },
      { code: 2, name: "Card", displayName: "Card", enumName: "CARD" }
    ]
  },
  BizResourceApplicationEnums: {
    name: "BizResourceApplicationEnums",
    displayName: "BizResourceApplicationEnums",
    datas: [
      { code: 1, name: "Plan", displayName: "Plan", enumName: "PLAN" },
      { code: 2, name: "Workout", displayName: "Workout", enumName: "WORKOUT" }
    ]
  },
  BizSoundGenderEnums: {
    name: "BizSoundGenderEnums",
    displayName: "BizSoundGenderEnums",
    datas: [
      { code: 1, name: "Female", displayName: "Female", enumName: "FEMALE" },
      { code: 2, name: "Male", displayName: "Male", enumName: "MALE" },
      { code: 3, name: "Female & Male", displayName: "Female & Male", enumName: "FEMALE_AND_MALE" }
    ]
  },
  BizSoundUsageEnums: {
    name: "BizSoundUsageEnums",
    displayName: "BizSoundUsageEnums",
    datas: [
      { code: 1, name: "Flow", displayName: "Flow", enumName: "FLOW" },
      { code: 2, name: "General", displayName: "General", enumName: "GENERAL" }
    ]
  },
  BizTemplateDurationEnums: {
    name: "BizTemplateDurationEnums",
    displayName: "BizTemplateDurationEnums",
    datas: [
      { code: 1, name: "5-10", displayName: "5-10", enumName: "MIN_5_10" },
      { code: 2, name: "10-15", displayName: "10-15", enumName: "MIN_10_15" },
      { code: 3, name: "15-20", displayName: "15-20", enumName: "MIN_15_20" },
      { code: 4, name: "20-30", displayName: "20-30", enumName: "MIN_20_30" }
    ]
  },
  BizWorkoutSettingsVideoCycleEnums: {
    name: "BizWorkoutSettingsVideoCycleEnums",
    displayName: "BizWorkoutSettingsVideoCycleEnums",
    datas: [
      { code: 1, name: "Front to Side", displayName: "Front to Side", enumName: "FRONT_TO_SIDE" },
      { code: 2, name: "Side to Front", displayName: "Side to Front", enumName: "SIDE_TO_FRONT" }
    ]
  }
};

/**
 * @swagger
 * /enums/list:
 *   get:
 *     summary: 获取所有枚举数据
 *     description: 返回系统中所有的枚举定义（需要JWT认证）
 *     tags: [Enums]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回枚举数据
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnumGroup'
 *                 empty:
 *                   type: boolean
 *                   example: false
 *                 notEmpty:
 *                   type: boolean
 *                   example: true
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
 *                 empty:
 *                   type: boolean
 *                   example: true
 *                 notEmpty:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 获取所有枚举数据
router.get('/list', verifyToken, (req, res) => {
  try {
    const data = Object.values(enumsData);
    sendSuccessList(res, data);

  } catch (error) {
    console.error('获取枚举数据错误:', error);
    sendError(res, ERROR_CODES.INTERNAL_ERROR, null, 500);
  }
});

module.exports = router;
