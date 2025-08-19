/**
 * 参数校验库
 * 为所有添加和修改接口提供统一的验证功能
 */

/**
 * 基础验证规则
 */
const ValidationRules = {
  // 必填字段验证
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return { valid: false, message: `【${fieldName}】为必填项` };
    }
    return { valid: true };
  },

  // 字符串类型验证
  string: (value, fieldName) => {
    if (typeof value !== 'string') {
      return { valid: false, message: `${fieldName}必须是字符串` };
    }
    return { valid: true };
  },

  // 字符串长度验证
  length: (value, fieldName, min = 0, max = 255) => {
    if (typeof value !== 'string') {
      return { valid: false, message: `${fieldName}必须是字符串` };
    }
    if (value.length < min) {
      return { valid: false, message: `${fieldName}长度不能少于${min}个字符` };
    }
    if (value.length > max) {
      return { valid: false, message: `${fieldName}长度不能超过${max}个字符` };
    }
    return { valid: true };
  },

  // 邮箱格式验证
  email: (value, fieldName) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: `${fieldName}格式不正确` };
    }
    return { valid: true };
  },

  // URL格式验证
  url: (value, fieldName) => {
    try {
      new URL(value);
      return { valid: true };
    } catch (error) {
      return { valid: false, message: `${fieldName}格式不正确` };
    }
  },

  // 数字验证
  number: (value, fieldName, min = null, max = null) => {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, message: `${fieldName}必须是数字` };
    }
    if (min !== null && num < min) {
      return { valid: false, message: `${fieldName}不能小于${min}` };
    }
    if (max !== null && num > max) {
      return { valid: false, message: `${fieldName}不能大于${max}` };
    }
    return { valid: true };
  },

  // 整数验证
  integer: (value, fieldName, min = null, max = null) => {
    const num = parseInt(value);
    if (isNaN(num) || num !== Number(value)) {
      return { valid: false, message: `${fieldName}必须是整数` };
    }
    if (min !== null && num < min) {
      return { valid: false, message: `${fieldName}不能小于${min}` };
    }
    if (max !== null && num > max) {
      return { valid: false, message: `${fieldName}不能大于${max}` };
    }
    return { valid: true };
  },

  // 枚举值验证
  enum: (value, fieldName, allowedValues) => {
    if (!allowedValues.includes(value)) {
      return { valid: false, message: `${fieldName}必须是以下值之一: ${allowedValues.join(', ')}` };
    }
    return { valid: true };
  },

  // 日期验证
  date: (value, fieldName) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, message: `${fieldName}日期格式不正确` };
    }
    return { valid: true };
  },

  // 手机号验证（中国）
  phone: (value, fieldName) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      return { valid: false, message: `${fieldName}格式不正确` };
    }
    return { valid: true };
  },

  // JSON格式验证
  json: (value, fieldName) => {
    if (typeof value === 'object') {
      return { valid: true };
    }
    try {
      JSON.parse(value);
      return { valid: true };
    } catch (error) {
      return { valid: false, message: `${fieldName}JSON格式不正确` };
    }
  },

  // MD5格式验证
  md5: (value, fieldName) => {
    const md5Regex = /^[a-f0-9]{32}$/i;
    if (!md5Regex.test(value)) {
      return { valid: false, message: `${fieldName}格式不正确` };
    }
    return { valid: true };
  },

  // 数组验证
  array: (value, fieldName, minLength = 0, maxLength = null) => {
    if (!Array.isArray(value)) {
      return { valid: false, message: `${fieldName}必须是数组` };
    }
    if (value.length < minLength) {
      return { valid: false, message: `${fieldName}数组长度不能少于${minLength}` };
    }
    if (maxLength !== null && value.length > maxLength) {
      return { valid: false, message: `${fieldName}数组长度不能超过${maxLength}` };
    }
    return { valid: true };
  },

  // 枚举数组验证
  enumArray: (value, fieldName, allowedValues) => {
    if (!Array.isArray(value)) {
      return { valid: false, message: `${fieldName}必须是数组` };
    }
    const invalidValues = value.filter(item => !allowedValues.includes(item));
    if (invalidValues.length > 0) {
      return {
        valid: false,
        message: `${fieldName}包含无效值: ${invalidValues.join(', ')}，允许的值: ${allowedValues.join(', ')}`
      };
    }
    return { valid: true };
  },

  // 字符串数组验证
  stringArray: (value, fieldName, minLength = 0, maxLength = null) => {
    const arrayResult = ValidationRules.array(value, fieldName, minLength, maxLength);
    if (!arrayResult.valid) {
      return arrayResult;
    }

    const nonStringItems = value.filter(item => typeof item !== 'string');
    if (nonStringItems.length > 0) {
      return { valid: false, message: `${fieldName}数组中所有元素必须是字符串` };
    }
    return { valid: true };
  },

  // 从枚举库验证单个值
  enumFromLib: (value, fieldName, enumKey) => {
    try {
      const { getEnumValues } = require('./enumHelper');
      const allowedValues = getEnumValues(enumKey);

      if (allowedValues.length === 0) {
        return { valid: false, message: `枚举定义 ${enumKey} 不存在或为空` };
      }

      if (!allowedValues.includes(value)) {
        return {
          valid: false,
          message: `${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`
        };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, message: `枚举验证失败: ${error.message}` };
    }
  },

  // 从枚举库验证数组值
  enumArrayFromLib: (value, fieldName, enumKey) => {
    try {
      const { validateEnumArray } = require('./enumHelper');
      const result = validateEnumArray(enumKey, value);

      if (!result.valid) {
        return { valid: false, message: `${fieldName}${result.message}` };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, message: `枚举数组验证失败: ${error.message}` };
    }
  },

  // 可选字段验证（为空时跳过验证）
  optional: (value, fieldName, validationRule, ...params) => {
    // 如果值为空（null, undefined, 空字符串），跳过验证
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    // 如果有值，则进行指定的验证
    if (ValidationRules[validationRule]) {
      return ValidationRules[validationRule](value, fieldName, ...params);
    }

    return { valid: false, message: `未知的验证规则: ${validationRule}` };
  },

  // 可选字段验证（为空时跳过验证）
  optional: (value, fieldName, validationRule, ...params) => {
    // 如果值为空（null, undefined, 空字符串），跳过验证
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    // 如果有值，则进行指定的验证
    if (ValidationRules[validationRule]) {
      return ValidationRules[validationRule](value, fieldName, ...params);
    }

    return { valid: false, message: `未知的验证规则: ${validationRule}` };
  }
};

/**
 * 接口验证配置
 * 按照具体的操作接口来定义验证规则
 */
const ApiValidationConfig = {
  // 音频资源草稿状态（只验证必要字段）
  'name': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
  },
  // 应用信息相关接口

  'app_info': {
    // 修改时所有字段都是可选的，但如果提供则需要验证格式
    appIcon: [
      { rule: 'required', }
    ],
    appStoreName: [
      { rule: 'required', }
    ],
    appCode: [
      { rule: 'required', }
    ]
  },

  // 帮助信息相关接口
  'app_help': {
    name: [
      { rule: 'required' },
    ],
    url: [
      { rule: 'required' },
      { rule: 'url', message: 'url格式错误' }
    ]
  },

  // 变更日志相关接口
  'app_change_logs': {
    version: [
      { rule: 'required' },
    ],
    date: [
      { rule: 'required' },
    ],
    newInfo: [
      { rule: 'required' },
    ]
  },

  // 发布记录相关接口
  'publish': {
    env: [
      { rule: 'required' },
      { rule: 'enum', params: [['PRODUCTION', 'PRE_PRODUCTION']], message: '环境必须是PRODUCTION或PRE_PRODUCTION' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['WAITTING', 'SUCCESS', 'FAIL', 'PROCESSING']], message: '状态必须是WAITTING、SUCCESS、FAIL或PROCESSING' }
    ]
  },

  // 用户相关接口
  'user': {
    email: [
      { rule: 'required' },
      { rule: 'email', message: '邮箱格式错误' }
    ],
    name: [
      { rule: 'required' },
    ],
    password: [
      { rule: 'required' },
      { rule: 'md5', message: '密码格式不正确' }
    ],
    type: [
      { rule: 'enum', params: [['ADMIN', 'USER']], message: '用户类型必须是ADMIN或USER' }
    ],
    status: [
      { rule: 'enum', params: [['ENABLED', 'DISABLED']], message: '用户状态必须是ENABLED或DISABLED' }
    ]
  },

  // 音频资源相关接口（完整验证）
  'sound': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    genderCode: [
      { rule: 'required' },
      { rule: 'enumFromLib', params: ['BizSoundGenderEnums'], message: '性别值无效' }
    ],
    usageCode: [
      { rule: 'required' },
      { rule: 'enumFromLib', params: ['BizSoundUsageEnums'], message: '用途值无效' }
    ],
    // femaleAudioUrl: [
    //   { rule: 'url', message: 'Female音频文件地址格式不正确' }
    // ],
    // femaleAudioDuration: [
    //   { rule: 'integer', message: 'Female音频时长必须是整数' }
    // ],
    // maleAudioUrl: [
    //   { rule: 'url', message: 'Male音频文件地址格式不正确' }
    // ],
    // maleAudioDuration: [
    //   { rule: 'integer', message: 'Male音频时长必须是整数' }
    // ],
    translation: [
      { rule: 'required' },
      { rule: 'enum', params: [[0, 1]], message: '翻译标识必须是0或1' }
    ],
    // femaleScript: [
    //   { rule: 'string', message: 'female翻译脚本必须是字符串' }
    // ],
    // maleScript: [
    //   { rule: 'string', message: 'male翻译脚本必须是字符串' }
    // ],
    status: [
      { rule: 'required' },
      { rule: 'enumFromLib', params: ['BizSoundStatusEnums'], message: '状态值无效' }
    ]
  },



  // sound 查询条件验证
  'sound.query': {
    statusList: [
      { rule: 'stringArray', message: '状态列表必须是字符串数组' },
      { rule: 'enumArrayFromLib', params: ['BizSoundStatusEnums'], message: '状态列表包含无效值' }
    ],
    genderCodeList: [
      { rule: 'stringArray', message: '性别列表必须是字符串数组' },
      { rule: 'enumArrayFromLib', params: ['BizSoundGenderEnums'], message: '性别列表包含无效值' }
    ],
    usageCodeList: [
      { rule: 'stringArray', message: '用途列表必须是字符串数组' },
      { rule: 'enumArrayFromLib', params: ['BizSoundUsageEnums'], message: '用途列表包含无效值' }
    ]
  },

  // sound 查询条件验证
  'sound.query': {
    statusList: [
      { rule: 'stringArray', message: '状态列表必须是字符串数组' },
      { rule: 'enumArray', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态列表包含无效值，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    genderCodeList: [
      { rule: 'stringArray', message: '性别列表必须是字符串数组' },
      { rule: 'enumArray', params: [['FEMALE', 'MALE', 'FEMALE_AND_MALE']], message: '性别列表包含无效值，允许的值: FEMALE, MALE, FEMALE_AND_MALE' }
    ],
    usageCodeList: [
      { rule: 'stringArray', message: '用途列表必须是字符串数组' },
      { rule: 'enumArray', params: [['FLOW', 'GENERAL']], message: '用途列表包含无效值，允许的值: FLOW, GENERAL' }
    ]
  },

  // category 相关接口验证
  'category': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    coverImgUrl: [
      { rule: 'url', message: '封面图地址格式不正确' }
    ],
    detailImgUrl: [
      { rule: 'url', message: '详情图地址格式不正确' }
    ],
    description: [
      { rule: 'string', message: '描述必须是字符串' }
    ],
    newStartTime: [
      { rule: 'datetime', message: 'NEW开始时间格式不正确' }
    ],
    newEndTime: [
      { rule: 'datetime', message: 'NEW结束时间格式不正确' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enumFromLib', params: ['BizStatusEnums'], message: '状态值无效' }
    ]
  },

  // category 查询条件验证
  'category.query': {
    statusList: [
      { rule: 'stringArray', message: '状态列表必须是字符串数组' },
      { rule: 'enumArrayFromLib', params: ['BizStatusEnums'], message: '状态列表包含无效值' }
    ]
  },

  // program 相关接口验证
  'program': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    coverImgUrl: [
      { rule: 'required' },
      { rule: 'url', message: '封面图地址格式不正确' }
    ],
    detailImgUrl: [
      { rule: 'required' },
      { rule: 'url', message: '详情图地址格式不正确' }
    ],
    description: [
      { rule: 'string', message: '描述必须是字符串' }
    ],
    showTypeCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['HORIZONTAL', 'CARD']], message: '展示类型值无效，允许的值: HORIZONTAL, CARD' }
    ],
    durationWeek: [
      { rule: 'required' },
      { rule: 'integer', message: 'Duration Week必须是整数' }
    ],
    difficultyCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['BEGINNER', 'INTERMEDIATE', 'ADVANCED']], message: '难度值无效，允许的值: BEGINNER, INTERMEDIATE, ADVANCED' }
    ],
    equipmentCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['DUMBBELLS', 'RESISTANCE_BAND', 'NONE']], message: '器械值无效，允许的值: DUMBBELLS, RESISTANCE_BAND, NONE' }
    ],
    newStartTime: [
      { rule: 'datetime', message: 'NEW开始时间格式不正确' }
    ],
    newEndTime: [
      { rule: 'datetime', message: 'NEW结束时间格式不正确' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enumFromLib', params: ['BizStatusEnums'], message: '状态值无效' }
    ]
  },

  // program 查询条件验证
  'program.query': {
    statusList: [
      { rule: 'stringArray', message: '状态列表必须是字符串数组' },
      { rule: 'enumArrayFromLib', params: ['BizStatusEnums'], message: '状态列表包含无效值' }
    ],
    showTypeCodeList: [
      { rule: 'stringArray', message: '展示类型列表必须是字符串数组' },
      { rule: 'enumArray', params: [['HORIZONTAL', 'CARD']], message: '展示类型列表包含无效值，允许的值: HORIZONTAL, CARD' }
    ],
    difficultyCodeList: [
      { rule: 'stringArray', message: '难度列表必须是字符串数组' },
      { rule: 'enumArray', params: [['BEGINNER', 'INTERMEDIATE', 'ADVANCED']], message: '难度列表包含无效值，允许的值: BEGINNER, INTERMEDIATE, ADVANCED' }
    ],
    equipmentCodeList: [
      { rule: 'stringArray', message: '器械列表必须是字符串数组' },
      { rule: 'enumArray', params: [['DUMBBELLS', 'RESISTANCE_BAND', 'NONE']], message: '器械列表包含无效值，允许的值: DUMBBELLS, RESISTANCE_BAND, NONE' }
    ]
  },

  // 动作资源相关接口（完整验证）
  'exercise': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    coverImgUrl: [
      { rule: 'required' },
      { rule: 'url', message: '封面图地址格式不正确' }
    ],
    met: [
      { rule: 'required' },
      { rule: 'integer', message: 'MET值必须是整数' }
    ],
    structureTypeCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['WARM_UP', 'MAIN', 'COOL_DOWN']], message: '结构类型值无效，允许的值: WARM_UP, MAIN, COOL_DOWN' }
    ],
    genderCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['FEMALE', 'MALE']], message: '性别值无效，允许的值: FEMALE, MALE' }
    ],
    difficultyCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['BEGINNER', 'INTERMEDIATE', 'ADVANCED']], message: '难度值无效，允许的值: BEGINNER, INTERMEDIATE, ADVANCED' }
    ],
    equipmentCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['NO_EQUIPMENT', 'CHAIR']], message: '器械值无效，允许的值: NO_EQUIPMENT, CHAIR' }
    ],
    positionCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['STANDING', 'SEATED']], message: '部位值无效，允许的值: STANDING, SEATED' }
    ],
    injuredCodes: [
      { rule: 'array', message: '受伤类型必须是数组' },
      { rule: 'enumArray', params: [['SHOULDER', 'BACK', 'WRIST', 'KNEE', 'ANKLE', 'HIP', 'NONE']], message: '受伤类型包含无效值，允许的值: SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE' }
    ],
    nameAudioUrl: [
      { rule: 'required' },
      { rule: 'url', message: '名称音频地址格式不正确' }
    ],
    nameAudioUrlDuration: [
      { rule: 'required' },
      { rule: 'integer', message: '名称音频时长必须是整数' }
    ],
    howtodoScript: [
      { rule: 'required' },
      { rule: 'string', message: 'How to do文本必须是字符串' }
    ],
    howtodoAudioUrl: [
      { rule: 'required' },
      { rule: 'url', message: 'How to do音频地址格式不正确' }
    ],
    howtodoAudioUrlDuration: [
      { rule: 'required' },
      { rule: 'integer', message: 'How to do音频时长必须是整数' }
    ],
    guidanceScript: [
      { rule: 'string', message: '指导文本必须是字符串' }
    ],
    guidanceAudioUrl: [
      { rule: 'required' },
      { rule: 'url', message: '指导音频地址格式不正确' }
    ],
    guidanceAudioUrlDuration: [
      { rule: 'required' },
      { rule: 'integer', message: '指导音频时长必须是整数' }
    ],
    frontVideoUrl: [
      { rule: 'required' },
      { rule: 'url', message: '正机位视频地址格式不正确' }
    ],
    frontVideoUrlDuration: [
      { rule: 'required' },
      { rule: 'integer', message: '正机位视频时长必须是整数' }
    ],
    sideVideoUrl: [
      { rule: 'required' },
      { rule: 'url', message: '侧机位视频地址格式不正确' }
    ],
    sideVideoUrlDuration: [
      { rule: 'required' },
      { rule: 'integer', message: '侧机位视频时长必须是整数' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ]
  },

  // Template 模板验证规则
  'template': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '模板名称必须是字符串' }
    ],
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    durationCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['MIN_5_10', 'MIN_10_15', 'MIN_15_20', 'MIN_20_30']], message: '时长代码值无效，允许的值: MIN_5_10, MIN_10_15, MIN_15_20, MIN_20_30' }
    ],
    days: [
      { rule: 'required' },
      { rule: 'integer', message: '天数必须是整数' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    unitList: [
      { rule: 'optional', params: ['array'], message: 'unit列表必须是数组' }
    ]
  },

  // Template 模板草稿状态（只验证必要字段）
  'template.draft': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '模板名称必须是字符串' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    // 其他字段都是可选的，为空时跳过验证，有值时进行格式验证
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    durationCode: [
      { rule: 'optional', params: ['enum', ['MIN_5_10', 'MIN_10_15', 'MIN_15_20', 'MIN_20_30']], message: '时长代码值无效' }
    ],
    days: [
      { rule: 'optional', params: ['integer'], message: '天数必须是整数' }
    ],
    unitList: [
      { rule: 'optional', params: ['array'], message: 'unit列表必须是数组' }
    ]
  },

  // Resource 资源验证规则
  'resource': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: 'resource名称必须是字符串' }
    ],
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    applicationCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['PLAN', 'WORKOUT']], message: 'application code值无效，允许的值: PLAN, WORKOUT' }
    ],
    genderCode: [
      { rule: 'required' },
      { rule: 'enum', params: [['FEMALE', 'MALE']], message: '性别code值无效，允许的值: FEMALE, MALE' }
    ],
    coverImgUrl: [
      { rule: 'required' },
      { rule: 'url', message: '封面图地址格式不正确' }
    ],
    detailImgUrl: [
      { rule: 'required' },
      { rule: 'url', message: '详情图地址格式不正确' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ]
  },

  // Resource 资源草稿状态（只验证必要字段）
  'resource.draft': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: 'resource名称必须是字符串' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    // 其他字段都是可选的，为空时跳过验证，有值时进行格式验证
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    applicationCode: [
      { rule: 'optional', params: ['enum', ['PLAN', 'WORKOUT']], message: 'application code值无效' }
    ],
    genderCode: [
      { rule: 'optional', params: ['enum', ['FEMALE', 'MALE']], message: '性别code值无效' }
    ],
    coverImgUrl: [
      { rule: 'optional', params: ['url'], message: '封面图地址格式不正确' }
    ],
    detailImgUrl: [
      { rule: 'optional', params: ['url'], message: '详情图地址格式不正确' }
    ]
  },

  // PlanReplaceSettings 计划替换设置验证规则
  'planReplaceSettings': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: 'workout名称必须是字符串' }
    ],
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    ruleList: [
      { rule: 'optional', params: ['array'], message: 'rule列表必须是数组' }
    ]
  },

  // PlanReplaceSettings 计划替换设置草稿状态（只验证必要字段）
  'planReplaceSettings.draft': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: 'workout名称必须是字符串' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    // 其他字段都是可选的，为空时跳过验证，有值时进行格式验证
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    ruleList: [
      { rule: 'optional', params: ['array'], message: 'rule列表必须是数组' }
    ]
  },

  // PlanNameSettings 计划名称设置验证规则
  'planNameSettings': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: 'workout名称必须是字符串' }
    ],
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    planName: [
      { rule: 'optional', params: ['string'], message: 'plan名称必须是字符串' }
    ],
    stage1Name: [
      { rule: 'optional', params: ['string'], message: 'stage1名称必须是字符串' }
    ],
    stage2Name: [
      { rule: 'optional', params: ['string'], message: 'stage2名称必须是字符串' }
    ],
    stage3Name: [
      { rule: 'optional', params: ['string'], message: 'stage3名称必须是字符串' }
    ],
    stage4Name: [
      { rule: 'optional', params: ['string'], message: 'stage4名称必须是字符串' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    ruleList: [
      { rule: 'optional', params: ['array'], message: 'rule列表必须是数组' }
    ]
  },

  // PlanNameSettings 计划名称设置草稿状态（只验证必要字段）
  'planNameSettings.draft': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: 'workout名称必须是字符串' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    // 其他字段都是可选的，为空时跳过验证，有值时进行格式验证
    description: [
      { rule: 'optional', params: ['string'], message: '描述必须是字符串' }
    ],
    planName: [
      { rule: 'optional', params: ['string'], message: 'plan名称必须是字符串' }
    ],
    stage1Name: [
      { rule: 'optional', params: ['string'], message: 'stage1名称必须是字符串' }
    ],
    stage2Name: [
      { rule: 'optional', params: ['string'], message: 'stage2名称必须是字符串' }
    ],
    stage3Name: [
      { rule: 'optional', params: ['string'], message: 'stage3名称必须是字符串' }
    ],
    stage4Name: [
      { rule: 'optional', params: ['string'], message: 'stage4名称必须是字符串' }
    ],
    ruleList: [
      { rule: 'optional', params: ['array'], message: 'rule列表必须是数组' }
    ]
  },

  // Music 音乐验证规则
  'music': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    displayName: [
      { rule: 'required' },
      { rule: 'string', message: '显示名称必须是字符串' }
    ],
    audioUrl: [
      { rule: 'optional', params: ['url'], message: '音频文件地址格式不正确' }
    ],
    audioDuration: [
      { rule: 'required' },
      { rule: 'number', message: '音频时长必须是数字' },
      { rule: 'min', params: [0], message: '音频时长不能小于0' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ]
  },

  // Music 音乐草稿状态（只验证必要字段）
  'music.draft': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    displayName: [
      { rule: 'required' },
      { rule: 'string', message: '显示名称必须是字符串' }
    ],
    audioDuration: [
      { rule: 'required' },
      { rule: 'number', message: '音频时长必须是数字' },
      { rule: 'min', params: [0], message: '音频时长不能小于0' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    // 其他字段都是可选的，为空时跳过验证，有值时进行格式验证
    audioUrl: [
      { rule: 'optional', params: ['url'], message: '音频文件地址格式不正确' }
    ]
  },

  // Playlist 播放列表验证规则
  'playlist': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    type: [
      { rule: 'optional', params: ['enum', ['REGULAR', 'YOGA', 'DANCE']], message: '类型值无效，允许的值: REGULAR, YOGA, DANCE' }
    ],
    premium: [
      { rule: 'required' },
      { rule: 'number', message: '是否需要订阅必须是数字' },
      { rule: 'enum', params: [[0, 1]], message: '是否需要订阅值无效，允许的值: 0, 1' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    musicList: [
      { rule: 'optional', params: ['array'], message: 'music列表必须是数组' }
    ]
  },

  // Playlist 播放列表草稿状态（只验证必要字段）
  'playlist.draft': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    premium: [
      { rule: 'required' },
      { rule: 'number', message: '是否需要订阅必须是数字' },
      { rule: 'enum', params: [[0, 1]], message: '是否需要订阅值无效，允许的值: 0, 1' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    // 其他字段都是可选的，为空时跳过验证，有值时进行格式验证
    type: [
      { rule: 'optional', params: ['enum', ['REGULAR', 'YOGA', 'DANCE']], message: '类型值无效，允许的值: REGULAR, YOGA, DANCE' }
    ],
    musicList: [
      { rule: 'optional', params: ['array'], message: 'music列表必须是数组' }
    ]
  },

  // 动作资源草稿状态（只验证必要字段）
  'exercise.draft': {
    name: [
      { rule: 'required' },
      { rule: 'string', message: '名称必须是字符串' }
    ],
    // 其他字段都是可选的，为空时跳过验证，有值时进行格式验证
    coverImgUrl: [
      { rule: 'optional', params: ['url'], message: '封面图地址格式不正确' }
    ],
    met: [
      { rule: 'optional', params: ['integer'], message: 'MET值必须是整数' }
    ],
    structureTypeCode: [
      { rule: 'optional', params: ['enum', ['WARM_UP', 'MAIN', 'COOL_DOWN']], message: '结构类型值无效' }
    ],
    genderCode: [
      { rule: 'optional', params: ['enum', ['FEMALE', 'MALE']], message: '性别值无效' }
    ],
    difficultyCode: [
      { rule: 'optional', params: ['enum', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']], message: '难度值无效' }
    ],
    equipmentCode: [
      { rule: 'optional', params: ['enum', ['NO_EQUIPMENT', 'CHAIR']], message: '器械值无效' }
    ],
    positionCode: [
      { rule: 'optional', params: ['enum', ['STANDING', 'SEATED']], message: '部位值无效' }
    ],
    injuredCodes: [
      { rule: 'optional', params: ['enumArray', ['SHOULDER', 'BACK', 'WRIST', 'KNEE', 'ANKLE', 'HIP', 'NONE']], message: '受伤类型包含无效值' }
    ],
    nameAudioUrl: [
      { rule: 'optional', params: ['url'], message: '名称音频地址格式不正确' }
    ],
    nameAudioUrlDuration: [
      { rule: 'optional', params: ['integer'], message: '名称音频时长必须是整数' }
    ],
    howtodoScript: [
      { rule: 'optional', params: ['string'], message: 'How to do文本必须是字符串' }
    ],
    howtodoAudioUrl: [
      { rule: 'optional', params: ['url'], message: 'How to do音频地址格式不正确' }
    ],
    howtodoAudioUrlDuration: [
      { rule: 'optional', params: ['integer'], message: 'How to do音频时长必须是整数' }
    ],
    guidanceScript: [
      { rule: 'optional', params: ['string'], message: '指导文本必须是字符串' }
    ],
    guidanceAudioUrl: [
      { rule: 'optional', params: ['url'], message: '指导音频地址格式不正确' }
    ],
    guidanceAudioUrlDuration: [
      { rule: 'optional', params: ['integer'], message: '指导音频时长必须是整数' }
    ],
    frontVideoUrl: [
      { rule: 'optional', params: ['url'], message: '正机位视频地址格式不正确' }
    ],
    frontVideoUrlDuration: [
      { rule: 'optional', params: ['integer'], message: '正机位视频时长必须是整数' }
    ],
    sideVideoUrl: [
      { rule: 'optional', params: ['url'], message: '侧机位视频地址格式不正确' }
    ],
    sideVideoUrlDuration: [
      { rule: 'optional', params: ['integer'], message: '侧机位视频时长必须是整数' }
    ],
    status: [
      { rule: 'required' },
      { rule: 'enum', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态值无效，允许的值: DRAFT, ENABLED, DISABLED' }
    ]
  },

  // exercise 查询条件验证
  'exercise.query': {
    statusList: [
      { rule: 'stringArray', message: '状态列表必须是字符串数组' },
      { rule: 'enumArray', params: [['DRAFT', 'ENABLED', 'DISABLED']], message: '状态列表包含无效值，允许的值: DRAFT, ENABLED, DISABLED' }
    ],
    structureTypeCodeList: [
      { rule: 'stringArray', message: '结构类型列表必须是字符串数组' },
      { rule: 'enumArray', params: [['WARM_UP', 'MAIN', 'COOL_DOWN']], message: '结构类型列表包含无效值，允许的值: WARM_UP, MAIN, COOL_DOWN' }
    ],
    genderCodeList: [
      { rule: 'stringArray', message: '性别列表必须是字符串数组' },
      { rule: 'enumArray', params: [['FEMALE', 'MALE']], message: '性别列表包含无效值，允许的值: FEMALE, MALE' }
    ],
    difficultyCodeList: [
      { rule: 'stringArray', message: '难度列表必须是字符串数组' },
      { rule: 'enumArray', params: [['BEGINNER', 'INTERMEDIATE', 'ADVANCED']], message: '难度列表包含无效值，允许的值: BEGINNER, INTERMEDIATE, ADVANCED' }
    ],
    equipmentCodeList: [
      { rule: 'stringArray', message: '器械列表必须是字符串数组' },
      { rule: 'enumArray', params: [['NO_EQUIPMENT', 'CHAIR']], message: '器械列表包含无效值，允许的值: NO_EQUIPMENT, CHAIR' }
    ],
    positionCodeList: [
      { rule: 'stringArray', message: '部位列表必须是字符串数组' },
      { rule: 'enumArray', params: [['STANDING', 'SEATED']], message: '部位列表包含无效值，允许的值: STANDING, SEATED' }
    ]
  },

  // 文件上传接口
  'files.upload': {
    mimetype: [
      { rule: 'required' },
      {
        rule: 'enum', params: [[
          // 图片类型
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
          // 音频类型
          'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/ogg',
          // 视频类型
          'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
          // 文档类型
          'application/pdf', 'text/plain', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          // 其他类型
          'application/json', 'text/csv'
        ]], message: '不支持的文件类型'
      }
    ],
    original_name: [
      { rule: 'required' },
      { rule: 'length', params: [1, 255], message: '原始文件名长度必须在1-255之间' }
    ],
    file_name: [
      { rule: 'required' },
      { rule: 'length', params: [1, 255], message: '文件名长度必须在1-255之间' }
    ],
    file_path: [
      { rule: 'required' },
      { rule: 'length', params: [1, 500], message: '文件路径长度必须在1-500之间' }
    ],
    file_size: [
      { rule: 'required' },
      { rule: 'integer', params: [0], message: '文件大小必须是大于等于0的整数' }
    ],
    mime_type: [
      { rule: 'required' },
      { rule: 'length', params: [1, 100], message: '文件类型长度必须在1-100之间' }
    ]
  },

  // 枚举数据接口
  'enum_data.create': {
    type: [
      { rule: 'required' },
      { rule: 'length', params: [1, 50], message: '枚举类型长度必须在1-50之间' }
    ],
    key: [
      { rule: 'required' },
      { rule: 'length', params: [1, 100], message: '枚举键长度必须在1-100之间' }
    ],
    value: [
      { rule: 'required' },
      { rule: 'length', params: [1, 255], message: '枚举值长度必须在1-255之间' }
    ],
    sort_order: [
      { rule: 'integer', params: [0], message: '排序必须是大于等于0的整数' }
    ]
  },

  'enum_data.update': {
    type: [
      { rule: 'length', params: [1, 50], message: '枚举类型长度必须在1-50之间' }
    ],
    key: [
      { rule: 'length', params: [1, 100], message: '枚举键长度必须在1-100之间' }
    ],
    value: [
      { rule: 'length', params: [1, 255], message: '枚举值长度必须在1-255之间' }
    ],
    sort_order: [
      { rule: 'integer', params: [0], message: '排序必须是大于等于0的整数' }
    ]
  }
};

/**
 * 验证单个字段
 * @param {*} value - 字段值
 * @param {string} fieldName - 字段名
 * @param {Array} rules - 验证规则数组
 * @returns {Object} 验证结果
 */
const validateField = (value, fieldName, rules) => {
  const errors = [];

  for (const ruleConfig of rules) {
    const { rule, params = [], message } = ruleConfig;
    const validationRule = ValidationRules[rule];

    if (!validationRule) {
      console.warn(`未知的验证规则: ${rule}`);
      continue;
    }

    // 对于 required 规则，直接传递字段名，让规则函数自己生成消息
    // 对于其他规则，如果有自定义消息则使用，否则使用字段名
    const messageOrFieldName = (rule === 'required') ? fieldName : (message || fieldName);

    const result = validationRule(value, messageOrFieldName, ...params);
    if (!result.valid) {
      errors.push(result.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 验证接口数据
 * @param {string} apiKey - 接口标识 (如: 'app_info.create', 'user.update')
 * @param {Object} data - 数据对象
 * @returns {Object} 验证结果
 */
const validateApiData = (apiKey, data) => {
  const config = ApiValidationConfig[apiKey];
  if (!config) {
    return { valid: true, errors: [] };
  }

  const errors = [];

  for (const [fieldName, rules] of Object.entries(config)) {
    const value = data[fieldName];

    // 检查是否有 required 规则或 optional 规则
    const hasRequiredRule = rules.some(rule => rule.rule === 'required');
    const hasOptionalRule = rules.some(rule => rule.rule === 'optional');

    // 如果字段不存在且没有required规则，则跳过验证
    if (value === undefined && !hasRequiredRule) {
      continue;
    }

    // 如果是 optional 规则且值为空，则跳过其他验证
    if (hasOptionalRule && (value === null || value === undefined || value === '')) {
      continue;
    }

    const fieldResult = validateField(value, fieldName, rules);
    if (!fieldResult.valid) {
      errors.push(...fieldResult.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 验证表数据（兼容旧接口）
 * @param {string} tableName - 表名
 * @param {Object} data - 数据对象
 * @param {string} operation - 操作类型 ('insert' | 'update')
 * @returns {Object} 验证结果
 */
const validateTableData = (tableName, data, operation = 'insert') => {
  // 将表名和操作转换为接口标识
  const apiKey = `${tableName}.${operation === 'insert' ? 'create' : 'update'}`;
  return validateApiData(apiKey, data);
};

/**
 * 数据预处理
 * @param {Object} data - 原始数据
 * @returns {Object} 处理后的数据
 */
const preprocessData = (data) => {
  const processed = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }

    // 字符串去除首尾空格
    if (typeof value === 'string') {
      processed[key] = value.trim();
    } else {
      processed[key] = value;
    }
  }

  return processed;
};

/**
 * 添加自定义验证规则
 * @param {string} ruleName - 规则名称
 * @param {Function} ruleFunction - 规则函数
 */
const addValidationRule = (ruleName, ruleFunction) => {
  ValidationRules[ruleName] = ruleFunction;
};

/**
 * 添加接口验证配置
 * @param {string} apiKey - 接口标识
 * @param {Object} config - 验证配置
 */
const addApiValidationConfig = (apiKey, config) => {
  ApiValidationConfig[apiKey] = config;
};

/**
 * 添加表验证配置（兼容旧接口）
 * @param {string} tableName - 表名
 * @param {Object} config - 验证配置
 */
const addTableValidationConfig = (tableName, config) => {
  // 为创建和更新操作分别添加配置
  ApiValidationConfig[`${tableName}.create`] = config.create || config;
  ApiValidationConfig[`${tableName}.update`] = config.update || config;
};

module.exports = {
  ValidationRules,
  ApiValidationConfig,
  validateField,
  validateApiData,
  validateTableData,
  preprocessData,
  addValidationRule,
  addApiValidationConfig,
  addTableValidationConfig
};
