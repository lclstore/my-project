/**
 * 初始化Workout相关数据库表
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function initWorkoutTables() {
    try {
        console.log('🔄 开始初始化Workout数据库表...');

        // 读取SQL文件
        const sqlFilePath = path.join(__dirname, '../sql/create_workout_tables.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // 分割SQL语句（以分号分割，但要处理多行语句）
        const sqlStatements = [];
        const lines = sqlContent.split('\n');
        let currentStatement = '';

        for (const line of lines) {
            const trimmedLine = line.trim();

            // 跳过注释行和空行
            if (trimmedLine.startsWith('--') || trimmedLine === '') {
                continue;
            }

            currentStatement += ' ' + trimmedLine;

            // 如果行以分号结尾，表示语句结束
            if (trimmedLine.endsWith(';')) {
                const statement = currentStatement.trim().slice(0, -1); // 移除最后的分号
                if (statement.length > 0) {
                    sqlStatements.push(statement);
                }
                currentStatement = '';
            }
        }

        // 处理最后一个语句（如果没有以分号结尾）
        if (currentStatement.trim().length > 0) {
            sqlStatements.push(currentStatement.trim());
        }

        console.log(`📝 找到 ${sqlStatements.length} 条SQL语句`);

        // 逐条执行SQL语句
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            try {
                await query(statement);

                // 提取表名或操作类型用于日志
                let operation = 'SQL语句';
                if (statement.includes('CREATE TABLE')) {
                    const match = statement.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i);
                    if (match) {
                        operation = `创建表 ${match[1]}`;
                    }
                } else if (statement.includes('CREATE INDEX')) {
                    const match = statement.match(/CREATE INDEX\s+(\w+)/i);
                    if (match) {
                        operation = `创建索引 ${match[1]}`;
                    }
                }

                console.log(`✅ ${operation} 执行成功`);
            } catch (error) {
                console.error(`❌ SQL语句执行失败:`, statement.substring(0, 100) + '...');
                console.error(`   错误信息:`, error.message);
                throw error;
            }
        }

        console.log('🎉 Workout数据库表初始化完成！');

        // 验证表是否创建成功
        await verifyTables();

    } catch (error) {
        console.error('❌ 初始化Workout数据库表失败:', error);
        throw error;
    }
}

async function verifyTables() {
    try {
        console.log('\n🔍 验证表创建结果...');

        const tables = ['workout', 'workout_injured', 'workout_structure', 'workout_structure_exercise'];

        for (const tableName of tables) {
            const result = await query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() AND table_name = ?
            `, [tableName]);

            if (result[0].count > 0) {
                console.log(`✅ 表 ${tableName} 创建成功`);

                // 获取表结构信息
                const columns = await query(`
                    SELECT column_name, data_type, is_nullable, column_default, column_comment
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() AND table_name = ?
                    ORDER BY ordinal_position
                `, [tableName]);

                console.log(`   📋 字段数量: ${columns.length}`);
            } else {
                console.log(`❌ 表 ${tableName} 创建失败`);
            }
        }

        // 验证外键约束
        const foreignKeys = await query(`
            SELECT 
                constraint_name,
                table_name,
                column_name,
                referenced_table_name,
                referenced_column_name
            FROM information_schema.key_column_usage 
            WHERE table_schema = DATABASE() 
            AND referenced_table_name IS NOT NULL
            AND table_name LIKE 'workout%'
        `);

        console.log(`✅ 外键约束数量: ${foreignKeys.length}`);

        // 验证索引
        const indexes = await query(`
            SELECT 
                table_name,
                index_name,
                column_name
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
            AND table_name LIKE 'workout%'
            AND index_name != 'PRIMARY'
        `);

        console.log(`✅ 索引数量: ${indexes.length}`);

    } catch (error) {
        console.error('❌ 验证表创建结果失败:', error);
    }
}

// 如果直接运行此文件，执行初始化
if (require.main === module) {
    initWorkoutTables()
        .then(() => {
            console.log('\n🎉 初始化完成，可以开始使用Workout功能了！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 初始化失败:', error.message);
            process.exit(1);
        });
}

module.exports = {
    initWorkoutTables,
    verifyTables
};
