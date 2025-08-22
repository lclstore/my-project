/**
 * 控制器基类
 * 提供标准的CRUD操作和通用方法
 */

const Response = require('./Response');
const Logger = require('./Logger');

class BaseController {
  constructor(options = {}) {
    this.service = options.service;
    this.entityName = options.entityName || '数据';
    this.logger = new Logger();

    // 验证配置
    if (!this.service) {
      throw new Error('BaseController必须提供service实例');
    }
  }

  /**
   * 获取列表（分页）
   */
  async getList(req, res) {
    try {
      const result = await this.service.getList(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          `获取${this.entityName}列表成功`
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error(`获取${this.entityName}列表失败:`, {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', `获取${this.entityName}列表失败`, 500);
    }
  }

  /**
   * 获取详情
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.service.getById(id);

      if (result.success) {
        return res.success(result.data, `获取${this.entityName}详情成功`);
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error(`获取${this.entityName}详情失败:`, {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', `获取${this.entityName}详情失败`, 500);
    }
  }

  /**
   * 创建数据
   */
  async create(req, res) {
    try {
      const result = await this.service.create(req.body);

      if (result.success) {
        return res.success(
          { id: result.insertId },
          `创建${this.entityName}成功`,
          201
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error(`创建${this.entityName}失败:`, {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', `创建${this.entityName}失败`, 500);
    }
  }

  /**
   * 更新数据
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.service.update(id, req.body);

      if (result.success) {
        return res.success(null, `更新${this.entityName}成功`);
      } else {
        return res.error(result.errCode, result.errMessage, result.statusCode || 400);
      }
    } catch (error) {
      this.logger.error(`更新${this.entityName}失败:`, {
        error: error.message,
        stack: error.stack,
        id: req.params.id,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', `更新${this.entityName}失败`, 500);
    }
  }

  /**
   * 删除数据
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.error('INVALID_PARAMS', 'ID参数不能为空', 400);
      }

      const result = await this.service.delete(id);

      if (result.success) {
        return res.success(null, `删除${this.entityName}成功`);
      } else {
        return res.error(result.errCode, result.errMessage, result.statusCode || 400);
      }
    } catch (error) {
      this.logger.error(`删除${this.entityName}失败:`, {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });
      return res.error('INTERNAL_ERROR', `删除${this.entityName}失败`, 500);
    }
  }

  /**
   * 批量删除
   */
  async batchDelete(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.error('INVALID_PARAMS', 'IDs参数不能为空', 400);
      }

      const result = await this.service.batchDelete(ids);

      if (result.success) {
        return res.success(
          { deletedCount: result.deletedCount },
          `批量删除${this.entityName}成功`
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error(`批量删除${this.entityName}失败:`, {
        error: error.message,
        stack: error.stack,
        ids: req.body.ids
      });
      return res.error('INTERNAL_ERROR', `批量删除${this.entityName}失败`, 500);
    }
  }

  /**
   * 获取所有数据（不分页）
   */
  async getAll(req, res) {
    try {
      const result = await this.service.getAll(req.query);

      if (result.success) {
        return res.success(result.data, `获取所有${this.entityName}成功`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error(`获取所有${this.entityName}失败:`, {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', `获取所有${this.entityName}失败`, 500);
    }
  }

  /**
   * 搜索数据
   */
  async search(req, res) {
    try {
      const result = await this.service.search(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          `搜索${this.entityName}成功`
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error(`搜索${this.entityName}失败:`, {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', `搜索${this.entityName}失败`, 500);
    }
  }

  /**
   * 统计数据
   */
  async getStats(req, res) {
    try {
      const result = await this.service.getStats(req.query);

      if (result.success) {
        return res.success(result.data, `获取${this.entityName}统计成功`);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error(`获取${this.entityName}统计失败:`, {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', `获取${this.entityName}统计失败`, 500);
    }
  }

  /**
   * 参数验证辅助方法
   */
  validateRequired(data, fields) {
    const errors = [];

    for (const field of fields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`${field}不能为空`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 分页参数解析
   */
  parsePaginationParams(query) {
    const pageIndex = parseInt(query.pageIndex) || 1;
    const pageSize = Math.min(parseInt(query.pageSize) || 10, 100); // 限制最大100条

    return {
      pageIndex: Math.max(pageIndex, 1),
      pageSize: Math.max(pageSize, 1),
      offset: (Math.max(pageIndex, 1) - 1) * Math.max(pageSize, 1)
    };
  }

  /**
   * 构建排序语句
   */
  buildOrderBy(query, allowedFields = []) {
    const { orderBy = 'id', orderDirection = 'DESC' } = query;

    // 验证排序字段
    if (allowedFields.length > 0 && !allowedFields.includes(orderBy)) {
      return 'id DESC';
    }

    // 验证排序方向
    const direction = ['ASC', 'DESC'].includes(orderDirection.toUpperCase())
      ? orderDirection.toUpperCase()
      : 'DESC';

    return `${orderBy} ${direction}`;
  }

  /**
   * 构建搜索条件
   */
  buildSearchConditions(query, searchableFields = []) {
    const conditions = [];
    const params = [];

    // 关键词搜索
    if (query.keywords && searchableFields.length > 0) {
      const keywordConditions = searchableFields.map(field => `${field} LIKE ?`);
      conditions.push(`(${keywordConditions.join(' OR ')})`);

      // 为每个搜索字段添加参数
      searchableFields.forEach(() => {
        params.push(`%${query.keywords}%`);
      });
    }

    // 状态筛选
    if (query.status !== undefined && query.status !== '') {
      conditions.push('status = ?');
      params.push(query.status);
    }

    // 时间范围筛选
    if (query.startDate) {
      conditions.push('create_time >= ?');
      params.push(query.startDate);
    }

    if (query.endDate) {
      conditions.push('create_time <= ?');
      params.push(query.endDate);
    }

    return {
      where: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
      params
    };
  }
}

module.exports = BaseController;