/**
 * 动作资源服务类
 * 处理动作资源相关的业务逻辑
 */

const BaseService = require('../core/BaseService');

class ExerciseService extends BaseService {
  constructor() {
    super({
      tableName: 'exercise',
      entityName: '动作资源',
      primaryKey: 'id',
      defaultOrderBy: 'id DESC',
      searchableFields: ['name'],
      fieldMapping: {
        // 前端字段名 -> 数据库字段名
        coverImgUrl: 'cover_img_url',
        structureTypeCode: 'structure_type_code',
        genderCode: 'gender_code',
        difficultyCode: 'difficulty_code',
        equipmentCode: 'equipment_code',
        positionCode: 'position_code',
        injuredCodes: 'injured_codes',
        nameAudioUrl: 'name_audio_url',
        nameAudioUrlDuration: 'name_audio_url_duration',
        howtodoScript: 'howtodo_script',
        howtodoAudioUrl: 'howtodo_audio_url',
        howtodoAudioUrlDuration: 'howtodo_audio_url_duration',
        guidanceScript: 'guidance_script',
        guidanceAudioUrl: 'guidance_audio_url',
        guidanceAudioUrlDuration: 'guidance_audio_url_duration',
        frontVideoUrl: 'front_video_url',
        frontVideoUrlDuration: 'front_video_url_duration',
        sideVideoUrl: 'side_video_url',
        sideVideoUrlDuration: 'side_video_url_duration',
        createTime: 'create_time',
        updateTime: 'update_time',
        isDeleted: 'is_deleted'
      }
    });
  }

  /**
   * 验证动作资源数据
   */
  validateExerciseData(data, isDraft = false) {
    const errors = [];

    // 基本字段验证
    if (!data.name || data.name.trim() === '') {
      errors.push('动作名称不能为空');
    }

    if (!data.status) {
      errors.push('状态不能为空');
    }

    // 如果不是草稿状态，需要验证完整字段
    if (!isDraft && data.status !== 'DRAFT') {
      const requiredFields = [
        'coverImgUrl', 'met', 'structureTypeCode', 'genderCode',
        'difficultyCode', 'equipmentCode', 'positionCode',
        'nameAudioUrl', 'nameAudioUrlDuration', 'howtodoScript',
        'howtodoAudioUrl', 'howtodoAudioUrlDuration',
        'guidanceAudioUrl', 'guidanceAudioUrlDuration',
        'frontVideoUrl', 'frontVideoUrlDuration',
        'sideVideoUrl', 'sideVideoUrlDuration'
      ];

      for (const field of requiredFields) {
        if (!data[field] && data[field] !== 0) {
          errors.push(`${field}为必填项`);
        }
      }
    }

    // 枚举值验证
    const validStatuses = ['DRAFT', 'ENABLED', 'DISABLED'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('状态值无效');
    }

    const validStructureTypes = ['WARM_UP', 'MAIN', 'COOL_DOWN'];
    if (data.structureTypeCode && !validStructureTypes.includes(data.structureTypeCode)) {
      errors.push('结构类型无效');
    }

    const validGenders = ['FEMALE', 'MALE'];
    if (data.genderCode && !validGenders.includes(data.genderCode)) {
      errors.push('性别代码无效');
    }

    const validDifficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    if (data.difficultyCode && !validDifficulties.includes(data.difficultyCode)) {
      errors.push('难度等级无效');
    }

    const validEquipments = ['NO_EQUIPMENT', 'CHAIR'];
    if (data.equipmentCode && !validEquipments.includes(data.equipmentCode)) {
      errors.push('器械代码无效');
    }

    const validPositions = ['STANDING', 'SEATED'];
    if (data.positionCode && !validPositions.includes(data.positionCode)) {
      errors.push('姿势代码无效');
    }

    const validInjuredTypes = ['SHOULDER', 'BACK', 'WRIST', 'KNEE', 'ANKLE', 'HIP', 'NONE'];
    if (data.injuredCodes && Array.isArray(data.injuredCodes)) {
      for (const code of data.injuredCodes) {
        if (!validInjuredTypes.includes(code)) {
          errors.push(`受伤类型代码 ${code} 无效`);
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
  async checkNameUniqueness(name, genderCode, excludeId = null) {
    try {
      let sql = 'SELECT id, name, gender_code FROM exercise WHERE name = ? AND is_deleted = 0';
      let params = [name];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const existingRecords = await this.query(sql, params);

      if (genderCode) {
        // 检查同名同性别的记录
        const sameGenderRecords = existingRecords.filter(record => record.gender_code === genderCode);
        if (sameGenderRecords.length > 0) {
          return {
            isUnique: false,
            message: 'name和性别组合已存在，请使用其他name或性别'
          };
        }

        // 检查同名无性别的记录（草稿）
        const draftRecords = existingRecords.filter(record => record.gender_code === null);
        if (draftRecords.length > 0) {
          return {
            isUnique: false,
            message: 'name和性别组合已存在，请使用其他name或性别'
          };
        }
      } else {
        // 如果当前记录没有性别信息（草稿状态），检查是否有任何同名记录
        if (existingRecords.length > 0) {
          return {
            isUnique: false,
            message: 'name已存在，请使用其他name'
          };
        }
      }

      return { isUnique: true };
    } catch (error) {
      this.logger.error('检查名称唯一性失败:', { error: error.message, name, genderCode });
      throw error;
    }
  }

  /**
   * 创建动作资源
   */
  async create(data) {
    try {
      // 数据验证
      const isDraft = data.status === 'DRAFT';
      const validation = this.validateExerciseData(data, isDraft);
      if (!validation.valid) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: validation.errors.join(', ')
        };
      }

      // 检查名称唯一性
      const uniquenessCheck = await this.checkNameUniqueness(data.name, data.genderCode);
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

      // 处理数组字段 - MySQL JSON 字段可以直接存储数组
      if (dbData.injured_codes && Array.isArray(dbData.injured_codes)) {
        // MySQL JSON 字段可以直接存储数组，无需序列化
        // dbData.injured_codes = JSON.stringify(dbData.injured_codes);
      }

      const db = await this.getDatabase();
      const result = await db.insert(this.tableName, dbData);

      if (result.success) {
        return {
          success: true,
          insertId: result.insertId,
          message: '创建动作资源成功'
        };
      } else {
        return {
          success: false,
          errCode: 'CREATE_FAILED',
          errMessage: '创建动作资源失败'
        };
      }
    } catch (error) {
      this.logger.error('创建动作资源失败:', { error: error.message, data });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '创建动作资源失败'
      };
    }
  }

  /**
   * 更新动作资源
   */
  async update(id, data) {
    try {
      // 检查记录是否存在
      const existing = await this.getById(id);
      if (!existing.success) {
        return {
          success: false,
          errCode: 'RECORD_NOT_FOUND',
          errMessage: '动作资源不存在'
        };
      }

      // 数据验证
      const isDraft = data.status === 'DRAFT';
      const validation = this.validateExerciseData(data, isDraft);
      if (!validation.valid) {
        return {
          success: false,
          errCode: 'INVALID_PARAMETERS',
          errMessage: validation.errors.join(', ')
        };
      }

      // 检查名称唯一性
      const uniquenessCheck = await this.checkNameUniqueness(data.name, data.genderCode, id);
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

      // 处理数组字段 - MySQL JSON 字段可以直接存储数组
      if (dbData.injured_codes && Array.isArray(dbData.injured_codes)) {
        // MySQL JSON 字段可以直接存储数组，无需序列化
        // dbData.injured_codes = JSON.stringify(dbData.injured_codes);
      }

      const db = await this.getDatabase();
      const result = await db.update(this.tableName, dbData, 'id = ? AND is_deleted = 0', [id]);

      if (result.success && result.affectedRows > 0) {
        return {
          success: true,
          message: '更新动作资源成功'
        };
      } else {
        return {
          success: false,
          errCode: 'UPDATE_FAILED',
          errMessage: '更新动作资源失败'
        };
      }
    } catch (error) {
      this.logger.error('更新动作资源失败:', { error: error.message, id, data });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '更新动作资源失败'
      };
    }
  }

  /**
   * 获取动作资源详情
   */
  async getById(id) {
    try {
      const sql = 'SELECT * FROM exercise WHERE id = ? AND is_deleted = 0';
      const result = await this.queryOne(sql, [id]);

      if (!result) {
        return {
          success: false,
          errCode: 'RECORD_NOT_FOUND',
          errMessage: '动作资源不存在'
        };
      }

      // 先转换字段名
      const frontendData = this.convertToFrontendFields(result);

      // 再处理数组字段（注意这里要用转换后的字段名 injuredCodes）
      if (frontendData.injuredCodes !== null && frontendData.injuredCodes !== undefined) {
        // 如果已经是数组，直接使用；如果是字符串，则解析
        if (Array.isArray(frontendData.injuredCodes)) {
          // 已经是数组，无需处理
        } else if (typeof frontendData.injuredCodes === 'string') {
          try {
            frontendData.injuredCodes = JSON.parse(frontendData.injuredCodes);
          } catch (e) {
            frontendData.injuredCodes = [];
          }
        } else {
          frontendData.injuredCodes = [];
        }
      } else {
        // 如果是 null 或 undefined，设置为空数组
        frontendData.injuredCodes = [];
      }

      return {
        success: true,
        data: frontendData
      };
    } catch (error) {
      this.logger.error('获取动作资源详情失败:', { error: error.message, id });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '获取动作资源详情失败'
      };
    }
  }

  /**
   * 分页查询动作资源列表
   */
  async getList(query) {
    try {
      const {
        keywords,
        statusList,
        structureTypeCodeList,
        genderCodeList,
        difficultyCodeList,
        equipmentCodeList,
        positionCodeList,
        injuredCodeList,
        pageIndex = 1,
        pageSize = 10,
        orderBy = 'id',
        orderDirection = 'DESC'
      } = query;

      // 构建查询条件
      const conditions = ['is_deleted = 0'];
      const params = [];

      // 关键词搜索（智能搜索：纯数字先ID匹配，无结果则名称搜索）
      if (keywords && keywords.trim()) {
        const trimmedKeywords = keywords.trim();

        if (/^\d+$/.test(trimmedKeywords)) {
          // 纯数字，先尝试ID匹配
          const idCheckSql = 'SELECT COUNT(*) as count FROM exercise WHERE id = ? AND is_deleted = 0';
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

      // 结构类型筛选
      if (structureTypeCodeList && structureTypeCodeList.length > 0) {
        const typeArray = Array.isArray(structureTypeCodeList) ? structureTypeCodeList : structureTypeCodeList.split(',');
        conditions.push(`structure_type_code IN (${typeArray.map(() => '?').join(',')})`);
        params.push(...typeArray);
      }

      // 性别筛选
      if (genderCodeList && genderCodeList.length > 0) {
        const genderArray = Array.isArray(genderCodeList) ? genderCodeList : genderCodeList.split(',');
        conditions.push(`gender_code IN (${genderArray.map(() => '?').join(',')})`);
        params.push(...genderArray);
      }

      // 难度筛选
      if (difficultyCodeList && difficultyCodeList.length > 0) {
        const difficultyArray = Array.isArray(difficultyCodeList) ? difficultyCodeList : difficultyCodeList.split(',');
        conditions.push(`difficulty_code IN (${difficultyArray.map(() => '?').join(',')})`);
        params.push(...difficultyArray);
      }

      // 器械筛选
      if (equipmentCodeList && equipmentCodeList.length > 0) {
        const equipmentArray = Array.isArray(equipmentCodeList) ? equipmentCodeList : equipmentCodeList.split(',');
        conditions.push(`equipment_code IN (${equipmentArray.map(() => '?').join(',')})`);
        params.push(...equipmentArray);
      }

      // 姿势筛选
      if (positionCodeList && positionCodeList.length > 0) {
        const positionArray = Array.isArray(positionCodeList) ? positionCodeList : positionCodeList.split(',');
        conditions.push(`position_code IN (${positionArray.map(() => '?').join(',')})`);
        params.push(...positionArray);
      }

      // 受伤类型筛选 - 使用 JSON 函数查询数组字段
      if (injuredCodeList && injuredCodeList.length > 0) {
        const injuredArray = Array.isArray(injuredCodeList) ? injuredCodeList : injuredCodeList.split(',');
        const injuredConditions = injuredArray.map(() => 'JSON_CONTAINS(injured_codes, ?)').join(' OR ');
        conditions.push(`(${injuredConditions})`);
        // JSON_CONTAINS 需要 JSON 格式的参数
        params.push(...injuredArray.map(code => JSON.stringify(code)));
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
          // 先转换字段名
          const convertedItem = this.convertToFrontendFields(item);

          // 再处理数组字段（注意这里要用转换后的字段名 injuredCodes）
          if (convertedItem.injuredCodes !== null && convertedItem.injuredCodes !== undefined) {
            // 如果已经是数组，直接使用；如果是字符串，则解析
            if (Array.isArray(convertedItem.injuredCodes)) {
              // 已经是数组，无需处理
            } else if (typeof convertedItem.injuredCodes === 'string') {
              try {
                convertedItem.injuredCodes = JSON.parse(convertedItem.injuredCodes);
              } catch (e) {
                convertedItem.injuredCodes = [];
              }
            } else {
              convertedItem.injuredCodes = [];
            }
          } else {
            // 如果是 null 或 undefined，设置为空数组
            convertedItem.injuredCodes = [];
          }

          return convertedItem;
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
          errMessage: '查询动作资源列表失败'
        };
      }
    } catch (error) {
      this.logger.error('查询动作资源列表失败:', { error: error.message, query });
      return {
        success: false,
        errCode: 'INTERNAL_ERROR',
        errMessage: '查询动作资源列表失败'
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

      const sql = `UPDATE exercise SET status = ?, update_time = NOW() WHERE id IN (${validIds.map(() => '?').join(',')}) AND is_deleted = 0`;
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

      const sql = `UPDATE exercise SET is_deleted = 1, update_time = NOW() WHERE id IN (${validIds.map(() => '?').join(',')}) AND is_deleted = 0`;
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

module.exports = ExerciseService;
