/**
 * HTTP异常类
 * 用于HTTP相关的错误
 */

const BaseException = require('./BaseException');

class HttpException extends BaseException {
  constructor(message, statusCode = 500, code = null, details = null) {
    const errorCode = code || `HTTP_${statusCode}`;
    super(message, errorCode, statusCode, details);
  }

  /**
   * 400 Bad Request
   */
  static badRequest(message = 'Bad Request', details = null) {
    return new HttpException(message, 400, 'BAD_REQUEST', details);
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(message = 'Unauthorized', details = null) {
    return new HttpException(message, 401, 'UNAUTHORIZED', details);
  }

  /**
   * 403 Forbidden
   */
  static forbidden(message = 'Forbidden', details = null) {
    return new HttpException(message, 403, 'FORBIDDEN', details);
  }

  /**
   * 404 Not Found
   */
  static notFound(message = 'Not Found', details = null) {
    return new HttpException(message, 404, 'NOT_FOUND', details);
  }

  /**
   * 409 Conflict
   */
  static conflict(message = 'Conflict', details = null) {
    return new HttpException(message, 409, 'CONFLICT', details);
  }

  /**
   * 422 Unprocessable Entity
   */
  static unprocessableEntity(message = 'Unprocessable Entity', details = null) {
    return new HttpException(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests(message = 'Too Many Requests', details = null) {
    return new HttpException(message, 429, 'TOO_MANY_REQUESTS', details);
  }

  /**
   * 500 Internal Server Error
   */
  static internalServerError(message = 'Internal Server Error', details = null) {
    return new HttpException(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }

  /**
   * 503 Service Unavailable
   */
  static serviceUnavailable(message = 'Service Unavailable', details = null) {
    return new HttpException(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

module.exports = HttpException;