/**
 * 操作日志记录工具
 */

const { query } = require('../config/database');

// 操作类型枚举
const OPERATION_TYPES = {
    ADD: 'ADD',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ENABLE: 'ENABLE',
    DISABLE: 'DISABLE',
    TEMPLATE_GENERATE_WORKOUT: 'TEMPLATE_GENERATE_WORKOUT',
    TEMPLATE_GENERATE_WORKOUT_FILE: 'TEMPLATE_GENERATE_WORKOUT_FILE',
    SAVE: 'SAVE',
    WORKOUT_GENERATE_FILE: 'WORKOUT_GENERATE_FILE'
};

/**
 * 记录操作日志
 * @param {Object} logData - 日志数据
 * @param {string} logData.bizType - 业务类型 (如: 'music', 'playlist', 'user')
 * @param {number} logData.dataId - 数据ID
 * @param {string} logData.dataInfo - 数据信息描述
 * @param {string} logData.operationType - 操作类型 (使用 OPERATION_TYPES 枚举)
 * @param {Object|string} logData.dataBefore - 操作前数据 (可选)
 * @param {Object|string} logData.dataAfter - 操作后数据 (可选)
 * @param {string} logData.operationUser - 操作人
 * @param {Date} logData.operationTime - 操作时间 (可选，默认当前时间)
 */
async function recordOpLog(logData) {
    try {
        const {
            bizType,
            dataId,
            dataInfo,
            operationType,
            dataBefore,
            dataAfter,
            operationUser,
            operationTime = new Date()
        } = logData;

        // 验证必填字段
        if (!bizType || dataId === undefined || dataId === null || !operationType || !operationUser) {
            throw new Error('缺少必填字段: bizType, dataId, operationType, operationUser');
        }

        // 验证操作类型
        if (!Object.values(OPERATION_TYPES).includes(operationType)) {
            throw new Error(`无效的操作类型: ${operationType}`);
        }

        // 处理数据序列化
        const serializedDataBefore = dataBefore ?
            (typeof dataBefore === 'string' ? dataBefore : JSON.stringify(dataBefore)) : null;
        const serializedDataAfter = dataAfter ?
            (typeof dataAfter === 'string' ? dataAfter : JSON.stringify(dataAfter)) : null;

        // 插入日志记录
        const sql = `
            INSERT INTO op_logs (
                biz_type,
                data_id,
                data_info,
                operation_type,
                data_before,
                data_after,
                operation_user,
                operation_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            bizType,
            parseInt(dataId),
            dataInfo || '',
            operationType,
            serializedDataBefore,
            serializedDataAfter,
            operationUser,
            operationTime
        ];

        const result = await query(sql, params);

        console.log(`📝 操作日志记录成功: ${bizType}[${dataId}] ${operationType} by ${operationUser}`);

        return {
            success: true,
            logId: result.insertId,
            message: '操作日志记录成功'
        };

    } catch (error) {
        console.error('❌ 操作日志记录失败:', error);
        // 日志记录失败不应该影响主业务流程，所以这里只记录错误，不抛出异常
        return {
            success: false,
            error: error.message,
            message: '操作日志记录失败'
        };
    }
}

/**
 * 批量记录操作日志
 * @param {Array} logDataList - 日志数据数组
 * @param {boolean} useTransaction - 是否使用事务（默认false，因为日志记录失败不应影响主业务）
 */
async function recordOpLogBatch(logDataList, useTransaction = false) {
    if (!Array.isArray(logDataList) || logDataList.length === 0) {
        return [];
    }

    const results = [];

    if (useTransaction) {
        // 使用事务批量插入（谨慎使用）
        try {
            const { query } = require('../config/database');
            await query('START TRANSACTION');

            for (const logData of logDataList) {
                const result = await recordOpLog(logData);
                results.push(result);

                // 如果有失败的记录，回滚事务
                if (!result.success) {
                    await query('ROLLBACK');
                    return results;
                }
            }

            await query('COMMIT');
        } catch (error) {
            await query('ROLLBACK');
            console.error('批量日志记录事务失败:', error);
            results.push({
                success: false,
                error: error.message,
                message: '批量日志记录失败'
            });
        }
    } else {
        // 普通批量插入（推荐）
        for (const logData of logDataList) {
            const result = await recordOpLog(logData);
            results.push(result);
        }
    }

    return results;
}

// OpLogRecorder 已移除，请使用 SimpleOpLogRecorder 替代

/**
 * 从请求中获取操作用户ID
 * @param {Object} req - Express请求对象
 * @returns {string} 操作用户ID
 */
function getOperationUser(req) {
    // 优先从JWT token中获取用户ID
    if (req.user && req.user.id) {
        return req.user.id.toString();
    }

    // 从JWT token中获取userId
    if (req.user && req.user.userId) {
        return req.user.userId.toString();
    }

    // 从请求头中获取用户ID
    if (req.headers['x-user-id']) {
        return req.headers['x-user-id'];
    }

    // 从请求体中获取用户ID
    if (req.body && req.body.operationUserId) {
        return req.body.operationUserId.toString();
    }

    // 兼容旧的operationUser字段（如果是数字则认为是ID）
    if (req.body && req.body.operationUser) {
        const operationUser = req.body.operationUser;
        // 如果是纯数字，认为是用户ID
        if (/^\d+$/.test(operationUser)) {
            return operationUser;
        }
    }

    // 默认返回IP地址作为用户标识
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);

    return `IP:${ip || 'unknown'}`;
}

/**
 * 生成数据信息描述
 * @param {Object} data - 数据对象
 * @param {string} nameField - 名称字段 (默认: 'name')
 * @returns {string} 数据描述
 */
function generateDataInfo(data, nameField = 'name') {
    if (!data) return '';

    // 优先使用指定的名称字段
    if (data[nameField]) {
        return data[nameField];
    }

    // 尝试其他常见的名称字段
    const nameFields = ['name', 'title', 'displayName', 'display_name', 'username', 'email'];
    for (const field of nameFields) {
        if (data[field]) {
            return data[field];
        }
    }

    // 如果没有找到名称字段，返回ID
    if (data.id) {
        return `ID:${data.id}`;
    }

    return 'Unknown';
}

/**
 * 智能判断操作类型
 * @param {string} operationType - 原始操作类型
 * @param {number} dataId - 数据ID
 * @param {Object|string} dataAfter - 操作后数据
 * @param {Object|string} dataBefore - 操作前数据
 * @returns {string} 最终操作类型
 */
function smartDetermineOperationType(operationType, dataId, dataAfter = null, dataBefore = null) {
    // 如果不是 SAVE 操作，直接返回原操作类型
    if (operationType !== OPERATION_TYPES.SAVE) {
        return operationType;
    }

    // 智能判断 SAVE 操作的实际类型

    // 方法1: 根据 dataId 判断
    if (dataId && dataId > 0) {
        return OPERATION_TYPES.UPDATE;
    }

    // 方法2: 根据 dataAfter 中的 id 字段判断
    if (dataAfter) {
        let afterData = dataAfter;

        // 如果是字符串，尝试解析为JSON
        if (typeof dataAfter === 'string') {
            try {
                afterData = JSON.parse(dataAfter);
            } catch (e) {
                // 解析失败，保持原值
            }
        }

        // 检查 afterData 中的 id 字段
        if (afterData && typeof afterData === 'object') {
            if (afterData.id && afterData.id > 0) {
                return OPERATION_TYPES.UPDATE;
            }
            // 检查其他可能的ID字段
            if (afterData.insertId && afterData.insertId > 0) {
                return OPERATION_TYPES.ADD;
            }
        }
    }

    // 方法3: 根据是否有 dataBefore 判断
    if (dataBefore) {
        return OPERATION_TYPES.UPDATE;
    }

    // 默认情况：如果无法判断，返回 ADD（新增更常见）
    return OPERATION_TYPES.ADD;
}

/**
 * 统一的操作日志记录方法（推荐使用）
 * @param {Object} req - Express请求对象
 * @param {string} bizType - 业务类型 (如: 'music', 'playlist', 'sound')
 * @param {string} operationType - 操作类型 (使用 OPERATION_TYPES 枚举)
 * @param {number} dataId - 数据ID
 * @param {Object|string} dataInfo - 数据信息或数据对象（用于生成描述）
 * @param {Object|string} dataAfter - 操作后数据 (可选)
 * @param {Object|string} dataBefore - 操作前数据 (可选)
 */
async function recordOpLogSimple(req, bizType, operationType, dataId, dataInfo, dataAfter = null, dataBefore = null) {
    try {
        // 自动获取操作用户
        const operationUser = getOperationUser(req);

        // 自动生成数据描述
        const finalDataInfo = typeof dataInfo === 'string' ? dataInfo : generateDataInfo(dataInfo);

        // 记录日志
        return await recordOpLog({
            bizType,
            dataId,
            dataInfo: finalDataInfo,
            operationType,
            dataBefore,
            dataAfter,
            operationUser
        });
    } catch (error) {
        console.error('统一日志记录失败:', error);
        return {
            success: false,
            error: error.message,
            message: '操作日志记录失败'
        };
    }
}

/**
 * 异步操作日志记录方法（推荐在sendSuccess后使用）
 * @param {Object} req - Express请求对象
 * @param {string} bizType - 业务类型
 * @param {string} operationType - 操作类型
 * @param {number} dataId - 数据ID
 * @param {Object|string} dataInfo - 数据信息
 * @param {Object|string} dataAfter - 操作后数据
 * @param {Object|string} dataBefore - 操作前数据
 */
function recordOpLogAsync(req, bizType, operationType, dataId, dataInfo, dataAfter = null, dataBefore = null) {
    // 统一添加 biz_ 前缀
    const finalBizType = bizType.startsWith('biz_') ? bizType : `biz_${bizType}`;

    // 智能判断 SAVE 操作类型
    const finalOperationType = smartDetermineOperationType(operationType, dataId, dataAfter, dataBefore);

    setImmediate(async () => {
        try {
            await recordOpLogSimple(req, finalBizType, finalOperationType, dataId, dataInfo, dataAfter, dataBefore);
        } catch (error) {
            console.error(`记录${finalOperationType}日志失败:`, error);
        }
    });
}

/**
 * 便捷的操作日志记录器（统一版本）
 */
const SimpleOpLogRecorder = {
    // 新增记录
    recordAdd: async (req, bizType, dataId, dataInfo, dataAfter) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.ADD, dataId, dataInfo, dataAfter);
    },

    // 更新记录
    recordUpdate: async (req, bizType, dataId, dataInfo, dataAfter, dataBefore = null) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.UPDATE, dataId, dataInfo, dataAfter, dataBefore);
    },

    // 删除记录
    recordDelete: async (req, bizType, dataId, dataInfo, dataAfter = null, dataBefore = null) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.DELETE, dataId, dataInfo, dataAfter, dataBefore);
    },

    // 启用记录
    recordEnable: async (req, bizType, dataId, dataInfo, dataAfter) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.ENABLE, dataId, dataInfo, dataAfter);
    },

    // 禁用记录
    recordDisable: async (req, bizType, dataId, dataInfo, dataAfter) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.DISABLE, dataId, dataInfo, dataAfter);
    },

    // 保存记录（智能判断是新增还是更新）
    recordSave: async (req, bizType, dataId, dataInfo, dataAfter, dataBefore = null) => {
        // 智能判断操作类型
        const actualOperationType = smartDetermineOperationType(OPERATION_TYPES.SAVE, dataId, dataAfter, dataBefore);
        return await recordOpLogSimple(req, bizType, actualOperationType, dataId, dataInfo, dataAfter, dataBefore);
    },

    // 模板生成锻炼
    recordTemplateGenerateWorkout: async (req, bizType, dataId, dataInfo, dataAfter) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.TEMPLATE_GENERATE_WORKOUT, dataId, dataInfo, dataAfter);
    },

    // 模板生成锻炼文件
    recordTemplateGenerateWorkoutFile: async (req, bizType, dataId, dataInfo, dataAfter) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.TEMPLATE_GENERATE_WORKOUT_FILE, dataId, dataInfo, dataAfter);
    },

    // 锻炼生成文件
    recordWorkoutGenerateFile: async (req, bizType, dataId, dataInfo, dataAfter) => {
        return await recordOpLogSimple(req, bizType, OPERATION_TYPES.WORKOUT_GENERATE_FILE, dataId, dataInfo, dataAfter);
    }
};

// AsyncOpLogRecorder 已移除，请使用中间件统一记录日志

/**
 * 操作日志中间件 - 自动记录HTTP请求日志
 * @param {Object} options - 配置选项
 * @param {Array} options.excludePaths - 排除的路径（不记录日志）
 * @param {Array} options.includeMethods - 包含的HTTP方法
 */
function createOpLogMiddleware(options = {}) {
    const {
        excludePaths = [
            '/health',
            '/ping',
            '/favicon.ico',
            '/api/opLogs',           // 避免查询日志时产生新日志
            '/api/user/login',       // 登录接口
            '/api/user/logout',      // 登出接口
            '/api/user/checkToken',  // 令牌检查
            '/api/enum',             // 枚举查询
            '/api/data',             // 数据查询
            '/api/swagger',          // API文档
            '/page',                 // 分页查询接口
            '/detail',               // 详情查询接口
            '/list'                  // 列表查询接口
        ],
        includeMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
    } = options;

    return async (req, res, next) => {
        // 检查是否需要记录日志
        const shouldLog = includeMethods.includes(req.method) &&
            !excludePaths.some(path => req.path.includes(path)) &&
            !isQueryOperation(req.path, req.method);

        // 中间件正常工作，调试日志已移除

        if (!shouldLog) {
            return next();
        }

        // 拦截响应以获取响应数据
        const originalSend = res.send;
        res.send = function (data) {
            // 解析响应数据
            let responseData = null;
            try {
                responseData = typeof data === 'string' ? JSON.parse(data) : data;
            } catch (e) {
                responseData = data;
            }

            // 立即记录日志
            setImmediate(() => {
                recordHttpRequestLogImmediate(req, res, responseData);
            });

            // 调用原始的 send 方法
            return originalSend.call(this, data);
        };

        next();
    };
}

/**
 * 立即记录HTTP请求日志（同步）
 */
async function recordHttpRequestLogImmediate(req, res, responseData) {
    try {
        // 从路径推断业务类型和操作类型
        const pathInfo = parseRequestPath(req.path, req.method, req.originalUrl);

        if (!pathInfo) {
            return;
        }

        const { bizType, operationType, dataId } = pathInfo;
        const operationUser = getOperationUser(req);

        // 获取数据ID
        let actualDataId = dataId;
        if (!actualDataId && req.body && req.body.id) {
            actualDataId = req.body.id;
        }

        // 智能判断操作类型
        const finalOperationType = smartDetermineOperationType(operationType, actualDataId, req.body);

        // 对于删除操作，需要特殊处理以获取正确的数据信息
        let dataInfo = `${req.method} ${req.path}`;
        let dataBefore = null;

        if (finalOperationType === OPERATION_TYPES.DELETE) {
            // 删除操作：尝试从响应数据中获取被删除的数据信息
            if (responseData && responseData.data && responseData.data.deletedData) {
                const deletedData = responseData.data.deletedData;
                if (Array.isArray(deletedData) && deletedData.length > 0) {
                    // 批量删除：使用第一个删除项的信息作为代表
                    const firstDeleted = deletedData[0];
                    dataInfo = generateDataInfo(firstDeleted);
                    dataBefore = firstDeleted;
                    actualDataId = firstDeleted.id;
                } else if (deletedData && typeof deletedData === 'object') {
                    // 单个删除
                    dataInfo = generateDataInfo(deletedData);
                    dataBefore = deletedData;
                    actualDataId = deletedData.id;
                }
            }

            // 如果没有从响应中获取到删除数据，尝试从请求中获取
            if (!dataBefore && req.body) {
                if (req.body.name) {
                    dataInfo = req.body.name;
                } else if (req.body.idList && Array.isArray(req.body.idList)) {
                    dataInfo = `批量删除${req.body.idList.length}条记录`;
                }
            }
        } else {
            // 非删除操作：使用原有逻辑
            if (req.body && req.body.name) {
                dataInfo = req.body.name;
            }
        }

        // 准备日志数据
        const finalBizType = bizType.startsWith('biz_') ? bizType : `biz_${bizType}`;
        const logData = {
            bizType: finalBizType,
            dataId: actualDataId || 0,
            dataInfo,
            operationType: finalOperationType,
            dataAfter: finalOperationType === OPERATION_TYPES.DELETE ? null : (req.body || null),
            dataBefore: dataBefore,
            operationUser
        };

        // 记录日志
        const result = await recordOpLog(logData);

        if (result.success) {
            console.log(`📝 操作日志记录成功: ${finalBizType}[${actualDataId || 0}] ${finalOperationType} by ${operationUser} (ID: ${result.logId})`);
        } else {
            console.error(`❌ 操作日志记录失败: ${result.error}`);
        }

    } catch (error) {
        console.error('立即日志记录失败:', error);
        console.error('错误堆栈:', error.stack);
    }
}

/**
 * 记录HTTP请求日志
 */
async function recordHttpRequestLog(req, res, responseData) {
    try {
        // 只记录成功的操作（状态码2xx）
        if (res.statusCode < 200 || res.statusCode >= 300) {
            return;
        }

        // 从路径推断业务类型和操作类型
        const pathInfo = parseRequestPath(req.path, req.method);
        if (!pathInfo) {
            return;
        }

        const { bizType, operationType, dataId } = pathInfo;
        const operationUser = getOperationUser(req);

        // 获取实际的数据ID
        let actualDataId = dataId;
        if (!actualDataId && responseData && responseData.data) {
            actualDataId = responseData.data.id || responseData.data.insertId || 0;
        }
        if (!actualDataId && req.body && req.body.id) {
            actualDataId = req.body.id;
        }

        // 生成数据信息
        let dataInfo = `${req.method} ${req.path}`;
        if (req.body && req.body.name) {
            dataInfo = req.body.name;
        } else if (responseData && responseData.data && responseData.data.name) {
            dataInfo = responseData.data.name;
        } else if (responseData && typeof responseData === 'string') {
            try {
                const parsed = JSON.parse(responseData);
                if (parsed.data && parsed.data.name) {
                    dataInfo = parsed.data.name;
                }
            } catch (e) {
                // 忽略解析错误
            }
        }

        // 记录日志
        const finalBizType = bizType.startsWith('biz_') ? bizType : `biz_${bizType}`;
        await recordOpLog({
            bizType: finalBizType,
            dataId: actualDataId || 0,
            dataInfo,
            operationType,
            dataAfter: req.body || null,
            operationUser
        });

        console.log(`📝 操作日志记录成功: ${finalBizType}[${actualDataId || 0}] ${operationType} by ${operationUser}`);

    } catch (error) {
        console.error('HTTP请求日志记录失败:', error);
    }
}

// 路径解析缓存
const pathParseCache = new Map();
const CACHE_MAX_SIZE = 1000; // 最大缓存数量

/**
 * 将驼峰命名转换为下划线格式
 * 例如: workoutSettings -> workout_settings
 */
function camelToSnake(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * 清理路径解析缓存（当缓存过大时）
 */
function cleanPathParseCache() {
    if (pathParseCache.size > CACHE_MAX_SIZE) {
        // 清理一半的缓存
        const keysToDelete = Array.from(pathParseCache.keys()).slice(0, Math.floor(CACHE_MAX_SIZE / 2));
        keysToDelete.forEach(key => pathParseCache.delete(key));
    }
}

/**
 * 解析请求路径，推断业务类型和操作类型
 */
function parseRequestPath(path, method, originalUrl = '') {
    // 优先使用 originalUrl，如果没有则使用 path
    const fullPath = originalUrl || path;

    // 生成缓存键
    const cacheKey = `${fullPath}:${method}`;

    // 检查缓存
    if (pathParseCache.has(cacheKey)) {
        return pathParseCache.get(cacheKey);
    }

    // 1. 首先尝试从完整路径中解析业务类型和操作
    const dynamicResult = parseDynamicPath(fullPath, method);
    if (dynamicResult) {
        // 缓存结果
        pathParseCache.set(cacheKey, dynamicResult);
        cleanPathParseCache();
        return dynamicResult;
    }

    // 2. 如果动态解析失败，回退到特殊业务操作的模式匹配
    // 只保留具有特殊操作类型（非标准CRUD）的操作
    const specialPatterns = [
        // 特殊业务操作 - 只保留无法通过动态解析的特殊操作类型
        { pattern: /^\/templateCms\/web\/template\/generate-workout$/, bizType: 'template', operation: 'TEMPLATE_GENERATE_WORKOUT' },
        { pattern: /^\/templateCms\/web\/template\/generate-workout-file$/, bizType: 'template', operation: 'TEMPLATE_GENERATE_WORKOUT_FILE' },
        { pattern: /^\/templateCms\/web\/workout\/generate-file$/, bizType: 'workout', operation: 'WORKOUT_GENERATE_FILE' },
    ];

    for (const { pattern, bizType, operation, dataId } of specialPatterns) {
        const match = fullPath.match(pattern);
        if (match) {
            const result = {
                bizType,
                operationType: operation,
                dataId: dataId && dataId.includes('$') ? parseInt(match[parseInt(dataId.replace('$', ''))]) : null
            };

            // 缓存结果
            pathParseCache.set(cacheKey, result);
            cleanPathParseCache();
            return result;
        }
    }

    // 缓存 null 结果
    pathParseCache.set(cacheKey, null);
    cleanPathParseCache();
    return null;
}

/**
 * 动态解析路径，自动推断业务类型和操作类型
 */
function parseDynamicPath(fullPath, method) {
    // 解析 templateCms 路径格式: /templateCms/web/{bizType}/{action}
    const templateCmsMatch = fullPath.match(/^\/templateCms\/web\/([^\/]+)\/(.+)$/);
    if (templateCmsMatch) {
        const bizType = camelToSnake(templateCmsMatch[1]);
        const actionPath = templateCmsMatch[2];

        return parseActionPath(actionPath, method, bizType);
    }

    // 解析其他API路径格式: /api/{bizType}/{action}
    const apiMatch = fullPath.match(/^\/api\/([^\/]+)\/(.+)$/);
    if (apiMatch) {
        const bizType = camelToSnake(apiMatch[1]);
        const actionPath = apiMatch[2];

        return parseActionPath(actionPath, method, bizType);
    }

    // 解析简单路径格式: /{bizType}/{action}
    const simpleMatch = fullPath.match(/^\/([^\/]+)\/(.+)$/);
    if (simpleMatch) {
        const bizType = camelToSnake(simpleMatch[1]);
        const actionPath = simpleMatch[2];

        return parseActionPath(actionPath, method, bizType);
    }

    return null;
}

/**
 * 解析操作路径，推断操作类型和数据ID
 */
function parseActionPath(actionPath, method, bizType) {
    // 基础CRUD操作模式
    const actionPatterns = [
        // 保存操作
        { pattern: /^save$/, operation: 'SAVE' },
        { pattern: /^add$/, operation: 'ADD' },

        // ID相关操作
        { pattern: /^(\d+)$/, operation: method === 'PUT' ? 'UPDATE' : 'DELETE', dataId: 1 },
        { pattern: /^update\/(\d+)$/, operation: 'UPDATE', dataId: 1 },
        { pattern: /^delete\/(\d+)$/, operation: 'DELETE', dataId: 1 },

        // 批量操作
        { pattern: /^del$/, operation: 'DELETE' },
        { pattern: /^enable$/, operation: 'ENABLE' },
        { pattern: /^disable$/, operation: 'DISABLE' },
        { pattern: /^sort$/, operation: 'UPDATE' },

        // 设置相关操作 - 动态匹配以Settings结尾的路径
        { pattern: /^(.+Settings)\/save$/, operation: 'SAVE', bizTypeOverride: (match) => camelToSnake(match[1]) },

        // 用户相关操作 - 动态解析
        { pattern: /^register$/, operation: 'ADD' },
        { pattern: /^addUser$/, operation: 'ADD' },
        { pattern: /^updateUser$/, operation: 'UPDATE' },
        { pattern: /^resetPassword$/, operation: 'UPDATE' },

        // 文件操作 - 动态解析
        { pattern: /^upload$/, operation: 'ADD' },

        // 帮助相关操作 - 动态解析
        { pattern: /^addHelps$/, operation: 'ADD', bizTypeOverride: () => 'app_help' },

        // 发布操作 - 动态解析
        { pattern: /^publish\/(\w+)$/, operation: 'UPDATE', bizTypeOverride: () => 'publish' },
    ];

    for (const { pattern, operation, dataId, bizTypeOverride } of actionPatterns) {
        const match = actionPath.match(pattern);
        if (match) {
            // 如果有业务类型覆盖规则，使用覆盖的业务类型
            const finalBizType = bizTypeOverride ? bizTypeOverride(match) : bizType;

            return {
                bizType: finalBizType,
                operationType: operation,
                dataId: dataId ? parseInt(match[dataId]) : null
            };
        }
    }

    return null;
}

/**
 * 判断是否为查询操作（不需要记录日志）
 * 注意：这个函数只在GET请求时使用，PUT/DELETE等修改操作不应该被过滤
 */
function isQueryOperation(path, method = 'GET') {
    // 只对GET请求进行查询操作判断
    if (method !== 'GET') {
        return false;
    }

    // 查询操作的路径模式
    const queryPatterns = [
        /\/page$/,           // 分页查询
        /\/detail\/\d+$/,    // 详情查询
        /\/list$/,           // 列表查询
        /\/\d+$/,            // GET请求的ID查询
        /\/search$/,         // 搜索
        /\/export$/,         // 导出（通常是查询操作）
        /\/check/,           // 检查类接口
        /\/validate/,        // 验证类接口
    ];

    return queryPatterns.some(pattern => pattern.test(path));
}

/**
 * BusinessHelper增强器 - 为数据库操作自动添加日志记录
 */
class OpLogEnhancedBusinessHelper {
    /**
     * 增强的插入方法
     */
    static async insertWithOpLog(tableName, data, req, customValidations = [], interfaceConfig = null) {
        const { BusinessHelper } = require('../config/database');

        // 执行原始插入操作
        const result = await BusinessHelper.insertWithValidation(tableName, data, customValidations, interfaceConfig);

        if (result.success) {
            // 异步记录操作日志
            setImmediate(() => {
                recordOpLogAsync(
                    req,
                    tableName,
                    OPERATION_TYPES.ADD,
                    result.data.id || result.data.insertId,
                    data,
                    data
                );
            });
        }

        return result;
    }

    /**
     * 增强的更新方法
     */
    static async updateWithOpLog(tableName, id, data, req, customValidations = [], interfaceConfig = null) {
        const { BusinessHelper, query } = require('../config/database');

        // 获取更新前的数据
        let dataBefore = null;
        try {
            const beforeResult = await query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
            dataBefore = beforeResult[0] || null;
        } catch (error) {
            console.warn('获取更新前数据失败:', error);
        }

        // 执行原始更新操作
        const result = await BusinessHelper.updateWithValidation(tableName, id, data, customValidations, interfaceConfig);

        if (result.success) {
            // 异步记录操作日志
            setImmediate(() => {
                recordOpLogAsync(
                    req,
                    tableName,
                    OPERATION_TYPES.UPDATE,
                    id,
                    data,
                    data,
                    dataBefore
                );
            });
        }

        return result;
    }

    /**
     * 增强的删除方法（逻辑删除）
     */
    static async deleteWithOpLog(tableName, id, req) {
        const { query } = require('../config/database');

        // 获取删除前的数据
        let dataBefore = null;
        try {
            const beforeResult = await query(`SELECT * FROM ${tableName} WHERE id = ? AND is_deleted = 0`, [id]);
            dataBefore = beforeResult[0] || null;
        } catch (error) {
            console.warn('获取删除前数据失败:', error);
        }

        if (!dataBefore) {
            return {
                success: false,
                error: 'RECORD_NOT_FOUND',
                message: '记录不存在'
            };
        }

        // 执行逻辑删除
        try {
            const result = await query(
                `UPDATE ${tableName} SET is_deleted = 1, update_time = NOW() WHERE id = ? AND is_deleted = 0`,
                [id]
            );

            if (result.affectedRows > 0) {
                // 异步记录操作日志
                setImmediate(() => {
                    recordOpLogAsync(
                        req,
                        tableName,
                        OPERATION_TYPES.DELETE,
                        id,
                        dataBefore,
                        null,
                        dataBefore
                    );
                });

                return {
                    success: true,
                    message: '删除成功'
                };
            } else {
                return {
                    success: false,
                    error: 'DELETE_FAILED',
                    message: '删除失败'
                };
            }
        } catch (error) {
            console.error('删除操作失败:', error);
            return {
                success: false,
                error: 'DATABASE_ERROR',
                message: '删除操作失败'
            };
        }
    }
}

module.exports = {
    // 核心日志记录功能
    recordOpLog,
    recordOpLogBatch,
    recordOpLogSimple,
    recordOpLogAsync,

    // 便捷记录器（推荐使用）
    SimpleOpLogRecorder,

    // 工具函数
    getOperationUser,
    generateDataInfo,
    smartDetermineOperationType,
    OPERATION_TYPES,

    // 中间件和增强功能
    createOpLogMiddleware,
    OpLogEnhancedBusinessHelper,

    // 路径解析功能
    parseRequestPath,
    recordHttpRequestLog,
    recordHttpRequestLogImmediate,
    isQueryOperation,
    camelToSnake
};
