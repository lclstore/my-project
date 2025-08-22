/**
 * 音乐服务类
 * 处理音乐相关的业务逻辑
 */

const BaseService = require('../core/BaseService');

class MusicService extends BaseService {
  constructor() {
    super({
      tableName: 'music',
      entityName: '音乐',
      primaryKey: 'id',
      defaultOrderBy: 'id DESC',
      searchableFields: ['name', 'display_name'],
      fieldMapping: {
        // 前端字段名 -> 数据库字段名
        displayName: 'display_name',
        audioUrl: 'audio_url',
        audioDuration: 'audio_duration',
        createTime: 'create_time',
        updateTime: 'update_time',
        isDeleted: 'is_deleted'
      }
    });
  }

  /**
   * 验证音乐数据
   */
  validateMusicData(data, isDraft = false) {
    const errors = [];

    // 基本字段验证
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('音乐名称不能为空');
    }

    if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.trim().length === 0) {
      errors.push('显示名称不能为空');
    }

    if (!data.status || !['DRAFT', 'ENABLED', 'DISABLED'].includes(data.status)) {
      errors.push('状态必须是 DRAFT、ENABLED 或 DISABLED 之一');
    }

    // 非草稿状态需要更严格的验证
    if (!isDraft && data.status !== 'DRAFT') {
      if (data.audioDuration !== undefined && (!Number.isInteger(data.audioDuration) || data.audioDuration <= 0)) {
        errors.push('音频时长必须是正整数');
      }
    }

    return errors;
  }

  /**
   * 检查名称是否重复
   */
  async checkNameExists(name, excludeId = null) {
    try {
      let sql = 'SELECT id FROM music WHERE name = ? AND is_deleted = 0';
      const params = [name];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await this.queryOne(sql, params);
      return !!result;
    } catch (error) {
      this.logger.error('检查音乐名称重复失败:', error);
      throw error;
    }
  }

  /**
   * 保存音乐（新增或修改）
   */
  async save(data) {
    try {
      const isDraft = data.status === 'DRAFT';

      // 数据验证
      const validationErrors = this.validateMusicData(data, isDraft);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: validationErrors.join('; ')
        };
      }

      // 检查名称重复
      const nameExists = await this.checkNameExists(data.name, data.id);
      if (nameExists) {
        return {
          success: false,
          errCode: 'NAME_EXISTS',
          errMessage: '音乐名称已存在'
        };
      }

      const now = new Date();

      // 准备音乐数据
      const musicData = this.convertToDbFields({
        name: data.name,
        displayName: data.displayName,
        audioUrl: data.audioUrl || null,
        audioDuration: data.audioDuration || 0,
        status: data.status,
        updateTime: now
      });

      let musicId;

      if (data.id) {
        // 更新音乐
        const updateSql = `
          UPDATE music 
          SET ${Object.keys(musicData).map(key => `${key} = ?`).join(', ')}
          WHERE id = ? AND is_deleted = 0
        `;
        const updateParams = [...Object.values(musicData), data.id];

        const updateResult = await this.query(updateSql, updateParams);
        if (updateResult.affectedRows === 0) {
          return {
            success: false,
            errCode: 'NOT_FOUND',
            errMessage: '音乐不存在或已被删除'
          };
        }

        musicId = data.id;
      } else {
        // 新增音乐
        musicData.create_time = now;
        musicData.is_deleted = 0;

        const insertSql = `
          INSERT INTO music (${Object.keys(musicData).join(', ')})
          VALUES (${Object.keys(musicData).map(() => '?').join(', ')})
        `;

        const insertResult = await this.query(insertSql, Object.values(musicData));
        musicId = insertResult.insertId;
      }

      return {
        success: true,
        id: musicId,
        message: data.id ? '更新音乐成功' : '创建音乐成功'
      };

    } catch (error) {
      this.logger.error('保存音乐失败:', error);
      return {
        success: false,
        errCode: 'SAVE_ERROR',
        errMessage: error.message || '保存音乐失败'
      };
    }
  }

  /**
   * 分页查询音乐列表
   */
  async getPage(params) {
    try {
      const {
        pageIndex = 1,
        pageSize = 10,
        keywords,
        status,
        orderBy = 'id',
        orderDirection = 'DESC'
      } = params;

      // 构建查询条件
      const conditions = ['is_deleted = 0'];
      const queryParams = [];

      // 关键词搜索
      if (keywords && keywords.trim()) {
        const keyword = keywords.trim();
        // 检查是否为纯数字（ID精确匹配）
        if (/^\d+$/.test(keyword)) {
          conditions.push('id = ?');
          queryParams.push(parseInt(keyword));
        } else {
          // 名称模糊搜索
          conditions.push('(name LIKE ? OR display_name LIKE ?)');
          queryParams.push(`%${keyword}%`, `%${keyword}%`);
        }
      }

      // 状态筛选
      if (status) {
        const statusList = status.split(',').map(s => s.trim()).filter(s => s);
        if (statusList.length > 0) {
          conditions.push(`status IN (${statusList.map(() => '?').join(', ')})`);
          queryParams.push(...statusList);
        }
      }

      // 构建查询SQL
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${orderBy} ${orderDirection}`;

      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total
        FROM music
        ${whereClause}
      `;

      const countResult = await this.queryOne(countSql, queryParams);
      const totalCount = countResult.total;

      // 查询数据
      const offset = (pageIndex - 1) * pageSize;
      const dataSql = `
        SELECT *
        FROM music
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `;

      const dataResult = await this.query(dataSql, [...queryParams, pageSize, offset]);

      return {
        success: true,
        data: this.convertToFrontendFields(dataResult),
        totalCount,
        pageIndex: parseInt(pageIndex),
        pageSize: parseInt(pageSize)
      };

    } catch (error) {
      this.logger.error('获取音乐列表失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取音乐列表失败'
      };
    }
  }

  /**
   * 获取音乐详情
   */
  async getDetail(id) {
    try {
      const sql = 'SELECT * FROM music WHERE id = ? AND is_deleted = 0';
      const result = await this.queryOne(sql, [id]);

      if (!result) {
        return {
          success: false,
          errCode: 'NOT_FOUND',
          errMessage: '音乐不存在'
        };
      }

      return {
        success: true,
        data: this.convertToFrontendFields(result)
      };

    } catch (error) {
      this.logger.error('获取音乐详情失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取音乐详情失败'
      };
    }
  }

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(ids, status) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          errCode: 'INVALID_PARAMS',
          errMessage: 'ID列表不能为空'
        };
      }

      if (!['DRAFT', 'ENABLED', 'DISABLED'].includes(status)) {
        return {
          success: false,
          errCode: 'INVALID_PARAMS',
          errMessage: '状态值无效'
        };
      }

      const sql = `
        UPDATE music 
        SET status = ?, update_time = NOW()
        WHERE id IN (${ids.map(() => '?').join(', ')}) AND is_deleted = 0
      `;

      const result = await this.query(sql, [status, ...ids]);

      return {
        success: true,
        affectedRows: result.affectedRows
      };

    } catch (error) {
      this.logger.error('批量更新音乐状态失败:', error);
      return {
        success: false,
        errCode: 'UPDATE_ERROR',
        errMessage: '批量更新状态失败'
      };
    }
  }

  /**
   * 批量删除（逻辑删除）
   */
  async batchDelete(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          errCode: 'INVALID_PARAMS',
          errMessage: 'ID列表不能为空'
        };
      }

      const sql = `
        UPDATE music 
        SET is_deleted = 1, update_time = NOW()
        WHERE id IN (${ids.map(() => '?').join(', ')}) AND is_deleted = 0
      `;

      const result = await this.query(sql, ids);

      return {
        success: true,
        affectedRows: result.affectedRows
      };

    } catch (error) {
      this.logger.error('批量删除音乐失败:', error);
      return {
        success: false,
        errCode: 'DELETE_ERROR',
        errMessage: '批量删除失败'
      };
    }
  }
}

module.exports = MusicService;
