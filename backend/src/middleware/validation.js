/**
 * 参数验证中间件
 * 提供请求参数验证功能
 */

const Logger = require('../core/Logger');
const { ERROR_CODES, REGEX_PATTERNS } = require('../config/constants');

const logger = new Logger();

/**
 * 验证规则类
 */
class ValidationRule {
  constructor(rules = {}) {
    this.rules = rules;
  }

  /**
   * 验证单个字段
   */
  validateField(fieldName, value, rule) {
    const errors = [];

    // 必填验证
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName}不能为空`);
      return errors; // 必填验证失败直接返回
    }

    // 如果字段为空且非必填，跳过其他验证
    if ((value === undefined || value === null || value === '') && !rule.required) {
      return errors;
    }

    // 类型验证
    if (rule.type) {
      switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName}必须是字符串`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push(`${fieldName}必须是数字`);
        }
        break;
      case 'integer':
        if (!Number.isInteger(Number(value))) {
          errors.push(`${fieldName}必须是整数`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push(`${fieldName}必须是布尔值`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName}必须是数组`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${fieldName}必须是对象`);
        }
        break;
      case 'email':
        if (!REGEX_PATTERNS.EMAIL.test(value)) {
          errors.push(`${fieldName}格式不正确`);
        }
        break;
      case 'phone':
        if (!REGEX_PATTERNS.PHONE.test(value)) {
          errors.push(`${fieldName}格式不正确`);
        }
        break;
      case 'url':
        if (!REGEX_PATTERNS.URL.test(value)) {
          errors.push(`${fieldName}格式不正确`);
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push(`${fieldName}日期格式不正确`);
        }
        break;
      }
    }

    // 长度验证
    if (rule.minLength !== undefined) {
      const length = typeof value === 'string' ? value.length : String(value).length;
      if (length < rule.minLength) {
        errors.push(`${fieldName}长度不能少于${rule.minLength}个字符`);
      }
    }

    if (rule.maxLength !== undefined) {
      const length = typeof value === 'string' ? value.length : String(value).length;
      if (length > rule.maxLength) {
        errors.push(`${fieldName}长度不能超过${rule.maxLength}个字符`);
      }
    }

    // 数值范围验证
    if (rule.min !== undefined) {
      const numValue = Number(value);
      if (numValue < rule.min) {
        errors.push(`${fieldName}不能小于${rule.min}`);
      }
    }

    if (rule.max !== undefined) {
      const numValue = Number(value);
      if (numValue > rule.max) {
        errors.push(`${fieldName}不能大于${rule.max}`);
      }
    }

    // 枚举值验证
    if (rule.enum && Array.isArray(rule.enum)) {
      if (!rule.enum.includes(value)) {
        errors.push(`${fieldName}必须是以下值之一: ${rule.enum.join(', ')}`);
      }
    }

    // 正则表达式验证
    if (rule.pattern) {
      const regex = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
      if (!regex.test(value)) {
        errors.push(`${fieldName}格式不符合要求`);
      }
    }

    // 自定义验证函数
    if (rule.validator && typeof rule.validator === 'function') {
      const customResult = rule.validator(value);
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : `${fieldName}验证失败`);
      }
    }

    // 数组元素验证
    if (rule.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        const itemErrors = this.validateField(`${fieldName}[${index}]`, item, rule.items);
        errors.push(...itemErrors);
      });
    }

    return errors;
  }

  /**
   * 验证数据对象
   */
  validate(data) {
    const errors = [];

    for (const [fieldName, rule] of Object.entries(this.rules)) {
      const fieldErrors = this.validateField(fieldName, data[fieldName], rule);
      errors.push(...fieldErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * 创建验证中间件
 */
function createValidationMiddleware(rules, options = {}) {
  const {
    location = 'body', // 验证位置: body, query, params, headers
    allowUnknown = true, // 是否允许未定义的字段
    stripUnknown = false // 是否移除未定义的字段
  } = options;

  return (req, res, next) => {
    try {
      const validator = new ValidationRule(rules);
      let dataToValidate;

      // 根据位置获取要验证的数据
      switch (location) {
      case 'body':
        dataToValidate = req.body || {};
        break;
      case 'query':
        dataToValidate = req.query || {};
        break;
      case 'params':
        dataToValidate = req.params || {};
        break;
      case 'headers':
        dataToValidate = req.headers || {};
        break;
      default:
        dataToValidate = req.body || {};
      }

      // 如果不允许未知字段，检查是否有未定义的字段
      if (!allowUnknown) {
        const definedFields = Object.keys(rules);
        const receivedFields = Object.keys(dataToValidate);
        const unknownFields = receivedFields.filter(field => !definedFields.includes(field));

        if (unknownFields.length > 0) {
          return res.status(400).error(
            ERROR_CODES.VALIDATION_ERROR,
            `不允许的字段: ${unknownFields.join(', ')}`,
            400
          );
        }
      }

      // 如果需要移除未知字段
      if (stripUnknown) {
        const definedFields = Object.keys(rules);
        const filteredData = {};

        for (const field of definedFields) {
          if (dataToValidate.hasOwnProperty(field)) {
            filteredData[field] = dataToValidate[field];
          }
        }

        // 更新请求对象
        if (location === 'body') {
          req.body = filteredData;
        } else if (location === 'query') {
          req.query = filteredData;
        }

        dataToValidate = filteredData;
      }

      // 执行验证
      const validationResult = validator.validate(dataToValidate);

      if (!validationResult.valid) {
        logger.warn('参数验证失败:', {
          errors: validationResult.errors,
          data: dataToValidate,
          path: req.path,
          method: req.method,
          userId: req.user?.userId
        });

        return res.status(400).error(
          ERROR_CODES.VALIDATION_ERROR,
          validationResult.errors.join('; '),
          400
        );
      }

      // 验证通过，继续处理
      next();
    } catch (error) {
      logger.error('验证中间件错误:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      return res.status(500).error(
        ERROR_CODES.INTERNAL_ERROR,
        '参数验证服务异常',
        500
      );
    }
  };
}

/**
 * 常用验证规则
 */
const commonRules = {
  // 分页参数验证
  pagination: {
    pageIndex: { type: 'integer', min: 1, default: 1 },
    pageSize: { type: 'integer', min: 1, max: 100, default: 10 }
  },

  // ID参数验证
  id: {
    id: { required: true, type: 'integer', min: 1 }
  },

  // 状态参数验证
  status: {
    status: { type: 'integer', enum: [0, 1] }
  },

  // 用户登录验证
  userLogin: {
    email: { required: true, type: 'email', maxLength: 100 },
    password: { required: true, type: 'string', minLength: 6, maxLength: 20 }
  },

  // 用户注册验证
  userRegister: {
    email: { required: true, type: 'email', maxLength: 100 },
    password: { required: true, type: 'string', minLength: 6, maxLength: 20 },
    name: { required: false, type: 'string', maxLength: 50 }
  },

  // 修改密码验证
  changePassword: {
    oldPassword: { required: true, type: 'string' },
    newPassword: { required: true, type: 'string', minLength: 6, maxLength: 20 }
  },

  // 分类创建验证
  categoryCreate: {
    name: { required: true, type: 'string', maxLength: 100 },
    description: { required: false, type: 'string', maxLength: 500 },
    parentId: { required: false, type: 'integer', min: 1 },
    sortOrder: { required: false, type: 'integer', min: 0 }
  },

  // 批量操作验证
  batchOperation: {
    ids: {
      required: true,
      type: 'array',
      items: { type: 'integer', min: 1 }
    }
  }
};

/**
 * 预定义的验证中间件
 */
const validators = {
  // 验证分页参数
  validatePagination: createValidationMiddleware(commonRules.pagination, { location: 'query' }),

  // 验证ID参数
  validateId: createValidationMiddleware(commonRules.id, { location: 'params' }),

  // 验证用户登录
  validateUserLogin: createValidationMiddleware(commonRules.userLogin),

  // 验证用户注册
  validateUserRegister: createValidationMiddleware(commonRules.userRegister),

  // 验证修改密码
  validateChangePassword: createValidationMiddleware(commonRules.changePassword),

  // 验证分类创建
  validateCategoryCreate: createValidationMiddleware(commonRules.categoryCreate),

  // 验证批量操作
  validateBatchOperation: createValidationMiddleware(commonRules.batchOperation)
};

/**
 * 数据清理中间件
 */
function dataSanitizer(req, res, next) {
  try {
    // 清理字符串字段（去除首尾空格）
    function sanitizeObject(obj) {
      if (!obj || typeof obj !== 'object') {return obj;}

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          obj[key] = value.trim();
        } else if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        }
      }

      return obj;
    }

    // 清理请求体
    if (req.body) {
      req.body = sanitizeObject({ ...req.body });
    }

    // 清理查询参数
    if (req.query) {
      req.query = sanitizeObject({ ...req.query });
    }

    next();
  } catch (error) {
    logger.error('数据清理中间件错误:', {
      error: error.message,
      path: req.path
    });
    next(); // 清理失败不影响继续执行
  }
}

module.exports = {
  ValidationRule,
  createValidationMiddleware,
  commonRules,
  validators,
  dataSanitizer
};