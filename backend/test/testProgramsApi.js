/**
 * 测试Programs API接口
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const API_URL = `${BASE_URL}/program`;

// 测试数据
const testProgramsData = {
    name: '测试训练计划',
    description: '这是一个测试的训练计划',
    coverImgUrl: 'https://example.com/cover.jpg',
    detailImgUrl: 'https://example.com/detail.jpg',
    status: 'DRAFT',
    groupCode: 'GROUPA',
    showInPage: 1,
    workoutList: [1, 2, 3] // 假设存在这些workout ID
};

// 测试创建programs
async function testCreatePrograms() {
    try {
        console.log('🧪 测试创建programs...');

        const response = await axios.post(`${API_URL}/save`, testProgramsData);

        if (response.data.success) {
            console.log('✅ 创建programs成功');
            console.log(`   ID: ${response.data.data.id}`);
            return response.data.data.id;
        } else {
            console.log('❌ 创建programs失败:', response.data.message);
            return null;
        }

    } catch (error) {
        console.log('❌ 创建programs错误:', error.response?.data?.message || error.message);
        return null;
    }
}

// 测试获取programs详情
async function testGetProgramsDetail(programsId) {
    try {
        console.log(`\n🧪 测试获取programs详情 (ID: ${programsId})...`);

        const response = await axios.get(`${API_URL}/detail/${programsId}`);

        if (response.data.success) {
            console.log('✅ 获取programs详情成功');
            console.log(`   名称: ${response.data.data.name}`);
            console.log(`   状态: ${response.data.data.status}`);
            console.log(`   Group Code: ${response.data.data.groupCode}`);
            console.log(`   展示状态: ${response.data.data.showInPage}`);
            console.log(`   关联workout数量: ${response.data.data.workoutList?.length || 0}`);
            return true;
        } else {
            console.log('❌ 获取programs详情失败:', response.data.message);
            return false;
        }

    } catch (error) {
        console.log('❌ 获取programs详情错误:', error.response?.data?.message || error.message);
        return false;
    }
}

// 测试分页查询programs
async function testGetProgramsPage() {
    try {
        console.log('\n🧪 测试分页查询programs...');

        const response = await axios.get(`${API_URL}/page`, {
            params: {
                pageSize: 5,
                pageIndex: 1,
                orderBy: 'createTime',
                orderDirection: 'desc'
            }
        });

        if (response.data.success) {
            console.log('✅ 分页查询programs成功');
            console.log(`   总数: ${response.data.total}`);
            console.log(`   当前页数据量: ${response.data.data.length}`);

            if (response.data.data.length > 0) {
                console.log('   前3条数据:');
                response.data.data.slice(0, 3).forEach((item, index) => {
                    console.log(`     ${index + 1}. ${item.name} (${item.status}) - Group: ${item.groupCode}`);
                });
            }
            return true;
        } else {
            console.log('❌ 分页查询programs失败:', response.data.message);
            return false;
        }

    } catch (error) {
        console.log('❌ 分页查询programs错误:', error.response?.data?.message || error.message);
        return false;
    }
}

// 测试关键词搜索
async function testKeywordSearch() {
    try {
        console.log('\n🧪 测试关键词搜索...');

        const response = await axios.get(`${API_URL}/page`, {
            params: {
                keywords: '训练',
                pageSize: 10,
                pageIndex: 1
            }
        });

        if (response.data.success) {
            console.log('✅ 关键词搜索成功');
            console.log(`   搜索结果数量: ${response.data.data.length}`);

            if (response.data.data.length > 0) {
                console.log('   搜索结果:');
                response.data.data.forEach((item, index) => {
                    console.log(`     ${index + 1}. ${item.name}`);
                });
            }
            return true;
        } else {
            console.log('❌ 关键词搜索失败:', response.data.message);
            return false;
        }

    } catch (error) {
        console.log('❌ 关键词搜索错误:', error.response?.data?.message || error.message);
        return false;
    }
}

// 测试修改programs
async function testUpdatePrograms(programsId) {
    try {
        console.log(`\n🧪 测试修改programs (ID: ${programsId})...`);

        const updateData = {
            id: programsId,
            name: '修改后的训练计划',
            description: '这是修改后的描述',
            status: 'ENABLED',
            groupCode: 'GROUPB',
            showInPage: 0
        };

        const response = await axios.post(`${API_URL}/save`, updateData);

        if (response.data.success) {
            console.log('✅ 修改programs成功');
            return true;
        } else {
            console.log('❌ 修改programs失败:', response.data.message);
            return false;
        }

    } catch (error) {
        console.log('❌ 修改programs错误:', error.response?.data?.message || error.message);
        return false;
    }
}

// 测试启用programs
async function testEnablePrograms(programsId) {
    try {
        console.log(`\n🧪 测试启用programs (ID: ${programsId})...`);

        const response = await axios.post(`${API_URL}/enable`, {
            idList: [programsId]
        });

        if (response.data.success) {
            console.log('✅ 启用programs成功');
            return true;
        } else {
            console.log('❌ 启用programs失败:', response.data.message);
            return false;
        }

    } catch (error) {
        console.log('❌ 启用programs错误:', error.response?.data?.message || error.message);
        return false;
    }
}

// 测试删除programs
async function testDeletePrograms(programsId) {
    try {
        console.log(`\n🧪 测试删除programs (ID: ${programsId})...`);

        const response = await axios.post(`${API_URL}/del`, {
            idList: [programsId]
        });

        if (response.data.success) {
            console.log('✅ 删除programs成功');
            return true;
        } else {
            console.log('❌ 删除programs失败:', response.data.message);
            return false;
        }

    } catch (error) {
        console.log('❌ 删除programs错误:', error.response?.data?.message || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试Programs API接口...\n');

    try {
        // 1. 测试创建programs
        const programsId = await testCreatePrograms();
        if (!programsId) {
            console.log('💥 创建programs失败，终止测试');
            return;
        }

        // 2. 测试查询programs详情
        await testGetProgramsDetail(programsId);

        // 3. 测试分页查询programs列表
        await testGetProgramsPage();

        // 4. 测试关键词搜索
        await testKeywordSearch();

        // 5. 测试修改programs
        await testUpdatePrograms(programsId);

        // 6. 再次查询详情验证修改结果
        await testGetProgramsDetail(programsId);

        // 7. 测试启用programs
        await testEnablePrograms(programsId);

        // 8. 测试删除programs
        await testDeletePrograms(programsId);

        // 9. 验证删除结果
        console.log('\n🔍 验证删除结果...');
        const deleteVerify = await testGetProgramsDetail(programsId);
        if (!deleteVerify) {
            console.log('✅ 逻辑删除验证成功，programs已不可访问');
        }

        console.log('\n✅ programs模块API接口测试完成');

    } catch (error) {
        console.error('💥 测试过程中发生错误:', error.message);
    }
}

// 运行测试
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    testCreatePrograms,
    testGetProgramsDetail,
    testGetProgramsPage,
    testUpdatePrograms,
    testDeletePrograms
};
