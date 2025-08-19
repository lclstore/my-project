/**
 * 测试PlanReplaceSettings WorkoutList保存和查询
 */

const { query, transaction } = require('../config/database');
const { sanitizeParams } = require('../utils/commonHelper');

async function testPlanReplaceSettingsWorkoutList() {
    try {
        console.log('🔍 测试PlanReplaceSettings WorkoutList保存和查询...\n');

        let testId = null;

        // 1. 测试保存包含workoutList的数据
        console.log('1. 测试保存包含workoutList的数据:');
        
        const testData = {
            name: '测试WorkoutList保存',
            description: '测试描述',
            status: 'DRAFT',
            ruleList: [
                {
                    matchKey: 'GENDER',
                    matchCondition: 'EQUALS',
                    matchValue: 1,
                    workoutList: [101, 102, 103]
                },
                {
                    matchKey: 'USER',
                    matchCondition: 'NOT_EQUALS',
                    matchValue: 2,
                    workoutList: [201, 202]
                }
            ]
        };

        const result = await transaction(async (connection) => {
            // 保存主记录
            const insertSql = `
                INSERT INTO plan_replace_settings (name, description, status, create_time, update_time)
                VALUES (?, ?, ?, NOW(), NOW())
            `;
            const insertParams = sanitizeParams([
                testData.name,
                testData.description,
                testData.status
            ]);
            
            const [insertResult] = await connection.execute(insertSql, insertParams);
            const planReplaceSettingsId = insertResult.insertId;

            console.log(`   主记录保存成功，ID: ${planReplaceSettingsId}`);

            // 保存ruleList
            for (let i = 0; i < testData.ruleList.length; i++) {
                const rule = testData.ruleList[i];
                const ruleSql = `
                    INSERT INTO plan_replace_settings_rule (plan_replace_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                `;
                const ruleParams = sanitizeParams([
                    planReplaceSettingsId,
                    rule.matchKey,
                    rule.matchCondition,
                    rule.matchValue ? parseInt(rule.matchValue) : null,
                    i + 1
                ]);
                
                const [ruleResult] = await connection.execute(ruleSql, ruleParams);
                const ruleId = ruleResult.insertId;

                console.log(`   规则 ${i + 1} 保存成功，ID: ${ruleId}, workoutList: [${rule.workoutList.join(', ')}]`);

                // 保存workoutList
                if (rule.workoutList && rule.workoutList.length > 0) {
                    for (let j = 0; j < rule.workoutList.length; j++) {
                        const workoutId = rule.workoutList[j];
                        const workoutSql = `
                            INSERT INTO plan_replace_settings_workout (plan_replace_settings_rule_id, workout_id, sort_order, create_time, update_time)
                            VALUES (?, ?, ?, NOW(), NOW())
                        `;
                        const workoutParams = sanitizeParams([
                            ruleId,
                            parseInt(workoutId),
                            j + 1
                        ]);
                        
                        await connection.execute(workoutSql, workoutParams);
                        console.log(`     workout ${workoutId} 保存成功，sort_order: ${j + 1}`);
                    }
                }
            }

            return { planReplaceSettingsId };
        });

        testId = result.planReplaceSettingsId;
        console.log(`✅ 数据保存完成，主ID: ${testId}\n`);

        // 2. 验证数据库中的数据
        console.log('2. 验证数据库中的数据:');
        
        // 查询主记录
        const mainRecord = await query('SELECT * FROM plan_replace_settings WHERE id = ?', [testId]);
        console.log('   主记录:', mainRecord[0]);

        // 查询规则记录
        const ruleRecords = await query('SELECT * FROM plan_replace_settings_rule WHERE plan_replace_settings_id = ? ORDER BY sort_order', [testId]);
        console.log(`   规则记录数量: ${ruleRecords.length}`);
        
        for (const rule of ruleRecords) {
            console.log(`   规则 ${rule.sort_order}: ID=${rule.id}, matchKey=${rule.match_key}, matchCondition=${rule.match_condition}, matchValue=${rule.match_value}`);
            
            // 查询每个规则的workout记录
            const workoutRecords = await query('SELECT * FROM plan_replace_settings_workout WHERE plan_replace_settings_rule_id = ? ORDER BY sort_order', [rule.id]);
            console.log(`     workout记录数量: ${workoutRecords.length}`);
            
            for (const workout of workoutRecords) {
                console.log(`     workout: ID=${workout.id}, workoutId=${workout.workout_id}, sortOrder=${workout.sort_order}`);
            }
        }

        // 3. 测试详情查询逻辑
        console.log('\n3. 测试详情查询逻辑:');
        
        // 查询关联的rule列表
        const ruleSql = `
            SELECT id, match_key, match_condition, match_value, sort_order
            FROM plan_replace_settings_rule
            WHERE plan_replace_settings_id = ?
            ORDER BY sort_order, id
        `;
        const ruleResult = await query(ruleSql, [testId]);
        console.log(`   查询到规则数量: ${ruleResult.length}`);

        // 查询每个rule的workout列表
        const ruleList = [];
        for (const rule of ruleResult) {
            const workoutSql = `
                SELECT workout_id, sort_order
                FROM plan_replace_settings_workout
                WHERE plan_replace_settings_rule_id = ?
                ORDER BY sort_order, id
            `;
            const workoutResult = await query(workoutSql, [rule.id]);
            
            const workoutList = workoutResult.map(workout => workout.workout_id);
            
            console.log(`   规则 ${rule.sort_order}: matchKey=${rule.match_key}, workoutList=[${workoutList.join(', ')}]`);
            
            ruleList.push({
                matchKey: rule.match_key,
                matchCondition: rule.match_condition,
                matchValue: rule.match_value,
                sortOrder: rule.sort_order,
                workoutList
            });
        }

        console.log('\n   最终组装的ruleList:');
        console.log(JSON.stringify(ruleList, null, 2));

        // 4. 清理测试数据
        console.log('\n4. 清理测试数据:');
        await query('DELETE FROM plan_replace_settings WHERE id = ?', [testId]);
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 WorkoutList保存和查询测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlanReplaceSettingsWorkoutList()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlanReplaceSettingsWorkoutList };
