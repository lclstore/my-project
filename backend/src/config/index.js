/**
 * 配置管理入口
 * 统一管理所有配置项
 */

const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const config = {
  // 应用配置
  app: {
    name: process.env.APP_NAME || 'Backend API',
    version: '2.0.0',
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    url: process.env.APP_URL || `http://localhost:${parseInt(process.env.PORT) || 8080}`,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    timezone: process.env.TZ || 'Asia/Shanghai'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'backend_db',
    charset: 'utf8mb4',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
    // 移除不支持的配置选项
    // acquireTimeout: 60000,  // MySQL2 不再支持
    // timeout: 60000,         // MySQL2 不再支持
    // reconnect: true         // MySQL2 不再支持
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'backend:',
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'backend-api',
    audience: process.env.JWT_AUDIENCE || 'backend-users'
  },

  // 文件上传配置
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx').split(','),
    destination: process.env.UPLOAD_DESTINATION || path.join(__dirname, '../../storage/uploads'),
    publicPath: process.env.UPLOAD_PUBLIC_PATH || '/uploads'
  },

  // Cloudinary配置
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'default',
    folder: process.env.CLOUDINARY_FOLDER || 'backend-uploads'
  },

  // 邮件配置
  mail: {
    driver: process.env.MAIL_DRIVER || 'smtp',
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    username: process.env.MAIL_USERNAME || '',
    password: process.env.MAIL_PASSWORD || '',
    fromName: process.env.MAIL_FROM_NAME || 'Backend API',
    fromAddress: process.env.MAIL_FROM_ADDRESS || 'noreply@example.com'
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE === 'true',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 7,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    console: process.env.LOG_CONSOLE !== 'false'
  },

  // 安全配置
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15分钟
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false
    }
  },

  // 分页配置
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 100,
    defaultOrderBy: process.env.DEFAULT_ORDER_BY || 'id',
    defaultOrderDirection: process.env.DEFAULT_ORDER_DIRECTION || 'DESC'
  },

  // 缓存配置
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1小时
    prefix: process.env.CACHE_PREFIX || 'cache:',
    enabled: process.env.CACHE_ENABLED !== 'false'
  },

  // API配置
  api: {
    prefix: process.env.API_PREFIX || '/templateCms/web',
    version: process.env.API_VERSION || 'v1',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    rateLimit: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
      max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100
    }
  },

  // 监控配置
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 60000,
    healthCheck: {
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
    }
  },

  // 第三方服务配置
  services: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000
    },
    wechat: {
      appId: process.env.WECHAT_APP_ID || '',
      appSecret: process.env.WECHAT_APP_SECRET || '',
      token: process.env.WECHAT_TOKEN || ''
    }
  }
};

// 配置验证
function validateConfig() {
  const errors = [];

  // 验证必要配置
  if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
    if (config.app.env === 'production') {
      errors.push('JWT_SECRET必须在生产环境中设置');
    }
  }

  if (!config.database.password && config.app.env === 'production') {
    console.warn('警告: 生产环境建议设置数据库密码');
  }

  if (errors.length > 0) {
    throw new Error(`配置验证失败:\n${errors.join('\n')}`);
  }
}

// 获取配置的便捷方法
function get(key, defaultValue = null) {
  const keys = key.split('.');
  let value = config;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }

  return value;
}

// 判断是否为开发环境
function isDevelopment() {
  return config.app.env === 'development';
}

// 判断是否为生产环境
function isProduction() {
  return config.app.env === 'production';
}

// 判断是否为测试环境
function isTesting() {
  return config.app.env === 'test';
}

// 导出配置
module.exports = {
  ...config,
  get,
  validateConfig,
  isDevelopment,
  isProduction,
  isTesting
};