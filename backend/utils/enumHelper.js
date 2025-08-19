/**
 * 枚举工具类
 * 用于从枚举定义库中获取可选值，并提供验证功能
 */

// 引入枚举数据
const enumsData = require('../routes/enum').enumsData || {};

/**
 * 从枚举定义中提取 enumName 值
 * @param {string} enumKey - 枚举键名
 * @returns {string[]} enumName 值数组
 */
function getEnumValues(enumKey) {
    const enumDef = enumsData[enumKey];
    if (!enumDef || !enumDef.datas) {
        console.warn(`枚举定义 ${enumKey} 不存在`);
        return [];
    }
    
    return enumDef.datas.map(item => item.enumName);
}

/**
 * 获取枚举的完整信息
 * @param {string} enumKey - 枚举键名
 * @returns {Object} 枚举定义对象
 */
function getEnumDefinition(enumKey) {
    return enumsData[enumKey] || null;
}

/**
 * 验证值是否在枚举范围内
 * @param {string} enumKey - 枚举键名
 * @param {string} value - 要验证的值
 * @returns {boolean} 是否有效
 */
function isValidEnumValue(enumKey, value) {
    const validValues = getEnumValues(enumKey);
    return validValues.includes(value);
}

/**
 * 验证数组中的所有值是否都在枚举范围内
 * @param {string} enumKey - 枚举键名
 * @param {string[]} values - 要验证的值数组
 * @returns {Object} 验证结果 { valid: boolean, invalidValues: string[] }
 */
function validateEnumArray(enumKey, values) {
    if (!Array.isArray(values)) {
        return { valid: false, invalidValues: [], message: '值必须是数组' };
    }
    
    const validValues = getEnumValues(enumKey);
    const invalidValues = values.filter(value => !validValues.includes(value));
    
    return {
        valid: invalidValues.length === 0,
        invalidValues,
        validValues,
        message: invalidValues.length > 0 
            ? `无效值: ${invalidValues.join(', ')}，允许的值: ${validValues.join(', ')}`
            : '验证通过'
    };
}

/**
 * Sound 模块相关的枚举键名常量
 */
const SOUND_ENUMS = {
    GENDER: 'BizSoundGenderEnums',
    USAGE: 'BizSoundUsageEnums', 
    STATUS: 'BizSoundStatusEnums'
};

/**
 * Sound 模块枚举工具
 */
const soundEnumHelper = {
    /**
     * 获取性别枚举值
     * @returns {string[]} ['FEMALE', 'MALE', 'FEMALE_AND_MALE']
     */
    getGenderValues: () => getEnumValues(SOUND_ENUMS.GENDER),
    
    /**
     * 获取用途枚举值
     * @returns {string[]} ['FLOW', 'GENERAL']
     */
    getUsageValues: () => getEnumValues(SOUND_ENUMS.USAGE),
    
    /**
     * 获取状态枚举值
     * @returns {string[]} ['DRAFT', 'ENABLED', 'DISABLED']
     */
    getStatusValues: () => getEnumValues(SOUND_ENUMS.STATUS),
    
    /**
     * 验证性别数组
     * @param {string[]} values - 性别值数组
     * @returns {Object} 验证结果
     */
    validateGenderArray: (values) => validateEnumArray(SOUND_ENUMS.GENDER, values),
    
    /**
     * 验证用途数组
     * @param {string[]} values - 用途值数组
     * @returns {Object} 验证结果
     */
    validateUsageArray: (values) => validateEnumArray(SOUND_ENUMS.USAGE, values),
    
    /**
     * 验证状态数组
     * @param {string[]} values - 状态值数组
     * @returns {Object} 验证结果
     */
    validateStatusArray: (values) => validateEnumArray(SOUND_ENUMS.STATUS, values)
};

/**
 * 通用的查询条件构建器
 */
class QueryConditionBuilder {
    constructor() {
        this.conditions = [];
        this.params = [];
    }
    
    /**
     * 添加数组条件（IN 查询）
     * @param {string} fieldName - 字段名（数据库字段名）
     * @param {string[]} values - 值数组
     * @param {string} enumKey - 枚举键名（用于验证）
     * @returns {QueryConditionBuilder} 链式调用
     */
    addArrayCondition(fieldName, values, enumKey = null) {
        if (!values || !Array.isArray(values) || values.length === 0) {
            return this;
        }
        
        // 如果提供了枚举键，进行验证
        if (enumKey) {
            const validation = validateEnumArray(enumKey, values);
            if (!validation.valid) {
                throw new Error(`${fieldName} 字段验证失败: ${validation.message}`);
            }
        }
        
        const placeholders = values.map(() => '?').join(',');
        this.conditions.push(`${fieldName} IN (${placeholders})`);
        this.params.push(...values);
        
        return this;
    }
    
    /**
     * 添加字符串条件（LIKE 查询）
     * @param {string} fieldName - 字段名
     * @param {string} value - 搜索值
     * @param {string} matchType - 匹配类型：'exact', 'like', 'start', 'end'
     * @returns {QueryConditionBuilder} 链式调用
     */
    addStringCondition(fieldName, value, matchType = 'like') {
        if (!value || typeof value !== 'string') {
            return this;
        }
        
        switch (matchType) {
            case 'exact':
                this.conditions.push(`${fieldName} = ?`);
                this.params.push(value);
                break;
            case 'like':
                this.conditions.push(`${fieldName} LIKE ?`);
                this.params.push(`%${value}%`);
                break;
            case 'start':
                this.conditions.push(`${fieldName} LIKE ?`);
                this.params.push(`${value}%`);
                break;
            case 'end':
                this.conditions.push(`${fieldName} LIKE ?`);
                this.params.push(`%${value}`);
                break;
            default:
                throw new Error(`不支持的匹配类型: ${matchType}`);
        }
        
        return this;
    }
    
    /**
     * 添加数字条件
     * @param {string} fieldName - 字段名
     * @param {number} value - 数字值
     * @param {string} operator - 操作符：'=', '>', '<', '>=', '<='
     * @returns {QueryConditionBuilder} 链式调用
     */
    addNumberCondition(fieldName, value, operator = '=') {
        if (value === null || value === undefined || isNaN(value)) {
            return this;
        }
        
        const validOperators = ['=', '>', '<', '>=', '<=', '!='];
        if (!validOperators.includes(operator)) {
            throw new Error(`不支持的操作符: ${operator}`);
        }
        
        this.conditions.push(`${fieldName} ${operator} ?`);
        this.params.push(value);
        
        return this;
    }
    
    /**
     * 构建最终的查询条件
     * @param {string} connector - 连接符，默认 'AND'
     * @returns {Object} { where: string, params: any[] }
     */
    build(connector = 'AND') {
        if (this.conditions.length === 0) {
            return { where: '', params: [] };
        }
        
        return {
            where: this.conditions.join(` ${connector} `),
            params: this.params
        };
    }
    
    /**
     * 重置构建器
     * @returns {QueryConditionBuilder} 链式调用
     */
    reset() {
        this.conditions = [];
        this.params = [];
        return this;
    }
}

module.exports = {
    // 基础函数
    getEnumValues,
    getEnumDefinition,
    isValidEnumValue,
    validateEnumArray,
    
    // 常量
    SOUND_ENUMS,
    
    // Sound 模块专用工具
    soundEnumHelper,
    
    // 查询条件构建器
    QueryConditionBuilder
};
