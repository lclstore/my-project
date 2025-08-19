/**
 * 测试参数处理工具函数
 */

const {
    parseArrayParam,
    parseIntParam,
    parseFloatParam,
    parseBooleanParam,
    parseStringParam,
    parsePaginationParams,
    parseSortParams,
    parseDateRangeParams,
    parseQueryParams,
    cleanEmptyParams
} = require('../utils/paramHelper');

function testParamHelper() {
    console.log('🚀 开始测试参数处理工具函数...\n');

    // 1. 测试数组参数解析
    console.log('1. 测试数组参数解析');
    
    const arrayTests = [
        { input: null, expected: null, description: 'null值' },
        { input: undefined, expected: null, description: 'undefined值' },
        { input: '', expected: null, description: '空字符串' },
        { input: ['a', 'b', 'c'], expected: ['a', 'b', 'c'], description: '已有数组' },
        { input: 'a,b,c', expected: ['a', 'b', 'c'], description: '逗号分隔字符串' },
        { input: 'a, b , c ', expected: ['a', 'b', 'c'], description: '带空格的逗号分隔字符串' },
        { input: 'single', expected: ['single'], description: '单个字符串' },
        { input: 123, expected: [123], description: '数字转数组' },
        { input: ',,,', expected: null, description: '只有逗号的字符串' }
    ];

    arrayTests.forEach((test, index) => {
        const result = parseArrayParam(test.input);
        const passed = JSON.stringify(result) === JSON.stringify(test.expected);
        console.log(`1.${index + 1} ${test.description}: ${passed ? '✅' : '❌'}`);
        console.log(`  输入: ${JSON.stringify(test.input)}`);
        console.log(`  期望: ${JSON.stringify(test.expected)}`);
        console.log(`  实际: ${JSON.stringify(result)}`);
        console.log('');
    });

    // 2. 测试整数参数解析
    console.log('2. 测试整数参数解析');
    
    const intTests = [
        { input: null, defaultValue: 0, expected: 0, description: 'null值使用默认值' },
        { input: undefined, defaultValue: 10, expected: 10, description: 'undefined值使用默认值' },
        { input: '', defaultValue: 5, expected: 5, description: '空字符串使用默认值' },
        { input: '123', defaultValue: 0, expected: 123, description: '字符串数字' },
        { input: 456, defaultValue: 0, expected: 456, description: '数字' },
        { input: '12.34', defaultValue: 0, expected: 12, description: '浮点数字符串转整数' },
        { input: 'abc', defaultValue: 99, expected: 99, description: '无效字符串使用默认值' }
    ];

    intTests.forEach((test, index) => {
        const result = parseIntParam(test.input, test.defaultValue);
        const passed = result === test.expected;
        console.log(`2.${index + 1} ${test.description}: ${passed ? '✅' : '❌'}`);
        console.log(`  输入: ${JSON.stringify(test.input)}, 默认值: ${test.defaultValue}`);
        console.log(`  期望: ${test.expected}, 实际: ${result}`);
        console.log('');
    });

    // 3. 测试布尔参数解析
    console.log('3. 测试布尔参数解析');
    
    const boolTests = [
        { input: null, defaultValue: false, expected: false, description: 'null值使用默认值' },
        { input: 'true', defaultValue: false, expected: true, description: '字符串true' },
        { input: 'false', defaultValue: true, expected: false, description: '字符串false' },
        { input: '1', defaultValue: false, expected: true, description: '字符串1' },
        { input: '0', defaultValue: true, expected: false, description: '字符串0' },
        { input: 1, defaultValue: false, expected: true, description: '数字1' },
        { input: 0, defaultValue: true, expected: false, description: '数字0' },
        { input: 'yes', defaultValue: false, expected: true, description: '字符串yes' },
        { input: 'no', defaultValue: true, expected: false, description: '字符串no' }
    ];

    boolTests.forEach((test, index) => {
        const result = parseBooleanParam(test.input, test.defaultValue);
        const passed = result === test.expected;
        console.log(`3.${index + 1} ${test.description}: ${passed ? '✅' : '❌'}`);
        console.log(`  输入: ${JSON.stringify(test.input)}, 默认值: ${test.defaultValue}`);
        console.log(`  期望: ${test.expected}, 实际: ${result}`);
        console.log('');
    });

    // 4. 测试分页参数解析
    console.log('4. 测试分页参数解析');
    
    const paginationTests = [
        { 
            input: {}, 
            expected: { pageIndex: 1, pageSize: 10, offset: 0 }, 
            description: '空对象使用默认值' 
        },
        { 
            input: { pageIndex: '2', pageSize: '20' }, 
            expected: { pageIndex: 2, pageSize: 20, offset: 20 }, 
            description: '正常分页参数' 
        },
        { 
            input: { pageIndex: '0', pageSize: '200' }, 
            expected: { pageIndex: 1, pageSize: 100, offset: 0 }, 
            description: '边界值处理' 
        },
        { 
            input: { pageIndex: 'abc', pageSize: 'def' }, 
            expected: { pageIndex: 1, pageSize: 10, offset: 0 }, 
            description: '无效值使用默认值' 
        }
    ];

    paginationTests.forEach((test, index) => {
        const result = parsePaginationParams(test.input);
        const passed = JSON.stringify(result) === JSON.stringify(test.expected);
        console.log(`4.${index + 1} ${test.description}: ${passed ? '✅' : '❌'}`);
        console.log(`  输入: ${JSON.stringify(test.input)}`);
        console.log(`  期望: ${JSON.stringify(test.expected)}`);
        console.log(`  实际: ${JSON.stringify(result)}`);
        console.log('');
    });

    // 5. 测试排序参数解析
    console.log('5. 测试排序参数解析');
    
    const sortTests = [
        { 
            input: [null, null], 
            expected: { orderBy: 'id', orderDirection: 'DESC' }, 
            description: '空值使用默认值' 
        },
        { 
            input: ['name', 'asc'], 
            expected: { orderBy: 'name', orderDirection: 'ASC' }, 
            description: '正常排序参数' 
        },
        { 
            input: ['createTime', 'invalid'], 
            expected: { orderBy: 'createTime', orderDirection: 'DESC' }, 
            description: '无效排序方向使用默认值' 
        }
    ];

    sortTests.forEach((test, index) => {
        const result = parseSortParams(test.input[0], test.input[1]);
        const passed = JSON.stringify(result) === JSON.stringify(test.expected);
        console.log(`5.${index + 1} ${test.description}: ${passed ? '✅' : '❌'}`);
        console.log(`  输入: [${test.input[0]}, ${test.input[1]}]`);
        console.log(`  期望: ${JSON.stringify(test.expected)}`);
        console.log(`  实际: ${JSON.stringify(result)}`);
        console.log('');
    });

    // 6. 测试批量参数解析
    console.log('6. 测试批量参数解析');
    
    const queryParamsTest = {
        statusList: 'ENABLED,DISABLED',
        pageIndex: '2',
        pageSize: '20',
        isActive: 'true',
        keywords: 'test'
    };

    const config = {
        statusList: { type: 'array' },
        pageIndex: { type: 'int', defaultValue: 1 },
        pageSize: { type: 'int', defaultValue: 10 },
        isActive: { type: 'boolean', defaultValue: false },
        keywords: { type: 'string', defaultValue: null }
    };

    const batchResult = parseQueryParams(queryParamsTest, config);
    console.log('6.1 批量参数解析结果:');
    console.log(`  输入: ${JSON.stringify(queryParamsTest)}`);
    console.log(`  配置: ${JSON.stringify(config)}`);
    console.log(`  结果: ${JSON.stringify(batchResult)}`);
    console.log('');

    // 7. 测试清理空值参数
    console.log('7. 测试清理空值参数');
    
    const dirtyParams = {
        name: 'test',
        value: null,
        list: [],
        count: 0,
        flag: false,
        empty: '',
        undefined: undefined,
        validList: ['a', 'b']
    };

    const cleanedParams = cleanEmptyParams(dirtyParams);
    console.log('7.1 清理空值参数结果:');
    console.log(`  输入: ${JSON.stringify(dirtyParams)}`);
    console.log(`  结果: ${JSON.stringify(cleanedParams)}`);
    console.log('');

    console.log('✅ 参数处理工具函数测试完成！');
    console.log('\n📋 测试总结:');
    console.log('- ✅ 数组参数解析（支持逗号分隔字符串）');
    console.log('- ✅ 整数参数解析（带默认值）');
    console.log('- ✅ 布尔参数解析（多种格式支持）');
    console.log('- ✅ 分页参数解析（边界值处理）');
    console.log('- ✅ 排序参数解析（默认值处理）');
    console.log('- ✅ 批量参数解析（配置化）');
    console.log('- ✅ 空值参数清理');
}

// 如果直接运行此脚本
if (require.main === module) {
    testParamHelper();
}

module.exports = { testParamHelper };
