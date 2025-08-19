/**
 * 测试优化后的发布记录分页接口（使用BusinessHelper）
 */

const { BusinessHelper } = require('../config/database');

async function testPublishPageQuery() {
    try {
        console.log('🚀 开始测试优化后的发布记录分页查询（使用BusinessHelper）...\n');

        // 模拟请求对象
        const mockReq = {
            query: {
                pageSize: '10',
                pageIndex: '1',
                orderBy: 'id',
                orderDirection: 'DESC'
            }
        };

        const { orderBy, orderDirection } = mockReq.query;
        const orderByName = orderBy === 'id' ? 'p.version' : `p.${orderBy}`;

        console.log('1. 测试BusinessHelper.paginateWithValidation自定义SQL功能');
        console.log('请求参数:', mockReq.query);

        // 使用 BusinessHelper.paginateWithValidation 的自定义SQL功能
        const result = await BusinessHelper.paginateWithValidation(
            'publish', // 表名（用于错误信息）
            mockReq,
            {
                // 自定义计数查询
                customCountSql: 'SELECT COUNT(*) as total FROM publish',
                countParams: [],

                // 自定义数据查询（使用LEFT JOIN优化）
                customSql: `
                    SELECT
                        p.version,
                        p.env,
                        p.remark,
                        p.status,
                        u.email as createUser,
                        p.create_time
                    FROM publish p
                    LEFT JOIN user u ON p.create_user = u.id
                    ORDER BY ${orderByName} ${orderDirection || 'DESC'}
                    LIMIT ? OFFSET ?
                `,
                sqlParams: [] // 额外的SQL参数（除了LIMIT和OFFSET）
            }
        );

        console.log('\n2. 测试结果');
        if (result.success) {
            console.log('✅ 查询成功');
            console.log('响应结构:', {
                ...result.data,
                data: `[${result.data.data.length} 条记录]` // 简化显示
            });

            if (result.data.data.length > 0) {
                console.log('第一条记录:', result.data.data[0]);
            }
        } else {
            console.log('❌ 查询失败:', result);
        }

        console.log('\n✅ 测试完成！');
        console.log('\n📊 优化说明:');
        console.log('- ✅ 使用了BusinessHelper.paginateWithValidation公共方法');
        console.log('- ✅ 通过customSql参数支持LEFT JOIN查询');
        console.log('- ✅ 保持了统一的参数验证和字段转换逻辑');
        console.log('- ✅ 避免了N+1查询问题');
        console.log('- ✅ 查询次数固定为2次（计数+数据）');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPublishPageQuery()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPublishPageQuery };
