/**
 * 日志管理类
 * 提供统一的日志记录功能
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../storage/logs');
    this.ensureLogDirectory();
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 获取当前日期字符串
   */
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}\n`;
  }

  /**
   * 写入日志文件
   */
  writeToFile(level, message, meta = {}) {
    try {
      const filename = path.join(this.logDir, `${this.getCurrentDate()}-${level}.log`);
      const logMessage = this.formatMessage(level, message, meta);
      fs.appendFileSync(filename, logMessage);
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  /**
   * 控制台输出
   */
  consoleLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m', // 青色
      warn: '\x1b[33m', // 黄色
      error: '\x1b[31m', // 红色
      debug: '\x1b[90m', // 灰色
      success: '\x1b[32m' // 绿色
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';

    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`);

    if (metaStr) {
      console.log(`${color}${metaStr}${reset}`);
    }
  }

  /**
   * 信息日志
   */
  info(message, meta = {}) {
    this.consoleLog('info', message, meta);
    this.writeToFile('info', message, meta);
  }

  /**
   * 警告日志
   */
  warn(message, meta = {}) {
    this.consoleLog('warn', message, meta);
    this.writeToFile('warn', message, meta);
  }

  /**
   * 错误日志
   */
  error(message, meta = {}) {
    this.consoleLog('error', message, meta);
    this.writeToFile('error', message, meta);
  }

  /**
   * 调试日志
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog('debug', message, meta);
      this.writeToFile('debug', message, meta);
    }
  }

  /**
   * 成功日志
   */
  success(message, meta = {}) {
    this.consoleLog('success', message, meta);
    this.writeToFile('info', message, meta);
  }

  /**
   * 清理旧日志文件
   * @param {number} days - 保留天数
   */
  cleanOldLogs(days = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`删除旧日志文件: ${file}`);
        }
      });
    } catch (error) {
      this.error('清理旧日志文件失败:', { error: error.message });
    }
  }
}

module.exports = Logger;