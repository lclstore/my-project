/**
 * Workout模块测试
 */

const { query, queryOne, transaction } = require('../config/database');

// 测试数据库表创建
async function testTableCreation() {
    try {
        console.log('🔍 测试数据库表创建...');

        // 检查workout主表
        const workoutTable = await queryOne(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'workout'
        `);
        console.log(`✅ workout表: ${workoutTable.count > 0 ? '存在' : '不存在'}`);

        // 检查workout_injured表
        const injuredTable = await queryOne(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'workout_injured'
        `);
        console.log(`✅ workout_injured表: ${injuredTable.count > 0 ? '存在' : '不存在'}`);

        // 检查workout_structure表
        const structureTable = await queryOne(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'workout_structure'
        `);
        console.log(`✅ workout_structure表: ${structureTable.count > 0 ? '存在' : '不存在'}`);

        // 检查workout_structure_exercise表
        const exerciseTable = await queryOne(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'workout_structure_exercise'
        `);
        console.log(`✅ workout_structure_exercise表: ${exerciseTable.count > 0 ? '存在' : '不存在'}`);

    } catch (error) {
        console.error('❌ 测试表创建失败:', error);
    }
}

// 测试插入数据
async function testInsertData() {
    try {
        console.log('\n🔍 测试插入数据...');

        const result = await transaction(async (connection) => {
            // 插入workout主数据
            const workoutSql = `
                INSERT INTO workout (
                    name, description, premium, gender_code, difficulty_code, 
                    position_code, calorie, duration, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [workoutResult] = await connection.execute(workoutSql, [
                '测试训练', '这是一个测试训练', 0, 'MALE', 'BEGINNER',
                'STANDING', 300, 1800, 'DRAFT'
            ]);
            const workoutId = workoutResult.insertId;
            console.log(`✅ 插入workout成功，ID: ${workoutId}`);

            // 插入受伤类型
            const injuredSql = 'INSERT INTO workout_injured (workout_id, injured_code) VALUES (?, ?)';
            await connection.execute(injuredSql, [workoutId, 'NONE']);
            console.log('✅ 插入受伤类型成功');

            // 插入结构数据
            const structureSql = `
                INSERT INTO workout_structure (workout_id, structure_name, structure_round, sort_order) 
                VALUES (?, ?, ?, ?)
            `;
            const [structureResult] = await connection.execute(structureSql, [
                workoutId, '热身', 1, 1
            ]);
            const structureId = structureResult.insertId;
            console.log(`✅ 插入结构成功，ID: ${structureId}`);

            // 插入动作关联（假设exercise表中有ID为1的动作）
            const exerciseSql = `
                INSERT INTO workout_structure_exercise (workout_structure_id, exercise_id, sort_order) 
                VALUES (?, ?, ?)
            `;
            try {
                await connection.execute(exerciseSql, [structureId, 1, 1]);
                console.log('✅ 插入动作关联成功');
            } catch (error) {
                console.log('⚠️  插入动作关联失败（可能exercise表中没有ID为1的记录）');
            }

            return { workoutId };
        });

        console.log(`🎉 测试数据插入完成，workout ID: ${result.workoutId}`);
        return result.workoutId;

    } catch (error) {
        console.error('❌ 测试插入数据失败:', error);
        return null;
    }
}

// 测试查询数据
async function testQueryData(workoutId) {
    try {
        console.log('\n🔍 测试查询数据...');

        // 查询主表数据
        const workoutData = await queryOne('SELECT * FROM workout WHERE id = ?', [workoutId]);
        console.log('✅ 查询workout主数据:', workoutData ? '成功' : '失败');

        // 查询受伤类型
        const injuredData = await query('SELECT * FROM workout_injured WHERE workout_id = ?', [workoutId]);
        console.log(`✅ 查询受伤类型: ${injuredData.length}条记录`);

        // 查询结构数据
        const structureData = await query('SELECT * FROM workout_structure WHERE workout_id = ?', [workoutId]);
        console.log(`✅ 查询结构数据: ${structureData.length}条记录`);

        // 查询动作关联
        if (structureData.length > 0) {
            const exerciseData = await query(
                'SELECT * FROM workout_structure_exercise WHERE workout_structure_id = ?',
                [structureData[0].id]
            );
            console.log(`✅ 查询动作关联: ${exerciseData.length}条记录`);
        }

    } catch (error) {
        console.error('❌ 测试查询数据失败:', error);
    }
}

// 测试逻辑删除数据
async function testDeleteData(workoutId) {
    try {
        console.log('\n🔍 测试逻辑删除数据...');

        // 使用逻辑删除
        const result = await query('UPDATE workout SET is_deleted = 1 WHERE id = ?', [workoutId]);
        console.log(`✅ 逻辑删除workout成功，影响行数: ${result.affectedRows}`);

        // 验证逻辑删除后的查询
        const deletedWorkout = await queryOne('SELECT * FROM workout WHERE id = ? AND is_deleted = 0', [workoutId]);
        console.log(`✅ 逻辑删除验证 - 未删除状态查询: ${deletedWorkout ? '仍可查到' : '已查不到'}`);

        const allWorkout = await queryOne('SELECT * FROM workout WHERE id = ?', [workoutId]);
        console.log(`✅ 逻辑删除验证 - 全部数据查询: ${allWorkout ? '数据仍存在' : '数据不存在'}`);
        console.log(`   is_deleted状态: ${allWorkout ? allWorkout.is_deleted : 'N/A'}`);

        // 验证关联数据仍然存在（逻辑删除不影响关联表）
        const injuredCount = await queryOne('SELECT COUNT(*) as count FROM workout_injured WHERE workout_id = ?', [workoutId]);
        const structureCount = await queryOne('SELECT COUNT(*) as count FROM workout_structure WHERE workout_id = ?', [workoutId]);

        console.log(`✅ 关联数据验证 - 受伤类型: ${injuredCount.count}条, 结构数据: ${structureCount.count}条`);

    } catch (error) {
        console.error('❌ 测试逻辑删除数据失败:', error);
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始Workout模块测试\n');

    await testTableCreation();

    const workoutId = await testInsertData();

    if (workoutId) {
        await testQueryData(workoutId);
        await testDeleteData(workoutId);
    }

    console.log('\n✅ Workout模块测试完成');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testTableCreation,
    testInsertData,
    testQueryData,
    testDeleteData,
    runTests
};
