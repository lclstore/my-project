/**
 * 首页服务类
 * 处理首页相关的业务逻辑
 */

const BaseService = require('../core/BaseService');

class HomeService extends BaseService {
  constructor() {
    super({
      tableName: 'app_info',
      entityName: '应用信息',
      primaryKey: 'id',
      defaultOrderBy: 'id DESC',
      searchableFields: ['app_store_name', 'app_code'],
      fieldMapping: {
        // 前端字段名 -> 数据库字段名
        appIcon: 'app_icon',
        appStoreName: 'app_store_name',
        appCode: 'app_code',
        createTime: 'create_time',
        updateTime: 'update_time'
      }
    });
  }

  /**
   * 验证应用信息数据
   */
  validateAppInfoData(data) {
    const errors = [];

    // 基本字段验证
    if (!data.appIcon || typeof data.appIcon !== 'string' || data.appIcon.trim().length === 0) {
      errors.push('应用图标URL不能为空');
    }

    if (!data.appStoreName || typeof data.appStoreName !== 'string' || data.appStoreName.trim().length === 0) {
      errors.push('应用商店名称不能为空');
    }

    // URL格式验证
    if (data.appIcon && !/^https?:\/\/.+/.test(data.appIcon)) {
      errors.push('应用图标URL格式不正确');
    }

    return errors;
  }

  /**
   * 保存应用信息
   */
  async saveAppInfo(data) {
    try {
      // 数据验证
      const validationErrors = this.validateAppInfoData(data);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: validationErrors.join('; ')
        };
      }

      const now = new Date();

      // 准备应用信息数据
      const appInfoData = this.convertToDbFields({
        appIcon: data.appIcon,
        appStoreName: data.appStoreName,
        appCode: data.appCode || null,
        createTime: now,
        updateTime: now
      });

      const insertSql = `
        INSERT INTO app_info (${Object.keys(appInfoData).join(', ')})
        VALUES (${Object.keys(appInfoData).map(() => '?').join(', ')})
      `;

      const insertResult = await this.query(insertSql, Object.values(appInfoData));
      const appInfoId = insertResult.insertId;

      return {
        success: true,
        id: appInfoId,
        message: '保存应用信息成功'
      };

    } catch (error) {
      this.logger.error('保存应用信息失败:', error);
      return {
        success: false,
        errCode: 'SAVE_ERROR',
        errMessage: error.message || '保存应用信息失败'
      };
    }
  }

  /**
   * 获取帮助列表（分页）
   */
  async getHelpsPage(params) {
    try {
      // 定义允许的查询参数
      const allowedFilters = ['keywords']; // 帮助列表只允许关键词搜索

      const paginationParams = this.processPaginationParams(params, allowedFilters);
      const { pageIndex, pageSize, orderBy, orderDirection, offset, ...filters } = paginationParams;

      // 构建查询条件
      const conditions = [];
      const queryParams = [];

      // 关键词搜索（搜索name字段）
      if (filters.keywords) {
        const keyword = filters.keywords.trim();
        if (keyword) {
          conditions.push('name LIKE ?');
          queryParams.push(`%${keyword}%`);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${orderBy || 'create_time'} ${orderDirection || 'DESC'}`;

      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM app_help ${whereClause}`;
      const countResult = await this.queryOne(countSql, queryParams);
      const totalCount = countResult.total;

      // 查询数据
      const dataSql = `
        SELECT * FROM app_help
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
      this.logger.error('获取帮助列表失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取帮助列表失败'
      };
    }
  }

  /**
   * 添加帮助信息
   */
  async addHelp(data) {
    try {
      // 数据验证
      const errors = [];
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('帮助名称不能为空');
      }
      if (!data.url || typeof data.url !== 'string' || data.url.trim().length === 0) {
        errors.push('帮助链接不能为空');
      }
      if (data.url && !/^https?:\/\/.+/.test(data.url)) {
        errors.push('帮助链接格式不正确');
      }

      if (errors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: errors.join('; ')
        };
      }

      const now = new Date();
      const helpData = {
        name: data.name,
        url: data.url,
        create_time: now,
      };

      const insertSql = `
        INSERT INTO app_help (${Object.keys(helpData).join(', ')})
        VALUES (${Object.keys(helpData).map(() => '?').join(', ')})
      `;

      const insertResult = await this.query(insertSql, Object.values(helpData));

      return {
        success: true,
        id: insertResult.insertId,
        message: '添加帮助信息成功'
      };

    } catch (error) {
      this.logger.error('添加帮助信息失败:', error);
      return {
        success: false,
        errCode: 'SAVE_ERROR',
        errMessage: error.message || '添加帮助信息失败'
      };
    }
  }

  /**
   * 获取变更日志列表（分页）
   */
  async getChangeLogsPage(params) {
    try {
      // 定义允许的查询参数
      const allowedFilters = ['keywords', 'version']; // 变更日志允许关键词和版本搜索

      const paginationParams = this.processPaginationParams(params, allowedFilters);
      const { pageIndex, pageSize, orderBy, orderDirection, offset, ...filters } = paginationParams;

      // 构建查询条件
      const conditions = [];
      const queryParams = [];

      // 关键词搜索（搜索version和new_info字段）
      if (filters.keywords) {
        const keyword = filters.keywords.trim();
        if (keyword) {
          conditions.push('(version LIKE ? OR new_info LIKE ?)');
          queryParams.push(`%${keyword}%`, `%${keyword}%`);
        }
      }

      // 版本筛选
      if (filters.version) {
        conditions.push('version = ?');
        queryParams.push(filters.version);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${orderBy || 'create_time'} ${orderDirection || 'DESC'}`;

      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM app_change_logs ${whereClause}`;
      const countResult = await this.queryOne(countSql, queryParams);
      const totalCount = countResult.total;

      // 查询数据
      const dataSql = `
        SELECT * FROM app_change_logs
        ${whereClause}
        ${orderClause}
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      const dataResult = await this.query(dataSql, queryParams);

      // 仅此接口：将日期相关字段格式化为 'YYYY-MM-DD'
      const formattedRows = Array.isArray(dataResult)
        ? dataResult.map(r => {
          const clone = { ...r };
          if (clone.create_time && typeof clone.create_time === 'string') {
            clone.create_time = clone.create_time.slice(0, 10);
          }
          if (clone.date && typeof clone.date === 'string') {
            clone.date = clone.date.slice(0, 10);
          }
          return clone;
        })
        : dataResult;

      return {
        success: true,
        data: this.convertToFrontendFields(formattedRows),
        totalCount,
        pageIndex,
        pageSize
      };

    } catch (error) {
      this.logger.error('获取变更日志列表失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取变更日志列表失败'
      };
    }
  }

  /**
   * 添加变更日志
   */
  async addChangeLog(data) {
    try {
      // 数据验证
      const errors = [];
      if (!data.version || typeof data.version !== 'string' || data.version.trim().length === 0) {
        errors.push('版本号不能为空');
      }
      if (!data.date || typeof data.date !== 'string' || data.date.trim().length === 0) {
        errors.push('变更日期不能为空');
      }
      if (!data.newInfo || typeof data.newInfo !== 'string' || data.newInfo.trim().length === 0) {
        errors.push('新功能信息不能为空');
      }

      if (errors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: errors.join('; ')
        };
      }

      const now = new Date();
      const changeLogData = {
        version: data.version,
        date: data.date,
        new_info: data.newInfo,
        create_time: now,
      };

      const insertSql = `
        INSERT INTO app_change_logs (${Object.keys(changeLogData).join(', ')})
        VALUES (${Object.keys(changeLogData).map(() => '?').join(', ')})
      `;

      const insertResult = await this.query(insertSql, Object.values(changeLogData));

      return {
        success: true,
        id: insertResult.insertId,
        message: '添加变更日志成功'
      };

    } catch (error) {
      this.logger.error('添加变更日志失败:', error);
      return {
        success: false,
        errCode: 'SAVE_ERROR',
        errMessage: error.message || '添加变更日志失败'
      };
    }
  }
}

module.exports = HomeService;
