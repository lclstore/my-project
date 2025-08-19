/**
 * 测试workout扩展查询条件
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

// 测试基本分页查询
async function testBasicPagination() {
    try {
        console.log('🔍 测试基本分页查询...');
        
        const response = await api.get('/workout/page?pageIndex=1&pageSize=5');
        
        if (response.data.success) {
            const result = response.data.data;
            console.log('✅ 基本分页查询成功');
            console.log(`   数据数量: ${result.data?.length || 0}`);
            console.log(`   总数: ${result.total || 0}`);
            console.log(`   页码: ${result.pageIndex || 0}`);
            console.log(`   页大小: ${result.pageSize || 0}`);
            console.log(`   总页数: ${result.totalPages || 0}`);
            
            if (result.data && result.data.length > 0) {
                const firstItem = result.data[0];
                console.log('   示例数据字段:');
                console.log(`     ID: ${firstItem.id}`);
                console.log(`     名称: ${firstItem.name}`);
                console.log(`     状态: ${firstItem.status}`);
                console.log(`     性别: ${firstItem.genderCode}`);
                console.log(`     难度: ${firstItem.difficultyCode}`);
                console.log(`     受伤类型: ${JSON.stringify(firstItem.injuredCodes)}`);
            }
            
            return true;
        } else {
            console.log('❌ 基本分页查询失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 基本分页查询测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试状态列表筛选
async function testStatusListFilter() {
    try {
        console.log('\n🔍 测试状态列表筛选...');
        
        const response = await api.get('/workout/page?statusList=ENABLED,DRAFT&pageSize=3');
        
        if (response.data.success) {
            const result = response.data.data;
            console.log('✅ 状态列表筛选成功');
            console.log(`   筛选结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   状态分布:');
                const statusCount = {};
                result.data.forEach(item => {
                    statusCount[item.status] = (statusCount[item.status] || 0) + 1;
                });
                Object.entries(statusCount).forEach(([status, count]) => {
                    console.log(`     ${status}: ${count}个`);
                });
            }
            
            return true;
        } else {
            console.log('❌ 状态列表筛选失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 状态列表筛选测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试性别编码筛选
async function testGenderCodesFilter() {
    try {
        console.log('\n🔍 测试性别编码筛选...');
        
        const response = await api.get('/workout/page?genderCodes=MALE&pageSize=3');
        
        if (response.data.success) {
            const result = response.data.data;
            console.log('✅ 性别编码筛选成功');
            console.log(`   筛选结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   性别分布:');
                const genderCount = {};
                result.data.forEach(item => {
                    genderCount[item.genderCode] = (genderCount[item.genderCode] || 0) + 1;
                });
                Object.entries(genderCount).forEach(([gender, count]) => {
                    console.log(`     ${gender}: ${count}个`);
                });
            }
            
            return true;
        } else {
            console.log('❌ 性别编码筛选失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 性别编码筛选测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试难度编码筛选
async function testDifficultyCodesFilter() {
    try {
        console.log('\n🔍 测试难度编码筛选...');
        
        const response = await api.get('/workout/page?difficultyCodes=BEGINNER,INTERMEDIATE&pageSize=3');
        
        if (response.data.success) {
            const result = response.data.data;
            console.log('✅ 难度编码筛选成功');
            console.log(`   筛选结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   难度分布:');
                const difficultyCount = {};
                result.data.forEach(item => {
                    difficultyCount[item.difficultyCode] = (difficultyCount[item.difficultyCode] || 0) + 1;
                });
                Object.entries(difficultyCount).forEach(([difficulty, count]) => {
                    console.log(`     ${difficulty}: ${count}个`);
                });
            }
            
            return true;
        } else {
            console.log('❌ 难度编码筛选失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 难度编码筛选测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试组合筛选
async function testCombinedFilters() {
    try {
        console.log('\n🔍 测试组合筛选...');
        
        const response = await api.get('/workout/page?statusList=ENABLED&genderCodes=MALE&difficultyCodes=BEGINNER&pageSize=5');
        
        if (response.data.success) {
            const result = response.data.data;
            console.log('✅ 组合筛选成功');
            console.log(`   筛选结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   筛选结果验证:');
                result.data.forEach((item, index) => {
                    console.log(`     ${index + 1}. ${item.name} - 状态:${item.status}, 性别:${item.genderCode}, 难度:${item.difficultyCode}`);
                });
            }
            
            return true;
        } else {
            console.log('❌ 组合筛选失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 组合筛选测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试关键词搜索与筛选组合
async function testKeywordsWithFilters() {
    try {
        console.log('\n🔍 测试关键词搜索与筛选组合...');
        
        const response = await api.get('/workout/page?keywords=训练&statusList=ENABLED&pageSize=3');
        
        if (response.data.success) {
            const result = response.data.data;
            console.log('✅ 关键词搜索与筛选组合成功');
            console.log(`   搜索结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   搜索结果:');
                result.data.forEach((item, index) => {
                    console.log(`     ${index + 1}. ${item.name} - 状态:${item.status}`);
                });
            }
            
            return true;
        } else {
            console.log('❌ 关键词搜索与筛选组合失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 关键词搜索与筛选组合测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试排序功能
async function testSorting() {
    try {
        console.log('\n🔍 测试排序功能...');
        
        const response = await api.get('/workout/page?orderBy=createTime&orderDirection=desc&pageSize=3');
        
        if (response.data.success) {
            const result = response.data.data;
            console.log('✅ 排序功能成功');
            console.log(`   排序结果数量: ${result.data?.length || 0}`);
            
            if (result.data && result.data.length > 0) {
                console.log('   排序结果（按创建时间降序）:');
                result.data.forEach((item, index) => {
                    console.log(`     ${index + 1}. ${item.name} - 创建时间:${item.createTime}`);
                });
            }
            
            return true;
        } else {
            console.log('❌ 排序功能失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 排序功能测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试workout扩展查询条件\n');
    
    try {
        // 1. 测试基本分页查询
        const basicTest = await testBasicPagination();
        
        // 2. 测试状态列表筛选
        const statusTest = await testStatusListFilter();
        
        // 3. 测试性别编码筛选
        const genderTest = await testGenderCodesFilter();
        
        // 4. 测试难度编码筛选
        const difficultyTest = await testDifficultyCodesFilter();
        
        // 5. 测试组合筛选
        const combinedTest = await testCombinedFilters();
        
        // 6. 测试关键词搜索与筛选组合
        const keywordsTest = await testKeywordsWithFilters();
        
        // 7. 测试排序功能
        const sortingTest = await testSorting();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   基本分页: ${basicTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   状态筛选: ${statusTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   性别筛选: ${genderTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   难度筛选: ${difficultyTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   组合筛选: ${combinedTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   关键词组合: ${keywordsTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   排序功能: ${sortingTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = basicTest && statusTest && genderTest && difficultyTest && 
                         combinedTest && keywordsTest && sortingTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        console.log('\n✅ workout扩展查询条件测试完成');
        
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
    testBasicPagination,
    testStatusListFilter,
    testGenderCodesFilter,
    testDifficultyCodesFilter,
    testCombinedFilters,
    testKeywordsWithFilters,
    testSorting
};
