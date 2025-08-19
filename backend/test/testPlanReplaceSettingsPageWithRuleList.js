/**
 * 测试PlanReplaceSettings分页查询包含ruleList和workoutListStr
 */

const { query, transaction } = require('../config/database');
const { sanitizeParams } = require('../utils/commonHelper');

async function testPlanReplaceSettingsPageWithRuleList() {
    try {
        console.log('🔍 测试PlanReplaceSettings分页查询包含ruleList和workoutListStr...\n');

        let testIds = [];
        let workoutIds = [];

        // 1. 创建测试workout数据
        console.log('1. 创建测试workout数据:');
        
        const workoutData = [
            { name: 'Test Workout 127', description: 'Description 127', status: 'ENABLED' },
            { name: 'Test Workout 125', description: 'Description 125', status: 'ENABLED' },
            { name: 'Test Workout 121', description: 'Description 121', status: 'ENABLED' },
            { name: 'Test Workout 130', description: 'Description 130', status: 'ENABLED' }
        ];

        for (const workout of workoutData) {
            const insertWorkoutSql = `
                INSERT INTO workout (name, description, status, create_time, update_time)
                VALUES (?, ?, ?, NOW(), NOW())
            `;
            const insertWorkoutParams = sanitizeParams([workout.name, workout.description, workout.status]);
            const workoutResult = await query(insertWorkoutSql, insertWorkoutParams);
            workoutIds.push(workoutResult.insertId);
            console.log(`   创建workout: ${workout.name}, ID: ${workoutResult.insertId}`);
        }

        // 2. 创建测试planReplaceSettings数据
        console.log('\n2. 创建测试planReplaceSettings数据:');
        
        const testData = [
            {
                name: '分页测试设置1',
                description: '第一个测试设置',
                status: 'ENABLED',
                ruleList: [
                    { matchKey: 'GENDER', matchCondition: 'EQUALS', matchValue: 1 },
                    { matchKey: 'USER', matchCondition: 'NOT_EQUALS', matchValue: 2 }
                ],
                workoutList: [workoutIds[0], workoutIds[1], workoutIds[2]]  // 127,125,121
            },
            {
                name: '分页测试设置2',
                description: '第二个测试设置',
                status: 'DRAFT',
                ruleList: [
                    { matchKey: 'GENDER', matchCondition: 'NOT_EQUALS', matchValue: 0 }
                ],
                workoutList: [workoutIds[3]]  // 130
            }
        ];

        for (const data of testData) {
            const result = await transaction(async (connection) => {
                // 创建主记录
                const insertSql = `
                    INSERT INTO plan_replace_settings (name, description, status, create_time, update_time)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;
                const insertParams = sanitizeParams([data.name, data.description, data.status]);
                const [insertResult] = await connection.execute(insertSql, insertParams);
                const planReplaceSettingsId = insertResult.insertId;

                // 保存ruleList
                for (let i = 0; i < data.ruleList.length; i++) {
                    const rule = data.ruleList[i];
                    const ruleSql = `
                        INSERT INTO plan_replace_settings_rule (plan_replace_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                    `;
                    const ruleParams = sanitizeParams([
                        planReplaceSettingsId,
                        rule.matchKey,
                        rule.matchCondition,
                        rule.matchValue,
                        i + 1
                    ]);
                    await connection.execute(ruleSql, ruleParams);
                }

                // 保存workoutList
                for (let i = 0; i < data.workoutList.length; i++) {
                    const workoutId = data.workoutList[i];
                    const workoutSql = `
                        INSERT INTO plan_replace_settings_workout (plan_replace_settings_id, workout_id, sort_order, create_time, update_time)
                        VALUES (?, ?, ?, NOW(), NOW())
                    `;
                    const workoutParams = sanitizeParams([planReplaceSettingsId, workoutId, i + 1]);
                    await connection.execute(workoutSql, workoutParams);
                }

                return { planReplaceSettingsId };
            });

            testIds.push(result.planReplaceSettingsId);
            console.log(`   创建设置: ${data.name}, ID: ${result.planReplaceSettingsId}`);
        }

        // 3. 测试分页查询逻辑
        console.log('\n3. 测试分页查询逻辑:');
        
        // 引入相关模块
        const { BusinessHelper } = require('../config/database');
        const { convertToFrontendFormat } = require('../utils/fieldConverter');
        const { QueryConditionBuilder } = require('../utils/enumHelper');

        // 构建查询条件
        const conditionBuilder = new QueryConditionBuilder();
        conditionBuilder.addNumberCondition('is_deleted', 0);
        const { where, params } = conditionBuilder.build();

        // 构建查询选项
        const options = {
            where,
            whereParams: params,
            orderBy: 'id desc',
            pageSize: 10,
            pageIndex: 1,
            excludeFields: ['is_deleted']
        };

        // 执行分页查询
        const result = await BusinessHelper.paginateWithValidation('plan_replace_settings', { query: {} }, options);

        if (result.success) {
            console.log(`   基础分页查询成功，数据条数: ${result.data.length}`);

            // 为每条记录查询ruleList和workoutListStr
            const enhancedData = await Promise.all(result.data.map(async (item) => {
                // 查询ruleList
                const ruleSql = `
                    SELECT id, match_key, match_condition, match_value, sort_order
                    FROM plan_replace_settings_rule
                    WHERE plan_replace_settings_id = ?
                    ORDER BY sort_order, id
                `;
                const ruleResult = await query(ruleSql, [item.id]);
                const ruleList = ruleResult.map(rule => convertToFrontendFormat(rule));

                // 查询workoutList ID并转换为字符串
                const workoutSql = `
                    SELECT workout_id
                    FROM plan_replace_settings_workout
                    WHERE plan_replace_settings_id = ?
                    ORDER BY sort_order, id
                `;
                const workoutResult = await query(workoutSql, [item.id]);
                const workoutIds = workoutResult.map(workout => workout.workout_id);
                const workoutListStr = workoutIds.join(',');

                return {
                    ...item,
                    ruleList,
                    workoutListStr
                };
            }));

            console.log('\n   增强后的分页数据:');
            enhancedData.forEach((item, index) => {
                console.log(`   记录 ${index + 1}:`);
                console.log(`     ID: ${item.id}`);
                console.log(`     名称: ${item.name}`);
                console.log(`     状态: ${item.status}`);
                console.log(`     规则数量: ${item.ruleList.length}`);
                console.log(`     workoutListStr: "${item.workoutListStr}"`);
                
                if (item.ruleList.length > 0) {
                    item.ruleList.forEach((rule, ruleIndex) => {
                        console.log(`       规则 ${ruleIndex + 1}: ${rule.matchKey}=${rule.matchValue} (${rule.matchCondition})`);
                    });
                }
            });

            // 4. 验证特定的workoutListStr格式
            console.log('\n4. 验证workoutListStr格式:');
            
            const testRecord1 = enhancedData.find(item => item.name === '分页测试设置1');
            const testRecord2 = enhancedData.find(item => item.name === '分页测试设置2');

            if (testRecord1) {
                console.log(`   设置1的workoutListStr: "${testRecord1.workoutListStr}"`);
                const expectedIds = [workoutIds[0], workoutIds[1], workoutIds[2]];
                const expectedStr = expectedIds.join(',');
                const isCorrect = testRecord1.workoutListStr === expectedStr;
                console.log(`   期望: "${expectedStr}", 实际: "${testRecord1.workoutListStr}" ${isCorrect ? '✅' : '❌'}`);
            }

            if (testRecord2) {
                console.log(`   设置2的workoutListStr: "${testRecord2.workoutListStr}"`);
                const expectedStr = workoutIds[3].toString();
                const isCorrect = testRecord2.workoutListStr === expectedStr;
                console.log(`   期望: "${expectedStr}", 实际: "${testRecord2.workoutListStr}" ${isCorrect ? '✅' : '❌'}`);
            }

        } else {
            console.log('   ❌ 分页查询失败:', result.message);
        }

        // 5. 清理测试数据
        console.log('\n5. 清理测试数据:');
        
        for (const testId of testIds) {
            await query('DELETE FROM plan_replace_settings WHERE id = ?', [testId]);
        }
        
        for (const workoutId of workoutIds) {
            await query('DELETE FROM workout WHERE id = ?', [workoutId]);
        }
        
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 分页查询ruleList和workoutListStr测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlanReplaceSettingsPageWithRuleList()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlanReplaceSettingsPageWithRuleList };
