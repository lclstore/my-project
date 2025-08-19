/**
 * 测试Template草稿保存功能
 */

const { validateApiData } = require('../utils/validator');
const { sanitizeParams } = require('../utils/commonHelper');

async function testTemplateDraftValidation() {
    try {
        console.log('🔍 测试Template草稿保存功能...\n');

        // 1. 测试草稿状态验证（只需要name）
        console.log('1. 测试草稿状态验证（只需要name）:');
        const draftData = {
            name: '测试草稿模板',
            status: 'DRAFT'
            // 其他字段都是undefined或未设置
        };

        const draftValidation = validateApiData('template.draft', draftData);
        console.log('   草稿验证结果:', draftValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!draftValidation.valid) {
            console.log('   错误信息:', draftValidation.errors);
        }

        // 2. 测试完整状态验证（需要所有必填字段）
        console.log('\n2. 测试完整状态验证（需要所有必填字段）:');
        const enabledData = {
            name: '测试启用模板',
            status: 'ENABLED'
            // 缺少durationCode和days
        };

        const enabledValidation = validateApiData('template', enabledData);
        console.log('   完整验证结果:', enabledValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!enabledValidation.valid) {
            console.log('   错误信息:', enabledValidation.errors);
        }

        // 3. 测试完整数据验证
        console.log('\n3. 测试完整数据验证:');
        const completeData = {
            name: '测试完整模板',
            description: '这是一个完整的模板',
            durationCode: 'MIN_10_15',
            days: 7,
            status: 'ENABLED',
            unitList: [
                {
                    structureName: '热身',
                    structureTypeCode: 'WARM_UP',
                    count: 3,
                    round: 1
                }
            ]
        };

        const completeValidation = validateApiData('template', completeData);
        console.log('   完整数据验证结果:', completeValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!completeValidation.valid) {
            console.log('   错误信息:', completeValidation.errors);
        }

        // 4. 测试sanitizeParams函数
        console.log('\n4. 测试sanitizeParams函数:');
        const paramsWithUndefined = [
            'test name',
            undefined,  // description
            'MIN_10_15',
            undefined,  // days
            'DRAFT'
        ];

        const sanitizedParams = sanitizeParams(paramsWithUndefined);
        console.log('   原始参数:', paramsWithUndefined);
        console.log('   清理后参数:', sanitizedParams);
        console.log('   undefined转换为null:', sanitizedParams.includes(null) && !sanitizedParams.includes(undefined) ? '✅ 成功' : '❌ 失败');

        // 5. 测试草稿状态的可选字段验证
        console.log('\n5. 测试草稿状态的可选字段验证:');
        const draftWithOptionalFields = {
            name: '测试草稿模板',
            status: 'DRAFT',
            description: '草稿描述',
            durationCode: 'MIN_5_10',
            days: 5,
            unitList: []
        };

        const draftOptionalValidation = validateApiData('template.draft', draftWithOptionalFields);
        console.log('   草稿可选字段验证结果:', draftOptionalValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!draftOptionalValidation.valid) {
            console.log('   错误信息:', draftOptionalValidation.errors);
        }

        // 6. 测试无效枚举值
        console.log('\n6. 测试无效枚举值:');
        const invalidEnumData = {
            name: '测试模板',
            status: 'INVALID_STATUS',
            durationCode: 'INVALID_DURATION'
        };

        const invalidEnumValidation = validateApiData('template.draft', invalidEnumData);
        console.log('   无效枚举验证结果:', invalidEnumValidation.valid ? '✅ 通过' : '❌ 失败（预期）');
        if (!invalidEnumValidation.valid) {
            console.log('   错误信息:', invalidEnumValidation.errors);
        }

        console.log('\n🎉 所有Template草稿保存测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testTemplateDraftValidation()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testTemplateDraftValidation };
