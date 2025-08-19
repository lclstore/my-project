# 完整的操作日志设置指南

## 1. 在app.js中启用中间件

```javascript
const express = require('express');
const { createOpLogMiddleware } = require('./utils/opLogHelper');

const app = express();

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 启用操作日志中间件（必须在路由之前）
app.use('/api', createOpLogMiddleware({
    // 排除不需要记录日志的路径
    excludePaths: [
        '/health', 
        '/ping', 
        '/favicon.ico',
        '/api/opLogs',           // 避免查询日志时产生新日志
        '/api/user/login',       // 登录接口
        '/api/user/logout',      // 登出接口
        '/api/user/checkToken',  // 令牌检查
        '/api/enum',             // 枚举查询
        '/api/data',             // 数据查询
        '/api/swagger'           // API文档
    ],
    
    // 只记录这些HTTP方法的请求
    includeMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
}));

// 路由设置
app.use('/api/sound', require('./routes/sound'));
app.use('/api/music', require('./routes/music'));
app.use('/api/playlist', require('./routes/playlist'));
app.use('/api/exercise', require('./routes/exercise'));
app.use('/api/category', require('./routes/category'));
app.use('/api/template', require('./routes/template'));
app.use('/api/program', require('./routes/program'));
app.use('/api/workout', require('./routes/workout'));
app.use('/api/user', require('./routes/user'));
app.use('/api/files', require('./routes/files'));
app.use('/api/publish', require('./routes/publish'));
app.use('/api/resource', require('./routes/resource'));
app.use('/api/home', require('./routes/home'));
app.use('/api/planNameSettings', require('./routes/planNameSettings'));
app.use('/api/planReplaceSettings', require('./routes/planReplaceSettings'));
app.use('/api/workoutSettings', require('./routes/workoutSettings'));
app.use('/api/opLogs', require('./routes/opLogs'));

module.exports = app;
```

## 2. 支持的操作类型和路径模式

### 基础CRUD操作
| 路径模式 | 操作类型 | 示例 |
|---------|---------|------|
| `POST /api/{module}/save` | SAVE | `/api/sound/save` |
| `POST /api/{module}/add` | ADD | `/api/user/add` |
| `PUT /api/{module}/{id}` | UPDATE | `/api/music/123` |
| `DELETE /api/{module}/{id}` | DELETE | `/api/playlist/456` |

### 批量操作
| 路径模式 | 操作类型 | 示例 |
|---------|---------|------|
| `POST /api/{module}/del` | DELETE | `/api/exercise/del` |
| `POST /api/{module}/enable` | ENABLE | `/api/category/enable` |
| `POST /api/{module}/disable` | DISABLE | `/api/template/disable` |
| `POST /api/{module}/sort` | UPDATE | `/api/program/sort` |

### 特殊业务操作
| 路径模式 | 操作类型 | 业务类型 |
|---------|---------|---------|
| `POST /api/template/generate-workout` | TEMPLATE_GENERATE_WORKOUT | template |
| `POST /api/template/generate-workout-file` | TEMPLATE_GENERATE_WORKOUT_FILE | template |
| `POST /api/workout/generate-file` | WORKOUT_GENERATE_FILE | workout |
| `POST /api/user/register` | ADD | user |
| `POST /api/user/addUser` | ADD | user |
| `POST /api/user/updateUser` | UPDATE | user |
| `POST /api/user/resetPassword` | UPDATE | user |
| `POST /api/files/upload` | ADD | files |
| `DELETE /api/files/delete/{id}` | DELETE | files |

### 设置相关操作
| 路径模式 | 操作类型 | 业务类型 |
|---------|---------|---------|
| `POST /api/planNameSettings/save` | SAVE | planNameSettings |
| `POST /api/planReplaceSettings/save` | SAVE | planReplaceSettings |
| `POST /api/workoutSettings/save` | SAVE | workoutSettings |
| `POST /api/home/save` | SAVE | appInfo |
| `POST /api/home/addHelps` | ADD | appHelp |

## 3. 自动排除的查询操作

中间件会自动排除以下查询操作，不记录日志：
- `/page` - 分页查询
- `/detail/{id}` - 详情查询  
- `/list` - 列表查询
- `/{id}` (GET请求) - ID查询
- `/search` - 搜索
- `/export` - 导出
- `/check*` - 检查类接口
- `/validate*` - 验证类接口

## 4. 业务类型映射

所有业务类型会自动添加`biz_`前缀：
- `sound` → `biz_sound`
- `music` → `biz_music`
- `playlist` → `biz_playlist`
- `exercise` → `biz_exercise`
- `category` → `biz_category`
- `template` → `biz_template`
- `program` → `biz_program`
- `workout` → `biz_workout`
- `user` → `biz_user`
- `files` → `biz_files`
- 等等...

## 5. 验证日志记录

### 启动服务器后测试
```bash
# 测试新增操作
curl -X POST http://localhost:3000/api/sound/save \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"name":"测试音频","url":"http://example.com/test.mp3"}'

# 测试批量删除
curl -X POST http://localhost:3000/api/exercise/del \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"idList":[1,2,3]}'

# 测试启用操作
curl -X POST http://localhost:3000/api/category/enable \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"idList":[1,2,3]}'
```

### 查看控制台输出
```
📝 操作日志记录成功: biz_sound[123] SAVE by test-user
📝 操作日志记录成功: biz_exercise[0] DELETE by test-user
📝 操作日志记录成功: biz_category[0] ENABLE by test-user
```

### 查询操作日志
```bash
curl http://localhost:3000/api/opLogs/page?pageSize=10
```

## 6. 性能说明

- ✅ **异步记录**：所有日志记录都是异步的，不影响接口响应速度
- ✅ **智能过滤**：自动排除查询操作，只记录数据变更操作
- ✅ **错误隔离**：日志记录失败不会影响主业务流程
- ✅ **内存友好**：使用`setImmediate`避免阻塞事件循环

## 7. 注意事项

1. **中间件顺序**：操作日志中间件必须在路由之前注册
2. **路径匹配**：如果新增了特殊的路径模式，需要在`parseRequestPath`函数中添加
3. **用户识别**：确保请求中包含用户信息（JWT token、x-user-id头等）
4. **数据库字段**：确保`op_logs`表的`biz_type`字段与路径解析结果匹配

这样设置后，所有模块的数据变更操作都会自动记录到操作日志中，无需在每个接口中手动添加日志代码。
