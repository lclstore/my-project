/**
 * 参数处理工具函数
 */

/**
 * 解析数组参数（支持数组和逗号分隔字符串）
 * @param {*} param - 参数值
 * @returns {Array|null} 解析后的数组或null
 */
const parseArrayParam = (param) => {
    if (!param) return null;
    
    // 如果已经是数组，直接返回
    if (Array.isArray(param)) return param;
    
    // 如果是字符串，按逗号分隔
    if (typeof param === 'string') {
        const parsed = param.split(',').map(item => item.trim()).filter(item => item);
        return parsed.length > 0 ? parsed : null;
    }
    
    // 其他类型转为数组
    return [param];
};

/**
 * 解析整数参数
 * @param {*} param - 参数值
 * @param {number} defaultValue - 默认值
 * @returns {number} 解析后的整数
 */
const parseIntParam = (param, defaultValue = 0) => {
    if (param === null || param === undefined || param === '') {
        return defaultValue;
    }
    
    const parsed = parseInt(param, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * 解析浮点数参数
 * @param {*} param - 参数值
 * @param {number} defaultValue - 默认值
 * @returns {number} 解析后的浮点数
 */
const parseFloatParam = (param, defaultValue = 0.0) => {
    if (param === null || param === undefined || param === '') {
        return defaultValue;
    }
    
    const parsed = parseFloat(param);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * 解析布尔参数
 * @param {*} param - 参数值
 * @param {boolean} defaultValue - 默认值
 * @returns {boolean} 解析后的布尔值
 */
const parseBooleanParam = (param, defaultValue = false) => {
    if (param === null || param === undefined || param === '') {
        return defaultValue;
    }
    
    // 字符串类型的布尔值处理
    if (typeof param === 'string') {
        const lowerParam = param.toLowerCase();
        if (lowerParam === 'true' || lowerParam === '1' || lowerParam === 'yes') {
            return true;
        }
        if (lowerParam === 'false' || lowerParam === '0' || lowerParam === 'no') {
            return false;
        }
    }
    
    // 数字类型的布尔值处理
    if (typeof param === 'number') {
        return param !== 0;
    }
    
    // 其他类型直接转换
    return Boolean(param);
};

/**
 * 解析字符串参数
 * @param {*} param - 参数值
 * @param {string} defaultValue - 默认值
 * @returns {string|null} 解析后的字符串
 */
const parseStringParam = (param, defaultValue = null) => {
    if (param === null || param === undefined) {
        return defaultValue;
    }
    
    const str = String(param).trim();
    return str === '' ? defaultValue : str;
};

/**
 * 解析分页参数
 * @param {Object} query - 查询参数对象
 * @returns {Object} 分页参数对象
 */
const parsePaginationParams = (query) => {
    const pageIndex = parseIntParam(query.pageIndex, 1);
    const pageSize = parseIntParam(query.pageSize, 10);
    
    // 限制分页参数的合理范围
    const validPageIndex = Math.max(1, pageIndex);
    const validPageSize = Math.min(Math.max(1, pageSize), 100); // 最大100条
    
    return {
        pageIndex: validPageIndex,
        pageSize: validPageSize,
        offset: (validPageIndex - 1) * validPageSize
    };
};

/**
 * 解析排序参数
 * @param {*} orderBy - 排序字段
 * @param {*} orderDirection - 排序方向
 * @param {string} defaultOrderBy - 默认排序字段
 * @param {string} defaultDirection - 默认排序方向
 * @returns {Object} 排序参数对象
 */
const parseSortParams = (orderBy, orderDirection, defaultOrderBy = 'id', defaultDirection = 'DESC') => {
    const validOrderBy = parseStringParam(orderBy, defaultOrderBy);
    const validDirection = parseStringParam(orderDirection, defaultDirection);
    
    // 验证排序方向
    const direction = ['ASC', 'DESC'].includes(validDirection.toUpperCase()) 
        ? validDirection.toUpperCase() 
        : defaultDirection;
    
    return {
        orderBy: validOrderBy,
        orderDirection: direction
    };
};

/**
 * 解析日期范围参数
 * @param {*} startDate - 开始日期
 * @param {*} endDate - 结束日期
 * @returns {Object} 日期范围对象
 */
const parseDateRangeParams = (startDate, endDate) => {
    const parseDate = (dateParam) => {
        if (!dateParam) return null;
        
        const date = new Date(dateParam);
        return isNaN(date.getTime()) ? null : date;
    };
    
    return {
        startDate: parseDate(startDate),
        endDate: parseDate(endDate)
    };
};

/**
 * 批量解析查询参数
 * @param {Object} query - 查询参数对象
 * @param {Object} config - 参数配置
 * @returns {Object} 解析后的参数对象
 */
const parseQueryParams = (query, config) => {
    const result = {};
    
    for (const [key, paramConfig] of Object.entries(config)) {
        const value = query[key];
        const { type, defaultValue, required = false } = paramConfig;
        
        let parsedValue;
        
        switch (type) {
            case 'array':
                parsedValue = parseArrayParam(value);
                break;
            case 'int':
                parsedValue = parseIntParam(value, defaultValue);
                break;
            case 'float':
                parsedValue = parseFloatParam(value, defaultValue);
                break;
            case 'boolean':
                parsedValue = parseBooleanParam(value, defaultValue);
                break;
            case 'string':
                parsedValue = parseStringParam(value, defaultValue);
                break;
            default:
                parsedValue = value;
        }
        
        // 检查必填参数
        if (required && (parsedValue === null || parsedValue === undefined)) {
            throw new Error(`参数 ${key} 为必填项`);
        }
        
        result[key] = parsedValue;
    }
    
    return result;
};

/**
 * 清理空值参数
 * @param {Object} params - 参数对象
 * @returns {Object} 清理后的参数对象
 */
const cleanEmptyParams = (params) => {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '') {
            // 对于数组，只保留非空数组
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    cleaned[key] = value;
                }
            } else {
                cleaned[key] = value;
            }
        }
    }
    
    return cleaned;
};

module.exports = {
    parseArrayParam,
    parseIntParam,
    parseFloatParam,
    parseBooleanParam,
    parseStringParam,
    parsePaginationParams,
    parseSortParams,
    parseDateRangeParams,
    parseQueryParams,
    cleanEmptyParams
};
