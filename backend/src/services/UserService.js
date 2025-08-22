/**
 * 用户服务类
 * 处理用户相关的业务逻辑
 */

const BaseService = require('../core/BaseService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ERROR_CODES } = require('../config/constants');

class UserService extends BaseService {
  constructor() {
    super({
      tableName: 'user',
      entityName: '用户',
      primaryKey: 'id',
      fieldMapping: {
        'id': 'id',
        'email': 'email',
        'password': 'password',
        'name': 'name',
        'avatar': 'avatar',
        'status': 'status',
        'type': 'type',
        'createTime': 'create_time',
        'updateTime': 'update_time',
        'isDeleted': 'is_deleted'
      },
      searchableFields: ['email', 'name']
    });

    this.userModel = new User();
  }

  /**
   * 用户登录
   */
  async login(email, password) {
    try {
      // 参数验证
      if (!email || !password) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '邮箱和密码不能为空'
        };
      }

      // 调用模型的登录方法
      const loginResult = await this.userModel.login(email, password);

      if (!loginResult.success) {
        return {
          success: false,
          errCode: loginResult.error,
          errMessage: loginResult.message
        };
      }



      // 生成JWT token
      const token = this.generateToken(loginResult.user);
      const refreshToken = this.generateRefreshToken(loginResult.user);

      return {
        success: true,
        data: {
          user: loginResult.user,
          token,
          refreshToken,
          expiresIn: config.jwt.expiresIn
        },
        message: '登录成功'
      };
    } catch (error) {
      console.log(error);

      this.logger.error('用户登录失败:', { error: error.message, email });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '登录失败'
      };
    }
  }

  /**
   * 用户注册
   */
  async register(userData) {
    try {
      // 参数验证
      const validation = this.validate(userData, {
        email: { required: true, type: 'email', maxLength: 100 },
        password: { required: true, type: 'string', minLength: 6, maxLength: 20 },
        name: { required: false, type: 'string', maxLength: 50 }
      });

      if (!validation.valid) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: validation.errors.join(', ')
        };
      }

      // 调用模型的创建用户方法
      const result = await this.userModel.createUser(userData);

      if (!result.success) {
        return {
          success: false,
          errCode: result.error,
          errMessage: result.message
        };
      }

      // 获取创建的用户信息
      const user = await this.userModel.find(result.insertId);

      return {
        success: true,
        data: {
          user: user,
          id: result.insertId
        },
        message: '注册成功'
      };
    } catch (error) {
      this.logger.error('用户注册失败:', { error: error.message, userData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '注册失败'
      };
    }
  }

  /**
   * 获取用户详情
   */
  async getUserById(userId) {
    try {
      const user = await this.userModel.find(userId);

      if (!user) {
        return {
          success: false,
          errCode: ERROR_CODES.RECORD_NOT_FOUND,
          errMessage: '用户不存在'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      this.logger.error('获取用户详情失败:', { error: error.message, userId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取用户详情失败'
      };
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, userData) {
    try {
      // 参数验证
      const validation = this.validate(userData, {
        email: { required: false, type: 'email', maxLength: 100 },
        name: { required: false, type: 'string', maxLength: 50 },
        phone: { required: false, type: 'string', maxLength: 20 }
      });

      if (!validation.valid) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: validation.errors.join(', ')
        };
      }

      const result = await this.userModel.updateUser(userId, userData);
      return result;
    } catch (error) {
      this.logger.error('更新用户信息失败:', { error: error.message, userId, userData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '更新用户信息失败'
      };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // 参数验证
      if (!oldPassword || !newPassword) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '原密码和新密码不能为空'
        };
      }

      if (newPassword.length < 6 || newPassword.length > 20) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '新密码长度必须在6-20位之间'
        };
      }

      const result = await this.userModel.changePassword(userId, oldPassword, newPassword);
      return result;
    } catch (error) {
      this.logger.error('修改密码失败:', { error: error.message, userId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '修改密码失败'
      };
    }
  }

  /**
   * 重置密码（管理员操作）
   */
  async resetPassword(userId, newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '新密码长度不能少于6位'
        };
      }

      const result = await this.userModel.resetPassword(userId, newPassword);
      return result;
    } catch (error) {
      this.logger.error('重置密码失败:', { error: error.message, userId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '重置密码失败'
      };
    }
  }

  /**
   * 获取用户列表
   */
  async getUserList(query = {}) {
    try {
      const result = await this.getList(query);
      return result;
    } catch (error) {
      this.logger.error('获取用户列表失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取用户列表失败'
      };
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(userId) {
    try {
      const result = await this.delete(userId);
      return result;
    } catch (error) {
      this.logger.error('删除用户失败:', { error: error.message, userId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '删除用户失败'
      };
    }
  }

  /**
   * 批量删除用户
   */
  async batchDeleteUsers(userIds) {
    try {
      const result = await this.batchDelete(userIds);
      return result;
    } catch (error) {
      this.logger.error('批量删除用户失败:', { error: error.message, userIds });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '批量删除用户失败'
      };
    }
  }

  /**
   * 批量更新用户状态
   */
  async batchUpdateStatus(userIds, status) {
    try {
      const result = await this.userModel.batchUpdateStatus(userIds, status);
      return result;
    } catch (error) {
      this.logger.error('批量更新用户状态失败:', { error: error.message, userIds, status });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '批量更新用户状态失败'
      };
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats() {
    try {
      const result = await this.userModel.getUserStats();
      return result;
    } catch (error) {
      this.logger.error('获取用户统计失败:', { error: error.message });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取用户统计失败'
      };
    }
  }

  /**
   * 获取在线用户
   */
  async getOnlineUsers(minutes = 30) {
    try {
      const result = await this.userModel.getOnlineUsers(minutes);
      return result;
    } catch (error) {
      this.logger.error('获取在线用户失败:', { error: error.message });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取在线用户失败'
      };
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(query = {}) {
    try {
      const result = await this.search(query);
      return result;
    } catch (error) {
      this.logger.error('搜索用户失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '搜索用户失败'
      };
    }
  }

  /**
   * 验证token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      // 检查用户是否仍然存在且状态正常
      const user = await this.userModel.find(decoded.userId);
      if (!user || user.status === 0) {
        return {
          success: false,
          errCode: ERROR_CODES.UNAUTHORIZED,
          errMessage: '用户不存在或已被禁用'
        };
      }

      return {
        success: true,
        data: {
          userId: decoded.userId,
          user: user
        }
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          errCode: ERROR_CODES.TOKEN_EXPIRED,
          errMessage: 'Token已过期'
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          success: false,
          errCode: ERROR_CODES.TOKEN_INVALID,
          errMessage: 'Token无效'
        };
      }

      return {
        success: false,
        errCode: ERROR_CODES.UNAUTHORIZED,
        errMessage: '身份验证失败'
      };
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret);

      if (decoded.type !== 'refresh') {
        return {
          success: false,
          errCode: ERROR_CODES.TOKEN_INVALID,
          errMessage: '无效的刷新token'
        };
      }

      const user = await this.userModel.find(decoded.userId);
      if (!user || user.status === 0) {
        return {
          success: false,
          errCode: ERROR_CODES.UNAUTHORIZED,
          errMessage: '用户不存在或已被禁用'
        };
      }

      // 生成新的token
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn: config.jwt.expiresIn
        }
      };
    } catch (error) {
      return {
        success: false,
        errCode: ERROR_CODES.TOKEN_INVALID,
        errMessage: '刷新token失败'
      };
    }
  }

  /**
   * 生成访问token
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'access'
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }
    );
  }

  /**
   * 生成刷新token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'refresh'
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }
    );
  }

  /**
   * 用户登出（可选择性实现token黑名单）
   */
  async logout(token) {
    try {
      // 这里可以实现token黑名单功能
      // 将token加入黑名单，防止被重复使用

      return {
        success: true,
        message: '登出成功'
      };
    } catch (error) {
      this.logger.error('用户登出失败:', { error: error.message });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '登出失败'
      };
    }
  }

  /**
   * 检查邮箱是否可用
   */
  async checkEmailAvailable(email, excludeUserId = null) {
    try {
      const exists = await this.userModel.emailExists(email, excludeUserId);
      return {
        success: true,
        data: {
          available: !exists
        }
      };
    } catch (error) {
      this.logger.error('检查邮箱可用性失败:', { error: error.message, email });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '检查邮箱可用性失败'
      };
    }
  }
}

module.exports = UserService;