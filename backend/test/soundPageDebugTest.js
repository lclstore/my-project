/**
 * 调试 sound/page 接口的具体问题
 */

const { BusinessHelper } = require('../config/database');

async function debugSoundPageAPI() {
    try {
        console.log('🔍 开始调试 sound/page 接口问题...\n');

        // 模拟问题请求的参数
        console.log('1. 模拟问题请求');
        const mockReq = {
            query: {
                pageSize: '10',
                pageIndex: '1',
                totalCount: '0',  // 这个参数不应该在请求中
                orderBy: 'id',
                orderDirection: 'DESC'
            }
        };

        console.log('请求参数:', mockReq.query);

        // 构建查询选项（模拟 sound.js 中的逻辑）
        const { keywords, orderBy, orderDirection } = mockReq.query;
        console.log('提取的参数:', { keywords, orderBy, orderDirection });

        const options = {
            orderBy: `${orderBy || 'id'} ${orderDirection || 'DESC'}`
        };

        // 如果有关键词搜索，添加查询条件
        if (keywords && keywords.trim()) {
            console.log('检测到关键词:', keywords);
            // 检查是否为纯数字（ID全匹配）
            if (/^\d+$/.test(keywords.trim())) {
                options.where = 'id = ?';
                options.whereParams = [parseInt(keywords.trim())];
                console.log('使用ID匹配查询');
            } else {
                // 名称模糊匹配
                options.where = 'name LIKE ?';
                options.whereParams = [`%${keywords.trim()}%`];
                console.log('使用名称模糊匹配查询');
            }
        } else {
            console.log('无关键词搜索');
        }

        console.log('最终查询选项:', options);

        // 调用分页查询
        console.log('\n2. 执行分页查询');
        const result = await BusinessHelper.paginateWithValidation(
            'sound',
            mockReq,
            options
        );

        if (result.success) {
            console.log('✅ 查询成功');
            console.log('结果:', {
                totalCount: result.data.totalCount,
                pageIndex: result.data.pageIndex,
                pageSize: result.data.pageSize,
                dataLength: result.data.data.length
            });
        } else {
            console.log('❌ 查询失败');
            console.log('错误信息:', result.message);
            console.log('错误代码:', result.error);
            console.log('状态码:', result.statusCode);
        }

        // 测试不带 totalCount 参数的请求
        console.log('\n3. 测试不带 totalCount 参数的请求');
        const cleanMockReq = {
            query: {
                pageSize: '10',
                pageIndex: '1',
                orderBy: 'id',
                orderDirection: 'DESC'
            }
        };

        console.log('清理后的请求参数:', cleanMockReq.query);

        const cleanResult = await BusinessHelper.paginateWithValidation(
            'sound',
            cleanMockReq,
            options
        );

        if (cleanResult.success) {
            console.log('✅ 清理后查询成功');
            console.log('结果:', {
                totalCount: cleanResult.data.totalCount,
                pageIndex: cleanResult.data.pageIndex,
                pageSize: cleanResult.data.pageSize,
                dataLength: cleanResult.data.data.length
            });
        } else {
            console.log('❌ 清理后查询失败');
            console.log('错误信息:', cleanResult.message);
        }

        // 测试最简单的请求
        console.log('\n4. 测试最简单的请求');
        const simpleMockReq = {
            query: {
                pageSize: '10',
                pageIndex: '1'
            }
        };

        const simpleOptions = {
            orderBy: 'id DESC'
        };

        const simpleResult = await BusinessHelper.paginateWithValidation(
            'sound',
            simpleMockReq,
            simpleOptions
        );

        if (simpleResult.success) {
            console.log('✅ 简单请求成功');
            console.log('结果:', {
                totalCount: simpleResult.data.totalCount,
                pageIndex: simpleResult.data.pageIndex,
                pageSize: simpleResult.data.pageSize,
                dataLength: simpleResult.data.data.length
            });
        } else {
            console.log('❌ 简单请求失败');
            console.log('错误信息:', simpleResult.message);
        }

    } catch (error) {
        console.error('❌ 调试过程中出错:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    debugSoundPageAPI()
        .then(() => {
            console.log('\n🎉 调试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 调试失败:', error);
            process.exit(1);
        });
}

module.exports = { debugSoundPageAPI };
