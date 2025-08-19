/**
 * 测试 sound 模块字段映射和排序功能
 */

const { BusinessHelper } = require('../config/database');

async function testSoundFieldMapping() {
    try {
        console.log('🔍 测试 sound 模块字段映射和排序...\n');

        // 字段名映射：前端字段名(camelCase) -> 数据库字段名(snake_case)
        const fieldMapping = {
            'id': 'id',
            'name': 'name',
            'genderCode': 'gender_code',
            'usageCode': 'usage_code',
            'status': 'status',
            'createTime': 'create_time',
            'updateTime': 'update_time',
            'translation': 'translation',
            'femaleAudioUrl': 'female_audio_url',
            'femaleAudioDuration': 'female_audio_duration',
            'maleAudioUrl': 'male_audio_url',
            'maleAudioDuration': 'male_audio_duration',
            'femaleScript': 'female_script',
            'maleScript': 'male_script'
        };

        console.log('1. 测试字段映射');
        console.log('字段映射表:');
        Object.entries(fieldMapping).forEach(([frontend, database]) => {
            console.log(`  ${frontend} -> ${database}`);
        });

        // 测试不同排序字段的分页查询
        const testFields = ['id', 'name', 'genderCode', 'usageCode', 'status', 'createTime'];
        
        for (const orderBy of testFields) {
            console.log(`\n2.${testFields.indexOf(orderBy) + 1} 测试按 ${orderBy} 排序`);
            
            const mockReq = {
                query: {
                    pageSize: '5',
                    pageIndex: '1',
                    orderBy: orderBy,
                    orderDirection: 'DESC'
                }
            };

            // 转换排序字段名
            const dbOrderBy = fieldMapping[orderBy] || 'id';
            console.log(`前端字段: ${orderBy} -> 数据库字段: ${dbOrderBy}`);

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
                    console.log(`   可能的原因: 数据库字段名映射错误`);
                }
            }
        }

        // 测试关键词搜索
        console.log('\n3. 测试关键词搜索功能');
        
        const searchTests = [
            { keywords: '1', description: 'ID全匹配' },
            { keywords: '测试', description: '名称模糊匹配' },
            { keywords: 'abc123', description: '混合字符' }
        ];

        for (const test of searchTests) {
            console.log(`\n3.${searchTests.indexOf(test) + 1} 测试${test.description}: "${test.keywords}"`);
            
            const mockReq = {
                query: {
                    pageSize: '5',
                    pageIndex: '1',
                    keywords: test.keywords,
                    orderBy: 'id',
                    orderDirection: 'DESC'
                }
            };

            const options = {
                orderBy: 'id DESC'
            };

            // 添加搜索条件
            if (test.keywords && test.keywords.trim()) {
                if (/^\d+$/.test(test.keywords.trim())) {
                    options.where = 'id = ?';
                    options.whereParams = [parseInt(test.keywords.trim())];
                    console.log(`   使用ID匹配: id = ${test.keywords}`);
                } else {
                    options.where = 'name LIKE ?';
                    options.whereParams = [`%${test.keywords.trim()}%`];
                    console.log(`   使用名称模糊匹配: name LIKE '%${test.keywords}%'`);
                }
            }

            try {
                const result = await BusinessHelper.paginateWithValidation(
                    'sound',
                    mockReq,
                    options
                );

                if (result.success) {
                    console.log(`✅ ${test.description}搜索成功`);
                    console.log(`   匹配记录数: ${result.data.totalCount}`);
                } else {
                    console.log(`❌ ${test.description}搜索失败: ${result.message}`);
                }
            } catch (error) {
                console.log(`❌ ${test.description}搜索出错: ${error.message}`);
            }
        }

        console.log('\n✅ sound 模块字段映射和排序测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundFieldMapping()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundFieldMapping };
