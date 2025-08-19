# 操作日志集成使用指南

## 概述

本指南介绍如何在各个业务模块中集成操作日志记录功能，实现完整的操作审计和追踪。

## 核心组件

### 1. OpLogHelper - 日志记录工具

位置：`backend/utils/opLogHelper.js`

#### 主要功能
- **recordOpLog**: 通用日志记录方法
- **OpLogRecorder**: 便捷的操作记录器
- **getOperationUser**: 从请求中获取操作用户
- **generateDataInfo**: 生成数据描述信息

#### 支持的操作类型
```javascript
const OPERATION_TYPES = {
    ADD: 'ADD',                                    // 新增
    UPDATE: 'UPDATE',                              // 更新
    DELETE: 'DELETE',                              // 删除
    ENABLE: 'ENABLE',                              // 启用
    DISABLE: 'DISABLE',                            // 禁用
    TEMPLATE_GENERATE_WORKOUT: 'TEMPLATE_GENERATE_WORKOUT',           // 模板生成锻炼
    TEMPLATE_GENERATE_WORKOUT_FILE: 'TEMPLATE_GENERATE_WORKOUT_FILE', // 模板生成锻炼文件
    SAVE: 'SAVE',                                  // 保存
    WORKOUT_GENERATE_FILE: 'WORKOUT_GENERATE_FILE' // 锻炼生成文件
};
```

### 2. OpLogMiddleware - 自动日志中间件

位置：`backend/middleware/opLogMiddleware.js`

#### 功能特点
- 自动拦截API响应
- 根据路由自动判断操作类型
- 支持批量操作记录
- 异步记录，不影响业务性能

## 集成方式

### 方式一：手动集成（推荐）

在业务接口中手动调用日志记录方法，提供最大的灵活性和控制力。

#### 1. 引入依赖
```javascript
const { OpLogRecorder, getOperationUser, generateDataInfo } = require('../utils/opLogHelper');
```

#### 2. 在接口中添加日志记录

##### 新增操作
```javascript
// 创建成功后记录日志
const operationUser = getOperationUser(req);
const dataInfo = generateDataInfo({ name, displayName });

await OpLogRecorder.recordAdd(
    'music',                    // 业务类型
    result.musicId,             // 数据ID
    dataInfo,                   // 数据描述
    { name, displayName, audioUrl, audioDuration, status }, // 操作后数据
    operationUser               // 操作用户
);
```

##### 更新操作
```javascript
await OpLogRecorder.recordUpdate(
    'music',
    result.musicId,
    dataInfo,
    null,                       // 操作前数据（可选）
    { name, displayName, audioUrl, audioDuration, status },
    operationUser
);
```

##### 批量操作
```javascript
await OpLogRecorder.recordEnable(
    'music',
    idList[0],                  // 使用第一个ID作为代表
    `批量启用music，共${idList.length}条`,
    { operation: 'batch_enable', idList, count: idList.length },
    operationUser
);
```

### 方式二：中间件集成

使用中间件自动记录操作日志，适合快速集成。

#### 1. 引入中间件
```javascript
const { OpLogMiddlewares } = require('../middleware/opLogMiddleware');
```

#### 2. 应用中间件
```javascript
// 为整个路由应用中间件
router.use(OpLogMiddlewares.music());

// 或为特定路由应用中间件
router.post('/save', OpLogMiddlewares.music(), async (req, res) => {
    // 业务逻辑
});
```

## 用户识别

系统支持多种方式识别操作用户：

### 1. JWT Token（推荐）
```javascript
// 从JWT token中获取用户信息
if (req.user && req.user.username) {
    return req.user.username;
}
```

### 2. 请求头
```javascript
// 客户端在请求头中传递用户ID
headers: {
    'x-user-id': '用户名或ID'
}
```

### 3. 请求体
```javascript
// 在请求体中包含操作用户信息
{
    "name": "音乐名称",
    "operationUser": "管理员"
}
```

### 4. IP地址（默认）
```javascript
// 如果无法获取用户信息，使用IP地址
return `IP:${ip || 'unknown'}`;
```

## 已集成的模块

### 1. Music模块
- ✅ 保存操作（新增/更新）
- ✅ 批量启用
- ✅ 批量禁用
- ✅ 批量删除

### 2. Playlist模块
- ✅ 保存操作（新增/更新）
- ✅ 批量启用
- ✅ 批量禁用
- ✅ 批量删除

### 3. Sound模块
- ✅ 保存操作（新增/更新）
- ✅ 批量启用
- ✅ 批量禁用
- ✅ 批量删除

## 为新模块添加日志记录

### 1. 引入依赖
```javascript
const { OpLogRecorder, getOperationUser, generateDataInfo } = require('../utils/opLogHelper');
```

### 2. 在关键操作中添加日志记录
```javascript
router.post('/save', async (req, res) => {
    try {
        // 业务逻辑
        const result = await saveData(req.body);
        
        // 记录操作日志
        const operationUser = getOperationUser(req);
        const dataInfo = generateDataInfo(req.body);
        
        await OpLogRecorder.recordSave(
            'your_module',          // 业务类型
            result.id,              // 数据ID
            dataInfo,               // 数据描述
            null,                   // 操作前数据
            req.body,               // 操作后数据
            operationUser           // 操作用户
        );
        
        sendSuccess(res, result, '操作成功');
    } catch (error) {
        sendError(res, 'OPERATION_FAILED', error.message, 500);
    }
});
```

## 日志查询

### 1. 分页查询
```javascript
GET /api/opLogs/page?pageIndex=1&pageSize=20
```

### 2. 按业务类型搜索
```javascript
GET /api/opLogs/page?keywords=music
```

### 3. 按操作类型筛选
```javascript
GET /api/opLogs/page?operationTypeList=ADD,UPDATE,DELETE
```

### 4. 按操作用户搜索
```javascript
GET /api/opLogs/page?keywords=管理员
```

### 5. 按时间排序
```javascript
GET /api/opLogs/page?orderBy=operationTime&orderDirection=desc
```

## 测试

### 1. 运行集成测试
```bash
node test/opLogIntegrationTest.js
```

### 2. 运行API测试
```bash
node test/opLogsApiTest.js
```

## 最佳实践

### 1. 日志记录原则
- **异步记录**: 日志记录不应阻塞主业务流程
- **错误处理**: 日志记录失败不应影响业务操作
- **信息完整**: 记录足够的信息用于审计和排查

### 2. 数据描述规范
- 优先使用有意义的名称字段
- 对于批量操作，记录操作数量
- 包含关键的业务信息

### 3. 用户识别规范
- 优先使用认证用户信息
- 提供多种用户识别方式
- 确保用户信息的准确性

### 4. 性能考虑
- 使用异步记录避免阻塞
- 批量操作使用代表性ID
- 避免记录过大的数据对象

## 故障排查

### 1. 日志记录失败
- 检查数据库连接
- 验证必填字段
- 查看控制台错误信息

### 2. 用户信息缺失
- 检查请求头设置
- 验证JWT token
- 确认用户认证流程

### 3. 操作类型不匹配
- 检查路由配置
- 验证操作类型枚举
- 确认中间件配置

通过以上指南，您可以在任何业务模块中快速集成操作日志功能，实现完整的操作审计和追踪！
