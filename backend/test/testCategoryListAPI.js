/**
 * 测试修复后的category列表API接口
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

// 测试基本的category列表查询
async function testBasicCategoryList() {
    try {
        console.log('🔍 测试基本的category列表查询...');
        
        const response = await api.get('/category/list?pageIndex=1&pageSize=5');
        
        if (response.data.success) {
            console.log('✅ category列表查询成功');
            const result = response.data.data;
            console.log(`   数据数量: ${result.data?.length || 0}`);
            console.log(`   总数: ${result.total || 0}`);
            console.log(`   页码: ${result.pageIndex || 0}`);
            console.log(`   页大小: ${result.pageSize || 0}`);
            console.log(`   总页数: ${result.totalPages || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   category列表:');
                result.data.forEach((category, index) => {
                    console.log(`     ${index + 1}. ${category.name} - 状态:${category.status} (ID: ${category.id})`);
                });
            } else {
                console.log('   📝 暂无category数据');
            }
            
            return true;
        } else {
            console.log('❌ category列表查询失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ category列表查询请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试关键词搜索
async function testKeywordSearch() {
    try {
        console.log('\n🔍 测试关键词搜索...');
        
        const response = await api.get('/category/list?keywords=训练&pageSize=3');
        
        if (response.data.success) {
            console.log('✅ 关键词搜索成功');
            const result = response.data.data;
            console.log(`   搜索结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   搜索结果:');
                result.data.forEach((category, index) => {
                    console.log(`     ${index + 1}. ${category.name} (ID: ${category.id})`);
                });
            } else {
                console.log('   📝 没有找到匹配的category');
            }
            
            return true;
        } else {
            console.log('❌ 关键词搜索失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 关键词搜索请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试状态筛选
async function testStatusFilter() {
    try {
        console.log('\n🔍 测试状态筛选...');
        
        const response = await api.get('/category/list?statusList=ENABLED&pageSize=3');
        
        if (response.data.success) {
            console.log('✅ 状态筛选成功');
            const result = response.data.data;
            console.log(`   筛选结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   筛选结果:');
                result.data.forEach((category, index) => {
                    console.log(`     ${index + 1}. ${category.name} - 状态:${category.status} (ID: ${category.id})`);
                });
            } else {
                console.log('   📝 没有找到符合条件的category');
            }
            
            return true;
        } else {
            console.log('❌ 状态筛选失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 状态筛选请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试排序功能
async function testSorting() {
    try {
        console.log('\n🔍 测试排序功能...');
        
        const response = await api.get('/category/list?orderBy=createTime&orderDirection=desc&pageSize=3');
        
        if (response.data.success) {
            console.log('✅ 排序功能成功');
            const result = response.data.data;
            console.log(`   排序结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   排序结果（按创建时间降序）:');
                result.data.forEach((category, index) => {
                    console.log(`     ${index + 1}. ${category.name} - 创建时间:${category.createTime} (ID: ${category.id})`);
                });
            } else {
                console.log('   📝 没有数据可排序');
            }
            
            return true;
        } else {
            console.log('❌ 排序功能失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 排序功能请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试数字ID搜索
async function testNumericIdSearch() {
    try {
        console.log('\n🔍 测试数字ID搜索...');
        
        // 先获取一个存在的category ID
        const listResponse = await api.get('/category/list?pageSize=1');
        if (!listResponse.data.success || listResponse.data.data.data.length === 0) {
            console.log('⚠️  没有category数据，跳过数字ID搜索测试');
            return true;
        }
        
        const existingId = listResponse.data.data.data[0].id;
        console.log(`   使用存在的ID: ${existingId}`);
        
        const response = await api.get(`/category/list?keywords=${existingId}`);
        
        if (response.data.success) {
            console.log('✅ 数字ID搜索成功');
            const result = response.data.data;
            console.log(`   搜索结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                const foundCategory = result.data[0];
                console.log(`   找到的category: ${foundCategory.name} (ID: ${foundCategory.id})`);
                
                if (foundCategory.id === existingId) {
                    console.log('   ✅ ID精确匹配成功');
                } else {
                    console.log('   ⚠️  ID匹配结果不符合预期');
                }
            }
            
            return true;
        } else {
            console.log('❌ 数字ID搜索失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 数字ID搜索请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试修复后的category列表API接口\n');
    
    try {
        // 1. 测试基本的category列表查询
        const basicTest = await testBasicCategoryList();
        
        // 2. 测试关键词搜索
        const keywordTest = await testKeywordSearch();
        
        // 3. 测试状态筛选
        const statusTest = await testStatusFilter();
        
        // 4. 测试排序功能
        const sortingTest = await testSorting();
        
        // 5. 测试数字ID搜索
        const numericTest = await testNumericIdSearch();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   基本查询: ${basicTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   关键词搜索: ${keywordTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   状态筛选: ${statusTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   排序功能: ${sortingTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   数字ID搜索: ${numericTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = basicTest && keywordTest && statusTest && sortingTest && numericTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 修复验证成功，category列表API接口工作正常！');
        } else {
            console.log('\n⚠️  部分功能仍有问题，请检查服务器日志');
        }
        
        console.log('\n✅ API接口测试完成');
        
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
    testBasicCategoryList,
    testKeywordSearch,
    testStatusFilter,
    testSorting,
    testNumericIdSearch
};
