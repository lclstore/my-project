const WorkoutSettingsService = require('../services/WorkoutSettingsService');

class WorkoutSettingsController {
  constructor() {
    this.workoutSettingsService = new WorkoutSettingsService();
  }

  /**
   * 获取训练设置详情
   */
  async detail(req, res) {
    try {
      const result = await this.workoutSettingsService.getDetail();

      if (result.success) {
        return res.success(result.data, '获取训练设置详情成功');
      } else {
        return res.error(result.errCode, result.errMessage);
      }
    } catch (error) {
      console.error('获取训练设置详情失败:', error);
      return res.error('INTERNAL_ERROR', '获取训练设置详情失败');
    }
  }

  /**
   * 保存训练设置（创建或更新）
   */
  async save(req, res) {
    try {
      const result = await this.workoutSettingsService.update(req.body);

      if (result.success) {
        return res.success(result.data, '保存训练设置成功');
      } else {
        return res.error(result.errCode, result.errMessage);
      }
    } catch (error) {
      console.error('保存训练设置失败:', error);
      return res.error('INTERNAL_ERROR', '保存训练设置失败');
    }
  }

  /**
   * 更新训练设置
   */
  async update(req, res) {
    try {
      const result = await this.workoutSettingsService.update(req.body);

      if (result.success) {
        return res.success(result.data, '更新训练设置成功');
      } else {
        return res.error(result.errCode, result.errMessage);
      }
    } catch (error) {
      console.error('更新训练设置失败:', error);
      return res.error('INTERNAL_ERROR', '更新训练设置失败');
    }
  }
}

module.exports = WorkoutSettingsController;
