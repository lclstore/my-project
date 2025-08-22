/**
 * 发布服务类
 * 处理发布相关的业务逻辑
 */

const BaseService = require('../core/BaseService');

class PublishService extends BaseService {
  constructor() {
    super({
      tableName: 'publish',
      entityName: '发布记录',
      primaryKey: 'id',
      defaultOrderBy: 'create_time DESC', // 按创建时间倒序
      searchableFields: ['remark', 'env'],
      fieldMapping: {
        // 前端字段名 -> 数据库字段名
        createUser: 'create_user',
        createTime: 'create_time',

      }
    });
  }

  /**
   * 验证发布数据
   */
  validatePublishData(data) {
    const errors = [];

    // 基本字段验证
    if (!data.env || !['PRODUCTION', 'PRE_PRODUCTION'].includes(data.env)) {
      errors.push('环境必须是 PRODUCTION 或 PRE_PRODUCTION');
    }

    // status 固定为 SUCCESS，不需要验证前端传入值

    if (!data.createUser) {
      errors.push('创建用户不能为空');
    }

    return errors;
  }

  /**
   * 生成版本号
   */
  async generateVersion() {
    try {
      // 获取当前最大版本号
      const sql = 'SELECT MAX(version) as max_version FROM publish';
      const result = await this.queryOne(sql);

      let maxVersion = result?.max_version || 0;
      return maxVersion + 1;
    } catch (error) {
      this.logger.error('生成版本号失败:', error);
      // 如果查询失败，返回一个基于时间戳的版本号
      return Date.now();
    }
  }

  /**
   * 创建发布记录
   */
  async createPublish(data) {
    try {
      // 数据验证
      const validationErrors = this.validatePublishData(data);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: validationErrors.join('; ')
        };
      }

      const now = new Date();
      const version = await this.generateVersion();

      // 准备发布数据
      const publishData = this.convertToDbFields({
        env: data.env,
        remark: data.remark || null,
        status: 'SUCCESS', // 固定为 SUCCESS
        version: version,
        createUser: data.createUser,
        createTime: now,

      });

      const insertSql = `
        INSERT INTO publish (${Object.keys(publishData).join(', ')})
        VALUES (${Object.keys(publishData).map(() => '?').join(', ')})
      `;

      const insertResult = await this.query(insertSql, Object.values(publishData));
      const publishId = insertResult.insertId;

      return {
        success: true,
        id: publishId,
        message: '新增发布记录成功'
      };

    } catch (error) {
      this.logger.error('创建发布记录失败:', error);
      return {
        success: false,
        errCode: 'SAVE_ERROR',
        errMessage: error.message || '创建发布记录失败'
      };
    }
  }

  /**
   * 分页查询发布记录列表
   */
  async getPage(params) {
    try {
      // 定义允许的查询参数
      const allowedFilters = ['keywords', 'env', 'status'];

      const paginationParams = this.processPaginationParams(params, allowedFilters);
      const { pageIndex, pageSize, orderBy, orderDirection, offset, ...filters } = paginationParams;

      // 构建查询条件
      const conditions = [];
      const queryParams = [];

      // 关键词搜索
      if (filters.keywords && filters.keywords.trim()) {
        const keyword = filters.keywords.trim();
        // 检查是否为纯数字（ID或版本号精确匹配）
        if (/^\d+$/.test(keyword)) {
          conditions.push('(p.id = ? OR p.version = ?)');
          queryParams.push(parseInt(keyword), parseInt(keyword));
        } else {
          // 备注模糊搜索
          conditions.push('p.remark LIKE ?');
          queryParams.push(`%${keyword}%`);
        }
      }

      // 环境筛选
      if (filters.env) {
        conditions.push('p.env = ?');
        queryParams.push(filters.env);
      }

      // 状态筛选
      if (filters.status) {
        conditions.push('p.status = ?');
        queryParams.push(filters.status);
      }

      // 构建查询SQL
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 固定按创建时间倒序排序
      const orderClause = `ORDER BY p.create_time DESC`;

      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total
        FROM publish p
        ${whereClause}
      `;

      const countResult = await this.queryOne(countSql, queryParams);
      const totalCount = countResult.total;

      // 查询数据
      const dataSql = `
        SELECT p.*, u1.email as create_user
        FROM publish p
        LEFT JOIN user u1 ON p.create_user = u1.id
        ${whereClause}
        ${orderClause}
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      const dataResult = await this.query(dataSql, queryParams);

      return {
        success: true,
        data: this.convertToFrontendFields(dataResult),
        totalCount,
        pageIndex,
        pageSize
      };

    } catch (error) {
      this.logger.error('获取发布记录列表失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取发布记录列表失败'
      };
    }
  }

  /**
   * 获取发布记录详情
   */
  async getDetail(id) {
    try {
      const sql = `
        SELECT p.*, u.email as create_user_email
        FROM publish p
        LEFT JOIN user u ON p.create_user = u.id
        WHERE p.id = ?
      `;

      const result = await this.queryOne(sql, [id]);

      if (!result) {
        return {
          success: false,
          errCode: 'NOT_FOUND',
          errMessage: '发布记录不存在'
        };
      }

      return {
        success: true,
        data: this.convertToFrontendFields(result)
      };

    } catch (error) {
      this.logger.error('获取发布记录详情失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取发布记录详情失败'
      };
    }
  }

  /**
   * 更新发布记录状态
   */
  async updateStatus(id, data) {
    try {
      // 验证状态值
      if (!data.status || !['WAITING', 'SUCCESS', 'FAIL', 'PROCESSING'].includes(data.status)) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: '状态值无效'
        };
      }

      const now = new Date();
      const updateData = this.convertToDbFields({
        status: data.status,
        remark: data.remark || null,
      });

      const updateSql = `
        UPDATE publish 
        SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
        WHERE id = ?
      `;

      const updateParams = [...Object.values(updateData), id];
      const updateResult = await this.query(updateSql, updateParams);

      if (updateResult.affectedRows === 0) {
        return {
          success: false,
          errCode: 'NOT_FOUND',
          errMessage: '发布记录不存在',
          statusCode: 404
        };
      }

      return {
        success: true,
        message: '更新发布记录成功'
      };

    } catch (error) {
      this.logger.error('更新发布记录状态失败:', error);
      return {
        success: false,
        errCode: 'UPDATE_ERROR',
        errMessage: '更新发布记录失败'
      };
    }
  }
}

module.exports = PublishService;
