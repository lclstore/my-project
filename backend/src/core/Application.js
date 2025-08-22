/**
 * 应用核心类
 * 负责应用的初始化、中间件配置和启动
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Logger = require('./Logger');
const Database = require('./Database');
const Response = require('./Response');
const { errorHandler, notFoundHandler, handleUncaughtExceptions } = require('../middleware/errorHandler');
const { dataSanitizer } = require('../middleware/validation');
const { securityHeaders } = require('../middleware/helmet');
const { requestId } = require('../middleware/requestId');
const { apiRateLimiter } = require('../middleware/rateLimiter');

class Application {
  constructor() {
    this.app = express();
    this.logger = new Logger();
    this.database = new Database();

    // 加载环境变量
    dotenv.config();

    this.port = process.env.PORT || 3000;
    this.nodeEnv = process.env.NODE_ENV || 'development';
  }

  /**
   * 初始化应用
   */
  async initialize() {
    try {
      // 处理未捕获的异常
      handleUncaughtExceptions();

      // 初始化数据库
      await this.database.initialize();

      // 配置基础中间件
      this.configureMiddleware();

      // 配置路由
      this.configureRoutes();

      // 配置错误处理
      this.configureErrorHandling();

      this.logger.info('应用初始化完成');
      return true;
    } catch (error) {
      this.logger.error('应用初始化失败:', error);
      throw error;
    }
  }

  /**
   * 配置基础中间件
   */
  configureMiddleware() {
    // 请求ID中间件（最先执行）
    this.app.use(requestId());

    // 安全头部中间件
    this.app.use(securityHeaders({
      contentSecurityPolicy: this.nodeEnv === 'production'
    }));

    // 速率限制中间件
    this.app.use(apiRateLimiter);

    // CORS配置
    this.app.use(cors({
      origin: this.nodeEnv === 'production'
        ? process.env.CORS_ORIGINS?.split(',') || false
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'cross-origin-resource-policy',
        'token',
        'Token',
        'x-token',
        'X-Token',
        'Access-Control-Allow-Headers',
        'Origin',
        'Accept'
      ],
      exposedHeaders: ['token', 'Token', 'Authorization', 'X-Request-ID'],
      optionsSuccessStatus: 200
    }));

    // 解析请求体（增加安全限制）
    this.app.use(express.json({
      limit: '10mb',
      strict: true,
      reviver: (key, value) => {
        // 防止原型污染
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined;
        }
        return value;
      }
    }));
    this.app.use(express.urlencoded({
      extended: true,
      limit: '10mb',
      parameterLimit: 100
    }));

    // 统一响应格式中间件
    this.app.use(Response.middleware());

    // 数据清理中间件
    this.app.use(dataSanitizer);

    // 请求日志中间件
    this.app.use((req, res, next) => {
      const startTime = Date.now();

      // 记录请求日志
      this.logger.info(`${req.method} ${req.originalUrl}`, {
        requestId: req.requestId,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        contentLength: req.get('Content-Length') || 0
      });

      // 响应结束时记录响应时间
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

        this.logger[logLevel](`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
          requestId: req.requestId,
          statusCode: res.statusCode,
          responseTime: duration,
          contentLength: res.get('Content-Length') || 0
        });
      });

      next();
    });

    // 预检请求处理
    this.app.options('*', cors());
  }

  /**
   * 配置路由
   */
  configureRoutes() {
    // 健康检查
    this.app.get('/', (req, res) => {
      res.success({
        message: '全栈应用后端API',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        docs: '/templateCms/web/swagger-ui/'
      });
    });

    // 健康检查端点
    this.app.get('/health', async (req, res) => {
      try {
        const { healthChecker } = require('../utils/healthCheck');

        // 注册数据库健康检查
        if (this.database) {
          healthChecker.registerDatabaseCheck(this.database);
        }

        const healthStatus = await healthChecker.runAllChecks();
        const systemInfo = healthChecker.getSystemInfo();

        const response = {
          ...healthStatus,
          system: systemInfo
        };

        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json({
          success: healthStatus.status === 'healthy',
          data: response,
          message: `System is ${healthStatus.status}`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          error: {
            code: 'HEALTH_CHECK_FAILED',
            message: 'Health check execution failed'
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    // API路由
    const routes = require('../routes');
    this.app.use('/templateCms/web', routes);
  }

  /**
   * 配置错误处理
   */
  configureErrorHandling() {
    // 404处理
    this.app.use('*', notFoundHandler);

    // 全局错误处理
    this.app.use(errorHandler);
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        const server = this.app.listen(this.port, (err) => {
          if (err) {
            reject(err);
            return;
          }

          this.logger.info('\n🎉 服务器启动成功！');
          this.logger.info(`🚀 服务器运行在端口: ${this.port}`);
          this.logger.info(`🌍 环境: ${this.nodeEnv}`);
          this.logger.info(`📊 API地址: http://localhost:${this.port}/`);
          this.logger.info(`📚 API文档: http://localhost:${this.port}/templateCms/web/swagger-ui/`);

          resolve(server);
        });

        // 优雅关闭处理
        process.on('SIGTERM', () => {
          this.logger.info('收到SIGTERM信号，正在关闭服务器...');
          server.close(() => {
            this.logger.info('服务器已关闭');
            process.exit(0);
          });
        });

        process.on('SIGINT', () => {
          this.logger.info('收到SIGINT信号，正在关闭服务器...');
          server.close(() => {
            this.logger.info('服务器已关闭');
            process.exit(0);
          });
        });
      });
    } catch (error) {
      this.logger.error('❌ 服务器启动失败:', error);
      throw error;
    }
  }

  /**
   * 获取Express应用实例
   */
  getApp() {
    return this.app;
  }
}

module.exports = Application;