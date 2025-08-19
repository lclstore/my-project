/**
 * 测试 sound 插入操作，检查返回值结构
 */

const { BusinessHelper } = require('../config/database');

async function testSoundInsert() {
    try {
        console.log('🔍 测试 sound 插入操作...\n');

        const testData = {
            name: '测试音频',
            genderCode: 'FEMALE',
            usageCode: 'GENERAL',
            translation: 1,
            status: 'ENABLED'
        };

        console.log('插入数据:', testData);

        const result = await BusinessHelper.insertWithValidation('sound', testData);
        
        console.log('插入结果完整结构:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✅ 插入成功');
            console.log('insertId:', result.insertId);
            console.log('insertId 类型:', typeof result.insertId);
            
            // 如果有有效的ID，清理测试数据
            if (result.insertId) {
                const { query } = require('../config/database');
                await query('DELETE FROM sound WHERE id = ?', [result.insertId]);
                console.log('✅ 清理测试数据完成');
            }
        } else {
            console.log('❌ 插入失败:', result.message);
        }

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundInsert()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundInsert };
