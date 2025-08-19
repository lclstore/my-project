/**
 * 测试数据库连接和op_logs表
 */

const { query } = require('../config/database');

async function testDatabase() {
    console.log('🔍 测试数据库连接和op_logs表...\n');

    try {
        // 1. 测试数据库连接
        console.log('1. 测试数据库连接...');
        const connectionTest = await query('SELECT 1 as test');
        console.log('   ✅ 数据库连接正常');

        // 2. 检查op_logs表是否存在
        console.log('\n2. 检查op_logs表是否存在...');
        try {
            const tableCheck = await query('SHOW TABLES LIKE "op_logs"');
            if (tableCheck.length > 0) {
                console.log('   ✅ op_logs表存在');
            } else {
                console.log('   ❌ op_logs表不存在');
                return;
            }
        } catch (error) {
            console.log('   ❌ 检查表失败:', error.message);
            return;
        }

        // 3. 检查表结构
        console.log('\n3. 检查op_logs表结构...');
        try {
            const structure = await query('DESCRIBE op_logs');
            console.log('   表结构:');
            structure.forEach(field => {
                console.log(`     ${field.Field}: ${field.Type} ${field.Null === 'NO' ? '(必填)' : '(可选)'}`);
            });
        } catch (error) {
            console.log('   ❌ 检查表结构失败:', error.message);
        }

        // 4. 测试插入操作
        console.log('\n4. 测试插入操作...');
        try {
            const testData = {
                biz_type: 'biz_test',
                data_id: 999,
                data_info: '数据库测试',
                operation_type: 'SAVE',
                data_after: JSON.stringify({ test: true }),
                operation_user: 'database-test-user',
                operation_time: new Date()
            };

            const insertSql = `
                INSERT INTO op_logs (
                    biz_type, 
                    data_id, 
                    data_info, 
                    operation_type, 
                    data_after, 
                    operation_user, 
                    operation_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                testData.biz_type,
                testData.data_id,
                testData.data_info,
                testData.operation_type,
                testData.data_after,
                testData.operation_user,
                testData.operation_time
            ];

            console.log('   插入SQL:', insertSql.replace(/\s+/g, ' ').trim());
            console.log('   参数:', params);

            const result = await query(insertSql, params);
            console.log('   ✅ 插入成功, ID:', result.insertId);

            // 5. 验证插入的数据
            console.log('\n5. 验证插入的数据...');
            const selectResult = await query('SELECT * FROM op_logs WHERE id = ?', [result.insertId]);
            if (selectResult.length > 0) {
                console.log('   ✅ 数据验证成功:');
                console.log('     ID:', selectResult[0].id);
                console.log('     业务类型:', selectResult[0].biz_type);
                console.log('     操作类型:', selectResult[0].operation_type);
                console.log('     操作人:', selectResult[0].operation_user);
                console.log('     数据信息:', selectResult[0].data_info);
            } else {
                console.log('   ❌ 数据验证失败');
            }

            // 6. 清理测试数据
            console.log('\n6. 清理测试数据...');
            await query('DELETE FROM op_logs WHERE id = ?', [result.insertId]);
            console.log('   ✅ 清理完成');

        } catch (error) {
            console.log('   ❌ 插入操作失败:', error.message);
            console.log('   错误详情:', error);
        }

        // 7. 检查现有日志数量
        console.log('\n7. 检查现有日志数量...');
        try {
            const countResult = await query('SELECT COUNT(*) as total FROM op_logs');
            console.log(`   当前日志总数: ${countResult[0].total}`);

            if (countResult[0].total > 0) {
                const recentLogs = await query('SELECT * FROM op_logs ORDER BY id DESC LIMIT 5');
                console.log('   最近的5条日志:');
                recentLogs.forEach((log, index) => {
                    console.log(`     ${index + 1}. [${log.biz_type}] ${log.operation_type} - ${log.data_info} (${log.operation_user})`);
                });
            }
        } catch (error) {
            console.log('   ❌ 查询日志失败:', error.message);
        }

    } catch (error) {
        console.error('❌ 数据库测试失败:', error.message);
        console.error('错误详情:', error);
    }
}

// 运行测试
if (require.main === module) {
    testDatabase()
        .then(() => {
            console.log('\n✅ 数据库测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 数据库测试异常:', error);
            process.exit(1);
        });
}

module.exports = { testDatabase };
