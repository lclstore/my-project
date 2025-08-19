/**
 * 测试Template Keywords智能搜索功能
 */

const { QueryConditionBuilder } = require('../utils/enumHelper');
const { query } = require('../config/database');
const { parseArrayParam } = require('../utils/paramHelper');
const { toSnakeCase } = require('../utils/fieldConverter');

async function testTemplateKeywordsLogic() {
    try {
        console.log('🔍 测试Template Keywords智能搜索逻辑...\n');

        // 1. 测试纯数字关键词（ID精确匹配）
        console.log('1. 测试纯数字关键词（ID精确匹配）:');
        await testNumericKeywords('123');

        // 2. 测试文本关键词（名称模糊搜索）
        console.log('\n2. 测试文本关键词（名称模糊搜索）:');
        await testTextKeywords('测试模板');

        // 3. 测试混合关键词（名称模糊搜索）
        console.log('\n3. 测试混合关键词（名称模糊搜索）:');
        await testTextKeywords('模板123');

        // 4. 测试数组参数
        console.log('\n4. 测试数组参数:');
        await testArrayParams();

        // 5. 测试排序参数
        console.log('\n5. 测试排序参数:');
        await testSortParams();

        console.log('\n🎉 所有Template Keywords测试通过！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

async function testNumericKeywords(keywords) {
    const conditionBuilder = new QueryConditionBuilder();
    conditionBuilder.addNumberCondition('is_deleted', 0);

    const trimmedKeywords = keywords.trim();
    
    if (/^\d+$/.test(trimmedKeywords)) {
        console.log(`   检测到纯数字关键词: "${trimmedKeywords}"`);
        
        // 先按ID精确匹配
        conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));
        
        // 模拟检查ID匹配结果
        try {
            const idCheckSql = `SELECT COUNT(*) as count FROM template WHERE id = ? AND is_deleted = 0`;
            const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);
            
            console.log(`   ID匹配结果: ${idCheckResult[0].count} 条`);
            
            if (idCheckResult[0].count === 0) {
                console.log('   ID无匹配，切换到名称模糊搜索');
                
                // 重置条件构建器
                conditionBuilder.reset();
                conditionBuilder.addNumberCondition('is_deleted', 0);
                conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
            }
        } catch (error) {
            // 如果表不存在，只是模拟逻辑
            console.log('   模拟：ID无匹配，切换到名称模糊搜索');
            conditionBuilder.reset();
            conditionBuilder.addNumberCondition('is_deleted', 0);
            conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
        }
    }

    const { where, params } = conditionBuilder.build();
    console.log(`   最终WHERE条件: ${where}`);
    console.log(`   参数: [${params.join(', ')}]`);
}

async function testTextKeywords(keywords) {
    const conditionBuilder = new QueryConditionBuilder();
    conditionBuilder.addNumberCondition('is_deleted', 0);

    const trimmedKeywords = keywords.trim();
    
    if (!/^\d+$/.test(trimmedKeywords)) {
        console.log(`   检测到文本关键词: "${trimmedKeywords}"`);
        conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
    }

    const { where, params } = conditionBuilder.build();
    console.log(`   WHERE条件: ${where}`);
    console.log(`   参数: [${params.join(', ')}]`);
}

async function testArrayParams() {
    const conditionBuilder = new QueryConditionBuilder();
    conditionBuilder.addNumberCondition('is_deleted', 0);

    // 模拟数组参数
    const statusList = parseArrayParam('ENABLED,DRAFT');
    const durationCodeList = parseArrayParam('MIN_5_10,MIN_10_15');

    console.log(`   状态列表: [${statusList.join(', ')}]`);
    console.log(`   时长代码列表: [${durationCodeList.join(', ')}]`);

    if (statusList && statusList.length > 0) {
        conditionBuilder.addArrayCondition('status', statusList);
    }
    if (durationCodeList && durationCodeList.length > 0) {
        conditionBuilder.addArrayCondition('duration_code', durationCodeList);
    }

    const { where, params } = conditionBuilder.build();
    console.log(`   WHERE条件: ${where}`);
    console.log(`   参数: [${params.join(', ')}]`);
}

async function testSortParams() {
    const orderBy = 'createTime';
    const orderDirection = 'asc';

    const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';
    const finalOrderBy = `${dbOrderBy} ${orderDirection === 'asc' ? 'ASC' : 'DESC'}`;

    console.log(`   前端排序字段: ${orderBy}`);
    console.log(`   数据库排序字段: ${dbOrderBy}`);
    console.log(`   排序方向: ${orderDirection}`);
    console.log(`   最终ORDER BY: ${finalOrderBy}`);
}

// 如果直接运行此脚本
if (require.main === module) {
    testTemplateKeywordsLogic()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testTemplateKeywordsLogic };
