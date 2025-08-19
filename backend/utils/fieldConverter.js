/**
 * 字段命名转换工具
 * 处理数据库字段（snake_case）与前端字段（camelCase）的转换
 */

/**
 * 将 snake_case 转换为 camelCase
 * @param {string} str - 要转换的字符串
 * @returns {string} 转换后的字符串
 */
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

/**
 * 将 camelCase 转换为 snake_case
 * @param {string} str - 要转换的字符串
 * @returns {string} 转换后的字符串
 */
const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * 格式化时间为普通年月日时分秒格式
 * @param {Date|string} date - 时间对象或字符串
 * @returns {string} 格式化后的时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
const formatDateTime = (date) => {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // 如果不是有效日期，返回原值

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化时间为年月日格式
 * @param {Date|string} date - 时间对象或字符串
 * @returns {string} 格式化后的时间字符串 (YYYY-MM-DD)
 */
const formatDateOnly = (date) => {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // 如果不是有效日期，返回原值

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * 格式化时间为时分秒格式
 * @param {Date|string} date - 时间对象或字符串
 * @returns {string} 格式化后的时间字符串 (HH:mm:ss)
 */
const formatTimeOnly = (date) => {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // 如果不是有效日期，返回原值

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化时间为时间戳
 * @param {Date|string} date - 时间对象或字符串
 * @returns {number} 时间戳
 */
const formatTimestamp = (date) => {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // 如果不是有效日期，返回原值

  return d.getTime();
};

/**
 * 根据格式类型格式化时间
 * @param {Date|string} date - 时间对象或字符串
 * @param {string} format - 格式类型
 * @returns {string|number} 格式化后的时间
 */
const formatTimeByType = (date, format) => {
  switch (format) {
    case 'date':
      return formatDateOnly(date);
    case 'time':
      return formatTimeOnly(date);
    case 'timestamp':
      return formatTimestamp(date);
    case 'datetime':
    default:
      return formatDateTime(date);
  }
};

/**
 * 检查字段是否为时间字段
 * @param {string} key - 字段名
 * @returns {boolean} 是否为时间字段
 */
const isTimeField = (key) => {
  // 明确的时间字段列表（这些是真正的datetime类型字段）
  const explicitTimeFields = ['create_time', 'update_time', 'created_at', 'updated_at'];

  // 检查是否是明确的时间字段（支持 snake_case 和 camelCase）
  const isExplicitTimeField = explicitTimeFields.some(field => {
    const camelCaseField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    return key === field || key === camelCaseField;
  });

  if (isExplicitTimeField) {
    return true;
  }

  // 排除音频相关的时间字段（这些通常是数字，表示秒数或时长）
  const audioTimePatterns = [
    'audio_start_time',
    'audio_end_time',
    'audio_duration',
    'video_duration',
    'AudioStartTime',
    'AudioEndTime',
    'AudioDuration',
    'VideoDuration'
  ];

  // 如果包含音频相关的时间模式，不认为是时间字段
  if (audioTimePatterns.some(pattern => key.includes(pattern))) {
    return false;
  }

  // 其他以 _time 或 _at 结尾的字段，但要排除明显的数字字段
  return (key.endsWith('_time') || key.endsWith('_at')) &&
    !key.includes('start_time') &&
    !key.includes('end_time') &&
    !key.includes('duration');
};

/**
 * 处理值的转换（包括时间格式化）
 * @param {string} key - 字段名
 * @param {*} value - 字段值
 * @returns {*} 处理后的值
 */
const processValue = (key, value) => {
  // 如果是时间字段且值存在，进行格式化
  if (isTimeField(key) && value) {
    return formatDateTime(value);
  }

  // 如果是对象或数组，递归处理
  if (typeof value === 'object' && value !== null) {
    return convertKeysToCamelCase(value);
  }

  return value;
};

/**
 * 将对象的键从 snake_case 转换为 camelCase，并格式化时间字段
 * @param {Object|Array} data - 要转换的数据
 * @returns {Object|Array} 转换后的数据
 */
const convertKeysToCamelCase = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertKeysToCamelCase(item));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      const camelKey = toCamelCase(key);
      converted[camelKey] = processValue(key, value);
    }
    return converted;
  }

  return data;
};

/**
 * 将对象的键从 camelCase 转换为 snake_case
 * @param {Object|Array} data - 要转换的数据
 * @returns {Object|Array} 转换后的数据
 */
const convertKeysToSnakeCase = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertKeysToSnakeCase(item));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = toSnakeCase(key);
      converted[snakeKey] = convertKeysToSnakeCase(value);
    }
    return converted;
  }

  return data;
};

/**
 * 数据库查询结果转换器
 * 将查询结果的字段名从 snake_case 转换为 camelCase
 * @param {Object|Array} result - 数据库查询结果
 * @returns {Object|Array} 转换后的结果
 */
const convertDbResult = (result) => {
  return convertKeysToCamelCase(result);
};

/**
 * 请求数据转换器
 * 将前端传来的 camelCase 字段转换为数据库的 snake_case
 * @param {Object} data - 请求数据
 * @returns {Object} 转换后的数据
 */
const convertRequestData = (data) => {
  return convertKeysToSnakeCase(data);
};

/**
 * 常用字段映射表（用于特殊情况）
 */
const FIELD_MAPPING = {
  // 数据库字段 -> 前端字段
  'create_time': 'createTime',
  'update_time': 'updateTime',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'user_id': 'userId',
  'file_name': 'fileName',
  'file_size': 'fileSize',
  'file_path': 'filePath',
  'mime_type': 'mimeType'
};

/**
 * 使用映射表进行字段转换
 * @param {Object} data - 要转换的数据
 * @param {Object} mapping - 字段映射表
 * @returns {Object} 转换后的数据
 */
const convertWithMapping = (data, mapping = FIELD_MAPPING) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertWithMapping(item, mapping));
  }

  const converted = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = mapping[key] || toCamelCase(key);
    // 处理时间字段格式化
    const processedValue = isTimeField(key) && value ? formatDateTime(value) : value;
    converted[newKey] = typeof processedValue === 'object' ? convertWithMapping(processedValue, mapping) : processedValue;
  }

  return converted;
};

/**
 * 字段处理器配置
 */
const FieldProcessors = {
  // 时间字段处理器
  time: {
    check: (key) => isTimeField(key),
    process: (value, options) => formatTimeByType(value, options.timeFormat || 'datetime')
  },

  // 金额字段处理器（示例）
  money: {
    check: (key) => key.includes('amount') || key.includes('price') || key.includes('money'),
    process: (value, options) => {
      if (typeof value === 'number') {
        return options.moneyFormat === 'yuan' ? `¥${value.toFixed(2)}` : value;
      }
      return value;
    }
  },

  // 状态字段处理器（示例）
  status: {
    check: (key) => key.includes('status') || key.includes('state'),
    process: (value, options) => {
      if (options.statusMap && options.statusMap[value]) {
        return options.statusMap[value];
      }
      return value;
    }
  },

  // JSON 字段处理器
  json: {
    check: (key) => key.includes('_ids') || key.includes('_data') || key.includes('_config') || key.includes('_json'),
    process: (value, options) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          // 如果解析失败，返回原值
          return value;
        }
      }
      return value;
    }
  }
};

/**
 * 通用的前端格式转换函数（高性能版本）
 * @param {Object|Array} data - 要转换的数据
 * @param {Object} options - 转换选项
 * @param {string} options.timeFormat - 时间格式 ('datetime' | 'date' | 'time' | 'timestamp')
 * @param {string} options.moneyFormat - 金额格式 ('yuan' | 'number')
 * @param {Object} options.statusMap - 状态映射表
 * @param {Array} options.processors - 自定义处理器列表
 * @returns {Object|Array} 转换后的数据
 */
const convertToFrontendFormatWithOptions = (data, options = {}) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertToFrontendFormatWithOptions(item, options));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted = {};

    // 获取所有处理器（内置 + 自定义）
    const allProcessors = { ...FieldProcessors, ...(options.customProcessors || {}) };

    // 获取要排除的字段列表
    const excludeFields = options.excludeFields || [];

    for (const [key, value] of Object.entries(data)) {
      // 检查是否需要排除此字段
      if (excludeFields.includes(key)) {
        continue;
      }

      const camelKey = toCamelCase(key);

      if (value === null || value === undefined) {
        converted[camelKey] = value;
        continue;
      }

      // 先检查所有处理器，找到匹配的进行处理
      let processed = false;
      for (const processor of Object.values(allProcessors)) {
        if (processor.check(key)) {
          converted[camelKey] = processor.process(value, options);
          processed = true;
          break; // 找到第一个匹配的处理器就停止
        }
      }

      // 如果已经被处理器处理，跳过后续处理
      if (processed) {
        continue;
      }

      // 递归处理嵌套对象
      if (typeof value === 'object' && value !== null) {
        converted[camelKey] = convertToFrontendFormatWithOptions(value, options);
        continue;
      }

      // 如果没有匹配的处理器，直接使用原值
      converted[camelKey] = value;
    }

    return converted;
  }

  return data;
};

/**
 * 兼容旧版本的时间格式转换函数
 * @param {Object|Array} data - 要转换的数据
 * @param {string} timeFormat - 时间格式
 * @returns {Object|Array} 转换后的数据
 */
const convertToFrontendFormatWithTimeFormat = (data, timeFormat = 'datetime') => {
  return convertToFrontendFormatWithOptions(data, { timeFormat });
};

/**
 * 转换为前端格式（包含字段名转换和时间格式化）- 默认完整时间格式
 * @param {Object|Array} data - 要转换的数据
 * @returns {Object|Array} 转换后的数据
 */
const convertToFrontendFormat = (data) => {
  return convertToFrontendFormatWithTimeFormat(data, 'datetime');
};

/**
 * 转换 Exercise 数据为前端格式（自动排除 is_deleted 字段）
 * @param {Object|Array} data - 要转换的数据
 * @returns {Object|Array} 转换后的数据
 */
const convertExerciseToFrontendFormat = (data) => {
  return convertToFrontendFormatWithOptions(data, {
    timeFormat: 'datetime',
    excludeFields: ['is_deleted']
  });
};

module.exports = {
  toCamelCase,
  toSnakeCase,
  convertKeysToCamelCase,
  convertKeysToSnakeCase,
  convertDbResult,
  convertRequestData,
  convertWithMapping,
  convertToFrontendFormat,
  convertToFrontendFormatWithTimeFormat,
  convertToFrontendFormatWithOptions,
  convertExerciseToFrontendFormat,
  formatDateTime,
  formatDateOnly,
  formatTimeOnly,
  formatTimestamp,
  formatTimeByType,
  isTimeField,
  FieldProcessors,
  FIELD_MAPPING
};
