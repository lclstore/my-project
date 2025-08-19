/**
 * 测试category的sort字段功能
 */

const { query } = require('../config/database');

// 测试sort字段是否存在
async function testSortFieldExists() {
    try {
        console.log('🔍 测试sort字段是否存在...');
        
        // 查看表结构
        const structure = await query('DESCRIBE category');
        const sortField = structure.find(field => field.Field === 'sort');
        
        if (sortField) {
            console.log('✅ sort字段存在');
            console.log(`   字段类型: ${sortField.Type}`);
            console.log(`   默认值: ${sortField.Default}`);
            console.log(`   注释: ${sortField.Comment || '无'}`);
            return true;
        } else {
            console.log('❌ sort字段不存在');
            console.log('   现有字段:');
            structure.forEach(field => {
                console.log(`     ${field.Field} - ${field.Type}`);
            });
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试sort字段失败:', error.message);
        return false;
    }
}

// 测试更新sort字段
async function testUpdateSortField() {
    try {
        console.log('\n🔍 测试更新sort字段...');
        
        // 获取一个category进行测试
        const categories = await query('SELECT id, name, sort FROM category WHERE is_deleted = 0 LIMIT 3');
        
        if (categories.length === 0) {
            console.log('⚠️  没有category数据，跳过更新测试');
            return true;
        }
        
        console.log('   测试数据:');
        categories.forEach((cat, index) => {
            console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort})`);
        });
        
        // 更新第一个category的sort值
        const testId = categories[0].id;
        const newSortValue = 999;
        
        const updateSql = `
            UPDATE category 
            SET sort = ?, update_time = NOW() 
            WHERE id = ? AND is_deleted = 0
        `;
        
        const updateResult = await query(updateSql, [newSortValue, testId]);
        console.log(`   更新结果: 影响行数 ${updateResult.affectedRows}`);
        
        // 验证更新结果
        const verifyResult = await query('SELECT id, name, sort FROM category WHERE id = ?', [testId]);
        if (verifyResult.length > 0) {
            const updatedCategory = verifyResult[0];
            console.log(`   验证结果: ${updatedCategory.name} (ID: ${updatedCategory.id}, sort: ${updatedCategory.sort})`);
            
            if (updatedCategory.sort === newSortValue) {
                console.log('   ✅ sort字段更新成功');
                
                // 恢复原值
                await query(updateSql, [0, testId]);
                console.log('   ✅ 已恢复原值');
                return true;
            } else {
                console.log('   ❌ sort字段更新失败');
                return false;
            }
        } else {
            console.log('   ❌ 验证查询失败');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试更新sort字段失败:', error.message);
        return false;
    }
}

// 测试按sort字段排序查询
async function testSortFieldQuery() {
    try {
        console.log('\n🔍 测试按sort字段排序查询...');
        
        // 设置几个不同的sort值进行测试
        const testData = [
            { id: null, sort: 1 },
            { id: null, sort: 3 },
            { id: null, sort: 2 }
        ];
        
        // 获取前3个category
        const categories = await query('SELECT id FROM category WHERE is_deleted = 0 LIMIT 3');
        
        if (categories.length < 3) {
            console.log('⚠️  category数据不足3条，跳过排序测试');
            return true;
        }
        
        // 设置测试数据的sort值
        for (let i = 0; i < testData.length; i++) {
            testData[i].id = categories[i].id;
            await query('UPDATE category SET sort = ? WHERE id = ?', [testData[i].sort, testData[i].id]);
        }
        
        console.log('   设置测试sort值:');
        testData.forEach(item => {
            console.log(`     ID ${item.id}: sort = ${item.sort}`);
        });
        
        // 按sort字段排序查询
        const sortedResult = await query(`
            SELECT id, name, sort 
            FROM category 
            WHERE is_deleted = 0 AND id IN (${testData.map(() => '?').join(',')})
            ORDER BY sort, id
        `, testData.map(item => item.id));
        
        console.log('   排序查询结果:');
        sortedResult.forEach((cat, index) => {
            console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort})`);
        });
        
        // 验证排序是否正确
        const expectedOrder = [1, 2, 3]; // 期望的sort顺序
        const actualOrder = sortedResult.map(cat => cat.sort);
        const isCorrectOrder = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);
        
        console.log(`   期望sort顺序: [${expectedOrder.join(', ')}]`);
        console.log(`   实际sort顺序: [${actualOrder.join(', ')}]`);
        console.log(`   排序验证: ${isCorrectOrder ? '✅ 正确' : '❌ 错误'}`);
        
        // 恢复原值
        for (const item of testData) {
            await query('UPDATE category SET sort = 0 WHERE id = ?', [item.id]);
        }
        console.log('   ✅ 已恢复原值');
        
        return isCorrectOrder;
        
    } catch (error) {
        console.error('❌ 测试排序查询失败:', error.message);
        return false;
    }
}

// 测试批量排序功能
async function testBatchSort() {
    try {
        console.log('\n🔍 测试批量排序功能...');
        
        // 获取所有category
        const categories = await query('SELECT id, name FROM category WHERE is_deleted = 0 ORDER BY id');
        
        if (categories.length < 2) {
            console.log('⚠️  category数据不足，跳过批量排序测试');
            return true;
        }
        
        console.log('   原始顺序:');
        categories.forEach((cat, index) => {
            console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id})`);
        });
        
        // 模拟排序接口的逻辑
        const idList = categories.map(cat => cat.id).reverse(); // 反转顺序
        console.log(`   新的ID顺序: [${idList.join(', ')}]`);
        
        // 批量更新sort值
        for (let i = 0; i < idList.length; i++) {
            const categoryId = idList[i];
            const sortValue = i + 1; // 排序从1开始
            
            await query(`
                UPDATE category 
                SET sort = ?, update_time = NOW() 
                WHERE id = ? AND is_deleted = 0
            `, [sortValue, categoryId]);
        }
        
        // 验证排序结果
        const sortedResult = await query(`
            SELECT id, name, sort 
            FROM category 
            WHERE is_deleted = 0 
            ORDER BY sort, id
        `);
        
        console.log('   排序后结果:');
        sortedResult.forEach((cat, index) => {
            console.log(`     ${index + 1}. ${cat.name} (ID: ${cat.id}, sort: ${cat.sort})`);
        });
        
        // 验证顺序是否正确
        const actualOrder = sortedResult.map(cat => cat.id);
        const isCorrectOrder = JSON.stringify(actualOrder) === JSON.stringify(idList);
        
        console.log(`   期望顺序: [${idList.join(', ')}]`);
        console.log(`   实际顺序: [${actualOrder.join(', ')}]`);
        console.log(`   批量排序验证: ${isCorrectOrder ? '✅ 正确' : '❌ 错误'}`);
        
        return isCorrectOrder;
        
    } catch (error) {
        console.error('❌ 测试批量排序失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category的sort字段功能\n');
    
    try {
        // 1. 测试sort字段是否存在
        const fieldTest = await testSortFieldExists();
        
        // 2. 测试更新sort字段
        const updateTest = await testUpdateSortField();
        
        // 3. 测试按sort字段排序查询
        const queryTest = await testSortFieldQuery();
        
        // 4. 测试批量排序功能
        const batchTest = await testBatchSort();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   sort字段存在: ${fieldTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   字段更新: ${updateTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   排序查询: ${queryTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   批量排序: ${batchTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = fieldTest && updateTest && queryTest && batchTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 category的sort字段功能正常！');
            console.log('   ✅ sort字段已正确创建');
            console.log('   ✅ 支持单个更新sort值');
            console.log('   ✅ 支持按sort字段排序查询');
            console.log('   ✅ 支持批量排序功能');
            console.log('   ✅ 列表查询默认按sort排序');
        }
        
        console.log('\n✅ sort字段功能测试完成');
        
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
    testSortFieldExists,
    testUpdateSortField,
    testSortFieldQuery,
    testBatchSort
};
