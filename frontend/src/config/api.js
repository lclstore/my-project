import request from "@/request"

/**
 * API 函数模块
 * 包含文件上传、数据操作、枚举等相关API
 */

// ==================== 文件操作 ====================

/**
 * S3文件上传
 * @param {Object} options - 上传选项
 * @param {File} options.file - 要上传的文件
 * @param {String} options.dirKey - 文件目录
 * @returns {Object} 上传结果
 * @returns {String} [returnData.error] - 错误信息
 * @returns {String} [returnData.fileRelativeUrl] - 文件相对路径
 * @returns {String} [returnData.fileUrl] - 文件绝对路径
 * @returns {String} [returnData.localUrl] - 文件本地预览路径
 */
export const uploadFile = async function ({ file, dirKey }) {
    // 文件类型映射表
    const MIME_TYPES = {
        "ts": "video/mp2t",
        "m3u8": "application/x-mpegURL"
    }
    const fileMINEType = file.type || MIME_TYPES[file.name.split('.').pop()];
    const fileType = fileMINEType.split('/')[0];  // 文件类型
    let returnData = {
        localUrl: URL.createObjectURL(file)
    }
    // 准备上传参数
    const formData = new FormData();
    formData.append('dirKey', `${dirKey}-${fileType}`);
    formData.append('fileName', file.name);
    formData.append('contentType', fileMINEType);
    formData.append('file', file);  // 关键，file 是文件对象

    let fileUrl = await new Promise(resolve => {
        request.post({
            url: "/files/upload",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'  // 这一步视 request 库是否自动设置
            },
            callback: res => {
                res.error ? resolve('error') : resolve(res.data.data);
            }
        });
    });
    return fileUrl;
}

// ==================== 表格数据操作 ====================

/**
 * 获取公共表格列表数据
 * @param {String} moduleKey - 模块键名
 * @param {String} operationName - 操作名称
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 表格数据
 */
export const getPublicTableList = async (moduleKey, operationName, params) => {
    return new Promise(resolve => {
        request.get({
            url: `/${moduleKey}/${operationName}`,
            load: false,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}

/**
 * 排序公共表格列表
 * @param {String} moduleKey - 模块键名
 * @param {Object} params - 排序参数
 * @returns {Promise<Object>} 排序结果
 */
export const sortPublicTableList = async (moduleKey, params) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/sort`,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}

// ==================== 表单数据操作 ====================

/**
 * 根据ID获取表单数据
 * @param {String} url - 请求URL
 * @returns {Promise<Object>} 表单数据
 */
export const getformDataById = (url) => {
    return new Promise((resolve, reject) => {
        request.get({
            url: url,
            callback(res) {
                resolve(res?.data);
            }
        });
    });
};

/**
 * 保存公共表单数据
 * @param {Object} params - 表单数据
 * @param {String} url - 请求URL
 * @returns {Promise<Object>} 保存结果
 */
export const savePublicFormData = (params, url) => {
    return new Promise((resolve, reject) => {
        request.post({
            url: url,
            load: false,
            data: params,
            callback(res) {
                resolve(res?.data);
            }
        });
    });
};

// ==================== 通用操作 ====================

/**
 * 公共生成操作
 * @param {Object} params - 生成参数
 * @param {String} url - 请求URL
 * @returns {Promise<Object>} 生成结果
 */
export const publicGenerate = (params, url) => {
    return new Promise(resolve => {
        request.post({
            url: url,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}

/**
 * 公共启用/禁用数据
 * @param {Object} params - 更新参数
 * @param {String} url - 请求URL
 * @returns {Promise<Object>} 更新结果
 */
export const publicUpdateStatus = (params, url) => {
    return new Promise(resolve => {
        request.post({
            url: url,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}

/**
 * 公共删除数据
 * @param {Object} params - 删除参数
 * @param {String} url - 请求URL
 * @returns {Promise<Object>} 删除结果
 */
export const publicDeleteData = (params, url) => {
    return new Promise(resolve => {
        request.post({
            url: url,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}

/**
 * 启用数据
 * @param {Object} options - 选项
 * @param {String} options.moduleKey - 模块键名
 * @param {Array<String|Number>} options.idList - ID列表
 * @returns {Promise<Object>} 操作结果
 */
export const enable = async ({ moduleKey, idList }) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/enable`,
            data: { idList },
            callback: res => resolve(res)
        });
    })
}

/**
 * 禁用数据
 * @param {Object} options - 选项
 * @param {String} options.moduleKey - 模块键名
 * @param {Array<String|Number>} options.idList - ID列表
 * @returns {Promise<Object>} 操作结果
 */
export const disable = async ({ moduleKey, idList }) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/disable`,
            data: { idList },
            callback: res => resolve(res)
        });
    })
}

/**
 * 删除数据
 * @param {Object} options - 选项
 * @param {String} options.moduleKey - 模块键名
 * @param {Array<String|Number>} options.idList - ID列表
 * @returns {Promise<Object>} 操作结果
 */
export const del = async ({ moduleKey, idList }) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/del`,
            data: { idList },
            callback: res => resolve(res)
        });
    })
}

// ==================== 枚举数据 ====================

/**
 * 获取枚举列表
 * @returns {Promise<Object>} 枚举数据对象
 */
export const getEnumList = async () => {
    return new Promise(resolve => {
        request.get({
            url: `/enum/list`,
            data: {},
            callback: (res) => {
                const enumList = {}
                res?.data?.data?.forEach(i => {
                    enumList[i.displayName] = i.datas.map(data => ({
                        value: data.enumName,
                        label: data.displayName,
                        ...data
                    }))
                })
                resolve(enumList)
            }
        });
    })
}