/**
 * 更新Resource表结构脚本
 * 将NOT NULL字段改为允许NULL（草稿状态只验证name）
 */

const { query } = require('../config/database');

async function updateResourceTable() {
  try {
    console.log('🚀 开始更新Resource表结构...');

    // 检查表是否存在
    const tableExists = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'resource'
        `);

    if (tableExists[0].count === 0) {
      console.log('❌ Resource表不存在，请先运行 initResourceTable.js');
      return;
    }

    console.log('✅ Resource表存在，开始更新字段约束...');

    // 更新字段约束，允许NULL值（草稿状态只验证name）
    const alterStatements = [
      'ALTER TABLE resource MODIFY COLUMN application_code ENUM(\'PLAN\', \'WORKOUT\') DEFAULT NULL COMMENT \'application code\'',
      'ALTER TABLE resource MODIFY COLUMN gender_code ENUM(\'FEMALE\', \'MALE\') DEFAULT NULL COMMENT \'性别code\'',
      'ALTER TABLE resource MODIFY COLUMN cover_img_url VARCHAR(500) DEFAULT NULL COMMENT \'封面图\'',
      'ALTER TABLE resource MODIFY COLUMN detail_img_url VARCHAR(500) DEFAULT NULL COMMENT \'详情图\''
    ];

    for (let i = 0; i < alterStatements.length; i++) {
      const statement = alterStatements[i];
      try {
        await query(statement);

        // 提取字段名
        const fieldMatch = statement.match(/MODIFY COLUMN (\w+)/);
        const fieldName = fieldMatch ? fieldMatch[1] : '字段';

        console.log(`✅ 更新 ${fieldName} 字段约束成功`);
      } catch (error) {
        console.error('❌ 更新字段约束失败:', statement);
        console.error('   错误信息:', error.message);
        throw error;
      }
    }

    console.log('\n🔍 验证更新结果...');

    // 验证字段约束
    const columns = await query(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'resource'
            AND COLUMN_NAME IN ('application_code', 'gender_code', 'cover_img_url', 'detail_img_url')
            ORDER BY ordinal_position
        `);

    console.log('更新后的字段约束:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? '(可空)' : '(非空)'} 默认值: ${col.COLUMN_DEFAULT || 'NULL'}`);
    });

    // 测试插入草稿数据
    console.log('\n🧪 测试草稿数据插入...');

    try {
      const testResult = await query(`
                INSERT INTO resource (name, status, create_time, update_time) 
                VALUES ('测试草稿资源', 'DRAFT', NOW(), NOW())
            `);

      const { insertId } = testResult;
      console.log(`✅ 草稿数据插入成功，ID: ${insertId}`);

      // 清理测试数据
      await query('DELETE FROM resource WHERE id = ?', [insertId]);
      console.log('✅ 测试数据清理完成');

    } catch (error) {
      console.error('❌ 草稿数据插入测试失败:', error.message);
      throw error;
    }

    console.log('\n✅ Resource表结构更新完成！');
    console.log('现在草稿状态只需要验证name字段，其他字段可以为NULL');

  } catch (error) {
    console.error('❌ 更新Resource表结构失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateResourceTable()
    .then(() => {
      console.log('\n🎉 更新完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 更新失败:', error);
      process.exit(1);
    });
}

module.exports = { updateResourceTable };
