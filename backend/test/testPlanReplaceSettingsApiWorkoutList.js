/**
 * 测试PlanReplaceSettings API WorkoutList功能
 */

const { query } = require('../config/database');

async function testPlanReplaceSettingsApiWorkoutList() {
    try {
        console.log('🔍 测试PlanReplaceSettings API WorkoutList功能...\n');

        // 模拟API保存逻辑
        console.log('1. 模拟API保存逻辑:');

        const req = {
            body: {
                name: '测试API WorkoutList',
                description: '测试API描述',
                status: 'DRAFT',
                ruleList: [
                    {
                        matchKey: 'GENDER',
                        matchCondition: 'EQUALS',
                        matchValue: 1,
                        workoutList: [301, 302, 303]
                    },
                    {
                        matchKey: 'USER',
                        matchCondition: 'NOT_EQUALS',
                        matchValue: 2,
                        workoutList: [401, 402]
                    }
                ]
            }
        };

        // 引入路由逻辑（简化版）
        const { transaction } = require('../config/database');
        const { sanitizeParams } = require('../utils/commonHelper');

        let testId = null;

        const result = await transaction(async (connection) => {
            const { name, description, status, ruleList = [] } = req.body;

            // 创建新planReplaceSettings
            const insertSql = `
                INSERT INTO plan_replace_settings (name, description, status, create_time, update_time)
                VALUES (?, ?, ?, NOW(), NOW())
            `;
            const insertParams = sanitizeParams([
                name,
                description,
                status
            ]);

            const [insertResult] = await connection.execute(insertSql, insertParams);
            const planReplaceSettingsId = insertResult.insertId;

            console.log(`   主记录创建成功，ID: ${planReplaceSettingsId}`);

            // 保存ruleList
            if (ruleList && ruleList.length > 0) {
                for (let i = 0; i < ruleList.length; i++) {
                    const rule = ruleList[i];
                    const ruleSql = `
                        INSERT INTO plan_replace_settings_rule (plan_replace_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                    `;
                    const ruleParams = sanitizeParams([
                        planReplaceSettingsId,
                        rule.matchKey,
                        rule.matchCondition,
                        rule.matchValue ? parseInt(rule.matchValue) : null,
                        i + 1 // sort_order从1开始
                    ]);

                    const [ruleResult] = await connection.execute(ruleSql, ruleParams);
                    const ruleId = ruleResult.insertId;

                    console.log(`   规则 ${i + 1} 创建成功，ID: ${ruleId}`);

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
                                j + 1 // sort_order从1开始
                            ]);

                            await connection.execute(workoutSql, workoutParams);
                            console.log(`     workout ${workoutId} 保存成功`);
                        }
                    }
                }
            }

            return { planReplaceSettingsId };
        });

        testId = result.planReplaceSettingsId;
        console.log(`✅ API保存逻辑测试完成，ID: ${testId}\n`);

        // 2. 模拟API详情查询逻辑
        console.log('2. 模拟API详情查询逻辑:');

        // 查询planReplaceSettings基本信息
        const planReplaceSettingsResult = await query('SELECT * FROM plan_replace_settings WHERE id = ? AND is_deleted = 0', [testId]);

        if (planReplaceSettingsResult.length === 0) {
            throw new Error('PlanReplaceSettings不存在');
        }

        const planReplaceSettingsData = planReplaceSettingsResult[0];
        console.log('   基本信息查询成功:', planReplaceSettingsData.name);

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

            console.log(`   规则 ${rule.sort_order}: ${rule.match_key}=${rule.match_value}, workoutList=[${workoutList.join(', ')}]`);

            // 手动转换字段名（模拟convertToFrontendFormat）
            ruleList.push({
                matchKey: rule.match_key,
                matchCondition: rule.match_condition,
                matchValue: rule.match_value,
                sortOrder: rule.sort_order,
                workoutList
            });
        }

        // 组合返回数据（手动转换字段名）
        const responseData = {
            id: planReplaceSettingsData.id,
            name: planReplaceSettingsData.name,
            description: planReplaceSettingsData.description,
            status: planReplaceSettingsData.status,
            createTime: planReplaceSettingsData.create_time,
            updateTime: planReplaceSettingsData.update_time,
            ruleList
        };

        console.log('\n   最终API响应数据:');
        console.log(JSON.stringify(responseData, null, 2));

        // 3. 验证workoutList是否正确
        console.log('\n3. 验证workoutList是否正确:');

        const expectedWorkoutLists = [
            [301, 302, 303],
            [401, 402]
        ];

        for (let i = 0; i < ruleList.length; i++) {
            const rule = ruleList[i];
            const expected = expectedWorkoutLists[i];
            const actual = rule.workoutList;

            const isCorrect = JSON.stringify(actual) === JSON.stringify(expected);
            console.log(`   规则 ${i + 1}: 期望 [${expected.join(', ')}], 实际 [${actual.join(', ')}] ${isCorrect ? '✅' : '❌'}`);

            if (!isCorrect) {
                throw new Error(`规则 ${i + 1} 的workoutList不正确`);
            }
        }

        // 4. 清理测试数据
        console.log('\n4. 清理测试数据:');
        await query('DELETE FROM plan_replace_settings WHERE id = ?', [testId]);
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 PlanReplaceSettings API WorkoutList功能测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlanReplaceSettingsApiWorkoutList()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlanReplaceSettingsApiWorkoutList };
