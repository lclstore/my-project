/**
 * 字段映射工具
 * 用于前端字段名(camelCase)和数据库字段名(snake_case)之间的转换
 */

/**
 * 通用的 camelCase 转 snake_case
 * @param {string} camelStr - camelCase 字符串
 * @returns {string} snake_case 字符串
 */
function camelToSnake(camelStr) {
    return camelStr.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 通用的 snake_case 转 camelCase
 * @param {string} snakeStr - snake_case 字符串
 * @returns {string} camelCase 字符串
 */
function snakeToCamel(snakeStr) {
    return snakeStr.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * sound 模块的字段映射配置
 */
const SOUND_FIELD_MAPPING = {
    // 前端字段名(camelCase) -> 数据库字段名(snake_case)
    'id': 'id',
    'name': 'name',
    'genderCode': 'gender_code',
    'usageCode': 'usage_code',
    'status': 'status',
    'createTime': 'create_time',
    'updateTime': 'update_time',
    'translation': 'translation',
    'femaleAudioUrl': 'female_audio_url',
    'femaleAudioDuration': 'female_audio_duration',
    'maleAudioUrl': 'male_audio_url',
    'maleAudioDuration': 'male_audio_duration',
    'femaleScript': 'female_script',
    'maleScript': 'male_script'
};

/**
 * 将前端字段名转换为数据库字段名
 * @param {string} frontendField - 前端字段名
 * @param {Object} mapping - 字段映射表，默认使用通用转换
 * @returns {string} 数据库字段名
 */
function frontendToDatabase(frontendField, mapping = null) {
    if (mapping && mapping[frontendField]) {
        return mapping[frontendField];
    }
    
    // 如果没有映射表，使用通用转换
    return camelToSnake(frontendField);
}

/**
 * 将数据库字段名转换为前端字段名
 * @param {string} databaseField - 数据库字段名
 * @param {Object} mapping - 字段映射表，默认使用通用转换
 * @returns {string} 前端字段名
 */
function databaseToFrontend(databaseField, mapping = null) {
    if (mapping) {
        // 反向查找映射
        const entry = Object.entries(mapping).find(([frontend, database]) => database === databaseField);
        if (entry) {
            return entry[0];
        }
    }
    
    // 如果没有映射表，使用通用转换
    return snakeToCamel(databaseField);
}

/**
 * sound 模块专用的字段转换函数
 */
const soundFieldMapping = {
    /**
     * 将前端字段名转换为数据库字段名（用于排序等）
     * @param {string} frontendField - 前端字段名
     * @returns {string} 数据库字段名
     */
    toDatabase: (frontendField) => frontendToDatabase(frontendField, SOUND_FIELD_MAPPING),
    
    /**
     * 将数据库字段名转换为前端字段名
     * @param {string} databaseField - 数据库字段名
     * @returns {string} 前端字段名
     */
    toFrontend: (databaseField) => databaseToFrontend(databaseField, SOUND_FIELD_MAPPING),
    
    /**
     * 获取所有支持的前端字段名
     * @returns {string[]} 前端字段名数组
     */
    getSupportedFields: () => Object.keys(SOUND_FIELD_MAPPING),
    
    /**
     * 检查字段名是否支持
     * @param {string} frontendField - 前端字段名
     * @returns {boolean} 是否支持
     */
    isSupported: (frontendField) => SOUND_FIELD_MAPPING.hasOwnProperty(frontendField)
};

/**
 * 创建字段映射工具
 * @param {Object} mapping - 字段映射表
 * @returns {Object} 字段映射工具对象
 */
function createFieldMapping(mapping) {
    return {
        toDatabase: (frontendField) => frontendToDatabase(frontendField, mapping),
        toFrontend: (databaseField) => databaseToFrontend(databaseField, mapping),
        getSupportedFields: () => Object.keys(mapping),
        isSupported: (frontendField) => mapping.hasOwnProperty(frontendField)
    };
}

module.exports = {
    // 通用转换函数
    camelToSnake,
    snakeToCamel,
    frontendToDatabase,
    databaseToFrontend,
    
    // sound 模块专用
    SOUND_FIELD_MAPPING,
    soundFieldMapping,
    
    // 工具函数
    createFieldMapping
};
