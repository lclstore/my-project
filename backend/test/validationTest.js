/**
 * 验证功能测试
 */

const { validateApiData } = require('../utils/validator');

console.log('🧪 验证功能测试 - 动态生成必填项消息\n');

// 测试1：应用信息创建 - 缺少必填字段
console.log('1. 测试应用信息创建 - 缺少必填字段');
const result1 = validateApiData('app_info.create', {
  app_code: 'test'
  // 缺少 app_icon 和 app_store_name
});
console.log('结果:', result1);
console.log('错误消息:', result1.errors);

// 测试2：帮助信息创建 - 缺少name字段
console.log('\n2. 测试帮助信息创建 - 缺少name字段');
const result2 = validateApiData('app_help', {
  url: 'https://example.com'
  // 缺少 name
});
console.log('结果:', result2);
console.log('错误消息:', result2.errors);

// 测试3：用户注册 - 缺少多个必填字段
console.log('\n3. 测试用户注册 - 缺少多个必填字段');
const result3 = validateApiData('user.register', {
  username: 'test'
  // 缺少 email 和 password
});
console.log('结果:', result3);
console.log('错误消息:', result3.errors);

// 测试4：变更日志创建 - 缺少所有必填字段
console.log('\n4. 测试变更日志创建 - 缺少所有必填字段');
const result4 = validateApiData('app_change_logs.create', {
  type: 'feature'
  // 缺少 version 和 content
});
console.log('结果:', result4);
console.log('错误消息:', result4.errors);

// 测试5：正确的数据
console.log('\n5. 测试正确的数据');
const result5 = validateApiData('app_help', {
  name: '帮助文档',
  url: 'https://example.com/help'
});
console.log('结果:', result5);

console.log('\n✅ 测试完成 - 可以看到所有必填项错误消息都是【字段名】为必填项的格式');
