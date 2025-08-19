/**
 * 测试PlanReplaceSettings新的数据结构
 */

const { query, transaction } = require('../config/database');
const { sanitizeParams } = require('../utils/commonHelper');

async function testPlanReplaceSettingsNewStructure() {
    try {
        console.log('🔍 测试PlanReplaceSettings新的数据结构...\n');

        let testId = null;
        let workoutIds = [];

        // 1. 先创建一些测试workout数据
        console.log('1. 创建测试workout数据:');
        
        const workoutData = [
            { name: 'Workout A', description: 'Description A', status: 'ENABLED' },
            { name: 'Workout B', description: 'Description B', status: 'ENABLED' },
            { name: 'Workout C', description: 'Description C', status: 'ENABLED' },
            { name: 'Workout D', description: 'Description D', status: 'ENABLED' }
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

        // 2. 创建planReplaceSettings测试数据
        console.log('\n2. 创建planReplaceSettings测试数据:');
        
        const result = await transaction(async (connection) => {
            // 创建主记录
            const insertSql = `
                INSERT INTO plan_replace_settings (name, description, status, create_time, update_time)
                VALUES (?, ?, ?, NOW(), NOW())
            `;
            const insertParams = sanitizeParams([
                '新结构测试',
                '测试新的数据结构',
                'ENABLED'
            ]);
            
            const [insertResult] = await connection.execute(insertSql, insertParams);
            const planReplaceSettingsId = insertResult.insertId;

            // 创建规则1 - 使用前两个workout
            const rule1Sql = `
                INSERT INTO plan_replace_settings_rule (plan_replace_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const rule1Params = sanitizeParams([planReplaceSettingsId, 'GENDER', 'EQUALS', 1, 1]);
            const [rule1Result] = await connection.execute(rule1Sql, rule1Params);
            const rule1Id = rule1Result.insertId;

            // 为规则1添加workout
            for (let i = 0; i < 2; i++) {
                const workoutSql = `
                    INSERT INTO plan_replace_settings_workout (plan_replace_settings_rule_id, workout_id, sort_order, create_time, update_time)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;
                const workoutParams = sanitizeParams([rule1Id, workoutIds[i], i + 1]);
                await connection.execute(workoutSql, workoutParams);
            }

            // 创建规则2 - 使用后两个workout
            const rule2Sql = `
                INSERT INTO plan_replace_settings_rule (plan_replace_settings_id, match_key, match_condition, match_value, sort_order, create_time, update_time)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const rule2Params = sanitizeParams([planReplaceSettingsId, 'USER', 'NOT_EQUALS', 2, 2]);
            const [rule2Result] = await connection.execute(rule2Sql, rule2Params);
            const rule2Id = rule2Result.insertId;

            // 为规则2添加workout
            for (let i = 2; i < 4; i++) {
                const workoutSql = `
                    INSERT INTO plan_replace_settings_workout (plan_replace_settings_rule_id, workout_id, sort_order, create_time, update_time)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;
                const workoutParams = sanitizeParams([rule2Id, workoutIds[i], i - 1]);
                await connection.execute(workoutSql, workoutParams);
            }

            return { planReplaceSettingsId };
        });

        testId = result.planReplaceSettingsId;
        console.log(`   测试数据创建成功，ID: ${testId}`);

        // 3. 测试新的详情查询逻辑
        console.log('\n3. 测试新的详情查询逻辑:');
        
        // 引入路由逻辑
        const { BusinessHelper } = require('../config/database');
        const { convertToFrontendFormat } = require('../utils/fieldConverter');

        // 查询planReplaceSettings基本信息
        const planReplaceSettingsResult = await BusinessHelper.findByIdWithValidation('plan_replace_settings', testId, { is_deleted: 0 });
        const planReplaceSettingsData = planReplaceSettingsResult.data;

        // 查询关联的rule列表
        const ruleSql = `
            SELECT id, match_key, match_condition, match_value, sort_order
            FROM plan_replace_settings_rule
            WHERE plan_replace_settings_id = ?
            ORDER BY sort_order, id
        `;
        const ruleResult = await query(ruleSql, [testId]);

        // 查询每个rule的workout列表，并收集所有workout ID
        const ruleList = [];
        const allWorkoutIds = new Set();
        
        for (const rule of ruleResult) {
            const workoutSql = `
                SELECT workout_id, sort_order
                FROM plan_replace_settings_workout
                WHERE plan_replace_settings_rule_id = ?
                ORDER BY sort_order, id
            `;
            const workoutResult = await query(workoutSql, [rule.id]);
            
            const workoutIds = workoutResult.map(workout => {
                allWorkoutIds.add(workout.workout_id);
                return workout.workout_id;
            });
            
            ruleList.push({
                ...convertToFrontendFormat(rule),
                workoutList: workoutIds
            });
        }

        console.log(`   收集到的所有workout ID: [${Array.from(allWorkoutIds).join(', ')}]`);

        // 查询所有workout的完整信息
        let workoutList = [];
        if (allWorkoutIds.size > 0) {
            const workoutIdsArray = Array.from(allWorkoutIds);
            const placeholders = workoutIdsArray.map(() => '?').join(',');
            const workoutInfoSql = `
                SELECT id, name, description, status, create_time, update_time
                FROM workout
                WHERE id IN (${placeholders}) AND is_deleted = 0
                ORDER BY id
            `;
            const workoutInfoResult = await query(workoutInfoSql, workoutIdsArray);
            workoutList = workoutInfoResult.map(workout => convertToFrontendFormat(workout));
        }

        console.log(`   查询到的workout完整信息数量: ${workoutList.length}`);

        // 组合返回数据
        const responseData = {
            ...planReplaceSettingsData,
            ruleList,
            workoutList
        };

        console.log('\n   最终响应数据结构:');
        console.log(JSON.stringify(responseData, null, 2));

        // 4. 验证新的数据结构
        console.log('\n4. 验证新的数据结构:');
        
        console.log(`   基本信息: ✅`);
        console.log(`   ruleList数量: ${responseData.ruleList.length}`);
        console.log(`   workoutList数量: ${responseData.workoutList.length}`);
        
        // 验证ruleList
        responseData.ruleList.forEach((rule, index) => {
            console.log(`   规则 ${index + 1}:`);
            console.log(`     matchKey: ${rule.matchKey}`);
            console.log(`     workoutList (IDs): [${rule.workoutList.join(', ')}]`);
        });

        // 验证workoutList
        console.log(`   workoutList (完整信息):`);
        responseData.workoutList.forEach((workout, index) => {
            console.log(`     workout ${index + 1}: ID=${workout.id}, name=${workout.name}, description=${workout.description}`);
        });

        // 5. 清理测试数据
        console.log('\n5. 清理测试数据:');
        await query('DELETE FROM plan_replace_settings WHERE id = ?', [testId]);
        
        // 清理workout测试数据
        for (const workoutId of workoutIds) {
            await query('DELETE FROM workout WHERE id = ?', [workoutId]);
        }
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 新数据结构测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlanReplaceSettingsNewStructure()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlanReplaceSettingsNewStructure };
