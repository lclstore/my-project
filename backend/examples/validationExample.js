/**
 * 参数校验示例
 * 展示如何使用统一的参数校验功能
 */

const { validateTableData, preprocessData, ValidationRules } = require('../utils/validator');

console.log('📝 参数校验示例\n');

// ===== 示例1：应用信息表验证 =====
console.log('1. 应用信息表验证');

// 正确的数据
const validAppInfo = {
  app_icon: 'https://example.com/icon.png',
  app_store_name: '全栈应用系统',
  app_code: 'fullstack-app'
};

const validResult = validateTableData('app_info', validAppInfo, 'insert');
console.log('✅ 正确数据验证结果:', validResult);

// 错误的数据
const invalidAppInfo = {
  app_icon: 'invalid-url',  // 无效URL
  app_store_name: '',       // 空字符串
  app_code: 'a'.repeat(300) // 超长字符串
};

const invalidResult = validateTableData('app_info', invalidAppInfo, 'insert');
console.log('❌ 错误数据验证结果:', invalidResult);

// ===== 示例2：帮助信息表验证 =====
console.log('\n2. 帮助信息表验证');

const validHelp = {
  name: '用户指南',
  url: 'https://example.com/help'
};

const validHelpResult = validateTableData('app_help', validHelp, 'insert');
console.log('✅ 帮助信息验证结果:', validHelpResult);

// ===== 示例3：数据预处理 =====
console.log('\n3. 数据预处理示例');

const rawData = {
  name: '  用户指南  ',  // 有空格
  url: 'https://example.com/help',
  empty_field: '',      // 空字符串
  null_field: null,     // null值
  undefined_field: undefined  // undefined值
};

const processedData = preprocessData(rawData);
console.log('原始数据:', rawData);
console.log('处理后数据:', processedData);

// ===== 示例4：更新操作验证 =====
console.log('\n4. 更新操作验证（部分字段）');

const updateData = {
  app_store_name: '新的应用名称'
  // 注意：没有提供 app_icon，更新操作应该允许
};

const updateResult = validateTableData('app_info', updateData, 'update');
console.log('✅ 更新操作验证结果:', updateResult);

// ===== 示例5：自定义验证规则 =====
console.log('\n5. 自定义验证规则示例');

// 添加自定义验证规则
const { addValidationRule } = require('../utils/validator');

addValidationRule('custom_code', (value, fieldName) => {
  if (!/^[A-Z][A-Z0-9_]*$/.test(value)) {
    return { 
      valid: false, 
      message: `${fieldName}必须以大写字母开头，只能包含大写字母、数字和下划线` 
    };
  }
  return { valid: true };
});

// 测试自定义规则
const customResult = ValidationRules.custom_code('VALID_CODE', '自定义代码');
console.log('✅ 自定义规则测试（有效）:', customResult);

const customInvalidResult = ValidationRules.custom_code('invalid_code', '自定义代码');
console.log('❌ 自定义规则测试（无效）:', customInvalidResult);

// ===== 示例6：批量验证 =====
console.log('\n6. 批量数据验证');

const batchData = [
  { name: '帮助1', url: 'https://example.com/help1' },
  { name: '帮助2', url: 'invalid-url' },  // 无效URL
  { name: '', url: 'https://example.com/help3' }  // 空名称
];

console.log('批量验证结果:');
batchData.forEach((data, index) => {
  const result = validateTableData('app_help', data, 'insert');
  console.log(`  数据${index + 1}:`, result.valid ? '✅ 通过' : `❌ 失败 - ${result.errors.join(', ')}`);
});

console.log('\n🎉 参数校验示例完成！');

module.exports = {
  // 导出示例函数供其他地方使用
  validateAppInfo: (data) => validateTableData('app_info', data, 'insert'),
  validateHelp: (data) => validateTableData('app_help', data, 'insert'),
  preprocessData
};
