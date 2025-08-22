/**
 * API接口测试脚本
 * 用于验证重构后的接口功能是否正常
 */

const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000/templateCms/web';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * 执行测试用例
 */
async function runTest(name, testFn) {
  testResults.total++;
  console.log(`\n🧪 测试: ${name}`);
  
  try {
    await testFn();
    testResults.passed++;
    console.log(`✅ ${name} - 通过`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.log(`❌ ${name} - 失败: ${error.message}`);
  }
}

/**
 * 测试健康检查接口
 */
async function testHealthCheck() {
  const response = await api.get('/health');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('健康检查返回失败状态');
  }
}

/**
 * 测试系统信息接口
 */
async function testSystemInfo() {
  const response = await api.get('/info');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('系统信息返回失败状态');
  }
}

/**
 * 测试枚举接口
 */
async function testEnumEndpoints() {
  // 测试获取所有枚举
  const allEnumsResponse = await api.get('/enum/all');
  if (allEnumsResponse.status !== 200) {
    throw new Error(`获取所有枚举失败，状态码: ${allEnumsResponse.status}`);
  }

  // 测试获取枚举类型列表
  const typesResponse = await api.get('/enum/types');
  if (typesResponse.status !== 200) {
    throw new Error(`获取枚举类型失败，状态码: ${typesResponse.status}`);
  }

  // 测试获取特定枚举
  const exerciseStatusResponse = await api.get('/enum/exerciseStatus');
  if (exerciseStatusResponse.status !== 200) {
    throw new Error(`获取动作状态枚举失败，状态码: ${exerciseStatusResponse.status}`);
  }
}

/**
 * 测试首页接口
 */
async function testHomeEndpoints() {
  // 测试欢迎接口
  const welcomeResponse = await api.get('/home/welcome');
  if (welcomeResponse.status !== 200) {
    throw new Error(`欢迎接口失败，状态码: ${welcomeResponse.status}`);
  }

  // 测试系统信息接口
  const systemInfoResponse = await api.get('/home/system-info');
  if (systemInfoResponse.status !== 200) {
    throw new Error(`系统信息接口失败，状态码: ${systemInfoResponse.status}`);
  }

  // 测试健康检查接口
  const healthResponse = await api.get('/home/health');
  if (healthResponse.status !== 200) {
    throw new Error(`健康检查接口失败，状态码: ${healthResponse.status}`);
  }
}

/**
 * 测试动作资源接口（需要认证，这里只测试结构）
 */
async function testExerciseEndpoints() {
  try {
    // 测试分页查询接口（不需要认证的话）
    const pageResponse = await api.get('/exercise/page?pageIndex=1&pageSize=5');
    // 如果需要认证，会返回401，这是正常的
    if (pageResponse.status === 401) {
      console.log('  ℹ️  动作资源接口需要认证（正常）');
      return;
    }
    if (pageResponse.status !== 200) {
      throw new Error(`动作资源分页接口异常，状态码: ${pageResponse.status}`);
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('  ℹ️  动作资源接口需要认证（正常）');
      return;
    }
    throw error;
  }
}

/**
 * 测试音频资源接口
 */
async function testSoundEndpoints() {
  try {
    const pageResponse = await api.get('/sound/page?pageIndex=1&pageSize=5');
    if (pageResponse.status === 401) {
      console.log('  ℹ️  音频资源接口需要认证（正常）');
      return;
    }
    if (pageResponse.status !== 200) {
      throw new Error(`音频资源分页接口异常，状态码: ${pageResponse.status}`);
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('  ℹ️  音频资源接口需要认证（正常）');
      return;
    }
    throw error;
  }
}

/**
 * 测试Swagger文档接口
 */
async function testSwaggerEndpoints() {
  // 测试Swagger JSON
  const swaggerJsonResponse = await api.get('/swagger.json');
  if (swaggerJsonResponse.status !== 200) {
    throw new Error(`Swagger JSON接口失败，状态码: ${swaggerJsonResponse.status}`);
  }

  // 验证返回的是有效的JSON
  if (!swaggerJsonResponse.data || typeof swaggerJsonResponse.data !== 'object') {
    throw new Error('Swagger JSON返回的不是有效的JSON对象');
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('🚀 开始API接口测试...\n');
  console.log(`📍 测试目标: ${BASE_URL}`);

  // 基础接口测试
  await runTest('健康检查接口', testHealthCheck);
  await runTest('系统信息接口', testSystemInfo);
  await runTest('Swagger文档接口', testSwaggerEndpoints);

  // 业务接口测试
  await runTest('枚举接口', testEnumEndpoints);
  await runTest('首页接口', testHomeEndpoints);
  await runTest('动作资源接口', testExerciseEndpoints);
  await runTest('音频资源接口', testSoundEndpoints);

  // 输出测试结果
  console.log('\n📊 测试结果统计:');
  console.log(`总计: ${testResults.total}`);
  console.log(`通过: ${testResults.passed} ✅`);
  console.log(`失败: ${testResults.failed} ❌`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`\n成功率: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！接口恢复成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关接口');
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ 测试执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};
