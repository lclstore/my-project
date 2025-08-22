/**
 * 服务层基类
 * 提供通用的业务逻辑和数据操作
 */

const Database = require('./Database');
const Logger = require('./Logger');

class BaseService {
  constructor(options = {}) {
    this.database = new Database();
    this.logger = new Logger();
    this.tableName = options.tableName;
    this.entityName = options.entityName || '数据';
    this.primaryKey = options.primaryKey || 'id';
    this.fieldMapping = options.fieldMapping || {};
    this.defaultOrderBy = options.defaultOrderBy || 'id DESC';
    this.searchableFields = options.searchableFields || [];

    // 验证必要配置
    if (!this.tableName) {
      throw new Error('BaseService必须提供tableName');
    }
  }

  /**
   * 获取数据库实例
   */
  async getDatabase() {
    if (!this.database.pool) {
      await this.database.initialize();
    }
    return this.database;
  }

  /**
   * 执行SQL查询
   */
  async query(sql, params = []) {
    const db = await this.getDatabase();
    return await db.query(sql, params);
  }

  /**
   * 执行SQL查询并返回第一条记录
   */
  async queryOne(sql, params = []) {
    const db = await this.getDatabase();
    return await db.queryOne(sql, params);
  }

  /**
   * 字段名转换（前端 -> 数据库）
   */
  convertToDbFields(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      const dbField = this.fieldMapping[key] || this.camelToSnakeCase(key);
      converted[dbField] = value;
    }

    return converted;
  }

  /**
   * 驼峰命名转下划线命名
   */
  camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 下划线命名转驼峰命名
   */
  snakeToCamelCase(str) {
    return str.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());
  }


  /**
   * 处理分页参数，确保类型正确
   */
  processPaginationParams(params, allowedFilters = []) {
    const {
      pageIndex = 1,
      pageSize = 10,
      orderBy = this.defaultOrderBy?.split(' ')[0] || 'id',
      orderDirection = this.defaultOrderBy?.split(' ')[1] || 'DESC',
      ...otherParams
    } = params;

    // 确保分页参数是整数类型
    const pageIndexInt = parseInt(pageIndex);
    const pageSizeInt = parseInt(pageSize);

    // 验证分页参数
    if (isNaN(pageIndexInt) || pageIndexInt < 1) {
      throw new Error('pageIndex必须是大于0的整数');
    }

    if (isNaN(pageSizeInt) || pageSizeInt < 1 || pageSizeInt > 100000) {
      throw new Error('pageSize必须是1-100000之间的整数');
    }

    // 只保留允许的筛选参数
    const filteredParams = {};
    for (const key of allowedFilters) {
      if (otherParams[key] !== undefined && otherParams[key] !== '' && otherParams[key] !== null) {
        filteredParams[key] = otherParams[key];
      }
    }

    return {
      pageIndex: pageIndexInt,
      pageSize: pageSizeInt,
      orderBy,
      orderDirection: orderDirection.toUpperCase(),
      offset: (pageIndexInt - 1) * pageSizeInt,
      ...filteredParams
    };
  }

  /**
   * 字段名转换（数据库 -> 前端）
   */
  convertToFrontendFields(data) {
    if (!data) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.convertToFrontendFields(item));
    }

    if (typeof data !== 'object') {
      return data;
    }

    const converted = {};
    const reverseMapping = this.getReverseFieldMapping();

    // 定义需要隐藏的字段
    const hiddenFields = ['is_deleted'];

    for (const [key, value] of Object.entries(data)) {
      // 跳过隐藏字段
      if (hiddenFields.includes(key)) {
        continue;
      }

      const frontendField = reverseMapping[key] || this.snakeToCamelCase(key);
      converted[frontendField] = value;
    }

    return converted;
  }

  /**
   * 获取反向字段映射
   */
  getReverseFieldMapping() {
    const reverse = {};
    for (const [frontend, backend] of Object.entries(this.fieldMapping)) {
      reverse[backend] = frontend;
    }
    return reverse;
  }

  /**
   * 通用分页查询方法
   * @param {string} tableName - 表名
   * @param {object} params - 查询参数
   * @param {string} customWhere - 自定义WHERE条件
   * @param {string} customJoins - 自定义JOIN语句
   * @param {string} customSelect - 自定义SELECT字段
   * @param {array} allowedFilters - 允许的筛选参数白名单
   */
  async getPagedResults(tableName, params, customWhere = '', customJoins = '', customSelect = '*', allowedFilters = []) {
    try {
      const paginationParams = this.processPaginationParams(params);
      const { pageIndex, pageSize, orderBy, orderDirection, offset, ...filters } = paginationParams;

      // 构建查询条件
      const conditions = [];
      const queryParams = [];

      // 添加软删除条件（如果表有is_deleted字段）
      if (this.softDeletes) {
        conditions.push('is_deleted = 0');
      }

      // 添加自定义WHERE条件
      if (customWhere) {
        conditions.push(customWhere);
      }

      // 只处理白名单中允许的筛选参数
      const validFilters = {};
      for (const key of allowedFilters) {
        if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== null) {
          validFilters[key] = filters[key];
        }
      }

      // 处理筛选条件
      for (const [key, value] of Object.entries(validFilters)) {
        // 处理关键词搜索
        if (key === 'keywords' && this.searchableFields && this.searchableFields.length > 0) {
          const keyword = value.trim();
          if (keyword) {
            // 检查是否为纯数字（ID精确匹配）
            if (/^\d+$/.test(keyword)) {
              conditions.push(`${this.primaryKey} = ?`);
              queryParams.push(parseInt(keyword));
            } else {
              // 多字段模糊搜索
              const searchConditions = this.searchableFields.map(field => `${field} LIKE ?`);
              conditions.push(`(${searchConditions.join(' OR ')})`);
              this.searchableFields.forEach(() => queryParams.push(`%${keyword}%`));
            }
          }
        } else {
          // 普通字段筛选
          const dbField = this.fieldMapping[key] || key;
          conditions.push(`${dbField} = ?`);
          queryParams.push(value);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${orderBy} ${orderDirection}`;

      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total
        FROM ${tableName}
        ${customJoins}
        ${whereClause}
      `;

      const countResult = await this.queryOne(countSql, queryParams);
      const totalCount = countResult.total;

      // 查询数据
      const dataSql = `
        SELECT ${customSelect}
        FROM ${tableName}
        ${customJoins}
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `;

      const dataResult = await this.query(dataSql, [...queryParams, pageSize, offset]);

      return {
        success: true,
        data: this.convertToFrontendFields(dataResult),
        totalCount,
        pageIndex,
        pageSize
      };

    } catch (error) {
      this.logger.error(`分页查询${this.entityName}失败:`, error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: `获取${this.entityName}列表失败`
      };
    }
  }

  /**
   * 数据验证
   */
  validate(data, rules = {}) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // 必填验证
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push(`${field}不能为空`);
        continue;
      }

      // 如果字段为空且非必填，跳过其他验证
      if (!value && !rule.required) {
        continue;
      }

      // 类型验证
      if (rule.type) {
        switch (rule.type) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors.push(`${field}格式不正确`);
            }
            break;
          case 'number':
            if (isNaN(value)) {
              errors.push(`${field}必须是数字`);
            }
            break;
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${field}必须是字符串`);
            }
            break;
        }
      }

      // 长度验证
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field}长度不能少于${rule.minLength}个字符`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field}长度不能超过${rule.maxLength}个字符`);
      }

      // 数值范围验证
      if (rule.min !== undefined && Number(value) < rule.min) {
        errors.push(`${field}不能小于${rule.min}`);
      }

      if (rule.max !== undefined && Number(value) > rule.max) {
        errors.push(`${field}不能大于${rule.max}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 分页查询
   */
  async getList(query = {}) {
    try {
      const {
        pageIndex = 1,
        pageSize = 10,
        orderBy,
        orderDirection = 'DESC',
        ...filters
      } = query;

      // 构建查询条件
      const { where, params } = this.buildWhereConditions(filters);

      // 构建排序
      const orderByClause = orderBy
        ? `${orderBy} ${orderDirection.toUpperCase()}`
        : this.defaultOrderBy;

      const db = await this.getDatabase();
      const result = await db.paginate(this.tableName, {
        where,
        whereParams: params,
        orderBy: orderByClause,
        pageIndex: parseInt(pageIndex),
        pageSize: parseInt(pageSize)
      });

      // 转换字段名
      result.data = this.convertToFrontendFields(result.data);

      return result;
    } catch (error) {
      this.logger.error(`获取${this.entityName}列表失败:`, { error: error.message });
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: `获取${this.entityName}列表失败`
      };
    }
  }

  /**
   * 根据ID获取数据
   */
  async getById(id) {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? AND (is_deleted = 0 OR is_deleted IS NULL)`;
      const result = await this.queryOne(sql, [id]);

      if (!result) {
        return {
          success: false,
          errCode: 'NOT_FOUND',
          errMessage: `${this.entityName}不存在`
        };
      }

      return {
        success: true,
        data: this.convertToFrontendFields(result)
      };
    } catch (error) {
      this.logger.error(`获取${this.entityName}详情失败:`, { error: error.message, id });
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: `获取${this.entityName}详情失败`
      };
    }
  }

  /**
   * 创建数据
   */
  async create(data, validationRules = {}) {
    try {
      // 参数验证
      if (Object.keys(validationRules).length > 0) {
        const validation = this.validate(data, validationRules);
        if (!validation.valid) {
          return {
            success: false,
            errCode: 'VALIDATION_ERROR',
            errMessage: validation.errors.join(', ')
          };
        }
      }

      // 转换字段名
      const dbData = this.convertToDbFields(data);

      const db = await this.getDatabase();
      const result = await db.insert(this.tableName, dbData);

      return {
        success: true,
        insertId: result.insertId,
        message: `创建${this.entityName}成功`
      };
    } catch (error) {
      this.logger.error(`创建${this.entityName}失败:`, { error: error.message, data });

      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          errCode: 'DUPLICATE_ENTRY',
          errMessage: `${this.entityName}已存在`
        };
      }

      return {
        success: false,
        errCode: 'CREATE_ERROR',
        errMessage: `创建${this.entityName}失败`
      };
    }
  }

  /**
   * 更新数据
   */
  async update(id, data, validationRules = {}) {
    try {
      // 参数验证
      if (Object.keys(validationRules).length > 0) {
        const validation = this.validate(data, validationRules);
        if (!validation.valid) {
          return {
            success: false,
            errCode: 'VALIDATION_ERROR',
            errMessage: validation.errors.join(', ')
          };
        }
      }

      // 检查数据是否存在
      const exists = await this.getById(id);
      if (!exists.success) {
        return exists;
      }

      // 转换字段名
      const dbData = this.convertToDbFields(data);

      const db = await this.getDatabase();
      const result = await db.update(
        this.tableName,
        dbData,
        `${this.primaryKey} = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          errCode: 'NO_CHANGES',
          errMessage: '没有数据被更新'
        };
      }

      return {
        success: true,
        message: `更新${this.entityName}成功`
      };
    } catch (error) {
      this.logger.error(`更新${this.entityName}失败:`, { error: error.message, id, data });
      return {
        success: false,
        errCode: 'UPDATE_ERROR',
        errMessage: `更新${this.entityName}失败`
      };
    }
  }

  /**
   * 删除数据
   */
  async delete(id) {
    try {
      // 检查数据是否存在
      const exists = await this.getById(id);
      if (!exists.success) {
        return exists;
      }

      const db = await this.getDatabase();
      const result = await db.delete(this.tableName, `${this.primaryKey} = ?`, [id]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          errCode: 'DELETE_FAILED',
          errMessage: `删除${this.entityName}失败`
        };
      }

      return {
        success: true,
        message: `删除${this.entityName}成功`
      };
    } catch (error) {
      this.logger.error(`删除${this.entityName}失败:`, { error: error.message, id });
      return {
        success: false,
        errCode: 'DELETE_ERROR',
        errMessage: `删除${this.entityName}失败`
      };
    }
  }

  /**
   * 批量删除
   */
  async batchDelete(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          errCode: 'INVALID_PARAMS',
          errMessage: 'IDs参数无效'
        };
      }

      const db = await this.getDatabase();
      let deletedCount = 0;

      for (const id of ids) {
        const result = await db.delete(this.tableName, `${this.primaryKey} = ?`, [id]);
        if (result.affectedRows > 0) {
          deletedCount++;
        }
      }

      return {
        success: true,
        deletedCount,
        message: `成功删除${deletedCount}条${this.entityName}`
      };
    } catch (error) {
      this.logger.error(`批量删除${this.entityName}失败:`, { error: error.message, ids });
      return {
        success: false,
        errCode: 'BATCH_DELETE_ERROR',
        errMessage: `批量删除${this.entityName}失败`
      };
    }
  }

  /**
   * 获取所有数据（不分页）
   */
  async getAll(query = {}) {
    try {
      const { orderBy, orderDirection = 'DESC', ...filters } = query;
      const { where, params } = this.buildWhereConditions(filters);

      const orderByClause = orderBy
        ? `${orderBy} ${orderDirection.toUpperCase()}`
        : this.defaultOrderBy;

      const sql = `SELECT * FROM ${this.tableName} WHERE ${where} ORDER BY ${orderByClause}`;
      const data = await this.query(sql, params);

      return {
        success: true,
        data: this.convertToFrontendFields(data)
      };
    } catch (error) {
      this.logger.error(`获取所有${this.entityName}失败:`, { error: error.message });
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: `获取所有${this.entityName}失败`
      };
    }
  }

  /**
   * 搜索数据
   */
  async search(query = {}) {
    try {
      const { keywords, ...otherQuery } = query;

      if (!keywords || this.searchableFields.length === 0) {
        return this.getList(query);
      }

      // 构建搜索条件
      const searchConditions = this.searchableFields.map(field => `${field} LIKE ?`);
      const searchParams = this.searchableFields.map(() => `%${keywords}%`);

      // 构建其他过滤条件
      const { where: otherWhere, params: otherParams } = this.buildWhereConditions(otherQuery);

      // 组合条件
      let where = `(${searchConditions.join(' OR ')})`;
      let params = [...searchParams];

      if (otherWhere !== '1=1') {
        where += ` AND ${otherWhere}`;
        params = [...params, ...otherParams];
      }

      const {
        pageIndex = 1,
        pageSize = 10,
        orderBy,
        orderDirection = 'DESC'
      } = query;

      const orderByClause = orderBy
        ? `${orderBy} ${orderDirection.toUpperCase()}`
        : this.defaultOrderBy;

      const db = await this.getDatabase();
      const result = await db.paginate(this.tableName, {
        where,
        whereParams: params,
        orderBy: orderByClause,
        pageIndex: parseInt(pageIndex),
        pageSize: parseInt(pageSize)
      });

      result.data = this.convertToFrontendFields(result.data);
      return result;
    } catch (error) {
      this.logger.error(`搜索${this.entityName}失败:`, { error: error.message });
      return {
        success: false,
        errCode: 'SEARCH_ERROR',
        errMessage: `搜索${this.entityName}失败`
      };
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(query = {}) {
    try {
      const { where, params } = this.buildWhereConditions(query);

      const sql = `
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 1 THEN 1 END) as active,
          COUNT(CASE WHEN status = 0 THEN 1 END) as inactive
        FROM ${this.tableName}
        WHERE ${where}
      `;

      const result = await this.queryOne(sql, params);

      return {
        success: true,
        data: {
          total: parseInt(result.total),
          active: parseInt(result.active),
          inactive: parseInt(result.inactive)
        }
      };
    } catch (error) {
      this.logger.error(`获取${this.entityName}统计失败:`, { error: error.message });
      return {
        success: false,
        errCode: 'STATS_ERROR',
        errMessage: `获取${this.entityName}统计失败`
      };
    }
  }

  /**
   * 构建WHERE条件
   */
  buildWhereConditions(filters = {}) {
    const conditions = ['(is_deleted = 0 OR is_deleted IS NULL)'];
    const params = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '' && key !== 'pageIndex' && key !== 'pageSize' && key !== 'orderBy' && key !== 'orderDirection') {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }

    return {
      where: conditions.join(' AND '),
      params
    };
  }

  /**
   * 事务处理
   */
  async transaction(callback) {
    const db = await this.getDatabase();
    return await db.transaction(callback);
  }
}

module.exports = BaseService;