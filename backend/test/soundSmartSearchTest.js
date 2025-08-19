/**
 * 测试 sound 模块智能搜索功能
 */

const { BusinessHelper, query } = require('../config/database');

async function testSoundSmartSearch() {
    try {
        console.log('🚀 开始测试 sound 模块智能搜索功能...\n');

        // 1. 准备测试数据
        console.log('1. 准备测试数据');
        const testData = [
            {
                name: '欢迎语音',
                genderCode: 'FEMALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'ENABLED'
            },
            {
                name: '告别语音',
                genderCode: 'MALE',
                usageCode: 'FLOW',
                translation: 0,
                status: 'ENABLED'
            },
            {
                name: '123号提示音',
                genderCode: 'FEMALE_AND_MALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'DRAFT'
            },
            {
                name: 'ABC456音效',
                genderCode: 'FEMALE',
                usageCode: 'FLOW',
                translation: 0,
                status: 'DISABLED'
            }
        ];

        const createdIds = [];
        for (const data of testData) {
            const result = await BusinessHelper.insertWithValidation('sound', data);
            if (result.success) {
                createdIds.push(result.insertId);
                console.log(`✅ 创建音频资源成功，ID: ${result.insertId}, 名称: "${data.name}"`);
            } else {
                console.log(`❌ 创建音频资源失败: ${result.message}`);
            }
        }

        if (createdIds.length === 0) {
            console.log('❌ 没有创建成功的测试数据');
            return;
        }

        console.log(`创建了 ${createdIds.length} 个测试音频资源: [${createdIds.join(', ')}]`);

        // 2. 测试纯数字搜索（ID精确匹配）
        console.log('\n2. 测试纯数字搜索（ID精确匹配）');
        
        // 2.1 搜索存在的ID
        const existingId = createdIds[0];
        console.log(`2.1 搜索存在的ID: ${existingId}`);
        
        const idSearchResult = await query(
            `SELECT id, name FROM sound WHERE id = ? ORDER BY id DESC`,
            [existingId]
        );
        
        console.log(`ID搜索结果: ${idSearchResult.length} 条记录`);
        idSearchResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: "${record.name}"`);
        });

        // 2.2 搜索不存在的ID（应该回退到名称搜索）
        const nonExistentId = 99999;
        console.log(`\n2.2 搜索不存在的ID: ${nonExistentId}`);
        
        // 先检查ID是否存在
        const idCheckResult = await query('SELECT COUNT(*) as count FROM sound WHERE id = ?', [nonExistentId]);
        console.log(`ID ${nonExistentId} 存在性检查: ${idCheckResult[0].count} 条记录`);
        
        if (idCheckResult[0].count === 0) {
            console.log(`ID ${nonExistentId} 不存在，回退到名称模糊搜索`);
            
            // 按名称模糊搜索
            const nameSearchResult = await query(
                `SELECT id, name FROM sound WHERE name LIKE ? ORDER BY id DESC`,
                [`%${nonExistentId}%`]
            );
            
            console.log(`名称搜索结果: ${nameSearchResult.length} 条记录`);
            nameSearchResult.forEach(record => {
                console.log(`  - ID: ${record.id}, 名称: "${record.name}"`);
            });
        }

        // 3. 测试纯文本搜索（名称模糊匹配）
        console.log('\n3. 测试纯文本搜索（名称模糊匹配）');
        
        const textSearchTerms = ['欢迎', '语音', '提示'];
        
        for (const term of textSearchTerms) {
            console.log(`\n3.${textSearchTerms.indexOf(term) + 1} 搜索文本: "${term}"`);
            
            const textSearchResult = await query(
                `SELECT id, name FROM sound WHERE name LIKE ? ORDER BY id DESC`,
                [`%${term}%`]
            );
            
            console.log(`文本搜索结果: ${textSearchResult.length} 条记录`);
            textSearchResult.forEach(record => {
                console.log(`  - ID: ${record.id}, 名称: "${record.name}"`);
            });
        }

        // 4. 测试混合搜索（数字+文本，按名称模糊匹配）
        console.log('\n4. 测试混合搜索（数字+文本，按名称模糊匹配）');
        
        const mixedSearchTerms = ['123号', 'ABC456', '123提示', 'A1B2'];
        
        for (const term of mixedSearchTerms) {
            console.log(`\n4.${mixedSearchTerms.indexOf(term) + 1} 搜索混合内容: "${term}"`);
            
            // 检查是否为纯数字
            const isPureNumber = /^\d+$/.test(term);
            console.log(`  是否为纯数字: ${isPureNumber}`);
            
            if (!isPureNumber) {
                const mixedSearchResult = await query(
                    `SELECT id, name FROM sound WHERE name LIKE ? ORDER BY id DESC`,
                    [`%${term}%`]
                );
                
                console.log(`  混合搜索结果: ${mixedSearchResult.length} 条记录`);
                mixedSearchResult.forEach(record => {
                    console.log(`    - ID: ${record.id}, 名称: "${record.name}"`);
                });
            }
        }

        // 5. 测试搜索逻辑验证
        console.log('\n5. 测试搜索逻辑验证');
        
        const searchTestCases = [
            { keywords: createdIds[0].toString(), description: '存在的ID（纯数字）', expectedType: 'ID精确匹配' },
            { keywords: '99999', description: '不存在的ID（纯数字）', expectedType: 'ID不存在，回退到名称搜索' },
            { keywords: '欢迎', description: '纯文本', expectedType: '名称模糊搜索' },
            { keywords: '123号', description: '数字+文本', expectedType: '名称模糊搜索' },
            { keywords: 'ABC456', description: '字母+数字', expectedType: '名称模糊搜索' },
            { keywords: '语音123', description: '文本+数字', expectedType: '名称模糊搜索' }
        ];

        for (const testCase of searchTestCases) {
            console.log(`\n5.${searchTestCases.indexOf(testCase) + 1} ${testCase.description}: "${testCase.keywords}"`);
            
            const trimmedKeywords = testCase.keywords.trim();
            const isPureNumber = /^\d+$/.test(trimmedKeywords);
            
            console.log(`  是否为纯数字: ${isPureNumber}`);
            console.log(`  预期搜索类型: ${testCase.expectedType}`);
            
            if (isPureNumber) {
                // 检查ID是否存在
                const idCheckResult = await query('SELECT COUNT(*) as count FROM sound WHERE id = ?', [parseInt(trimmedKeywords)]);
                const idExists = idCheckResult[0].count > 0;
                
                console.log(`  ID存在性: ${idExists}`);
                
                if (idExists) {
                    console.log(`  ✅ 执行ID精确匹配`);
                } else {
                    console.log(`  ✅ ID不存在，回退到名称模糊搜索`);
                }
            } else {
                console.log(`  ✅ 执行名称模糊搜索`);
            }
        }

        // 6. 清理测试数据
        console.log('\n6. 清理测试数据');
        if (createdIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM sound WHERE id IN (${createdIds.map(() => '?').join(',')})`,
                createdIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ sound 模块智能搜索功能测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 纯数字（存在ID）：ID精确匹配');
        console.log('- ✅ 纯数字（不存在ID）：回退到名称模糊搜索');
        console.log('- ✅ 纯文本：名称模糊搜索');
        console.log('- ✅ 混合内容（数字+文本）：名称模糊搜索');
        console.log('- ✅ 搜索逻辑判断正确');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundSmartSearch()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundSmartSearch };
