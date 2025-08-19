/**
 * 测试真实的PlanReplaceSettings详情接口
 */

const { query, transaction } = require('../config/database');
const { sanitizeParams } = require('../utils/commonHelper');

async function testRealPlanReplaceSettingsDetail() {
    try {
        console.log('🔍 测试真实的PlanReplaceSettings详情接口...\n');

        let testId = null;

        // 1. 先创建测试数据
        console.log('1. 创建测试数据:');
        
        const result = await transaction(async (connection) => {
            // 创建主记录
            const insertSql = `
                INSERT INTO plan_replace_settings (name, description, status, create_time, update_time)
                VALUES (?, ?, ?, NOW(), NOW())
            `;
            const insertParams = sanitizeParams([
                '真实API测试',
                '测试描述',
                'ENABLED'
            ]);
            
            const [insertResult] = await connection.execute(insertSql, insertParams);
            const planReplaceSettingsId = insertResult.insertId;

            // 创建规则1
            const rule1Sql = `
                INSERT INTO plan_replace_settings_rule (plan_replace_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const rule1Params = sanitizeParams([planReplaceSettingsId, 'GENDER', 'EQUALS', 1, 1]);
            const [rule1Result] = await connection.execute(rule1Sql, rule1Params);
            const rule1Id = rule1Result.insertId;

            // 为规则1添加workout
            const workouts1 = [501, 502, 503];
            for (let i = 0; i < workouts1.length; i++) {
                const workoutSql = `
                    INSERT INTO plan_replace_settings_workout (plan_replace_settings_rule_id, workout_id, sort_order, create_time, update_time)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;
                const workoutParams = sanitizeParams([rule1Id, workouts1[i], i + 1]);
                await connection.execute(workoutSql, workoutParams);
            }

            // 创建规则2
            const rule2Sql = `
                INSERT INTO plan_replace_settings_rule (plan_replace_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const rule2Params = sanitizeParams([planReplaceSettingsId, 'USER', 'NOT_EQUALS', 2, 2]);
            const [rule2Result] = await connection.execute(rule2Sql, rule2Params);
            const rule2Id = rule2Result.insertId;

            // 为规则2添加workout
            const workouts2 = [601, 602];
            for (let i = 0; i < workouts2.length; i++) {
                const workoutSql = `
                    INSERT INTO plan_replace_settings_workout (plan_replace_settings_rule_id, workout_id, sort_order, create_time, update_time)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;
                const workoutParams = sanitizeParams([rule2Id, workouts2[i], i + 1]);
                await connection.execute(workoutSql, workoutParams);
            }

            return { planReplaceSettingsId };
        });

        testId = result.planReplaceSettingsId;
        console.log(`   测试数据创建成功，ID: ${testId}`);

        // 2. 验证数据库中的数据
        console.log('\n2. 验证数据库中的数据:');
        
        const allWorkouts = await query(`
            SELECT 
                prs.id as settings_id,
                prs.name as settings_name,
                prsr.id as rule_id,
                prsr.match_key,
                prsr.match_condition,
                prsr.match_value,
                prsr.sort_order as rule_sort,
                prsw.workout_id,
                prsw.sort_order as workout_sort
            FROM plan_replace_settings prs
            LEFT JOIN plan_replace_settings_rule prsr ON prs.id = prsr.plan_replace_settings_id
            LEFT JOIN plan_replace_settings_workout prsw ON prsr.id = prsw.plan_replace_settings_rule_id
            WHERE prs.id = ?
            ORDER BY prsr.sort_order, prsw.sort_order
        `, [testId]);

        console.log('   数据库中的完整数据:');
        allWorkouts.forEach(row => {
            console.log(`     设置${row.settings_id} -> 规则${row.rule_id}(${row.match_key}=${row.match_value}) -> workout${row.workout_id}`);
        });

        // 3. 模拟真实的详情接口逻辑
        console.log('\n3. 模拟真实的详情接口逻辑:');
        
        // 引入真实的路由逻辑
        const { BusinessHelper } = require('../config/database');
        const { convertToFrontendFormat } = require('../utils/fieldConverter');

        // 查询planReplaceSettings基本信息
        const planReplaceSettingsResult = await BusinessHelper.findByIdWithValidation('plan_replace_settings', testId, { is_deleted: 0 });

        if (!planReplaceSettingsResult.success) {
            throw new Error('PlanReplaceSettings不存在');
        }

        const planReplaceSettingsData = planReplaceSettingsResult.data;
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
            console.log(`   处理规则 ${rule.id}: ${rule.match_key}=${rule.match_value}`);
            
            const workoutSql = `
                SELECT workout_id, sort_order
                FROM plan_replace_settings_workout
                WHERE plan_replace_settings_rule_id = ?
                ORDER BY sort_order, id
            `;
            const workoutResult = await query(workoutSql, [rule.id]);
            console.log(`     查询到workout数量: ${workoutResult.length}`);
            
            const workoutList = workoutResult.map(workout => {
                console.log(`       workout: ${workout.workout_id} (sort: ${workout.sort_order})`);
                return workout.workout_id;
            });
            
            const ruleData = {
                ...convertToFrontendFormat(rule),
                workoutList
            };
            
            console.log(`     规则数据:`, JSON.stringify(ruleData, null, 2));
            ruleList.push(ruleData);
        }

        // 组合返回数据
        const responseData = {
            ...planReplaceSettingsData,
            ruleList
        };

        console.log('\n   最终响应数据:');
        console.log(JSON.stringify(responseData, null, 2));

        // 4. 检查workoutList是否存在
        console.log('\n4. 检查workoutList是否存在:');
        
        if (responseData.ruleList && responseData.ruleList.length > 0) {
            responseData.ruleList.forEach((rule, index) => {
                console.log(`   规则 ${index + 1}:`);
                console.log(`     matchKey: ${rule.matchKey}`);
                console.log(`     matchCondition: ${rule.matchCondition}`);
                console.log(`     matchValue: ${rule.matchValue}`);
                console.log(`     workoutList: ${rule.workoutList ? `[${rule.workoutList.join(', ')}]` : '未定义或为空'}`);
                
                if (!rule.workoutList || rule.workoutList.length === 0) {
                    console.log(`     ❌ 规则 ${index + 1} 的workoutList为空！`);
                } else {
                    console.log(`     ✅ 规则 ${index + 1} 的workoutList正常`);
                }
            });
        } else {
            console.log('   ❌ ruleList为空！');
        }

        // 5. 清理测试数据
        console.log('\n5. 清理测试数据:');
        await query('DELETE FROM plan_replace_settings WHERE id = ?', [testId]);
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 真实详情接口测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testRealPlanReplaceSettingsDetail()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testRealPlanReplaceSettingsDetail };
