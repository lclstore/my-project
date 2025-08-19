/**
 * Template API 测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const API_URL = `${BASE_URL}/template`;

// 测试数据
const testTemplateData = {
    name: '测试模板',
    description: '这是一个测试模板',
    durationCode: 'MIN_10_15',
    days: 7,
    status: 'DRAFT',
    unitList: [
        {
            structureName: '热身',
            structureTypeCode: 'WARM_UP',
            count: 3,
            round: 1
        },
        {
            structureName: '主要训练',
            structureTypeCode: 'MAIN',
            count: 5,
            round: 3
        },
        {
            structureName: '放松',
            structureTypeCode: 'COOL_DOWN',
            count: 2,
            round: 1
        }
    ]
};

let createdTemplateId = null;

async function testTemplateAPI() {
    console.log('🚀 开始测试Template API...\n');

    try {
        // 1. 测试保存template（创建）
        console.log('1. 测试创建template...');
        const saveResponse = await axios.post(`${API_URL}/save`, testTemplateData);
        console.log('✅ 创建template成功');
        console.log('响应数据:', JSON.stringify(saveResponse.data, null, 2));
        
        createdTemplateId = saveResponse.data.data.id;
        console.log(`📝 创建的template ID: ${createdTemplateId}\n`);

        // 2. 测试获取template详情
        console.log('2. 测试获取template详情...');
        const detailResponse = await axios.get(`${API_URL}/detail/${createdTemplateId}`);
        console.log('✅ 获取template详情成功');
        console.log('详情数据:', JSON.stringify(detailResponse.data, null, 2));
        console.log('');

        // 3. 测试分页查询
        console.log('3. 测试分页查询template...');
        const pageResponse = await axios.get(`${API_URL}/page?pageIndex=1&pageSize=10`);
        console.log('✅ 分页查询template成功');
        console.log('分页数据:', JSON.stringify(pageResponse.data, null, 2));
        console.log('');

        // 4. 测试更新template
        console.log('4. 测试更新template...');
        const updateData = {
            ...testTemplateData,
            id: createdTemplateId,
            name: '更新后的测试模板',
            description: '这是更新后的测试模板',
            status: 'ENABLED'
        };
        const updateResponse = await axios.post(`${API_URL}/save`, updateData);
        console.log('✅ 更新template成功');
        console.log('更新响应:', JSON.stringify(updateResponse.data, null, 2));
        console.log('');

        // 5. 测试批量启用
        console.log('5. 测试批量启用template...');
        const enableResponse = await axios.post(`${API_URL}/enable`, {
            idList: [createdTemplateId]
        });
        console.log('✅ 批量启用template成功');
        console.log('启用响应:', JSON.stringify(enableResponse.data, null, 2));
        console.log('');

        // 6. 测试批量禁用
        console.log('6. 测试批量禁用template...');
        const disableResponse = await axios.post(`${API_URL}/disable`, {
            idList: [createdTemplateId]
        });
        console.log('✅ 批量禁用template成功');
        console.log('禁用响应:', JSON.stringify(disableResponse.data, null, 2));
        console.log('');

        // 7. 测试条件查询
        console.log('7. 测试条件查询template...');
        const queryResponse = await axios.get(`${API_URL}/page?pageIndex=1&pageSize=10&name=测试&status=DISABLED`);
        console.log('✅ 条件查询template成功');
        console.log('查询结果:', JSON.stringify(queryResponse.data, null, 2));
        console.log('');

        // 8. 测试批量删除
        console.log('8. 测试批量删除template...');
        const deleteResponse = await axios.post(`${API_URL}/del`, {
            idList: [createdTemplateId]
        });
        console.log('✅ 批量删除template成功');
        console.log('删除响应:', JSON.stringify(deleteResponse.data, null, 2));
        console.log('');

        // 9. 验证删除后无法获取详情
        console.log('9. 验证删除后无法获取详情...');
        try {
            await axios.get(`${API_URL}/detail/${createdTemplateId}`);
            console.log('❌ 删除验证失败：仍能获取已删除的template');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ 删除验证成功：无法获取已删除的template');
            } else {
                console.log('⚠️ 删除验证出现意外错误:', error.message);
            }
        }

        console.log('\n🎉 所有Template API测试完成！');

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
    testTemplateAPI()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testTemplateAPI };
