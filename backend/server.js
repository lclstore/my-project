const express = require('express'); // 引入express
const cors = require('cors'); // 引入cors
const dotenv = require('dotenv'); // 引入dotenv
const userRoutes = require('./routes/user');  // 引入user路由
const fileRoutes = require('./routes/files'); // 引入文件路由
const dataRoutes = require('./routes/data'); // 引入数据路由
const enumRoutes = require('./routes/enum'); // 引入枚举路由
const homeRoutes = require('./routes/home'); // 引入首页路由
const publishRoutes = require('./routes/publish'); // 引入发布路由
const soundRoutes = require('./routes/sound'); // 引入音频资源路由
const exerciseRoutes = require('./routes/exercise'); // 引入动作资源路由
const workoutRoutes = require('./routes/workout'); // 引入workout路由
const workoutSettingsRoutes = require('./routes/workoutSettings'); // 引入训练设置路由
const programsRoutes = require('./routes/program'); // 引入programs路由
const templateRoutes = require('./routes/template'); // 引入template路由
const resourceRoutes = require('./routes/resource'); // 引入resource路由
const planReplaceSettingsRoutes = require('./routes/planReplaceSettings'); // 引入planReplaceSettings路由
const planNameSettingsRoutes = require('./routes/planNameSettings'); // 引入planNameSettings路由
const musicRoutes = require('./routes/music'); // 引入music路由
const playlistRoutes = require('./routes/playlist'); // 引入playlist路由
const opLogsRoutes = require('./routes/opLogs'); // 引入opLogs路由
const commonRoutes = require('./routes/common'); // 引入公共接口路由
const swaggerRoutes = require('./routes/swagger'); // 引入 Swagger 文档路由
const { testConnection, initDatabase } = require('./config/database');   // 引入数据库配置
const { specs, swaggerUi, swaggerUiOptions } = require('./config/swagger'); // 引入Swagger配置
const { createOpLogMiddleware } = require('./utils/opLogHelper'); // 引入操作日志中间件

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// 中间件配置
app.use(cors({
  origin: true, // 允许的源
  credentials: true, // 允许发送cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'cross-origin-resource-policy',
    'token', // 允许token请求头
    'Token', // 允许Token请求头（大写）
    'x-token', // 允许x-token请求头
    'X-Token',  // 允许X-Token请求头（大写）
    'Access-Control-Allow-Headers',
    'Origin',
    'Accept'
  ], // 允许的请求头
  exposedHeaders: ['token', 'Token', 'Authorization'], // 允许前端访问的响应头
  optionsSuccessStatus: 200 // 支持旧版浏览器
}));

app.use(express.json()); // 解析JSON数据
app.use(express.urlencoded({ extended: true })); // 解析URL编码数据

// 全局 JSON 响应处理中间件
app.use((req, res, next) => {
  // 设置默认响应头
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 重写 res.json 方法，确保始终返回正确的 JSON
  const originalJson = res.json;
  res.json = function (data) {
    // 确保 Content-Type 正确
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    // 确保数据是可序列化的
    try {
      if (typeof data === 'string') {
        // 如果传入的是字符串，尝试解析后再返回
        try {
          const parsed = JSON.parse(data);
          return originalJson.call(this, parsed);
        } catch (e) {
          // 如果解析失败，包装成对象
          return originalJson.call(this, { message: data });
        }
      }
      return originalJson.call(this, data);
    } catch (error) {
      console.error('JSON 序列化错误:', error);
      return originalJson.call(this, {
        success: false,
        errCode: 'JSON_SERIALIZE_ERROR',
        errMessage: '数据序列化失败'
      });
    }
  };

  next();
});

// 处理预检请求
app.options('*', cors());

// 启用操作日志中间件（必须在认证中间件之前）
app.use('/templateCms/web', createOpLogMiddleware({
  // 排除不需要记录日志的路径
  excludePaths: [
    '/health',
    '/ping',
    '/favicon.ico',
    '/templateCms/web/opLogs',    // 避免查询日志时产生新日志
    '/templateCms/web/user/login', // 登录接口
    '/templateCms/web/user/logout', // 登出接口
    '/templateCms/web/user/checkToken', // 令牌检查
    '/templateCms/web/enum',      // 枚举查询
    '/templateCms/web/data',      // 数据查询
    '/page',                      // 分页查询
    '/detail',                    // 详情查询
    '/list'                       // 列表查询
  ],

  // 只记录这些HTTP方法的请求
  includeMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
}));

// 全局认证中间件（会自动跳过公开路由）
const { verifyToken } = require('./middleware/auth');
app.use(verifyToken);

// 公共路径前缀（从环境变量读取）
const API_PREFIX = process.env.API_PREFIX || '/api';

// Swagger API文档路由
app.use(`${API_PREFIX}/swagger-ui`, swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// templateCms路由配置
app.use('/templateCms/web/user', userRoutes);
app.use('/templateCms/web/files', fileRoutes);
app.use('/templateCms/web/data', dataRoutes);
app.use('/templateCms/web/enum', enumRoutes);
app.use('/templateCms/web/home', homeRoutes);
app.use('/templateCms/web/publish', publishRoutes);
app.use('/templateCms/web/sound', soundRoutes);
app.use('/templateCms/web/exercise', exerciseRoutes);
app.use('/templateCms/web/workout', workoutRoutes);
app.use('/templateCms/web/category', require('./routes/category'));
app.use('/templateCms/web/program', programsRoutes);
app.use('/templateCms/web/template', templateRoutes);
app.use('/templateCms/web/resource', resourceRoutes);
app.use('/templateCms/web/planReplaceSettings', planReplaceSettingsRoutes);
app.use('/templateCms/web/planNameSettings', planNameSettingsRoutes);
app.use('/templateCms/web/music', musicRoutes);
app.use('/templateCms/web/playlist', playlistRoutes);
app.use('/templateCms/web/opLogs', opLogsRoutes);
app.use('/templateCms/web/workoutSettings', workoutSettingsRoutes);
app.use('/templateCms/web/common', commonRoutes);

// Swagger API 文档路由
app.use('/api-docs', swaggerRoutes);


// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '全栈应用后端API',
    version: '1.0.0',
    status: 'running',
    docs: `${API_PREFIX}/swagger-ui/index.html`
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const startServer = async () => {
  try {
    console.log('🔄 正在启动服务器...');

    // 测试数据库连接
    const dbConnected = await testConnection();

    if (dbConnected) {
      // 初始化数据库
      await initDatabase();
      console.log('✅ 数据库初始化完成');
    } else {
      console.log('⚠️  数据库连接失败，服务器将在无数据库模式下启动');
      console.log('💡 请检查MySQL服务是否启动，并确认数据库配置');
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log('\n🎉 服务器启动成功！');
      console.log(`🚀 服务器运行在端口: ${PORT}`);
      console.log(`📱 前端地址: ${process.env.FRONTEND_URL}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV}`);
      console.log(`📊 API地址: http://localhost:${PORT}/`);
      console.log(`📚 API文档: http://localhost:${PORT}${API_PREFIX}/swagger-ui/`);
      if (!dbConnected) {
        console.log('\n⚠️  注意: 数据库未连接，登录功能将不可用');
        console.log('📋 请启动MySQL服务并重启后端服务');
      }
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    console.log('\n🔧 故障排除建议:');
    console.log('1. 检查MySQL服务是否启动');
    console.log('2. 验证 .env 文件中的数据库配置');
    console.log('3. 确保数据库用户有足够权限');
    process.exit(1);
  }
};

startServer();
