/**
 * 常量定义
 * 统一管理系统中使用的常量
 */

// HTTP状态码
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// 错误码定义
const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // 数据库错误
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN_KEY_CONSTRAINT',

  // 文件操作错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',

  // 业务逻辑错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  PASSWORD_INCORRECT: 'PASSWORD_INCORRECT',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // API错误
  API_NOT_FOUND: 'API_NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT'
};

// 用户状态
const USER_STATUS = {
  DISABLED: 'DISABLED',
  ENABLED: 'ENABLED',
};

// 用户类型
const USER_TYPES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
  MODERATOR: 'moderator'
};

// 数据状态
const DATA_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
  DRAFT: 2,
  PENDING: 3,
  REJECTED: 4,
  ARCHIVED: 5
};

// 操作类型
const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  EXPORT: 'export',
  IMPORT: 'import'
};

// 文件类型
const FILE_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  ARCHIVE: 'archive',
  OTHER: 'other'
};

// 允许的文件扩展名
const ALLOWED_FILE_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz']
};

// 缓存键前缀
const CACHE_KEYS = {
  USER: 'user:',
  CATEGORY: 'category:',
  EXERCISE: 'exercise:',
  SOUND: 'sound:',
  WORKOUT: 'workout:',
  PROGRAM: 'program:',
  TEMPLATE: 'template:',
  RESOURCE: 'resource:',
  SESSION: 'session:',
  TOKEN_BLACKLIST: 'token_blacklist:',
  RATE_LIMIT: 'rate_limit:',
  API_CACHE: 'api_cache:'
};

// 时间格式
const TIME_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  TIMESTAMP: 'X'
};

// 排序方向
const ORDER_DIRECTIONS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// 分页限制
const PAGINATION_LIMITS = {
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 10,
  MIN_PAGE_INDEX: 1
};

// 正则表达式
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  URL: /^https?:\/\/.+/,
  IPV4: /^(\d{1,3}\.){3}\d{1,3}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// 系统配置
const SYSTEM_CONFIG = {
  // 默认头像
  DEFAULT_AVATAR: '/images/default-avatar.png',

  // 上传限制
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB

  // 密码加密轮数
  BCRYPT_ROUNDS: 12,

  // JWT过期时间
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',

  // 限流配置
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15分钟
  RATE_LIMIT_MAX: 100,

  // 分页配置
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

// 响应消息
const RESPONSE_MESSAGES = {
  SUCCESS: '操作成功',
  CREATED: '创建成功',
  UPDATED: '更新成功',
  DELETED: '删除成功',

  // 错误消息
  INVALID_PARAMS: '参数无效',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源不存在',
  INTERNAL_ERROR: '服务器内部错误',

  // 用户相关
  USER_NOT_FOUND: '用户不存在',
  LOGIN_SUCCESS: '登录成功',
  LOGIN_FAILED: '登录失败',
  LOGOUT_SUCCESS: '退出成功',
  PASSWORD_INCORRECT: '密码错误',

  // 文件相关
  UPLOAD_SUCCESS: '上传成功',
  UPLOAD_FAILED: '上传失败',
  FILE_TOO_LARGE: '文件过大',
  FILE_TYPE_NOT_ALLOWED: '文件类型不支持'
};

// 事件类型
const EVENT_TYPES = {
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_REGISTER: 'user.register',
  USER_UPDATE: 'user.update',
  DATA_CREATE: 'data.create',
  DATA_UPDATE: 'data.update',
  DATA_DELETE: 'data.delete',
  FILE_UPLOAD: 'file.upload',
  FILE_DELETE: 'file.delete'
};

// 权限定义
const PERMISSIONS = {
  // 用户权限
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // 分类权限
  CATEGORY_VIEW: 'category:view',
  CATEGORY_CREATE: 'category:create',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',

  // 系统权限
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_MONITOR: 'system:monitor'
};

module.exports = {
  HTTP_STATUS,
  ERROR_CODES,
  USER_STATUS,
  USER_TYPES,
  DATA_STATUS,
  OPERATION_TYPES,
  FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  CACHE_KEYS,
  TIME_FORMATS,
  ORDER_DIRECTIONS,
  PAGINATION_LIMITS,
  REGEX_PATTERNS,
  SYSTEM_CONFIG,
  RESPONSE_MESSAGES,
  EVENT_TYPES,
  PERMISSIONS
};