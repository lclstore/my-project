/**
 * 测试真实的 templateCms 请求
 */

const axios = require('axios');

async function testRealRequest() {
    console.log('🚀 测试真实的 templateCms 请求...\n');

    try {
        // 1. 先检查服务器是否运行
        console.log('1. 检查服务器状态...');
        try {
            const healthResponse = await axios.get('http://localhost:8080/');
            console.log('   ✅ 服务器正在运行');
            console.log('   响应:', healthResponse.data);
        } catch (error) {
            console.log('   ❌ 服务器未运行或无法访问');
            console.log('   错误:', error.message);
            return;
        }

        // 2. 查看当前日志数量
        console.log('\n2. 查看当前日志数量...');
        try {
            const beforeResponse = await axios.get('http://localhost:8080/templateCms/web/opLogs/page?pageSize=5');
            const beforeCount = beforeResponse.data.total;
            console.log(`   当前日志总数: ${beforeCount}`);
        } catch (error) {
            console.log('   ⚠️  无法获取日志数量:', error.message);
        }

        // 3. 发送测试请求
        console.log('\n3. 发送测试请求...');
        const testData = {
            name: '测试音频-调试',
            url: 'https://example.com/test-debug.mp3',
            duration: 120,
            status: 'ENABLED'
        };

        console.log('   请求URL: http://localhost:8080/templateCms/web/sound/save');
        console.log('   请求方法: POST');
        console.log('   请求数据:', JSON.stringify(testData, null, 2));

        const response = await axios.post('http://localhost:8080/templateCms/web/sound/save', testData, {
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'test-debug-user',
                'Authorization': 'Bearer test-token'
            }
        });

        console.log('   ✅ 请求成功');
        console.log('   响应状态:', response.status);
        console.log('   响应数据:', JSON.stringify(response.data, null, 2));

        // 4. 等待日志记录
        console.log('\n4. 等待日志记录...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 5. 检查日志是否增加
        console.log('\n5. 检查日志记录...');
        try {
            const afterResponse = await axios.get('http://localhost:8080/templateCms/web/opLogs/page?pageSize=10');
            const afterCount = afterResponse.data.total;
            console.log(`   新的日志总数: ${afterCount}`);

            if (afterResponse.data.data && afterResponse.data.data.length > 0) {
                console.log('\n   最新的日志记录:');
                afterResponse.data.data.slice(0, 3).forEach((log, index) => {
                    console.log(`   ${index + 1}. [${log.bizType}] ${log.operationType} - ${log.dataInfo}`);
                    console.log(`      操作人: ${log.operationUser}`);
                    console.log(`      时间: ${log.operationTime}`);
                    console.log('');
                });
            }

            // 查找包含"调试"的日志
            const debugLogs = afterResponse.data.data.filter(log => 
                log.dataInfo && log.dataInfo.includes('调试')
            );

            if (debugLogs.length > 0) {
                console.log('   ✅ 找到调试日志记录!');
                debugLogs.forEach(log => {
                    console.log(`      [${log.bizType}] ${log.operationType} - ${log.dataInfo}`);
                });
            } else {
                console.log('   ❌ 没有找到调试日志记录');
            }

        } catch (error) {
            console.log('   ⚠️  无法获取日志:', error.message);
        }

        // 6. 清理测试数据
        if (response.data.success && response.data.data && response.data.data.id) {
            console.log('\n6. 清理测试数据...');
            try {
                await axios.post('http://localhost:8080/templateCms/web/sound/del', {
                    idList: [response.data.data.id]
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': 'test-debug-user'
                    }
                });
                console.log('   ✅ 清理完成');
            } catch (error) {
                console.log('   ⚠️  清理失败:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('错误状态:', error.response.status);
            console.error('错误数据:', JSON.stringify(error.response.data, null, 2));
        }
        
        console.log('\n🔧 调试建议:');
        console.log('1. 确保服务器正在运行在端口 8080');
        console.log('2. 检查服务器控制台是否有以下调试信息:');
        console.log('   - 🔍 [OpLog中间件] POST /templateCms/web/sound/save - 应该记录: 是');
        console.log('   - 📝 [OpLog中间件] 拦截到响应: POST /templateCms/web/sound/save');
        console.log('   - 📝 操作日志记录成功: biz_sound[xxx] SAVE by test-debug-user');
        console.log('3. 如果没有看到这些信息，说明中间件没有被触发');
    }
}

// 运行测试
if (require.main === module) {
    testRealRequest()
        .then(() => {
            console.log('\n✅ 测试完成');
            console.log('\n💡 请检查服务器控制台输出，查看是否有调试信息');
        })
        .catch((error) => {
            console.error('\n💥 测试异常:', error);
        });
}

module.exports = { testRealRequest };
