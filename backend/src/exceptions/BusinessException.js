/**
 * 业务异常类
 * 用于业务逻辑相关的错误
 */

const BaseException = require('./BaseException');

class BusinessException extends BaseException {
  constructor(message, code = 'BUSINESS_ERROR', details = null) {
    super(message, code, 400, details);
  }

  /**
   * 用户不存在
   */
  static userNotFound(userId = null) {
    return new BusinessException('用户不存在', 'USER_NOT_FOUND', { userId });
  }

  /**
   * 用户已存在
   */
  static userExists(email = null) {
    return new BusinessException('用户已存在', 'USER_EXISTS', { email });
  }

  /**
   * 密码错误
   */
  static invalidPassword() {
    return new BusinessException('密码错误', 'INVALID_PASSWORD');
  }

  /**
   * 账户被禁用
   */
  static accountDisabled() {
    return new BusinessException('账户已被禁用', 'ACCOUNT_DISABLED');
  }

  /**
   * 权限不足
   */
  static insufficientPermissions(action = null) {
    return new BusinessException('权限不足', 'INSUFFICIENT_PERMISSIONS', { action });
  }

  /**
   * 资源不存在
   */
  static resourceNotFound(resource = null, id = null) {
    return new BusinessException('资源不存在', 'RESOURCE_NOT_FOUND', { resource, id });
  }

  /**
   * 资源已存在
   */
  static resourceExists(resource = null, identifier = null) {
    return new BusinessException('资源已存在', 'RESOURCE_EXISTS', { resource, identifier });
  }

  /**
   * 操作不允许
   */
  static operationNotAllowed(operation = null, reason = null) {
    return new BusinessException('操作不允许', 'OPERATION_NOT_ALLOWED', { operation, reason });
  }

  /**
   * 数据冲突
   */
  static dataConflict(field = null, value = null) {
    return new BusinessException('数据冲突', 'DATA_CONFLICT', { field, value });
  }

  /**
   * 业务规则违反
   */
  static businessRuleViolation(rule = null, details = null) {
    return new BusinessException('违反业务规则', 'BUSINESS_RULE_VIOLATION', { rule, ...details });
  }

  /**
   * 外部服务错误
   */
  static externalServiceError(service = null, originalError = null) {
    return new BusinessException('外部服务错误', 'EXTERNAL_SERVICE_ERROR', {
      service,
      originalError: originalError?.message
    });
  }
}

module.exports = BusinessException;