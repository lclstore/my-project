/**
 * 限流中间件
 * 防止API被恶意调用和DDoS攻击
 */

const Logger = require('../core/Logger');
const config = require('../config');
const { ERROR_CODES } = require('../config/constants');

const logger = new Logger();

// 内存存储器（生产环境建议使用Redis）
class MemoryStore {
  constructor() {
    this.clients = new Map();
    this.interval = null;
    this.startCleanup();
  }

  /**
   * 获取客户端信息
   */
  get(key) {
    return this.clients.get(key);
  }

  /**
   * 设置客户端信息
   */
  set(key, value) {
    this.clients.set(key, value);
  }

  /**
   * 删除客户端信息
   */
  delete(key) {
    this.clients.delete(key);
  }

  /**
   * 清理过期数据
   */
  startCleanup() {
    this.interval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.clients.entries()) {
        if (now > value.resetTime) {
          this.clients.delete(key);
        }
      }
    }, 60000); // 每分钟清理一次
  }

  /**
   * 停止清理
   */
  stopCleanup() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// 创建存储实例
const store = new MemoryStore();

/**
 * 获取客户端标识符
 */
function getClientId(req, options = {}) {
  const { keyGenerator } = options;

  if (keyGenerator && typeof keyGenerator === 'function') {
    return keyGenerator(req);
  }

  // 默认使用IP地址作为标识符
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * 创建限流中间件
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = config.security.rateLimitWindow, // 时间窗口（毫秒）
    max = config.security.rateLimitMax, // 最大请求次数
    message = '请求过于频繁，请稍后再试', // 限流消息
    statusCode = 429, // HTTP状态码
    skipSuccessfulRequests = false, // 是否跳过成功的请求
    skipFailedRequests = false, // 是否跳过失败的请求
    skip = null, // 跳过函数
    keyGenerator = null, // 自定义key生成器
    onLimitReached = null // 达到限制时的回调
  } = options;

  return (req, res, next) => {
    try {
      // 检查是否跳过限流
      if (skip && typeof skip === 'function' && skip(req)) {
        return next();
      }

      const clientId = getClientId(req, { keyGenerator });
      const now = Date.now();
      const resetTime = now + windowMs;

      // 获取客户端记录
      let clientRecord = store.get(clientId);

      // 初始化或重置客户端记录
      if (!clientRecord || now > clientRecord.resetTime) {
        clientRecord = {
          count: 0,
          resetTime: resetTime,
          firstRequest: now
        };
      }

      // 增加请求计数
      clientRecord.count++;

      // 检查是否超出限制
      if (clientRecord.count > max) {
        // 记录限流事件
        logger.warn('API限流触发:', {
          clientId,
          count: clientRecord.count,
          max,
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          resetTime: new Date(clientRecord.resetTime).toISOString()
        });

        // 触发限流回调
        if (onLimitReached && typeof onLimitReached === 'function') {
          onLimitReached(req, res, options);
        }

        // 设置响应头
        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': new Date(clientRecord.resetTime).toISOString(),
          'Retry-After': Math.ceil((clientRecord.resetTime - now) / 1000)
        });

        return res.status(statusCode).error(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message,
          statusCode
        );
      }

      // 更新客户端记录
      store.set(clientId, clientRecord);

      // 设置响应头
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': max - clientRecord.count,
        'X-RateLimit-Reset': new Date(clientRecord.resetTime).toISOString()
      });

      // 处理响应后的逻辑
      const originalSend = res.send;
      res.send = function(data) {
        // 根据配置决定是否计入统计
        if (skipSuccessfulRequests && res.statusCode < 400) {
          clientRecord.count--;
          store.set(clientId, clientRecord);
        } else if (skipFailedRequests && res.statusCode >= 400) {
          clientRecord.count--;
          store.set(clientId, clientRecord);
        }

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('限流中间件错误:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      // 限流中间件出错不应该阻止请求
      next();
    }
  };
}

/**
 * 预定义的限流中间件
 */

// 通用API限流
const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: 'API请求过于频繁，请稍后再试'
});

// 登录接口限流
const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次登录尝试
  message: '登录尝试过于频繁，请15分钟后再试',
  keyGenerator: (req) => {
    // 使用IP和邮箱作为key
    return `login:${req.ip}:${req.body.email || 'unknown'}`;
  },
  onLimitReached: (req, res, options) => {
    logger.warn('登录限流触发:', {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
});

// 注册接口限流
const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册
  message: '注册过于频繁，请1小时后再试',
  keyGenerator: (req) => `register:${req.ip}`
});

// 密码重置限流
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次重置
  message: '密码重置请求过于频繁，请1小时后再试'
});

// 文件上传限流
const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 50, // 最多50个文件
  message: '文件上传过于频繁，请稍后再试'
});

// 搜索接口限流
const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 最多30次搜索
  message: '搜索过于频繁，请稍后再试'
});

/**
 * 基于用户的限流中间件
 */
const userBasedRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 1000, // 每个用户每小时1000次请求
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.userId}` : `ip:${req.ip}`;
  },
  skip: (req) => {
    // 跳过管理员限流
    return req.user && req.user.type === 'admin';
  }
});

/**
 * 获取限流状态
 */
function getRateLimitStatus(req, options = {}) {
  const clientId = getClientId(req, options);
  const clientRecord = store.get(clientId);

  if (!clientRecord) {
    return {
      limit: options.max || config.security.rateLimitMax,
      remaining: options.max || config.security.rateLimitMax,
      reset: new Date(Date.now() + (options.windowMs || config.security.rateLimitWindow)).toISOString()
    };
  }

  return {
    limit: options.max || config.security.rateLimitMax,
    remaining: Math.max(0, (options.max || config.security.rateLimitMax) - clientRecord.count),
    reset: new Date(clientRecord.resetTime).toISOString()
  };
}

/**
 * 清除特定客户端的限流记录
 */
function clearRateLimit(clientId) {
  store.delete(clientId);
}

/**
 * 获取所有限流统计
 */
function getRateLimitStats() {
  const stats = {
    totalClients: store.clients.size,
    clients: []
  };

  const now = Date.now();
  for (const [clientId, record] of store.clients.entries()) {
    if (now < record.resetTime) {
      stats.clients.push({
        clientId,
        count: record.count,
        resetTime: new Date(record.resetTime).toISOString(),
        firstRequest: new Date(record.firstRequest).toISOString()
      });
    }
  }

  return stats;
}

// 进程退出时清理
process.on('exit', () => {
  store.stopCleanup();
});

module.exports = {
  createRateLimiter,
  apiRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  userBasedRateLimiter,
  getRateLimitStatus,
  clearRateLimit,
  getRateLimitStats,
  MemoryStore
};