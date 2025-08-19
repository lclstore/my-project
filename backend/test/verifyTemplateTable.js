/**
 * 验证Template表结构
 */

const { query } = require('../config/database');

async function verifyTemplateTable() {
    try {
        console.log('🔍 验证Template表结构...\n');

        // 验证template表结构
        console.log('1. Template表结构:');
        const templateColumns = await query(`
            SELECT column_name, data_type, is_nullable, column_default, column_comment
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'template'
            ORDER BY ordinal_position
        `);

        templateColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(可空)' : '(非空)'} ${col.COLUMN_COMMENT ? `// ${col.COLUMN_COMMENT}` : ''}`);
        });

        // 验证template_unit表结构
        console.log('\n2. Template_unit表结构:');
        const unitColumns = await query(`
            SELECT column_name, data_type, is_nullable, column_default, column_comment
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'template_unit'
            ORDER BY ordinal_position
        `);

        unitColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(可空)' : '(非空)'} ${col.COLUMN_COMMENT ? `// ${col.COLUMN_COMMENT}` : ''}`);
        });

        // 验证索引
        console.log('\n3. Template表索引:');
        const templateIndexes = await query(`
            SELECT index_name, column_name, non_unique
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() AND table_name = 'template'
            ORDER BY index_name, seq_in_index
        `);

        const indexGroups = {};
        templateIndexes.forEach(idx => {
            if (!indexGroups[idx.INDEX_NAME]) {
                indexGroups[idx.INDEX_NAME] = [];
            }
            indexGroups[idx.INDEX_NAME].push(idx.COLUMN_NAME);
        });

        Object.entries(indexGroups).forEach(([indexName, columns]) => {
            console.log(`   - ${indexName}: [${columns.join(', ')}]`);
        });

        console.log('\n4. Template_unit表索引:');
        const unitIndexes = await query(`
            SELECT index_name, column_name, non_unique
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() AND table_name = 'template_unit'
            ORDER BY index_name, seq_in_index
        `);

        const unitIndexGroups = {};
        unitIndexes.forEach(idx => {
            if (!unitIndexGroups[idx.INDEX_NAME]) {
                unitIndexGroups[idx.INDEX_NAME] = [];
            }
            unitIndexGroups[idx.INDEX_NAME].push(idx.COLUMN_NAME);
        });

        Object.entries(unitIndexGroups).forEach(([indexName, columns]) => {
            console.log(`   - ${indexName}: [${columns.join(', ')}]`);
        });

        // 验证外键约束
        console.log('\n5. 外键约束:');
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
            AND table_name IN ('template', 'template_unit')
        `);

        if (foreignKeys.length > 0) {
            foreignKeys.forEach(fk => {
                console.log(`   - ${fk.CONSTRAINT_NAME}: ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            });
        } else {
            console.log('   - 未找到外键约束');
        }

        console.log('\n✅ Template表结构验证完成！');

    } catch (error) {
        console.error('❌ 验证Template表结构失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    verifyTemplateTable()
        .then(() => {
            console.log('\n🎉 验证完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 验证失败:', error);
            process.exit(1);
        });
}

module.exports = { verifyTemplateTable };
