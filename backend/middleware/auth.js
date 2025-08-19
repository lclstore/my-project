const jwt = require('jsonwebtoken');
const { ERROR_CODES, sendError, sendSuccess } = require('../utils/response');
const { isBlacklisted } = require('../utils/tokenBlacklist');
const { isPublicRoute } = require('../config/publicRoutes');

// JWT验证中间件-验证令牌
const verifyToken = (req, res, next) => {
  try {
    // 检查是否为公开路由
    if (isPublicRoute(req.method, req.path)) {
      return next();
    }

    const token = req.headers.token

    if (!token) {
      return sendError(res, ERROR_CODES.MISSING_TOKEN, null, 401);
    }

    // 检查token是否在黑名单中
    if (isBlacklisted(token)) {
      return sendError(res, ERROR_CODES.INVALID_TOKEN, '令牌已失效', 401);
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 将用户信息添加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };

    next();

  } catch (error) {
    console.error('Token验证错误:', error);

    if (error.name === 'JsonWebTokenError') {
      return sendError(res, ERROR_CODES.INVALID_TOKEN, null, 401);
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(200).json({
        success: false,
        errCode: "USR001",
        errMessage: "The user is not logged in."
      });
    }

    return sendError(res, ERROR_CODES.INTERNAL_ERROR, null, 500);
  }
};

// 可选的JWT验证中间件（token可有可无）
const optionalVerifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有token，继续执行，但不设置用户信息
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };

    next();

  } catch (error) {
    // token验证失败，但不阻止请求继续
    console.warn('可选Token验证失败:', error.message);
    req.user = null;
    next();
  }
};

module.exports = {
  verifyToken,
  optionalVerifyToken
};
