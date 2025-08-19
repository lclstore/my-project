/**
 * Sound模块操作日志测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const SOUND_API = `${BASE_URL}/sound`;
const OP_LOGS_API = `${BASE_URL}/opLogs`;

async function testSoundOpLogs() {
    console.log('🚀 开始测试Sound模块操作日志...\n');

    try {
        // 1. 测试新增sound操作日志
        console.log('1. 测试新增sound操作日志...');
        const createResponse = await axios.post(`${SOUND_API}/save`, {
            name: '测试音频-日志',
            url: 'https://example.com/test-sound-log.mp3',
            duration: 120,
            status: 'ENABLED'
        }, {
            headers: {
                'x-user-id': '测试用户-Sound'
            }
        });
        
        const soundId = createResponse.data.data.id;
        console.log(`✅ 创建sound成功，ID: ${soundId}`);

        // 2. 测试更新sound操作日志
        console.log('2. 测试更新sound操作日志...');
        await axios.post(`${SOUND_API}/save`, {
            id: soundId,
            name: '更新后的测试音频-日志',
            url: 'https://example.com/updated-test-sound-log.mp3',
            duration: 150,
            status: 'ENABLED'
        }, {
            headers: {
                'x-user-id': '测试用户-Sound'
            }
        });
        console.log('✅ 更新sound成功');

        // 3. 测试批量启用sound操作日志
        console.log('3. 测试批量启用sound操作日志...');
        await axios.post(`${SOUND_API}/enable`, {
            idList: [soundId]
        }, {
            headers: {
                'x-user-id': '测试用户-Sound'
            }
        });
        console.log('✅ 批量启用sound成功');

        // 4. 测试批量禁用sound操作日志
        console.log('4. 测试批量禁用sound操作日志...');
        await axios.post(`${SOUND_API}/disable`, {
            idList: [soundId]
        }, {
            headers: {
                'x-user-id': '测试用户-Sound'
            }
        });
        console.log('✅ 批量禁用sound成功');

        // 5. 测试批量删除sound操作日志
        console.log('5. 测试批量删除sound操作日志...');
        await axios.post(`${SOUND_API}/del`, {
            idList: [soundId]
        }, {
            headers: {
                'x-user-id': '测试用户-Sound'
            }
        });
        console.log('✅ 批量删除sound成功');

        // 6. 验证操作日志记录
        console.log('6. 验证sound操作日志记录...');
        await verifySoundOpLogs(soundId);

        console.log('\n🎉 Sound模块操作日志测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

async function verifySoundOpLogs(soundId) {
    try {
        // 查询sound相关的操作日志
        console.log('  📋 查询sound相关的操作日志...');
        const logsResponse = await axios.get(`${OP_LOGS_API}/page?keywords=sound&pageSize=20&orderBy=operationTime&orderDirection=desc`);
        
        const soundLogs = logsResponse.data.data.filter(log => 
            log.bizType === 'sound' && log.dataId === soundId
        );
        
        console.log(`  📊 找到 ${soundLogs.length} 条sound操作日志`);
        
        // 验证操作类型
        const operationTypes = [...new Set(soundLogs.map(log => log.operationType))];
        console.log(`  🔧 操作类型: ${operationTypes.join(', ')}`);
        
        // 验证操作用户
        const operationUsers = [...new Set(soundLogs.map(log => log.operationUser))];
        console.log(`  👤 操作用户: ${operationUsers.join(', ')}`);
        
        // 显示操作日志详情
        console.log('  📝 Sound操作日志详情:');
        soundLogs.forEach((log, index) => {
            console.log(`    ${index + 1}. [${log.operationType}] ${log.dataInfo} - ${log.operationUser} (${log.operationTime})`);
            
            // 显示操作后数据
            if (log.dataAfter) {
                try {
                    const dataAfter = JSON.parse(log.dataAfter);
                    if (dataAfter.operation) {
                        console.log(`       批量操作: ${dataAfter.operation}, 数量: ${dataAfter.count}`);
                    } else {
                        console.log(`       数据: ${dataAfter.name || 'N/A'}`);
                    }
                } catch (e) {
                    console.log(`       数据: ${log.dataAfter.substring(0, 50)}...`);
                }
            }
        });
        
        // 验证预期的操作类型
        const expectedOperations = ['ADD', 'UPDATE', 'ENABLE', 'DISABLE', 'DELETE'];
        const foundOperations = operationTypes;
        
        console.log('  🔍 验证操作类型完整性:');
        expectedOperations.forEach(op => {
            if (foundOperations.includes(op)) {
                console.log(`    ✅ ${op} - 已记录`);
            } else {
                console.log(`    ❌ ${op} - 未记录`);
            }
        });
        
        // 测试按操作类型筛选
        console.log('  🔍 测试按操作类型筛选...');
        const filterResponse = await axios.get(`${OP_LOGS_API}/page?operationTypeList=ADD,UPDATE&keywords=sound&pageSize=10`);
        console.log(`  ✅ 筛选ADD,UPDATE操作: ${filterResponse.data.data.length} 条`);
        
        // 测试按用户搜索
        console.log('  🔍 测试按用户搜索...');
        const userSearchResponse = await axios.get(`${OP_LOGS_API}/page?keywords=测试用户-Sound&pageSize=10`);
        console.log(`  ✅ 按用户搜索: ${userSearchResponse.data.data.length} 条`);
        
        console.log('  ✅ Sound操作日志验证完成');
        
    } catch (error) {
        console.error('  ❌ 验证操作日志失败:', error.message);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundOpLogs()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundOpLogs };
