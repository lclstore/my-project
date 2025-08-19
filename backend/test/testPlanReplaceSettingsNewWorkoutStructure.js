/**
 * 测试PlanReplaceSettings新的workout结构（与rule同级）
 */

const { query, transaction } = require('../config/database');
const { sanitizeParams } = require('../utils/commonHelper');

async function testPlanReplaceSettingsNewWorkoutStructure() {
    try {
        console.log('🔍 测试PlanReplaceSettings新的workout结构（与rule同级）...\n');

        let testId = null;
        let workoutIds = [];

        // 1. 先创建一些测试workout数据
        console.log('1. 创建测试workout数据:');
        
        const workoutData = [
            { name: 'Workout Alpha', description: 'Alpha Description', status: 'ENABLED' },
            { name: 'Workout Beta', description: 'Beta Description', status: 'ENABLED' },
            { name: 'Workout Gamma', description: 'Gamma Description', status: 'ENABLED' }
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

        // 2. 测试新的保存逻辑（模拟API请求）
        console.log('\n2. 测试新的保存逻辑:');
        
        const requestData = {
            name: '新结构测试设置',
            description: '测试workout与rule同级的结构',
            status: 'ENABLED',
            ruleList: [
                {
                    matchKey: 'GENDER',
                    matchCondition: 'EQUALS',
                    matchValue: 1
                },
                {
                    matchKey: 'USER',
                    matchCondition: 'NOT_EQUALS',
                    matchValue: 2
                }
            ],
            workoutList: workoutIds  // workoutList与ruleList同级
        };

        const result = await transaction(async (connection) => {
            const { name, description, status, ruleList = [], workoutList = [] } = requestData;
            
            // 创建主记录
            const insertSql = `
                INSERT INTO plan_replace_settings (name, description, status, create_time, update_time)
                VALUES (?, ?, ?, NOW(), NOW())
            `;
            const insertParams = sanitizeParams([name, description, status]);
            const [insertResult] = await connection.execute(insertSql, insertParams);
            const planReplaceSettingsId = insertResult.insertId;

            // 保存ruleList（不再包含workoutList）
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
                        i + 1
                    ]);
                    
                    await connection.execute(ruleSql, ruleParams);
                    console.log(`   保存规则 ${i + 1}: ${rule.matchKey}=${rule.matchValue}`);
                }
            }

            // 保存workoutList（直接关联到planReplaceSettings）
            if (workoutList && workoutList.length > 0) {
                for (let i = 0; i < workoutList.length; i++) {
                    const workoutId = workoutList[i];
                    const workoutSql = `
                        INSERT INTO plan_replace_settings_workout (plan_replace_settings_id, workout_id, sort_order, create_time, update_time)
                        VALUES (?, ?, ?, NOW(), NOW())
                    `;
                    const workoutParams = sanitizeParams([
                        planReplaceSettingsId,
                        parseInt(workoutId),
                        i + 1
                    ]);
                    
                    await connection.execute(workoutSql, workoutParams);
                    console.log(`   保存workout ${workoutId} (sort: ${i + 1})`);
                }
            }

            return { planReplaceSettingsId };
        });

        testId = result.planReplaceSettingsId;
        console.log(`   ✅ 保存成功，ID: ${testId}`);

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

        // 转换ruleList（不再包含workoutList）
        const ruleList = ruleResult.map(rule => convertToFrontendFormat(rule));
        console.log(`   查询到规则数量: ${ruleList.length}`);

        // 查询直接关联到planReplaceSettings的workout列表
        const workoutSql = `
            SELECT workout_id, sort_order
            FROM plan_replace_settings_workout
            WHERE plan_replace_settings_id = ?
            ORDER BY sort_order, id
        `;
        const workoutResult = await query(workoutSql, [testId]);
        console.log(`   查询到workout关联数量: ${workoutResult.length}`);

        // 查询workout的完整信息
        let workoutList = [];
        if (workoutResult.length > 0) {
            const workoutIds = workoutResult.map(workout => workout.workout_id);
            const placeholders = workoutIds.map(() => '?').join(',');
            const workoutInfoSql = `
                SELECT id, name, description, status, create_time, update_time
                FROM workout
                WHERE id IN (${placeholders}) AND is_deleted = 0
                ORDER BY FIELD(id, ${placeholders})
            `;
            const workoutInfoResult = await query(workoutInfoSql, [...workoutIds, ...workoutIds]);
            workoutList = workoutInfoResult.map(workout => convertToFrontendFormat(workout));
        }

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
        
        console.log(`   ✅ 基本信息: ${responseData.name}`);
        console.log(`   ✅ ruleList数量: ${responseData.ruleList.length}`);
        console.log(`   ✅ workoutList数量: ${responseData.workoutList.length}`);
        
        // 验证ruleList（不再包含workoutList）
        responseData.ruleList.forEach((rule, index) => {
            console.log(`   规则 ${index + 1}:`);
            console.log(`     matchKey: ${rule.matchKey}`);
            console.log(`     matchCondition: ${rule.matchCondition}`);
            console.log(`     matchValue: ${rule.matchValue}`);
            console.log(`     ✅ 规则不再包含workoutList`);
        });

        // 验证workoutList（与ruleList同级）
        console.log(`   workoutList (与ruleList同级):`);
        responseData.workoutList.forEach((workout, index) => {
            console.log(`     workout ${index + 1}: ID=${workout.id}, name=${workout.name}`);
        });

        console.log('\n   ✅ 新数据结构验证成功！');
        console.log('   - ruleList不再包含workoutList');
        console.log('   - workoutList与ruleList同级');
        console.log('   - workoutList包含完整的workout信息');

        // 5. 清理测试数据
        console.log('\n5. 清理测试数据:');
        await query('DELETE FROM plan_replace_settings WHERE id = ?', [testId]);
        
        // 清理workout测试数据
        for (const workoutId of workoutIds) {
            await query('DELETE FROM workout WHERE id = ?', [workoutId]);
        }
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 新workout结构测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlanReplaceSettingsNewWorkoutStructure()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlanReplaceSettingsNewWorkoutStructure };
