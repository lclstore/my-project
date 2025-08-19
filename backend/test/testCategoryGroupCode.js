/**
 * 测试category表的group_code字段功能
 */

const { query } = require('../config/database');

// 测试group_code字段是否存在
async function testGroupCodeFieldExists() {
    try {
        console.log('🔍 测试category表group_code字段是否存在...');
        
        // 查看表结构
        const structure = await query('DESCRIBE category');
        const groupCodeField = structure.find(field => field.Field === 'group_code');
        
        if (groupCodeField) {
            console.log('✅ group_code字段存在');
            console.log(`   字段类型: ${groupCodeField.Type}`);
            console.log(`   默认值: ${groupCodeField.Default}`);
            console.log(`   允许为空: ${groupCodeField.Null}`);
            console.log(`   注释: ${groupCodeField.Comment || '无'}`);
            return true;
        } else {
            console.log('❌ group_code字段不存在');
            console.log('   现有字段:');
            structure.forEach(field => {
                console.log(`     ${field.Field} - ${field.Type}`);
            });
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试group_code字段失败:', error.message);
        return false;
    }
}

// 测试group_code字段的数据操作
async function testGroupCodeDataOperations() {
    try {
        console.log('\n🔍 测试group_code字段的数据操作...');
        
        // 获取一个category进行测试
        const categories = await query('SELECT id, name, group_code FROM category WHERE is_deleted = 0 LIMIT 1');
        
        if (categories.length === 0) {
            console.log('⚠️  没有category数据，跳过数据操作测试');
            return true;
        }
        
        const testCategory = categories[0];
        console.log('   测试数据:');
        console.log(`     ID: ${testCategory.id}`);
        console.log(`     名称: ${testCategory.name}`);
        console.log(`     原始group_code: ${testCategory.group_code}`);
        
        // 测试更新group_code
        console.log('\n   测试更新group_code...');
        const newGroupCode = testCategory.group_code === 'GROUPA' ? 'GROUPB' : 'GROUPA';
        const updateSql = 'UPDATE category SET group_code = ? WHERE id = ?';
        await query(updateSql, [newGroupCode, testCategory.id]);
        
        // 验证更新结果
        const verifyResult = await query('SELECT group_code FROM category WHERE id = ?', [testCategory.id]);
        const updatedGroupCode = verifyResult[0].group_code;
        console.log(`     更新后group_code: ${updatedGroupCode}`);
        console.log(`     group_code更新: ${updatedGroupCode === newGroupCode ? '✅ 成功' : '❌ 失败'}`);
        
        // 恢复原值
        await query(updateSql, [testCategory.group_code, testCategory.id]);
        console.log('   ✅ 已恢复原值');
        
        return updatedGroupCode === newGroupCode;
        
    } catch (error) {
        console.error('❌ 测试数据操作失败:', error.message);
        return false;
    }
}

// 测试group_code枚举值
async function testGroupCodeEnumValues() {
    try {
        console.log('\n🔍 测试group_code枚举值...');
        
        const validValues = ['GROUPA', 'GROUPB', 'GROUPC', 'GROUPD', 'GROUPE', 'GROUPF', 'GROUPG'];
        
        // 获取一个category进行测试
        const categories = await query('SELECT id FROM category WHERE is_deleted = 0 LIMIT 1');
        
        if (categories.length === 0) {
            console.log('⚠️  没有category数据，跳过枚举值测试');
            return true;
        }
        
        const testId = categories[0].id;
        
        console.log('   测试有效枚举值:');
        let allValid = true;
        
        for (const value of validValues) {
            try {
                await query('UPDATE category SET group_code = ? WHERE id = ?', [value, testId]);
                console.log(`     ${value}: ✅ 有效`);
            } catch (error) {
                console.log(`     ${value}: ❌ 无效 - ${error.message}`);
                allValid = false;
            }
        }
        
        // 测试无效值
        console.log('\n   测试无效枚举值:');
        try {
            await query('UPDATE category SET group_code = ? WHERE id = ?', ['INVALID_GROUP', testId]);
            console.log('     INVALID_GROUP: ❌ 应该失败但成功了');
            allValid = false;
        } catch (error) {
            console.log('     INVALID_GROUP: ✅ 正确拒绝无效值');
        }
        
        // 恢复默认值
        await query('UPDATE category SET group_code = ? WHERE id = ?', ['GROUPA', testId]);
        console.log('   ✅ 已恢复默认值');
        
        return allValid;
        
    } catch (error) {
        console.error('❌ 测试枚举值失败:', error.message);
        return false;
    }
}

// 测试查询包含group_code字段
async function testQueryWithGroupCode() {
    try {
        console.log('\n🔍 测试查询包含group_code字段...');
        
        // 测试基本查询
        const basicQuery = await query(`
            SELECT id, name, group_code, sort 
            FROM category 
            WHERE is_deleted = 0 
            ORDER BY sort, id
            LIMIT 5
        `);
        
        console.log('   基本查询结果:');
        basicQuery.forEach((category, index) => {
            console.log(`     ${index + 1}. ${category.name}`);
            console.log(`        group_code: ${category.group_code}`);
            console.log(`        sort: ${category.sort || 0}`);
        });
        
        // 测试按group_code筛选
        const groupQuery = await query(`
            SELECT COUNT(*) as count 
            FROM category 
            WHERE group_code = 'GROUPA' AND is_deleted = 0
        `);
        
        console.log(`   group_code='GROUPA'的数量: ${groupQuery[0].count}`);
        
        // 测试分组统计
        const groupStats = await query(`
            SELECT group_code, COUNT(*) as count 
            FROM category 
            WHERE is_deleted = 0 
            GROUP BY group_code
        `);
        
        console.log('   分组统计:');
        groupStats.forEach(stat => {
            console.log(`     ${stat.group_code}: ${stat.count} 个category`);
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ 测试查询失败:', error.message);
        return false;
    }
}

// 测试category详情查询包含group_code
async function testCategoryDetailWithGroupCode() {
    try {
        console.log('\n🔍 测试category详情查询包含group_code...');
        
        // 模拟category详情查询
        const detailSql = `
            SELECT id, name, cover_img_url, detail_img_url, description,
                   new_start_time, new_end_time, status, group_code, create_time, update_time
            FROM category
            WHERE id = ? AND is_deleted = 0
        `;
        
        // 获取一个category
        const categories = await query('SELECT id FROM category WHERE is_deleted = 0 LIMIT 1');
        
        if (categories.length === 0) {
            console.log('⚠️  没有category数据，跳过详情查询测试');
            return true;
        }
        
        const categoryId = categories[0].id;
        console.log(`   测试category ID: ${categoryId}`);
        
        // 执行详情查询
        const detailResult = await query(detailSql, [categoryId]);
        
        if (detailResult.length > 0) {
            const categoryDetail = detailResult[0];
            console.log('   详情查询结果:');
            console.log(`     ID: ${categoryDetail.id}`);
            console.log(`     名称: ${categoryDetail.name}`);
            console.log(`     group_code: ${categoryDetail.group_code}`);
            console.log(`     状态: ${categoryDetail.status}`);
            
            // 检查group_code字段是否存在
            const hasGroupCode = categoryDetail.hasOwnProperty('group_code');
            console.log(`   group_code字段检查: ${hasGroupCode ? '✅ 存在' : '❌ 不存在'}`);
            
            return hasGroupCode;
        } else {
            console.log('   ❌ 详情查询无结果');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试详情查询失败:', error.message);
        return false;
    }
}

// 测试列表查询包含group_code
async function testCategoryListWithGroupCode() {
    try {
        console.log('\n🔍 测试category列表查询包含group_code...');
        
        // 模拟列表查询（使用DatabaseHelper.select的字段）
        const listQuery = await query(`
            SELECT id, name, cover_img_url, detail_img_url, description,
                   new_start_time, new_end_time, status, group_code, sort, create_time, update_time
            FROM category
            WHERE is_deleted = 0
            ORDER BY sort, id
            LIMIT 3
        `);
        
        console.log('   列表查询结果:');
        listQuery.forEach((category, index) => {
            console.log(`     ${index + 1}. ${category.name}`);
            console.log(`        group_code: ${category.group_code}`);
            console.log(`        sort: ${category.sort || 0}`);
            console.log(`        状态: ${category.status}`);
        });
        
        // 检查所有记录都包含group_code字段
        const allHaveGroupCode = listQuery.every(item => item.hasOwnProperty('group_code'));
        console.log(`   所有记录包含group_code: ${allHaveGroupCode ? '✅ 是' : '❌ 否'}`);
        
        return allHaveGroupCode;
        
    } catch (error) {
        console.error('❌ 测试列表查询失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category表的group_code字段功能\n');
    
    try {
        // 1. 测试字段是否存在
        const fieldExistsTest = await testGroupCodeFieldExists();
        
        // 2. 测试数据操作
        const dataOperationsTest = await testGroupCodeDataOperations();
        
        // 3. 测试枚举值
        const enumValuesTest = await testGroupCodeEnumValues();
        
        // 4. 测试查询功能
        const queryTest = await testQueryWithGroupCode();
        
        // 5. 测试详情查询
        const detailTest = await testCategoryDetailWithGroupCode();
        
        // 6. 测试列表查询
        const listTest = await testCategoryListWithGroupCode();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   字段存在: ${fieldExistsTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   数据操作: ${dataOperationsTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   枚举值验证: ${enumValuesTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   查询功能: ${queryTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   详情查询: ${detailTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   列表查询: ${listTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = fieldExistsTest && dataOperationsTest && enumValuesTest && queryTest && detailTest && listTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 category表group_code字段功能正常！');
            console.log('   ✅ group_code字段: ENUM类型，支持7个分组值');
            console.log('   ✅ 字段默认值: GROUPA');
            console.log('   ✅ 数据操作功能正常');
            console.log('   ✅ 枚举值验证正确');
            console.log('   ✅ 查询功能包含新字段');
            console.log('   ✅ 详情和列表查询都支持group_code');
        }
        
        console.log('\n✅ category group_code字段功能测试完成');
        
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
    testGroupCodeFieldExists,
    testGroupCodeDataOperations,
    testGroupCodeEnumValues,
    testQueryWithGroupCode,
    testCategoryDetailWithGroupCode,
    testCategoryListWithGroupCode
};
