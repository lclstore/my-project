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
      const fields = Object.keys(data);
      const values = Object.values(data);
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
      const fields = Object.keys(dataArray[0]);
      const placeholders = fields.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

      const results = [];
      for (const data of dataArray) {
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
      const fields = Object.keys(data);
      const values = Object.values(data);
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

  // 删除数据
  static async delete(table, where, whereParams = []) {
    try {
      const sql = `DELETE FROM ${table} WHERE ${where}`;
      const [result] = await pool.execute(sql, whereParams);

      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('删除数据错误:', error.message);
      throw error;
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
        count: rows.length
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

  // 删除文件记录
  static async deleteFileRecord(fileId, userId = null) {
    try {
      let where = 'id = ?';
      let whereParams = [fileId];

      // 如果指定了用户ID，确保只能删除自己的文件
      if (userId) {
        where += ' AND uploaded_by = ?';
        whereParams.push(userId);
      }

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
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
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

module.exports = {
  pool,
  query,
  queryOne,
  testConnection,
  initDatabase,
  DatabaseHelper,
  FileHelper,
  paginate,
  transaction
};
