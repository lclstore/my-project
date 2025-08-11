const express = require('express');
const { DatabaseHelper, paginate, transaction } = require('../config/database');

const router = express.Router();

// 通用查询接口
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const {
      page = 1,
      pageSize = 10,
      fields = '*',
      where = '',
      orderBy = 'id DESC',
      ...whereParams
    } = req.query;

    // 构建where条件
    let whereClause = '';
    let whereValues = [];

    if (where) {
      whereClause = where;
    } else if (Object.keys(whereParams).length > 0) {
      // 从查询参数构建where条件
      const conditions = [];
      Object.entries(whereParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          conditions.push(`${key} = ?`);
          whereValues.push(value);
        }
      });
      whereClause = conditions.join(' AND ');
    }

    // 使用分页查询
    const result = await paginate(table, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      where: whereClause,
      whereParams: whereValues,
      orderBy
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('查询数据错误:', error);
    res.status(500).json({
      success: false,
      message: '查询数据失败',
      error: error.message
    });
  }
});

// 通用单条查询接口
router.get('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;

    const result = await DatabaseHelper.selectOne(table, {
      where: 'id = ?',
      whereParams: [id]
    });

    if (!result.success || !result.data) {
      return res.status(404).json({
        success: false,
        message: '数据不存在'
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('查询单条数据错误:', error);
    res.status(500).json({
      success: false,
      message: '查询数据失败',
      error: error.message
    });
  }
});

// 通用插入接口
router.post('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: '数据不能为空'
      });
    }

    const result = await DatabaseHelper.insert(table, data);

    res.status(201).json({
      success: true,
      message: '数据创建成功',
      data: {
        id: result.insertId,
        affectedRows: result.affectedRows
      }
    });

  } catch (error) {
    console.error('插入数据错误:', error);
    res.status(500).json({
      success: false,
      message: '创建数据失败',
      error: error.message
    });
  }
});

// 通用批量插入接口
router.post('/:table/batch', async (req, res) => {
  try {
    const { table } = req.params;
    const dataArray = req.body;

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: '数据数组不能为空'
      });
    }

    const result = await DatabaseHelper.insertBatch(table, dataArray);

    res.status(201).json({
      success: true,
      message: '批量创建成功',
      data: result
    });

  } catch (error) {
    console.error('批量插入数据错误:', error);
    res.status(500).json({
      success: false,
      message: '批量创建数据失败',
      error: error.message
    });
  }
});

// 通用更新接口
router.put('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: '更新数据不能为空'
      });
    }

    const result = await DatabaseHelper.update(table, data, 'id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '数据不存在或未发生变化'
      });
    }

    res.json({
      success: true,
      message: '数据更新成功',
      data: {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      }
    });

  } catch (error) {
    console.error('更新数据错误:', error);
    res.status(500).json({
      success: false,
      message: '更新数据失败',
      error: error.message
    });
  }
});

// 通用删除接口
router.delete('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;

    const result = await DatabaseHelper.delete(table, 'id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '数据不存在'
      });
    }

    res.json({
      success: true,
      message: '数据删除成功',
      data: {
        affectedRows: result.affectedRows
      }
    });

  } catch (error) {
    console.error('删除数据错误:', error);
    res.status(500).json({
      success: false,
      message: '删除数据失败',
      error: error.message
    });
  }
});

// 通用统计接口
router.get('/:table/count', async (req, res) => {
  try {
    const { table } = req.params;
    const { where = '', ...whereParams } = req.query;

    let whereClause = '';
    let whereValues = [];

    if (where) {
      whereClause = where;
    } else if (Object.keys(whereParams).length > 0) {
      const conditions = [];
      Object.entries(whereParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          conditions.push(`${key} = ?`);
          whereValues.push(value);
        }
      });
      whereClause = conditions.join(' AND ');
    }

    const result = await DatabaseHelper.count(table, whereClause, whereValues);

    res.json({
      success: true,
      data: {
        total: result.total
      }
    });

  } catch (error) {
    console.error('统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '统计数据失败',
      error: error.message
    });
  }
});

// 事务操作接口
router.post('/:table/transaction', async (req, res) => {
  try {
    const { table } = req.params;
    const { operations } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: '操作数组不能为空'
      });
    }

    const result = await transaction(async (connection) => {
      const results = [];

      for (const operation of operations) {
        const { type, data, where, whereParams = [] } = operation;

        let sql = '';
        let params = [];

        switch (type) {
          case 'insert':
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map(() => '?').join(', ');
            sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
            params = values;
            break;

          case 'update':
            const setFields = Object.keys(data);
            const setValues = Object.values(data);
            const setClause = setFields.map(field => `${field} = ?`).join(', ');
            sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
            params = [...setValues, ...whereParams];
            break;

          case 'delete':
            sql = `DELETE FROM ${table} WHERE ${where}`;
            params = whereParams;
            break;

          default:
            throw new Error(`不支持的操作类型: ${type}`);
        }

        const [operationResult] = await connection.execute(sql, params);
        results.push({
          type,
          affectedRows: operationResult.affectedRows,
          insertId: operationResult.insertId
        });
      }

      return results;
    });

    res.json({
      success: true,
      message: '事务执行成功',
      data: result
    });

  } catch (error) {
    console.error('事务执行错误:', error);
    res.status(500).json({
      success: false,
      message: '事务执行失败',
      error: error.message
    });
  }
});

module.exports = router;
