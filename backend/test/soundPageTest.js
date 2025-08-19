/**
 * 测试 sound/page 接口
 */

const { BusinessHelper } = require('../config/database');

async function testSoundPageAPI() {
    try {
        console.log('🚀 开始测试 sound/page 接口...\n');

        // 1. 测试无关键词的分页查询
        console.log('1. 测试无关键词的分页查询');
        const mockReq1 = {
            query: {
                pageSize: '10',
                pageIndex: '1',
                orderBy: 'id',
                orderDirection: 'DESC'
            }
        };

        const options1 = {
            orderBy: 'id DESC'
        };

        const result1 = await BusinessHelper.paginateWithValidation(
            'sound',
            mockReq1,
            options1
        );

        if (result1.success) {
            console.log('✅ 无关键词分页查询成功');
            console.log('总记录数:', result1.data.totalCount);
            console.log('当前页记录数:', result1.data.data.length);
            console.log('分页信息:', {
                pageIndex: result1.data.pageIndex,
                pageSize: result1.data.pageSize,
                totalPages: result1.data.totalPages
            });
        } else {
            console.log('❌ 无关键词分页查询失败:', result1.message);
        }

        // 2. 测试有关键词的分页查询（如果有数据的话）
        if (result1.success && result1.data.data.length > 0) {
            console.log('\n2. 测试关键词搜索（ID全匹配）');
            const firstRecordId = result1.data.data[0].id;
            
            const mockReq2 = {
                query: {
                    pageSize: '10',
                    pageIndex: '1',
                    keywords: firstRecordId.toString(),
                    orderBy: 'id',
                    orderDirection: 'DESC'
                }
            };

            const options2 = {
                where: 'id = ?',
                whereParams: [firstRecordId],
                orderBy: 'id DESC'
            };

            const result2 = await BusinessHelper.paginateWithValidation(
                'sound',
                mockReq2,
                options2
            );

            if (result2.success) {
                console.log('✅ ID搜索成功');
                console.log('搜索结果数:', result2.data.totalCount);
                if (result2.data.data.length > 0) {
                    console.log('匹配记录ID:', result2.data.data[0].id);
                }
            } else {
                console.log('❌ ID搜索失败:', result2.message);
            }

            // 3. 测试名称模糊搜索
            console.log('\n3. 测试名称模糊搜索');
            const firstName = result1.data.data[0].name;
            if (firstName && firstName.length > 0) {
                const searchKeyword = firstName.substring(0, 1); // 取第一个字符进行模糊搜索
                
                const mockReq3 = {
                    query: {
                        pageSize: '10',
                        pageIndex: '1',
                        keywords: searchKeyword,
                        orderBy: 'id',
                        orderDirection: 'DESC'
                    }
                };

                const options3 = {
                    where: 'name LIKE ?',
                    whereParams: [`%${searchKeyword}%`],
                    orderBy: 'id DESC'
                };

                const result3 = await BusinessHelper.paginateWithValidation(
                    'sound',
                    mockReq3,
                    options3
                );

                if (result3.success) {
                    console.log('✅ 名称搜索成功');
                    console.log('搜索关键词:', searchKeyword);
                    console.log('搜索结果数:', result3.data.totalCount);
                } else {
                    console.log('❌ 名称搜索失败:', result3.message);
                }
            }
        }

        // 4. 测试参数验证
        console.log('\n4. 测试参数验证');
        const mockReq4 = {
            query: {
                pageSize: '0', // 无效的页面大小
                pageIndex: '1'
            }
        };

        const result4 = await BusinessHelper.paginateWithValidation(
            'sound',
            mockReq4,
            { orderBy: 'id DESC' }
        );

        if (!result4.success) {
            console.log('✅ 参数验证正常工作');
            console.log('错误信息:', result4.message);
        } else {
            console.log('❌ 参数验证未生效');
        }

        console.log('\n✅ sound/page 接口测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundPageAPI()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundPageAPI };
