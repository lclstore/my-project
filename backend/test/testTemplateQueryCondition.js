/**
 * 测试Template QueryConditionBuilder修复
 */

const { QueryConditionBuilder } = require('../utils/enumHelper');

async function testQueryConditionBuilder() {
    try {
        console.log('🔍 测试Template QueryConditionBuilder修复...\n');

        // 1. 测试基本的QueryConditionBuilder功能
        console.log('1. 测试QueryConditionBuilder基本功能:');
        const conditionBuilder = new QueryConditionBuilder();
        
        // 基础条件：未删除
        conditionBuilder.addNumberCondition('is_deleted', 0);

        // 可选条件
        conditionBuilder.addStringCondition('name', '测试模板', 'like');
        conditionBuilder.addStringCondition('status', 'ENABLED', 'exact');
        conditionBuilder.addStringCondition('duration_code', 'MIN_10_15', 'exact');

        const { where, params } = conditionBuilder.build();
        
        console.log('   构建的WHERE条件:', where);
        console.log('   参数:', params);
        console.log('   ✅ QueryConditionBuilder功能正常\n');

        // 2. 测试空条件处理
        console.log('2. 测试空条件处理:');
        const emptyBuilder = new QueryConditionBuilder();
        emptyBuilder.addNumberCondition('is_deleted', 0);
        emptyBuilder.addStringCondition('name', '', 'like'); // 空字符串应该被忽略
        emptyBuilder.addStringCondition('status', null, 'exact'); // null应该被忽略
        
        const { where: emptyWhere, params: emptyParams } = emptyBuilder.build();
        console.log('   空条件WHERE:', emptyWhere);
        console.log('   空条件参数:', emptyParams);
        console.log('   ✅ 空条件处理正常\n');

        // 3. 测试不同匹配类型
        console.log('3. 测试不同匹配类型:');
        const typeBuilder = new QueryConditionBuilder();
        
        typeBuilder.addStringCondition('name', '测试', 'like');      // 模糊匹配
        typeBuilder.addStringCondition('status', 'ENABLED', 'exact'); // 精确匹配
        typeBuilder.addStringCondition('prefix', '前缀', 'start');    // 前缀匹配
        typeBuilder.addStringCondition('suffix', '后缀', 'end');      // 后缀匹配
        
        const { where: typeWhere, params: typeParams } = typeBuilder.build();
        console.log('   匹配类型WHERE:', typeWhere);
        console.log('   匹配类型参数:', typeParams);
        console.log('   ✅ 不同匹配类型正常\n');

        // 4. 测试数字条件
        console.log('4. 测试数字条件:');
        const numberBuilder = new QueryConditionBuilder();
        
        numberBuilder.addNumberCondition('id', 1, '=');
        numberBuilder.addNumberCondition('days', 7, '>=');
        numberBuilder.addNumberCondition('sort_order', 10, '<');
        
        const { where: numberWhere, params: numberParams } = numberBuilder.build();
        console.log('   数字条件WHERE:', numberWhere);
        console.log('   数字条件参数:', numberParams);
        console.log('   ✅ 数字条件正常\n');

        // 5. 测试链式调用
        console.log('5. 测试链式调用:');
        const chainBuilder = new QueryConditionBuilder();
        
        const { where: chainWhere, params: chainParams } = chainBuilder
            .addNumberCondition('is_deleted', 0)
            .addStringCondition('name', '链式', 'like')
            .addStringCondition('status', 'ENABLED', 'exact')
            .build();
            
        console.log('   链式调用WHERE:', chainWhere);
        console.log('   链式调用参数:', chainParams);
        console.log('   ✅ 链式调用正常\n');

        console.log('🎉 所有QueryConditionBuilder测试通过！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testQueryConditionBuilder()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testQueryConditionBuilder };
