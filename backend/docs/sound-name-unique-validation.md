# Sound 模块名称唯一性验证

## 概述

Sound 模块的保存接口（`/save`）现在支持名称唯一性验证。在进行新增或修改操作之前，系统会先用 `name` 字段查询数据库，确保名称不重复。

## 功能特性

### 1. 新增操作验证

- 在新增音频资源时，系统会检查数据库中是否已存在相同名称的记录
- 如果存在同名记录，则拒绝新增操作并返回错误信息

### 2. 修改操作验证

- 在修改音频资源时，系统会检查是否存在其他记录使用相同名称
- 允许保持自己当前的名称（即修改其他字段但不改名称）
- 如果要修改为已被其他记录使用的名称，则拒绝操作

## 技术实现

### 验证逻辑

```javascript
// 先用 name 查询数据库，检查是否有记录
const existingNameRecords = await query('SELECT id, name FROM sound WHERE name = ?', [name]);

if (id) {
    // 修改操作：如果存在同名记录且不是当前记录，则不允许修改
    const conflictRecord = existingNameRecords.find(record => record.id !== parseInt(id));
    if (conflictRecord) {
        return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '名称已存在，请使用其他名称', 400);
    }
} else {
    // 新增操作：如果存在同名记录，则不允许新增
    if (existingNameRecords.length > 0) {
        return sendError(res, ERROR_CODES.INVALID_PARAMETERS, '名称已存在，请使用其他名称', 400);
    }
}
```

### 验证时机

名称唯一性验证在以下步骤之后进行：
1. 基础参数验证（必填字段、格式验证等）
2. 名称唯一性验证 ← **在这里**
3. 数据库操作（新增/修改）

## 使用示例

### 1. 新增操作

#### 成功案例
```javascript
POST /templateCms/web/sound/save
{
    "name": "欢迎语音",
    "genderCode": "FEMALE",
    "usageCode": "GENERAL",
    "translation": 1,
    "status": "DRAFT"
}

// 响应
{
    "success": true,
    "data": { "id": 123 },
    "message": "新增音频资源成功"
}
```

#### 失败案例（名称重复）
```javascript
POST /templateCms/web/sound/save
{
    "name": "欢迎语音",  // 已存在的名称
    "genderCode": "MALE",
    "usageCode": "FLOW",
    "translation": 0,
    "status": "DRAFT"
}

// 响应
{
    "success": false,
    "errCode": "INVALID_PARAMETERS",
    "errMessage": "名称已存在，请使用其他名称",
    "data": null
}
```

### 2. 修改操作

#### 成功案例（保持自己的名称）
```javascript
POST /templateCms/web/sound/save
{
    "id": 123,
    "name": "欢迎语音",  // 保持自己的名称
    "genderCode": "MALE",  // 修改其他字段
    "usageCode": "FLOW",
    "translation": 1,
    "status": "ENABLED"
}

// 响应
{
    "success": true,
    "data": { "id": 123 },
    "message": "修改音频资源成功"
}
```

#### 成功案例（修改为新的唯一名称）
```javascript
POST /templateCms/web/sound/save
{
    "id": 123,
    "name": "新的欢迎语音",  // 新的唯一名称
    "genderCode": "FEMALE",
    "usageCode": "GENERAL",
    "translation": 1,
    "status": "ENABLED"
}

// 响应
{
    "success": true,
    "data": { "id": 123 },
    "message": "修改音频资源成功"
}
```

#### 失败案例（修改为已存在的名称）
```javascript
POST /templateCms/web/sound/save
{
    "id": 123,
    "name": "其他音频名称",  // 已被其他记录使用的名称
    "genderCode": "FEMALE",
    "usageCode": "GENERAL",
    "translation": 1,
    "status": "ENABLED"
}

// 响应
{
    "success": false,
    "errCode": "INVALID_PARAMETERS",
    "errMessage": "名称已存在，请使用其他名称",
    "data": null
}
```

## 错误处理

### 错误响应格式

```json
{
    "success": false,
    "errCode": "INVALID_PARAMETERS",
    "errMessage": "名称已存在，请使用其他名称",
    "data": null
}
```

### HTTP 状态码

- **400 Bad Request**: 名称重复时返回此状态码

## 业务场景

### 1. 用户创建新音频资源

1. 用户填写音频资源信息，包括名称
2. 点击保存按钮
3. 系统检查名称是否重复
4. 如果重复，提示用户修改名称
5. 如果唯一，成功创建资源

### 2. 用户修改现有音频资源

1. 用户编辑音频资源信息
2. 如果修改了名称，系统检查新名称是否与其他记录重复
3. 如果重复，提示用户使用其他名称
4. 如果唯一或保持原名称，成功更新资源

### 3. 批量导入场景

在批量导入音频资源时，每个资源的名称都会进行唯一性检查，确保不会创建重复名称的记录。

## 测试验证

### 测试覆盖

运行测试验证功能：

```bash
node backend/test/soundNameUniqueRouteTest.js
```

测试覆盖场景：
- ✅ 创建时检查名称重复
- ✅ 重复名称被正确拒绝
- ✅ 唯一名称可以正常创建
- ✅ 更新时检查名称重复
- ✅ 更新为重复名称被拒绝
- ✅ 保持自己名称的更新成功
- ✅ 更新为新唯一名称成功

### 测试结果示例

```
✅ 第一个音频资源创建成功，ID: 32
✅ 重复名称创建失败（预期结果）: 名称已存在，请使用其他名称
✅ 不同名称创建成功，ID: 33
✅ 更新为相同名称失败（预期结果）: 名称已存在，请使用其他名称
✅ 保持自己名称的更新成功
✅ 更新为新唯一名称成功
✅ 所有名称都是唯一的
```

## 性能考虑

### 数据库查询优化

1. **索引优化**: 确保 `name` 字段有索引以提高查询性能
2. **查询最小化**: 只查询必要的字段（`id`, `name`）
3. **早期验证**: 在数据库操作之前进行验证，避免无效操作

### 建议的数据库索引

```sql
-- 为 name 字段创建索引（如果还没有）
CREATE INDEX idx_sound_name ON sound(name);
```

## 扩展性

### 其他模块应用

这种名称唯一性验证模式可以应用到其他需要唯一名称的模块：

```javascript
// 通用的名称唯一性验证函数
const checkNameUnique = async (tableName, name, excludeId = null) => {
    const existingRecords = await query(`SELECT id, name FROM ${tableName} WHERE name = ?`, [name]);
    
    if (excludeId) {
        const conflictRecord = existingRecords.find(record => record.id !== parseInt(excludeId));
        return !conflictRecord;
    } else {
        return existingRecords.length === 0;
    }
};
```

### 自定义错误消息

可以根据不同的业务场景自定义错误消息：

```javascript
const errorMessages = {
    sound: '音频名称已存在，请使用其他名称',
    template: '模板名称已存在，请使用其他名称',
    category: '分类名称已存在，请使用其他名称'
};
```

## 总结

通过实现名称唯一性验证，Sound 模块确保了：

1. **数据完整性**: 防止创建重复名称的记录
2. **用户体验**: 及时提示用户名称冲突
3. **业务逻辑**: 支持灵活的修改操作（可保持原名称）
4. **系统稳定性**: 避免因重复名称导致的业务问题

这种验证机制为音频资源管理提供了可靠的数据质量保障。
