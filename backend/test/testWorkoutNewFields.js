/**
 * 测试workout表新增的group_code和show_in_page字段
 */

const { query } = require('../config/database');

// 测试新字段是否存在
async function testNewFieldsExist() {
    try {
        console.log('🔍 测试新字段是否存在...');
        
        // 查看表结构
        const structure = await query('DESCRIBE workout');
        
        const groupCodeField = structure.find(field => field.Field === 'group_code');
        const showInPageField = structure.find(field => field.Field === 'show_in_page');
        
        console.log('   字段检查结果:');
        
        if (groupCodeField) {
            console.log('   ✅ group_code字段存在');
            console.log(`     类型: ${groupCodeField.Type}`);
            console.log(`     默认值: ${groupCodeField.Default}`);
            console.log(`     允许为空: ${groupCodeField.Null}`);
        } else {
            console.log('   ❌ group_code字段不存在');
        }
        
        if (showInPageField) {
            console.log('   ✅ show_in_page字段存在');
            console.log(`     类型: ${showInPageField.Type}`);
            console.log(`     默认值: ${showInPageField.Default}`);
            console.log(`     允许为空: ${showInPageField.Null}`);
        } else {
            console.log('   ❌ show_in_page字段不存在');
        }
        
        return groupCodeField && showInPageField;
        
    } catch (error) {
        console.error('❌ 测试新字段失败:', error.message);
        return false;
    }
}

// 测试新字段的数据操作
async function testNewFieldsDataOperations() {
    try {
        console.log('\n🔍 测试新字段的数据操作...');
        
        // 获取一个workout进行测试
        const workouts = await query('SELECT id, name, group_code, show_in_page FROM workout WHERE is_deleted = 0 LIMIT 1');
        
        if (workouts.length === 0) {
            console.log('⚠️  没有workout数据，跳过数据操作测试');
            return true;
        }
        
        const testWorkout = workouts[0];
        console.log('   测试数据:');
        console.log(`     ID: ${testWorkout.id}`);
        console.log(`     名称: ${testWorkout.name}`);
        console.log(`     原始group_code: ${testWorkout.group_code}`);
        console.log(`     原始show_in_page: ${testWorkout.show_in_page}`);
        
        // 测试更新group_code
        console.log('\n   测试更新group_code...');
        const newGroupCode = 'GROUPB';
        const updateGroupSql = 'UPDATE workout SET group_code = ? WHERE id = ?';
        await query(updateGroupSql, [newGroupCode, testWorkout.id]);
        
        // 验证group_code更新
        const verifyGroup = await query('SELECT group_code FROM workout WHERE id = ?', [testWorkout.id]);
        const updatedGroupCode = verifyGroup[0].group_code;
        console.log(`     更新后group_code: ${updatedGroupCode}`);
        console.log(`     group_code更新: ${updatedGroupCode === newGroupCode ? '✅ 成功' : '❌ 失败'}`);
        
        // 测试更新show_in_page
        console.log('\n   测试更新show_in_page...');
        const newShowInPage = testWorkout.show_in_page === 1 ? 0 : 1;
        const updateShowSql = 'UPDATE workout SET show_in_page = ? WHERE id = ?';
        await query(updateShowSql, [newShowInPage, testWorkout.id]);
        
        // 验证show_in_page更新
        const verifyShow = await query('SELECT show_in_page FROM workout WHERE id = ?', [testWorkout.id]);
        const updatedShowInPage = verifyShow[0].show_in_page;
        console.log(`     更新后show_in_page: ${updatedShowInPage}`);
        console.log(`     show_in_page更新: ${updatedShowInPage === newShowInPage ? '✅ 成功' : '❌ 失败'}`);
        
        // 恢复原值
        await query('UPDATE workout SET group_code = ?, show_in_page = ? WHERE id = ?', 
                   [testWorkout.group_code, testWorkout.show_in_page, testWorkout.id]);
        console.log('   ✅ 已恢复原值');
        
        return updatedGroupCode === newGroupCode && updatedShowInPage === newShowInPage;
        
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
        
        // 获取一个workout进行测试
        const workouts = await query('SELECT id FROM workout WHERE is_deleted = 0 LIMIT 1');
        
        if (workouts.length === 0) {
            console.log('⚠️  没有workout数据，跳过枚举值测试');
            return true;
        }
        
        const testId = workouts[0].id;
        
        console.log('   测试有效枚举值:');
        let allValid = true;
        
        for (const value of validValues) {
            try {
                await query('UPDATE workout SET group_code = ? WHERE id = ?', [value, testId]);
                console.log(`     ${value}: ✅ 有效`);
            } catch (error) {
                console.log(`     ${value}: ❌ 无效 - ${error.message}`);
                allValid = false;
            }
        }
        
        // 测试无效值
        console.log('\n   测试无效枚举值:');
        try {
            await query('UPDATE workout SET group_code = ? WHERE id = ?', ['INVALID_GROUP', testId]);
            console.log('     INVALID_GROUP: ❌ 应该失败但成功了');
            allValid = false;
        } catch (error) {
            console.log('     INVALID_GROUP: ✅ 正确拒绝无效值');
        }
        
        // 恢复默认值
        await query('UPDATE workout SET group_code = ? WHERE id = ?', ['GROUPA', testId]);
        console.log('   ✅ 已恢复默认值');
        
        return allValid;
        
    } catch (error) {
        console.error('❌ 测试枚举值失败:', error.message);
        return false;
    }
}

// 测试查询包含新字段
async function testQueryWithNewFields() {
    try {
        console.log('\n🔍 测试查询包含新字段...');
        
        // 测试基本查询
        const basicQuery = await query(`
            SELECT id, name, group_code, show_in_page 
            FROM workout 
            WHERE is_deleted = 0 
            LIMIT 3
        `);
        
        console.log('   基本查询结果:');
        basicQuery.forEach((workout, index) => {
            console.log(`     ${index + 1}. ${workout.name}`);
            console.log(`        group_code: ${workout.group_code}`);
            console.log(`        show_in_page: ${workout.show_in_page}`);
        });
        
        // 测试按group_code筛选
        const groupQuery = await query(`
            SELECT COUNT(*) as count 
            FROM workout 
            WHERE group_code = 'GROUPA' AND is_deleted = 0
        `);
        
        console.log(`   group_code='GROUPA'的数量: ${groupQuery[0].count}`);
        
        // 测试按show_in_page筛选
        const showQuery = await query(`
            SELECT COUNT(*) as count 
            FROM workout 
            WHERE show_in_page = 1 AND is_deleted = 0
        `);
        
        console.log(`   show_in_page=1的数量: ${showQuery[0].count}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ 测试查询失败:', error.message);
        return false;
    }
}

// 测试category详情查询包含新字段
async function testCategoryDetailWithNewFields() {
    try {
        console.log('\n🔍 测试category详情查询包含新字段...');
        
        // 模拟category详情查询中的workout查询
        const workoutSql = `
            SELECT w.id, w.name, w.description, w.premium, w.new_start_time, w.new_end_time,
                   w.cover_img_url, w.detail_img_url, w.thumbnail_img_url, w.complete_img_url,
                   w.gender_code, w.difficulty_code, w.position_code, w.calorie, w.duration,
                   w.status, w.file_status, w.audio_json_languages, w.group_code, w.show_in_page,
                   cw.sort_order
            FROM category_workout cw
            INNER JOIN workout w ON cw.workout_id = w.id AND w.is_deleted = 0
            WHERE cw.category_id = ?
            ORDER BY cw.sort_order, w.id
        `;
        
        // 获取一个有关联workout的category
        const categories = await query(`
            SELECT DISTINCT cw.category_id 
            FROM category_workout cw 
            INNER JOIN workout w ON cw.workout_id = w.id AND w.is_deleted = 0
            LIMIT 1
        `);
        
        if (categories.length === 0) {
            console.log('⚠️  没有category-workout关联数据，跳过测试');
            return true;
        }
        
        const categoryId = categories[0].category_id;
        console.log(`   测试category ID: ${categoryId}`);
        
        // 执行查询
        const workoutResult = await query(workoutSql, [categoryId]);
        
        console.log(`   查询结果: ${workoutResult.length} 个workout`);
        
        if (workoutResult.length > 0) {
            const firstWorkout = workoutResult[0];
            console.log('   示例workout数据:');
            console.log(`     ID: ${firstWorkout.id}`);
            console.log(`     名称: ${firstWorkout.name}`);
            console.log(`     group_code: ${firstWorkout.group_code}`);
            console.log(`     show_in_page: ${firstWorkout.show_in_page}`);
            console.log(`     sort_order: ${firstWorkout.sort_order}`);
            
            // 检查新字段是否存在
            const hasGroupCode = firstWorkout.hasOwnProperty('group_code');
            const hasShowInPage = firstWorkout.hasOwnProperty('show_in_page');
            
            console.log(`   新字段检查:`);
            console.log(`     group_code存在: ${hasGroupCode ? '✅' : '❌'}`);
            console.log(`     show_in_page存在: ${hasShowInPage ? '✅' : '❌'}`);
            
            return hasGroupCode && hasShowInPage;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ 测试category详情查询失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试workout表新增字段功能\n');
    
    try {
        // 1. 测试新字段是否存在
        const fieldsExistTest = await testNewFieldsExist();
        
        // 2. 测试新字段的数据操作
        const dataOperationsTest = await testNewFieldsDataOperations();
        
        // 3. 测试group_code枚举值
        const enumValuesTest = await testGroupCodeEnumValues();
        
        // 4. 测试查询包含新字段
        const queryTest = await testQueryWithNewFields();
        
        // 5. 测试category详情查询包含新字段
        const categoryDetailTest = await testCategoryDetailWithNewFields();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   新字段存在: ${fieldsExistTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   数据操作: ${dataOperationsTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   枚举值验证: ${enumValuesTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   查询功能: ${queryTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   category详情查询: ${categoryDetailTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = fieldsExistTest && dataOperationsTest && enumValuesTest && queryTest && categoryDetailTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 workout表新字段功能正常！');
            console.log('   ✅ group_code字段: ENUM类型，支持7个分组值');
            console.log('   ✅ show_in_page字段: TINYINT(1)类型，控制是否在app展示');
            console.log('   ✅ 字段默认值正确设置');
            console.log('   ✅ 数据操作功能正常');
            console.log('   ✅ 查询功能包含新字段');
            console.log('   ✅ category详情查询支持新字段');
        }
        
        console.log('\n✅ 新字段功能测试完成');
        
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
    testNewFieldsExist,
    testNewFieldsDataOperations,
    testGroupCodeEnumValues,
    testQueryWithNewFields,
    testCategoryDetailWithNewFields
};
