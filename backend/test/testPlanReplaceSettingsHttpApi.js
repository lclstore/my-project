/**
 * 测试PlanReplaceSettings HTTP API
 */

const { query, transaction } = require('../config/database');
const { sanitizeParams } = require('../utils/commonHelper');

async function testPlanReplaceSettingsHttpApi() {
    try {
        console.log('🔍 测试PlanReplaceSettings HTTP API...\n');

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
                'HTTP API测试',
                'HTTP API测试描述',
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
            const workouts1 = [701, 702, 703];
            for (let i = 0; i < workouts1.length; i++) {
                const workoutSql = `
                    INSERT INTO plan_replace_settings_workout (plan_replace_settings_rule_id, workout_id, sort_order, create_time, update_time)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;
                const workoutParams = sanitizeParams([rule1Id, workouts1[i], i + 1]);
                await connection.execute(workoutSql, workoutParams);
            }

            return { planReplaceSettingsId };
        });

        testId = result.planReplaceSettingsId;
        console.log(`   测试数据创建成功，ID: ${testId}`);

        // 2. 验证数据是否正确保存
        console.log('\n2. 验证数据是否正确保存:');

        const verifyData = await query(`
            SELECT 
                prs.name,
                prsr.match_key,
                prsr.match_condition,
                prsr.match_value,
                prsw.workout_id
            FROM plan_replace_settings prs
            LEFT JOIN plan_replace_settings_rule prsr ON prs.id = prsr.plan_replace_settings_id
            LEFT JOIN plan_replace_settings_workout prsw ON prsr.id = prsw.plan_replace_settings_rule_id
            WHERE prs.id = ?
            ORDER BY prsr.sort_order, prsw.sort_order
        `, [testId]);

        console.log('   保存的数据:');
        verifyData.forEach(row => {
            console.log(`     ${row.name} -> ${row.match_key}=${row.match_value} -> workout${row.workout_id}`);
        });

        // 3. 模拟HTTP请求（使用express路由逻辑）
        console.log('\n3. 模拟HTTP请求:');

        // 模拟req和res对象
        const req = {
            params: { id: testId.toString() }
        };

        let responseData = null;
        let responseMessage = null;
        let responseSuccess = false;

        const res = {
            json: (data) => {
                responseData = data;
                responseSuccess = data.success;
                responseMessage = data.message;
                console.log('   API响应:', JSON.stringify(data, null, 2));
            },
            status: (code) => {
                return {
                    json: (data) => {
                        responseData = data;
                        responseSuccess = data.success || false;
                        console.log(`   API响应 (状态码${code}):`, JSON.stringify(data, null, 2));
                    }
                };
            }
        };

        // 引入路由逻辑
        const { BusinessHelper } = require('../config/database');
        const { convertToFrontendFormat } = require('../utils/fieldConverter');
        const { sendSuccess, sendError } = require('../utils/response');

        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return sendError(res, 'INVALID_PARAMS', '无效的planReplaceSettings ID', 400);
            }

            const planReplaceSettingsId = parseInt(id);

            // 查询planReplaceSettings基本信息
            const planReplaceSettingsResult = await BusinessHelper.findByIdWithValidation('plan_replace_settings', planReplaceSettingsId, { is_deleted: 0 });

            if (!planReplaceSettingsResult.success) {
                return sendError(res, planReplaceSettingsResult.error, planReplaceSettingsResult.message, planReplaceSettingsResult.statusCode || 404);
            }

            const planReplaceSettingsData = planReplaceSettingsResult.data;

            // 查询关联的rule列表
            const ruleSql = `
                SELECT id, match_key, match_condition, match_value, sort_order
                FROM plan_replace_settings_rule
                WHERE plan_replace_settings_id = ?
                ORDER BY sort_order, id
            `;
            const ruleResult = await query(ruleSql, [planReplaceSettingsId]);

            console.log(`   查询到规则数量: ${ruleResult.length}`);

            // 查询每个rule的workout列表
            const ruleList = [];
            for (const rule of ruleResult) {
                console.log(`   处理规则: ${rule.match_key}=${rule.match_value}`);

                const workoutSql = `
                    SELECT workout_id, sort_order
                    FROM plan_replace_settings_workout
                    WHERE plan_replace_settings_rule_id = ?
                    ORDER BY sort_order, id
                `;
                const workoutResult = await query(workoutSql, [rule.id]);

                console.log(`     查询到workout数量: ${workoutResult.length}`);

                const workoutList = workoutResult.map(workout => {
                    console.log(`       workout: ${workout.workout_id}`);
                    return workout.workout_id;
                });

                const ruleData = {
                    ...convertToFrontendFormat(rule),
                    workoutList
                };

                console.log(`     添加到ruleList:`, JSON.stringify(ruleData, null, 2));
                ruleList.push(ruleData);
            }

            // 组合返回数据
            const finalResponseData = {
                ...planReplaceSettingsData,
                ruleList
            };

            console.log(`   最终ruleList长度: ${ruleList.length}`);
            console.log(`   最终响应数据结构:`, Object.keys(finalResponseData));

            sendSuccess(res, finalResponseData, '获取planReplaceSettings详情成功');

        } catch (error) {
            console.error('获取planReplaceSettings详情错误:', error);
            sendError(res, 'QUERY_FAILED', '获取planReplaceSettings详情失败', 500);
        }

        // 4. 检查响应结果
        console.log('\n4. 检查响应结果:');

        if (responseSuccess && responseData && responseData.data) {
            const data = responseData.data;
            console.log(`   响应成功: ${responseMessage}`);
            console.log(`   数据字段: ${Object.keys(data).join(', ')}`);

            if (data.ruleList && data.ruleList.length > 0) {
                console.log(`   ruleList数量: ${data.ruleList.length}`);

                data.ruleList.forEach((rule, index) => {
                    console.log(`   规则 ${index + 1}:`);
                    console.log(`     字段: ${Object.keys(rule).join(', ')}`);
                    console.log(`     matchKey: ${rule.matchKey}`);
                    console.log(`     workoutList: ${rule.workoutList ? `[${rule.workoutList.join(', ')}]` : '未定义'}`);

                    if (rule.workoutList && rule.workoutList.length > 0) {
                        console.log(`     ✅ workoutList正常返回`);
                    } else {
                        console.log(`     ❌ workoutList为空或未定义！`);
                    }
                });
            } else {
                console.log('   ❌ ruleList为空！');
            }
        } else {
            console.log('   ❌ API请求失败！');
        }

        // 5. 清理测试数据
        console.log('\n5. 清理测试数据:');
        await query('DELETE FROM plan_replace_settings WHERE id = ?', [testId]);
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 HTTP API测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testPlanReplaceSettingsHttpApi()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testPlanReplaceSettingsHttpApi };
