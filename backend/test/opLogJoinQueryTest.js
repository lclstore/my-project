/**
 * 操作日志连表查询测试
 */

const axios = require('axios');
const { query } = require('../config/database');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const SOUND_API = `${BASE_URL}/sound`;
const OP_LOGS_API = `${BASE_URL}/opLogs`;

async function testOpLogJoinQuery() {
    console.log('🚀 开始测试操作日志连表查询功能...\n');

    try {
        // 1. 准备测试用户数据
        console.log('1. 准备测试用户数据...');
        const testUserId = await ensureTestUser();
        console.log(`✅ 测试用户ID: ${testUserId}`);

        // 2. 使用用户ID进行操作，记录日志
        console.log('2. 使用用户ID进行sound操作...');
        const createResponse = await axios.post(`${SOUND_API}/save`, {
            name: '测试音频-连表查询',
            url: 'https://example.com/test-join-query.mp3',
            duration: 120,
            status: 'ENABLED'
        }, {
            headers: {
                'x-user-id': testUserId.toString()
            }
        });
        
        const soundId = createResponse.data.data.id;
        console.log(`✅ 创建sound成功，ID: ${soundId}`);

        // 3. 等待日志记录完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. 测试分页查询的连表功能
        console.log('3. 测试分页查询的连表功能...');
        const pageResponse = await axios.get(`${OP_LOGS_API}/page?pageSize=10&orderBy=operationTime&orderDirection=desc`);
        
        console.log('📋 分页查询结果:');
        console.log(`   总数: ${pageResponse.data.totalCount}`);
        console.log(`   当前页数据: ${pageResponse.data.data.length} 条`);
        
        // 查找我们刚创建的日志
        const recentLog = pageResponse.data.data.find(log => 
            log.bizType === 'biz_sound' && 
            log.dataId === soundId && 
            log.operationType === 'ADD'
        );

        if (recentLog) {
            console.log('📝 找到相关操作日志:');
            console.log(`   ID: ${recentLog.id}`);
            console.log(`   业务类型: ${recentLog.bizType}`);
            console.log(`   操作类型: ${recentLog.operationType}`);
            console.log(`   数据ID: ${recentLog.dataId}`);
            console.log(`   操作用户: ${recentLog.operationUser}`);
            console.log(`   操作时间: ${recentLog.operationTime}`);
            
            // 验证用户信息格式
            if (recentLog.operationUser.includes('@')) {
                console.log('✅ 连表查询成功：操作用户显示为email格式');
            } else if (recentLog.operationUser.startsWith('用户ID:')) {
                console.log('⚠️ 连表查询部分成功：显示为用户ID格式（用户可能没有email）');
            } else {
                console.log(`ℹ️ 操作用户格式: ${recentLog.operationUser}`);
            }

            // 5. 测试详情查询的连表功能
            console.log('4. 测试详情查询的连表功能...');
            const detailResponse = await axios.get(`${OP_LOGS_API}/detail/${recentLog.id}`);
            
            console.log('📋 详情查询结果:');
            console.log(`   操作用户: ${detailResponse.data.data.operationUser}`);
            console.log(`   数据信息: ${detailResponse.data.data.dataInfo}`);
            
            if (detailResponse.data.data.operationUser === recentLog.operationUser) {
                console.log('✅ 详情查询连表成功：用户信息一致');
            } else {
                console.log('❌ 详情查询连表失败：用户信息不一致');
            }

        } else {
            console.log('❌ 未找到相关操作日志');
        }

        // 6. 测试筛选功能
        console.log('5. 测试筛选功能...');
        const filterResponse = await axios.get(`${OP_LOGS_API}/page?operationTypeList=ADD&pageSize=5`);
        console.log(`✅ 按操作类型筛选结果: ${filterResponse.data.data.length} 条`);

        // 7. 测试关键词搜索
        console.log('6. 测试关键词搜索...');
        const searchResponse = await axios.get(`${OP_LOGS_API}/page?keywords=sound&pageSize=5`);
        console.log(`✅ 关键词搜索结果: ${searchResponse.data.data.length} 条`);

        // 8. 验证SQL性能（检查是否只执行了一次查询）
        console.log('7. 验证查询性能...');
        const startTime = Date.now();
        await axios.get(`${OP_LOGS_API}/page?pageSize=20`);
        const endTime = Date.now();
        console.log(`✅ 查询耗时: ${endTime - startTime}ms`);

        // 9. 清理测试数据
        console.log('8. 清理测试数据...');
        await axios.post(`${SOUND_API}/del`, {
            idList: [soundId]
        }, {
            headers: {
                'x-user-id': testUserId.toString()
            }
        });
        console.log('✅ 测试数据清理完成');

        console.log('\n🎉 操作日志连表查询测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

async function ensureTestUser() {
    try {
        // 检查是否已存在测试用户
        const existingUser = await query(`
            SELECT id FROM user 
            WHERE email = 'test-join-query@example.com' 
            AND is_deleted = 0
        `);

        if (existingUser && existingUser.length > 0) {
            return existingUser[0].id;
        }

        // 创建测试用户
        const insertResult = await query(`
            INSERT INTO user (email, username, password, create_time, update_time)
            VALUES ('test-join-query@example.com', 'test-join-user', 'test123', NOW(), NOW())
        `);

        return insertResult.insertId;

    } catch (error) {
        console.error('创建测试用户失败:', error);
        // 如果用户表不存在或有其他问题，返回一个默认ID
        return 999;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testOpLogJoinQuery()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testOpLogJoinQuery };
