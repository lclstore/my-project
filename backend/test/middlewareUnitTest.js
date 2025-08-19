/**
 * 中间件单元测试
 */

const { createOpLogMiddleware } = require('../utils/opLogHelper');

// 模拟Express的req, res, next
function createMockRequest(method, path, body = {}) {
    return {
        method,
        path,
        body,
        headers: {
            'x-user-id': 'test-user'
        }
    };
}

function createMockResponse() {
    const res = {
        statusCode: 200,
        json: function(data) {
            console.log('📤 原始res.json被调用:', JSON.stringify(data, null, 2));
            return this;
        },
        send: function(data) {
            console.log('📤 原始res.send被调用:', data);
            return this;
        }
    };
    return res;
}

function createMockNext() {
    return function() {
        console.log('➡️  next()被调用');
    };
}

async function testMiddleware() {
    console.log('🧪 测试操作日志中间件...\n');

    // 创建中间件实例
    const middleware = createOpLogMiddleware({
        excludePaths: ['/api/opLogs', '/api/user/login'],
        includeMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
    });

    // 测试用例
    const testCases = [
        {
            name: '应该记录 - POST /api/sound/save',
            req: createMockRequest('POST', '/api/sound/save', { name: '测试音频' }),
            shouldLog: true
        },
        {
            name: '应该跳过 - GET /api/sound/page',
            req: createMockRequest('GET', '/api/sound/page'),
            shouldLog: false
        },
        {
            name: '应该跳过 - POST /api/opLogs/page',
            req: createMockRequest('POST', '/api/opLogs/page'),
            shouldLog: false
        },
        {
            name: '应该记录 - POST /api/exercise/del',
            req: createMockRequest('POST', '/api/exercise/del', { idList: [1, 2, 3] }),
            shouldLog: true
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n🎯 测试: ${testCase.name}`);
        
        const req = testCase.req;
        const res = createMockResponse();
        const next = createMockNext();

        // 调用中间件
        await middleware(req, res, next);

        // 如果应该记录日志，模拟响应
        if (testCase.shouldLog) {
            console.log('   模拟响应调用...');
            res.json({ success: true, data: { id: 123 } });
        }

        console.log('   ✅ 测试完成');
    }

    console.log('\n🎉 中间件单元测试完成！');
    console.log('\n💡 如果看到以下消息，说明中间件正常工作:');
    console.log('   - 🔍 [OpLog中间件] 应该记录: 是/否');
    console.log('   - 📝 [OpLog中间件] 拦截到响应');
    console.log('   - 📝 操作日志记录成功');
}

// 测试路径解析
function testPathParsing() {
    console.log('\n🔍 测试路径解析...');
    
    const { parseRequestPath } = require('../utils/opLogHelper');
    
    const testPaths = [
        { path: '/api/sound/save', method: 'POST' },
        { path: '/api/sound/123', method: 'PUT' },
        { path: '/api/exercise/del', method: 'POST' },
    ];

    testPaths.forEach(({ path, method }) => {
        const result = parseRequestPath(path, method);
        console.log(`   ${method} ${path} -> ${result ? `${result.bizType}:${result.operationType}` : '无匹配'}`);
    });
}

// 运行测试
if (require.main === module) {
    testPathParsing();
    testMiddleware()
        .then(() => {
            console.log('\n✅ 所有测试完成');
        })
        .catch((error) => {
            console.error('\n❌ 测试失败:', error);
        });
}

module.exports = { testMiddleware };
