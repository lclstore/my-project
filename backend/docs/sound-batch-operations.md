# Sound 模块批量操作接口

## 概述

根据需求，对 sound 模块进行了以下修改：
1. 删除接口改为使用 `idList` 数组参数
2. 新增启用接口 `sound/enable`，使用 `idList` 数组参数
3. 新增禁用接口 `sound/disable`，使用 `idList` 数组参数
4. 通过ID查询接口改为 `sound/detail/:id`
5. 更新了相应的 Swagger 文档

## 接口变更

### 1. 批量删除接口

**接口地址**: `POST /api/sound/del`

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "deletedCount": 3,
    "failedIds": []
  },
  "message": "成功删除 3 个音频资源"
}
```

### 2. 批量启用接口

**接口地址**: `POST /api/sound/enable`

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "updatedCount": 3,
    "failedIds": []
  },
  "message": "成功启用 3 个音频资源"
}
```

### 3. 批量禁用接口

**接口地址**: `POST /api/sound/disable`

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "updatedCount": 3,
    "failedIds": []
  },
  "message": "成功禁用 3 个音频资源"
}
```

### 4. 通过ID查询接口

**接口地址**: `GET /api/sound/detail/:id`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "欢迎语音",
    "genderCode": "FEMALE",
    "usageCode": "GENERAL",
    "status": "ENABLED",
    "createTime": "2025-08-14 10:30:45"
  },
  "message": "获取音频资源成功"
}
```

## 技术特性

### 1. 批量操作逻辑

所有批量操作接口都采用相同的处理逻辑：

```javascript
// 1. 参数验证
if (!idList || !Array.isArray(idList) || idList.length === 0) {
    return sendError(res, ERROR_CODES.INVALID_PARAMETERS, 'idList参数无效，必须是非空数组', 400);
}

// 2. ID有效性验证
const validIds = [];
const invalidIds = [];
idList.forEach(id => {
    if (id && !isNaN(parseInt(id))) {
        validIds.push(parseInt(id));
    } else {
        invalidIds.push(id);
    }
});

// 3. 检查记录存在性
const existingRecords = await query(`SELECT id FROM sound WHERE id IN (${placeholders})`, validIds);
const existingIds = existingRecords.map(record => record.id);
const notFoundIds = validIds.filter(id => !existingIds.includes(id));

// 4. 执行批量操作
const result = await query(`操作SQL WHERE id IN (${existingIds.map(() => '?').join(',')})`, existingIds);

// 5. 返回详细结果
return {
    updatedCount: result.affectedRows,
    failedIds: notFoundIds
};
```

### 2. 错误处理

- **参数验证**: 检查 `idList` 是否为非空数组
- **ID验证**: 过滤无效的ID值
- **存在性检查**: 区分存在和不存在的记录
- **部分成功**: 即使部分ID不存在，也会处理存在的记录

### 3. 响应格式

统一的响应格式包含：
- `updatedCount/deletedCount`: 实际操作的记录数
- `failedIds`: 操作失败的ID列表（通常是不存在的ID）
- 详细的成功/失败信息

## 路由顺序

修改后的路由定义顺序：

```javascript
router.post('/save', ...)        // 1. 保存（新增/修改）
router.post('/del', ...)         // 2. 批量删除
router.post('/enable', ...)      // 3. 批量启用
router.post('/disable', ...)     // 4. 批量禁用
router.get('/page', ...)         // 5. 分页查询
router.get('/detail/:id', ...)   // 6. 通过ID查询详情
```

**重要**: 具体路径必须在参数路径之前定义，避免路由匹配冲突。

## 测试验证

### 测试结果

```bash
node backend/test/soundBatchOperationsTest.js
```

测试覆盖：
- ✅ 批量删除接口（idList参数）
- ✅ 批量启用接口（idList参数）  
- ✅ 批量禁用接口（idList参数）
- ✅ 参数验证（空数组、无效ID、不存在ID）
- ✅ 状态更新验证
- ✅ 数据清理验证

### 使用示例

```bash
# 批量删除
curl -X POST http://localhost:8080/templateCms/web/sound/del \
  -H "Content-Type: application/json" \
  -d '{"idList": [1, 2, 3]}'

# 批量启用
curl -X POST http://localhost:8080/templateCms/web/sound/enable \
  -H "Content-Type: application/json" \
  -d '{"idList": [1, 2, 3]}'

# 批量禁用
curl -X POST http://localhost:8080/templateCms/web/sound/disable \
  -H "Content-Type: application/json" \
  -d '{"idList": [1, 2, 3]}'

# 通过ID查询详情
curl http://localhost:8080/templateCms/web/sound/detail/1
```

## 修复的问题

### 1. BusinessHelper.insertWithValidation 返回值

修复了 `BusinessHelper.insertWithValidation` 方法不返回 `insertId` 的问题：

```javascript
// 修复前
return {
  success: true,
  message: '添加成功'
};

// 修复后
return {
  success: true,
  insertId: result.insertId,
  message: '添加成功'
};
```

### 2. 路由匹配顺序

将通过ID查询的路由从 `/:id` 改为 `/detail/:id`，避免与 `/page` 等具体路径冲突。

## 文件变更

- `backend/routes/sound.js` - 添加批量操作接口，更新Swagger文档
- `backend/config/database.js` - 修复insertWithValidation返回值
- `backend/test/soundBatchOperationsTest.js` - 批量操作测试
- `backend/test/soundInsertTest.js` - 插入操作测试
- `backend/docs/sound-batch-operations.md` - 本文档

## 总结

成功实现了 sound 模块的批量操作功能：

1. **批量删除**: 支持一次删除多个音频资源
2. **批量启用**: 支持一次启用多个音频资源  
3. **批量禁用**: 支持一次禁用多个音频资源
4. **详细反馈**: 提供操作成功数量和失败ID列表
5. **完整验证**: 参数验证、ID验证、存在性检查
6. **统一格式**: 所有接口采用相同的请求/响应格式

所有接口都经过充分测试，功能正常，可以投入使用。
