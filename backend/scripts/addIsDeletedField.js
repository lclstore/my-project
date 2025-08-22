/**
 * 为workout表添加is_deleted字段
 */

const { query } = require('../config/database');

async function addIsDeletedField() {
  try {
    console.log('🔄 开始为workout表添加is_deleted字段...');

    // 检查字段是否已存在
    const checkSql = `
            SELECT COUNT(*) as count 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'workout' 
            AND column_name = 'is_deleted'
        `;
    const checkResult = await query(checkSql);

    if (checkResult[0].count > 0) {
      console.log('✅ is_deleted字段已存在，跳过添加');
      return;
    }

    // 添加is_deleted字段
    const addColumnSql = `
            ALTER TABLE workout 
            ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 COMMENT '是否删除（0正常 1已删除）'
        `;
    await query(addColumnSql);
    console.log('✅ 添加is_deleted字段成功');

    // 创建索引
    try {
      const addIndexSql = 'CREATE INDEX idx_workout_is_deleted ON workout(is_deleted)';
      await query(addIndexSql);
      console.log('✅ 创建is_deleted索引成功');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ is_deleted索引已存在，跳过创建');
      } else {
        throw error;
      }
    }

    // 更新现有数据为未删除状态
    const updateSql = 'UPDATE workout SET is_deleted = 0 WHERE is_deleted IS NULL';
    const updateResult = await query(updateSql);
    console.log(`✅ 更新现有数据成功，影响行数: ${updateResult.affectedRows}`);

    console.log('🎉 is_deleted字段添加完成！');

  } catch (error) {
    console.error('❌ 添加is_deleted字段失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行添加
if (require.main === module) {
  addIsDeletedField()
    .then(() => {
      console.log('\n🎉 字段添加完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 字段添加失败:', error.message);
      process.exit(1);
    });
}

module.exports = {
  addIsDeletedField
};
