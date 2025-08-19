/**
 * 初始化Programs表脚本
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function initProgramsTable() {
    try {
        console.log('🚀 开始初始化Programs表...');

        // 读取SQL文件
        const sqlFilePath = path.join(__dirname, '../sql/create_programs_table.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // 按分号分割SQL语句
        const sqlStatements = sqlContent
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0 && !statement.startsWith('--'));

        console.log(`📝 找到 ${sqlStatements.length} 条SQL语句`);

        // 执行每条SQL语句
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            console.log(`⚡ 执行第 ${i + 1} 条语句...`);

            try {
                await query(statement);
                console.log(`✅ 第 ${i + 1} 条语句执行成功`);
            } catch (error) {
                // 如果是表已存在的错误，忽略它
                if (error.message.includes('already exists')) {
                    console.log(`⚠️  第 ${i + 1} 条语句: 表已存在，跳过`);
                } else {
                    console.error(`❌ 第 ${i + 1} 条语句执行失败:`, error.message);
                    throw error;
                }
            }
        }

        // 验证表是否创建成功
        console.log('\n🔍 验证表创建结果...');

        // 检查programs表
        const programsTableResult = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'program'
        `);

        if (programsTableResult[0].count > 0) {
            console.log('✅ 表 program 创建成功');

            // 获取表结构信息
            const columns = await query(`
                SELECT column_name, data_type, is_nullable, column_default, column_comment
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() AND table_name = 'program'
                ORDER BY ordinal_position
            `);

            console.log(`   📋 字段数量: ${columns.length}`);

            // 检查数据
            const dataResult = await query('SELECT COUNT(*) as count FROM program');
            console.log(`   📊 数据条数: ${dataResult[0].count}`);

            // 显示前几条数据
            if (dataResult[0].count > 0) {
                const sampleData = await query('SELECT id, name, status, group_code, show_in_page FROM program LIMIT 5');
                console.log('   📝 示例数据:');
                sampleData.forEach(row => {
                    console.log(`      ${row.id} - ${row.name} (${row.status}, ${row.group_code}, 展示:${row.show_in_page})`);
                });
            }
        } else {
            console.log('❌ 表 program 创建失败');
        }

        // 检查programs_workout关联表
        const programsWorkoutTableResult = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'programs_workout'
        `);

        if (programsWorkoutTableResult[0].count > 0) {
            console.log('✅ 表 programs_workout 创建成功');

            const workoutDataResult = await query('SELECT COUNT(*) as count FROM programs_workout');
            console.log(`   📊 关联数据条数: ${workoutDataResult[0].count}`);
        } else {
            console.log('❌ 表 programs_workout 创建失败');
        }

        // 检查索引
        console.log('\n🔍 检查索引创建情况...');
        const indexes = await query(`
            SELECT index_name, column_name 
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() AND table_name = 'program'
            AND index_name != 'PRIMARY'
            ORDER BY index_name, seq_in_index
        `);

        if (indexes.length > 0) {
            console.log('✅ 索引创建成功:');
            const indexGroups = {};
            indexes.forEach(idx => {
                if (!indexGroups[idx.index_name]) {
                    indexGroups[idx.index_name] = [];
                }
                indexGroups[idx.index_name].push(idx.column_name);
            });

            Object.keys(indexGroups).forEach(indexName => {
                console.log(`   📌 ${indexName}: ${indexGroups[indexName].join(', ')}`);
            });
        } else {
            console.log('⚠️  未找到索引信息');
        }

        console.log('\n🎉 Programs表初始化完成！');

    } catch (error) {
        console.error('💥 初始化Programs表失败:', error.message);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initProgramsTable()
        .then(() => {
            console.log('✅ 脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = {
    initProgramsTable
};
