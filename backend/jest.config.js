module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // 覆盖率配置
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/config/**',
    '!src/storage/**',
    '!**/node_modules/**'
  ],

  // 覆盖率报告
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // 忽略的路径
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/storage/',
    '/uploads/'
  ],

  // 清理模拟
  clearMocks: true,
  restoreMocks: true,

  // 测试超时
  testTimeout: 30000,

  // 详细输出
  verbose: true,

  // 强制退出
  forceExit: true,

  // 检测打开的句柄
  detectOpenHandles: true
};