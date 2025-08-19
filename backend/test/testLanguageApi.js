/**
 * 简单测试Language API
 */

const { DatabaseHelper } = require('../config/database');

async function testLanguageQuery() {
    try {
        console.log('🔍 测试BusinessHelper.select方法...');

        const options = {
            fields: 'code',
            orderBy: 'create_time ASC'
        };

        const result = await DatabaseHelper.select('language', options);

        console.log('查询结果:', result);

        if (result.success && result.data) {
            console.log('✅ 查询成功');
            console.log(`   数据条数: ${result.data.length}`);

            // 提取code字段
            const languageCodes = result.data.map(item => item.code);
            console.log('   语言编码数组:', languageCodes);

            return languageCodes;
        } else {
            console.log('❌ 查询失败:', result.message);
            return null;
        }

    } catch (error) {
        console.error('❌ 测试失败:', error);
        return null;
    }
}

// 运行测试
if (require.main === module) {
    testLanguageQuery()
        .then((result) => {
            if (result) {
                console.log('\n🎉 测试完成，期望的返回格式:', result);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 测试出错:', error);
            process.exit(1);
        });
}

module.exports = { testLanguageQuery };
