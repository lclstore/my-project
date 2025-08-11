const express = require('express'); // 引入express
const cors = require('cors'); // 引入cors
const dotenv = require('dotenv'); // 引入dotenv
const userRoutes = require('./routes/user');  // 引入user路由
const fileRoutes = require('./routes/files'); // 引入文件路由
const dataRoutes = require('./routes/data'); // 引入数据路由
const enumRoutes = require('./routes/enums'); // 引入枚举路由
const { testConnection, initDatabase } = require('./config/database');   // 引入数据库配置
const { specs, swaggerUi, swaggerUiOptions } = require('./config/swagger'); // 引入Swagger配置

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// 中间件配置
app.use(cors({
  origin: true, // 允许的源
  credentials: true, // 允许发送cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // 允许的请求头
  optionsSuccessStatus: 200 // 支持旧版浏览器
}));

app.use(express.json()); // 解析JSON数据
app.use(express.urlencoded({ extended: true })); // 解析URL编码数据

// 处理预检请求
app.options('*', cors());

// 公共路径前缀（从环境变量读取）
const API_PREFIX = process.env.API_PREFIX || '/api';

// Swagger API文档路由
app.use(`${API_PREFIX}/swagger-ui`, swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// 路由配置
app.use(`${API_PREFIX}/user`, userRoutes);
app.use(`${API_PREFIX}/files`, fileRoutes);
app.use(`${API_PREFIX}/data`, dataRoutes);
app.use(`${API_PREFIX}/enums`, enumRoutes);

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
