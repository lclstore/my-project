/**
 * Resource API 测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const API_URL = `${BASE_URL}/resource`;

// 测试数据
const testResourceData = {
    name: '测试资源',
    description: '这是一个测试资源',
    applicationCode: 'PLAN',
    genderCode: 'FEMALE',
    coverImgUrl: 'https://example.com/cover.jpg',
    detailImgUrl: 'https://example.com/detail.jpg',
    status: 'DRAFT'
};

let createdResourceId = null;

async function testResourceAPI() {
    console.log('🚀 开始测试Resource API...\n');

    try {
        // 1. 测试保存resource（创建）
        console.log('1. 测试创建resource...');
        const saveResponse = await axios.post(`${API_URL}/save`, testResourceData);
        console.log('✅ 创建resource成功');
        console.log('响应数据:', JSON.stringify(saveResponse.data, null, 2));
        
        createdResourceId = saveResponse.data.data.id;
        console.log(`📝 创建的resource ID: ${createdResourceId}\n`);

        // 2. 测试获取resource详情
        console.log('2. 测试获取resource详情...');
        const detailResponse = await axios.get(`${API_URL}/detail/${createdResourceId}`);
        console.log('✅ 获取resource详情成功');
        console.log('详情数据:', JSON.stringify(detailResponse.data, null, 2));
        console.log('');

        // 3. 测试分页查询
        console.log('3. 测试分页查询resource...');
        const pageResponse = await axios.get(`${API_URL}/page?pageIndex=1&pageSize=10`);
        console.log('✅ 分页查询resource成功');
        console.log('分页数据:', JSON.stringify(pageResponse.data, null, 2));
        console.log('');

        // 4. 测试更新resource
        console.log('4. 测试更新resource...');
        const updateData = {
            ...testResourceData,
            id: createdResourceId,
            name: '更新后的测试资源',
            description: '这是更新后的测试资源',
            status: 'ENABLED'
        };
        const updateResponse = await axios.post(`${API_URL}/save`, updateData);
        console.log('✅ 更新resource成功');
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
        const filterResponse = await axios.get(`${API_URL}/page?statusList=ENABLED&applicationCodeList=PLAN&genderCode=FEMALE&pageSize=10`);
        console.log('✅ 筛选查询成功');
        console.log('筛选结果:', JSON.stringify(filterResponse.data, null, 2));
        console.log('');

        // 7. 测试批量启用
        console.log('7. 测试批量启用resource...');
        const enableResponse = await axios.post(`${API_URL}/enable`, {
            idList: [createdResourceId]
        });
        console.log('✅ 批量启用resource成功');
        console.log('启用响应:', JSON.stringify(enableResponse.data, null, 2));
        console.log('');

        // 8. 测试批量禁用
        console.log('8. 测试批量禁用resource...');
        const disableResponse = await axios.post(`${API_URL}/disable`, {
            idList: [createdResourceId]
        });
        console.log('✅ 批量禁用resource成功');
        console.log('禁用响应:', JSON.stringify(disableResponse.data, null, 2));
        console.log('');

        // 9. 测试批量删除
        console.log('9. 测试批量删除resource...');
        const deleteResponse = await axios.post(`${API_URL}/del`, {
            idList: [createdResourceId]
        });
        console.log('✅ 批量删除resource成功');
        console.log('删除响应:', JSON.stringify(deleteResponse.data, null, 2));
        console.log('');

        // 10. 验证删除后无法获取详情
        console.log('10. 验证删除后无法获取详情...');
        try {
            await axios.get(`${API_URL}/detail/${createdResourceId}`);
            console.log('❌ 删除验证失败：仍能获取已删除的resource');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ 删除验证成功：无法获取已删除的resource');
            } else {
                console.log('⚠️ 删除验证出现意外错误:', error.message);
            }
        }

        console.log('\n🎉 所有Resource API测试完成！');

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
    testResourceAPI()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testResourceAPI };
