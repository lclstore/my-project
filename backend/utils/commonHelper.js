/**
 * 公共辅助方法
 * 提供各个路由模块共用的工具函数
 */

const { query } = require('../config/database');

/**
 * 获取表中存在的字段
 * @param {string} tableName - 表名
 * @param {Array} fieldList - 要检查的字段列表
 * @returns {Array} 存在的字段列表
 */
const getAvailableFields = async (tableName, fieldList) => {
    try {
        const sql = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
            AND table_name = ?
            AND column_name IN (${fieldList.map(() => '?').join(',')})
        `;
        const result = await query(sql, [tableName, ...fieldList]);
        const availableFields = result.map(row => row.column_name || row.COLUMN_NAME);

        // 确保至少包含 id 字段
        if (availableFields.length === 0 || !availableFields.includes('id')) {
            return ['id'];
        }

        return availableFields;
    } catch (error) {
        console.warn(`检查表${tableName}字段失败:`, error.message);
        return ['id']; // 至少返回id字段
    }
};

/**
 * 验证ID列表
 * @param {Array} idList - ID列表
 * @param {string} paramName - 参数名称
 * @returns {Object} 验证结果
 */
const validateIdList = (idList, paramName = 'idList') => {
    if (!idList || !Array.isArray(idList) || idList.length === 0) {
        return { valid: false, error: `${paramName}参数无效` };
    }

    const validIds = idList.filter(id => {
        const numId = parseInt(id);
        return !isNaN(numId) && numId > 0;
    });

    if (validIds.length === 0) {
        return { valid: false, error: `${paramName}中没有有效的ID` };
    }

    return { valid: true, validIds };
};

/**
 * 处理SQL参数，将undefined转换为null
 * @param {Array} params - 参数数组
 * @returns {Array} 处理后的参数数组
 */
const sanitizeParams = (params) => {
    return params.map(param => param === undefined ? null : param);
};

/**
 * 批量更新状态的通用方法
 * @param {string} tableName - 表名
 * @param {Array} idList - ID列表
 * @param {string} status - 状态值
 * @param {string} operation - 操作名称
 * @returns {Object} 更新结果
 */
const batchUpdateStatus = async (tableName, idList, status, operation) => {
    const validation = validateIdList(idList);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const placeholders = validation.validIds.map(() => '?').join(',');
    const updateSql = `
        UPDATE ${tableName} 
        SET status = ?, update_time = NOW() 
        WHERE id IN (${placeholders}) AND is_deleted = 0
    `;

    const updateResult = await query(updateSql, [status, ...validation.validIds]);
    return {
        updatedCount: updateResult.affectedRows,
        message: `${operation}${tableName}成功`
    };
};

/**
 * 批量逻辑删除的通用方法
 * @param {string} tableName - 表名
 * @param {Array} idList - ID列表
 * @returns {Object} 删除结果，包含被删除数据的详细信息
 */
const batchLogicalDelete = async (tableName, idList) => {
    const validation = validateIdList(idList);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const placeholders = validation.validIds.map(() => '?').join(',');

    // 先获取要删除的数据（用于日志记录）
    let deletedData = [];
    try {
        // 动态检测表中存在的字段
        const availableFields = await getAvailableFields(tableName, ['id', 'name', 'display_name', 'title', 'username', 'email']);

        if (availableFields.length > 0) {
            const selectSql = `
                SELECT ${availableFields.join(', ')}
                FROM ${tableName}
                WHERE id IN (${placeholders}) AND is_deleted = 0
            `;
            deletedData = await query(selectSql, validation.validIds);
        } else {
            // 如果没有找到任何字段，至少查询id
            const selectSql = `
                SELECT id
                FROM ${tableName}
                WHERE id IN (${placeholders}) AND is_deleted = 0
            `;
            deletedData = await query(selectSql, validation.validIds);
        }
    } catch (error) {
        // 如果查询失败，继续执行删除，但不记录详细信息
        console.warn(`获取${tableName}删除前数据失败:`, error.message);
    }

    // 执行逻辑删除
    const deleteSql = `
        UPDATE ${tableName}
        SET is_deleted = 1, update_time = NOW()
        WHERE id IN (${placeholders}) AND is_deleted = 0
    `;

    const deleteResult = await query(deleteSql, validation.validIds);

    return {
        deletedCount: deleteResult.affectedRows,
        message: `删除${tableName}成功`,
        deletedData: deletedData // 返回被删除的数据详情
    };
};

/**
 * 批量排序的通用方法
 * @param {string} tableName - 表名
 * @param {Array} idList - 按新顺序排列的ID列表
 * @param {string} sortField - 排序字段名，默认为'sort'
 * @returns {Object} 排序结果
 */
const batchUpdateSort = async (tableName, idList, sortField = 'sort') => {
    const validation = validateIdList(idList);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const { transaction } = require('../config/database');

    const result = await transaction(async (connection) => {
        let updatedCount = 0;

        // 为每个ID设置新的排序值
        for (let i = 0; i < validation.validIds.length; i++) {
            const id = validation.validIds[i];
            const sortOrder = i + 1; // 排序从1开始

            const updateSql = `
                UPDATE ${tableName}
                SET ${sortField} = ?, update_time = NOW()
                WHERE id = ? AND is_deleted = 0
            `;

            const [updateResult] = await connection.execute(updateSql, [sortOrder, id]);
            updatedCount += updateResult.affectedRows;
        }

        return { updatedCount };
    });

    return {
        updatedCount: result.updatedCount,
        message: `${tableName}排序成功`
    };
};

module.exports = {
    getAvailableFields,
    validateIdList,
    sanitizeParams,
    batchUpdateStatus,
    batchLogicalDelete,
    batchUpdateSort
};
