# Sound 模块字段转换问题修复

## 问题描述

访问 sound/page 接口时出现错误：
```
获取sound列表错误: Error: Unknown column 'usageCode' in 'order clause'
```

## 问题分析

### 根本原因

前端传递的排序字段是 **camelCase** 格式（如 `usageCode`），但数据库中的字段名是 **snake_case** 格式（如 `usage_code`）。

在分页查询中，排序字段没有进行格式转换，直接使用了前端传递的字段名：

```javascript
// ❌ 问题代码
const options = {
    orderBy: `${orderBy || 'id'} ${orderDirection || 'DESC'}`  // orderBy = 'usageCode'
};
```

生成的 SQL：
```sql
SELECT * FROM sound ORDER BY usageCode DESC  -- ❌ 数据库中没有 usageCode 字段
```

### 字段名对照

| 前端字段名 (camelCase) | 数据库字段名 (snake_case) |
|----------------------|-------------------------|
| `usageCode` | `usage_code` |
| `genderCode` | `gender_code` |
| `createTime` | `create_time` |
| `updateTime` | `update_time` |
| `femaleAudioUrl` | `female_audio_url` |
| `femaleAudioDuration` | `female_audio_duration` |

## 解决方案

### 1. 使用现有的字段转换工具

项目中已经有完善的字段转换工具 `utils/fieldConverter.js`，其中包含：

- `toSnakeCase(str)` - 将 camelCase 转换为 snake_case
- `toCamelCase(str)` - 将 snake_case 转换为 camelCase

### 2. 修复代码

在 `routes/sound.js` 的分页查询接口中使用 `toSnakeCase` 工具：

```javascript
// ✅ 修复后的代码
router.get('/page', async (req, res) => {
    try {
        const { keywords, orderBy, orderDirection } = req.query;
        const { toSnakeCase } = require('../utils/fieldConverter');
        
        // 转换排序字段名：前端字段名(camelCase) -> 数据库字段名(snake_case)
        const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';
        
        const options = {
            orderBy: `${dbOrderBy} ${orderDirection || 'DESC'}`
        };
        
        // ... 其他逻辑
    }
});
```

### 3. 转换效果

```javascript
toSnakeCase('usageCode')     // -> 'usage_code'
toSnakeCase('genderCode')    // -> 'gender_code'  
toSnakeCase('createTime')    // -> 'create_time'
toSnakeCase('id')            // -> 'id' (不变)
toSnakeCase('name')          // -> 'name' (不变)
```

## 测试验证

### 测试结果

所有字段转换测试通过：

```bash
node backend/test/soundFieldConverterTest.js
```

测试覆盖：
- ✅ 基础字段转换（camelCase ↔ snake_case）
- ✅ 排序字段转换（所有支持的字段）
- ✅ 特殊字段转换验证
- ✅ 完整分页请求处理

### 排序测试结果

| 前端字段 | 数据库字段 | 测试结果 |
|---------|-----------|---------|
| `id` | `id` | ✅ 成功 |
| `name` | `name` | ✅ 成功 |
| `genderCode` | `gender_code` | ✅ 成功 |
| `usageCode` | `usage_code` | ✅ 成功 |
| `status` | `status` | ✅ 成功 |
| `createTime` | `create_time` | ✅ 成功 |

## 技术优势

### 1. 使用现有工具

- **避免重复造轮子**：利用项目中已有的 `fieldConverter.js` 工具
- **保持一致性**：与项目其他模块使用相同的转换逻辑
- **减少维护成本**：不需要手动维护字段映射表

### 2. 自动转换

```javascript
// ❌ 之前：手动维护映射表
const fieldMapping = {
    'id': 'id',
    'name': 'name', 
    'genderCode': 'gender_code',
    'usageCode': 'usage_code',
    // ... 需要维护所有字段
};

// ✅ 现在：自动转换
const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';
```

### 3. 通用性

`toSnakeCase` 工具函数可以处理任何 camelCase 字段名，无需为每个新字段添加映射。

## 相关文件

### 修改的文件
- `backend/routes/sound.js` - 添加字段转换逻辑

### 测试文件
- `backend/test/soundFieldConverterTest.js` - 字段转换测试
- `backend/test/soundFieldMappingTest.js` - 字段映射测试（旧版本）

### 工具文件
- `backend/utils/fieldConverter.js` - 字段转换工具（已存在）

## 使用示例

### 正确的请求

```bash
# 前端可以使用 camelCase 字段名
curl "http://localhost:8080/templateCms/web/sound/page?orderBy=usageCode&orderDirection=DESC"

# 后端自动转换为 snake_case
# SQL: SELECT * FROM sound ORDER BY usage_code DESC
```

### 支持的排序字段

前端可以使用以下 camelCase 字段名进行排序：
- `id`
- `name`
- `genderCode`
- `usageCode`
- `status`
- `createTime`
- `updateTime`
- `translation`
- `femaleAudioUrl`
- `femaleAudioDuration`
- `maleAudioUrl`
- `maleAudioDuration`

## 总结

通过使用项目现有的 `toSnakeCase` 工具函数，成功解决了字段转换问题：

1. **问题解决**：`Unknown column 'usageCode'` 错误已修复
2. **代码简化**：避免了手动维护字段映射表
3. **通用性强**：支持所有 camelCase 字段的自动转换
4. **维护性好**：新增字段无需额外配置

现在 sound/page 接口可以正确处理所有前端传递的 camelCase 排序字段名。
