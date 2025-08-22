/**
 * 错误处理中间件
 * 统一处理应用中的错误
 */

const Logger = require('../core/Logger');
const { ERROR_CODES, HTTP_STATUS } = require('../config/constants');
const config = require('../config');
const { BaseException } = require('../exceptions');

const logger = new Logger();

/**
 * 自定义错误基类
 */
class BaseError extends Error {
  constructor(message, statusCode = 500, errorCode = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 业务逻辑错误
 */
class BusinessError extends BaseError {
  constructor(message, errorCode = ERROR_CODES.INTERNAL_ERROR) {
    super(message, HTTP_STATUS.BAD_REQUEST, errorCode);
  }
}

/**
 * 验证错误
 */
class ValidationError extends BaseError {
  constructor(message, details = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    this.details = details;
  }
}

/**
 * 认证错误
 */
class AuthenticationError extends BaseError {
  constructor(message) {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

/**
 * 权限错误
 */
class PermissionError extends BaseError {
  constructor(message) {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.PERMISSION_DENIED);
  }
}

/**
 * 资源不存在错误
 */
class NotFoundError extends BaseError {
  constructor(message) {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RECORD_NOT_FOUND);
  }
}

/**
 * 冲突错误
 */
class ConflictError extends BaseError {
  constructor(message) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ENTRY);
  }
}

/**
 * 限流错误
 */
class RateLimitError extends BaseError {
  constructor(message) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * 判断错误是否为已知的操作错误
 */
function isOperationalError(error) {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

/**
 * 格式化错误响应
 */
function formatErrorResponse(error, req) {
  const response = {
    success: false,
    errCode: ERROR_CODES.INTERNAL_ERROR,
    errMessage: '服务器内部错误',
    message: '服务器内部错误',
    data: null
  };

  // 如果是新的异常系统
  if (error instanceof BaseException) {
    return error.toResponse();
  }
  // 如果是自定义错误
  else if (error instanceof BaseError) {
    response.errCode = error.errorCode;
    response.errMessage = error.message;
    response.message = error.message;

    // 验证错误包含详细信息
    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }
  }
  // 数据库错误
  else if (error.code) {
    switch (error.code) {
    case 'ER_DUP_ENTRY':
      response.errCode = ERROR_CODES.DUPLICATE_ENTRY;
      response.errMessage = '数据已存在';
      response.message = '数据已存在';
      break;
    case 'ER_NO_REFERENCED_ROW_2':
      response.errCode = ERROR_CODES.FOREIGN_KEY_CONSTRAINT;
      response.errMessage = '关联数据不存在';
      response.message = '关联数据不存在';
      break;
    case 'ER_ROW_IS_REFERENCED_2':
      response.errCode = ERROR_CODES.FOREIGN_KEY_CONSTRAINT;
      response.errMessage = '数据被其他记录引用，无法删除';
      response.message = '数据被其他记录引用，无法删除';
      break;
    case 'ECONNREFUSED':
      response.errCode = ERROR_CODES.DATABASE_ERROR;
      response.errMessage = '数据库连接失败';
      response.message = '数据库连接失败';
      break;
    default:
      response.errCode = ERROR_CODES.DATABASE_ERROR;
      response.errMessage = '数据库操作失败';
      response.message = '数据库操作失败';
    }
  }
  // JWT错误
  else if (error.name === 'JsonWebTokenError') {
    response.errCode = ERROR_CODES.TOKEN_INVALID;
    response.errMessage = '无效的访问令牌';
    response.message = '无效的访问令牌';
  } else if (error.name === 'TokenExpiredError') {
    response.errCode = ERROR_CODES.TOKEN_EXPIRED;
    response.errMessage = '访问令牌已过期';
    response.message = '访问令牌已过期';
  }
  // 其他已知错误
  else if (error.name === 'CastError') {
    response.errCode = ERROR_CODES.INVALID_PARAMS;
    response.errMessage = '参数格式错误';
    response.message = '参数格式错误';
  } else if (error.name === 'ValidationError') {
    response.errCode = ERROR_CODES.VALIDATION_ERROR;
    response.errMessage = error.message || '数据验证失败';
    response.message = error.message || '数据验证失败';
  }

  // 开发环境显示详细错误信息
  if (config.isDevelopment()) {
    response.stack = error.stack;
    response.details = {
      name: error.name,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    };
  }

  return response;
}

/**
 * 记录错误日志
 */
function logError(error, req, res) {
  const logData = {
    error: {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'user-agent': req.get('User-Agent'),
        'authorization': req.get('Authorization') ? '[HIDDEN]' : undefined,
        'content-type': req.get('Content-Type')
      },
      ip: req.ip,
      user: req.user ? {
        userId: req.user.userId,
        email: req.user.email
      } : undefined
    },
    response: {
      statusCode: res.statusCode
    },
    timestamp: new Date().toISOString()
  };

  // 根据错误类型选择日志级别
  if (isOperationalError(error)) {
    if (error.statusCode >= 500) {
      logger.error('服务器错误:', logData);
    } else {
      logger.warn('客户端错误:', logData);
    }
  } else {
    logger.error('未知错误:', logData);
  }
}

/**
 * 全局错误处理中间件
 */
function errorHandler(error, req, res, next) {
  try {
    // 记录错误日志
    logError(error, req, res);

    // 格式化错误响应
    const errorResponse = formatErrorResponse(error, req);

    // 确定HTTP状态码
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

    if (error instanceof BaseError) {
      statusCode = error.statusCode;
    } else if (error.status) {
      statusCode = error.status;
    } else if (error.statusCode) {
      statusCode = error.statusCode;
    }

    // 发送错误响应
    res.status(statusCode).json(errorResponse);
  } catch (handlerError) {
    // 错误处理中间件本身出错
    logger.error('错误处理中间件异常:', {
      originalError: error.message,
      handlerError: handlerError.message,
      stack: handlerError.stack
    });

    // 发送最基本的错误响应
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      errCode: ERROR_CODES.INTERNAL_ERROR,
      errMessage: '服务器内部错误',
      message: '服务器内部错误',
      data: null
    });
  }
}

/**
 * 404错误处理中间件
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`接口 ${req.originalUrl} 不存在`);
  next(error);
}

/**
 * 异步错误捕获装饰器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 未捕获异常处理
 */
function handleUncaughtExceptions() {
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // 优雅关闭服务器
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
      timestamp: new Date().toISOString()
    });

    // 优雅关闭服务器
    process.exit(1);
  });
}

/**
 * 创建错误实例的便利方法
 */
const createError = {
  business: (message, errorCode) => new BusinessError(message, errorCode),
  validation: (message, details) => new ValidationError(message, details),
  authentication: (message) => new AuthenticationError(message),
  permission: (message) => new PermissionError(message),
  notFound: (message) => new NotFoundError(message),
  conflict: (message) => new ConflictError(message),
  rateLimit: (message) => new RateLimitError(message)
};

module.exports = {
  // 错误类
  BaseError,
  BusinessError,
  ValidationError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  RateLimitError,

  // 中间件
  errorHandler,
  notFoundHandler,

  // 工具函数
  asyncHandler,
  isOperationalError,
  formatErrorResponse,
  handleUncaughtExceptions,
  createError
};