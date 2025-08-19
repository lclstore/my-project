/**
 * 调试 optional 验证规则
 */

const { ValidationRules } = require('../utils/validator');

function testOptionalRule() {
    console.log('🔍 调试 optional 验证规则...\n');

    // 测试不同的值
    const testValues = [
        { value: '', description: '空字符串' },
        { value: null, description: 'null' },
        { value: undefined, description: 'undefined' },
        { value: 'FEMALE', description: '有效枚举值' },
        { value: 'INVALID', description: '无效枚举值' },
        { value: 'https://example.com/test.mp3', description: '有效URL' },
        { value: 'invalid-url', description: '无效URL' },
        { value: 30, description: '有效整数' },
        { value: 'not-a-number', description: '无效整数' }
    ];

    // 测试 enumFromLib 验证
    console.log('1. 测试 enumFromLib 验证');
    testValues.forEach((test, index) => {
        console.log(`\n1.${index + 1} ${test.description}: ${JSON.stringify(test.value)}`);
        
        try {
            const result = ValidationRules.optional(test.value, 'genderCode', 'enumFromLib', 'BizSoundGenderEnums');
            console.log('验证结果:', result.valid ? '✅ 通过' : '❌ 失败');
            if (!result.valid) {
                console.log('错误信息:', result.message);
            }
        } catch (error) {
            console.log('❌ 验证出错:', error.message);
        }
    });

    // 测试 url 验证
    console.log('\n2. 测试 url 验证');
    const urlTests = [
        { value: '', description: '空字符串' },
        { value: null, description: 'null' },
        { value: 'https://example.com/test.mp3', description: '有效URL' },
        { value: 'invalid-url', description: '无效URL' }
    ];

    urlTests.forEach((test, index) => {
        console.log(`\n2.${index + 1} ${test.description}: ${JSON.stringify(test.value)}`);
        
        try {
            const result = ValidationRules.optional(test.value, 'femaleAudioUrl', 'url');
            console.log('验证结果:', result.valid ? '✅ 通过' : '❌ 失败');
            if (!result.valid) {
                console.log('错误信息:', result.message);
            }
        } catch (error) {
            console.log('❌ 验证出错:', error.message);
        }
    });

    // 测试 integer 验证
    console.log('\n3. 测试 integer 验证');
    const integerTests = [
        { value: '', description: '空字符串' },
        { value: null, description: 'null' },
        { value: 30, description: '有效整数' },
        { value: 'not-a-number', description: '无效整数' }
    ];

    integerTests.forEach((test, index) => {
        console.log(`\n3.${index + 1} ${test.description}: ${JSON.stringify(test.value)}`);
        
        try {
            const result = ValidationRules.optional(test.value, 'femaleAudioDuration', 'integer');
            console.log('验证结果:', result.valid ? '✅ 通过' : '❌ 失败');
            if (!result.valid) {
                console.log('错误信息:', result.message);
            }
        } catch (error) {
            console.log('❌ 验证出错:', error.message);
        }
    });

    // 测试直接调用基础验证规则
    console.log('\n4. 测试直接调用基础验证规则');
    
    console.log('\n4.1 直接调用 enumFromLib');
    try {
        const result1 = ValidationRules.enumFromLib('', 'genderCode', 'BizSoundGenderEnums');
        console.log('空字符串结果:', result1.valid ? '✅ 通过' : '❌ 失败', result1.message || '');
        
        const result2 = ValidationRules.enumFromLib('FEMALE', 'genderCode', 'BizSoundGenderEnums');
        console.log('有效值结果:', result2.valid ? '✅ 通过' : '❌ 失败', result2.message || '');
    } catch (error) {
        console.log('❌ enumFromLib 出错:', error.message);
    }

    console.log('\n4.2 直接调用 url');
    try {
        const result1 = ValidationRules.url('', 'femaleAudioUrl');
        console.log('空字符串结果:', result1.valid ? '✅ 通过' : '❌ 失败', result1.message || '');
        
        const result2 = ValidationRules.url('https://example.com/test.mp3', 'femaleAudioUrl');
        console.log('有效URL结果:', result2.valid ? '✅ 通过' : '❌ 失败', result2.message || '');
    } catch (error) {
        console.log('❌ url 出错:', error.message);
    }

    console.log('\n4.3 直接调用 integer');
    try {
        const result1 = ValidationRules.integer('', 'femaleAudioDuration');
        console.log('空字符串结果:', result1.valid ? '✅ 通过' : '❌ 失败', result1.message || '');
        
        const result2 = ValidationRules.integer(30, 'femaleAudioDuration');
        console.log('有效整数结果:', result2.valid ? '✅ 通过' : '❌ 失败', result2.message || '');
    } catch (error) {
        console.log('❌ integer 出错:', error.message);
    }

    console.log('\n✅ optional 验证规则调试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
    testOptionalRule();
}

module.exports = { testOptionalRule };
