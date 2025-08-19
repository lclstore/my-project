/**
 * 测试category实际返回的响应结构
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8080/api';
const API_TOKEN = 'test-token';

// 创建axios实例
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'token': API_TOKEN
    }
});

// 测试实际响应
async function testActualResponse() {
    try {
        console.log('🔍 测试category列表的实际响应...');
        
        const response = await api.get('/category/list');
        
        console.log('   完整响应分析:');
        console.log(`     HTTP状态: ${response.status}`);
        console.log(`     响应数据类型: ${typeof response.data}`);
        console.log(`     响应数据结构:`);
        
        if (typeof response.data === 'object') {
            console.log('     响应对象的属性:');
            Object.keys(response.data).forEach(key => {
                const value = response.data[key];
                console.log(`       ${key}: ${typeof value} ${Array.isArray(value) ? `(数组长度: ${value.length})` : `(值: ${value})`}`);
            });
            
            // 检查是否是success包装格式
            if (response.data.hasOwnProperty('success')) {
                console.log('\n   ⚠️  检测到success包装格式');
                console.log(`     success: ${response.data.success}`);
                console.log(`     data类型: ${typeof response.data.data}`);
                console.log(`     data是数组: ${Array.isArray(response.data.data)}`);
                
                if (Array.isArray(response.data.data)) {
                    console.log(`     data数组长度: ${response.data.data.length}`);
                    
                    if (response.data.data.length > 0) {
                        const firstItem = response.data.data[0];
                        console.log('     第一个元素的字段:');
                        Object.keys(firstItem).slice(0, 5).forEach(key => {
                            console.log(`       ${key}: ${typeof firstItem[key]}`);
                        });
                    }
                }
                
                console.log('\n   🔧 应该修复为直接返回数组');
                return false; // 结构不正确
            } else if (Array.isArray(response.data)) {
                console.log('\n   ✅ 正确的数组格式');
                console.log(`     数组长度: ${response.data.length}`);
                
                if (response.data.length > 0) {
                    const firstItem = response.data[0];
                    console.log('     第一个元素的字段:');
                    Object.keys(firstItem).slice(0, 5).forEach(key => {
                        console.log(`       ${key}: ${typeof firstItem[key]}`);
                    });
                }
                
                return true; // 结构正确
            } else {
                console.log('\n   ❌ 未知的响应格式');
                return false;
            }
        } else {
            console.log('   ❌ 响应不是对象类型');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 对比期望的响应格式
async function compareExpectedFormat() {
    try {
        console.log('\n🔍 对比期望的响应格式...');
        
        const response = await api.get('/category/list');
        
        console.log('   当前格式 vs 期望格式:');
        
        if (response.data.hasOwnProperty('success')) {
            console.log('   当前: {success: true, data: [...]}');
            console.log('   期望: [...]');
            console.log('   状态: ❌ 需要修复');
            
            console.log('\n   修复建议:');
            console.log('   1. 检查是否误用了sendSuccess()');
            console.log('   2. 确保使用res.json(processedData)');
            console.log('   3. processedData应该是数组');
            
            return false;
        } else if (Array.isArray(response.data)) {
            console.log('   当前: [...]');
            console.log('   期望: [...]');
            console.log('   状态: ✅ 格式正确');
            
            return true;
        } else {
            console.log('   当前: 未知格式');
            console.log('   期望: [...]');
            console.log('   状态: ❌ 格式错误');
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ 对比测试失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category实际响应结构\n');
    
    try {
        // 1. 测试实际响应
        const actualTest = await testActualResponse();
        
        // 2. 对比期望格式
        const compareTest = await compareExpectedFormat();
        
        // 总结
        console.log('\n📊 测试结果总结:');
        console.log(`   实际响应结构: ${actualTest ? '✅ 正确' : '❌ 错误'}`);
        console.log(`   格式对比: ${compareTest ? '✅ 符合期望' : '❌ 需要修复'}`);
        
        const allPassed = actualTest && compareTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部正确' : '❌ 需要修复'}`);
        
        if (allPassed) {
            console.log('\n🎉 category响应格式正确！');
            console.log('   ✅ 返回数组格式');
            console.log('   ✅ 字段转换正确');
        } else {
            console.log('\n⚠️  响应格式需要修复');
            console.log('   建议检查代码中的返回语句');
        }
        
        console.log('\n✅ 响应结构测试完成');
        
    } catch (error) {
        console.error('\n💥 测试过程中发生错误:', error);
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testActualResponse,
    compareExpectedFormat
};
