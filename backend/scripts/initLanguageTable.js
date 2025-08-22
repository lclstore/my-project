/**
 * 初始化Language表
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function initLanguageTable() {
  try {
    console.log('🔄 开始初始化Language表...');

    // 检查表是否已经存在并有数据
    try {
      const existingData = await query('SELECT COUNT(*) as count FROM language');
      if (existingData[0].count > 0) {
        console.log('✅ Language表已存在且有数据，跳过初始化');
        await verifyTable();
        return;
      }
    } catch (error) {
      // 表不存在，继续初始化
      console.log('📝 Language表不存在，开始创建...');
    }

    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '../sql/create_language_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // 分割SQL语句（以分号分割）
    const sqlStatements = [];
    const lines = sqlContent.split('\n');
    let currentStatement = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 跳过注释行和空行
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }

      currentStatement += ` ${ trimmedLine}`;

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
        } else if (statement.includes('CREATE INDEX') || statement.includes('CREATE UNIQUE INDEX')) {
          const match = statement.match(/CREATE (?:UNIQUE )?INDEX\s+(\w+)/i);
          if (match) {
            operation = `创建索引 ${match[1]}`;
          }
        } else if (statement.includes('INSERT INTO')) {
          const match = statement.match(/INSERT INTO\s+(\w+)/i);
          if (match) {
            operation = `插入数据到 ${match[1]}`;
          }
        }

        console.log(`✅ ${operation} 执行成功`);
      } catch (error) {
        console.error('❌ SQL语句执行失败:', `${statement.substring(0, 100) }...`);
        console.error('   错误信息:', error.message);
        throw error;
      }
    }

    console.log('🎉 Language表初始化完成！');

    // 验证表是否创建成功
    await verifyTable();

  } catch (error) {
    console.error('❌ 初始化Language表失败:', error);
    throw error;
  }
}

async function verifyTable() {
  try {
    console.log('\n🔍 验证表创建结果...');

    // 检查表是否存在
    const tableResult = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'language'
        `);

    if (tableResult[0].count > 0) {
      console.log('✅ 表 language 创建成功');

      // 获取表结构信息
      const columns = await query(`
                SELECT column_name, data_type, is_nullable, column_default, column_comment
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() AND table_name = 'language'
                ORDER BY ordinal_position
            `);

      console.log(`   📋 字段数量: ${columns.length}`);

      // 检查数据
      const dataResult = await query('SELECT COUNT(*) as count FROM language');
      console.log(`   📊 数据条数: ${dataResult[0].count}`);

      // 显示前几条数据
      if (dataResult[0].count > 0) {
        const sampleData = await query('SELECT * FROM language LIMIT 5');
        console.log('   📝 示例数据:');
        sampleData.forEach(row => {
          console.log(`      ${row.code} - ${row.name}`);
        });
      }
    } else {
      console.log('❌ 表 language 创建失败');
    }

    // 验证索引
    const indexes = await query(`
            SELECT 
                index_name,
                column_name,
                non_unique
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
            AND table_name = 'language'
            AND index_name != 'PRIMARY'
        `);

    console.log(`✅ 索引数量: ${indexes.length}`);

  } catch (error) {
    console.error('❌ 验证表创建结果失败:', error);
  }
}

// 如果直接运行此文件，执行初始化
if (require.main === module) {
  initLanguageTable()
    .then(() => {
      console.log('\n🎉 初始化完成，可以开始使用Language功能了！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 初始化失败:', error.message);
      process.exit(1);
    });
}

module.exports = {
  initLanguageTable,
  verifyTable
};
