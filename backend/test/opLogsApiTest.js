/**
 * OpLogs API 测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const API_URL = `${BASE_URL}/opLogs`;

// 测试数据 - 先插入一些测试日志
const testOpLogsData = [
    {
        bizType: 'music',
        dataId: 1,
        dataInfo: '测试音乐1',
        operationType: 'ADD',
        dataAfter: '{"name":"测试音乐1","status":"ENABLED"}',
        operationUser: '测试用户1',
        operationTime: new Date().toISOString()
    },
    {
        bizType: 'playlist',
        dataId: 2,
        dataInfo: '测试播放列表1',
        operationType: 'UPDATE',
        dataAfter: '{"name":"更新后的播放列表","status":"ENABLED"}',
        operationUser: '测试用户2',
        operationTime: new Date().toISOString()
    },
    {
        bizType: 'music',
        dataId: 3,
        dataInfo: '测试音乐2',
        operationType: 'DELETE',
        dataAfter: '{"id":3,"deleted":true}',
        operationUser: '管理员',
        operationTime: new Date().toISOString()
    }
];

async function insertTestData() {
    console.log('📝 插入测试数据...');
    
    const { query } = require('../config/database');
    
    for (const data of testOpLogsData) {
        const sql = `
            INSERT INTO op_logs (biz_type, data_id, data_info, operation_type, data_after, operation_user, operation_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await query(sql, [
            data.bizType,
            data.dataId,
            data.dataInfo,
            data.operationType,
            data.dataAfter,
            data.operationUser,
            data.operationTime
        ]);
    }
    
    console.log('✅ 测试数据插入完成');
}

async function testOpLogsAPI() {
    console.log('🚀 开始测试OpLogs API...\n');

    try {
        // 0. 插入测试数据
        await insertTestData();
        console.log('');

        // 1. 测试分页查询
        console.log('1. 测试分页查询操作日志...');
        const pageResponse = await axios.get(`${API_URL}/page?pageIndex=1&pageSize=10`);
        console.log('✅ 分页查询操作日志成功');
        console.log('分页数据:', JSON.stringify(pageResponse.data, null, 2));
        
        // 验证返回的字段格式
        if (pageResponse.data.data && pageResponse.data.data.length > 0) {
            const firstItem = pageResponse.data.data[0];
            console.log('📋 验证字段格式:');
            console.log(`   id: ${firstItem.id}`);
            console.log(`   bizType: ${firstItem.bizType}`);
            console.log(`   dataId: ${firstItem.dataId}`);
            console.log(`   operationType: ${firstItem.operationType}`);
            console.log(`   operationUser: ${firstItem.operationUser}`);
            console.log(`   operationTime: ${firstItem.operationTime}`);
            
            if (firstItem.bizType && firstItem.operationType && firstItem.operationUser) {
                console.log('✅ 字段格式转换正确');
            } else {
                console.log('❌ 字段格式转换有问题');
            }
        }
        console.log('');

        // 2. 测试关键词搜索
        console.log('2. 测试关键词搜索...');
        const keywordsResponse = await axios.get(`${API_URL}/page?keywords=音乐&pageSize=10`);
        console.log('✅ 关键词搜索成功');
        console.log('搜索结果:', JSON.stringify(keywordsResponse.data, null, 2));
        console.log('');

        // 3. 测试操作类型筛选
        console.log('3. 测试操作类型筛选...');
        const filterResponse = await axios.get(`${API_URL}/page?operationTypeList=ADD,UPDATE&pageSize=10`);
        console.log('✅ 操作类型筛选成功');
        console.log('筛选结果:', JSON.stringify(filterResponse.data, null, 2));
        console.log('');

        // 4. 测试按操作人搜索
        console.log('4. 测试按操作人搜索...');
        const userSearchResponse = await axios.get(`${API_URL}/page?keywords=管理员&pageSize=10`);
        console.log('✅ 按操作人搜索成功');
        console.log('搜索结果:', JSON.stringify(userSearchResponse.data, null, 2));
        console.log('');

        // 5. 测试ID精确匹配
        console.log('5. 测试ID精确匹配...');
        if (pageResponse.data.data && pageResponse.data.data.length > 0) {
            const firstId = pageResponse.data.data[0].id;
            const idSearchResponse = await axios.get(`${API_URL}/page?keywords=${firstId}&pageSize=10`);
            console.log('✅ ID精确匹配成功');
            console.log('匹配结果:', JSON.stringify(idSearchResponse.data, null, 2));
        }
        console.log('');

        // 6. 测试排序
        console.log('6. 测试排序...');
        const sortResponse = await axios.get(`${API_URL}/page?orderBy=operationTime&orderDirection=asc&pageSize=10`);
        console.log('✅ 排序查询成功');
        console.log('排序结果:', JSON.stringify(sortResponse.data, null, 2));
        console.log('');

        // 7. 测试获取详情
        console.log('7. 测试获取操作日志详情...');
        if (pageResponse.data.data && pageResponse.data.data.length > 0) {
            const firstId = pageResponse.data.data[0].id;
            const detailResponse = await axios.get(`${API_URL}/detail/${firstId}`);
            console.log('✅ 获取操作日志详情成功');
            console.log('详情数据:', JSON.stringify(detailResponse.data, null, 2));
        }
        console.log('');

        console.log('\n🎉 所有OpLogs API测试完成！');

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
    testOpLogsAPI()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testOpLogsAPI };
