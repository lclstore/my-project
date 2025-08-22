/**
 * 异常类统一导出
 */

const BaseException = require('./BaseException');
const HttpException = require('./HttpException');
const ValidationException = require('./ValidationException');
const BusinessException = require('./BusinessException');

module.exports = {
  BaseException,
  HttpException,
  ValidationException,
  BusinessException
};