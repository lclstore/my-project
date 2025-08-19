# Workout API 接口列表

## 接口概览

根据要求，workout模块的API接口命名如下：

| 功能 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 分页列表 | GET | `/api/workout/page` | 分页查询workout列表，支持筛选 |
| 删除 | POST | `/api/workout/del` | 逻辑删除workout（批量） |
| 详情 | GET | `/api/workout/detail/{id}` | 查询单个workout详情 |
| 启用 | POST | `/api/workout/enable` | 批量启用workout |
| 禁用 | POST | `/api/workout/disable` | 批量禁用workout |
| 保存 | POST | `/api/workout/save` | 新增或修改workout |

## 接口详细说明

### 1. 分页列表 - `/api/workout/page`
**方法**: GET  
**功能**: 分页查询workout列表，支持多种筛选条件

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `status`: 状态筛选（DRAFT, ENABLED, DISABLED）
- `genderCode`: 性别筛选（FEMALE, MALE）
- `difficultyCode`: 难度筛选（BEGINNER, INTERMEDIATE, ADVANCED）
- `keyword`: 关键词搜索（名称）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "data": [...],
    "pageIndex": 1,
    "pageSize": 10,
    "totalCount": 100,
    "totalPages": 10
  }
}
```

### 2. 删除 - `/api/workout/del`
**方法**: POST  
**功能**: 逻辑删除workout（支持批量）

**请求体**:
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
    "deletedCount": 3
  },
  "message": "删除workout成功"
}
```

### 3. 详情 - `/api/workout/detail/{id}`
**方法**: GET  
**功能**: 查询单个workout的详细信息

**路径参数**:
- `id`: workout ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 142,
    "name": "全身燃脂训练",
    "description": "高强度全身燃脂训练",
    "injuredCodes": ["NONE"],
    "exerciseGroupList": [
      {
        "structureName": "热身",
        "structureRound": 1,
        "exerciseList": [1, 2, 3]
      }
    ]
  }
}
```

### 4. 启用 - `/api/workout/enable`
**方法**: POST  
**功能**: 批量启用workout

**请求体**:
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
    "updatedCount": 3
  },
  "message": "启用workout成功"
}
```

### 5. 禁用 - `/api/workout/disable`
**方法**: POST  
**功能**: 批量禁用workout

**请求体**:
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
    "updatedCount": 3
  },
  "message": "禁用workout成功"
}
```

### 6. 保存 - `/api/workout/save`
**方法**: POST  
**功能**: 新增或修改workout

**请求体**:
```json
{
  "id": 142,  // 修改时必填，新增时不填
  "name": "全身燃脂训练",
  "description": "高强度全身燃脂训练",
  "premium": 0,
  "genderCode": "MALE",
  "difficultyCode": "BEGINNER",
  "positionCode": "STANDING",
  "injuredCodes": ["NONE"],
  "calorie": 300,
  "duration": 1800,
  "status": "ENABLED",
  "exerciseGroupList": [
    {
      "structureName": "热身",
      "structureRound": 1,
      "exerciseList": [1, 2, 3]
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 142
  },
  "message": "保存workout成功"
}
```

## 特性说明

### 逻辑删除
- 所有删除操作都是逻辑删除，使用`is_deleted`字段标记
- 查询接口自动过滤已删除数据
- 数据安全，支持恢复

### 批量操作
- 删除、启用、禁用都支持批量操作
- 使用`idList`数组传递多个ID
- 返回实际影响的记录数

### 数据验证
- 所有接口都包含完整的参数验证
- 支持枚举值验证
- 提供详细的错误信息

### 事务处理
- 保存接口使用事务确保数据一致性
- 自动处理主表和关联表的数据同步

## 测试
可以使用以下命令测试API接口：
```bash
# 启动服务后运行API测试
node test/workoutApiTest.js
```

## Swagger文档
访问 `http://localhost:8080/api/swagger-ui/` 查看完整的API文档和在线测试。
