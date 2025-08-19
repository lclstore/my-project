# 中间件设置示例

## 在app.js中启用操作日志中间件

```javascript
const express = require('express');
const { createOpLogMiddleware } = require('./utils/opLogHelper');

const app = express();

// 其他中间件...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 启用操作日志中间件（在路由之前）
app.use('/api', createOpLogMiddleware({
    // 排除不需要记录日志的路径
    excludePaths: [
        '/health', 
        '/ping', 
        '/favicon.ico', 
        '/api/opLogs',  // 避免查询日志时产生新日志
        '/api/user/login',  // 登录接口可能不需要记录
        '/api/user/logout'
    ],
    
    // 只记录这些HTTP方法的请求
    includeMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
}));

// 路由设置
app.use('/api/sound', require('./routes/sound'));
app.use('/api/music', require('./routes/music'));
app.use('/api/playlist', require('./routes/playlist'));
// ... 其他路由

module.exports = app;
```

## 路径匹配规则

中间件会自动根据请求路径推断业务类型和操作类型：

| 请求路径 | 推断结果 |
|---------|---------|
| `POST /api/sound/save` | `biz_sound` + `SAVE` |
| `PUT /api/music/123` | `biz_music` + `UPDATE` + dataId=123 |
| `DELETE /api/playlist/456` | `biz_playlist` + `DELETE` + dataId=456 |
| `POST /api/user/add` | `biz_user` + `ADD` |
| `POST /api/exercise/enable` | `biz_exercise` + `ENABLE` |
| `POST /api/program/disable` | `biz_program` + `DISABLE` |

## 验证中间件是否工作

1. **启动服务器**
2. **发送测试请求**：
   ```bash
   curl -X POST http://localhost:3000/api/sound/save \
     -H "Content-Type: application/json" \
     -H "x-user-id: test-user" \
     -d '{"name":"测试音频","url":"http://example.com/test.mp3"}'
   ```
3. **查看控制台输出**：
   ```
   📝 操作日志记录成功: biz_sound[123] SAVE by test-user
   ```
4. **查询操作日志**：
   ```bash
   curl http://localhost:3000/api/opLogs/page?pageSize=10
   ```

## 注意事项

1. **中间件顺序**：操作日志中间件必须在路由之前注册
2. **性能影响**：所有日志记录都是异步的，不会影响接口响应速度
3. **错误处理**：日志记录失败不会影响主业务流程
4. **路径匹配**：如果请求路径不匹配预定义模式，不会记录日志

## 自定义路径模式

如果需要支持新的路径模式，可以修改`parseRequestPath`函数：

```javascript
// 在 utils/opLogHelper.js 中
const patterns = [
    { pattern: /^\/api\/(\w+)\/save$/, bizType: '$1', operation: 'SAVE' },
    { pattern: /^\/api\/(\w+)\/(\d+)$/, bizType: '$1', operation: method === 'PUT' ? 'UPDATE' : 'DELETE', dataId: '$2' },
    // 添加新的模式
    { pattern: /^\/api\/(\w+)\/batch-update$/, bizType: '$1', operation: 'UPDATE' },
    { pattern: /^\/api\/(\w+)\/import$/, bizType: '$1', operation: 'ADD' },
];
```

这样设置后，所有符合模式的API请求都会自动记录操作日志，无需在每个接口中手动添加日志代码。
