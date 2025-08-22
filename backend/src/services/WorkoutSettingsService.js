const BaseService = require('../core/BaseService');

class WorkoutSettingsService extends BaseService {
  constructor() {
    super({
      tableName: 'workout_setting',
      primaryKey: 'id',

      defaultOrderBy: 'id DESC'
    });
  }

  /**
   * 验证训练设置数据
   */
  validateData(data) {
    const errors = [];

    // 这里可以添加具体的字段验证逻辑
    // 根据实际的表字段进行验证

    return errors;
  }

  /**
   * 获取训练设置详情（单例模式，只有一条记录）
   */
  async getDetail() {
    try {
      const sql = 'SELECT * FROM workout_setting ORDER BY id DESC LIMIT 1';
      const result = await this.query(sql);

      if (!result || result.length === 0) {
        // 如果没有记录，返回默认设置
        const defaultSettings = {};
        return {
          success: true,
          data: defaultSettings
        };
      }

      // 转换字段名
      const frontendData = this.convertToFrontendFields(result[0]);

      return {
        success: true,
        data: frontendData
      };
    } catch (error) {
      this.logger.error('获取训练设置详情失败:', { error: error.message });
      return {
        success: false,
        errCode: 'QUERY_ERROR',
        errMessage: '获取训练设置详情失败'
      };
    }
  }

  /**
   * 更新训练设置
   */
  async update(data) {
    try {
      // 验证数据
      const errors = this.validateData(data);
      if (errors.length > 0) {
        return {
          success: false,
          errCode: 'VALIDATION_ERROR',
          errMessage: errors.join(', ')
        };
      }

      // 检查是否已有记录
      const existingSql = 'SELECT id FROM workout_setting ORDER BY id DESC LIMIT 1';
      const existing = await this.query(existingSql);

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      if (existing && existing.length > 0) {
        // 更新现有记录
        const updateData = this.convertToDbFields({
          ...data,
          updateTime: now
        });

        // 动态构建更新 SQL
        const updateFields = Object.keys(updateData).filter(key => key !== 'id');
        const updateSql = `UPDATE workout_setting SET ${updateFields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`;
        const updateParams = [...updateFields.map(field => updateData[field]), existing[0].id];

        await this.query(updateSql, updateParams);

        return {
          success: true,
          data: { id: existing[0].id, ...this.convertToFrontendFields(updateData) }
        };
      } else {
        // 创建新记录
        const createData = this.convertToDbFields({
          ...data,
          createTime: now,
          updateTime: now
        });

        // 动态构建插入 SQL
        const insertFields = Object.keys(createData);
        const insertSql = `INSERT INTO workout_setting (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`;
        const insertParams = insertFields.map(field => createData[field]);

        const insertResult = await this.query(insertSql, insertParams);

        return {
          success: true,
          data: { id: insertResult.insertId, ...this.convertToFrontendFields(createData) }
        };
      }
    } catch (error) {
      this.logger.error('更新训练设置失败:', { error: error.message, data });
      return {
        success: false,
        errCode: 'UPDATE_ERROR',
        errMessage: '更新训练设置失败'
      };
    }
  }
}

module.exports = WorkoutSettingsService;
