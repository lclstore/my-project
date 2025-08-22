/**
 * 训练计划服务类
 * 处理训练计划相关的业务逻辑
 */

const BaseService = require('../core/BaseService');

class ProgramService extends BaseService {
  constructor() {
    super({
      tableName: 'programs',
      entityName: '训练计划',
      primaryKey: 'id',
      defaultOrderBy: 'id DESC',
      searchableFields: ['name'],
      fieldMapping: {
        // 前端字段名 -> 数据库字段名
        coverImgUrl: 'cover_img_url',
        detailImgUrl: 'detail_img_url',
        showTypeCode: 'show_type_code',
        durationWeek: 'duration_week',
        createTime: 'create_time',
        updateTime: 'update_time',
        isDeleted: 'is_deleted'
      }
    });
  }

  /**
   * 验证训练计划数据
   */
  validateProgramData(data, isDraft = false) {
    const errors = [];

    // 基本字段验证
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('训练计划名称不能为空');
    }

    if (!data.status || !['DRAFT', 'ENABLED', 'DISABLED'].includes(data.status)) {
      errors.push('状态必须是 DRAFT、ENABLED 或 DISABLED 之一');
    }

    // 非草稿状态需要更严格的验证
    if (!isDraft && data.status !== 'DRAFT') {
      if (data.showTypeCode && !['HORIZONTAL', 'CARD'].includes(data.showTypeCode)) {
        errors.push('展示类型必须是 HORIZONTAL 或 CARD');
      }

      if (data.durationWeek !== undefined && (!Number.isInteger(data.durationWeek) || data.durationWeek <= 0)) {
        errors.push('持续周数必须是正整数');
      }
    }

    return errors;
  }

  /**
   * 验证训练列表数据
   */
  validateWorkoutList(workoutList) {
    const errors = [];

    if (!Array.isArray(workoutList)) {
      errors.push('训练列表必须是数组');
      return errors;
    }

    workoutList.forEach((workout, index) => {
      if (!workout.workoutId || !Number.isInteger(workout.workoutId)) {
        errors.push(`训练列表第${index + 1}项的workoutId必须是整数`);
      }

      if (workout.sort !== undefined && !Number.isInteger(workout.sort)) {
        errors.push(`训练列表第${index + 1}项的sort必须是整数`);
      }

      if (workout.week !== undefined && !Number.isInteger(workout.week)) {
        errors.push(`训练列表第${index + 1}项的week必须是整数`);
      }

      if (workout.day !== undefined && !Number.isInteger(workout.day)) {
        errors.push(`训练列表第${index + 1}项的day必须是整数`);
      }
    });

    return errors;
  }

  /**
   * 检查名称是否重复
   */
  async checkNameExists(name, excludeId = null) {
    try {
      let sql = 'SELECT id FROM programs WHERE name = ? AND is_deleted = 0';
      const params = [name];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await this.queryOne(sql, params);
      return !!result;
    } catch (error) {
      this.logger.error('检查训练计划名称重复失败:', error);
      throw error;
    }
  }

  /**
   * 保存训练计划（新增或修改）
   */
  async save(data) {
    try {
      const isDraft = data.status === 'DRAFT';

      // 数据验证
      const validationErrors = this.validateProgramData(data, isDraft);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: validationErrors.join('; ')
        };
      }

      // 训练列表验证
      if (data.workoutList) {
        const workoutErrors = this.validateWorkoutList(data.workoutList);
        if (workoutErrors.length > 0) {
          return {
            success: false,
            errCode: 'VALIDATION_ERROR',
            errMessage: workoutErrors.join('; ')
          };
        }
      }

      // 检查名称重复
      const nameExists = await this.checkNameExists(data.name, data.id);
      if (nameExists) {
        return {
          success: false,
          errCode: 'NAME_EXISTS',
          errMessage: '训练计划名称已存在'
        };
      }

      const db = await this.getDatabase();

      return await db.transaction(async (connection) => {
        let programId;
        const now = new Date();

        // 准备训练计划基本数据
        const programData = this.convertToDbFields({
          name: data.name,
          description: data.description || null,
          coverImgUrl: data.coverImgUrl || null,
          detailImgUrl: data.detailImgUrl || null,
          showTypeCode: data.showTypeCode || null,
          durationWeek: data.durationWeek || null,
          status: data.status,
          updateTime: now
        });

        if (data.id) {
          // 更新训练计划
          const updateSql = `
            UPDATE programs 
            SET ${Object.keys(programData).map(key => `${key} = ?`).join(', ')}
            WHERE id = ? AND is_deleted = 0
          `;
          const updateParams = [...Object.values(programData), data.id];

          const updateResult = await connection.query(updateSql, updateParams);
          if (updateResult.affectedRows === 0) {
            throw new Error('训练计划不存在或已被删除');
          }

          programId = data.id;
        } else {
          // 新增训练计划
          programData.create_time = now;
          programData.is_deleted = 0;

          const insertSql = `
            INSERT INTO programs (${Object.keys(programData).join(', ')})
            VALUES (${Object.keys(programData).map(() => '?').join(', ')})
          `;

          const insertResult = await connection.query(insertSql, Object.values(programData));
          programId = insertResult.insertId;
        }

        // 处理训练列表
        if (data.workoutList && Array.isArray(data.workoutList)) {
          // 删除原有的训练关联
          await connection.query(
            'DELETE FROM program_workout WHERE program_id = ?',
            [programId]
          );

          // 插入新的训练关联
          if (data.workoutList.length > 0) {
            const workoutInsertSql = `
              INSERT INTO program_workout (program_id, workout_id, sort, week, day, create_time)
              VALUES ?
            `;

            const workoutValues = data.workoutList.map((workout, index) => [
              programId,
              workout.workoutId,
              workout.sort || (index + 1),
              workout.week || 1,
              workout.day || (index + 1),
              now
            ]);

            await connection.query(workoutInsertSql, [workoutValues]);
          }
        }

        return {
          success: true,
          id: programId,
          message: data.id ? '更新训练计划成功' : '创建训练计划成功'
        };
      });

    } catch (error) {
      this.logger.error('保存训练计划失败:', error);
      return {
        success: false,
        errCode: 'SAVE_ERROR',
        errMessage: error.message || '保存训练计划失败'
      };
    }
  }

  /**
   * 分页查询训练计划列表
   */
  async getPage(params) {
    try {
      const {
        pageIndex = 1,
        pageSize = 10,
        keywords,
        status,
        showTypeCode,
        orderBy = 'id',
        orderDirection = 'DESC'
      } = params;

      // 构建查询条件
      const conditions = ['p.is_deleted = 0'];
      const queryParams = [];

      // 关键词搜索
      if (keywords && keywords.trim()) {
        const keyword = keywords.trim();
        // 检查是否为纯数字（ID精确匹配）
        if (/^\d+$/.test(keyword)) {
          conditions.push('p.id = ?');
          queryParams.push(parseInt(keyword));
        } else {
          // 名称模糊搜索
          conditions.push('p.name LIKE ?');
          queryParams.push(`%${keyword}%`);
        }
      }

      // 状态筛选
      if (status) {
        const statusList = status.split(',').map(s => s.trim()).filter(s => s);
        if (statusList.length > 0) {
          conditions.push(`p.status IN (${statusList.map(() => '?').join(', ')})`);
          queryParams.push(...statusList);
        }
      }

      // 展示类型筛选
      if (showTypeCode) {
        conditions.push('p.show_type_code = ?');
        queryParams.push(showTypeCode);
      }

      // 构建查询SQL
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY p.${orderBy} ${orderDirection}`;

      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total
        FROM programs p
        ${whereClause}
      `;

      const countResult = await this.queryOne(countSql, queryParams);
      const totalCount = countResult.total;

      // 查询数据
      const offset = (pageIndex - 1) * pageSize;
      const dataSql = `
        SELECT p.*, 
               (SELECT COUNT(*) FROM program_workout pw WHERE pw.program_id = p.id) as workout_count
        FROM programs p
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
      this.logger.error('获取训练计划列表失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取训练计划列表失败'
      };
    }
  }

  /**
   * 获取训练计划详情
   */
  async getDetail(id) {
    try {
      // 获取训练计划基本信息
      const programSql = `
        SELECT * FROM programs
        WHERE id = ? AND is_deleted = 0
      `;

      const program = await this.queryOne(programSql, [id]);
      if (!program) {
        return {
          success: false,
          errCode: 'NOT_FOUND',
          errMessage: '训练计划不存在'
        };
      }

      // 获取关联的训练列表
      const workoutsSql = `
        SELECT pw.*, w.name as workout_name, w.description as workout_description
        FROM program_workout pw
        LEFT JOIN workout w ON pw.workout_id = w.id
        WHERE pw.program_id = ?
        ORDER BY pw.sort ASC
      `;

      const workouts = await this.query(workoutsSql, [id]);

      // 组装结果
      const result = this.convertToFrontendFields(program);
      result.workoutList = workouts.map(workout => ({
        workoutId: workout.workout_id,
        workoutName: workout.workout_name,
        workoutDescription: workout.workout_description,
        sort: workout.sort,
        week: workout.week,
        day: workout.day
      }));

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error('获取训练计划详情失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取训练计划详情失败'
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
        UPDATE programs
        SET status = ?, update_time = NOW()
        WHERE id IN (${ids.map(() => '?').join(', ')}) AND is_deleted = 0
      `;

      const result = await this.query(sql, [status, ...ids]);

      return {
        success: true,
        affectedRows: result.affectedRows
      };

    } catch (error) {
      this.logger.error('批量更新训练计划状态失败:', error);
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
        UPDATE programs
        SET is_deleted = 1, update_time = NOW()
        WHERE id IN (${ids.map(() => '?').join(', ')}) AND is_deleted = 0
      `;

      const result = await this.query(sql, ids);

      return {
        success: true,
        affectedRows: result.affectedRows
      };

    } catch (error) {
      this.logger.error('批量删除训练计划失败:', error);
      return {
        success: false,
        errCode: 'DELETE_ERROR',
        errMessage: '批量删除失败'
      };
    }
  }
}

module.exports = ProgramService;
