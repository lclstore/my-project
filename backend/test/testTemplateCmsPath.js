/**
 * 测试 templateCms 路径的操作日志
 */

const { parseRequestPath, isQueryOperation } = require('../utils/opLogHelper');

function testTemplateCmsPath() {
    console.log('🔍 测试 templateCms 路径解析...\n');

    const testCases = [
        { method: 'POST', path: '/templateCms/web/sound/save' },
        { method: 'POST', path: '/templateCms/web/sound/del' },
        { method: 'POST', path: '/templateCms/web/sound/enable' },
        { method: 'POST', path: '/templateCms/web/sound/disable' },
        { method: 'PUT', path: '/templateCms/web/sound/123' },
        { method: 'DELETE', path: '/templateCms/web/sound/123' },
        { method: 'GET', path: '/templateCms/web/sound/page' },
    ];

    testCases.forEach(({ method, path }) => {
        console.log(`🎯 测试: ${method} ${path}`);
        
        // 1. 检查HTTP方法
        const includeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
        const methodMatch = includeMethods.includes(method);
        console.log(`   1. HTTP方法匹配: ${methodMatch ? '✅' : '❌'} (${method})`);
        
        // 2. 检查排除路径
        const excludePaths = [
            '/health', '/ping', '/favicon.ico',
            '/templateCms/web/opLogs',
            '/templateCms/web/user/login',
            '/templateCms/web/user/logout',
            '/templateCms/web/user/checkToken',
            '/templateCms/web/enum',
            '/templateCms/web/data',
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
        
        // 4. 检查路径解析
        const pathInfo = parseRequestPath(path, method);
        console.log(`   4. 路径解析: ${pathInfo ? '✅' : '❌'}`);
        if (pathInfo) {
            console.log(`      业务类型: ${pathInfo.bizType}`);
            console.log(`      操作类型: ${pathInfo.operationType}`);
            console.log(`      数据ID: ${pathInfo.dataId || 'N/A'}`);
        }
        
        // 最终结果
        const shouldLog = methodMatch && !pathExcluded && !isQuery && pathInfo;
        console.log(`   📝 最终结果: ${shouldLog ? '✅ 会记录日志' : '❌ 不会记录日志'}`);
        console.log('');
    });
}

// 模拟完整的中间件流程
function simulateMiddlewareFlow() {
    console.log('🎭 模拟完整的中间件流程...\n');
    
    const req = {
        method: 'POST',
        path: '/templateCms/web/sound/save',
        body: { name: '测试音频', url: 'test.mp3' },
        headers: { 'x-user-id': 'test-user' }
    };
    
    const res = {
        statusCode: 200
    };
    
    console.log(`📥 模拟请求: ${req.method} ${req.path}`);
    console.log(`📋 请求体:`, req.body);
    
    // 检查中间件触发条件
    const includeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const excludePaths = [
        '/health', '/ping', '/favicon.ico',
        '/templateCms/web/opLogs',
        '/templateCms/web/user/login',
        '/templateCms/web/user/logout',
        '/templateCms/web/user/checkToken',
        '/templateCms/web/enum',
        '/templateCms/web/data',
        '/page', '/detail', '/list'
    ];
    
    const shouldLog = includeMethods.includes(req.method) &&
        !excludePaths.some(path => req.path.includes(path)) &&
        !isQueryOperation(req.path, req.method);
    
    console.log(`🔍 中间件判断: ${shouldLog ? '应该记录日志' : '不应该记录日志'}`);
    
    if (shouldLog) {
        // 模拟路径解析
        const pathInfo = parseRequestPath(req.path, req.method);
        if (pathInfo) {
            console.log(`📝 将记录日志:`);
            console.log(`   业务类型: biz_${pathInfo.bizType}`);
            console.log(`   操作类型: ${pathInfo.operationType}`);
            console.log(`   数据ID: ${pathInfo.dataId || 0}`);
            console.log(`   操作人: test-user`);
            console.log(`   数据信息: ${req.body.name}`);
        } else {
            console.log(`❌ 路径解析失败，无法记录日志`);
        }
    }
}

// 检查服务器路由配置
function checkServerRoutes() {
    console.log('🔧 检查服务器路由配置...\n');
    
    console.log('预期的中间件配置:');
    console.log('1. app.use("/api", createOpLogMiddleware(...))');
    console.log('2. app.use("/templateCms", createOpLogMiddleware(...))');
    console.log('');
    
    console.log('预期的路由配置:');
    console.log('app.use("/api/sound", soundRoutes)');
    console.log('app.use("/templateCms/web/sound", soundRoutes) // 可能缺少这个');
    console.log('');
    
    console.log('💡 如果日志还是没有记录，请检查:');
    console.log('1. 服务器是否重启');
    console.log('2. 是否有 /templateCms/web/sound 的路由配置');
    console.log('3. 请求是否真的到达了服务器');
    console.log('4. 服务器控制台是否有任何错误信息');
}

if (require.main === module) {
    testTemplateCmsPath();
    simulateMiddlewareFlow();
    checkServerRoutes();
}

module.exports = { testTemplateCmsPath };
