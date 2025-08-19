/**
 * 统一响应结构管理
 * 基本结构：{
 *   "success": boolean,
 *   "errCode": string | null,
 *   "errMessage": string | null,
 *   "data": any
 * }
 * 
 * 查询列表时额外包含：
 * "empty": boolean,
 * "notEmpty": boolean
 */

// 错误码定义
const ERROR_CODES = {
  // 认证相关错误
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN_FORMAT: 'INVALID_TOKEN_FORMAT',
  EMPTY_TOKEN: 'EMPTY_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // 用户相关错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'USR005',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // 数据相关错误
  ENUM_NOT_FOUND: 'ENUM_NOT_FOUND',
  ENUM_VALUE_NOT_FOUND: 'ENUM_VALUE_NOT_FOUND',
  MISSING_KEYWORD: 'MISSING_KEYWORD',

  // 通用错误
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // 文件相关错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND'
};

// 错误消息定义
const ERROR_MESSAGES = {
  [ERROR_CODES.MISSING_TOKEN]: '缺少认证令牌',
  [ERROR_CODES.INVALID_TOKEN_FORMAT]: '令牌格式错误，应为 \'Bearer <token>\'',
  [ERROR_CODES.EMPTY_TOKEN]: '令牌不能为空',
  [ERROR_CODES.INVALID_TOKEN]: '无效的令牌',
  [ERROR_CODES.TOKEN_EXPIRED]: '令牌已过期',

  [ERROR_CODES.USER_NOT_FOUND]: '用户不存在',
  [ERROR_CODES.INVALID_CREDENTIALS]: '用户名或密码错误',
  [ERROR_CODES.USER_ALREADY_EXISTS]: '用户已存在',

  [ERROR_CODES.ENUM_NOT_FOUND]: '枚举不存在',
  [ERROR_CODES.ENUM_VALUE_NOT_FOUND]: '枚举值不存在',
  [ERROR_CODES.MISSING_KEYWORD]: '搜索关键词不能为空',

  [ERROR_CODES.MISSING_REQUIRED_FIELDS]: '缺少必填字段',
  [ERROR_CODES.INVALID_PARAMETERS]: '参数无效',
  [ERROR_CODES.INTERNAL_ERROR]: '服务器内部错误',
  [ERROR_CODES.DATABASE_ERROR]: '数据库操作失败',

  [ERROR_CODES.FILE_NOT_FOUND]: '文件不存在',
  [ERROR_CODES.FILE_UPLOAD_ERROR]: '文件上传失败',
  [ERROR_CODES.INVALID_FILE_TYPE]: '不支持的文件类型'
};

/**
 * 成功响应
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {Object} 标准响应格式
 */
const success = (data = null, message = null) => {
  return {
    success: true,
    errCode: null,
    errMessage: null,
    data,
    ...(message && { message })
  };
};

/**
 * 成功响应（列表数据）
 * @param {Array} data - 列表数据
 * @param {string} message - 成功消息
 * @returns {Object} 包含empty和notEmpty字段的标准响应格式
 */
const successList = (data = [], message = null) => {
  const isEmpty = !Array.isArray(data) || data.length === 0;
  return {
    success: true,
    errCode: null,
    errMessage: null,
    data,
    empty: isEmpty,
    notEmpty: !isEmpty,
    ...(message && { message })
  };
};

/**
 * 错误响应
 * @param {string} errCode - 错误码
 * @param {string} customMessage - 自定义错误消息（可选）
 * @param {any} data - 错误相关数据（可选）
 * @returns {Object} 标准错误响应格式
 */
const error = (errCode, customMessage = null, data = null) => {
  return {
    success: false,
    errCode,
    errMessage: customMessage || ERROR_MESSAGES[errCode] || '未知错误',
    data
  };
};

/**
 * 错误响应（列表数据）
 * @param {string} errCode - 错误码
 * @param {string} customMessage - 自定义错误消息（可选）
 * @param {any} data - 错误相关数据（可选）
 * @returns {Object} 包含empty和notEmpty字段的标准错误响应格式
 */
const errorList = (errCode, customMessage = null, data = null) => {
  return {
    success: false,
    errCode,
    errMessage: customMessage || ERROR_MESSAGES[errCode] || '未知错误',
    data,
    empty: true,
    notEmpty: false
  };
};

/**
 * Express响应助手 - 成功
 * @param {Object} res - Express响应对象
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @param {number} statusCode - HTTP状态码
 */
const sendSuccess = (res, data = null, message = null, statusCode = 200) => {
  res.status(statusCode).json(success(data, message));
};

/**
 * Express响应助手 - 成功列表
 * @param {Object} res - Express响应对象
 * @param {Array} data - 列表数据
 * @param {string} message - 成功消息
 * @param {number} statusCode - HTTP状态码
 */
const sendSuccessList = (res, data = [], message = null, statusCode = 200) => {
  res.status(statusCode).json(successList(data, message));
};

/**
 * Express响应助手 - 错误
 * @param {Object} res - Express响应对象
 * @param {string} errCode - 错误码
 * @param {string} customMessage - 自定义错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {any} data - 错误相关数据
 */
const sendError = (res, errCode, customMessage = null, statusCode = 400, data = null) => {
  res.status(statusCode).json(error(errCode, customMessage, data,));
};

/**
 * Express响应助手 - 错误列表
 * @param {Object} res - Express响应对象
 * @param {string} errCode - 错误码
 * @param {string} customMessage - 自定义错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {any} data - 错误相关数据
 */
const sendErrorList = (res, errCode, customMessage = null, statusCode = 400, data = null) => {
  res.status(statusCode).json(errorList(errCode, customMessage, data));
};

module.exports = {
  ERROR_CODES,
  ERROR_MESSAGES,
  success,
  successList,
  error,
  errorList,
  sendSuccess,
  sendSuccessList,
  sendError,
  sendErrorList
};
