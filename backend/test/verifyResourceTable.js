/**
 * 验证Resource表结构
 */

const { query } = require('../config/database');

async function verifyResourceTable() {
    try {
        console.log('🔍 验证Resource表结构...\n');

        // 验证resource表结构
        console.log('1. Resource表结构:');
        const resourceColumns = await query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'resource'
            ORDER BY ordinal_position
        `);

        resourceColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(可空)' : '(非空)'} ${col.COLUMN_COMMENT ? `// ${col.COLUMN_COMMENT}` : ''}`);
        });

        // 验证索引
        console.log('\n2. Resource表索引:');
        const resourceIndexes = await query(`
            SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() AND table_name = 'resource'
            ORDER BY index_name, seq_in_index
        `);

        const indexGroups = {};
        resourceIndexes.forEach(idx => {
            if (!indexGroups[idx.INDEX_NAME]) {
                indexGroups[idx.INDEX_NAME] = [];
            }
            indexGroups[idx.INDEX_NAME].push(idx.COLUMN_NAME);
        });

        Object.entries(indexGroups).forEach(([indexName, columns]) => {
            console.log(`   - ${indexName}: [${columns.join(', ')}]`);
        });

        // 验证枚举值
        console.log('\n3. 枚举字段约束:');
        const enumColumns = await query(`
            SELECT COLUMN_NAME, COLUMN_TYPE
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = 'resource'
            AND DATA_TYPE = 'enum'
            ORDER BY ordinal_position
        `);

        enumColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
        });

        // 检查数据
        console.log('\n4. 数据统计:');
        const dataResult = await query(`SELECT COUNT(*) as count FROM resource`);
        console.log(`   📊 总记录数: ${dataResult[0].count}`);

        const statusStats = await query(`
            SELECT status, COUNT(*) as count 
            FROM resource 
            WHERE is_deleted = 0 
            GROUP BY status
        `);
        
        if (statusStats.length > 0) {
            console.log('   📈 状态分布:');
            statusStats.forEach(stat => {
                console.log(`      - ${stat.status}: ${stat.count} 条`);
            });
        } else {
            console.log('   📈 状态分布: 暂无数据');
        }

        console.log('\n✅ Resource表结构验证完成！');

        // 返回验证结果
        return {
            tableExists: resourceColumns.length > 0,
            columnCount: resourceColumns.length,
            indexCount: Object.keys(indexGroups).length,
            enumCount: enumColumns.length,
            dataCount: dataResult[0].count
        };

    } catch (error) {
        console.error('❌ 验证Resource表结构失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    verifyResourceTable()
        .then((result) => {
            console.log('\n🎉 验证完成');
            console.log('验证结果:', JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 验证失败:', error);
            process.exit(1);
        });
}

module.exports = { verifyResourceTable };
