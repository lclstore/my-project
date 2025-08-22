/**
 * 首页控制器
 * 处理首页和系统信息相关的HTTP请求
 */

const Logger = require('../core/Logger');
const Database = require('../core/Database');
const HomeService = require('../services/HomeService');

class HomeController {
  constructor() {
    this.logger = new Logger();
    this.database = new Database();
    this.homeService = new HomeService();
  }

  /**
   * @swagger
   * /home/dashboard:
   *   get:
   *     tags: [Home]
   *     summary: 获取仪表板数据
   *     description: 获取系统仪表板的统计数据
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     userCount:
   *                       type: integer
   *                       description: 用户总数
   *                       example: 1000
   *                     exerciseCount:
   *                       type: integer
   *                       description: 动作资源总数
   *                       example: 500
   *                     soundCount:
   *                       type: integer
   *                       description: 音频资源总数
   *                       example: 300
   *                     workoutCount:
   *                       type: integer
   *                       description: 训练总数
   *                       example: 200
   *                     categoryCount:
   *                       type: integer
   *                       description: 分类总数
   *                       example: 50
   *                 message:
   *                   type: string
   *                   example: "获取仪表板数据成功"
   *       500:
   *         description: 服务器错误
   */
  async getDashboard(req, res) {
    try {
      // 初始化数据库连接
      if (!this.database.pool) {
        await this.database.initialize();
      }

      // 并行查询各种统计数据
      const queries = [
        this.database.queryOne('SELECT COUNT(*) as count FROM user WHERE is_deleted = 0'),
        this.database.queryOne('SELECT COUNT(*) as count FROM exercise WHERE is_deleted = 0'),
        this.database.queryOne('SELECT COUNT(*) as count FROM sound WHERE is_deleted = 0'),
        this.database.queryOne('SELECT COUNT(*) as count FROM workout WHERE is_deleted = 0'),
        this.database.queryOne('SELECT COUNT(*) as count FROM category WHERE status = "ACTIVE"')
      ];

      const [userResult, exerciseResult, soundResult, workoutResult, categoryResult] = await Promise.allSettled(queries);

      const dashboardData = {
        userCount: userResult.status === 'fulfilled' ? (userResult.value?.count || 0) : 0,
        exerciseCount: exerciseResult.status === 'fulfilled' ? (exerciseResult.value?.count || 0) : 0,
        soundCount: soundResult.status === 'fulfilled' ? (soundResult.value?.count || 0) : 0,
        workoutCount: workoutResult.status === 'fulfilled' ? (workoutResult.value?.count || 0) : 0,
        categoryCount: categoryResult.status === 'fulfilled' ? (categoryResult.value?.count || 0) : 0,
        lastUpdated: new Date().toISOString()
      };

      return res.success(dashboardData, '获取仪表板数据成功');
    } catch (error) {
      this.logger.error('获取仪表板数据失败:', {
        error: error.message,
        stack: error.stack
      });
      return res.error('INTERNAL_ERROR', '获取仪表板数据失败', 500);
    }
  }

  /**
   * @swagger
   * /home/system-info:
   *   get:
   *     tags: [Home]
   *     summary: 获取系统信息
   *     description: 获取系统的基本信息和运行状态
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       description: 系统名称
   *                       example: "Backend API"
   *                     version:
   *                       type: string
   *                       description: 系统版本
   *                       example: "2.0.0"
   *                     environment:
   *                       type: string
   *                       description: 运行环境
   *                       example: "production"
   *                     nodeVersion:
   *                       type: string
   *                       description: Node.js版本
   *                       example: "v18.17.0"
   *                     uptime:
   *                       type: number
   *                       description: 运行时间（秒）
   *                       example: 86400
   *                     memory:
   *                       type: object
   *                       description: 内存使用情况
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                       description: 当前时间
   *                 message:
   *                   type: string
   *                   example: "获取系统信息成功"
   *       500:
   *         description: 服务器错误
   */
  async getSystemInfo(req, res) {
    try {
      const systemInfo = {
        name: 'Backend API',
        version: '2.0.0',
        description: '企业级后台管理系统API',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        pid: process.pid
      };

      return res.success(systemInfo, '获取系统信息成功');
    } catch (error) {
      this.logger.error('获取系统信息失败:', {
        error: error.message,
        stack: error.stack
      });
      return res.error('INTERNAL_ERROR', '获取系统信息失败', 500);
    }
  }

  /**
   * @swagger
   * /home/info:
   *   get:
   *     tags: [Home]
   *     summary: 获取应用信息
   *     description: 获取应用基本信息，需要token验证
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取应用信息成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "获取应用信息成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     appIcon:
   *                       type: string
   *                       example: "https://example.com/icon.png"
   *                     appStoreName:
   *                       type: string
   *                       example: "全栈应用系统"
   *                     appCode:
   *                       type: string
   *                       example: "fullstack-app"
   *                     createTime:
   *                       type: string
   *                       format: date-time
   *                       example: "2023-01-01T00:00:00.000Z"
   *                     updateTime:
   *                       type: string
   *                       format: date-time
   *                       example: "2023-01-02T00:00:00.000Z"
   *       401:
   *         description: 未授权
   *       404:
   *         description: 应用信息不存在
   *       500:
   *         description: 服务器内部错误
   */
  async getAppInfo(req, res) {
    try {
      // 获取应用信息通过id查询最后一条
      const sql = 'SELECT app_icon, app_store_name, app_code, create_time, update_time FROM app_info ORDER BY id DESC LIMIT 1';
      const appInfo = await this.homeService.queryOne(sql);

      if (!appInfo) {
        return res.error('NOT_FOUND', '应用信息不存在', 404);
      }

      // 转换字段名
      const result = this.homeService.convertToFrontendFields(appInfo);
      return res.success(result, '获取应用信息成功');

    } catch (error) {
      this.logger.error('获取应用信息失败:', {
        error: error.message,
        stack: error.stack
      });
      return res.error('INTERNAL_ERROR', '获取应用信息失败', 500);
    }
  }

  /**
   * @swagger
   * /home/helps/page:
   *   get:
   *     tags: [Home]
   *     summary: 获取帮助列表
   *     description: 分页获取帮助文档列表，需要token验证
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: pageIndex
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码（从1开始）
   *     responses:
   *       200:
   *         description: 获取帮助列表成功
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  async getHelpsPage(req, res) {
    try {
      const result = await this.homeService.getHelpsPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取帮助列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取帮助列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取帮助列表失败', 500);
    }
  }

  /**
   * @swagger
   * /home/addHelps:
   *   post:
   *     tags: [Home]
   *     summary: 添加帮助信息
   *     description: 添加新的帮助信息，需要token验证
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - url
   *             properties:
   *               name:
   *                 type: string
   *                 description: 帮助名称
   *                 example: "用户指南"
   *               url:
   *                 type: string
   *                 format: uri
   *                 description: 帮助链接
   *                 example: "https://example.com/help/user-guide"
   *     responses:
   *       200:
   *         description: 添加帮助信息成功
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  async addHelps(req, res) {
    try {
      const result = await this.homeService.addHelp(req.body);

      if (result.success) {
        return res.success({ id: result.id }, result.message || '添加帮助信息成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('添加帮助信息失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '添加帮助信息失败', 500);
    }
  }

  /**
   * @swagger
   * /home/changelogs/page:
   *   get:
   *     tags: [Home]
   *     summary: 获取变更日志列表
   *     description: 分页获取应用变更日志列表，按创建时间倒序排列，需要token验证
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: pageIndex
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码（从1开始）
   *     responses:
   *       200:
   *         description: 获取变更日志列表成功
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  async getChangeLogsPage(req, res) {
    try {
      const result = await this.homeService.getChangeLogsPage(req.query);

      if (result.success) {
        return res.paginate(
          result.data,
          result.totalCount,
          result.pageIndex,
          result.pageSize,
          '获取变更日志列表成功'
        );
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('获取变更日志列表失败:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      return res.error('INTERNAL_ERROR', '获取变更日志列表失败', 500);
    }
  }

  /**
   * @swagger
   * /home/addChangeLogs:
   *   post:
   *     tags: [Home]
   *     summary: 添加变更日志
   *     description: 添加新的应用变更日志，需要token验证
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - version
   *               - date
   *               - newInfo
   *             properties:
   *               version:
   *                 type: string
   *                 description: 版本号
   *                 example: "v1.0.0"
   *               date:
   *                 type: string
   *                 format: date
   *                 description: 变更日期
   *                 example: "2023-01-01"
   *               newInfo:
   *                 type: string
   *                 description: 新功能信息
   *                 example: "修复了登录问题，优化了性能"
   *     responses:
   *       200:
   *         description: 添加变更日志成功
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  async addChangeLogs(req, res) {
    try {
      const result = await this.homeService.addChangeLog(req.body);

      if (result.success) {
        return res.success({ id: result.id }, result.message || '添加变更日志成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('添加变更日志失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '添加变更日志失败', 500);
    }
  }

  /**
   * @swagger
   * /home/save:
   *   post:
   *     tags: [Home]
   *     summary: 保存应用信息
   *     description: 添加新的应用信息，所有字段都是必填的，需要token验证
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - appIcon
   *               - appStoreName
   *             properties:
   *               appIcon:
   *                 type: string
   *                 description: 应用图标URL
   *                 example: "https://example.com/icon.png"
   *               appStoreName:
   *                 type: string
   *                 description: 应用商店名称
   *                 example: "全栈应用系统"
   *               appCode:
   *                 type: string
   *                 description: 应用代码（可选）
   *                 example: "fullstack-app"
   *     responses:
   *       200:
   *         description: 保存应用信息成功
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  async saveAppInfo(req, res) {
    try {
      const result = await this.homeService.saveAppInfo(req.body);

      if (result.success) {
        return res.success({ id: result.id }, result.message || '保存应用信息成功');
      } else {
        return res.error(result.errCode, result.errMessage, 400);
      }
    } catch (error) {
      this.logger.error('保存应用信息失败:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.error('INTERNAL_ERROR', '保存应用信息失败', 500);
    }
  }

  /**
   * @swagger
   * /home/health:
   *   get:
   *     tags: [Home]
   *     summary: 健康检查
   *     description: 检查系统各组件的健康状态
   *     responses:
   *       200:
   *         description: 系统健康
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: "healthy"
   *                     database:
   *                       type: string
   *                       example: "connected"
   *                     uptime:
   *                       type: number
   *                       example: 86400
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *                   example: "系统健康"
   *       503:
   *         description: 系统不健康
   */
  async healthCheck(req, res) {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      };

      // 检查数据库连接
      try {
        if (!this.database.pool) {
          await this.database.initialize();
        }
        await this.database.testConnection();
        healthStatus.database = 'connected';
      } catch (dbError) {
        healthStatus.database = 'disconnected';
        healthStatus.status = 'unhealthy';
        healthStatus.error = dbError.message;
      }

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      const message = healthStatus.status === 'healthy' ? '系统健康' : '系统不健康';

      return res.status(statusCode).success(healthStatus, message);
    } catch (error) {
      this.logger.error('健康检查失败:', {
        error: error.message,
        stack: error.stack
      });
      return res.error('INTERNAL_ERROR', '健康检查失败', 500);
    }
  }

  /**
   * @swagger
   * /home/welcome:
   *   get:
   *     tags: [Home]
   *     summary: 欢迎信息
   *     description: 获取系统欢迎信息
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: "欢迎使用后台管理系统"
   *                     version:
   *                       type: string
   *                       example: "2.0.0"
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *                   example: "欢迎访问"
   */
  async welcome(req, res) {
    try {
      const welcomeData = {
        message: '欢迎使用后台管理系统',
        version: '2.0.0',
        description: '企业级后台管理系统API',
        timestamp: new Date().toISOString(),
        features: [
          '用户管理',
          '分类管理',
          '动作资源管理',
          '音频资源管理',
          '文件上传',
          '权限控制',
          'API文档'
        ]
      };

      return res.success(welcomeData, '欢迎访问');
    } catch (error) {
      this.logger.error('获取欢迎信息失败:', {
        error: error.message,
        stack: error.stack
      });
      return res.error('INTERNAL_ERROR', '获取欢迎信息失败', 500);
    }
  }
}

module.exports = HomeController;
