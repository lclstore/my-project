/**
 * 训练服务类
 * 处理训练相关的业务逻辑
 */

const BaseService = require('../core/BaseService');

class WorkoutService extends BaseService {
  constructor() {
    super({
      tableName: 'workout',
      entityName: '训练',
      primaryKey: 'id',
      defaultOrderBy: 'id DESC',
      searchableFields: ['name'],
      fieldMapping: {
        // 前端字段名 -> 数据库字段名
        newStartTime: 'new_start_time',
        newEndTime: 'new_end_time',
        createTime: 'create_time',
        updateTime: 'update_time',
        isDeleted: 'is_deleted'
      }
    });
  }

  /**
   * 验证训练数据
   */
  validateWorkoutData(data, isDraft = false) {
    const errors = [];

    // 基本字段验证
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('训练名称不能为空');
    }

    if (!data.status || !['DRAFT', 'ENABLED', 'DISABLED'].includes(data.status)) {
      errors.push('状态必须是 DRAFT、ENABLED 或 DISABLED 之一');
    }

    // 非草稿状态需要更严格的验证
    if (!isDraft && data.status !== 'DRAFT') {
      if (data.premium !== undefined && ![0, 1].includes(data.premium)) {
        errors.push('premium 必须是 0 或 1');
      }

      // 时间格式验证
      if (data.newStartTime && !this.isValidDateTime(data.newStartTime)) {
        errors.push('NEW开始时间格式不正确');
      }

      if (data.newEndTime && !this.isValidDateTime(data.newEndTime)) {
        errors.push('NEW结束时间格式不正确');
      }

      // 时间逻辑验证
      if (data.newStartTime && data.newEndTime) {
        const startTime = new Date(data.newStartTime);
        const endTime = new Date(data.newEndTime);
        if (startTime >= endTime) {
          errors.push('NEW结束时间必须晚于开始时间');
        }
      }
    }

    return errors;
  }

  /**
   * 验证动作列表数据
   */
  validateExerciseList(exerciseList) {
    const errors = [];

    if (!Array.isArray(exerciseList)) {
      errors.push('动作列表必须是数组');
      return errors;
    }

    exerciseList.forEach((exercise, index) => {
      if (!exercise.exerciseId || !Number.isInteger(exercise.exerciseId)) {
        errors.push(`动作列表第${index + 1}项的exerciseId必须是整数`);
      }

      if (exercise.sort !== undefined && !Number.isInteger(exercise.sort)) {
        errors.push(`动作列表第${index + 1}项的sort必须是整数`);
      }

      if (exercise.reps !== undefined && !Number.isInteger(exercise.reps)) {
        errors.push(`动作列表第${index + 1}项的reps必须是整数`);
      }

      if (exercise.duration !== undefined && !Number.isInteger(exercise.duration)) {
        errors.push(`动作列表第${index + 1}项的duration必须是整数`);
      }
    });

    return errors;
  }

  /**
   * 检查名称是否重复
   */
  async checkNameExists(name, excludeId = null) {
    try {
      let sql = 'SELECT id FROM workout WHERE name = ? AND is_deleted = 0';
      const params = [name];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await this.queryOne(sql, params);
      return !!result;
    } catch (error) {
      this.logger.error('检查训练名称重复失败:', error);
      throw error;
    }
  }

  /**
   * 保存训练（新增或修改）
   */
  async save(data) {
    try {
      const isDraft = data.status === 'DRAFT';

      // 数据验证
      const validationErrors = this.validateWorkoutData(data, isDraft);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: validationErrors.join('; ')
        };
      }

      // 动作列表验证
      if (data.exerciseList) {
        const exerciseErrors = this.validateExerciseList(data.exerciseList);
        if (exerciseErrors.length > 0) {
          return {
            success: false,
            errCode: 'VALIDATION_ERROR',
            errMessage: exerciseErrors.join('; ')
          };
        }
      }

      // 检查名称重复
      const nameExists = await this.checkNameExists(data.name, data.id);
      if (nameExists) {
        return {
          success: false,
          errCode: 'NAME_EXISTS',
          errMessage: '训练名称已存在'
        };
      }

      const db = await this.getDatabase();

      return await db.transaction(async (connection) => {
        let workoutId;
        const now = new Date();

        // 准备训练基本数据
        const workoutData = this.convertToDbFields({
          name: data.name,
          description: data.description || null,
          premium: data.premium || 0,
          newStartTime: data.newStartTime || null,
          newEndTime: data.newEndTime || null,
          status: data.status,
          updateTime: now
        });

        if (data.id) {
          // 更新训练
          const updateSql = `
            UPDATE workout 
            SET ${Object.keys(workoutData).map(key => `${key} = ?`).join(', ')}
            WHERE id = ? AND is_deleted = 0
          `;
          const updateParams = [...Object.values(workoutData), data.id];

          const updateResult = await connection.query(updateSql, updateParams);
          if (updateResult.affectedRows === 0) {
            throw new Error('训练不存在或已被删除');
          }

          workoutId = data.id;
        } else {
          // 新增训练
          workoutData.create_time = now;
          workoutData.is_deleted = 0;

          const insertSql = `
            INSERT INTO workout (${Object.keys(workoutData).join(', ')})
            VALUES (${Object.keys(workoutData).map(() => '?').join(', ')})
          `;

          const insertResult = await connection.query(insertSql, Object.values(workoutData));
          workoutId = insertResult.insertId;
        }

        // 处理动作列表
        if (data.exerciseList && Array.isArray(data.exerciseList)) {
          // 删除原有的动作关联
          await connection.query(
            'DELETE FROM workout WHERE id = ?',
            [workoutId]
          );

          // 插入新的动作关联
          if (data.exerciseList.length > 0) {
            const exerciseInsertSql = `
              INSERT INTO workout_structure_exercise (id, exercise_id, sort, reps, duration, create_time)
              VALUES ?
            `;

            const exerciseValues = data.exerciseList.map((exercise, index) => [
              workoutId,
              exercise.exerciseId,
              exercise.sort || (index + 1),
              exercise.reps || 0,
              exercise.duration || 0,
              now
            ]);

            await connection.query(exerciseInsertSql, [exerciseValues]);
          }
        }

        return {
          success: true,
          id: workoutId,
          message: data.id ? '更新训练成功' : '创建训练成功'
        };
      });

    } catch (error) {
      this.logger.error('保存训练失败:', error);
      return {
        success: false,
        errCode: 'SAVE_ERROR',
        errMessage: error.message || '保存训练失败'
      };
    }
  }

  /**
   * 分页查询训练列表
   */
  async getPage(params) {
    try {
      // 定义允许的查询参数
      const allowedFilters = ['keywords', 'status', 'premium'];

      const paginationParams = this.processPaginationParams(params, allowedFilters);
      const { pageIndex, pageSize, orderBy, orderDirection, offset, ...filters } = paginationParams;

      // 构建查询条件
      const conditions = ['w.is_deleted = 0'];
      const queryParams = [];

      // 关键词搜索
      if (filters.keywords) {
        const keyword = filters.keywords.trim();
        if (keyword) {
          // 检查是否为纯数字（ID精确匹配）
          if (/^\d+$/.test(keyword)) {
            conditions.push('w.id = ?');
            queryParams.push(parseInt(keyword));
          } else {
            // 名称模糊搜索
            conditions.push('w.name LIKE ?');
            queryParams.push(`%${keyword}%`);
          }
        }
      }

      // 状态筛选
      if (filters.status) {
        const statusList = filters.status.split(',').map(s => s.trim()).filter(s => s);
        if (statusList.length > 0) {
          conditions.push(`w.status IN (${statusList.map(() => '?').join(', ')})`);
          queryParams.push(...statusList);
        }
      }

      // 订阅筛选
      if (filters.premium !== undefined && filters.premium !== '') {
        conditions.push('w.premium = ?');
        queryParams.push(parseInt(filters.premium));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY w.${orderBy || 'id'} ${orderDirection || 'DESC'}`;

      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM workout w ${whereClause}`;
      const countResult = await this.queryOne(countSql, queryParams);
      const totalCount = countResult.total;

      // 查询数据
      const dataSql = `
        SELECT w.*,
               (SELECT COUNT(*) FROM workout we WHERE we.id = w.id) as exercise_count
        FROM workout w
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
      this.logger.error('获取训练列表失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取训练列表失败'
      };
    }
  }

  /**
   * 获取训练详情
   */
  async getDetail(id) {
    try {
      // 获取训练基本信息
      const workoutSql = `
        SELECT * FROM workout
        WHERE id = ? AND is_deleted = 0
      `;

      const workout = await this.queryOne(workoutSql, [id]);
      if (!workout) {
        return {
          success: false,
          errCode: 'NOT_FOUND',
          errMessage: '训练不存在'
        };
      }

      // 获取关联的动作列表
      const exercisesSql = `
        SELECT we.*, e.name as exercise_name, e.cover_img_url
        FROM workout we
        LEFT JOIN exercise e ON we.exercise_id = e.id
        WHERE we.id = ?
        ORDER BY we.sort ASC
      `;

      const exercises = await this.query(exercisesSql, [id]);

      // 组装结果
      const result = this.convertToFrontendFields(workout);
      result.exerciseList = exercises.map(exercise => ({
        exerciseId: exercise.exercise_id,
        exerciseName: exercise.exercise_name,
        coverImgUrl: exercise.cover_img_url,
        sort: exercise.sort,
        reps: exercise.reps,
        duration: exercise.duration
      }));

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error('获取训练详情失败:', error);
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取训练详情失败'
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
        UPDATE workout
        SET status = ?, update_time = NOW()
        WHERE id IN (${ids.map(() => '?').join(', ')}) AND is_deleted = 0
      `;

      const result = await this.query(sql, [status, ...ids]);

      return {
        success: true,
        affectedRows: result.affectedRows
      };

    } catch (error) {
      this.logger.error('批量更新训练状态失败:', error);
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
        UPDATE workout
        SET is_deleted = 1, update_time = NOW()
        WHERE id IN (${ids.map(() => '?').join(', ')}) AND is_deleted = 0
      `;

      const result = await this.query(sql, ids);

      return {
        success: true,
        affectedRows: result.affectedRows
      };

    } catch (error) {
      this.logger.error('批量删除训练失败:', error);
      return {
        success: false,
        errCode: 'DELETE_ERROR',
        errMessage: '批量删除失败'
      };
    }
  }

  /**
   * 验证日期时间格式
   */
  isValidDateTime(dateTimeString) {
    if (!dateTimeString) return false;

    // 支持的格式：YYYY-MM-DD HH:mm:ss
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(dateTimeString)) {
      return false;
    }

    const date = new Date(dateTimeString);
    return date instanceof Date && !isNaN(date);
  }
}

module.exports = WorkoutService;
