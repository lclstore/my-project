# Workout 扩展查询条件实现

## 概述

参考exercise模块的查询条件处理方式，为workout分页查询接口扩展了多种筛选条件，支持数组参数和智能搜索功能。

## 扩展的查询参数

### 新增参数列表

| 参数名 | 类型 | 必须 | 说明 | 示例 |
|--------|------|------|------|------|
| keywords | string | 否 | 关键词搜索，支持智能匹配 | "全身训练" |
| statusList | array[string] | 否 | 状态筛选 | ["DRAFT", "ENABLED"] |
| genderCodes | array[string] | 否 | 性别编码筛选 | ["FEMALE", "MALE"] |
| difficultyCodes | array[string] | 否 | 难度编码筛选 | ["BEGINNER", "INTERMEDIATE"] |
| positionCodes | array[string] | 否 | 部位编码筛选 | ["STANDING", "SEATED"] |
| injuredCodes | array[string] | 否 | 受伤类型编码筛选 | ["SHOULDER", "BACK"] |
| fileStatusList | array[string] | 否 | 文件任务状态筛选 | ["WAITING", "PROCESSING"] |
| orderBy | string | 否 | 排序字段 | "createTime" |
| orderDirection | string | 否 | 排序方向 | "desc" |

### 参数值说明

#### statusList 可用值
- `DRAFT` - 草稿
- `ENABLED` - 启用
- `DISABLED` - 禁用

#### genderCodes 可用值
- `FEMALE` - 女性
- `MALE` - 男性

#### difficultyCodes 可用值
- `BEGINNER` - 初级
- `INTERMEDIATE` - 中级
- `ADVANCED` - 高级

#### positionCodes 可用值
- `STANDING` - 站立
- `SEATED` - 坐姿

#### injuredCodes 可用值
- `SHOULDER` - 肩部
- `BACK` - 背部
- `WRIST` - 手腕
- `KNEE` - 膝盖
- `ANKLE` - 脚踝
- `HIP` - 髋部
- `NONE` - 无受伤

#### fileStatusList 可用值
- `WAITING` - 等待中
- `PROCESSING` - 处理中
- `SUCCESSFUL` - 成功
- `FAILED` - 失败

## 技术实现

### 1. 参考exercise模块的架构

使用与exercise模块相同的技术栈：
- `QueryConditionBuilder` - 查询条件构建器
- `parseArrayParam` - 数组参数解析
- `validateApiData` - 参数验证
- `convertToFrontendFormat` - 字段转换

### 2. 智能搜索功能

#### keywords参数支持智能匹配：

**纯数字搜索**：
```javascript
// 输入: "123"
// 1. 先按ID精确匹配
// 2. 如果ID无结果，则按名称模糊搜索
```

**文本搜索**：
```javascript
// 输入: "全身训练"
// 直接按名称模糊搜索
```

### 3. 查询条件构建

```javascript
// 构建查询条件
const conditionBuilder = new QueryConditionBuilder();

// 添加逻辑删除过滤
conditionBuilder.addNumberCondition('is_deleted', 0);

// 添加数组条件
if (queryParams.statusList && queryParams.statusList.length > 0) {
    conditionBuilder.addArrayCondition('status', queryParams.statusList, 'BizWorkoutStatusEnums');
}

// 添加字符串条件
if (keywords && keywords.trim()) {
    conditionBuilder.addStringCondition('name', keywords.trim(), 'like');
}
```

### 4. 参数处理流程

```javascript
// 1. 解析数组参数
const queryParams = {};
if (statusList) queryParams.statusList = parseArrayParam(statusList);
if (genderCodes) queryParams.genderCodes = parseArrayParam(genderCodes);

// 2. 参数验证
if (Object.keys(queryParams).length > 0) {
    const validation = validateApiData('workout.query', queryParams);
    if (!validation.valid) {
        return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validation.errors.join(', '), 400);
    }
}

// 3. 构建查询条件
const conditionBuilder = new QueryConditionBuilder();
// ... 添加各种条件

// 4. 执行查询
const { where, params } = conditionBuilder.build();
const result = await BusinessHelper.paginateWithCustomSql(pageSize, pageIndex, {
    tableName: 'workout',
    where,
    whereParams: params,
    orderBy: `${dbOrderBy} ${orderDirection === 'asc' ? 'ASC' : 'DESC'}`
});
```

## API使用示例

### 1. 基本分页查询
```http
GET /api/workout/page?pageIndex=1&pageSize=10
```

### 2. 状态筛选
```http
GET /api/workout/page?statusList=ENABLED,DRAFT&pageSize=10
```

### 3. 多条件组合筛选
```http
GET /api/workout/page?statusList=ENABLED&genderCodes=MALE&difficultyCodes=BEGINNER,INTERMEDIATE&pageSize=10
```

### 4. 关键词搜索
```http
GET /api/workout/page?keywords=全身训练&pageSize=10
```

### 5. 关键词搜索 + 筛选
```http
GET /api/workout/page?keywords=训练&statusList=ENABLED&genderCodes=MALE&pageSize=10
```

### 6. 排序查询
```http
GET /api/workout/page?orderBy=createTime&orderDirection=desc&pageSize=10
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "全身燃脂训练",
        "description": "高强度全身燃脂训练",
        "status": "ENABLED",
        "genderCode": "MALE",
        "difficultyCode": "INTERMEDIATE",
        "positionCode": "STANDING",
        "injuredCodes": ["NONE"],
        "calorie": 350,
        "duration": 1800,
        "createTime": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 25,
    "pageIndex": 1,
    "pageSize": 10,
    "totalPages": 3
  },
  "message": "查询workout列表成功"
}
```

### 错误响应
```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "参数验证失败: statusList包含无效值",
  "data": null
}
```

## 优势特性

### 1. 统一的架构
- 与exercise模块保持一致的实现方式
- 复用成熟的工具类和验证逻辑
- 便于维护和扩展

### 2. 灵活的筛选
- 支持多种条件的组合筛选
- 数组参数支持多值选择
- 智能搜索提升用户体验

### 3. 完善的验证
- 参数类型验证
- 枚举值验证
- 错误信息友好

### 4. 高性能查询
- 使用QueryConditionBuilder优化SQL构建
- 支持索引优化的查询条件
- 分页查询避免大数据量问题

## 扩展建议

### 短期扩展
1. **时间范围筛选**: 添加创建时间、更新时间范围筛选
2. **卡路里范围**: 支持卡路里范围筛选
3. **时长范围**: 支持训练时长范围筛选

### 长期扩展
1. **标签筛选**: 支持自定义标签筛选
2. **收藏筛选**: 支持用户收藏状态筛选
3. **评分筛选**: 支持评分范围筛选

## 相关文件

- **主要文件**: `backend/routes/workout.js`
- **测试文件**: `backend/test/testWorkoutExtendedQuery.js`
- **工具类**: `backend/utils/paramHelper.js`, `backend/utils/enumHelper.js`
- **验证配置**: 需要在验证配置中添加workout.query规则

## 总结

通过参考exercise模块的实现方式，成功为workout分页查询接口扩展了丰富的筛选条件：

- 🔧 **技术统一**: 使用与exercise相同的技术栈
- 📋 **功能完善**: 支持多种筛选条件和智能搜索
- 🛡️ **验证严格**: 完善的参数验证机制
- 🚀 **性能优化**: 高效的查询条件构建
- 📚 **文档完整**: 详细的API文档和使用示例

这些扩展使得workout查询接口更加灵活和强大，为前端提供了丰富的筛选和搜索功能。
