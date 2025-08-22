/**
 * 数据验证工具类
 * 提供常用的验证方法
 */

class Validator {
  /**
   * 验证邮箱格式
   */
  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式（中国大陆）
   */
  static isPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证密码强度
   * 至少8位，包含大小写字母和数字
   */
  static isStrongPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 验证URL格式
   */
  static isURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证是否为正整数
   */
  static isPositiveInteger(value) {
    const num = parseInt(value, 10);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * 验证字符串长度
   */
  static isLength(str, min = 0, max = Infinity) {
    if (typeof str !== 'string') {return false;}
    return str.length >= min && str.length <= max;
  }

  /**
   * 验证是否为空值
   */
  static isEmpty(value) {
    return value === null ||
           value === undefined ||
           value === '' ||
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  /**
   * 验证必填字段
   */
  static required(value, fieldName = 'Field') {
    if (this.isEmpty(value)) {
      throw new Error(`${fieldName} is required`);
    }
    return true;
  }

  /**
   * 验证数据类型
   */
  static isType(value, type) {
    switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && !Array.isArray(value) && value !== null;
    case 'date':
      return value instanceof Date || !isNaN(Date.parse(value));
    default:
      return false;
    }
  }

  /**
   * 验证数值范围
   */
  static isInRange(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * 验证枚举值
   */
  static isIn(value, allowedValues) {
    return Array.isArray(allowedValues) && allowedValues.includes(value);
  }

  /**
   * 验证JSON字符串
   */
  static isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证IP地址
   */
  static isIP(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * 批量验证
   */
  static validate(data, rules) {
    const errors = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];

      try {
        // 处理必填验证
        if (fieldRules.required && this.isEmpty(value)) {
          errors[field] = `${field} is required`;
          continue;
        }

        // 如果不是必填且值为空，跳过其他验证
        if (!fieldRules.required && this.isEmpty(value)) {
          continue;
        }

        // 类型验证
        if (fieldRules.type && !this.isType(value, fieldRules.type)) {
          errors[field] = `${field} must be of type ${fieldRules.type}`;
          continue;
        }

        // 长度验证
        if (fieldRules.minLength || fieldRules.maxLength) {
          const min = fieldRules.minLength || 0;
          const max = fieldRules.maxLength || Infinity;
          if (!this.isLength(value, min, max)) {
            errors[field] = `${field} length must be between ${min} and ${max}`;
            continue;
          }
        }

        // 数值范围验证
        if ((fieldRules.min !== undefined || fieldRules.max !== undefined) &&
            fieldRules.type === 'number') {
          const min = fieldRules.min || -Infinity;
          const max = fieldRules.max || Infinity;
          if (!this.isInRange(value, min, max)) {
            errors[field] = `${field} must be between ${min} and ${max}`;
            continue;
          }
        }

        // 枚举值验证
        if (fieldRules.in && !this.isIn(value, fieldRules.in)) {
          errors[field] = `${field} must be one of: ${fieldRules.in.join(', ')}`;
          continue;
        }

        // 邮箱验证
        if (fieldRules.email && !this.isEmail(value)) {
          errors[field] = `${field} must be a valid email`;
          continue;
        }

        // 手机号验证
        if (fieldRules.phone && !this.isPhone(value)) {
          errors[field] = `${field} must be a valid phone number`;
          continue;
        }

        // 密码强度验证
        if (fieldRules.strongPassword && !this.isStrongPassword(value)) {
          errors[field] = `${field} must be at least 8 characters with uppercase, lowercase and number`;
          continue;
        }

        // 自定义验证函数
        if (fieldRules.custom && typeof fieldRules.custom === 'function') {
          const customResult = fieldRules.custom(value, data);
          if (customResult !== true) {
            errors[field] = customResult || `${field} is invalid`;
          }
        }

      } catch (error) {
        errors[field] = error.message;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = Validator;