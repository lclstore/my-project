# 操作日志统一调用方案

## 概述

为了解决在每个接口后调用日志不好维护的问题，我们提供了三种统一的操作日志记录方案：

1. **中间件方式** - 自动记录HTTP请求日志
2. **增强的BusinessHelper** - 在数据库操作层自动记录
3. **原有的异步记录方式** - 保持向后兼容

## 方案一：中间件方式（推荐）

### 1. 在app.js中启用中间件

```javascript
const { createOpLogMiddleware } = require('./utils/opLogHelper');

// 启用操作日志中间件
app.use(createOpLogMiddleware({
    excludePaths: ['/health', '/ping', '/favicon.ico', '/api/opLogs'],
    includeMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
}));
```

### 2. 自动记录规则

中间件会根据请求路径自动推断业务类型和操作类型：

- `/api/sound/save` → `biz_sound` + `SAVE`
- `/api/user/123` (PUT) → `biz_user` + `UPDATE` + dataId=123
- `/api/program/add` → `biz_program` + `ADD`
- `/api/exercise/delete/456` → `biz_exercise` + `DELETE` + dataId=456

### 3. 优点

- **完全透明**：业务代码无需修改
- **统一管理**：所有日志记录逻辑集中在一处
- **自动推断**：根据URL模式自动识别业务类型
- **异步处理**：不影响接口响应速度

## 方案二：增强的BusinessHelper

### 1. 替换现有的BusinessHelper调用

```javascript
// 原来的方式
const result = await BusinessHelper.insertWithValidation('sound', data);

// 新的方式（自动记录日志）
const { OpLogEnhancedBusinessHelper } = require('../utils/opLogHelper');
const result = await OpLogEnhancedBusinessHelper.insertWithOpLog('sound', data, req);
```

### 2. 支持的方法

```javascript
// 新增（自动记录ADD日志）
await OpLogEnhancedBusinessHelper.insertWithOpLog(tableName, data, req, customValidations, interfaceConfig);

// 更新（自动记录UPDATE日志，包含更新前后数据）
await OpLogEnhancedBusinessHelper.updateWithOpLog(tableName, id, data, req, customValidations, interfaceConfig);

// 删除（自动记录DELETE日志，包含删除前数据）
await OpLogEnhancedBusinessHelper.deleteWithOpLog(tableName, id, req);
```

### 3. 优点

- **精确记录**：能准确捕获数据变更
- **包含前后数据**：自动获取操作前后的数据
- **向后兼容**：API与原BusinessHelper保持一致

## 方案三：保持现有方式（向后兼容）

现有的异步记录方式继续可用：

```javascript
const { AsyncOpLogRecorder } = require('../utils/opLogHelper');

// 在sendSuccess后异步记录
sendSuccess(res, result.data, '操作成功');
AsyncOpLogRecorder.recordAdd(req, 'sound', id, data, data);
```

## 推荐的迁移策略

### 阶段1：启用中间件（立即生效）

在`app.js`中添加中间件，立即获得基础的HTTP请求日志记录。

### 阶段2：逐步替换关键接口

对于重要的业务接口，逐步替换为`OpLogEnhancedBusinessHelper`：

```javascript
// 优先级：新增 > 更新 > 删除 > 其他操作
// 1. 先替换新增接口
// 2. 再替换更新接口  
// 3. 最后替换删除接口
```

### 阶段3：清理旧代码

当所有接口都使用统一方案后，可以移除手动的日志记录代码。

## 配置选项

### 中间件配置

```javascript
createOpLogMiddleware({
    // 排除的路径（不记录日志）
    excludePaths: ['/health', '/ping', '/favicon.ico', '/api/opLogs'],
    
    // 包含的HTTP方法
    includeMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
})
```

### 路径模式配置

可以在`parseRequestPath`函数中添加新的路径模式：

```javascript
const patterns = [
    { pattern: /^\/api\/(\w+)\/save$/, bizType: '$1', operation: 'SAVE' },
    { pattern: /^\/api\/(\w+)\/(\d+)$/, bizType: '$1', operation: method === 'PUT' ? 'UPDATE' : 'DELETE', dataId: '$2' },
    // 添加新的模式...
];
```

## 注意事项

1. **性能影响**：所有日志记录都是异步的，不会影响接口响应速度
2. **错误处理**：日志记录失败不会影响主业务流程
3. **数据隐私**：敏感数据会在记录前进行脱敏处理
4. **存储空间**：建议定期清理旧的操作日志

## 监控和调试

### 查看日志记录状态

```javascript
// 在控制台查看日志记录情况
console.log('📝 操作日志记录成功: sound[123] ADD by user@example.com');
```

### 调试模式

```javascript
// 开启调试模式查看详细信息
process.env.OPLOG_DEBUG = 'true';
```

这样的统一方案让操作日志的维护变得简单，同时提供了灵活的配置选项来适应不同的业务需求。
