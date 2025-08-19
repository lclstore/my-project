/**
 * 时间格式化测试
 */

const { convertToFrontendFormat, formatDateTime, isTimeField } = require('../utils/fieldConverter');

console.log('🕒 时间格式化测试\n');

// 测试1：时间格式化函数
console.log('1. 测试时间格式化函数');
const testDates = [
  new Date('2024-01-15T10:30:45.123Z'),
  '2024-01-15T10:30:45.123Z',
  '2024-01-15 10:30:45',
  null,
  undefined,
  'invalid-date'
];

testDates.forEach((date, index) => {
  const formatted = formatDateTime(date);
  console.log(`  测试${index + 1}: ${date} -> ${formatted}`);
});

// 测试2：时间字段识别
console.log('\n2. 测试时间字段识别');
const testFields = [
  'create_time',
  'update_time',
  'created_at',
  'updated_at',
  'login_time',
  'expire_time',
  'name',
  'email',
  'user_id'
];

testFields.forEach(field => {
  const isTime = isTimeField(field);
  console.log(`  ${field}: ${isTime ? '✅ 时间字段' : '❌ 非时间字段'}`);
});

// 测试3：数据库结果转换（模拟）
console.log('\n3. 测试数据库结果转换');

// 模拟单个对象
const singleRecord = {
  id: 1,
  app_store_name: '测试应用',
  create_time: '2024-01-15T10:30:45.123Z',
  update_time: '2024-01-15T15:20:30.456Z',
  user_id: 123
};

console.log('原始数据:', singleRecord);
const convertedSingle = convertToFrontendFormat(singleRecord);
console.log('转换后:', convertedSingle);

// 模拟数组数据
console.log('\n4. 测试数组数据转换');
const arrayData = [
  {
    id: 1,
    name: '帮助文档1',
    create_time: '2024-01-15T10:30:45.123Z',
    update_time: '2024-01-15T15:20:30.456Z'
  },
  {
    id: 2,
    name: '帮助文档2',
    create_time: '2024-01-16T09:15:20.789Z',
    update_time: null
  }
];

console.log('原始数组:', arrayData);
const convertedArray = convertToFrontendFormat(arrayData);
console.log('转换后数组:', convertedArray);

// 测试5：嵌套对象
console.log('\n5. 测试嵌套对象转换');
const nestedData = {
  user_info: {
    user_id: 1,
    user_name: '测试用户',
    create_time: '2024-01-15T10:30:45.123Z'
  },
  app_data: {
    app_name: '测试应用',
    publish_time: '2024-01-16T14:20:10.000Z'
  }
};

console.log('原始嵌套数据:', nestedData);
const convertedNested = convertToFrontendFormat(nestedData);
console.log('转换后嵌套数据:', convertedNested);

console.log('\n✅ 时间格式化测试完成！');
console.log('\n📝 预期结果:');
console.log('- 时间字段从 "2024-01-15T10:30:45.123Z" 转换为 "2024-01-15 10:30:45"');
console.log('- 字段名从 snake_case 转换为 camelCase');
console.log('- null 和 undefined 时间值保持不变');
