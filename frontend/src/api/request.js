import axios from 'axios';
import { message } from 'antd';
import { HTTP_STATUS, storageKeys } from '@/constants';

// 环境变量配置
const config = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_APP_REQUEST_TIMEOUT),
  showErrorMessage: true,
};

// 路由配置
const router = {
  loginPath: '/login'
};

// 创建axios实例
const request = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage中获取token
    const token = localStorage.getItem(storageKeys.TOKEN);

    // 如果有token, 则添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 如果返回的是文件流，直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }

    // 兼容处理: 有些后端直接返回数据，有些包装在data中
    const res = response.data.data !== undefined ? response.data.data : response.data;

    // 请求成功
    return res;
  },
  (error) => {
    // 处理响应错误
    if (error.response) {
      const { status, data } = error.response;

      // 错误消息
      const errorMsg = data.message || '服务器错误';

      // 根据状态码处理特定错误
      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // 401: 未授权，清除用户信息并重定向到登录页
          localStorage.removeItem(storageKeys.TOKEN);
          localStorage.removeItem(storageKeys.USER_INFO);
          window.location.href = router.loginPath;
          message.error('登录已过期，请重新登录');
          break;

        case HTTP_STATUS.FORBIDDEN:
          // 403: 禁止访问
          message.error('没有权限访问');
          break;

        case HTTP_STATUS.NOT_FOUND:
          // 404: 资源不存在
          message.error('请求的资源不存在');
          break;

        case HTTP_STATUS.SERVER_ERROR:
          // 500: 服务器错误
          message.error('服务器错误，请稍后再试');
          break;

        default:
          // 其他错误
          if (config.showErrorMessage) {
            message.error(errorMsg);
          }
      }
    } else if (error.request) {
      // 请求发送成功，但没有收到响应
      message.error('服务器无响应，请检查网络');
    } else {
      // 请求配置错误
      message.error('请求错误: ' + error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * GET请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} config - 额外配置
 * @returns {Promise}
 */
export const get = (url, params = {}, config = {}) => {
  return request.get(url, { params, ...config });
};

/**
 * POST请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} config - 额外配置
 * @returns {Promise}
 */
export const post = (url, data = {}, config = {}) => {
  return request.post(url, data, config);
};

/**
 * PUT请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} config - 额外配置
 * @returns {Promise}
 */
export const put = (url, data = {}, config = {}) => {
  return request.put(url, data, config);
};

/**
 * DELETE请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} config - 额外配置
 * @returns {Promise}
 */
export const del = (url, params = {}, config = {}) => {
  return request.delete(url, { params, ...config });
};

/**
 * 上传文件
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @param {Object} config - 额外配置
 * @returns {Promise}
 */
export const upload = (url, formData, config = {}) => {
  return request.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...config,
  });
};

/**
 * 下载文件
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {string} [filename] - 可选的文件名
 * @returns {Promise<void>}
 */
export const download = async (url, params = {}, filename) => {
  try {
    const response = await request.get(url, {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename || getFilenameFromResponse(response);
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    // 可以添加错误处理逻辑，例如显示消息
    console.error('Download failed:', error);
    message.error('File download failed.'); // 使用 antd message 显示错误
    // 重新抛出错误或者根据需要处理
    throw error;
  }
};

// 从响应头中获取文件名
const getFilenameFromResponse = (response) => {
  const contentDisPremium = response.headers['content-disPremium'];
  if (contentDisPremium) {
    const filenameMatch = contentDisPremium.match(/filename=(.+)/);
    if (filenameMatch && filenameMatch.length > 1) {
      return filenameMatch[1];
    }
  }
  return 'download-' + Date.now();
};

export default {
  get,
  post,
  put,
  delete: del,
  upload,
  download,
  request,
}; 