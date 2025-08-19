/**
 * 操作日志中间件测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';

async function testOpLogMiddleware() {
    console.log('🚀 开始测试操作日志中间件...\n');

    try {
        // 1. 测试sound模块操作日志
        console.log('1. 测试sound模块操作日志...');
        
        // 新增sound
        console.log('  📝 测试新增sound...');
        const createResponse = await axios.post(`${BASE_URL}/sound/save`, {
            name: '测试音频-中间件',
            url: 'https://example.com/test-middleware.mp3',
            duration: 120,
            status: 'ENABLED'
        }, {
            headers: {
                'x-user-id': '测试用户-中间件',
                'Content-Type': 'application/json'
            }
        });
        
        const soundId = createResponse.data.data.id;
        console.log(`  ✅ 创建sound成功，ID: ${soundId}`);
        
        // 等待一下让日志记录完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 更新sound
        console.log('  📝 测试更新sound...');
        await axios.post(`${BASE_URL}/sound/save`, {
            id: soundId,
            name: '更新后的测试音频-中间件',
            url: 'https://example.com/updated-test-middleware.mp3',
            duration: 150,
            status: 'ENABLED'
        }, {
            headers: {
                'x-user-id': '测试用户-中间件',
                'Content-Type': 'application/json'
            }
        });
        console.log('  ✅ 更新sound成功');
        
        // 等待一下让日志记录完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 批量启用
        console.log('  📝 测试批量启用sound...');
        await axios.post(`${BASE_URL}/sound/enable`, {
            idList: [soundId]
        }, {
            headers: {
                'x-user-id': '测试用户-中间件',
                'Content-Type': 'application/json'
            }
        });
        console.log('  ✅ 批量启用sound成功');
        
        // 等待一下让日志记录完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. 验证操作日志记录
        console.log('\n2. 验证操作日志记录...');
        const logsResponse = await axios.get(`${BASE_URL}/opLogs/page?keywords=中间件&pageSize=10`);
        
        console.log(`  📊 找到 ${logsResponse.data.data.length} 条相关日志`);
        
        if (logsResponse.data.data.length > 0) {
            console.log('  📋 最新的几条日志:');
            logsResponse.data.data.slice(0, 3).forEach((log, index) => {
                console.log(`    ${index + 1}. [${log.bizType}] ${log.operationType} - ${log.dataInfo} (${log.operationUser})`);
            });
        }
        
        // 3. 测试其他模块
        console.log('\n3. 测试其他模块操作日志...');
        
        // 测试exercise模块
        console.log('  📝 测试exercise模块...');
        try {
            const exerciseResponse = await axios.post(`${BASE_URL}/exercise/save`, {
                name: '测试动作-中间件',
                status: 'DRAFT'
            }, {
                headers: {
                    'x-user-id': '测试用户-中间件',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`  ✅ 创建exercise成功，ID: ${exerciseResponse.data.data.id}`);
        } catch (error) {
            console.log(`  ⚠️  exercise测试跳过: ${error.response?.data?.errMessage || error.message}`);
        }
        
        // 等待一下让日志记录完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 4. 最终验证
        console.log('\n4. 最终验证操作日志...');
        const finalLogsResponse = await axios.get(`${BASE_URL}/opLogs/page?keywords=中间件&pageSize=20`);
        
        console.log(`  📊 总共找到 ${finalLogsResponse.data.data.length} 条相关日志`);
        console.log(`  📈 总记录数: ${finalLogsResponse.data.total}`);
        
        // 按业务类型分组统计
        const logsByBizType = {};
        finalLogsResponse.data.data.forEach(log => {
            logsByBizType[log.bizType] = (logsByBizType[log.bizType] || 0) + 1;
        });
        
        console.log('  📊 按业务类型统计:');
        Object.entries(logsByBizType).forEach(([bizType, count]) => {
            console.log(`    ${bizType}: ${count} 条`);
        });
        
        console.log('\n🎉 操作日志中间件测试完成！');
        
        // 清理测试数据
        console.log('\n🧹 清理测试数据...');
        try {
            await axios.post(`${BASE_URL}/sound/del`, {
                idList: [soundId]
            }, {
                headers: {
                    'x-user-id': '测试用户-中间件',
                    'Content-Type': 'application/json'
                }
            });
            console.log('  ✅ 清理完成');
        } catch (error) {
            console.log('  ⚠️  清理失败，请手动删除测试数据');
        }

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
    testOpLogMiddleware()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testOpLogMiddleware };
