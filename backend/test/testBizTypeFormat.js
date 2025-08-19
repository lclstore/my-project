/**
 * 测试业务类型格式转换
 */

const { parseRequestPath, camelToSnake } = require('../utils/opLogHelper');

function testBizTypeFormat() {
    console.log('🔍 测试业务类型格式转换...\n');

    // 测试驼峰转下划线函数
    console.log('1. 测试驼峰转下划线函数:');
    const testCases = [
        'sound',
        'workoutSettings',
        'planNameSettings',
        'planReplaceSettings',
        'appInfo',
        'appHelp',
        'userProfile',
        'exerciseCategory'
    ];

    testCases.forEach(input => {
        const output = camelToSnake(input);
        console.log(`   ${input} -> ${output}`);
    });

    // 测试路径解析
    console.log('\n2. 测试路径解析结果:');
    const pathTests = [
        { path: '/save', method: 'POST', originalUrl: '/templateCms/web/sound/save' },
        { path: '/save', method: 'POST', originalUrl: '/templateCms/web/workoutSettings/save' },
        { path: '/save', method: 'POST', originalUrl: '/templateCms/web/planNameSettings/save' },
        { path: '/save', method: 'POST', originalUrl: '/templateCms/web/planReplaceSettings/save' },
        { path: '/del', method: 'POST', originalUrl: '/templateCms/web/exercise/del' },
        { path: '/enable', method: 'POST', originalUrl: '/templateCms/web/category/enable' },
    ];

    pathTests.forEach(({ path, method, originalUrl }) => {
        const result = parseRequestPath(path, method, originalUrl);
        console.log(`   ${originalUrl}`);
        if (result) {
            console.log(`     ✅ bizType: ${result.bizType}, operation: ${result.operationType}`);
        } else {
            console.log(`     ❌ 解析失败`);
        }
        console.log('');
    });

    // 验证最终的biz_前缀格式
    console.log('3. 验证最终的数据库存储格式:');
    pathTests.forEach(({ path, method, originalUrl }) => {
        const result = parseRequestPath(path, method, originalUrl);
        if (result) {
            const finalBizType = `biz_${result.bizType}`;
            console.log(`   ${originalUrl} -> ${finalBizType}`);
        }
    });
}

// 运行测试
if (require.main === module) {
    testBizTypeFormat();
}

module.exports = { testBizTypeFormat };
