/**
 * 为 sound 表添加 is_deleted 字段的脚本
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function addIsDeletedToSound() {
    try {
        console.log('🚀 开始为 sound 表添加 is_deleted 字段...');

        // 读取SQL文件
        const sqlFilePath = path.join(__dirname, '../sql/add_is_deleted_to_sound.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // 分割SQL语句（以分号分割，过滤空语句和注释）
        const sqlStatements = sqlContent
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0 && !statement.startsWith('--'));

        console.log(`📝 找到 ${sqlStatements.length} 条SQL语句`);

        // 执行SQL语句
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            
            try {
                console.log(`\n🔄 执行第 ${i + 1} 条语句...`);
                
                const result = await query(statement);
                
                // 如果是SELECT语句，显示结果
                if (statement.trim().toUpperCase().startsWith('SELECT')) {
                    if (Array.isArray(result) && result.length > 0) {
                        console.log(`📋 结果:`);
                        result.forEach(row => {
                            console.log('  ', row);
                        });
                    }
                } else {
                    console.log(`✅ 语句执行成功`);
                }
                
            } catch (error) {
                console.error(`❌ SQL语句执行失败:`, statement.substring(0, 100) + '...');
                console.error(`   错误信息:`, error.message);
                throw error;
            }
        }

        console.log('\n🎉 sound 表 is_deleted 字段添加完成！');

    } catch (error) {
        console.error('❌ 添加 is_deleted 字段失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    addIsDeletedToSound()
        .then(() => {
            console.log('\n✅ 脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ 脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = { addIsDeletedToSound };
