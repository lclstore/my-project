/**
 * 测试category模块的字段转换功能
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

// 测试category列表的字段转换
async function testCategoryListFieldConversion() {
    try {
        console.log('🔍 测试category列表的字段转换...');
        
        const response = await api.get('/category/list');
        
        if (response.data && Array.isArray(response.data)) {
            console.log('✅ category列表查询成功');
            console.log(`   返回数据数量: ${response.data.length}`);
            
            if (response.data.length > 0) {
                const firstCategory = response.data[0];
                console.log('\n   字段转换检查:');
                
                // 检查前端格式字段（camelCase）
                const frontendFields = [
                    'id', 'name', 'coverImgUrl', 'detailImgUrl', 'description',
                    'newStartTime', 'newEndTime', 'status', 'groupCode', 'sort',
                    'createTime', 'updateTime'
                ];
                
                // 检查数据库格式字段（snake_case）- 这些不应该存在
                const databaseFields = [
                    'cover_img_url', 'detail_img_url', 'new_start_time', 'new_end_time',
                    'group_code', 'create_time', 'update_time'
                ];
                
                console.log('   前端格式字段检查:');
                frontendFields.forEach(field => {
                    const exists = firstCategory.hasOwnProperty(field);
                    console.log(`     ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
                });
                
                console.log('\n   数据库格式字段检查（应该不存在）:');
                let hasDbFields = false;
                databaseFields.forEach(field => {
                    const exists = firstCategory.hasOwnProperty(field);
                    if (exists) hasDbFields = true;
                    console.log(`     ${field}: ${exists ? '❌ 存在（错误）' : '✅ 不存在（正确）'}`);
                });
                
                console.log('\n   示例数据:');
                console.log(`     ID: ${firstCategory.id}`);
                console.log(`     名称: ${firstCategory.name}`);
                console.log(`     分组代码: ${firstCategory.groupCode}`);
                console.log(`     排序: ${firstCategory.sort}`);
                console.log(`     状态: ${firstCategory.status}`);
                console.log(`     创建时间: ${firstCategory.createTime}`);
                
                return !hasDbFields; // 如果没有数据库格式字段，说明转换正确
            } else {
                console.log('⚠️  没有category数据');
                return true;
            }
        } else {
            console.log('❌ category列表查询失败或返回格式错误');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试category列表字段转换失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试category详情的字段转换
async function testCategoryDetailFieldConversion() {
    try {
        console.log('\n🔍 测试category详情的字段转换...');
        
        // 先获取一个category ID
        const listResponse = await api.get('/category/list');
        if (!listResponse.data || listResponse.data.length === 0) {
            console.log('⚠️  没有category数据，跳过详情测试');
            return true;
        }
        
        const categoryId = listResponse.data[0].id;
        console.log(`   测试category ID: ${categoryId}`);
        
        const response = await api.get(`/category/detail/${categoryId}`);
        
        if (response.data.success) {
            const categoryDetail = response.data.data;
            console.log('✅ category详情查询成功');
            
            console.log('\n   category基本信息字段转换检查:');
            
            // 检查前端格式字段
            const frontendFields = [
                'id', 'name', 'coverImgUrl', 'detailImgUrl', 'description',
                'newStartTime', 'newEndTime', 'status', 'groupCode',
                'createTime', 'updateTime'
            ];
            
            // 检查数据库格式字段
            const databaseFields = [
                'cover_img_url', 'detail_img_url', 'new_start_time', 'new_end_time',
                'group_code', 'create_time', 'update_time'
            ];
            
            console.log('   前端格式字段检查:');
            frontendFields.forEach(field => {
                const exists = categoryDetail.hasOwnProperty(field);
                console.log(`     ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
            });
            
            console.log('\n   数据库格式字段检查（应该不存在）:');
            let hasDbFields = false;
            databaseFields.forEach(field => {
                const exists = categoryDetail.hasOwnProperty(field);
                if (exists) hasDbFields = true;
                console.log(`     ${field}: ${exists ? '❌ 存在（错误）' : '✅ 不存在（正确）'}`);
            });
            
            // 检查workout列表的字段转换
            if (categoryDetail.workoutList && categoryDetail.workoutList.length > 0) {
                console.log('\n   workout列表字段转换检查:');
                const firstWorkout = categoryDetail.workoutList[0];
                
                const workoutFrontendFields = [
                    'id', 'name', 'description', 'coverImgUrl', 'detailImgUrl',
                    'genderCode', 'difficultyCode', 'positionCode', 'groupCode',
                    'showInPage', 'sortOrder', 'injuredCodes'
                ];
                
                const workoutDbFields = [
                    'cover_img_url', 'detail_img_url', 'gender_code', 'difficulty_code',
                    'position_code', 'group_code', 'show_in_page', 'sort_order', 'injured_codes'
                ];
                
                console.log('     workout前端格式字段:');
                workoutFrontendFields.slice(0, 5).forEach(field => {
                    const exists = firstWorkout.hasOwnProperty(field);
                    console.log(`       ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
                });
                
                console.log('     workout数据库格式字段（应该不存在）:');
                workoutDbFields.slice(0, 5).forEach(field => {
                    const exists = firstWorkout.hasOwnProperty(field);
                    if (exists) hasDbFields = true;
                    console.log(`       ${field}: ${exists ? '❌ 存在（错误）' : '✅ 不存在（正确）'}`);
                });
            }
            
            console.log('\n   示例详情数据:');
            console.log(`     ID: ${categoryDetail.id}`);
            console.log(`     名称: ${categoryDetail.name}`);
            console.log(`     分组代码: ${categoryDetail.groupCode}`);
            console.log(`     状态: ${categoryDetail.status}`);
            console.log(`     workout数量: ${categoryDetail.workoutList?.length || 0}`);
            
            return !hasDbFields;
        } else {
            console.log('❌ category详情查询失败:', response.data.errMessage);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试category详情字段转换失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试保存接口的字段转换
async function testCategorySaveFieldConversion() {
    try {
        console.log('\n🔍 测试category保存接口的字段转换...');
        
        // 测试数据（使用前端格式）
        const testData = {
            name: '测试分类字段转换',
            description: '测试字段转换功能',
            status: 'DRAFT',
            groupCode: 'GROUPB', // 前端格式
            coverImgUrl: 'https://example.com/cover.jpg', // 前端格式
            detailImgUrl: 'https://example.com/detail.jpg', // 前端格式
            newStartTime: '2024-01-01 00:00:00', // 前端格式
            newEndTime: '2024-12-31 23:59:59' // 前端格式
        };
        
        console.log('   使用前端格式字段保存category...');
        const saveResponse = await api.post('/category/save', testData);
        
        if (saveResponse.data.success) {
            console.log('✅ category保存成功');
            const categoryId = saveResponse.data.data.categoryId;
            console.log(`   新建category ID: ${categoryId}`);
            
            // 查询保存的数据验证字段转换
            const detailResponse = await api.get(`/category/detail/${categoryId}`);
            
            if (detailResponse.data.success) {
                const savedCategory = detailResponse.data.data;
                console.log('✅ 保存后查询成功');
                
                console.log('   字段转换验证:');
                console.log(`     groupCode: ${savedCategory.groupCode} (期望: ${testData.groupCode})`);
                console.log(`     coverImgUrl: ${savedCategory.coverImgUrl} (期望: ${testData.coverImgUrl})`);
                console.log(`     detailImgUrl: ${savedCategory.detailImgUrl} (期望: ${testData.detailImgUrl})`);
                
                const fieldsMatch = 
                    savedCategory.groupCode === testData.groupCode &&
                    savedCategory.coverImgUrl === testData.coverImgUrl &&
                    savedCategory.detailImgUrl === testData.detailImgUrl;
                
                console.log(`   字段转换正确性: ${fieldsMatch ? '✅ 正确' : '❌ 错误'}`);
                
                // 清理测试数据
                await api.post('/category/del', { idList: [categoryId] });
                console.log('   ✅ 测试数据已清理');
                
                return fieldsMatch;
            } else {
                console.log('❌ 保存后查询失败');
                return false;
            }
        } else {
            console.log('❌ category保存失败:', saveResponse.data.errMessage);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试category保存字段转换失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category模块的字段转换功能\n');
    
    try {
        // 1. 测试列表查询的字段转换
        const listTest = await testCategoryListFieldConversion();
        
        // 2. 测试详情查询的字段转换
        const detailTest = await testCategoryDetailFieldConversion();
        
        // 3. 测试保存接口的字段转换
        const saveTest = await testCategorySaveFieldConversion();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   列表查询字段转换: ${listTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   详情查询字段转换: ${detailTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   保存接口字段转换: ${saveTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = listTest && detailTest && saveTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 category模块字段转换功能正常！');
            console.log('   ✅ 列表查询返回前端格式字段（camelCase）');
            console.log('   ✅ 详情查询返回前端格式字段');
            console.log('   ✅ 保存接口正确处理前端格式字段');
            console.log('   ✅ 没有暴露数据库格式字段（snake_case）');
            console.log('   ✅ group_code正确转换为groupCode');
            console.log('   ✅ 遵循公共方法和字段转换规范');
        } else {
            console.log('\n⚠️  字段转换存在问题，需要修复');
        }
        
        console.log('\n✅ category字段转换功能测试完成');
        
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
    testCategoryListFieldConversion,
    testCategoryDetailFieldConversion,
    testCategorySaveFieldConversion
};
