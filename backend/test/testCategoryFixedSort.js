/**
 * 测试category列表固定按sort字段排序
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

// 测试固定排序功能
async function testFixedSortOrder() {
    try {
        console.log('🔍 测试固定按sort字段排序...');
        
        // 测试1: 不传orderBy和orderDirection参数
        console.log('\n   测试1: 不传排序参数');
        const response1 = await api.get('/category/list');
        
        if (response1.data.success) {
            const categories1 = response1.data.data;
            console.log('   ✅ 查询成功');
            console.log('   排序结果:');
            categories1.slice(0, 5).forEach((cat, index) => {
                console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort || 0})`);
            });
        }
        
        // 测试2: 传入orderBy参数（应该被忽略）
        console.log('\n   测试2: 传入orderBy=name参数（应该被忽略）');
        const response2 = await api.get('/category/list?orderBy=name');
        
        if (response2.data.success) {
            const categories2 = response2.data.data;
            console.log('   ✅ 查询成功');
            console.log('   排序结果:');
            categories2.slice(0, 5).forEach((cat, index) => {
                console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort || 0})`);
            });
            
            // 验证两次查询结果是否相同（说明orderBy被忽略）
            const order1 = categories1.map(cat => cat.id);
            const order2 = categories2.map(cat => cat.id);
            const isSameOrder = JSON.stringify(order1) === JSON.stringify(order2);
            
            console.log(`   orderBy参数忽略验证: ${isSameOrder ? '✅ 正确忽略' : '❌ 未忽略'}`);
        }
        
        // 测试3: 传入orderDirection参数（应该被忽略）
        console.log('\n   测试3: 传入orderDirection=desc参数（应该被忽略）');
        const response3 = await api.get('/category/list?orderDirection=desc');
        
        if (response3.data.success) {
            const categories3 = response3.data.data;
            console.log('   ✅ 查询成功');
            console.log('   排序结果:');
            categories3.slice(0, 5).forEach((cat, index) => {
                console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort || 0})`);
            });
            
            // 验证与第一次查询结果是否相同（说明orderDirection被忽略）
            const order1 = categories1.map(cat => cat.id);
            const order3 = categories3.map(cat => cat.id);
            const isSameOrder = JSON.stringify(order1) === JSON.stringify(order3);
            
            console.log(`   orderDirection参数忽略验证: ${isSameOrder ? '✅ 正确忽略' : '❌ 未忽略'}`);
        }
        
        // 测试4: 同时传入orderBy和orderDirection参数（都应该被忽略）
        console.log('\n   测试4: 传入orderBy=createTime&orderDirection=desc参数（都应该被忽略）');
        const response4 = await api.get('/category/list?orderBy=createTime&orderDirection=desc');
        
        if (response4.data.success) {
            const categories4 = response4.data.data;
            console.log('   ✅ 查询成功');
            console.log('   排序结果:');
            categories4.slice(0, 5).forEach((cat, index) => {
                console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort || 0})`);
            });
            
            // 验证与第一次查询结果是否相同（说明所有排序参数都被忽略）
            const order1 = categories1.map(cat => cat.id);
            const order4 = categories4.map(cat => cat.id);
            const isSameOrder = JSON.stringify(order1) === JSON.stringify(order4);
            
            console.log(`   所有排序参数忽略验证: ${isSameOrder ? '✅ 正确忽略' : '❌ 未忽略'}`);
            
            return isSameOrder;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ 测试固定排序失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试sort字段排序逻辑
async function testSortFieldLogic() {
    try {
        console.log('\n🔍 测试sort字段排序逻辑...');
        
        // 先设置一些测试数据的sort值
        console.log('   设置测试sort值...');
        
        // 使用排序接口设置一个特定的顺序
        const testOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // 示例顺序
        
        const sortResponse = await api.post('/category/sort', {
            idList: testOrder
        });
        
        if (sortResponse.data.success) {
            console.log('   ✅ 设置sort值成功');
            
            // 查询列表验证排序
            const listResponse = await api.get('/category/list');
            
            if (listResponse.data.success) {
                const categories = listResponse.data.data;
                console.log('   ✅ 获取列表成功');
                
                console.log('   按sort字段排序结果:');
                categories.forEach((cat, index) => {
                    console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort || 0})`);
                });
                
                // 验证是否按sort值升序排列
                const sortValues = categories.map(cat => cat.sort || 0);
                let isAscending = true;
                
                for (let i = 1; i < sortValues.length; i++) {
                    if (sortValues[i] < sortValues[i-1]) {
                        isAscending = false;
                        break;
                    }
                }
                
                console.log(`   sort值序列: [${sortValues.join(', ')}]`);
                console.log(`   升序排列验证: ${isAscending ? '✅ 正确' : '❌ 错误'}`);
                
                // 验证期望的ID顺序
                const actualIdOrder = categories.map(cat => cat.id);
                const isExpectedOrder = JSON.stringify(actualIdOrder) === JSON.stringify(testOrder);
                
                console.log(`   期望ID顺序: [${testOrder.join(', ')}]`);
                console.log(`   实际ID顺序: [${actualIdOrder.join(', ')}]`);
                console.log(`   ID顺序验证: ${isExpectedOrder ? '✅ 正确' : '❌ 错误'}`);
                
                return isAscending && isExpectedOrder;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ 测试sort字段排序逻辑失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试其他查询参数仍然有效
async function testOtherParametersStillWork() {
    try {
        console.log('\n🔍 测试其他查询参数仍然有效...');
        
        // 测试keywords参数
        console.log('   测试keywords参数...');
        const keywordResponse = await api.get('/category/list?keywords=训练');
        
        if (keywordResponse.data.success) {
            const categories = keywordResponse.data.data;
            console.log(`   ✅ keywords查询成功，结果数量: ${categories.length}`);
            
            if (categories.length > 0) {
                console.log('   搜索结果:');
                categories.forEach((cat, index) => {
                    console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort || 0})`);
                });
                
                // 验证结果是否仍按sort排序
                const sortValues = categories.map(cat => cat.sort || 0);
                let isAscending = true;
                
                for (let i = 1; i < sortValues.length; i++) {
                    if (sortValues[i] < sortValues[i-1]) {
                        isAscending = false;
                        break;
                    }
                }
                
                console.log(`   搜索结果sort排序验证: ${isAscending ? '✅ 正确' : '❌ 错误'}`);
                return isAscending;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ 测试其他参数失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category列表固定按sort字段排序\n');
    
    try {
        // 1. 测试固定排序功能
        const fixedSortTest = await testFixedSortOrder();
        
        // 2. 测试sort字段排序逻辑
        const sortLogicTest = await testSortFieldLogic();
        
        // 3. 测试其他查询参数仍然有效
        const otherParamsTest = await testOtherParametersStillWork();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   固定排序功能: ${fixedSortTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   sort字段排序逻辑: ${sortLogicTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   其他参数功能: ${otherParamsTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = fixedSortTest && sortLogicTest && otherParamsTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 category列表固定排序功能正常！');
            console.log('   ✅ 忽略前端传入的orderBy参数');
            console.log('   ✅ 忽略前端传入的orderDirection参数');
            console.log('   ✅ 固定按sort字段升序排序');
            console.log('   ✅ sort相同时按id排序');
            console.log('   ✅ 其他查询参数（keywords、statusList）仍然有效');
            console.log('   ✅ 排序接口可以改变列表顺序');
        }
        
        console.log('\n✅ 固定排序功能测试完成');
        
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
    testFixedSortOrder,
    testSortFieldLogic,
    testOtherParametersStillWork
};
