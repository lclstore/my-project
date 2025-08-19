# Sound 模块逗号分隔多选参数支持

## 概述

Sound 模块的列表查询接口现在支持多种格式的多选参数，包括逗号分隔字符串格式，以满足不同前端框架和调用方式的需求。

## 支持的参数格式

### 1. 逗号分隔字符串（推荐）

```bash
# 单个参数，多个值用逗号分隔
GET /templateCms/web/sound/page?statusList=ENABLED,DISABLED

# 支持空格（会自动去除）
GET /templateCms/web/sound/page?statusList=ENABLED, DISABLED, DRAFT

# 组合使用
GET /templateCms/web/sound/page?statusList=ENABLED,DISABLED&genderCodeList=FEMALE,MALE&usageCodeList=FLOW
```

### 2. 重复参数名（传统方式）

```bash
# 多个同名参数
GET /templateCms/web/sound/page?statusList=ENABLED&statusList=DISABLED

# 组合使用
GET /templateCms/web/sound/page?statusList=ENABLED&statusList=DISABLED&genderCodeList=FEMALE&genderCodeList=MALE
```

### 3. 单个值

```bash
# 单个值（字符串）
GET /templateCms/web/sound/page?statusList=ENABLED

# 单个值（数组）
GET /templateCms/web/sound/page?statusList[]=ENABLED
```

## 参数解析逻辑

后端会自动识别和解析不同格式的参数：

```javascript
const parseArrayParam = (param) => {
    if (!param) return null;                    // null/undefined -> null
    if (Array.isArray(param)) return param;    // 数组 -> 数组
    if (typeof param === 'string') {
        // 字符串 -> 按逗号分割成数组
        const parsed = param.split(',').map(item => item.trim()).filter(item => item);
        return parsed.length > 0 ? parsed : null;
    }
    return [param];                             // 其他类型 -> 包装成数组
};
```

### 解析示例

| 输入格式 | 解析结果 |
|---------|---------|
| `"ENABLED,DISABLED"` | `["ENABLED", "DISABLED"]` |
| `"ENABLED, DISABLED"` | `["ENABLED", "DISABLED"]` |
| `"ENABLED,DISABLED,DRAFT"` | `["ENABLED", "DISABLED", "DRAFT"]` |
| `"ENABLED"` | `["ENABLED"]` |
| `["ENABLED", "DISABLED"]` | `["ENABLED", "DISABLED"]` |
| `""` | `null` |
| `null` | `null` |

## 使用示例

### 1. JavaScript/Fetch API

```javascript
// 方式1: 逗号分隔字符串
const params = new URLSearchParams({
    pageSize: '10',
    pageIndex: '1',
    statusList: 'ENABLED,DISABLED',
    genderCodeList: 'FEMALE,MALE',
    usageCodeList: 'FLOW'
});

const response = await fetch(`/templateCms/web/sound/page?${params}`);

// 方式2: 重复参数名
const params2 = new URLSearchParams();
params2.append('pageSize', '10');
params2.append('pageIndex', '1');
params2.append('statusList', 'ENABLED');
params2.append('statusList', 'DISABLED');
params2.append('genderCodeList', 'FEMALE');
params2.append('genderCodeList', 'MALE');

const response2 = await fetch(`/templateCms/web/sound/page?${params2}`);
```

### 2. jQuery/Ajax

```javascript
// 逗号分隔格式
$.ajax({
    url: '/templateCms/web/sound/page',
    method: 'GET',
    data: {
        pageSize: 10,
        pageIndex: 1,
        statusList: 'ENABLED,DISABLED',
        genderCodeList: 'FEMALE,MALE'
    },
    success: function(data) {
        console.log(data);
    }
});
```

### 3. Axios

```javascript
// 逗号分隔格式
const response = await axios.get('/templateCms/web/sound/page', {
    params: {
        pageSize: 10,
        pageIndex: 1,
        statusList: 'ENABLED,DISABLED',
        genderCodeList: 'FEMALE,MALE',
        usageCodeList: 'FLOW'
    }
});

// 数组格式（Axios会自动处理）
const response2 = await axios.get('/templateCms/web/sound/page', {
    params: {
        pageSize: 10,
        pageIndex: 1,
        statusList: ['ENABLED', 'DISABLED'],
        genderCodeList: ['FEMALE', 'MALE']
    }
});
```

### 4. cURL 命令

```bash
# 逗号分隔格式
curl "http://localhost:8080/templateCms/web/sound/page?statusList=ENABLED,DISABLED&genderCodeList=FEMALE,MALE&pageSize=10&pageIndex=1"

# URL编码格式
curl "http://localhost:8080/templateCms/web/sound/page?statusList=ENABLED%2CDISABLED&genderCodeList=FEMALE%2CMALE&pageSize=10&pageIndex=1"

# 重复参数格式
curl "http://localhost:8080/templateCms/web/sound/page?statusList=ENABLED&statusList=DISABLED&genderCodeList=FEMALE&genderCodeList=MALE&pageSize=10&pageIndex=1"
```

## 完整的查询示例

### 基础查询

```bash
# 无筛选条件
GET /templateCms/web/sound/page?pageSize=10&pageIndex=1

# 关键词搜索
GET /templateCms/web/sound/page?keywords=测试&pageSize=10&pageIndex=1

# 排序
GET /templateCms/web/sound/page?orderBy=createTime&orderDirection=DESC&pageSize=10&pageIndex=1
```

### 单个筛选条件

```bash
# 状态筛选（逗号分隔）
GET /templateCms/web/sound/page?statusList=ENABLED,DISABLED&pageSize=10&pageIndex=1

# 性别筛选（逗号分隔）
GET /templateCms/web/sound/page?genderCodeList=FEMALE,MALE&pageSize=10&pageIndex=1

# 用途筛选（单个值）
GET /templateCms/web/sound/page?usageCodeList=FLOW&pageSize=10&pageIndex=1
```

### 组合筛选条件

```bash
# 完整的组合筛选
GET /templateCms/web/sound/page?statusList=ENABLED,DISABLED&genderCodeList=FEMALE,MALE&usageCodeList=FLOW,GENERAL&keywords=测试&orderBy=createTime&orderDirection=DESC&pageSize=10&pageIndex=1

# 带空格的格式（会自动处理）
GET /templateCms/web/sound/page?statusList=ENABLED, DISABLED&genderCodeList=FEMALE, MALE&pageSize=10&pageIndex=1
```

## 响应格式

无论使用哪种参数格式，响应格式都是一致的：

```json
{
  "data": [
    {
      "id": 1,
      "name": "欢迎语音",
      "genderCode": "FEMALE",
      "usageCode": "FLOW",
      "status": "ENABLED",
      "createTime": "2025-08-14 10:30:45"
    }
  ],
  "pageIndex": 1,
  "pageSize": 10,
  "totalCount": 1,
  "totalPages": 1,
  "notEmpty": true,
  "empty": false
}
```

## 错误处理

### 参数验证错误

```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "状态列表包含无效值: INVALID_STATUS，允许的值: DRAFT, ENABLED, DISABLED",
  "data": null
}
```

### 格式错误

```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "状态列表必须是字符串数组",
  "data": null
}
```

## 技术优势

### 1. 兼容性强

- 支持传统的重复参数名格式
- 支持现代的逗号分隔字符串格式
- 支持数组格式
- 自动处理空格和空值

### 2. 易于使用

```javascript
// 简单的字符串拼接
const statusList = selectedStatuses.join(',');
const url = `/api/sound/page?statusList=${statusList}`;

// 无需复杂的参数处理
```

### 3. URL友好

```bash
# 简洁的URL
/sound/page?statusList=ENABLED,DISABLED&genderCodeList=FEMALE,MALE

# 而不是冗长的
/sound/page?statusList=ENABLED&statusList=DISABLED&genderCodeList=FEMALE&genderCodeList=MALE
```

## 最佳实践

### 1. 推荐使用逗号分隔格式

```javascript
// ✅ 推荐：逗号分隔
const params = {
    statusList: 'ENABLED,DISABLED',
    genderCodeList: 'FEMALE,MALE'
};

// ❌ 不推荐：复杂的数组处理
const params = new URLSearchParams();
['ENABLED', 'DISABLED'].forEach(status => {
    params.append('statusList', status);
});
```

### 2. 处理用户选择

```javascript
// 前端多选组件的值处理
const selectedStatuses = ['ENABLED', 'DISABLED'];
const statusListParam = selectedStatuses.join(',');

// 构建查询参数
const queryParams = {
    pageSize: 10,
    pageIndex: 1,
    statusList: statusListParam
};
```

### 3. 动态构建查询

```javascript
function buildQueryParams(filters) {
    const params = {
        pageSize: filters.pageSize || 10,
        pageIndex: filters.pageIndex || 1
    };
    
    // 只添加有值的筛选条件
    if (filters.statuses && filters.statuses.length > 0) {
        params.statusList = filters.statuses.join(',');
    }
    
    if (filters.genders && filters.genders.length > 0) {
        params.genderCodeList = filters.genders.join(',');
    }
    
    if (filters.usages && filters.usages.length > 0) {
        params.usageCodeList = filters.usages.join(',');
    }
    
    return params;
}
```

## 总结

通过支持逗号分隔的多选参数格式，Sound 模块的查询接口变得更加灵活和易用：

1. **多格式支持**：兼容不同的参数传递方式
2. **自动解析**：后端自动识别和处理不同格式
3. **URL友好**：生成简洁的查询URL
4. **易于集成**：前端可以用最简单的方式传递多选参数

这种实现方式为其他模块的类似需求提供了标准化的解决方案。
