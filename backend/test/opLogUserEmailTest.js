/**
 * 操作日志用户Email查询测试
 */

const axios = require('axios');
const { query } = require('../config/database');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const SOUND_API = `${BASE_URL}/sound`;
const OP_LOGS_API = `${BASE_URL}/opLogs`;

async function testOpLogUserEmail() {
    console.log('🚀 开始测试操作日志用户Email查询功能...\n');

    try {
        // 1. 先创建一个测试用户（如果不存在）
        console.log('1. 准备测试用户数据...');
        const testUserId = await ensureTestUser();
        console.log(`✅ 测试用户ID: ${testUserId}`);

        // 2. 使用用户ID进行操作，记录日志
        console.log('2. 使用用户ID进行sound操作...');
        const createResponse = await axios.post(`${SOUND_API}/save`, {
            name: '测试音频-用户Email',
            url: 'https://example.com/test-user-email.mp3',
            duration: 120,
            status: 'ENABLED'
        }, {
            headers: {
                'x-user-id': testUserId.toString()  // 使用用户ID
            }
        });
        
        const soundId = createResponse.data.data.id;
        console.log(`✅ 创建sound成功，ID: ${soundId}`);

        // 3. 等待一下让日志记录完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. 查询操作日志，验证用户email显示
        console.log('3. 查询操作日志，验证用户email显示...');
        const logsResponse = await axios.get(`${OP_LOGS_API}/page?pageSize=10&orderBy=operationTime&orderDirection=desc`);
        
        // 找到刚才创建的日志
        const recentLog = logsResponse.data.data.find(log => 
            log.bizType === 'biz_sound' && 
            log.dataId === soundId && 
            log.operationType === 'ADD'
        );

        if (recentLog) {
            console.log('📋 找到相关操作日志:');
            console.log(`   操作类型: ${recentLog.operationType}`);
            console.log(`   业务类型: ${recentLog.bizType}`);
            console.log(`   数据ID: ${recentLog.dataId}`);
            console.log(`   操作用户: ${recentLog.operationUser}`);
            
            // 验证operationUser是否为email格式
            if (recentLog.operationUser.includes('@')) {
                console.log('✅ 操作用户显示为email格式');
            } else if (recentLog.operationUser.startsWith('用户ID:')) {
                console.log('⚠️ 操作用户显示为用户ID（用户可能不存在或没有email）');
            } else {
                console.log(`ℹ️ 操作用户显示为: ${recentLog.operationUser}`);
            }
        } else {
            console.log('❌ 未找到相关操作日志');
        }

        // 5. 测试详情查询
        if (recentLog) {
            console.log('4. 测试详情查询用户email...');
            const detailResponse = await axios.get(`${OP_LOGS_API}/detail/${recentLog.id}`);
            
            console.log('📋 详情查询结果:');
            console.log(`   操作用户: ${detailResponse.data.data.operationUser}`);
            
            if (detailResponse.data.data.operationUser.includes('@')) {
                console.log('✅ 详情查询中操作用户显示为email格式');
            } else {
                console.log('ℹ️ 详情查询中操作用户显示为其他格式');
            }
        }

        // 6. 测试用户搜索功能
        console.log('5. 测试按用户email搜索...');
        if (recentLog && recentLog.operationUser.includes('@')) {
            const emailSearchResponse = await axios.get(`${OP_LOGS_API}/page?keywords=${recentLog.operationUser}&pageSize=10`);
            console.log(`✅ 按email搜索结果: ${emailSearchResponse.data.data.length} 条`);
        }

        // 7. 清理测试数据
        console.log('6. 清理测试数据...');
        await axios.post(`${SOUND_API}/del`, {
            idList: [soundId]
        }, {
            headers: {
                'x-user-id': testUserId.toString()
            }
        });
        console.log('✅ 测试数据清理完成');

        console.log('\n🎉 操作日志用户Email查询测试完成！');

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
            WHERE email = 'test-oplog@example.com' 
            AND is_deleted = 0
        `);

        if (existingUser && existingUser.length > 0) {
            return existingUser[0].id;
        }

        // 创建测试用户
        const insertResult = await query(`
            INSERT INTO user (email, username, password, create_time, update_time)
            VALUES ('test-oplog@example.com', 'test-oplog-user', 'test123', NOW(), NOW())
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
    testOpLogUserEmail()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testOpLogUserEmail };
