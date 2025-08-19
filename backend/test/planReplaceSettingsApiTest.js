/**
 * PlanReplaceSettings API 测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const API_URL = `${BASE_URL}/planReplaceSettings`;

// 测试数据
const testPlanReplaceSettingsData = {
    name: '测试计划替换设置',
    description: '这是一个测试计划替换设置',
    status: 'DRAFT',
    ruleList: [
        {
            matchKey: 'GENDER',
            matchCondition: 'EQUALS',
            matchValue: 1,
            workoutList: [101, 102, 103]
        },
        {
            matchKey: 'USER',
            matchCondition: 'NOT_EQUALS',
            matchValue: 2,
            workoutList: [201, 202]
        }
    ]
};

let createdPlanReplaceSettingsId = null;

async function testPlanReplaceSettingsAPI() {
    console.log('🚀 开始测试PlanReplaceSettings API...\n');

    try {
        // 1. 测试保存planReplaceSettings（创建）
        console.log('1. 测试创建planReplaceSettings...');
        const saveResponse = await axios.post(`${API_URL}/save`, testPlanReplaceSettingsData);
        console.log('✅ 创建planReplaceSettings成功');
        console.log('响应数据:', JSON.stringify(saveResponse.data, null, 2));
        
        createdPlanReplaceSettingsId = saveResponse.data.data.id;
        console.log(`📝 创建的planReplaceSettings ID: ${createdPlanReplaceSettingsId}\n`);

        // 2. 测试获取planReplaceSettings详情
        console.log('2. 测试获取planReplaceSettings详情...');
        const detailResponse = await axios.get(`${API_URL}/detail/${createdPlanReplaceSettingsId}`);
        console.log('✅ 获取planReplaceSettings详情成功');
        console.log('详情数据:', JSON.stringify(detailResponse.data, null, 2));
        console.log('');

        // 3. 测试分页查询
        console.log('3. 测试分页查询planReplaceSettings...');
        const pageResponse = await axios.get(`${API_URL}/page?pageIndex=1&pageSize=10`);
        console.log('✅ 分页查询planReplaceSettings成功');
        console.log('分页数据:', JSON.stringify(pageResponse.data, null, 2));
        console.log('');

        // 4. 测试更新planReplaceSettings
        console.log('4. 测试更新planReplaceSettings...');
        const updateData = {
            ...testPlanReplaceSettingsData,
            id: createdPlanReplaceSettingsId,
            name: '更新后的测试计划替换设置',
            description: '这是更新后的测试计划替换设置',
            status: 'ENABLED',
            ruleList: [
                {
                    matchKey: 'GENDER',
                    matchCondition: 'EQUALS',
                    matchValue: 1,
                    workoutList: [301, 302, 303, 304]
                }
            ]
        };
        const updateResponse = await axios.post(`${API_URL}/save`, updateData);
        console.log('✅ 更新planReplaceSettings成功');
        console.log('更新响应:', JSON.stringify(updateResponse.data, null, 2));
        console.log('');

        // 5. 测试关键词搜索
        console.log('5. 测试关键词搜索...');
        const keywordsResponse = await axios.get(`${API_URL}/page?keywords=测试&pageSize=10`);
        console.log('✅ 关键词搜索成功');
        console.log('搜索结果:', JSON.stringify(keywordsResponse.data, null, 2));
        console.log('');

        // 6. 测试筛选查询
        console.log('6. 测试筛选查询...');
        const filterResponse = await axios.get(`${API_URL}/page?statusList=ENABLED&pageSize=10`);
        console.log('✅ 筛选查询成功');
        console.log('筛选结果:', JSON.stringify(filterResponse.data, null, 2));
        console.log('');

        // 7. 测试批量启用
        console.log('7. 测试批量启用planReplaceSettings...');
        const enableResponse = await axios.post(`${API_URL}/enable`, {
            idList: [createdPlanReplaceSettingsId]
        });
        console.log('✅ 批量启用planReplaceSettings成功');
        console.log('启用响应:', JSON.stringify(enableResponse.data, null, 2));
        console.log('');

        // 8. 测试批量禁用
        console.log('8. 测试批量禁用planReplaceSettings...');
        const disableResponse = await axios.post(`${API_URL}/disable`, {
            idList: [createdPlanReplaceSettingsId]
        });
        console.log('✅ 批量禁用planReplaceSettings成功');
        console.log('禁用响应:', JSON.stringify(disableResponse.data, null, 2));
        console.log('');

        // 9. 测试批量删除
        console.log('9. 测试批量删除planReplaceSettings...');
        const deleteResponse = await axios.post(`${API_URL}/del`, {
            idList: [createdPlanReplaceSettingsId]
        });
        console.log('✅ 批量删除planReplaceSettings成功');
        console.log('删除响应:', JSON.stringify(deleteResponse.data, null, 2));
        console.log('');

        // 10. 验证删除后无法获取详情
        console.log('10. 验证删除后无法获取详情...');
        try {
            await axios.get(`${API_URL}/detail/${createdPlanReplaceSettingsId}`);
            console.log('❌ 删除验证失败：仍能获取已删除的planReplaceSettings');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ 删除验证成功：无法获取已删除的planReplaceSettings');
            } else {
                console.log('⚠️ 删除验证出现意外错误:', error.message);
            }
        }

        console.log('\n🎉 所有PlanReplaceSettings API测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlanReplaceSettingsAPI()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlanReplaceSettingsAPI };
