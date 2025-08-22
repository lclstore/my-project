/**
 * 认证中间件
 * 处理JWT token验证和用户身份认证
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const Logger = require('../core/Logger');
const { ERROR_CODES } = require('../config/constants');

const logger = new Logger();

// 公开路由列表（不需要认证的路径）
const PUBLIC_ROUTES = [
  '/health',
  '/info',
  '/swagger-ui',
  '/swagger.json',
  '/user/login',
  '/user/register',
  '/user/refresh-token',
  '/user/check-email',
  '/category/tree',
  '/category/top',
  // 支持动态路径匹配
  { pattern: /^\/category\/\d+$/, method: 'GET' },
  { pattern: /^\/category\/\d+\/children$/, method: 'GET' },
  { pattern: /^\/category\/\d+\/breadcrumb$/, method: 'GET' }
];

/**
 * 检查路径是否为公开路由
 */
function isPublicRoute(path, method = 'GET') {
  return PUBLIC_ROUTES.some(route => {
    if (typeof route === 'string') {
      return path === route || path.startsWith(route);
    } else if (route.pattern) {
      return route.pattern.test(path) && (!route.method || route.method === method);
    }
    return false;
  });
}

/**
 * 从请求中提取token
 */
function extractToken(req) {
  let token = null;

  // 从Authorization header提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 从token header提取（兼容旧版本）
  if (!token && req.headers.token) {
    token = req.headers.token;
  }

  // 从X-Token header提取
  if (!token && req.headers['x-token']) {
    token = req.headers['x-token'];
  }

  return token;
}

/**
 * 验证JWT token
 */
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });

    // 检查token类型
    if (decoded.type !== 'access') {
      return {
        success: false,
        error: ERROR_CODES.TOKEN_INVALID,
        message: '无效的访问令牌类型'
      };
    }

    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: ERROR_CODES.TOKEN_EXPIRED,
        message: '访问令牌已过期'
      };
    } else if (error.name === 'JsonWebTokenError') {
      return {
        success: false,
        error: ERROR_CODES.TOKEN_INVALID,
        message: '无效的访问令牌'
      };
    } else {
      return {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: '身份验证失败'
      };
    }
  }
}

/**
 * 认证中间件
 */
async function authMiddleware(req, res, next) {
  try {
    const { path } = req;
    const { method } = req;

    // 检查是否为公开路由
    if (isPublicRoute(path, method)) {
      return next();
    }

    // 提取token
    const token = extractToken(req);

    if (!token) {
      logger.warn('访问受保护资源但未提供token:', {
        path,
        method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(200).error(
        ERROR_CODES.UNAUTHORIZED,
        '访问令牌缺失',
        401
      );
    }

    // 验证token
    const verifyResult = await verifyToken(token);

    if (!verifyResult.success) {
      logger.warn('Token验证失败:', {
        error: verifyResult.error,
        message: verifyResult.message,
        path,
        method,
        ip: req.ip
      });

      return res.status(200).error(
        verifyResult.error,
        verifyResult.message,
        401
      );
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: verifyResult.data.userId,
      email: verifyResult.data.email,
      tokenData: verifyResult.data
    };

    // 记录成功的身份验证
    logger.debug('身份验证成功:', {
      userId: req.user.userId,
      email: req.user.email,
      path,
      method
    });

    next();
  } catch (error) {
    logger.error('认证中间件错误:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });

    return res.status(200).error(
      ERROR_CODES.INTERNAL_ERROR,
      '身份验证服务异常',
      500
    );
  }
}

/**
 * 权限检查中间件工厂
 * @param {string|Array} requiredRoles - 需要的角色
 * @param {string|Array} requiredPermissions - 需要的权限
 */
function requirePermission(requiredRoles = [], requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      // 确保用户已认证
      if (!req.user) {
        return res.status(200).error(
          ERROR_CODES.UNAUTHORIZED,
          '未认证的用户',
          401
        );
      }

      // 这里可以添加角色和权限检查逻辑
      // 目前简化实现，后续可以根据需要扩展

      // 示例：检查管理员权限
      if (requiredRoles.includes('admin')) {
        // 这里需要从数据库或缓存中获取用户角色信息
        // const userRoles = await getUserRoles(req.user.userId);
        // if (!userRoles.includes('admin')) {
        //   return res.status(403).error(
        //     ERROR_CODES.PERMISSION_DENIED,
        //     '权限不足',
        //     403
        //   );
        // }
      }

      next();
    } catch (error) {
      logger.error('权限检查错误:', {
        error: error.message,
        userId: req.user?.userId,
        requiredRoles,
        requiredPermissions
      });

      return res.status(200).error(
        ERROR_CODES.INTERNAL_ERROR,
        '权限检查服务异常',
        500
      );
    }
  };
}

/**
 * 管理员权限中间件
 */
const requireAdmin = requirePermission(['admin']);

/**
 * 可选认证中间件（用户可登录可不登录的接口）
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (token) {
      const verifyResult = await verifyToken(token);

      if (verifyResult.success) {
        req.user = {
          userId: verifyResult.data.userId,
          email: verifyResult.data.email,
          tokenData: verifyResult.data
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证出错不影响继续执行
    logger.warn('可选认证处理出错:', {
      error: error.message,
      path: req.path
    });
    next();
  }
}

module.exports = {
  authMiddleware,
  requirePermission,
  requireAdmin,
  optionalAuth,
  isPublicRoute,
  extractToken,
  verifyToken
};