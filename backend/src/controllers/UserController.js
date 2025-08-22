/**
 * 用户控制器
 * 处理用户相关的HTTP请求
 */

const BaseController = require('../core/BaseController');
const UserService = require('../services/UserService');

class UserController extends BaseController {
  constructor() {
    const userService = new UserService();
    super({
      service: userService,
      entityName: '用户'
    });

    this.userService = userService;
  }

  /**
   * @swagger
   * /user/login:
   *   post:
   *     tags: [Authentication]
   *     summary: 用户登录
   *     description: 用户通过邮箱和密码登录系统
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 用户邮箱
   *                 example: admin@example.com
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 description: 用户密码
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: 登录成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         user:
   *                           $ref: '#/components/schemas/User'
   *                         token:
   *                           type: string
   *                           description: JWT访问令牌
   *                         refreshToken:
   *                           type: string
   *                           description: 刷新令牌
   *                         expiresIn:
   *                           type: string
   *                           description: 令牌过期时间
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 认证失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;

      const result = await this.userService.login(email, password, ip);

      if (result.success) {
        return res.success(result.data, result.message);
      } else {
        const statusCode = result.errCode === 'USER_NOT_FOUND' || result.errCode === 'PASSWORD_INCORRECT' ? 401 : 400;
        return res.error(result.errCode, result.errMessage, statusCode);
      }
    } catch (error) {
      this.logger.error('用户登录失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '登录失败', 500);
    }
  }

  /**
   * @swagger
   * /user/register:
   *   post:
   *     tags: [Authentication]
   *     summary: 用户注册
   *     description: 新用户注册账号
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 邮箱地址
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 maxLength: 20
   *                 description: 密码
   *                 example: "123456"
   *               name:
   *                 type: string
   *                 maxLength: 50
   *                 description: 用户名
   *                 example: "张三"
   *     responses:
   *       201:
   *         description: 注册成功
   *       400:
   *         description: 请求参数错误或邮箱已存在
   */
  async register(req, res) {
    try {
      const result = await this.userService.register(req.body);

      if (result.success) {
        return res.success(result.data, result.message, 201);
      } else {
        const statusCode = result.errCode === 'EMAIL_EXISTS' ? 409 : 400;
        return res.error(result.errCode, result.errMessage, statusCode);
      }
    } catch (error) {
      this.logger.error('用户注册失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '注册失败', 500);
    }
  }

  /**
   * @swagger
   * /user/profile:
   *   get:
   *     tags: [User]
   *     summary: 获取当前用户信息
   *     description: 根据token获取当前登录用户的详细信息
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         description: 未授权访问
   * /user/getMyInfo:
   *   get:
   *     tags: [User]
   *     summary: 获取当前用户信息（兼容接口）
   *     description: 根据token获取当前登录用户的详细信息，与/user/profile功能相同
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         description: 未授权访问
   */
  async getProfile(req, res) {
    try {
      const { userId } = req.user;
      const result = await this.userService.getUserById(userId);

      if (result.success) {
        return res.success(result.data, '获取用户信息成功');
      } else {
        return res.error(result.errCode, result.errMessage, 404);
      }
    } catch (error) {
      this.logger.error('获取用户信息失败:', {
        error: error.message,
        userId: req.user?.userId
      });
      return res.error('INTERNAL_ERROR', '获取用户信息失败', 500);
    }
  }

  /**
   * @swagger
   * /user/profile:
   *   put:
   *     tags: [User]
   *     summary: 更新当前用户信息
   *     description: 更新当前登录用户的基本信息
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 50
   *                 description: 用户名
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 邮箱地址
   *               phone:
   *                 type: string
   *                 maxLength: 20
   *                 description: 手机号码
   *               avatar:
   *                 type: string
   *                 description: 头像URL
   *     responses:
   *       200:
   *         description: 更新成功
   *       400:
   *         description: 请求参数错误
   */
  async updateProfile(req, res) {
    try {
      const { userId } = req.user;
      const result = await this.userService.updateUser(userId, req.body);

      if (result.success) {
        return res.success(null, result.message);
      } else {
        const statusCode = result.errCode === 'EMAIL_EXISTS' ? 409 : 400;
        return res.error(result.errCode, result.errMessage, statusCode);
      }
    } catch (error) {
      this.logger.error('更新用户信息失败:', {
        error: error.message,
        userId: req.user?.userId,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '更新用户信息失败', 500);
    }
  }

  /**
   * @swagger
   * /user/change-password:
   *   post:
   *     tags: [User]
   *     summary: 修改密码
   *     description: 用户修改登录密码
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - oldPassword
   *               - newPassword
   *             properties:
   *               oldPassword:
   *                 type: string
   *                 description: 原密码
   *               newPassword:
   *                 type: string
   *                 minLength: 6
   *                 maxLength: 20
   *                 description: 新密码
   *     responses:
   *       200:
   *         description: 密码修改成功
   *       400:
   *         description: 请求参数错误或原密码不正确
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const { userId } = req.user;

      const result = await this.userService.changePassword(userId, oldPassword, newPassword);

      if (result.success) {
        return res.success(null, result.message);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('修改密码失败:', {
        error: error.message,
        userId: req.user?.userId
      });
      return res.error('INTERNAL_ERROR', '修改密码失败', 500);
    }
  }

  /**
   * @swagger
   * /user/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: 用户登出
   *     description: 用户退出登录
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 登出成功
   */
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const result = await this.userService.logout(token);

      return res.success(null, result.message);
    } catch (error) {
      this.logger.error('用户登出失败:', {
        error: error.message,
        userId: req.user?.userId
      });
      return res.error('INTERNAL_ERROR', '登出失败', 500);
    }
  }

  /**
   * @swagger
   * /user/refresh-token:
   *   post:
   *     tags: [Authentication]
   *     summary: 刷新访问令牌
   *     description: 使用刷新令牌获取新的访问令牌
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: 刷新令牌
   *     responses:
   *       200:
   *         description: 刷新成功
   *       401:
   *         description: 刷新令牌无效或过期
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await this.userService.refreshToken(refreshToken);

      if (result.success) {
        return res.success(result.data, '令牌刷新成功');
      } else {
        return res.error(result.errCode, result.errMessage, 401);
      }
    } catch (error) {
      this.logger.error('刷新令牌失败:', {
        error: error.message,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '刷新令牌失败', 500);
    }
  }

  /**
   * @swagger
   * /user/check-email:
   *   post:
   *     tags: [User]
   *     summary: 检查邮箱是否可用
   *     description: 检查邮箱地址是否已被注册
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 邮箱地址
   *     responses:
   *       200:
   *         description: 检查成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         available:
   *                           type: boolean
   *                           description: 邮箱是否可用
   */
  async checkEmailAvailable(req, res) {
    try {
      const { email } = req.body;
      const result = await this.userService.checkEmailAvailable(email);

      if (result.success) {
        return res.success(result.data, '检查完成');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('检查邮箱可用性失败:', {
        error: error.message,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '检查邮箱可用性失败', 500);
    }
  }

  // 管理员接口

  /**
   * @swagger
   * /user/list:
   *   get:
   *     tags: [User]
   *     summary: 获取用户列表
   *     description: 获取分页的用户列表（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/PageIndex'
   *       - $ref: '#/components/parameters/PageSize'
   *       - $ref: '#/components/parameters/Keywords'
   *       - $ref: '#/components/parameters/Status'
   *       - name: type
   *         in: query
   *         description: 用户类型
   *         schema:
   *           type: string
   *           enum: [admin, user, guest]
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedResponse'
   */
  async getUserList(req, res) {
    return this.getList(req, res);
  }

  /**
   * @swagger
   * /user/{id}:
   *   get:
   *     tags: [User]
   *     summary: 获取用户详情
   *     description: 根据ID获取用户详细信息（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     responses:
   *       200:
   *         description: 获取成功
   *       404:
   *         description: 用户不存在
   */
  async getUserById(req, res) {
    return this.getDetail(req, res);
  }

  /**
   * @swagger
   * /user:
   *   post:
   *     tags: [User]
   *     summary: 创建用户
   *     description: 创建新用户（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 6
   *               name:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [admin, user, guest]
   *               status:
   *                 type: integer
   *                 enum: [0, 1]
   *     responses:
   *       201:
   *         description: 创建成功
   */
  async createUser(req, res) {
    return this.create(req, res);
  }

  /**
   * @swagger
   * /user/{id}:
   *   put:
   *     tags: [User]
   *     summary: 更新用户信息
   *     description: 更新指定用户的信息（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               name:
   *                 type: string
   *               type:
   *                 type: string
   *               status:
   *                 type: integer
   *     responses:
   *       200:
   *         description: 更新成功
   */
  async updateUser(req, res) {
    return this.update(req, res);
  }

  /**
   * @swagger
   * /user/{id}:
   *   delete:
   *     tags: [User]
   *     summary: 删除用户
   *     description: 删除指定用户（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/IdPath'
   *     responses:
   *       200:
   *         description: 删除成功
   */
  async deleteUser(req, res) {
    return this.delete(req, res);
  }

  /**
   * @swagger
   * /user/batch-delete:
   *   post:
   *     tags: [User]
   *     summary: 批量删除用户
   *     description: 批量删除用户（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ids
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: integer
   *     responses:
   *       200:
   *         description: 批量删除成功
   */
  async batchDeleteUsers(req, res) {
    return this.batchDelete(req, res);
  }

  /**
   * @swagger
   * /user/batch-update-status:
   *   post:
   *     tags: [User]
   *     summary: 批量更新用户状态
   *     description: 批量更新用户状态（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ids
   *               - status
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: integer
   *               status:
   *                 type: integer
   *                 enum: [0, 1]
   *     responses:
   *       200:
   *         description: 批量更新成功
   */
  async batchUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body;
      const result = await this.userService.batchUpdateStatus(ids, status);

      if (result.success) {
        return res.success(null, result.message);
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('批量更新用户状态失败:', {
        error: error.message,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '批量更新用户状态失败', 500);
    }
  }

  /**
   * @swagger
   * /user/stats:
   *   get:
   *     tags: [User]
   *     summary: 获取用户统计信息
   *     description: 获取用户相关的统计数据（管理员权限）
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   */
  async getUserStats(req, res) {
    return this.getStats(req, res);
  }

  /**
   * @swagger
   * /user/online:
   *   get:
   *     tags: [User]
   *     summary: 获取在线用户
   *     description: 获取当前在线用户列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: minutes
   *         in: query
   *         description: 在线判断时间范围（分钟）
   *         schema:
   *           type: integer
   *           default: 30
   *     responses:
   *       200:
   *         description: 获取成功
   */
  async getOnlineUsers(req, res) {
    try {
      const minutes = parseInt(req.query.minutes) || 30;
      const result = await this.userService.getOnlineUsers(minutes);

      if (result.success) {
        return res.success(result.data, '获取在线用户成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取在线用户失败:', {
        error: error.message,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取在线用户失败', 500);
    }
  }

  /**
   * @swagger
   * /user/search:
   *   get:
   *     tags: [User]
   *     summary: 搜索用户
   *     description: 根据关键词搜索用户
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/Keywords'
   *       - $ref: '#/components/parameters/PageIndex'
   *       - $ref: '#/components/parameters/PageSize'
   *     responses:
   *       200:
   *         description: 搜索成功
   */
  async searchUsers(req, res) {
    return this.search(req, res);
  }
}

module.exports = UserController;