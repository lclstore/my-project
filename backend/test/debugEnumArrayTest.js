/**
 * 调试 enumArray 验证规则
 */

const { validateApiData } = require('../utils/validator');

function testEnumArrayValidation() {
    console.log('🔍 调试 enumArray 验证规则...\n');

    // 1. 测试 exercise.query 验证
    console.log('1. 测试 exercise.query 验证');
    
    const testData = {
        statusList: ['ENABLED', 'DISABLED']
    };

    console.log('测试数据:', JSON.stringify(testData));
    
    const result = validateApiData('exercise.query', testData);
    console.log('验证结果:', result.valid ? '✅ 通过' : '❌ 失败');
    
    if (!result.valid) {
        console.log('错误信息:', result.errors);
    }

    // 2. 测试单个 enumArray 规则
    console.log('\n2. 测试单个 enumArray 规则');
    
    const { ValidationRules } = require('../utils/validator');
    
    const testValues = [
        { value: ['ENABLED', 'DISABLED'], allowedValues: ['DRAFT', 'ENABLED', 'DISABLED'], description: '有效值' },
        { value: ['INVALID'], allowedValues: ['DRAFT', 'ENABLED', 'DISABLED'], description: '无效值' },
        { value: [], allowedValues: ['DRAFT', 'ENABLED', 'DISABLED'], description: '空数组' }
    ];

    testValues.forEach((test, index) => {
        console.log(`\n2.${index + 1} ${test.description}`);
        console.log(`  输入值: ${JSON.stringify(test.value)}`);
        console.log(`  允许值: ${JSON.stringify(test.allowedValues)}`);
        
        const result = ValidationRules.enumArray(test.value, 'statusList', test.allowedValues);
        console.log(`  结果: ${result.valid ? '✅ 通过' : '❌ 失败'}`);
        
        if (!result.valid) {
            console.log(`  错误: ${result.message}`);
        }
    });

    // 3. 测试参数传递
    console.log('\n3. 测试参数传递');
    
    const ruleConfig = {
        rule: 'enumArray',
        params: [['DRAFT', 'ENABLED', 'DISABLED']],
        message: '状态列表包含无效值，允许的值: DRAFT, ENABLED, DISABLED'
    };

    console.log('规则配置:', JSON.stringify(ruleConfig));
    console.log('params:', JSON.stringify(ruleConfig.params));
    console.log('展开后的参数:', ruleConfig.params);

    // 模拟验证调用
    const { params = [] } = ruleConfig;
    console.log('传递给验证函数的参数:', params);
    
    const testResult = ValidationRules.enumArray(['ENABLED', 'DISABLED'], 'statusList', ...params);
    console.log('验证结果:', testResult.valid ? '✅ 通过' : '❌ 失败');
    
    if (!testResult.valid) {
        console.log('错误信息:', testResult.message);
    }

    console.log('\n✅ enumArray 验证规则调试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
    testEnumArrayValidation();
}

module.exports = { testEnumArrayValidation };
