const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 初始化数据库
const initDatabase = async () => {
  try {
    // 创建数据库（如果不存在）
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConnection.end();

    console.log('✅ 数据库初始化成功');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
};

// 执行SQL查询的辅助函数
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('SQL查询错误:', error.message);
    throw error;
  }
};

// 获取单条记录
const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

// 数据库操作封装类
class DatabaseHelper {

  // 插入数据
  static async insert(table, data) {
    try {
      // 自动添加 create_time 字段
      const dataWithTime = { ...data };
      if (!dataWithTime.create_time) {
        dataWithTime.create_time = new Date();
      }

      const fields = Object.keys(dataWithTime);
      const values = Object.values(dataWithTime);
      const placeholders = fields.map(() => '?').join(', ');

      const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await pool.execute(sql, values);

      return {
        success: true,
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('插入数据错误:', error.message);
      throw error;
    }
  }

  // 批量插入数据
  static async insertBatch(table, dataArray) {
    if (!dataArray || dataArray.length === 0) {
      throw new Error('数据数组不能为空');
    }

    try {
      // 为每条数据自动添加 create_time 字段
      const dataWithTime = dataArray.map(data => {
        const dataWithTime = { ...data };
        if (!dataWithTime.create_time) {
          dataWithTime.create_time = new Date();
        }
        return dataWithTime;
      });

      const fields = Object.keys(dataWithTime[0]);
      const placeholders = fields.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

      const results = [];
      for (const data of dataWithTime) {
        const values = Object.values(data);
        const [result] = await pool.execute(sql, values);
        results.push({
          insertId: result.insertId,
          affectedRows: result.affectedRows
        });
      }

      return {
        success: true,
        results,
        totalInserted: results.length
      };
    } catch (error) {
      console.error('批量插入数据错误:', error.message);
      throw error;
    }
  }

  // 更新数据
  static async update(table, data, where, whereParams = []) {
    try {
      // 自动添加 update_time 字段
      const dataWithTime = { ...data };
      if (!dataWithTime.update_time) {
        dataWithTime.update_time = new Date();
      }

      const fields = Object.keys(dataWithTime);
      const values = Object.values(dataWithTime);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      const [result] = await pool.execute(sql, [...values, ...whereParams]);

      return {
        success: true,
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      };
    } catch (error) {
      console.error('更新数据错误:', error.message);
      throw error;
    }
  }

  // 删除数据（优先使用逻辑删除）
  static async delete(table, where, whereParams = []) {
    try {
      // 检查表是否有 is_deleted 字段
      const hasIsDeletedField = await this.checkColumnExists(table, 'is_deleted');

      let sql, result;
      if (hasIsDeletedField) {
        // 使用逻辑删除
        sql = `UPDATE ${table} SET is_deleted = 1, update_time = CURRENT_TIMESTAMP WHERE ${where} AND is_deleted = 0`;
        [result] = await pool.execute(sql, whereParams);
      } else {
        // 如果表没有 is_deleted 字段，使用物理删除（向后兼容）
        sql = `DELETE FROM ${table} WHERE ${where}`;
        [result] = await pool.execute(sql, whereParams);
      }

      return {
        success: true,
        affectedRows: result.affectedRows,
        isLogicalDelete: hasIsDeletedField
      };
    } catch (error) {
      console.error('删除数据错误:', error.message);
      throw error;
    }
  }

  // 检查表中是否存在指定字段
  static async checkColumnExists(table, column) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      `;
      const [result] = await pool.execute(sql, [table, column]);
      return result[0].count > 0;
    } catch (error) {
      console.error('检查字段存在性错误:', error.message);
      return false; // 出错时默认返回false，使用物理删除
    }
  }

  // 查询数据（支持分页）
  static async select(table, options = {}) {
    try {
      const {
        fields = '*',
        where = '',
        whereParams = [],
        orderBy = '',
        limit = '',
        offset = 0
      } = options;

      let sql = `SELECT ${fields} FROM ${table}`;

      if (where) {
        sql += ` WHERE ${where}`;
      }

      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }

      if (limit) {
        sql += ` LIMIT ${limit}`;
        if (offset > 0) {
          sql += ` OFFSET ${offset}`;
        }
      }

      const rows = await query(sql, whereParams);
      return {
        success: true,
        data: rows,
        empty: rows.length === 0,
        notEmpty: rows.length > 0,
        errCode: null,
        errMessage: null
      };
    } catch (error) {
      console.error('查询数据错误:', error.message);
      throw error;
    }
  }

  // 查询单条数据
  static async selectOne(table, options = {}) {
    const result = await this.select(table, { ...options, limit: 1 });
    return {
      success: result.success,
      data: result.data[0] || null
    };
  }

  // 通过ID查询单条记录
  static async findById(tableName, id, extraConditions = {}) {
    try {
      let sql = `SELECT * FROM ${tableName} WHERE id = ?`;
      const params = [id];

      // 添加额外的查询条件
      for (const [field, value] of Object.entries(extraConditions)) {
        sql += ` AND ${field} = ?`;
        params.push(value);
      }

      const results = await query(sql, params);

      if (results.length > 0) {
        return {
          success: true,
          data: results[0]
        };
      } else {
        return {
          success: false,
          error: 'RECORD_NOT_FOUND',
          message: '记录不存在'
        };
      }
    } catch (error) {
      console.error(`查询${tableName}数据错误:`, error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: '查询数据失败'
      };
    }
  }

  // 统计数据
  static async count(table, where = '', whereParams = []) {
    try {
      let sql = `SELECT COUNT(*) as total FROM ${table}`;

      if (where) {
        sql += ` WHERE ${where}`;
      }

      const result = await queryOne(sql, whereParams);
      return {
        success: true,
        total: result.total
      };
    } catch (error) {
      console.error('统计数据错误:', error.message);
      throw error;
    }
  }

  // 检查数据是否存在
  static async exists(table, where, whereParams = []) {
    try {
      const result = await this.count(table, where, whereParams);
      return {
        success: true,
        exists: result.total > 0
      };
    } catch (error) {
      console.error('检查数据存在性错误:', error.message);
      throw error;
    }
  }
}

// 文件操作辅助类
class FileHelper {

  // 保存文件信息到数据库
  static async saveFileInfo(fileData) {
    try {
      const {
        originalName,
        fileName,
        filePath,
        fileSize,
        mimeType,
        uploadedBy = null
      } = fileData;

      const data = {
        original_name: originalName,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: uploadedBy,
        upload_time: new Date()
      };

      return await DatabaseHelper.insert('files', data);
    } catch (error) {
      console.error('保存文件信息错误:', error.message);
      throw error;
    }
  }

  // 获取文件信息
  static async getFileInfo(fileId) {
    try {
      return await DatabaseHelper.selectOne('files', {
        where: 'id = ?',
        whereParams: [fileId]
      });
    } catch (error) {
      console.error('获取文件信息错误:', error.message);
      throw error;
    }
  }

  // 获取用户的文件列表
  static async getUserFiles(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 10,
        orderBy = 'upload_time DESC'
      } = options;

      const offset = (page - 1) * pageSize;

      return await DatabaseHelper.select('files', {
        where: 'uploaded_by = ?',
        whereParams: [userId],
        orderBy,
        limit: pageSize,
        offset
      });
    } catch (error) {
      console.error('获取用户文件列表错误:', error.message);
      throw error;
    }
  }

  // 删除文件记录（逻辑删除）
  static async deleteFileRecord(fileId, userId = null) {
    try {
      let where = 'id = ?';
      let whereParams = [fileId];

      // 如果指定了用户ID，确保只能删除自己的文件
      if (userId) {
        where += ' AND uploaded_by = ?';
        whereParams.push(userId);
      }

      // 使用逻辑删除（如果files表有is_deleted字段）
      return await DatabaseHelper.delete('files', where, whereParams);
    } catch (error) {
      console.error('删除文件记录错误:', error.message);
      throw error;
    }
  }

  // 更新文件下载次数
  static async incrementDownloadCount(fileId) {
    try {
      const sql = 'UPDATE files SET download_count = download_count + 1 WHERE id = ?';
      const [result] = await pool.execute(sql, [fileId]);

      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('更新下载次数错误:', error.message);
      throw error;
    }
  }
}

// 分页辅助函数
const paginate = async (table, options = {}) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      where = '',
      whereParams = [],
      orderBy = 'id DESC'
    } = options;

    // 获取总数
    const countResult = await DatabaseHelper.count(table, where, whereParams);
    const total = countResult.total;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // 获取数据
    const dataResult = await DatabaseHelper.select(table, {
      where,
      whereParams,
      orderBy,
      limit: pageSize,
      offset
    });

    return {
      success: true,
      data: dataResult.data,
      pageIndex: parseInt(page),
      pageSize: parseInt(pageSize),
      totalCount: total,
      notEmpty: dataResult.data.length > 0,
      empty: dataResult.data.length === 0,
      errCode: null,
      errMessage: null,
      totalPages
    };
  } catch (error) {
    console.error('分页查询错误:', error.message);
    throw error;
  }
};

// 事务处理辅助函数
const transaction = async (callback) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 执行事务操作
    const result = await callback(connection);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('事务执行错误:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// 带字段转换的查询函数
const queryWithConversion = async (sql, params = []) => {
  try {
    const { convertToFrontendFormat } = require('../utils/fieldConverter');
    const result = await query(sql, params);
    return convertToFrontendFormat(result);
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
};

// 带字段转换的单条查询函数
const queryOneWithConversion = async (sql, params = []) => {
  try {
    const { convertToFrontendFormat } = require('../utils/fieldConverter');
    const result = await queryOne(sql, params);
    return convertToFrontendFormat(result);
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
};

// 通用插入函数（基础版本）
const insertRecord = async (tableName, data) => {
  try {
    // 过滤掉 null 和 undefined 的字段
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        filteredData[key] = value;
      }
    }

    // 自动添加 create_time 字段
    if (!filteredData.create_time) {
      filteredData.create_time = new Date();
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    return {
      success: true,
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error('插入数据错误:', error);
    throw error;
  }
};

// 高级插入函数（简化版本，移除tableConfig依赖）
const insertRecordWithValidation = async (tableName, data) => {
  try {
    // 过滤掉 null 和 undefined 的字段
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        filteredData[key] = value;
      }
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error('没有有效的数据可插入');
    }

    // 自动添加 create_time 字段
    if (!filteredData.create_time) {
      filteredData.create_time = new Date();
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await query(sql, values);

    return {
      success: true,
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error(`❌ [${tableName}] 插入数据错误:`, error);
    throw error;
  }
};

// 通用更新函数
const updateRecord = async (tableName, data, whereCondition, whereParams = []) => {
  try {
    // 过滤掉 null 和 undefined 的字段
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        filteredData[key] = value;
      }
    }

    // 自动添加 update_time 字段
    if (!filteredData.update_time) {
      filteredData.update_time = new Date();
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereCondition}`;
    const result = await query(sql, [...values, ...whereParams]);
    return {
      success: true,
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    };
  } catch (error) {
    console.error('更新数据错误:', error);
    throw error;
  }
};

// 公共验证函数
class ValidationHelper {

  // URL 格式验证
  static validateUrl(url, fieldName = 'URL') {
    if (!url) return { valid: true };

    try {
      new URL(url);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `${fieldName}格式不正确`
      };
    }
  }

  // 分页参数验证
  static validatePaginationParams(pageSize, pageIndex) {
    const errors = [];

    if (pageSize < 1) {
      errors.push('每页数量必须>1');
    }

    if (pageIndex < 1) {
      errors.push('页码必须大于0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 公共业务逻辑处理类
class BusinessHelper {

  // 通用数据插入流程（集成参数校验）
  static async insertWithValidation(tableName, requestData, customValidations = [], apiKey = null) {
    try {
      const { convertRequestData } = require('../utils/fieldConverter');
      const { validateApiData, validateTableData, preprocessData } = require('../utils/validator');

      // 数据预处理（去除空格等）
      const processedData = preprocessData(requestData);

      if (Object.keys(processedData).length === 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '没有有效的数据可插入',
          statusCode: 400
        };
      }

      // 参数校验 - 优先使用接口级别的验证
      let validationResult;
      if (apiKey) {
        validationResult = validateApiData(apiKey, processedData);
      } else {
        validationResult = validateTableData(tableName, processedData, 'insert');
      }

      if (!validationResult.valid) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validationResult.errors.join(', '),
          statusCode: 400
        };
      }

      // 转换为数据库字段格式
      const dbData = convertRequestData(processedData);

      // 执行自定义验证
      for (const validation of customValidations) {
        const validationResult = await validation(dbData);
        if (!validationResult.valid) {
          return {
            success: false,
            error: 'INVALID_PARAMS',
            message: validationResult.error,
            statusCode: 400
          };
        }
      }

      // 使用高级插入函数（带验证）
      const result = await insertRecordWithValidation(tableName, dbData);

      return {
        success: true,
        insertId: result.insertId,
        message: '添加成功'
      };

    } catch (error) {
      console.error(`添加${tableName}数据错误:`, error);

      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: '数据已存在',
          statusCode: 409
        };
      }

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '添加数据失败',
        statusCode: 500
      };
    }
  }

  // 通用数据更新流程（集成参数校验）
  static async updateWithValidation(tableName, id, requestData, customValidations = [], apiKey = null) {
    try {
      const { convertRequestData } = require('../utils/fieldConverter');
      const { validateApiData, validateTableData, preprocessData } = require('../utils/validator');

      // 数据预处理（去除空格等）
      const processedData = preprocessData(requestData);

      if (Object.keys(processedData).length === 0) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '没有有效的数据可更新',
          statusCode: 400
        };
      }

      // 参数校验 - 优先使用接口级别的验证
      let validationResult;
      if (apiKey) {
        validationResult = validateApiData(apiKey, processedData);
      } else {
        validationResult = validateTableData(tableName, processedData, 'update');
      }

      if (!validationResult.valid) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validationResult.errors.join(', '),
          statusCode: 400
        };
      }

      // 转换为数据库字段格式
      const dbData = convertRequestData(processedData);

      // 执行自定义验证
      for (const validation of customValidations) {
        const validationResult = await validation(dbData);
        if (!validationResult.valid) {
          return {
            success: false,
            error: 'INVALID_PARAMS',
            message: validationResult.error,
            statusCode: 400
          };
        }
      }

      // 使用更新函数
      const result = await updateRecord(tableName, dbData, 'id = ?', [id]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: '数据不存在或未发生变化',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { affectedRows: result.affectedRows },
        message: '更新成功'
      };

    } catch (error) {
      console.error(`更新${tableName}数据错误:`, error);

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '更新数据失败',
        statusCode: 500
      };
    }
  }

  // 通用单条记录查询流程（带字段转换）
  static async findByIdWithValidation(tableName, id, extraConditions = {}, customConverter = null) {
    try {
      const result = await DatabaseHelper.findById(tableName, id, extraConditions);

      if (result.success && result.data) {
        // 转换字段名：数据库字段名(snake_case) -> 前端字段名(camelCase)
        const { convertToFrontendFormat } = require('../utils/fieldConverter');
        const converter = customConverter || convertToFrontendFormat;
        const convertedData = converter(result.data);

        return {
          success: true,
          data: convertedData
        };
      } else {
        return {
          success: false,
          error: 'RECORD_NOT_FOUND',
          message: '记录不存在'
        };
      }
    } catch (error) {
      console.error(`[${tableName}] 查询数据错误:`, error);
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: '查询数据失败',
        statusCode: 500
      };
    }
  }

  // 通用分页查询流程（带字段转换）
  static async paginateWithValidation(tableName, req, options = {}) {
    try {
      const { parsePaginationParams } = require('../utils/paramHelper');
      const { pageIndex, pageSize, offset } = parsePaginationParams(req.query);

      // 参数验证
      const errors = [];
      if (pageSize < 1) {
        errors.push('每页数量必须>1');
      }
      if (pageIndex < 1) {
        errors.push('页码必须大于0');
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: 'INVALID_PARAMS',
          message: errors.join(', '),
          statusCode: 400
        };
      }

      const { convertToFrontendFormatWithOptions } = require('../utils/fieldConverter');

      // 如果提供了自定义SQL查询，使用自定义查询
      if (options.customSql && options.customCountSql) {
        return await this.paginateWithCustomSql(pageSize, pageIndex, options);
      }

      // 获取总数
      const countResult = await DatabaseHelper.count(tableName, options.where || '', options.whereParams || []);
      const total = countResult.total;
      const totalPages = Math.ceil(total / pageSize);

      // 获取数据（使用带转换的查询）
      const dataResult = await DatabaseHelper.select(tableName, {
        fields: options.fields || '*',
        where: options.where || '',
        whereParams: options.whereParams || [],
        orderBy: options.orderBy || 'id ASC',
        limit: pageSize,
        offset
      });

      // 一次性完成所有字段转换和格式化（字段名转换 + 时间格式化 + 其他字段处理）
      const convertOptions = {
        timeFormat: options.timeFormat || 'datetime',
        moneyFormat: options.moneyFormat,
        statusMap: options.statusMap,
        customProcessors: options.customProcessors,
        excludeFields: options.excludeFields || []  // 支持排除字段
      };
      const convertedData = dataResult.data.map(item => convertToFrontendFormatWithOptions(item, convertOptions));


      return {
        success: true,
        data: convertedData,
        totalCount: total,
        pageIndex: parseInt(pageIndex),
        pageSize: parseInt(pageSize),
        totalPages: totalPages,
        empty: convertedData.length === 0,
        notEmpty: convertedData.length > 0,
        errCode: null,
        errMessage: null
      };

    } catch (error) {
      console.error(`获取${tableName}列表错误:`, error);

      if (error.message.includes("doesn't exist")) {
        return {
          success: false,
          error: 'TABLE_NOT_FOUND',
          message: `${tableName}表不存在`,
          statusCode: 500
        };
      }

      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '获取列表失败',
        statusCode: 500
      };
    }
  }

  // 自定义SQL分页查询（支持JOIN等复杂查询）
  static async paginateWithCustomSql(pageSize, pageIndex, options) {
    try {
      const { convertToFrontendFormatWithOptions } = require('../utils/fieldConverter');
      const offset = (pageIndex - 1) * pageSize;

      // 获取总数
      const countResult = await queryOne(options.customCountSql, options.countParams || []);
      const total = countResult.total;
      const totalPages = Math.ceil(total / pageSize);

      // 获取数据 - 直接在SQL中替换LIMIT和OFFSET值，避免参数绑定问题
      const finalSql = options.customSql.replace(/LIMIT \? OFFSET \?/, `LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`);
      const data = await query(finalSql, options.sqlParams || []);

      // 一次性完成所有字段转换和格式化
      const convertOptions = {
        timeFormat: options.timeFormat || 'datetime',
        moneyFormat: options.moneyFormat,
        statusMap: options.statusMap,
        customProcessors: options.customProcessors
      };
      const convertedData = data.map(item => convertToFrontendFormatWithOptions(item, convertOptions));

      const result = {
        success: true,
        data: convertedData,
        pageIndex: parseInt(pageIndex),
        pageSize: parseInt(pageSize),
        totalCount: total,
        notEmpty: convertedData.length > 0,
        empty: convertedData.length === 0,
        errCode: null,
        errMessage: null,
        totalPages
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('自定义SQL分页查询错误:', error);
      throw error;
    }
  }
}

module.exports = {
  pool,
  query,
  queryOne,
  queryWithConversion,
  queryOneWithConversion,
  insertRecord,
  insertRecordWithValidation,
  updateRecord,
  testConnection,
  initDatabase,
  DatabaseHelper,
  FileHelper,
  paginate,
  transaction,
  ValidationHelper,
  BusinessHelper
};
