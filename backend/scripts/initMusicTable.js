/**
 * 初始化Music表脚本
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function initMusicTable() {
    try {
        console.log('🚀 开始初始化Music表...');

        // 读取SQL文件
        const sqlFilePath = path.join(__dirname, '../sql/create_music_table.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // 分割SQL语句（以分号分割，过滤空语句）
        const sqlStatements = sqlContent
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);

        console.log(`📝 找到 ${sqlStatements.length} 条SQL语句`);

        // 逐条执行SQL语句
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            try {
                // 如果是创建索引的语句，先检查索引是否存在
                if (statement.includes('CREATE INDEX')) {
                    const match = statement.match(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
                    if (match) {
                        const indexName = match[1];
                        
                        // 检查索引是否已存在
                        const indexExists = await query(`
                            SELECT COUNT(*) as count 
                            FROM information_schema.statistics 
                            WHERE table_schema = DATABASE() 
                            AND index_name = ?
                        `, [indexName]);
                        
                        if (indexExists[0].count > 0) {
                            console.log(`⚠️  索引 ${indexName} 已存在，跳过创建`);
                            continue;
                        }
                        
                        // 移除 IF NOT EXISTS 语法（MySQL可能不支持）
                        const cleanStatement = statement.replace(/IF NOT EXISTS\s+/i, '');
                        await query(cleanStatement);
                        console.log(`✅ 创建索引 ${indexName} 执行成功`);
                    }
                } else {
                    await query(statement);

                    // 提取表名或操作类型用于日志
                    let operation = 'SQL语句';
                    if (statement.includes('CREATE TABLE')) {
                        const match = statement.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i);
                        if (match) {
                            operation = `创建表 ${match[1]}`;
                        }
                    }

                    console.log(`✅ ${operation} 执行成功`);
                }
            } catch (error) {
                // 如果是表已存在的错误，忽略它
                if (error.message.includes('already exists')) {
                    console.log(`⚠️  ${statement.substring(0, 50)}... 已存在，跳过`);
                } else {
                    console.error(`❌ SQL语句执行失败:`, statement.substring(0, 100) + '...');
                    console.error(`   错误信息:`, error.message);
                    throw error;
                }
            }
        }

        console.log('\n🔍 验证表创建结果...');

        // 验证music表
        await verifyTable('music');

        console.log('\n✅ Music表初始化完成！');

    } catch (error) {
        console.error('❌ 初始化Music表失败:', error);
        throw error;
    }
}

async function verifyTable(tableName) {
    try {
        const tableResult = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = ?
        `, [tableName]);

        if (tableResult[0].count > 0) {
            console.log(`✅ 表 ${tableName} 创建成功`);

            // 获取表结构信息
            const columns = await query(`
                SELECT column_name, data_type, is_nullable, column_default, column_comment
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() AND table_name = ?
                ORDER BY ordinal_position
            `, [tableName]);

            console.log(`   📋 字段数量: ${columns.length}`);
            columns.forEach(col => {
                console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(可空)' : '(非空)'} ${col.column_comment ? `// ${col.column_comment}` : ''}`);
            });

            // 检查数据
            const dataResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`   📊 数据条数: ${dataResult[0].count}`);

        } else {
            console.log(`❌ 表 ${tableName} 创建失败`);
        }
    } catch (error) {
        console.error(`验证表 ${tableName} 时出错:`, error.message);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initMusicTable()
        .then(() => {
            console.log('\n🎉 初始化完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 初始化失败:', error);
            process.exit(1);
        });
}

module.exports = { initMusicTable };
