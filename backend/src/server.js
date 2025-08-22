/**
 * 服务器入口文件
 * 启动应用程序
 */

const Application = require('./core/Application');
const config = require('./config');

async function startServer() {
  try {
    // 验证配置
    config.validateConfig();

    // 创建应用实例
    const app = new Application();

    // 启动服务器
    await app.start();

    // 进程信号处理
    const gracefulShutdown = (signal) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);

      // 可以在这里添加其他清理逻辑
      // 比如关闭数据库连接、清理临时文件等

      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();