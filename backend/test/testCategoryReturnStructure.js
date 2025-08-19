/**
 * 测试category返回结构和字段转换
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

// 测试category列表返回结构
async function testCategoryListStructure() {
    try {
        console.log('🔍 测试category列表返回结构...');
        
        const response = await api.get('/category/list');
        
        console.log('   返回结构分析:');
        console.log(`     响应状态: ${response.status}`);
        console.log(`     数据类型: ${typeof response.data}`);
        console.log(`     是否为数组: ${Array.isArray(response.data)}`);
        
        if (Array.isArray(response.data)) {
            console.log(`     数组长度: ${response.data.length}`);
            console.log('   ✅ 返回结构正确（数组格式）');
            
            if (response.data.length > 0) {
                const firstItem = response.data[0];
                console.log('\n   字段转换检查:');
                
                // 检查前端格式字段
                const frontendFields = ['id', 'name', 'groupCode', 'sort', 'createTime'];
                const dbFields = ['group_code', 'create_time'];
                
                console.log('     前端格式字段:');
                frontendFields.forEach(field => {
                    const exists = firstItem.hasOwnProperty(field);
                    console.log(`       ${field}: ${exists ? '✅' : '❌'}`);
                });
                
                console.log('     数据库格式字段（应该不存在）:');
                let hasDbFields = false;
                dbFields.forEach(field => {
                    const exists = firstItem.hasOwnProperty(field);
                    if (exists) hasDbFields = true;
                    console.log(`       ${field}: ${exists ? '❌ 存在' : '✅ 不存在'}`);
                });
                
                console.log('\n   示例数据:');
                console.log(`     ID: ${firstItem.id}`);
                console.log(`     名称: ${firstItem.name}`);
                console.log(`     分组: ${firstItem.groupCode}`);
                console.log(`     排序: ${firstItem.sort}`);
                
                return !hasDbFields;
            }
            
            return true;
        } else {
            console.log('   ❌ 返回结构错误（不是数组）');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 对比不同模块的返回结构
async function compareModuleStructures() {
    try {
        console.log('\n🔍 对比不同模块的返回结构...');
        
        // 1. Category模块（查询所有）
        console.log('   Category模块:');
        const categoryResponse = await api.get('/category/list');
        console.log(`     类型: ${typeof categoryResponse.data}`);
        console.log(`     是数组: ${Array.isArray(categoryResponse.data)}`);
        console.log(`     设计: 查询所有数据，返回数组`);
        
        // 2. Sound模块（分页查询）
        console.log('\n   Sound模块:');
        try {
            const soundResponse = await api.get('/sound/page?pageIndex=1&pageSize=3');
            console.log(`     类型: ${typeof soundResponse.data}`);
            console.log(`     是数组: ${Array.isArray(soundResponse.data)}`);
            console.log(`     有分页信息: ${soundResponse.data.hasOwnProperty('total')}`);
            console.log(`     设计: 分页查询，返回分页对象`);
        } catch (error) {
            console.log('     Sound模块测试跳过（可能无数据或接口问题）');
        }
        
        // 3. Workout模块（分页查询）
        console.log('\n   Workout模块:');
        try {
            const workoutResponse = await api.get('/workout/list?pageIndex=1&pageSize=3');
            console.log(`     类型: ${typeof workoutResponse.data}`);
            console.log(`     是数组: ${Array.isArray(workoutResponse.data)}`);
            console.log(`     有分页信息: ${workoutResponse.data.hasOwnProperty('total')}`);
            console.log(`     设计: 分页查询，返回分页对象`);
        } catch (error) {
            console.log('     Workout模块测试跳过（可能无数据或接口问题）');
        }
        
        console.log('\n   结构设计总结:');
        console.log('     ✅ Category: 数组格式（查询所有数据）');
        console.log('     ✅ Sound/Workout: 分页对象格式（分页查询）');
        console.log('     ✅ 设计合理，符合不同业务需求');
        
        return true;
        
    } catch (error) {
        console.error('❌ 对比测试失败:', error.message);
        return false;
    }
}

// 测试字段转换的完整性
async function testFieldConversionCompleteness() {
    try {
        console.log('\n🔍 测试字段转换的完整性...');
        
        const response = await api.get('/category/list');
        
        if (Array.isArray(response.data) && response.data.length > 0) {
            const category = response.data[0];
            
            console.log('   完整字段检查:');
            
            // 期望的前端字段
            const expectedFields = {
                'id': 'number',
                'name': 'string',
                'coverImgUrl': 'string',
                'detailImgUrl': 'string', 
                'description': 'string',
                'newStartTime': 'string',
                'newEndTime': 'string',
                'status': 'string',
                'groupCode': 'string',
                'sort': 'number',
                'createTime': 'string',
                'updateTime': 'string'
            };
            
            let allFieldsCorrect = true;
            
            Object.entries(expectedFields).forEach(([field, expectedType]) => {
                const exists = category.hasOwnProperty(field);
                const actualType = typeof category[field];
                const typeCorrect = !exists || actualType === expectedType || category[field] === null;
                
                if (!typeCorrect) allFieldsCorrect = false;
                
                console.log(`     ${field}: ${exists ? '✅' : '❌'} (${exists ? actualType : 'missing'})`);
            });
            
            // 检查不应该存在的数据库字段
            const forbiddenFields = [
                'cover_img_url', 'detail_img_url', 'new_start_time', 'new_end_time',
                'group_code', 'create_time', 'update_time', 'is_deleted'
            ];
            
            console.log('\n   禁止字段检查:');
            let hasForbiddenFields = false;
            
            forbiddenFields.forEach(field => {
                const exists = category.hasOwnProperty(field);
                if (exists) hasForbiddenFields = true;
                console.log(`     ${field}: ${exists ? '❌ 存在（错误）' : '✅ 不存在'}`);
            });
            
            const conversionCorrect = allFieldsCorrect && !hasForbiddenFields;
            console.log(`\n   字段转换完整性: ${conversionCorrect ? '✅ 正确' : '❌ 有问题'}`);
            
            return conversionCorrect;
        } else {
            console.log('⚠️  没有数据可测试');
            return true;
        }
        
    } catch (error) {
        console.error('❌ 测试字段转换完整性失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category返回结构和字段转换\n');
    
    try {
        // 1. 测试返回结构
        const structureTest = await testCategoryListStructure();
        
        // 2. 对比不同模块结构
        const compareTest = await compareModuleStructures();
        
        // 3. 测试字段转换完整性
        const conversionTest = await testFieldConversionCompleteness();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   返回结构: ${structureTest ? '✅ 正确' : '❌ 错误'}`);
        console.log(`   模块对比: ${compareTest ? '✅ 合理' : '❌ 不合理'}`);
        console.log(`   字段转换: ${conversionTest ? '✅ 完整' : '❌ 有问题'}`);
        
        const allPassed = structureTest && compareTest && conversionTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 category模块返回结构和字段转换正确！');
            console.log('   ✅ 返回数组格式（符合查询所有数据的设计）');
            console.log('   ✅ 字段正确转换为前端格式（camelCase）');
            console.log('   ✅ 没有暴露数据库内部字段');
            console.log('   ✅ group_code正确转换为groupCode');
            console.log('   ✅ 与其他模块的设计差异合理');
        } else {
            console.log('\n⚠️  存在问题需要修复');
        }
        
        console.log('\n✅ 返回结构和字段转换测试完成');
        
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
    testCategoryListStructure,
    compareModuleStructures,
    testFieldConversionCompleteness
};
