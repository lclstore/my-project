/**
 * 真实环境操作日志测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';

async function testRealOpLog() {
    console.log('🔍 测试真实环境操作日志记录...\n');

    try {
        // 1. 先查看当前日志数量
        console.log('1. 查看当前日志数量...');
        const beforeResponse = await axios.get(`${BASE_URL}/opLogs/page?pageSize=5`);
        const beforeCount = beforeResponse.data.total;
        console.log(`   当前日志总数: ${beforeCount}`);
        
        // 2. 测试新增sound
        console.log('\n2. 测试新增sound...');
        const createResponse = await axios.post(`${BASE_URL}/sound/save`, {
            name: '测试音频-实时日志',
            url: 'https://example.com/test-real.mp3',
            duration: 120,
            status: 'ENABLED'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'test-user-real',
                'Authorization': 'Bearer test-token'
            }
        });
        
        if (createResponse.data.success) {
            const soundId = createResponse.data.data.id;
            console.log(`   ✅ 创建sound成功，ID: ${soundId}`);
            
            // 等待日志记录
            console.log('   ⏳ 等待日志记录...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 3. 检查日志是否增加
            console.log('\n3. 检查日志是否增加...');
            const afterResponse = await axios.get(`${BASE_URL}/opLogs/page?pageSize=5`);
            const afterCount = afterResponse.data.total;
            console.log(`   新的日志总数: ${afterCount}`);
            console.log(`   增加的日志数: ${afterCount - beforeCount}`);
            
            if (afterCount > beforeCount) {
                console.log('   ✅ 日志记录成功！');
                
                // 显示最新的日志
                console.log('\n4. 最新的日志记录:');
                afterResponse.data.data.forEach((log, index) => {
                    console.log(`   ${index + 1}. [${log.bizType}] ${log.operationType} - ${log.dataInfo}`);
                    console.log(`      操作人: ${log.operationUser}`);
                    console.log(`      时间: ${log.operationTime}`);
                    console.log('');
                });
            } else {
                console.log('   ❌ 日志记录失败！');
                
                // 检查可能的问题
                console.log('\n🔍 问题诊断:');
                console.log('   1. 检查服务器控制台是否有日志记录成功的消息');
                console.log('   2. 检查中间件是否正确启用');
                console.log('   3. 检查数据库连接是否正常');
            }
            
            // 4. 测试更新操作
            console.log('\n5. 测试更新sound...');
            const updateResponse = await axios.post(`${BASE_URL}/sound/save`, {
                id: soundId,
                name: '更新后的测试音频-实时日志',
                url: 'https://example.com/updated-test-real.mp3',
                duration: 150,
                status: 'ENABLED'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'test-user-real',
                    'Authorization': 'Bearer test-token'
                }
            });
            
            if (updateResponse.data.success) {
                console.log('   ✅ 更新sound成功');
                
                // 等待日志记录
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 检查更新日志
                const updateLogResponse = await axios.get(`${BASE_URL}/opLogs/page?pageSize=10`);
                const updateLogCount = updateLogResponse.data.total;
                console.log(`   更新后日志总数: ${updateLogCount}`);
                
                if (updateLogCount > afterCount) {
                    console.log('   ✅ 更新日志记录成功！');
                } else {
                    console.log('   ❌ 更新日志记录失败！');
                }
            }
            
            // 清理测试数据
            console.log('\n6. 清理测试数据...');
            try {
                await axios.post(`${BASE_URL}/sound/del`, {
                    idList: [soundId]
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': 'test-user-real'
                    }
                });
                console.log('   ✅ 清理完成');
            } catch (error) {
                console.log('   ⚠️  清理失败，请手动删除');
            }
            
        } else {
            console.log('   ❌ 创建sound失败:', createResponse.data.errMessage);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('错误详情:', error.response.data);
        }
        
        // 提供调试建议
        console.log('\n🔧 调试建议:');
        console.log('1. 确保服务器正在运行 (http://localhost:3000)');
        console.log('2. 检查数据库连接是否正常');
        console.log('3. 查看服务器控制台输出');
        console.log('4. 确认中间件已正确启用');
    }
}

// 测试中间件是否被调用
async function testMiddlewareCall() {
    console.log('\n🎯 测试中间件调用...');
    
    try {
        // 发送一个简单的请求
        const response = await axios.post(`${BASE_URL}/sound/save`, {
            name: '中间件测试',
            status: 'DRAFT'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'middleware-test'
            }
        });
        
        console.log('请求响应:', response.data);
        console.log('请检查服务器控制台是否有以下消息:');
        console.log('📝 操作日志记录成功: biz_sound[xxx] SAVE by middleware-test');
        
    } catch (error) {
        console.error('请求失败:', error.message);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testRealOpLog()
        .then(() => testMiddlewareCall())
        .then(() => {
            console.log('\n✅ 测试完成');
            console.log('\n💡 如果日志没有记录，请检查:');
            console.log('1. 服务器控制台是否有 "📝 操作日志记录成功" 消息');
            console.log('2. 数据库 op_logs 表是否存在');
            console.log('3. 中间件是否正确启用');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testRealOpLog };
