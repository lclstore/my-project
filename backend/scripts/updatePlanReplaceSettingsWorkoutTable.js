/**
 * 更新PlanReplaceSettings Workout表结构脚本
 * 将workout关联从rule级别改为settings级别
 */

const { query } = require('../config/database');

async function updatePlanReplaceSettingsWorkoutTable() {
  try {
    console.log('🚀 开始更新PlanReplaceSettings Workout表结构...');

    // 1. 检查当前表结构
    console.log('\n1. 检查当前表结构:');

    const currentColumns = await query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'plan_replace_settings_workout'
            ORDER BY ordinal_position
        `);

    console.log('   当前字段:');
    currentColumns.forEach(col => {
      console.log(`     - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(可空)' : '(非空)'} ${col.COLUMN_COMMENT ? `// ${col.COLUMN_COMMENT}` : ''}`);
    });

    // 2. 检查是否需要更新
    const hasRuleIdColumn = currentColumns.some(col => col.COLUMN_NAME === 'plan_replace_settings_rule_id');
    const hasSettingsIdColumn = currentColumns.some(col => col.COLUMN_NAME === 'plan_replace_settings_id');

    if (!hasRuleIdColumn && hasSettingsIdColumn) {
      console.log('\n✅ 表结构已经是最新的，无需更新');
      return;
    }

    if (!hasRuleIdColumn) {
      console.log('\n❌ 表结构异常，缺少关联字段');
      return;
    }

    // 3. 备份现有数据
    console.log('\n2. 备份现有数据:');

    const existingData = await query(`
            SELECT 
                prsw.*,
                prsr.plan_replace_settings_id
            FROM plan_replace_settings_workout prsw
            JOIN plan_replace_settings_rule prsr ON prsw.plan_replace_settings_rule_id = prsr.id
        `);

    console.log(`   备份了 ${existingData.length} 条数据`);

    // 4. 删除外键约束
    console.log('\n3. 删除外键约束:');

    try {
      // 查找外键约束名
      const foreignKeys = await query(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.key_column_usage 
                WHERE table_schema = DATABASE() 
                AND table_name = 'plan_replace_settings_workout'
                AND referenced_table_name IS NOT NULL
            `);

      for (const fk of foreignKeys) {
        await query(`ALTER TABLE plan_replace_settings_workout DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        console.log(`   删除外键约束: ${fk.CONSTRAINT_NAME}`);
      }
    } catch (error) {
      console.log(`   外键约束删除失败（可能不存在）: ${error.message}`);
    }

    // 5. 删除旧索引
    console.log('\n4. 删除旧索引:');

    try {
      await query('DROP INDEX idx_plan_replace_settings_workout_rule_id ON plan_replace_settings_workout');
      console.log('   删除索引: idx_plan_replace_settings_workout_rule_id');
    } catch (error) {
      console.log(`   索引删除失败（可能不存在）: ${error.message}`);
    }

    // 6. 添加新字段
    console.log('\n5. 添加新字段:');

    if (!hasSettingsIdColumn) {
      await query(`
                ALTER TABLE plan_replace_settings_workout 
                ADD COLUMN plan_replace_settings_id BIGINT NOT NULL COMMENT 'plan replace settings ID' AFTER id
            `);
      console.log('   添加字段: plan_replace_settings_id');
    }

    // 7. 迁移数据
    console.log('\n6. 迁移数据:');

    if (existingData.length > 0) {
      // 更新新字段的值
      for (const row of existingData) {
        await query(`
                    UPDATE plan_replace_settings_workout 
                    SET plan_replace_settings_id = ? 
                    WHERE id = ?
                `, [row.plan_replace_settings_id, row.id]);
      }
      console.log(`   迁移了 ${existingData.length} 条数据`);
    }

    // 8. 删除旧字段
    console.log('\n7. 删除旧字段:');

    await query('ALTER TABLE plan_replace_settings_workout DROP COLUMN plan_replace_settings_rule_id');
    console.log('   删除字段: plan_replace_settings_rule_id');

    // 9. 添加新的外键约束和索引
    console.log('\n8. 添加新的外键约束和索引:');

    await query(`
            ALTER TABLE plan_replace_settings_workout 
            ADD CONSTRAINT fk_plan_replace_settings_workout_settings_id 
            FOREIGN KEY (plan_replace_settings_id) REFERENCES plan_replace_settings(id) ON DELETE CASCADE
        `);
    console.log('   添加外键约束: fk_plan_replace_settings_workout_settings_id');

    await query('CREATE INDEX idx_plan_replace_settings_workout_settings_id ON plan_replace_settings_workout(plan_replace_settings_id)');
    console.log('   添加索引: idx_plan_replace_settings_workout_settings_id');

    // 10. 验证更新结果
    console.log('\n9. 验证更新结果:');

    const updatedColumns = await query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'plan_replace_settings_workout'
            ORDER BY ordinal_position
        `);

    console.log('   更新后的字段:');
    updatedColumns.forEach(col => {
      console.log(`     - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(可空)' : '(非空)'} ${col.COLUMN_COMMENT ? `// ${col.COLUMN_COMMENT}` : ''}`);
    });

    const dataCount = await query('SELECT COUNT(*) as count FROM plan_replace_settings_workout');
    console.log(`   数据条数: ${dataCount[0].count}`);

    console.log('\n✅ PlanReplaceSettings Workout表结构更新完成！');
    console.log('现在workout直接关联到plan_replace_settings，与ruleList同级');

  } catch (error) {
    console.error('❌ 更新PlanReplaceSettings Workout表结构失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updatePlanReplaceSettingsWorkoutTable()
    .then(() => {
      console.log('\n🎉 更新完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 更新失败:', error);
      process.exit(1);
    });
}

module.exports = { updatePlanReplaceSettingsWorkoutTable };
