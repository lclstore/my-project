const express = require('express');
const { DatabaseHelper, paginate, transaction, BusinessHelper } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * /api/data/{table}:
 *   get:
 *     summary: 通用数据查询接口
 *     description: 分页查询指定表的数据，支持条件筛选和排序
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: 表名
 *         example: "user"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *         example: 10
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *         description: 排序字段和方式
 *         example: "id DESC"
 *       - in: query
 *         name: where
 *         schema:
 *           type: string
 *         description: WHERE条件
 *         example: "status = 1"
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "查询成功"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/data/{table}/{id}:
 *   get:
 *     summary: 通用单条数据查询接口
 *     description: 根据ID查询指定表的单条数据
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: 表名
 *         example: "user"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 记录ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "查询成功"
 *                 data:
 *                   type: object
 *       404:
 *         description: 记录不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// 通用插入接口（带参数校验）
router.post('/:table', async (req, res) => {
  const { table } = req.params;

  // 使用带验证的插入方法
  const result = await BusinessHelper.insertWithValidation(table, req.body);

  if (result.success) {
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } else {
    res.status(result.statusCode).json({
      success: false,
      message: result.message,
      error: result.error
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

// 通用更新接口（带参数校验）
router.put('/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  // 使用带验证的更新方法
  const result = await BusinessHelper.updateWithValidation(table, id, req.body);

  if (result.success) {
    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } else {
    res.status(result.statusCode).json({
      success: false,
      message: result.message,
      error: result.error
    });
  }
});

// 通用删除接口（逻辑删除）
router.delete('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;

    // 检查表是否有 is_deleted 字段
    const hasIsDeletedField = await DatabaseHelper.checkColumnExists(table, 'is_deleted');

    let result;
    if (hasIsDeletedField) {
      // 使用逻辑删除
      result = await DatabaseHelper.update(
        table,
        { is_deleted: 1, update_time: new Date() },
        'id = ? AND is_deleted = 0',
        [id]
      );
    } else {
      // 如果表没有 is_deleted 字段，使用物理删除（向后兼容）
      result = await DatabaseHelper.delete(table, 'id = ?', [id]);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '数据不存在或已被删除'
      });
    }

    res.json({
      success: true,
      message: hasIsDeletedField ? '数据删除成功（逻辑删除）' : '数据删除成功',
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
            // 检查表是否有 is_deleted 字段
            const hasIsDeletedField = await DatabaseHelper.checkColumnExists(table, 'is_deleted');
            if (hasIsDeletedField) {
              // 使用逻辑删除
              sql = `UPDATE ${table} SET is_deleted = 1, update_time = CURRENT_TIMESTAMP WHERE ${where} AND is_deleted = 0`;
              params = whereParams;
            } else {
              // 物理删除（向后兼容）
              sql = `DELETE FROM ${table} WHERE ${where}`;
              params = whereParams;
            }
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
