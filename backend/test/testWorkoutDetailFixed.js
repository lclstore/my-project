/**
 * 测试修复后的workout详情查询中的exerciseList
 */

const { query } = require('../config/database');

// 测试SQL查询
async function testSqlQuery() {
    try {
        console.log('🔍 测试修复后的SQL查询...');
        
        // 先查询是否有workout数据
        const workoutCheck = await query('SELECT id FROM workout WHERE is_deleted = 0 LIMIT 1');
        
        if (workoutCheck.length === 0) {
            console.log('⚠️  没有找到workout数据，跳过SQL测试');
            return false;
        }
        
        const workoutId = workoutCheck[0].id;
        console.log(`   使用workout ID: ${workoutId}`);
        
        // 测试新的SQL查询
        const structureSql = `
            SELECT ws.id, ws.structure_name, ws.structure_round, ws.sort_order,
                   wse.exercise_id, wse.sort_order as exercise_sort_order,
                   e.name as exercise_name, e.cover_img_url as exercise_cover_img_url,
                   e.met as exercise_met, e.structure_type_code as exercise_structure_type_code,
                   e.gender_code as exercise_gender_code, e.difficulty_code as exercise_difficulty_code,
                   e.equipment_code as exercise_equipment_code, e.position_code as exercise_position_code,
                   e.status as exercise_status
            FROM workout_structure ws
            LEFT JOIN workout_structure_exercise wse ON ws.id = wse.workout_structure_id
            LEFT JOIN exercise e ON wse.exercise_id = e.id
            WHERE ws.workout_id = ?
            ORDER BY ws.sort_order, wse.sort_order
            LIMIT 5
        `;
        
        const result = await query(structureSql, [workoutId]);
        console.log('✅ SQL查询执行成功');
        console.log(`   查询结果数量: ${result.length}`);
        
        if (result.length > 0) {
            const firstRow = result[0];
            console.log('   示例数据:');
            console.log(`     结构名称: ${firstRow.structure_name || 'N/A'}`);
            console.log(`     动作ID: ${firstRow.exercise_id || 'N/A'}`);
            console.log(`     动作名称: ${firstRow.exercise_name || 'N/A'}`);
            console.log(`     动作状态: ${firstRow.exercise_status || 'N/A'}`);
            
            // 检查是否包含动作信息
            const hasExerciseInfo = firstRow.exercise_name !== null && firstRow.exercise_name !== undefined;
            console.log(`   包含动作信息: ${hasExerciseInfo ? '✅ 是' : '❌ 否'}`);
            
            return hasExerciseInfo;
        } else {
            console.log('   ⚠️  该workout没有动作数据');
            return true; // SQL执行成功，只是没有数据
        }
        
    } catch (error) {
        console.error('❌ SQL查询测试失败:', error.message);
        return false;
    }
}

// 测试数据组织逻辑
async function testDataOrganization() {
    try {
        console.log('\n🔍 测试数据组织逻辑...');
        
        // 模拟查询结果
        const mockResult = [
            {
                id: 1,
                structure_name: '热身',
                structure_round: 1,
                sort_order: 1,
                exercise_id: 1,
                exercise_sort_order: 1,
                exercise_name: '深蹲',
                exercise_cover_img_url: 'https://example.com/cover1.jpg',
                exercise_met: 5,
                exercise_structure_type_code: 'WARM_UP',
                exercise_gender_code: 'MALE',
                exercise_difficulty_code: 'BEGINNER',
                exercise_equipment_code: 'NO_EQUIPMENT',
                exercise_position_code: 'STANDING',
                exercise_status: 'ENABLED'
            },
            {
                id: 1,
                structure_name: '热身',
                structure_round: 1,
                sort_order: 1,
                exercise_id: 2,
                exercise_sort_order: 2,
                exercise_name: '拉伸',
                exercise_cover_img_url: 'https://example.com/cover2.jpg',
                exercise_met: 3,
                exercise_structure_type_code: 'WARM_UP',
                exercise_gender_code: 'FEMALE',
                exercise_difficulty_code: 'BEGINNER',
                exercise_equipment_code: 'NO_EQUIPMENT',
                exercise_position_code: 'STANDING',
                exercise_status: 'ENABLED'
            }
        ];
        
        // 组织数据（模拟实际逻辑）
        const exerciseGroupList = [];
        const structureMap = new Map();

        mockResult.forEach(row => {
            if (!structureMap.has(row.id)) {
                structureMap.set(row.id, {
                    structureName: row.structure_name,
                    structureRound: row.structure_round,
                    exerciseList: []
                });
                exerciseGroupList.push(structureMap.get(row.id));
            }

            if (row.exercise_id) {
                // 构建完整的动作信息对象（基于实际的exercise表结构）
                const exerciseInfo = {
                    id: row.exercise_id,
                    name: row.exercise_name,
                    coverImgUrl: row.exercise_cover_img_url,
                    met: row.exercise_met,
                    structureTypeCode: row.exercise_structure_type_code,
                    genderCode: row.exercise_gender_code,
                    difficultyCode: row.exercise_difficulty_code,
                    equipmentCode: row.exercise_equipment_code,
                    positionCode: row.exercise_position_code,
                    status: row.exercise_status
                };
                
                structureMap.get(row.id).exerciseList.push(exerciseInfo);
            }
        });
        
        console.log('✅ 数据组织逻辑测试成功');
        console.log(`   动作组数量: ${exerciseGroupList.length}`);
        
        if (exerciseGroupList.length > 0) {
            const firstGroup = exerciseGroupList[0];
            console.log(`   第一组名称: ${firstGroup.structureName}`);
            console.log(`   第一组动作数量: ${firstGroup.exerciseList.length}`);
            
            if (firstGroup.exerciseList.length > 0) {
                const firstExercise = firstGroup.exerciseList[0];
                console.log('   第一个动作信息:');
                console.log(`     ID: ${firstExercise.id}`);
                console.log(`     名称: ${firstExercise.name}`);
                console.log(`     MET: ${firstExercise.met}`);
                console.log(`     难度: ${firstExercise.difficultyCode}`);
                console.log(`     状态: ${firstExercise.status}`);
                
                // 验证字段完整性
                const requiredFields = ['id', 'name', 'status'];
                const missingFields = requiredFields.filter(field => !firstExercise.hasOwnProperty(field));
                
                if (missingFields.length === 0) {
                    console.log('   ✅ 必需字段完整');
                    return true;
                } else {
                    console.log(`   ❌ 缺少必需字段: ${missingFields.join(', ')}`);
                    return false;
                }
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ 数据组织逻辑测试失败:', error.message);
        return false;
    }
}

// 测试字段映射
async function testFieldMapping() {
    try {
        console.log('\n🔍 测试字段映射...');
        
        // 检查exercise表的实际字段
        const columns = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'exercise'
            ORDER BY ordinal_position
        `);
        
        console.log('✅ exercise表字段查询成功');
        console.log(`   字段数量: ${columns.length}`);
        
        const fieldNames = columns.map(col => col.column_name);
        console.log('   字段列表:', fieldNames.join(', '));
        
        // 验证关键字段是否存在
        const keyFields = ['id', 'name', 'cover_img_url', 'status', 'difficulty_code', 'gender_code'];
        const missingKeyFields = keyFields.filter(field => !fieldNames.includes(field));
        
        if (missingKeyFields.length === 0) {
            console.log('   ✅ 关键字段都存在');
            return true;
        } else {
            console.log(`   ❌ 缺少关键字段: ${missingKeyFields.join(', ')}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 字段映射测试失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试修复后的workout详情查询\n');
    
    try {
        // 1. 测试SQL查询
        const sqlTest = await testSqlQuery();
        
        // 2. 测试数据组织逻辑
        const dataTest = await testDataOrganization();
        
        // 3. 测试字段映射
        const fieldTest = await testFieldMapping();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   SQL查询: ${sqlTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   数据组织: ${dataTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   字段映射: ${fieldTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   总体结果: ${sqlTest && dataTest && fieldTest ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        console.log('\n✅ 修复后的workout详情查询测试完成');
        
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
    testSqlQuery,
    testDataOrganization,
    testFieldMapping
};
