/**
 * 接口级别参数校验示例
 * 展示如何使用基于接口的参数校验功能
 */

const { validateApiData, preprocessData, addApiValidationConfig } = require('../utils/validator');

console.log('📝 接口级别参数校验示例\n');

// ===== 示例1：应用信息创建接口验证 =====
console.log('1. 应用信息创建接口验证 (app_info.create)');

// 正确的数据
const validCreateData = {
  app_icon: 'https://example.com/icon.png',
  app_store_name: '全栈应用系统',
  app_code: 'fullstack-app'
};

const createResult = validateApiData('app_info.create', validCreateData);
console.log('✅ 创建接口验证结果:', createResult);

// 错误的数据 - 缺少必填字段
const invalidCreateData = {
  app_icon: 'invalid-url',  // 无效URL
  // 缺少 app_store_name 必填字段
  app_code: 'test'
};

const invalidCreateResult = validateApiData('app_info.create', invalidCreateData);
console.log('❌ 创建接口验证结果:', invalidCreateResult);

// ===== 示例2：应用信息更新接口验证 =====
console.log('\n2. 应用信息更新接口验证 (app_info.update)');

// 更新时只提供部分字段 - 应该通过验证
const validUpdateData = {
  app_store_name: '新的应用名称'
  // 注意：没有提供 app_icon，更新操作应该允许
};

const updateResult = validateApiData('app_info.update', validUpdateData);
console.log('✅ 更新接口验证结果:', updateResult);

// 更新时提供无效数据 - 应该失败
const invalidUpdateData = {
  app_icon: 'invalid-url',  // 无效URL
  app_store_name: 'a'.repeat(300)  // 超长字符串
};

const invalidUpdateResult = validateApiData('app_info.update', invalidUpdateData);
console.log('❌ 更新接口验证结果:', invalidUpdateResult);

// ===== 示例3：用户注册接口验证 =====
console.log('\n3. 用户注册接口验证 (user.register)');

const validUserData = {
  email: 'user@example.com',
  username: 'testuser',
  password: '123456'
};

const userResult = validateApiData('user.register', validUserData);
console.log('✅ 用户注册验证结果:', userResult);

// ===== 示例4：用户更新接口验证 =====
console.log('\n4. 用户更新接口验证 (user.update)');

const userUpdateData = {
  email: 'newemail@example.com'
  // 只更新邮箱，其他字段不变
};

const userUpdateResult = validateApiData('user.update', userUpdateData);
console.log('✅ 用户更新验证结果:', userUpdateResult);

// ===== 示例5：自定义接口验证配置 =====
console.log('\n5. 自定义接口验证配置');

// 添加自定义接口验证配置
addApiValidationConfig('custom.create', {
  title: [
    { rule: 'required', message: '标题' },
    { rule: 'length', params: [1, 100], message: '标题' }
  ],
  content: [
    { rule: 'required', message: '内容' },
    { rule: 'length', params: [10, 1000], message: '内容' }
  ],
  status: [
    { rule: 'enum', params: [['draft', 'published', 'archived']], message: '状态' }
  ]
});

const customData = {
  title: '测试标题',
  content: '这是一个测试内容，长度应该满足要求',
  status: 'draft'
};

const customResult = validateApiData('custom.create', customData);
console.log('✅ 自定义接口验证结果:', customResult);

// ===== 示例6：数据预处理 + 验证 =====
console.log('\n6. 数据预处理 + 验证');

const rawData = {
  name: '  帮助文档  ',  // 有空格
  url: 'https://example.com/help',
  description: '',      // 空字符串
  tags: null           // null值
};

console.log('原始数据:', rawData);

const processedData = preprocessData(rawData);
console.log('预处理后:', processedData);

const helpResult = validateApiData('app_help.create', processedData);
console.log('✅ 预处理后验证结果:', helpResult);

// ===== 示例7：批量接口验证 =====
console.log('\n7. 批量接口验证');

const batchApis = [
  { api: 'app_info.create', data: { app_icon: 'https://test.com/icon.png', app_store_name: '测试应用' } },
  { api: 'app_help.create', data: { name: '帮助', url: 'https://help.com' } },
  { api: 'user.register', data: { email: 'test@test.com', username: 'test', password: '123456' } }
];

console.log('批量验证结果:');
batchApis.forEach(({ api, data }, index) => {
  const result = validateApiData(api, data);
  console.log(`  接口${index + 1} (${api}):`, result.valid ? '✅ 通过' : `❌ 失败 - ${result.errors.join(', ')}`);
});

// ===== 示例8：验证不存在的接口 =====
console.log('\n8. 验证不存在的接口');

const unknownResult = validateApiData('unknown.api', { test: 'data' });
console.log('✅ 未知接口验证结果:', unknownResult); // 应该返回 valid: true

console.log('\n🎉 接口级别参数校验示例完成！');

module.exports = {
  // 导出示例函数供其他地方使用
  validateAppInfoCreate: (data) => validateApiData('app_info.create', data),
  validateAppInfoUpdate: (data) => validateApiData('app_info.update', data),
  validateUserRegister: (data) => validateApiData('user.register', data),
  validateUserUpdate: (data) => validateApiData('user.update', data)
};
