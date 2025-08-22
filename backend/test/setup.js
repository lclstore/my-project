/**
 * Jest 测试设置文件
 * 全局测试配置和工具函数
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DB_NAME = 'test_database';

// 增加测试超时时间
jest.setTimeout(30000);

// 全局 beforeAll 设置
beforeAll(async () => {
  // 可以在这里初始化测试数据库连接等
});

// 全局 afterAll 清理
afterAll(async () => {
  // 清理测试数据、关闭数据库连接等
});

// 全局 beforeEach 设置
beforeEach(() => {
  // 每个测试前的设置
});

// 全局 afterEach 清理
afterEach(() => {
  // 每个测试后的清理
  jest.clearAllMocks();
});

// 模拟全局对象
global.console = {
  ...console,
  // 在测试中禁用某些日志输出
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// 工具函数：创建测试数据库连接
global.createTestDatabase = async () => {
  const mysql = require('mysql2/promise');
  const config = require('../src/config');

  return mysql.createConnection({
    ...config.database,
    database: 'test_database'
  });
};

// 工具函数：清理测试数据
global.cleanupTestData = async (connection, tables = []) => {
  if (tables.length === 0) {
    tables = ['users', 'categories', 'resources']; // 默认表
  }

  for (const table of tables) {
    await connection.execute(`DELETE FROM ${table}`);
  }
};

// 工具函数：创建测试用户
global.createTestUser = (overrides = {}) => {
  return {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    status: 1,
    type: 'user',
    ...overrides
  };
};

// 工具函数：模拟 JWT token
global.createTestToken = (payload = {}) => {
  const jwt = require('jsonwebtoken');
  const config = require('../src/config');

  return jwt.sign(
    {
      id: 1,
      email: 'test@example.com',
      type: 'user',
      ...payload
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

// 工具函数：模拟请求对象
global.mockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
};

// 工具函数：模拟响应对象
global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.success = jest.fn().mockReturnValue(res);
  res.error = jest.fn().mockReturnValue(res);
  return res;
};

// 工具函数：模拟 next 函数
global.mockNext = () => jest.fn();