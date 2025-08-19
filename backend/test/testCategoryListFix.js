/**
 * 测试修复后的category列表查询
 */

const { query } = require('../config/database');

// 测试数据库连接和基本查询
async function testDatabaseConnection() {
    try {
        console.log('🔍 测试数据库连接...');
        
        const result = await query('SELECT 1 as test');
        console.log('✅ 数据库连接正常');
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// 测试category表查询
async function testCategoryTableQuery() {
    try {
        console.log('\n🔍 测试category表查询...');
        
        // 测试基本查询
        const result = await query('SELECT COUNT(*) as total FROM category WHERE is_deleted = 0');
        console.log(`✅ category表查询成功，总数: ${result[0].total}`);
        
        // 测试字段查询
        const fieldResult = await query(`
            SELECT id, name, cover_img_url, detail_img_url, description,
                   new_start_time, new_end_time, status, create_time, update_time
            FROM category 
            WHERE is_deleted = 0
            LIMIT 1
        `);
        
        if (fieldResult.length > 0) {
            console.log('✅ 字段查询成功');
            console.log('   示例数据:', fieldResult[0]);
        } else {
            console.log('⚠️  表中暂无数据');
        }
        
        return true;
    } catch (error) {
        console.error('❌ category表查询失败:', error.message);
        return false;
    }
}

// 测试分页查询逻辑
async function testPaginationLogic() {
    try {
        console.log('\n🔍 测试分页查询逻辑...');
        
        const pageSize = 5;
        const pageIndex = 1;
        const offset = (pageIndex - 1) * pageSize;
        
        // 查询总数
        const countSql = `SELECT COUNT(*) as total FROM category WHERE is_deleted = 0`;
        const countResult = await query(countSql);
        const total = countResult[0].total;
        console.log(`   总数: ${total}`);
        
        // 查询数据
        const dataSql = `
            SELECT id, name, cover_img_url, detail_img_url, description,
                   new_start_time, new_end_time, status, create_time, update_time
            FROM category 
            WHERE is_deleted = 0
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;
        const dataResult = await query(dataSql, [pageSize, offset]);
        console.log(`   数据条数: ${dataResult.length}`);
        
        if (dataResult.length > 0) {
            console.log('   示例数据:');
            dataResult.forEach((item, index) => {
                console.log(`     ${index + 1}. ${item.name} (ID: ${item.id}, 状态: ${item.status})`);
            });
        }
        
        console.log('✅ 分页查询逻辑测试成功');
        return true;
    } catch (error) {
        console.error('❌ 分页查询逻辑测试失败:', error.message);
        return false;
    }
}

// 测试QueryConditionBuilder
async function testQueryConditionBuilder() {
    try {
        console.log('\n🔍 测试QueryConditionBuilder...');
        
        const { QueryConditionBuilder } = require('../utils/enumHelper');
        
        const conditionBuilder = new QueryConditionBuilder();
        conditionBuilder.addNumberCondition('is_deleted', 0);
        conditionBuilder.addStringCondition('name', '测试', 'like');
        
        const { where, params } = conditionBuilder.build();
        console.log('   构建的WHERE条件:', where);
        console.log('   参数:', params);
        
        // 测试查询
        const testSql = `SELECT COUNT(*) as total FROM category WHERE ${where}`;
        const testResult = await query(testSql, params);
        console.log(`   查询结果: ${testResult[0].total} 条`);
        
        console.log('✅ QueryConditionBuilder测试成功');
        return true;
    } catch (error) {
        console.error('❌ QueryConditionBuilder测试失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试修复后的category列表查询\n');
    
    try {
        // 1. 测试数据库连接
        const dbTest = await testDatabaseConnection();
        if (!dbTest) {
            console.log('💥 数据库连接失败，终止测试');
            return;
        }
        
        // 2. 测试category表查询
        const tableTest = await testCategoryTableQuery();
        
        // 3. 测试分页查询逻辑
        const paginationTest = await testPaginationLogic();
        
        // 4. 测试QueryConditionBuilder
        const builderTest = await testQueryConditionBuilder();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   数据库连接: ${dbTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   表查询: ${tableTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   分页逻辑: ${paginationTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   条件构建: ${builderTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = dbTest && tableTest && paginationTest && builderTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 修复验证成功，category列表查询应该可以正常工作了！');
        } else {
            console.log('\n⚠️  仍有问题需要解决');
        }
        
        console.log('\n✅ 修复测试完成');
        
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
    testDatabaseConnection,
    testCategoryTableQuery,
    testPaginationLogic,
    testQueryConditionBuilder
};
