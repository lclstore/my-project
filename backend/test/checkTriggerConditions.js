/**
 * 检查中间件触发条件
 */

const { isQueryOperation } = require('../utils/opLogHelper');

function checkTriggerConditions(method, path) {
    console.log(`\n🔍 检查请求: ${method} ${path}`);
    
    // 1. 检查HTTP方法
    const includeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const methodMatch = includeMethods.includes(method);
    console.log(`   1. HTTP方法匹配: ${methodMatch ? '✅' : '❌'} (${method})`);
    
    // 2. 检查排除路径
    const excludePaths = [
        '/health', '/ping', '/favicon.ico', '/api/opLogs',
        '/api/user/login', '/api/user/logout', '/api/user/checkToken',
        '/api/enum', '/api/data', '/api/swagger',
        '/page', '/detail', '/list'
    ];
    
    const pathExcluded = excludePaths.some(excludePath => path.includes(excludePath));
    console.log(`   2. 路径不在排除列表: ${!pathExcluded ? '✅' : '❌'}`);
    if (pathExcluded) {
        const matchedExclude = excludePaths.find(excludePath => path.includes(excludePath));
        console.log(`      匹配的排除路径: ${matchedExclude}`);
    }
    
    // 3. 检查是否为查询操作
    const isQuery = isQueryOperation(path, method);
    console.log(`   3. 不是查询操作: ${!isQuery ? '✅' : '❌'}`);
    
    // 最终结果
    const shouldLog = methodMatch && !pathExcluded && !isQuery;
    console.log(`   📝 最终结果: ${shouldLog ? '✅ 会记录日志' : '❌ 不会记录日志'}`);
    
    return shouldLog;
}

// 测试常见的sound操作
console.log('🎯 测试sound模块操作:');

const testCases = [
    ['POST', '/api/sound/save'],
    ['PUT', '/api/sound/123'],
    ['DELETE', '/api/sound/123'],
    ['POST', '/api/sound/del'],
    ['POST', '/api/sound/enable'],
    ['POST', '/api/sound/disable'],
    ['GET', '/api/sound/page'],
    ['GET', '/api/sound/detail/123'],
    ['GET', '/api/sound/123'],
];

testCases.forEach(([method, path]) => {
    checkTriggerConditions(method, path);
});

console.log('\n💡 如果你的请求显示"❌ 不会记录日志"，那就是为什么没有日志的原因！');
console.log('\n🔧 请告诉我你具体的请求方法和路径，我来帮你分析。');

// 交互式检查
if (process.argv.length > 3) {
    const method = process.argv[2];
    const path = process.argv[3];
    console.log('\n🎯 检查你的请求:');
    checkTriggerConditions(method, path);
}
