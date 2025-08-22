/**
 * 统一响应格式处理类
 * 提供标准化的API响应格式
 */

class Response {
  /**
   * 成功响应格式
   * @param {*} data - 响应数据
   * @param {string} message - 响应消息
   * @param {number} code - 状态码
   */
  static success(data = null, message = '操作成功', code = 200) {
    const response = {
      success: true,
      errCode: null,
      errMessage: null,
      message: message
    };

    // 处理不同类型的数据
    if (data !== null && data !== undefined) {
      if (typeof data === 'object' && data.hasOwnProperty('data') && data.hasOwnProperty('totalCount')) {
        // 分页数据格式
        Object.assign(response, data);
      } else if (Array.isArray(data)) {
        // 数组数据
        response.data = data;
        response.totalCount = data.length;
        response.empty = data.length === 0;
        response.notEmpty = data.length > 0;
      } else {
        // 普通数据
        response.data = data;
      }
    }

    return { response, statusCode: code };
  }

  /**
   * 错误响应格式
   * @param {string} errCode - 错误码
   * @param {string} errMessage - 错误消息
   * @param {number} statusCode - HTTP状态码
   */
  static error(errCode = 'UNKNOWN_ERROR', errMessage = '未知错误', statusCode = 500) {
    return {
      response: {
        success: false,
        errCode,
        errMessage,
        message: errMessage,
        data: null
      },
      statusCode
    };
  }

  /**
   * 分页响应格式
   * @param {Array} data - 数据列表
   * @param {number} totalCount - 总数量
   * @param {number} pageIndex - 当前页码
   * @param {number} pageSize - 每页大小
   * @param {string} message - 响应消息
   */
  static paginate(data, totalCount, pageIndex, pageSize, message = '获取成功') {
    const totalPages = Math.ceil(totalCount / pageSize);

    return this.success({
      data,
      totalCount: parseInt(totalCount),
      pageIndex: parseInt(pageIndex),
      pageSize: parseInt(pageSize),
      totalPages,
      empty: data.length === 0,
      notEmpty: data.length > 0,
      errCode: null,
      errMessage: null
    }, message);
  }

  /**
   * Express中间件
   * 为res对象添加success和error方法
   */
  static middleware() {
    return (req, res, next) => {
      // 设置默认响应头
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      /**
       * 成功响应方法
       */
      res.success = function (data, message, code = 200) {
        const { response, statusCode } = Response.success(data, message, code);
        return this.status(statusCode).json(response);
      };

      /**
       * 错误响应方法
       */
      res.error = function (errCode, errMessage, statusCode = 500) {
        const { response, statusCode: code } = Response.error(errCode, errMessage, statusCode);
        return this.status(code).json(response);
      };

      /**
       * 分页响应方法
       */
      res.paginate = function (data, totalCount, pageIndex, pageSize, message) {
        const { response, statusCode } = Response.paginate(data, totalCount, pageIndex, pageSize, message);
        return this.status(statusCode).json(response);
      };

      /**
       * 重写原始json方法，确保格式正确
       */
      const originalJson = res.json;
      // 将 snake_case 转 camelCase（含深层）
      const toCamel = (str) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const keysToCamelDeep = (obj) => {
        if (Array.isArray(obj)) return obj.map(keysToCamelDeep);
        if (obj && typeof obj === 'object') {
          const out = {};
          for (const [k, v] of Object.entries(obj)) {
            const nk = toCamel(k);
            out[nk] = keysToCamelDeep(v);
          }
          return out;
        }
        return obj;
      };

      res.json = function (data) {
        // 确保Content-Type正确
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }

        // 如果数据已经是标准格式，直接返回，但将 data 字段键名转换为 camelCase
        if (data && typeof data === 'object' && data.hasOwnProperty('success')) {
          try {
            if (data.data !== undefined) {
              const converted = { ...data, data: keysToCamelDeep(data.data) };
              // 分页结构也做兼容处理
              if (Array.isArray(data.data) && data.totalCount !== undefined) {
                converted.totalCount = data.totalCount;
              }
              return originalJson.call(this, converted);
            }
          } catch (_) { }
          return originalJson.call(this, data);
        }

        // 否则包装成标准格式，并转换键名
        try {
          if (typeof data === 'string') {
            try {
              const parsed = JSON.parse(data);
              return originalJson.call(this, keysToCamelDeep(parsed));
            } catch (e) {
              return originalJson.call(this, { message: data, success: true });
            }
          }
          return originalJson.call(this, keysToCamelDeep(data));
        } catch (error) {
          console.error('JSON序列化错误:', error);
          return originalJson.call(this, {
            success: false,
            errCode: 'JSON_SERIALIZE_ERROR',
            errMessage: '数据序列化失败'
          });
        }
      };

      next();
    };
  }
}

module.exports = Response;