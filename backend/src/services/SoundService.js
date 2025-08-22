/**
 * 音频资源服务类
 * 处理音频资源相关的业务逻辑
 */

const BaseService = require('../core/BaseService');

class SoundService extends BaseService {
  constructor() {
    super({
      tableName: 'sound',
      entityName: '音频资源',
      primaryKey: 'id',
      defaultOrderBy: 'id DESC',
      searchableFields: ['name'],
      fieldMapping: {
        // 前端字段名 -> 数据库字段名
        genderCode: 'gender_code',
        usageCode: 'usage_code',
        femaleAudioUrl: 'female_audio_url',
        femaleAudioDuration: 'female_audio_duration',
        maleAudioUrl: 'male_audio_url',
        maleAudioDuration: 'male_audio_duration',
        femaleScript: 'female_script',
        maleScript: 'male_script',
        createTime: 'create_time',
        updateTime: 'update_time',
        isDeleted: 'is_deleted'
      }
    });
  }

  /**
   * 验证音频资源数据
   */
  validateSoundData(data) {
    const errors = [];

    // 基本字段验证
    if (!data.name || data.name.trim() === '') {
      errors.push('音频名称不能为空');
    }

    if (!data.genderCode) {
      errors.push('性别代码不能为空');
    }

    if (!data.usageCode) {
      errors.push('用途代码不能为空');
    }

    if (data.translation === undefined || data.translation === null) {
      errors.push('翻译标识不能为空');
    }

    if (!data.status) {
      errors.push('状态不能为空');
    }

    // 枚举值验证
    const validGenders = ['FEMALE', 'MALE', 'FEMALE_AND_MALE'];
    if (data.genderCode && !validGenders.includes(data.genderCode)) {
      errors.push('性别代码无效');
    }

    const validUsages = ['FLOW', 'GENERAL'];
    if (data.usageCode && !validUsages.includes(data.usageCode)) {
      errors.push('用途代码无效');
    }

    const validStatuses = ['DRAFT', 'ENABLED', 'DISABLED'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('状态值无效');
    }

    const validTranslations = [0, 1];
    if (data.translation !== undefined && !validTranslations.includes(data.translation)) {
      errors.push('翻译标识无效');
    }

    // 根据性别代码验证音频文件
    if (data.genderCode === 'FEMALE' || data.genderCode === 'FEMALE_AND_MALE') {
      if (!data.femaleAudioUrl) {
        errors.push('Female音频文件地址不能为空');
      }
      if (!data.femaleAudioDuration && data.femaleAudioDuration !== 0) {
        errors.push('Female音频时长不能为空');
      }
    }

    if (data.genderCode === 'MALE' || data.genderCode === 'FEMALE_AND_MALE') {
      if (!data.maleAudioUrl) {
        errors.push('Male音频文件地址不能为空');
      }
      if (!data.maleAudioDuration && data.maleAudioDuration !== 0) {
        errors.push('Male音频时长不能为空');
      }
    }

    // 翻译脚本验证
    if (data.translation === 1) {
      if (data.genderCode === 'FEMALE' || data.genderCode === 'FEMALE_AND_MALE') {
        if (!data.femaleScript) {
          errors.push('Female翻译脚本不能为空');
        }
      }
      if (data.genderCode === 'MALE' || data.genderCode === 'FEMALE_AND_MALE') {
        if (!data.maleScript) {
          errors.push('Male翻译脚本不能为空');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查名称唯一性
   */
  async checkNameUniqueness(name, excludeId = null) {
    try {
      let sql = 'SELECT id FROM sound WHERE name = ? AND is_deleted = 0';
      let params = [name];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const existingRecords = await this.query(sql, params);

      if (existingRecords.length > 0) {
        return {
          isUnique: false,
          message: 'name已存在，请使用其他name'
        };
      }

      return { isUnique: true };
    } catch (error) {
      this.logger.error('检查名称唯一性失败:', { error: error.message, name });
      throw error;
    }
  }

  /**
   * 创建音频资源
   */
  async create(data) {
    try {
      // 数据验证
      const validation = this.validateSoundData(data);
      if (!validation.valid) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: validation.errors.join(', ')
        };
      }

      // 检查名称唯一性
      const uniquenessCheck = await this.checkNameUniqueness(data.name);
      if (!uniquenessCheck.isUnique) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: uniquenessCheck.message
        };
      }

      // 转换字段名并添加默认值
      const dbData = this.convertToDbFields(data);
      dbData.is_deleted = 0;
      dbData.create_time = new Date();
      dbData.update_time = new Date();

      const db = await this.getDatabase();
      const result = await db.insert(this.tableName, dbData);

      if (result.success) {
        return {
          success: true,
          insertId: result.insertId,
          message: '创建音频资源成功'
        };
      } else {
        return {
          success: false,
          errCode: 'CREATE_FAILED',
          errMessage: '创建音频资源失败'
        };
      }
    } catch (error) {
      this.logger.error('创建音频资源失败:', { error: error.message, data });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '创建音频资源失败'
      };
    }
  }

  /**
   * 更新音频资源
   */
  async update(id, data) {
    try {
      // 检查记录是否存在
      const existing = await this.getById(id);
      if (!existing.success) {
        return {
          success: false,
          errCode: 'RECORD_NOT_FOUND',
          errMessage: '音频资源不存在'
        };
      }

      // 数据验证
      const validation = this.validateSoundData(data);
      if (!validation.valid) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: validation.errors.join(', ')
        };
      }

      // 检查名称唯一性
      const uniquenessCheck = await this.checkNameUniqueness(data.name, id);
      if (!uniquenessCheck.isUnique) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: uniquenessCheck.message
        };
      }

      // 转换字段名
      const dbData = this.convertToDbFields(data);
      dbData.update_time = new Date();

      const db = await this.getDatabase();
      const result = await db.update(this.tableName, dbData, 'id = ? AND is_deleted = 0', [id]);

      if (result.success && result.affectedRows > 0) {
        return {
          success: true,
          message: '更新音频资源成功'
        };
      } else {
        return {
          success: false,
          errCode: 'UPDATE_FAILED',
          errMessage: '更新音频资源失败'
        };
      }
    } catch (error) {
      this.logger.error('更新音频资源失败:', { error: error.message, id, data });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '更新音频资源失败'
      };
    }
  }

  /**
   * 获取音频资源详情
   */
  async getById(id) {
    try {
      const sql = 'SELECT * FROM sound WHERE id = ? AND is_deleted = 0';
      const result = await this.queryOne(sql, [id]);

      if (!result) {
        return {
          success: false,
          errCode: 'RECORD_NOT_FOUND',
          errMessage: '音频资源不存在'
        };
      }

      // 转换字段名
      const frontendData = this.convertToFrontendFields(result);

      return {
        success: true,
        data: frontendData
      };
    } catch (error) {
      this.logger.error('获取音频资源详情失败:', { error: error.message, id });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '获取音频资源详情失败'
      };
    }
  }

  /**
   * 分页查询音频资源列表
   */
  async getList(query) {
    try {
      const {
        keywords,
        statusList,
        genderCodeList,
        usageCodeList,
        pageIndex = 1,
        pageSize = 10,
        orderBy = 'id',
        orderDirection = 'DESC'
      } = query;

      // 构建查询条件
      const conditions = ['is_deleted = 0'];
      const params = [];

      // 关键词搜索
      if (keywords && keywords.trim()) {
        const trimmedKeywords = keywords.trim();

        if (/^\d+$/.test(trimmedKeywords)) {
          // 纯数字，先尝试ID匹配
          const idCheckSql = 'SELECT COUNT(*) as count FROM sound WHERE id = ? AND is_deleted = 0';
          const idCheckResult = await this.queryOne(idCheckSql, [parseInt(trimmedKeywords)]);

          if (idCheckResult.count > 0) {
            conditions.push('id = ?');
            params.push(parseInt(trimmedKeywords));
          } else {
            // ID没有匹配结果，改为名称模糊搜索
            conditions.push('name LIKE ?');
            params.push(`%${trimmedKeywords}%`);
          }
        } else {
          // 非纯数字，按名称模糊搜索
          conditions.push('name LIKE ?');
          params.push(`%${trimmedKeywords}%`);
        }
      }

      // 状态筛选
      if (statusList && statusList.length > 0) {
        const statusArray = Array.isArray(statusList) ? statusList : statusList.split(',');
        conditions.push(`status IN (${statusArray.map(() => '?').join(',')})`);
        params.push(...statusArray);
      }

      // 性别筛选
      if (genderCodeList && genderCodeList.length > 0) {
        const genderArray = Array.isArray(genderCodeList) ? genderCodeList : genderCodeList.split(',');
        conditions.push(`gender_code IN (${genderArray.map(() => '?').join(',')})`);
        params.push(...genderArray);
      }

      // 用途筛选
      if (usageCodeList && usageCodeList.length > 0) {
        const usageArray = Array.isArray(usageCodeList) ? usageCodeList : usageCodeList.split(',');
        conditions.push(`usage_code IN (${usageArray.map(() => '?').join(',')})`);
        params.push(...usageArray);
      }

      // 构建排序
      const dbOrderBy = this.fieldMapping[orderBy] || orderBy;
      const validDirection = ['ASC', 'DESC'].includes(orderDirection.toUpperCase()) ? orderDirection.toUpperCase() : 'DESC';
      const orderClause = `${dbOrderBy} ${validDirection}`;

      // 分页查询
      const db = await this.getDatabase();
      const result = await db.paginate(this.tableName, {
        where: conditions.join(' AND '),
        whereParams: params,
        orderBy: orderClause,
        pageIndex: parseInt(pageIndex),
        pageSize: parseInt(pageSize),
        excludeFields: ['is_deleted']
      });

      if (result.success) {
        // 处理数据转换
        const processedData = result.data.map(item => {
          return this.convertToFrontendFields(item);
        });

        return {
          success: true,
          data: processedData,
          totalCount: result.totalCount,
          pageIndex: result.pageIndex,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          empty: result.empty,
          notEmpty: result.notEmpty,
          errCode: null,
          errMessage: null
        };
      } else {
        return {
          success: false,
          errCode: 'QUERY_FAILED',
          errMessage: '查询音频资源列表失败'
        };
      }
    } catch (error) {
      this.logger.error('查询音频资源列表失败:', { error: error.message, query });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '查询音频资源列表失败'
      };
    }
  }

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(ids, status) {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: 'IDs不能为空'
        };
      }

      const validIds = ids.filter(id => Number.isInteger(id) && id > 0);
      if (validIds.length === 0) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: 'IDs包含无效值'
        };
      }

      const sql = `UPDATE sound SET status = ?, update_time = NOW() WHERE id IN (${validIds.map(() => '?').join(',')}) AND is_deleted = 0`;
      const result = await this.query(sql, [status, ...validIds]);

      return {
        success: true,
        affectedRows: result.affectedRows,
        message: `批量更新状态成功，共更新${result.affectedRows}条记录`
      };
    } catch (error) {
      this.logger.error('批量更新状态失败:', { error: error.message, ids, status });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '批量更新状态失败'
      };
    }
  }

  /**
   * 批量删除（逻辑删除）
   */
  async batchDelete(ids) {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: 'IDs不能为空'
        };
      }

      const validIds = ids.filter(id => Number.isInteger(id) && id > 0);
      if (validIds.length === 0) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: 'IDs包含无效值'
        };
      }

      const sql = `UPDATE sound SET is_deleted = 1, update_time = NOW() WHERE id IN (${validIds.map(() => '?').join(',')}) AND is_deleted = 0`;
      const result = await this.query(sql, validIds);

      return {
        success: true,
        deletedCount: result.affectedRows,
        message: `批量删除成功，共删除${result.affectedRows}条记录`
      };
    } catch (error) {
      this.logger.error('批量删除失败:', { error: error.message, ids });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '批量删除失败'
      };
    }
  }
}

module.exports = SoundService;
