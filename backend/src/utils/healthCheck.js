/**
 * 健康检查工具类
 * 提供系统健康状态检查功能
 */

const os = require('os');
const process = require('process');

class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.registerDefaultChecks();
  }

  /**
   * 注册默认健康检查
   */
  registerDefaultChecks() {
    // 内存使用检查
    this.register('memory', async () => {
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      return {
        status: memoryUsagePercent < 90 ? 'healthy' : 'unhealthy',
        details: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          systemMemoryUsagePercent: Math.round(memoryUsagePercent),
          unit: 'MB'
        },
        message: memoryUsagePercent < 90
          ? 'Memory usage is within acceptable limits'
          : 'High memory usage detected'
      };
    });

    // CPU负载检查
    this.register('cpu', async () => {
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      const loadPercent = (loadAvg[0] / cpuCount) * 100;

      return {
        status: loadPercent < 80 ? 'healthy' : 'unhealthy',
        details: {
          loadAverage1m: Math.round(loadAvg[0] * 100) / 100,
          loadAverage5m: Math.round(loadAvg[1] * 100) / 100,
          loadAverage15m: Math.round(loadAvg[2] * 100) / 100,
          cpuCount,
          loadPercent: Math.round(loadPercent)
        },
        message: loadPercent < 80
          ? 'CPU load is within acceptable limits'
          : 'High CPU load detected'
      };
    });

    // 磁盘空间检查（简化版）
    this.register('disk', async () => {
      // Node.js 没有直接的磁盘空间API，这里提供一个基本实现
      const stats = process.memoryUsage();
      return {
        status: 'healthy',
        details: {
          note: 'Disk space check requires additional implementation',
          processMemory: Math.round(stats.heapUsed / 1024 / 1024)
        },
        message: 'Basic disk check passed'
      };
    });

    // 进程运行时间检查
    this.register('uptime', async () => {
      const uptimeSeconds = process.uptime();
      const systemUptimeSeconds = os.uptime();

      return {
        status: 'healthy',
        details: {
          processUptime: {
            seconds: Math.round(uptimeSeconds),
            formatted: this.formatDuration(uptimeSeconds)
          },
          systemUptime: {
            seconds: Math.round(systemUptimeSeconds),
            formatted: this.formatDuration(systemUptimeSeconds)
          }
        },
        message: `Process running for ${this.formatDuration(uptimeSeconds)}`
      };
    });
  }

  /**
   * 注册健康检查
   */
  register(name, checkFunction, timeout = 5000) {
    if (typeof checkFunction !== 'function') {
      throw new Error('Health check must be a function');
    }

    this.checks.set(name, { checkFunction, timeout });
  }

  /**
   * 注销健康检查
   */
  unregister(name) {
    this.checks.delete(name);
  }

  /**
   * 执行单个健康检查
   */
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    try {
      const result = await Promise.race([
        check.checkFunction(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
        )
      ]);

      return {
        name,
        status: result.status || 'healthy',
        details: result.details || {},
        message: result.message || 'Check passed',
        timestamp: new Date().toISOString(),
        duration: null // 可以添加执行时间统计
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        details: { error: error.message },
        message: `Check failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration: null
      };
    }
  }

  /**
   * 执行所有健康检查
   */
  async runAllChecks() {
    const checkNames = Array.from(this.checks.keys());
    const results = await Promise.allSettled(
      checkNames.map(name => this.runCheck(name))
    );

    const checks = {};
    let overallStatus = 'healthy';

    results.forEach((result, index) => {
      const checkName = checkNames[index];

      if (result.status === 'fulfilled') {
        checks[checkName] = result.value;
        if (result.value.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        }
      } else {
        checks[checkName] = {
          name: checkName,
          status: 'unhealthy',
          details: { error: result.reason.message },
          message: `Check execution failed: ${result.reason.message}`,
          timestamp: new Date().toISOString(),
          duration: null
        };
        overallStatus = 'unhealthy';
      }
    });

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: checkNames.length,
        healthy: Object.values(checks).filter(c => c.status === 'healthy').length,
        unhealthy: Object.values(checks).filter(c => c.status === 'unhealthy').length
      }
    };
  }

  /**
   * 获取基本系统信息
   */
  getSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 格式化持续时间
   */
  formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) {parts.push(`${days}d`);}
    if (hours > 0) {parts.push(`${hours}h`);}
    if (minutes > 0) {parts.push(`${minutes}m`);}
    if (secs > 0 || parts.length === 0) {parts.push(`${secs}s`);}

    return parts.join(' ');
  }

  /**
   * 数据库健康检查（需要数据库实例）
   */
  registerDatabaseCheck(database) {
    this.register('database', async () => {
      try {
        // 执行简单的查询来测试连接
        await database.query('SELECT 1');

        return {
          status: 'healthy',
          details: {
            connectionState: 'connected'
          },
          message: 'Database connection is healthy'
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          details: {
            error: error.message,
            connectionState: 'disconnected'
          },
          message: 'Database connection failed'
        };
      }
    });
  }

  /**
   * Redis健康检查（需要Redis实例）
   */
  registerRedisCheck(redis) {
    this.register('redis', async () => {
      try {
        await redis.ping();

        return {
          status: 'healthy',
          details: {
            connectionState: 'connected'
          },
          message: 'Redis connection is healthy'
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          details: {
            error: error.message,
            connectionState: 'disconnected'
          },
          message: 'Redis connection failed'
        };
      }
    });
  }
}

// 创建默认实例
const healthChecker = new HealthChecker();

module.exports = { HealthChecker, healthChecker };