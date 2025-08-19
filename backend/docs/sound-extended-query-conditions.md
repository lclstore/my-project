# Sound 模块扩展查询条件

## 概述

为 sound 模块的列表查询接口添加了扩展查询条件，支持多选筛选功能。所有可选值都从枚举定义库中获取，确保数据一致性和可维护性。

## 新增查询参数

### 1. statusList - 状态筛选

**参数类型**: `array<string>`  
**是否必填**: `false`  
**可选值**: `DRAFT`, `ENABLED`, `DISABLED`  
**示例值**: `["ENABLED", "DISABLED"]`

### 2. genderCodeList - 性别筛选

**参数类型**: `array<string>`  
**是否必填**: `false`  
**可选值**: `FEMALE`, `MALE`, `FEMALE_AND_MALE`  
**示例值**: `["FEMALE", "MALE"]`

### 3. usageCodeList - 用途筛选

**参数类型**: `array<string>`  
**是否必填**: `false`  
**可选值**: `FLOW`, `GENERAL`  
**示例值**: `["FLOW"]`

## 技术实现

### 1. 枚举定义库

在 `routes/enum.js` 中添加了 sound 相关的枚举定义：

```javascript
// 性别枚举
BizSoundGenderEnums: {
  name: "BizSoundGenderEnums",
  displayName: "BizSoundGenderEnums", 
  datas: [
    { code: 1, name: "Female", displayName: "Female", enumName: "FEMALE" },
    { code: 2, name: "Male", displayName: "Male", enumName: "MALE" },
    { code: 3, name: "Female & Male", displayName: "Female & Male", enumName: "FEMALE_AND_MALE" }
  ]
},

// 用途枚举
BizSoundUsageEnums: {
  name: "BizSoundUsageEnums",
  displayName: "BizSoundUsageEnums",
  datas: [
    { code: 1, name: "Flow", displayName: "Flow", enumName: "FLOW" },
    { code: 2, name: "General", displayName: "General", enumName: "GENERAL" }
  ]
},

// 状态枚举
BizSoundStatusEnums: {
  name: "BizSoundStatusEnums", 
  displayName: "BizSoundStatusEnums",
  datas: [
    { code: 1, name: "Draft", displayName: "Draft", enumName: "DRAFT" },
    { code: 2, name: "Enabled", displayName: "Enabled", enumName: "ENABLED" },
    { code: 3, name: "Disabled", displayName: "Disabled", enumName: "DISABLED" }
  ]
}
```

### 2. 枚举工具类

创建了 `utils/enumHelper.js` 工具类：

```javascript
const { soundEnumHelper } = require('../utils/enumHelper');

// 获取枚举值
soundEnumHelper.getStatusValues()  // ['DRAFT', 'ENABLED', 'DISABLED']
soundEnumHelper.getGenderValues()  // ['FEMALE', 'MALE', 'FEMALE_AND_MALE']
soundEnumHelper.getUsageValues()   // ['FLOW', 'GENERAL']

// 验证枚举数组
soundEnumHelper.validateStatusArray(['ENABLED', 'DISABLED'])
```

### 3. 查询条件构建器

提供了通用的查询条件构建器：

```javascript
const { QueryConditionBuilder, SOUND_ENUMS } = require('../utils/enumHelper');

const builder = new QueryConditionBuilder();

// 添加数组条件（IN 查询）
builder.addArrayCondition('status', ['ENABLED', 'DISABLED'], SOUND_ENUMS.STATUS);

// 添加字符串条件（LIKE 查询）
builder.addStringCondition('name', '测试', 'like');

// 构建最终查询
const { where, params } = builder.build();
// 结果: where = "status IN (?,?) AND name LIKE ?"
//      params = ['ENABLED', 'DISABLED', '%测试%']
```

### 4. 参数验证

在 `utils/validator.js` 中添加了新的验证规则：

```javascript
// sound 查询条件验证
'sound.query': {
  statusList: [
    { rule: 'stringArray', message: '状态列表必须是字符串数组' },
    { rule: 'enumArrayFromLib', params: ['BizSoundStatusEnums'], message: '状态列表包含无效值' }
  ],
  genderCodeList: [
    { rule: 'stringArray', message: '性别列表必须是字符串数组' },
    { rule: 'enumArrayFromLib', params: ['BizSoundGenderEnums'], message: '性别列表包含无效值' }
  ],
  usageCodeList: [
    { rule: 'stringArray', message: '用途列表必须是字符串数组' },
    { rule: 'enumArrayFromLib', params: ['BizSoundUsageEnums'], message: '用途列表包含无效值' }
  ]
}
```

## 使用示例

### 1. 基础查询

```bash
# 无筛选条件
GET /templateCms/web/sound/page?pageSize=10&pageIndex=1

# 关键词搜索
GET /templateCms/web/sound/page?keywords=测试&pageSize=10&pageIndex=1
```

### 2. 单个筛选条件

```bash
# 状态筛选
GET /templateCms/web/sound/page?statusList=ENABLED&pageSize=10&pageIndex=1

# 性别筛选
GET /templateCms/web/sound/page?genderCodeList=FEMALE&pageSize=10&pageIndex=1

# 用途筛选
GET /templateCms/web/sound/page?usageCodeList=FLOW&pageSize=10&pageIndex=1
```

### 3. 多选筛选条件

```bash
# 多个状态
GET /templateCms/web/sound/page?statusList=ENABLED&statusList=DISABLED&pageSize=10&pageIndex=1

# 多个性别
GET /templateCms/web/sound/page?genderCodeList=FEMALE&genderCodeList=MALE&pageSize=10&pageIndex=1
```

### 4. 组合筛选条件

```bash
# 状态 + 性别 + 关键词
GET /templateCms/web/sound/page?statusList=ENABLED&genderCodeList=FEMALE&keywords=测试&pageSize=10&pageIndex=1

# 完整筛选
GET /templateCms/web/sound/page?statusList=ENABLED&statusList=DISABLED&genderCodeList=FEMALE&usageCodeList=FLOW&keywords=欢迎&orderBy=createTime&orderDirection=DESC&pageSize=10&pageIndex=1
```

### 5. JavaScript 调用示例

```javascript
// 使用 fetch API
const params = new URLSearchParams({
  pageSize: '10',
  pageIndex: '1',
  orderBy: 'createTime',
  orderDirection: 'DESC'
});

// 添加多选参数
['ENABLED', 'DISABLED'].forEach(status => {
  params.append('statusList', status);
});

['FEMALE', 'MALE'].forEach(gender => {
  params.append('genderCodeList', gender);
});

const response = await fetch(`/templateCms/web/sound/page?${params}`);
const data = await response.json();
```

## 响应示例

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

### 1. 参数验证错误

```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "状态列表包含无效值: INVALID_STATUS，允许的值: DRAFT, ENABLED, DISABLED",
  "data": null
}
```

### 2. 数组格式错误

```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS", 
  "errMessage": "性别列表必须是字符串数组",
  "data": null
}
```

## 公共方法复用

### QueryConditionBuilder

查询条件构建器是通用的，可以在其他模块中复用：

```javascript
const { QueryConditionBuilder } = require('../utils/enumHelper');

// 在其他模块中使用
const builder = new QueryConditionBuilder();
builder
  .addArrayCondition('category', ['A', 'B'])
  .addStringCondition('title', '搜索词', 'like')
  .addNumberCondition('price', 100, '>=');

const { where, params } = builder.build();
```

### 枚举验证

枚举验证规则也是通用的：

```javascript
// 在 validator.js 中为其他模块添加验证
'other.query': {
  categoryList: [
    { rule: 'stringArray', message: '分类列表必须是字符串数组' },
    { rule: 'enumArrayFromLib', params: ['BizCategoryEnums'], message: '分类列表包含无效值' }
  ]
}
```

## 总结

通过引入枚举定义库和公共查询条件构建器，实现了：

1. **数据一致性**: 所有可选值都从枚举库获取
2. **可维护性**: 新增枚举值只需修改枚举定义
3. **可复用性**: 查询条件构建器可在其他模块使用
4. **类型安全**: 完整的参数验证机制
5. **灵活性**: 支持单选、多选、组合筛选

这套扩展查询条件系统为后续其他模块的类似需求提供了标准化的解决方案。
