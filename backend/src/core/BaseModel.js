/**
 * 数据模型基类
 * 提供基础的数据映射和验证功能
 */

const Database = require('./Database');

class BaseModel {
  constructor(options = {}) {
    this.tableName = options.tableName;
    this.primaryKey = options.primaryKey || 'id';
    this.fillable = options.fillable || [];
    this.hidden = options.hidden || [];
    this.casts = options.casts || {};
    this.timestamps = options.timestamps !== false;
    this.softDeletes = options.softDeletes !== false;
    this.database = new Database();

    // 如果启用软删除，自动隐藏 is_deleted 字段
    if (this.softDeletes && !this.hidden.includes('is_deleted')) {
      this.hidden.push('is_deleted');
    }

    if (!this.tableName) {
      throw new Error('Model must define tableName');
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
   * 查找单条记录
   */
  async find(id) {
    const db = await this.getDatabase();
    let sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const params = [id];

    if (this.softDeletes) {
      sql += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
    }

    const result = await db.queryOne(sql, params);
    return result ? this.transform(result) : null;
  }

  /**
   * 查找多条记录
   */
  async findAll(where = '1=1', params = [], orderBy = null) {
    const db = await this.getDatabase();
    let sql = `SELECT * FROM ${this.tableName} WHERE ${where}`;

    if (this.softDeletes) {
      sql += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    const results = await db.query(sql, params);
    return results.map(result => this.transform(result));
  }

  /**
   * 创建记录
   */
  async create(data) {
    const db = await this.getDatabase();
    const cleanData = this.fillableData(data);

    if (this.timestamps) {
      cleanData.create_time = new Date();
      cleanData.update_time = new Date();
    }

    const result = await db.insert(this.tableName, cleanData);
    return result;
  }

  /**
   * 更新记录
   */
  async update(id, data) {
    const db = await this.getDatabase();
    const cleanData = this.fillableData(data);

    if (this.timestamps) {
      cleanData.update_time = new Date();
    }

    const result = await db.update(
      this.tableName,
      cleanData,
      `${this.primaryKey} = ?`,
      [id]
    );
    return result;
  }

  /**
   * 删除记录
   */
  async delete(id) {
    const db = await this.getDatabase();

    if (this.softDeletes) {
      // 软删除
      const result = await db.update(
        this.tableName,
        {
          is_deleted: 1,
          update_time: new Date()
        },
        `${this.primaryKey} = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
        [id]
      );
      return result;
    } else {
      // 硬删除
      const result = await db.query(
        `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
        [id]
      );
      return result;
    }
  }

  /**
   * 分页查询
   */
  async paginate(options = {}) {
    const db = await this.getDatabase();
    const {
      where = '1=1',
      whereParams = [],
      orderBy = `${this.primaryKey} DESC`,
      pageIndex = 1,
      pageSize = 10
    } = options;

    let finalWhere = where;
    if (this.softDeletes) {
      finalWhere += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
    }

    const result = await db.paginate(this.tableName, {
      where: finalWhere,
      whereParams,
      orderBy,
      pageIndex,
      pageSize
    });

    if (result.success) {
      result.data = result.data.map(item => this.transform(item));
    }

    return result;
  }

  /**
   * 统计记录数
   */
  async count(where = '1=1', params = []) {
    const db = await this.getDatabase();
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${where}`;

    if (this.softDeletes) {
      sql += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
    }

    const result = await db.queryOne(sql, params);
    return result ? result.count : 0;
  }

  /**
   * 检查记录是否存在
   */
  async exists(where, params = []) {
    const count = await this.count(where, params);
    return count > 0;
  }

  /**
   * 获取可填充的数据
   */
  fillableData(data) {
    if (this.fillable.length === 0) {
      return data;
    }

    const fillableData = {};
    for (const field of this.fillable) {
      if (data.hasOwnProperty(field)) {
        fillableData[field] = data[field];
      }
    }
    return fillableData;
  }

  /**
   * 转换数据
   */
  transform(data) {
    if (!data) {
      return data;
    }

    // 隐藏字段
    if (this.hidden.length > 0) {
      for (const field of this.hidden) {
        delete data[field];
      }
    }

    // 类型转换
    for (const [field, type] of Object.entries(this.casts)) {
      if (data.hasOwnProperty(field)) {
        data[field] = this.castAttribute(data[field], type);
      }
    }

    return data;
  }

  /**
   * 属性类型转换
   */
  castAttribute(value, type) {
    if (value === null || value === undefined) {
      return value;
    }

    switch (type) {
      case 'int':
      case 'integer':
        return parseInt(value);
      case 'float':
      case 'double':
        return parseFloat(value);
      case 'bool':
      case 'boolean':
        return Boolean(value);
      case 'string':
        return String(value);
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value;
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  /**
   * 开始查询构建器
   */
  query() {
    return new QueryBuilder(this);
  }

  /**
   * 执行原始SQL查询
   */
  async raw(sql, params = []) {
    const db = await this.getDatabase();
    return await db.query(sql, params);
  }

  /**
   * 批量插入
   */
  async insertBatch(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('数据数组不能为空');
    }

    const db = await this.getDatabase();
    const results = [];

    for (const data of dataArray) {
      const cleanData = this.fillableData(data);

      if (this.timestamps) {
        cleanData.create_time = new Date();
        cleanData.update_time = new Date();
      }

      const result = await db.insert(this.tableName, cleanData);
      results.push(result);
    }

    return results;
  }

  /**
   * 批量更新
   */
  async updateBatch(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('更新数据数组不能为空');
    }

    const db = await this.getDatabase();
    const results = [];

    for (const { id, data } of updates) {
      const cleanData = this.fillableData(data);

      if (this.timestamps) {
        cleanData.update_time = new Date();
      }

      const result = await db.update(
        this.tableName,
        cleanData,
        `${this.primaryKey} = ?`,
        [id]
      );
      results.push(result);
    }

    return results;
  }
}

/**
 * 查询构建器类
 */
class QueryBuilder {
  constructor(model) {
    this.model = model;
    this.whereConditions = [];
    this.whereParams = [];
    this.orderByClause = '';
    this.limitClause = '';
    this.offsetClause = '';
  }

  /**
   * WHERE条件
   */
  where(field, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }

    this.whereConditions.push(`${field} ${operator} ?`);
    this.whereParams.push(value);
    return this;
  }

  /**
   * WHERE IN条件
   */
  whereIn(field, values) {
    if (!Array.isArray(values) || values.length === 0) {
      return this;
    }

    const placeholders = values.map(() => '?').join(', ');
    this.whereConditions.push(`${field} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  /**
   * LIKE条件
   */
  whereLike(field, value) {
    this.whereConditions.push(`${field} LIKE ?`);
    this.whereParams.push(`%${value}%`);
    return this;
  }

  /**
   * 排序
   */
  orderBy(field, direction = 'ASC') {
    this.orderByClause = `${field} ${direction.toUpperCase()}`;
    return this;
  }

  /**
   * 限制数量
   */
  limit(count) {
    this.limitClause = `LIMIT ${parseInt(count)}`;
    return this;
  }

  /**
   * 偏移量
   */
  offset(count) {
    this.offsetClause = `OFFSET ${parseInt(count)}`;
    return this;
  }

  /**
   * 获取第一条记录
   */
  async first() {
    this.limit(1);
    const results = await this.get();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 获取所有记录
   */
  async get() {
    let where = this.whereConditions.join(' AND ') || '1=1';

    if (this.model.softDeletes) {
      where += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
    }

    return await this.model.findAll(where, this.whereParams, this.orderByClause);
  }

  /**
   * 统计数量
   */
  async count() {
    const where = this.whereConditions.join(' AND ') || '1=1';
    return await this.model.count(where, this.whereParams);
  }
}

module.exports = BaseModel;