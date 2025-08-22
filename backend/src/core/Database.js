/**
 * 数据库连接管理类
 * 负责数据库连接、查询和事务管理
 */

const mysql = require('mysql2/promise');
const Logger = require('./Logger');

class Database {
  constructor() {
    this.pool = null;
    this.logger = new Logger();
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'test',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      // 移除不支持的配置选项
      // acquireTimeout: 60000,  // MySQL2 不再支持
      // timeout: 60000,         // MySQL2 不再支持
      // reconnect: true,        // MySQL2 不再支持
      charset: 'utf8mb4',
      // 将日期时间字段以字符串返回，格式为 'YYYY-MM-DD HH:mm:ss'
      dateStrings: true
    };
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      // 创建数据库（如果不存在）
      await this.createDatabaseIfNotExists();

      // 创建连接池
      this.pool = mysql.createPool(this.config);

      // 测试连接
      await this.testConnection();

      this.logger.success('数据库连接初始化成功');
      return true;
    } catch (error) {
      this.logger.error('数据库连接初始化失败:', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建数据库（如果不存在）
   */
  async createDatabaseIfNotExists() {
    try {
      const tempConfig = { ...this.config };
      delete tempConfig.database;

      const tempConnection = await mysql.createConnection(tempConfig);
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${this.config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await tempConnection.end();

      this.logger.info(`数据库 ${this.config.database} 检查完成`);
    } catch (error) {
      this.logger.error('创建数据库失败:', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      this.logger.success('数据库连接测试成功');
      return true;
    } catch (error) {
      this.logger.error('数据库连接测试失败:', { error: error.message });
      throw error;
    }
  }

  /**
   * 执行SQL查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @returns {Promise<Array>} 查询结果
   */
  async query(sql, params = []) {
    try {
      const startTime = Date.now();
      const [rows] = await this.pool.execute(sql, params);
      const duration = Date.now() - startTime;

      // 记录慢查询
      if (duration > 1000) {
        this.logger.warn('慢查询检测:', {
          sql: sql.substring(0, 200),
          duration: `${duration}ms`,
          params: params.length > 0 ? params : undefined
        });
      }

      return rows;
    } catch (error) {
      this.logger.error('SQL查询错误:', {
        sql: sql.substring(0, 200),
        params,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 执行SQL查询并返回第一条记录
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @returns {Promise<Object|null>} 查询结果
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 插入数据
   * @param {string} table - 表名
   * @param {Object} data - 数据对象
   * @returns {Promise<Object>} 插入结果
   */
  async insert(table, data) {
    try {
      // 过滤空值并添加时间戳
      const filteredData = this.filterData(data);
      if (!filteredData.create_time) {
        filteredData.create_time = new Date();
      }

      const fields = Object.keys(filteredData);
      const values = Object.values(filteredData);
      const placeholders = fields.map(() => '?').join(', ');

      const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await this.pool.execute(sql, values);

      return {
        success: true,
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      this.logger.error('插入数据错误:', {
        table,
        data,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 更新数据
   * @param {string} table - 表名
   * @param {Object} data - 更新数据
   * @param {string} where - WHERE条件
   * @param {Array} whereParams - WHERE参数
   * @returns {Promise<Object>} 更新结果
   */
  async update(table, data, where, whereParams = []) {
    try {
      // 过滤空值并添加更新时间戳
      const filteredData = this.filterData(data);
      if (!filteredData.update_time) {
        filteredData.update_time = new Date();
      }

      const fields = Object.keys(filteredData);
      const values = Object.values(filteredData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      const [result] = await this.pool.execute(sql, [...values, ...whereParams]);

      return {
        success: true,
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      };
    } catch (error) {
      this.logger.error('更新数据错误:', {
        table,
        data,
        where,
        whereParams,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 删除数据（逻辑删除优先）
   * @param {string} table - 表名
   * @param {string} where - WHERE条件
   * @param {Array} whereParams - WHERE参数
   * @returns {Promise<Object>} 删除结果
   */
  async delete(table, where, whereParams = []) {
    try {
      // 检查是否支持逻辑删除
      const hasIsDeleted = await this.checkColumnExists(table, 'is_deleted');

      let sql, result;
      if (hasIsDeleted) {
        // 逻辑删除
        sql = `UPDATE ${table} SET is_deleted = 1, update_time = NOW() WHERE ${where} AND is_deleted = 0`;
        [result] = await this.pool.execute(sql, whereParams);
      } else {
        // 物理删除
        sql = `DELETE FROM ${table} WHERE ${where}`;
        [result] = await this.pool.execute(sql, whereParams);
      }

      return {
        success: true,
        affectedRows: result.affectedRows,
        isLogicalDelete: hasIsDeleted
      };
    } catch (error) {
      this.logger.error('删除数据错误:', {
        table,
        where,
        whereParams,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 检查表中是否存在指定字段
   * @param {string} table - 表名
   * @param {string} column - 字段名
   * @returns {Promise<boolean>} 是否存在
   */
  async checkColumnExists(table, column) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      `;
      const result = await this.queryOne(sql, [table, column]);
      return result.count > 0;
    } catch (error) {
      this.logger.error('检查字段存在性错误:', { table, column, error: error.message });
      return false;
    }
  }

  /**
   * 分页查询
   * @param {string} table - 表名
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async paginate(table, options = {}) {
    try {
      const {
        fields = '*',
        where = '1=1',
        whereParams = [],
        orderBy = 'id DESC',
        pageIndex = 1,
        pageSize = 10
      } = options;

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM ${table} WHERE ${where}`;
      const countResult = await this.queryOne(countSql, whereParams);
      const totalCount = countResult.total;
      const totalPages = Math.ceil(totalCount / pageSize);
      const offset = (pageIndex - 1) * pageSize;

      // 获取数据 - 使用字符串拼接避免 MySQL2 参数问题
      const limitValue = parseInt(pageSize);
      const offsetValue = parseInt(offset);
      const dataSql = `SELECT ${fields} FROM ${table} WHERE ${where} ORDER BY ${orderBy} LIMIT ${limitValue} OFFSET ${offsetValue}`;
      const data = await this.query(dataSql, whereParams);

      return {
        success: true,
        data,
        totalCount: parseInt(totalCount),
        pageIndex: parseInt(pageIndex),
        pageSize: parseInt(pageSize),
        totalPages,
        empty: data.length === 0,
        notEmpty: data.length > 0
      };
    } catch (error) {
      this.logger.error('分页查询错误:', {
        table,
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 事务处理
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<*>} 事务结果
   */
  async transaction(callback) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // 创建事务专用的查询方法
      const transactionQuery = async (sql, params = []) => {
        const [rows] = await connection.execute(sql, params);
        return rows;
      };

      const result = await callback(transactionQuery, connection);

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      this.logger.error('事务执行错误:', { error: error.message });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 过滤数据（移除null和undefined值）
   * @param {Object} data - 原始数据
   * @returns {Object} 过滤后的数据
   */
  // 将 camelCase 转 snake_case 的工具
  toSnakeCase(str) {
    if (!str) return str;
    return str
      .replace(/([A-Z]+)/g, '_$1')
      .replace(/__/g, '_')
      .toLowerCase()
      .replace(/^_/, '');
  }

  filterData(data) {
    const filtered = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        const snakeKey = this.toSnakeCase(key);
        filtered[snakeKey] = value;
      }
    }
    return filtered;
  }

  /**
   * 获取连接池
   */
  getPool() {
    return this.pool;
  }

  /**
   * 关闭连接池
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('数据库连接池已关闭');
    }
  }
}

module.exports = Database;