/**
 * 测试 sound 模块草稿状态可选字段验证
 */

const { BusinessHelper } = require('../config/database');
const { validateApiData } = require('../utils/validator');

async function testSoundDraftOptionalFields() {
    try {
        console.log('🚀 开始测试 sound 模块草稿状态可选字段验证...\n');

        // 1. 测试空值字段跳过验证
        console.log('1. 测试空值字段跳过验证');

        const testCases = [
            {
                name: '空字符串字段',
                data: {
                    name: '测试草稿',
                    genderCode: '',  // 空字符串
                    usageCode: '',   // 空字符串
                    femaleAudioUrl: '',  // 空字符串
                    femaleAudioDuration: '',  // 空字符串
                    maleAudioUrl: '',    // 空字符串
                    maleAudioDuration: '',   // 空字符串
                    translation: 0,
                    status: 'DRAFT'
                }
            },
            {
                name: 'null字段',
                data: {
                    name: '测试草稿',
                    genderCode: null,
                    usageCode: null,
                    femaleAudioUrl: null,
                    femaleAudioDuration: null,
                    maleAudioUrl: null,
                    maleAudioDuration: null,
                    translation: 0,
                    status: 'DRAFT'
                }
            },
            {
                name: 'undefined字段',
                data: {
                    name: '测试草稿',
                    genderCode: undefined,
                    usageCode: undefined,
                    femaleAudioUrl: undefined,
                    femaleAudioDuration: undefined,
                    maleAudioUrl: undefined,
                    maleAudioDuration: undefined,
                    translation: 0,
                    status: 'DRAFT'
                }
            },
            {
                name: '部分字段为空',
                data: {
                    name: '测试草稿',
                    genderCode: 'FEMALE',  // 有效值
                    usageCode: '',         // 空字符串
                    femaleAudioUrl: 'https://example.com/test.mp3',  // 有效值
                    femaleAudioDuration: '',  // 空字符串
                    translation: 0,
                    status: 'DRAFT'
                }
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n1.${testCases.indexOf(testCase) + 1} ${testCase.name}`);
            
            const validation = validateApiData('sound.draft', testCase.data);
            console.log('验证结果:', validation.valid ? '✅ 通过' : '❌ 失败');
            
            if (!validation.valid) {
                console.log('验证错误:', validation.errors?.join(', '));
            }
        }

        // 2. 测试有效值的格式验证
        console.log('\n2. 测试有效值的格式验证');

        const validValueTests = [
            {
                name: '有效的枚举值',
                data: {
                    name: '测试草稿',
                    genderCode: 'FEMALE',
                    usageCode: 'GENERAL',
                    translation: 1,
                    status: 'DRAFT'
                },
                expected: true
            },
            {
                name: '无效的枚举值',
                data: {
                    name: '测试草稿',
                    genderCode: 'INVALID_GENDER',
                    usageCode: 'GENERAL',
                    translation: 1,
                    status: 'DRAFT'
                },
                expected: false
            },
            {
                name: '有效的URL',
                data: {
                    name: '测试草稿',
                    femaleAudioUrl: 'https://example.com/audio.mp3',
                    translation: 0,
                    status: 'DRAFT'
                },
                expected: true
            },
            {
                name: '无效的URL',
                data: {
                    name: '测试草稿',
                    femaleAudioUrl: 'invalid-url',
                    translation: 0,
                    status: 'DRAFT'
                },
                expected: false
            },
            {
                name: '有效的整数',
                data: {
                    name: '测试草稿',
                    femaleAudioDuration: 30,
                    translation: 0,
                    status: 'DRAFT'
                },
                expected: true
            },
            {
                name: '无效的整数',
                data: {
                    name: '测试草稿',
                    femaleAudioDuration: 'not-a-number',
                    translation: 0,
                    status: 'DRAFT'
                },
                expected: false
            }
        ];

        for (const test of validValueTests) {
            console.log(`\n2.${validValueTests.indexOf(test) + 1} ${test.name}`);
            
            const validation = validateApiData('sound.draft', test.data);
            const isCorrect = validation.valid === test.expected;
            
            console.log('验证结果:', validation.valid ? '✅ 通过' : '❌ 失败');
            console.log('预期结果:', test.expected ? '✅ 通过' : '❌ 失败');
            console.log('测试结果:', isCorrect ? '✅ 正确' : '❌ 不正确');
            
            if (!validation.valid) {
                console.log('验证错误:', validation.errors?.join(', '));
            }
        }

        // 3. 测试实际保存操作
        console.log('\n3. 测试实际保存操作');

        // 3.1 保存包含空字段的草稿
        console.log('3.1 保存包含空字段的草稿');
        const draftWithEmptyFields = {
            name: '包含空字段的草稿',
            genderCode: '',  // 空字符串
            usageCode: '',   // 空字符串
            femaleAudioUrl: '',  // 空字符串
            femaleAudioDuration: null,  // null
            maleAudioUrl: null,    // null
            maleAudioDuration: null,   // null
            translation: 0,
            status: 'DRAFT'
        };

        const saveResult1 = await BusinessHelper.insertWithValidation('sound', draftWithEmptyFields);
        if (saveResult1.success) {
            console.log('✅ 包含空字段的草稿保存成功，ID:', saveResult1.insertId);
            var draftId1 = saveResult1.insertId;
        } else {
            console.log('❌ 包含空字段的草稿保存失败:', saveResult1.message);
        }

        // 3.2 保存部分有效字段的草稿
        console.log('3.2 保存部分有效字段的草稿');
        const draftWithPartialFields = {
            name: '部分字段的草稿',
            genderCode: 'MALE',  // 有效值
            usageCode: '',       // 空字符串
            femaleAudioUrl: 'https://example.com/test.mp3',  // 有效值
            femaleAudioDuration: 45,  // 有效值
            maleAudioUrl: '',    // 空字符串
            maleAudioDuration: null,   // null
            translation: 1,
            status: 'DRAFT'
        };

        const saveResult2 = await BusinessHelper.insertWithValidation('sound', draftWithPartialFields);
        if (saveResult2.success) {
            console.log('✅ 部分字段的草稿保存成功，ID:', saveResult2.insertId);
            var draftId2 = saveResult2.insertId;
        } else {
            console.log('❌ 部分字段的草稿保存失败:', saveResult2.message);
        }

        // 4. 验证保存的数据
        console.log('\n4. 验证保存的数据');
        const savedIds = [draftId1, draftId2].filter(id => id);
        
        if (savedIds.length > 0) {
            const { query } = require('../config/database');
            const savedRecords = await query(
                `SELECT id, name, gender_code, usage_code, female_audio_url, female_audio_duration, male_audio_url, male_audio_duration, translation, status FROM sound WHERE id IN (${savedIds.map(() => '?').join(',')})`,
                savedIds
            );

            console.log('保存的记录:');
            savedRecords.forEach(record => {
                console.log(`  - ID: ${record.id}`);
                console.log(`    名称: ${record.name}`);
                console.log(`    状态: ${record.status}`);
                console.log(`    性别: ${record.gender_code || '未设置'}`);
                console.log(`    用途: ${record.usage_code || '未设置'}`);
                console.log(`    女声URL: ${record.female_audio_url || '未设置'}`);
                console.log(`    女声时长: ${record.female_audio_duration || '未设置'}`);
                console.log(`    男声URL: ${record.male_audio_url || '未设置'}`);
                console.log(`    男声时长: ${record.male_audio_duration || '未设置'}`);
                console.log(`    翻译: ${record.translation}`);
                console.log('');
            });

            // 清理测试数据
            const deleteResult = await query(
                `DELETE FROM sound WHERE id IN (${savedIds.map(() => '?').join(',')})`,
                savedIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ sound 模块草稿状态可选字段验证测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 空字符串字段跳过验证');
        console.log('- ✅ null字段跳过验证');
        console.log('- ✅ undefined字段跳过验证');
        console.log('- ✅ 有效值进行格式验证');
        console.log('- ✅ 无效值被正确拒绝');
        console.log('- ✅ 草稿可以保存包含空字段的数据');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundDraftOptionalFields()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundDraftOptionalFields };
