/**
 * 测试category模块API接口
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

// 测试创建category
async function testCreateCategory() {
    try {
        console.log('🔍 测试创建category...');

        const testData = {
            name: "测试分类",
            description: "这是一个测试分类",
            status: "ENABLED",
            workoutList: [1, 2] // 假设这些workout ID存在
        };

        const response = await api.post('/category/save', testData);

        if (response.data.success) {
            console.log('✅ 创建category成功');
            console.log(`   category ID: ${response.data.data.id}`);
            return response.data.data.id;
        } else {
            console.log('❌ 创建category失败:', response.data.errMessage);
            return null;
        }
    } catch (error) {
        console.error('❌ 创建category请求失败:', error.response?.data || error.message);
        return null;
    }
}

// 测试查询category详情
async function testGetCategoryDetail(categoryId) {
    try {
        console.log('\n🔍 测试查询category详情...');

        const response = await api.get(`/category/detail/${categoryId}`);

        if (response.data.success) {
            console.log('✅ 查询category详情成功');
            const data = response.data.data;
            console.log(`   ID: ${data.id}`);
            console.log(`   名称: ${data.name}`);
            console.log(`   描述: ${data.description}`);
            console.log(`   状态: ${data.status}`);
            console.log(`   workout数量: ${data.workoutList?.length || 0}`);

            if (data.workoutList && data.workoutList.length > 0) {
                console.log('   关联的workout:');
                data.workoutList.forEach((workout, index) => {
                    console.log(`     ${index + 1}. ${workout.name} (ID: ${workout.id})`);
                });
            }

            return true;
        } else {
            console.log('❌ 查询category详情失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 查询category详情请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试分页查询category列表
async function testGetCategoryPage() {
    try {
        console.log('\n🔍 测试分页查询category列表...');

        const response = await api.get('/category/list?pageIndex=1&pageSize=5');

        if (response.data.success) {
            console.log('✅ 分页查询category列表成功');
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
            }

            return true;
        } else {
            console.log('❌ 分页查询category列表失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 分页查询category列表请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试关键词搜索
async function testKeywordSearch() {
    try {
        console.log('\n🔍 测试关键词搜索...');

        const response = await api.get('/category/list?keywords=测试&pageSize=3');

        if (response.data.success) {
            console.log('✅ 关键词搜索成功');
            const result = response.data.data;
            console.log(`   搜索结果数量: ${result.data?.length || 0}`);

            if (result.data && result.data.length > 0) {
                console.log('   搜索结果:');
                result.data.forEach((category, index) => {
                    console.log(`     ${index + 1}. ${category.name} (ID: ${category.id})`);
                });
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

// 测试修改category
async function testUpdateCategory(categoryId) {
    try {
        console.log('\n🔍 测试修改category...');

        const updateData = {
            id: categoryId,
            name: "修改后的测试分类",
            description: "这是修改后的描述",
            status: "DISABLED",
            workoutList: [1] // 修改关联的workout
        };

        const response = await api.post('/category/save', updateData);

        if (response.data.success) {
            console.log('✅ 修改category成功');
            console.log(`   category ID: ${response.data.data.id}`);
            return true;
        } else {
            console.log('❌ 修改category失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 修改category请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试启用category
async function testEnableCategory(categoryId) {
    try {
        console.log('\n🔍 测试启用category...');

        const response = await api.post('/category/enable', {
            idList: [categoryId]
        });

        if (response.data.success) {
            console.log('✅ 启用category成功');
            return true;
        } else {
            console.log('❌ 启用category失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 启用category请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试删除category
async function testDeleteCategory(categoryId) {
    try {
        console.log('\n🔍 测试删除category...');

        const response = await api.post('/category/del', {
            idList: [categoryId]
        });

        if (response.data.success) {
            console.log('✅ 删除category成功');
            console.log(`   删除数量: ${response.data.data.deletedCount}`);
            return true;
        } else {
            console.log('❌ 删除category失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 删除category请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category模块API接口\n');

    try {
        // 1. 测试创建category
        const categoryId = await testCreateCategory();
        if (!categoryId) {
            console.log('💥 创建category失败，终止测试');
            return;
        }

        // 2. 测试查询category详情
        await testGetCategoryDetail(categoryId);

        // 3. 测试分页查询category列表
        await testGetCategoryPage();

        // 4. 测试关键词搜索
        await testKeywordSearch();

        // 5. 测试修改category
        await testUpdateCategory(categoryId);

        // 6. 再次查询详情验证修改结果
        await testGetCategoryDetail(categoryId);

        // 7. 测试启用category
        await testEnableCategory(categoryId);

        // 8. 测试删除category
        await testDeleteCategory(categoryId);

        // 9. 验证删除结果
        console.log('\n🔍 验证删除结果...');
        const deleteVerify = await testGetCategoryDetail(categoryId);
        if (!deleteVerify) {
            console.log('✅ 逻辑删除验证成功，category已不可访问');
        }

        console.log('\n✅ category模块API接口测试完成');

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
    testCreateCategory,
    testGetCategoryDetail,
    testGetCategoryPage,
    testKeywordSearch,
    testUpdateCategory,
    testEnableCategory,
    testDeleteCategory
};
