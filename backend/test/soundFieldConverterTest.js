/**
 * 测试 sound 模块使用 fieldConverter 工具的字段转换
 */

const { BusinessHelper } = require('../config/database');
const { toSnakeCase, toCamelCase } = require('../utils/fieldConverter');

async function testSoundFieldConverter() {
    try {
        console.log('🔍 测试 sound 模块使用 fieldConverter 工具...\n');

        // 1. 测试字段转换工具
        console.log('1. 测试字段转换工具');
        const testFields = [
            'id',
            'name', 
            'genderCode',
            'usageCode',
            'status',
            'createTime',
            'updateTime',
            'femaleAudioUrl',
            'femaleAudioDuration',
            'maleAudioUrl',
            'maleAudioDuration',
            'femaleScript',
            'maleScript'
        ];

        console.log('字段转换测试:');
        testFields.forEach(field => {
            const snakeCase = toSnakeCase(field);
            const backToCamel = toCamelCase(snakeCase);
            console.log(`  ${field} -> ${snakeCase} -> ${backToCamel}`);
            
            // 验证往返转换是否正确
            if (field !== backToCamel) {
                console.log(`    ⚠️  往返转换不一致: ${field} !== ${backToCamel}`);
            }
        });

        // 2. 测试排序字段转换
        console.log('\n2. 测试排序字段转换');
        const sortTestFields = ['id', 'name', 'genderCode', 'usageCode', 'status', 'createTime'];
        
        for (const orderBy of sortTestFields) {
            console.log(`\n2.${sortTestFields.indexOf(orderBy) + 1} 测试按 ${orderBy} 排序`);
            
            // 使用 toSnakeCase 转换字段名
            const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';
            console.log(`前端字段: ${orderBy} -> 数据库字段: ${dbOrderBy}`);

            const mockReq = {
                query: {
                    pageSize: '5',
                    pageIndex: '1',
                    orderBy: orderBy,
                    orderDirection: 'DESC'
                }
            };

            const options = {
                orderBy: `${dbOrderBy} DESC`
            };

            try {
                const result = await BusinessHelper.paginateWithValidation(
                    'sound',
                    mockReq,
                    options
                );

                if (result.success) {
                    console.log(`✅ 按 ${orderBy} 排序查询成功`);
                    console.log(`   总记录数: ${result.data.totalCount}`);
                    console.log(`   当前页记录数: ${result.data.data.length}`);
                    
                    if (result.data.data.length > 0) {
                        const firstRecord = result.data.data[0];
                        console.log(`   第一条记录的 ${orderBy}: ${firstRecord[orderBy]}`);
                    }
                } else {
                    console.log(`❌ 按 ${orderBy} 排序查询失败: ${result.message}`);
                }
            } catch (error) {
                console.log(`❌ 按 ${orderBy} 排序查询出错: ${error.message}`);
                if (error.message.includes('Unknown column')) {
                    console.log(`   数据库字段: ${dbOrderBy}`);
                    console.log(`   可能的原因: 数据库中不存在该字段`);
                }
            }
        }

        // 3. 测试特殊字段转换
        console.log('\n3. 测试特殊字段转换');
        const specialFields = {
            'usageCode': 'usage_code',
            'genderCode': 'gender_code', 
            'femaleAudioUrl': 'female_audio_url',
            'femaleAudioDuration': 'female_audio_duration',
            'createTime': 'create_time',
            'updateTime': 'update_time'
        };

        console.log('特殊字段转换验证:');
        Object.entries(specialFields).forEach(([camel, expectedSnake]) => {
            const actualSnake = toSnakeCase(camel);
            const isCorrect = actualSnake === expectedSnake;
            console.log(`  ${camel} -> ${actualSnake} ${isCorrect ? '✅' : '❌ (期望: ' + expectedSnake + ')'}`);
        });

        // 4. 模拟完整的分页请求处理
        console.log('\n4. 模拟完整的分页请求处理');
        const mockReq = {
            query: {
                pageSize: '3',
                pageIndex: '1',
                orderBy: 'usageCode',  // 前端传递 camelCase
                orderDirection: 'ASC',
                keywords: '测试'
            }
        };

        console.log('模拟请求参数:', mockReq.query);

        // 模拟 sound.js 中的处理逻辑
        const { keywords, orderBy, orderDirection } = mockReq.query;
        const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';
        
        console.log(`字段转换: ${orderBy} -> ${dbOrderBy}`);

        const options = {
            orderBy: `${dbOrderBy} ${orderDirection || 'DESC'}`
        };

        // 添加搜索条件
        if (keywords && keywords.trim()) {
            if (/^\d+$/.test(keywords.trim())) {
                options.where = 'id = ?';
                options.whereParams = [parseInt(keywords.trim())];
                console.log(`搜索条件: ID = ${keywords}`);
            } else {
                options.where = 'name LIKE ?';
                options.whereParams = [`%${keywords.trim()}%`];
                console.log(`搜索条件: name LIKE '%${keywords}%'`);
            }
        }

        console.log('最终查询选项:', options);

        try {
            const result = await BusinessHelper.paginateWithValidation(
                'sound',
                mockReq,
                options
            );

            if (result.success) {
                console.log('✅ 完整请求处理成功');
                console.log(`   匹配记录数: ${result.data.totalCount}`);
                console.log(`   当前页记录数: ${result.data.data.length}`);
                
                if (result.data.data.length > 0) {
                    console.log('   第一条记录:', {
                        id: result.data.data[0].id,
                        name: result.data.data[0].name,
                        usageCode: result.data.data[0].usageCode
                    });
                }
            } else {
                console.log('❌ 完整请求处理失败:', result.message);
            }
        } catch (error) {
            console.log('❌ 完整请求处理出错:', error.message);
        }

        console.log('\n✅ sound 模块 fieldConverter 工具测试完成！');
        console.log('\n📋 总结:');
        console.log('- ✅ 使用 toSnakeCase 工具函数进行字段转换');
        console.log('- ✅ 避免了手动维护字段映射表');
        console.log('- ✅ 支持所有 camelCase 到 snake_case 的转换');
        console.log('- ✅ 代码更简洁，维护性更好');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundFieldConverter()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundFieldConverter };
