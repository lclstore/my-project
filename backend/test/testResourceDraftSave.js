/**
 * 测试Resource草稿保存功能
 */

const { validateApiData } = require('../utils/validator');
const { sanitizeParams } = require('../utils/commonHelper');

async function testResourceDraftValidation() {
    try {
        console.log('🔍 测试Resource草稿保存功能...\n');

        // 1. 测试草稿状态验证（只需要name）
        console.log('1. 测试草稿状态验证（只需要name）:');
        const draftData = {
            name: '测试草稿资源',
            status: 'DRAFT'
            // 其他字段都是undefined或未设置
        };

        const draftValidation = validateApiData('resource.draft', draftData);
        console.log('   草稿验证结果:', draftValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!draftValidation.valid) {
            console.log('   错误信息:', draftValidation.errors);
        }

        // 2. 测试完整状态验证（需要所有必填字段）
        console.log('\n2. 测试完整状态验证（需要所有必填字段）:');
        const enabledData = {
            name: '测试启用资源',
            status: 'ENABLED'
            // 缺少applicationCode, genderCode, coverImgUrl, detailImgUrl
        };

        const enabledValidation = validateApiData('resource', enabledData);
        console.log('   完整验证结果:', enabledValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!enabledValidation.valid) {
            console.log('   错误信息:', enabledValidation.errors);
        }

        // 3. 测试完整数据验证
        console.log('\n3. 测试完整数据验证:');
        const completeData = {
            name: '测试完整资源',
            description: '这是一个完整的资源',
            applicationCode: 'PLAN',
            genderCode: 'FEMALE',
            coverImgUrl: 'https://example.com/cover.jpg',
            detailImgUrl: 'https://example.com/detail.jpg',
            status: 'ENABLED'
        };

        const completeValidation = validateApiData('resource', completeData);
        console.log('   完整数据验证结果:', completeValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!completeValidation.valid) {
            console.log('   错误信息:', completeValidation.errors);
        }

        // 4. 测试sanitizeParams函数
        console.log('\n4. 测试sanitizeParams函数:');
        const paramsWithUndefined = [
            'test resource',
            undefined,  // description
            'PLAN',
            undefined,  // genderCode
            'https://example.com/cover.jpg',
            undefined,  // detailImgUrl
            'DRAFT'
        ];

        const sanitizedParams = sanitizeParams(paramsWithUndefined);
        console.log('   原始参数:', paramsWithUndefined);
        console.log('   清理后参数:', sanitizedParams);
        console.log('   undefined转换为null:', sanitizedParams.includes(null) && !sanitizedParams.includes(undefined) ? '✅ 成功' : '❌ 失败');

        // 5. 测试草稿状态的可选字段验证
        console.log('\n5. 测试草稿状态的可选字段验证:');
        const draftWithOptionalFields = {
            name: '测试草稿资源',
            status: 'DRAFT',
            description: '草稿描述',
            applicationCode: 'WORKOUT',
            genderCode: 'MALE',
            coverImgUrl: 'https://example.com/cover.jpg',
            detailImgUrl: 'https://example.com/detail.jpg'
        };

        const draftOptionalValidation = validateApiData('resource.draft', draftWithOptionalFields);
        console.log('   草稿可选字段验证结果:', draftOptionalValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!draftOptionalValidation.valid) {
            console.log('   错误信息:', draftOptionalValidation.errors);
        }

        // 6. 测试无效枚举值
        console.log('\n6. 测试无效枚举值:');
        const invalidEnumData = {
            name: '测试资源',
            status: 'INVALID_STATUS',
            applicationCode: 'INVALID_APP',
            genderCode: 'INVALID_GENDER'
        };

        const invalidEnumValidation = validateApiData('resource.draft', invalidEnumData);
        console.log('   无效枚举验证结果:', invalidEnumValidation.valid ? '✅ 通过' : '❌ 失败（预期）');
        if (!invalidEnumValidation.valid) {
            console.log('   错误信息:', invalidEnumValidation.errors);
        }

        // 7. 测试无效URL
        console.log('\n7. 测试无效URL:');
        const invalidUrlData = {
            name: '测试资源',
            status: 'DRAFT',
            coverImgUrl: 'invalid-url',
            detailImgUrl: 'not-a-url'
        };

        const invalidUrlValidation = validateApiData('resource.draft', invalidUrlData);
        console.log('   无效URL验证结果:', invalidUrlValidation.valid ? '✅ 通过' : '❌ 失败（预期）');
        if (!invalidUrlValidation.valid) {
            console.log('   错误信息:', invalidUrlValidation.errors);
        }

        console.log('\n🎉 所有Resource草稿保存测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testResourceDraftValidation()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testResourceDraftValidation };
