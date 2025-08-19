/**
 * 测试各模块分页查询返回结构的一致性
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8080/api';
const API_TOKEN = 'test-token';

// 创建axios实例
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'token': API_TOKEN
    }
});

// 测试sound模块的分页结构
async function testSoundPaginationStructure() {
    try {
        console.log('🔍 测试sound模块分页结构...');
        
        const response = await api.get('/sound/page?pageIndex=1&pageSize=3');
        
        if (response.data) {
            console.log('✅ sound模块查询成功');
            console.log('   返回结构分析:');
            console.log(`     类型: ${typeof response.data}`);
            console.log(`     是否有data字段: ${response.data.hasOwnProperty('data')}`);
            console.log(`     是否有total字段: ${response.data.hasOwnProperty('total')}`);
            console.log(`     是否有pageIndex字段: ${response.data.hasOwnProperty('pageIndex')}`);
            console.log(`     是否有pageSize字段: ${response.data.hasOwnProperty('pageSize')}`);
            console.log(`     是否有totalPages字段: ${response.data.hasOwnProperty('totalPages')}`);
            
            if (response.data.data) {
                console.log(`     data数组长度: ${response.data.data.length}`);
                console.log(`     总数: ${response.data.total}`);
                console.log(`     页码: ${response.data.pageIndex}`);
                console.log(`     页大小: ${response.data.pageSize}`);
            }
            
            return {
                success: true,
                structure: {
                    hasData: response.data.hasOwnProperty('data'),
                    hasTotal: response.data.hasOwnProperty('total'),
                    hasPageIndex: response.data.hasOwnProperty('pageIndex'),
                    hasPageSize: response.data.hasOwnProperty('pageSize'),
                    hasTotalPages: response.data.hasOwnProperty('totalPages'),
                    dataType: typeof response.data,
                    dataLength: response.data.data?.length || 0
                }
            };
        } else {
            console.log('❌ sound模块查询失败');
            return { success: false };
        }
    } catch (error) {
        console.error('❌ sound模块测试失败:', error.response?.data || error.message);
        return { success: false };
    }
}

// 测试workout模块的分页结构
async function testWorkoutPaginationStructure() {
    try {
        console.log('\n🔍 测试workout模块分页结构...');
        
        const response = await api.get('/workout/list?pageIndex=1&pageSize=3');
        
        if (response.data) {
            console.log('✅ workout模块查询成功');
            console.log('   返回结构分析:');
            console.log(`     类型: ${typeof response.data}`);
            console.log(`     是否有data字段: ${response.data.hasOwnProperty('data')}`);
            console.log(`     是否有total字段: ${response.data.hasOwnProperty('total')}`);
            console.log(`     是否有pageIndex字段: ${response.data.hasOwnProperty('pageIndex')}`);
            console.log(`     是否有pageSize字段: ${response.data.hasOwnProperty('pageSize')}`);
            console.log(`     是否有totalPages字段: ${response.data.hasOwnProperty('totalPages')}`);
            
            if (response.data.data) {
                console.log(`     data数组长度: ${response.data.data.length}`);
                console.log(`     总数: ${response.data.total}`);
                console.log(`     页码: ${response.data.pageIndex}`);
                console.log(`     页大小: ${response.data.pageSize}`);
            }
            
            return {
                success: true,
                structure: {
                    hasData: response.data.hasOwnProperty('data'),
                    hasTotal: response.data.hasOwnProperty('total'),
                    hasPageIndex: response.data.hasOwnProperty('pageIndex'),
                    hasPageSize: response.data.hasOwnProperty('pageSize'),
                    hasTotalPages: response.data.hasOwnProperty('totalPages'),
                    dataType: typeof response.data,
                    dataLength: response.data.data?.length || 0
                }
            };
        } else {
            console.log('❌ workout模块查询失败');
            return { success: false };
        }
    } catch (error) {
        console.error('❌ workout模块测试失败:', error.response?.data || error.message);
        return { success: false };
    }
}

// 测试category模块的列表结构
async function testCategoryListStructure() {
    try {
        console.log('\n🔍 测试category模块列表结构...');
        
        const response = await api.get('/category/list');
        
        if (response.data) {
            console.log('✅ category模块查询成功');
            console.log('   返回结构分析:');
            console.log(`     类型: ${typeof response.data}`);
            console.log(`     是否为数组: ${Array.isArray(response.data)}`);
            
            if (Array.isArray(response.data)) {
                console.log(`     数组长度: ${response.data.length}`);
                console.log('   注意: category返回的是数组，不是分页对象');
                
                if (response.data.length > 0) {
                    const firstItem = response.data[0];
                    console.log('   示例数据:');
                    console.log(`     ID: ${firstItem.id}`);
                    console.log(`     名称: ${firstItem.name}`);
                    console.log(`     排序: ${firstItem.sort || 0}`);
                }
            }
            
            return {
                success: true,
                structure: {
                    isArray: Array.isArray(response.data),
                    dataType: typeof response.data,
                    dataLength: Array.isArray(response.data) ? response.data.length : 0
                }
            };
        } else {
            console.log('❌ category模块查询失败');
            return { success: false };
        }
    } catch (error) {
        console.error('❌ category模块测试失败:', error.response?.data || error.message);
        return { success: false };
    }
}

// 对比结构一致性
function compareStructures(soundResult, workoutResult, categoryResult) {
    console.log('\n📊 结构一致性对比:');
    
    if (!soundResult.success || !workoutResult.success) {
        console.log('❌ 无法进行对比，部分模块查询失败');
        return false;
    }
    
    const soundStruct = soundResult.structure;
    const workoutStruct = workoutResult.structure;
    
    console.log('\n   分页模块对比 (sound vs workout):');
    console.log(`     hasData: ${soundStruct.hasData} vs ${workoutStruct.hasData} ${soundStruct.hasData === workoutStruct.hasData ? '✅' : '❌'}`);
    console.log(`     hasTotal: ${soundStruct.hasTotal} vs ${workoutStruct.hasTotal} ${soundStruct.hasTotal === workoutStruct.hasTotal ? '✅' : '❌'}`);
    console.log(`     hasPageIndex: ${soundStruct.hasPageIndex} vs ${workoutStruct.hasPageIndex} ${soundStruct.hasPageIndex === workoutStruct.hasPageIndex ? '✅' : '❌'}`);
    console.log(`     hasPageSize: ${soundStruct.hasPageSize} vs ${workoutStruct.hasPageSize} ${soundStruct.hasPageSize === workoutStruct.hasPageSize ? '✅' : '❌'}`);
    console.log(`     hasTotalPages: ${soundStruct.hasTotalPages} vs ${workoutStruct.hasTotalPages} ${soundStruct.hasTotalPages === workoutStruct.hasTotalPages ? '✅' : '❌'}`);
    
    const paginationConsistent = 
        soundStruct.hasData === workoutStruct.hasData &&
        soundStruct.hasTotal === workoutStruct.hasTotal &&
        soundStruct.hasPageIndex === workoutStruct.hasPageIndex &&
        soundStruct.hasPageSize === workoutStruct.hasPageSize &&
        soundStruct.hasTotalPages === workoutStruct.hasTotalPages;
    
    console.log(`   分页结构一致性: ${paginationConsistent ? '✅ 一致' : '❌ 不一致'}`);
    
    if (categoryResult.success) {
        console.log('\n   category模块特殊说明:');
        console.log(`     category返回数组: ${categoryResult.structure.isArray ? '✅' : '❌'}`);
        console.log('     这是设计决定：category查询所有数据，不分页');
    }
    
    return paginationConsistent;
}

// 测试标准分页响应格式
function testStandardPaginationFormat(result) {
    if (!result.success) return false;
    
    const data = result.structure;
    
    // 标准分页格式应该包含这些字段
    const requiredFields = ['hasData', 'hasTotal', 'hasPageIndex', 'hasPageSize', 'hasTotalPages'];
    const hasAllFields = requiredFields.every(field => 
        data[field] === true
    );
    
    return hasAllFields;
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试各模块分页查询返回结构的一致性\n');
    
    try {
        // 1. 测试sound模块分页结构
        const soundResult = await testSoundPaginationStructure();
        
        // 2. 测试workout模块分页结构
        const workoutResult = await testWorkoutPaginationStructure();
        
        // 3. 测试category模块列表结构
        const categoryResult = await testCategoryListStructure();
        
        // 4. 对比结构一致性
        const isConsistent = compareStructures(soundResult, workoutResult, categoryResult);
        
        // 5. 验证标准分页格式
        const soundStandard = testStandardPaginationFormat(soundResult);
        const workoutStandard = testStandardPaginationFormat(workoutResult);
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   sound模块查询: ${soundResult.success ? '✅ 成功' : '❌ 失败'}`);
        console.log(`   workout模块查询: ${workoutResult.success ? '✅ 成功' : '❌ 失败'}`);
        console.log(`   category模块查询: ${categoryResult.success ? '✅ 成功' : '❌ 失败'}`);
        console.log(`   分页结构一致性: ${isConsistent ? '✅ 一致' : '❌ 不一致'}`);
        console.log(`   sound标准格式: ${soundStandard ? '✅ 符合' : '❌ 不符合'}`);
        console.log(`   workout标准格式: ${workoutStandard ? '✅ 符合' : '❌ 不符合'}`);
        
        const allPassed = soundResult.success && workoutResult.success && categoryResult.success && isConsistent && soundStandard && workoutStandard;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 所有模块返回结构一致！');
            console.log('   ✅ sound和workout模块使用相同的分页结构');
            console.log('   ✅ 分页结构包含完整的分页信息');
            console.log('   ✅ category模块返回数组（查询所有数据）');
            console.log('   ✅ 前端可以统一处理分页响应');
        } else {
            console.log('\n⚠️  存在结构不一致的问题，需要修复');
        }
        
        console.log('\n✅ 分页结构一致性测试完成');
        
    } catch (error) {
        console.error('\n💥 测试过程中发生错误:', error);
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testSoundPaginationStructure,
    testWorkoutPaginationStructure,
    testCategoryListStructure,
    compareStructures
};
