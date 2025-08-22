/**
 * 请求ID中间件
 * 为每个请求生成唯一ID，便于日志追踪
 */

const crypto = require('crypto');

const requestId = (options = {}) => {
  const {
    headerName = 'X-Request-ID',
    attributeName = 'requestId',
    generator = () => crypto.randomUUID()
  } = options;

  return (req, res, next) => {
    // 从请求头获取ID，如果没有则生成新的
    const id = req.headers[headerName.toLowerCase()] || generator();

    // 设置请求对象属性
    req[attributeName] = id;

    // 设置响应头
    res.setHeader(headerName, id);

    next();
  };
};

module.exports = { requestId };