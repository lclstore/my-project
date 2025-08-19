/**
 * 调试操作日志中间件
 */

const { parseRequestPath, isQueryOperation } = require('../utils/opLogHelper');

function debugMiddleware() {
    console.log('🔍 调试操作日志中间件...\n');

    // 测试路径解析
    const testPaths = [
        { path: '/api/sound/save', method: 'POST' },
        { path: '/api/sound/123', method: 'PUT' },
        { path: '/api/sound/123', method: 'DELETE' },
        { path: '/api/sound/del', method: 'POST' },
        { path: '/api/sound/enable', method: 'POST' },
        { path: '/api/sound/disable', method: 'POST' },
        { path: '/api/sound/page', method: 'GET' },
        { path: '/api/sound/detail/123', method: 'GET' },
        { path: '/api/exercise/save', method: 'POST' },
        { path: '/api/user/addUser', method: 'POST' },
        { path: '/api/template/generate-workout', method: 'POST' },
    ];

    console.log('📋 路径解析测试:');
    testPaths.forEach(({ path, method }) => {
        const result = parseRequestPath(path, method);
        const isQuery = isQueryOperation(path, method);

        console.log(`  ${method} ${path}`);
        if (result) {
            console.log(`    ✅ 解析成功: ${result.bizType} -> ${result.operationType} (dataId: ${result.dataId || 'N/A'})`);
        } else {
            console.log(`    ❌ 解析失败`);
        }
        console.log(`    🔍 是否查询操作: ${isQuery ? '是' : '否'}`);
        console.log('');
    });

    // 测试排除路径
    console.log('🚫 排除路径测试:');
    const excludePaths = [
        '/health',
        '/ping',
        '/favicon.ico',
        '/api/opLogs',
        '/api/user/login',
        '/api/user/logout',
        '/api/user/checkToken',
        '/api/enum',
        '/api/data',
        '/api/swagger'
    ];

    const testExcludePaths = [
        '/api/sound/save',
        '/api/opLogs/page',
        '/api/user/login',
        '/api/enum/list',
        '/health',
        '/api/sound/page'
    ];

    testExcludePaths.forEach(path => {
        const shouldExclude = excludePaths.some(excludePath => path.includes(excludePath));
        const isQuery = isQueryOperation(path, 'GET'); // 假设是GET请求
        const shouldLog = !shouldExclude && !isQuery;

        console.log(`  ${path}`);
        console.log(`    排除检查: ${shouldExclude ? '排除' : '不排除'}`);
        console.log(`    查询检查: ${isQuery ? '是查询' : '非查询'}`);
        console.log(`    最终结果: ${shouldLog ? '记录日志' : '不记录日志'}`);
        console.log('');
    });
}

// 模拟中间件处理流程
function simulateMiddleware(path, method, body = {}) {
    console.log(`🎯 模拟处理: ${method} ${path}`);

    // 1. 检查是否应该记录日志
    const excludePaths = [
        '/health', '/ping', '/favicon.ico', '/api/opLogs',
        '/api/user/login', '/api/user/logout', '/api/user/checkToken',
        '/api/enum', '/api/data', '/api/swagger'
    ];
    const includeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    const shouldLog = includeMethods.includes(method) &&
        !excludePaths.some(excludePath => path.includes(excludePath)) &&
        !isQueryOperation(path, method);

    console.log(`  应该记录日志: ${shouldLog ? '是' : '否'}`);

    if (!shouldLog) {
        console.log('  ⏭️  跳过日志记录\n');
        return;
    }

    // 2. 解析路径
    const pathInfo = parseRequestPath(path, method);
    if (!pathInfo) {
        console.log('  ❌ 路径解析失败\n');
        return;
    }

    console.log(`  📋 解析结果: ${pathInfo.bizType} -> ${pathInfo.operationType}`);

    // 3. 模拟日志记录
    const logData = {
        bizType: `biz_${pathInfo.bizType}`,
        dataId: pathInfo.dataId || body.id || 0,
        dataInfo: body.name || `${method} ${path}`,
        operationType: pathInfo.operationType,
        dataAfter: body,
        operationUser: 'test-user'
    };

    console.log('  📝 将记录日志:', JSON.stringify(logData, null, 4));
    console.log('');
}

// 运行调试
if (require.main === module) {
    debugMiddleware();

    console.log('\n🎭 模拟中间件处理:');
    simulateMiddleware('/api/sound/save', 'POST', { name: '测试音频', url: 'test.mp3' });
    simulateMiddleware('/api/sound/page', 'GET');
    simulateMiddleware('/api/opLogs/page', 'GET');
    simulateMiddleware('/api/exercise/del', 'POST', { idList: [1, 2, 3] });
    simulateMiddleware('/api/user/login', 'POST', { email: 'test@example.com' });
}

module.exports = { debugMiddleware, simulateMiddleware };
