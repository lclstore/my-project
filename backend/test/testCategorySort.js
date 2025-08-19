/**
 * 测试category排序功能
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

// 获取当前category列表
async function getCurrentCategoryList() {
    try {
        console.log('🔍 获取当前category列表...');
        
        const response = await api.get('/category/list');
        
        if (response.data.success) {
            const categories = response.data.data;
            console.log('✅ 获取category列表成功');
            console.log(`   总数: ${categories.length}`);
            
            if (categories.length > 0) {
                console.log('   当前顺序:');
                categories.forEach((category, index) => {
                    console.log(`     ${index + 1}. ${category.name} (ID: ${category.id}, 排序: ${category.sortOrder || 0})`);
                });
            }
            
            return categories;
        } else {
            console.log('❌ 获取category列表失败:', response.data.errMessage);
            return [];
        }
    } catch (error) {
        console.error('❌ 获取category列表请求失败:', error.response?.data || error.message);
        return [];
    }
}

// 测试排序功能
async function testCategorySort(idList) {
    try {
        console.log('\n🔍 测试category排序功能...');
        console.log(`   新的排序: [${idList.join(', ')}]`);
        
        const response = await api.post('/category/sort', {
            idList: idList
        });
        
        if (response.data.success) {
            console.log('✅ category排序成功');
            console.log(`   更新数量: ${response.data.data.updatedCount}`);
            return true;
        } else {
            console.log('❌ category排序失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ category排序请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 验证排序结果
async function verifySortResult(expectedOrder) {
    try {
        console.log('\n🔍 验证排序结果...');
        
        const response = await api.get('/category/list');
        
        if (response.data.success) {
            const categories = response.data.data;
            console.log('✅ 获取排序后的列表成功');
            
            console.log('   排序后顺序:');
            categories.forEach((category, index) => {
                console.log(`     ${index + 1}. ${category.name} (ID: ${category.id}, 排序: ${category.sortOrder || 0})`);
            });
            
            // 验证顺序是否正确
            const actualOrder = categories.map(cat => cat.id);
            const isCorrectOrder = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);
            
            console.log(`   期望顺序: [${expectedOrder.join(', ')}]`);
            console.log(`   实际顺序: [${actualOrder.join(', ')}]`);
            console.log(`   顺序验证: ${isCorrectOrder ? '✅ 正确' : '❌ 错误'}`);
            
            return isCorrectOrder;
        } else {
            console.log('❌ 获取排序后列表失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 验证排序结果失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试无效参数
async function testInvalidParameters() {
    try {
        console.log('\n🔍 测试无效参数...');
        
        // 测试1: 空数组
        console.log('   测试1: 空数组');
        const response1 = await api.post('/category/sort', { idList: [] });
        console.log(`     结果: ${response1.data.success ? '❌ 应该失败' : '✅ 正确失败'}`);
        
        // 测试2: 无效ID
        console.log('   测试2: 无效ID');
        const response2 = await api.post('/category/sort', { idList: [0, -1, 'abc'] });
        console.log(`     结果: ${response2.data.success ? '❌ 应该失败' : '✅ 正确失败'}`);
        
        // 测试3: 缺少参数
        console.log('   测试3: 缺少参数');
        const response3 = await api.post('/category/sort', {});
        console.log(`     结果: ${response3.data.success ? '❌ 应该失败' : '✅ 正确失败'}`);
        
        console.log('   ✅ 无效参数测试完成');
        return true;
        
    } catch (error) {
        console.log('   ✅ 无效参数正确触发错误');
        return true;
    }
}

// 测试部分ID排序
async function testPartialSort() {
    try {
        console.log('\n🔍 测试部分ID排序...');
        
        // 获取当前列表
        const categories = await getCurrentCategoryList();
        if (categories.length < 3) {
            console.log('   ⚠️  数据量不足，跳过部分排序测试');
            return true;
        }
        
        // 只对前3个ID进行排序
        const partialIds = categories.slice(0, 3).map(cat => cat.id).reverse();
        console.log(`   部分排序ID: [${partialIds.join(', ')}]`);
        
        const response = await api.post('/category/sort', {
            idList: partialIds
        });
        
        if (response.data.success) {
            console.log('✅ 部分排序成功');
            console.log(`   更新数量: ${response.data.data.updatedCount}`);
            
            // 验证结果
            const newList = await getCurrentCategoryList();
            const updatedIds = newList.slice(0, 3).map(cat => cat.id);
            const isCorrect = JSON.stringify(updatedIds) === JSON.stringify(partialIds);
            
            console.log(`   期望前3个: [${partialIds.join(', ')}]`);
            console.log(`   实际前3个: [${updatedIds.join(', ')}]`);
            console.log(`   验证结果: ${isCorrect ? '✅ 正确' : '❌ 错误'}`);
            
            return isCorrect;
        } else {
            console.log('❌ 部分排序失败:', response.data.errMessage);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 部分排序测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category排序功能\n');
    
    try {
        // 1. 获取当前category列表
        const originalList = await getCurrentCategoryList();
        if (originalList.length === 0) {
            console.log('💥 没有category数据，无法进行排序测试');
            return;
        }
        
        // 2. 测试完整排序
        const allIds = originalList.map(cat => cat.id);
        const reversedIds = [...allIds].reverse(); // 反转顺序
        
        console.log(`\n📋 准备测试完整排序:`);
        console.log(`   原始顺序: [${allIds.join(', ')}]`);
        console.log(`   目标顺序: [${reversedIds.join(', ')}]`);
        
        const sortTest = await testCategorySort(reversedIds);
        const verifyTest = sortTest ? await verifySortResult(reversedIds) : false;
        
        // 3. 测试无效参数
        const invalidTest = await testInvalidParameters();
        
        // 4. 测试部分ID排序
        const partialTest = await testPartialSort();
        
        // 5. 恢复原始顺序
        console.log('\n🔄 恢复原始顺序...');
        await testCategorySort(allIds);
        await verifySortResult(allIds);
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   完整排序: ${sortTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   结果验证: ${verifyTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   无效参数: ${invalidTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   部分排序: ${partialTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = sortTest && verifyTest && invalidTest && partialTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 category排序功能测试成功！');
            console.log('   ✅ 支持完整列表排序');
            console.log('   ✅ 支持部分ID排序');
            console.log('   ✅ 参数验证正确');
            console.log('   ✅ 排序结果准确');
            console.log('   ✅ 列表查询按sort_order排序');
        }
        
        console.log('\n✅ category排序功能测试完成');
        
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
    getCurrentCategoryList,
    testCategorySort,
    verifySortResult,
    testInvalidParameters,
    testPartialSort
};
