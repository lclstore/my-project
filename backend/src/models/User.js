/**
 * 用户模型
 * 用户数据的操作和验证
 */

const BaseModel = require('../core/BaseModel');
const bcrypt = require('bcryptjs');
const { USER_STATUS, USER_TYPES } = require('../config/constants');

class User extends BaseModel {
  constructor() {
    super({
      tableName: 'user',
      primaryKey: 'id',
      fillable: [
        'email',
        'password',
        'name',
        'avatar',
        'status',
        'type',
        'phone',
        'last_login_ip'
      ],
      hidden: ['password'],
      casts: {
        status: 'int',
      },
      timestamps: true,
      softDeletes: true
    });
  }

  /**
   * 创建用户前的处理
   */
  async beforeCreate(data) {
    // 密码加密
    if (data.password) {
      data.password = await this.hashPassword(data.password);
    }

    // 设置默认值
    if (!data.status) {
      data.status = USER_STATUS.ENABLED;
    }

    if (!data.type) {
      data.type = USER_TYPES.USER;
    }

    return data;
  }

  /**
   * 更新用户前的处理
   */
  async beforeUpdate(data) {
    // 如果更新密码，需要加密
    if (data.password) {
      data.password = await this.hashPassword(data.password);
    }

    return data;
  }

  /**
   * 密码加密
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email) {
    const db = await this.getDatabase();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE email = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    `;
    const result = await db.queryOne(sql, [email]);
    return result ? this.transform(result) : null;
  }

  /**
   * 用户登录
   */
  async login(email, password) {
    // 查找用户（包含密码字段）
    const db = await this.getDatabase();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE email = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    `;
    const user = await db.queryOne(sql, [email]);

    if (!user) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
        message: '用户不存在或密码错误'
      };
    }

    // 检查用户状态
    if (user.status === USER_STATUS.DISABLED) {
      return {
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: '账户已被禁用'
      };
    }

    // 验证密码

    if (password !== user.password) {
      return {
        success: false,
        error: 'PASSWORD_INCORRECT',
        message: '用户不存在或密码错误'
      };
    }

    // 返回用户信息（不包含密码）
    delete user.password;
    return {
      success: true,
      user: this.transform(user)
    };
  }



  /**
   * 检查邮箱是否已存在
   */
  async emailExists(email, excludeId = null) {
    let sql = `
      SELECT COUNT(*) as count FROM ${this.tableName} 
      WHERE email = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    `;
    const params = [email];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await this.count(sql.replace('SELECT COUNT(*) as count FROM', '').replace('WHERE', ''), params.slice(1));
    return result > 0;
  }

  /**
   * 创建用户
   */
  async createUser(userData) {
    try {
      // 检查邮箱是否已存在
      const emailExists = await this.emailExists(userData.email);
      if (emailExists) {
        return {
          success: false,
          error: 'EMAIL_EXISTS',
          message: '邮箱已被使用'
        };
      }

      // 处理数据
      const processedData = await this.beforeCreate(userData);

      // 创建用户
      const result = await this.create(processedData);

      return {
        success: true,
        insertId: result.insertId,
        message: '用户创建成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'CREATE_FAILED',
        message: '用户创建失败'
      };
    }
  }

  /**
   * 更新用户
   */
  async updateUser(userId, userData) {
    try {
      // 检查用户是否存在
      const user = await this.find(userId);
      if (!user) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在'
        };
      }

      // 如果更新邮箱，检查是否已被其他用户使用
      if (userData.email && userData.email !== user.email) {
        const emailExists = await this.emailExists(userData.email, userId);
        if (emailExists) {
          return {
            success: false,
            error: 'EMAIL_EXISTS',
            message: '邮箱已被使用'
          };
        }
      }

      // 处理数据
      const processedData = await this.beforeUpdate(userData);

      // 更新用户
      const result = await this.update(userId, processedData);

      return {
        success: true,
        message: '用户更新成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: '用户更新失败'
      };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // 获取用户信息（包含密码）
      const db = await this.getDatabase();
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`;
      const user = await db.queryOne(sql, [userId]);

      if (!user) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在'
        };
      }

      // 验证旧密码
      const isValidOldPassword = await this.verifyPassword(oldPassword, user.password);
      if (!isValidOldPassword) {
        return {
          success: false,
          error: 'OLD_PASSWORD_INCORRECT',
          message: '原密码不正确'
        };
      }

      // 加密新密码
      const hashedNewPassword = await this.hashPassword(newPassword);

      // 更新密码
      await this.update(userId, { password: hashedNewPassword });

      return {
        success: true,
        message: '密码修改成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'CHANGE_PASSWORD_FAILED',
        message: '密码修改失败'
      };
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(userId, newPassword) {
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      await this.update(userId, { password: hashedPassword });

      return {
        success: true,
        message: '密码重置成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'RESET_PASSWORD_FAILED',
        message: '密码重置失败'
      };
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats() {
    try {
      const db = await this.getDatabase();
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 1 THEN 1 END) as active,
          COUNT(CASE WHEN status = 0 THEN 1 END) as inactive,
          COUNT(CASE WHEN type = 'admin' THEN 1 END) as admin,
          COUNT(CASE WHEN DATE(create_time) = CURDATE() THEN 1 END) as today_new
        FROM ${this.tableName} 
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
      `;

      const result = await db.queryOne(sql);

      return {
        success: true,
        data: {
          total: parseInt(result.total),
          active: parseInt(result.active),
          inactive: parseInt(result.inactive),
          admin: parseInt(result.admin),
          todayNew: parseInt(result.today_new)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'STATS_FAILED',
        message: '获取统计信息失败'
      };
    }
  }

  /**
   * 批量更新用户状态
   */
  async batchUpdateStatus(userIds, status) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return {
          success: false,
          error: 'INVALID_PARAMS',
          message: '用户ID列表不能为空'
        };
      }

      const db = await this.getDatabase();
      const placeholders = userIds.map(() => '?').join(',');
      const sql = `
        UPDATE ${this.tableName} 
        SET status = ?, update_time = NOW() 
        WHERE id IN (${placeholders}) AND (is_deleted = 0 OR is_deleted IS NULL)
      `;

      const result = await db.query(sql, [status, ...userIds]);

      return {
        success: true,
        affectedRows: result.affectedRows,
        message: `成功更新${result.affectedRows}个用户状态`
      };
    } catch (error) {
      return {
        success: false,
        error: 'BATCH_UPDATE_FAILED',
        message: '批量更新状态失败'
      };
    }
  }

  /**
   * 获取在线用户（基于最近登录时间）
   */
  async getOnlineUsers(minutes = 30) {
    try {
      const db = await this.getDatabase();
      const sql = `
        SELECT id, email, name, avatar,  
        FROM ${this.tableName} 
        WHERE last_login_time >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        AND status = 1 
        AND (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY last_login_time DESC
      `;

      const users = await db.query(sql, [minutes]);

      return {
        success: true,
        data: users.map(user => this.transform(user))
      };
    } catch (error) {
      return {
        success: false,
        error: 'GET_ONLINE_USERS_FAILED',
        message: '获取在线用户失败'
      };
    }
  }
}

module.exports = User;