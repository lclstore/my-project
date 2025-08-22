/**
 * 测试隐藏字段功能
 * 验证 is_deleted 字段是否被正确排除
 */

const BaseService = require('./src/core/BaseService');

// 创建一个测试服务
class TestService extends BaseService {
  constructor() {
    super({
      tableName: 'test_table',
      entityName: '测试',
      primaryKey: 'id',
      fieldMapping: {
        createTime: 'create_time',
        updateTime: 'update_time',
        isDeleted: 'is_deleted'
      }
    });
  }
}

// 测试数据
const testData = {
  id: 1,
  name: '测试项目',
  create_time: '2025-08-20 10:00:00',
  update_time: '2025-08-20 10:00:00',
  is_deleted: 0
};

const testDataArray = [
  {
    id: 1,
    name: '测试项目1',
    create_time: '2025-08-20 10:00:00',
    update_time: '2025-08-20 10:00:00',
    is_deleted: 0
  },
  {
    id: 2,
    name: '测试项目2',
    create_time: '2025-08-20 10:00:00',
    update_time: '2025-08-20 10:00:00',
    is_deleted: 1
  }
];

// 执行测试
function runTest() {
  console.log('=== 测试隐藏字段功能 ===\n');
  
  const testService = new TestService();
  
  console.log('1. 测试单个对象转换:');
  console.log('原始数据:', testData);
  const convertedSingle = testService.convertToFrontendFields(testData);
  console.log('转换后数据:', convertedSingle);
  console.log('is_deleted字段是否被隐藏:', !convertedSingle.hasOwnProperty('is_deleted') && !convertedSingle.hasOwnProperty('isDeleted'));
  console.log('');
  
  console.log('2. 测试数组转换:');
  console.log('原始数据:', testDataArray);
  const convertedArray = testService.convertToFrontendFields(testDataArray);
  console.log('转换后数据:', convertedArray);
  
  // 检查数组中的每个对象是否都隐藏了 is_deleted 字段
  const allHidden = convertedArray.every(item => 
    !item.hasOwnProperty('is_deleted') && !item.hasOwnProperty('isDeleted')
  );
  console.log('数组中所有对象的is_deleted字段是否都被隐藏:', allHidden);
  console.log('');
  
  console.log('3. 测试字段映射:');
  console.log('create_time 是否转换为 createTime:', convertedSingle.hasOwnProperty('createTime'));
  console.log('update_time 是否转换为 updateTime:', convertedSingle.hasOwnProperty('updateTime'));
  console.log('');
  
  console.log('=== 测试完成 ===');
}

// 运行测试
runTest();
