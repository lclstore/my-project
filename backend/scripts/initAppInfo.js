/**
 * 初始化 app_info 表
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function initAppInfo() {
    try {
        console.log('🚀 开始初始化 app_info 表...');

        // 读取 SQL 文件
        const sqlFilePath = path.join(__dirname, '../sql/app_info.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // 分割 SQL 语句（以分号分割）
        const sqlStatements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // 执行每个 SQL 语句
        for (const sql of sqlStatements) {
            if (sql.trim()) {
                console.log('执行 SQL:', sql.substring(0, 50) + '...');
                await query(sql);
            }
        }

        console.log('✅ app_info 表初始化成功');

        // 验证数据是否插入成功
        const result = await query('SELECT * FROM app_info LIMIT 1');
        if (result && result.length > 0) {
            console.log('✅ 默认应用信息已插入');
            console.log('应用名称:', result[0].app_name);
            console.log('应用版本:', result[0].app_version);
        }

    } catch (error) {
        console.error('❌ 初始化 app_info 表失败:', error.message);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initAppInfo()
        .then(() => {
            console.log('🎉 初始化完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 初始化失败:', error);
            process.exit(1);
        });
}

module.exports = { initAppInfo };
