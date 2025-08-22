/**
 * 验证异常类
 * 用于数据验证失败的情况
 */

const BaseException = require('./BaseException');

class ValidationException extends BaseException {
  constructor(message = 'Validation failed', errors = {}, details = null) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.errors = errors;
  }

  /**
   * 转换为HTTP响应格式
   */
  toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        errors: this.errors,
        details: this.details
      },
      timestamp: this.timestamp
    };
  }

  /**
   * 创建字段验证错误
   */
  static field(fieldName, message, value = null) {
    return new ValidationException(`${fieldName} validation failed`, {
      [fieldName]: message
    }, { field: fieldName, value });
  }

  /**
   * 创建多字段验证错误
   */
  static fields(errors) {
    const errorMessages = Object.values(errors).join(', ');
    return new ValidationException(`Validation failed: ${errorMessages}`, errors);
  }

  /**
   * 创建必填字段错误
   */
  static required(fieldName) {
    return this.field(fieldName, `${fieldName} is required`);
  }

  /**
   * 创建格式错误
   */
  static format(fieldName, expectedFormat) {
    return this.field(fieldName, `${fieldName} must be in ${expectedFormat} format`);
  }
}

module.exports = ValidationException;