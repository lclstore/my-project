# Resource 模块实现文档

## 概述

Resource 模块提供了完整的资源管理功能，包括资源的创建、更新、查询、批量操作等功能。

## 数据库设计

### 主表：resource
```sql
CREATE TABLE IF NOT EXISTS resource (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'resource名称',
    description TEXT DEFAULT NULL COMMENT '描述',
    application_code ENUM('PLAN', 'WORKOUT') NOT NULL COMMENT 'application code',
    gender_code ENUM('FEMALE', 'MALE') NOT NULL COMMENT '性别code',
    cover_img_url VARCHAR(500) NOT NULL COMMENT '封面图',
    detail_img_url VARCHAR(500) NOT NULL COMMENT '详情图',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='resource表';
```

## API 接口

### 1. 保存资源 - POST /api/resource/save

**功能**: 创建或更新资源

**请求参数**:
```json
{
  "id": 1,                        // 可选，更新时需要
  "name": "资源名称",              // 必填
  "description": "描述",           // 可选
  "applicationCode": "PLAN",       // 草稿状态可选，其他状态必填
  "genderCode": "FEMALE",          // 草稿状态可选，其他状态必填
  "coverImgUrl": "https://...",    // 草稿状态可选，其他状态必填
  "detailImgUrl": "https://...",   // 草稿状态可选，其他状态必填
  "status": "DRAFT"                // 必填，枚举值
}
```

**验证规则**:
- **草稿状态** (`status: "DRAFT"`): 只需要验证 `name` 和 `status`，其他字段可选
- **启用/禁用状态**: 需要验证所有必填字段

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "创建resource成功"
}
```

### 2. 批量启用 - POST /api/resource/enable

**功能**: 批量启用资源

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 3. 批量禁用 - POST /api/resource/disable

**功能**: 批量禁用资源

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 4. 批量删除 - POST /api/resource/del

**功能**: 批量逻辑删除资源

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 5. 分页查询 - GET /api/resource/page

**功能**: 分页查询资源列表（支持智能搜索）

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keywords`: 关键词搜索（智能搜索：纯数字先ID匹配，无结果则名称搜索）
- `statusList`: 状态列表（逗号分隔，如：DRAFT,ENABLED）
- `applicationCodeList`: application code列表（逗号分隔，如：PLAN,WORKOUT）
- `genderCode`: 性别code（单个值：FEMALE或MALE）
- `orderBy`: 排序字段（如：id, name, createTime，默认id）
- `orderDirection`: 排序方向（asc/desc，默认desc）

**智能搜索逻辑**:
1. **纯数字搜索**（如"123"）：先按ID精确匹配，无结果则按名称模糊搜索
2. **文本搜索**（如"测试资源"）：直接按名称模糊搜索
3. **混合搜索**（如"资源123"）：按名称模糊搜索

**响应**:
```json
{
  "success": true,
  "data": [...],
  "pageIndex": 1,
  "pageSize": 10,
  "totalCount": 100,
  "totalPages": 10,
  "notEmpty": true,
  "empty": false
}
```

### 6. 获取详情 - GET /api/resource/detail/{id}

**功能**: 获取资源详情

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "资源名称",
    "description": "描述",
    "applicationCode": "PLAN",
    "genderCode": "FEMALE",
    "coverImgUrl": "https://...",
    "detailImgUrl": "https://...",
    "status": "ENABLED",
    "createTime": "2023-01-01T00:00:00.000Z",
    "updateTime": "2023-01-01T00:00:00.000Z"
  }
}
```

## 枚举值定义

### Application Code (applicationCode)
- `PLAN`: 计划
- `WORKOUT`: 训练

### 性别代码 (genderCode)
- `FEMALE`: 女性
- `MALE`: 男性

### 状态 (status)
- `DRAFT`: 草稿
- `ENABLED`: 启用
- `DISABLED`: 禁用

## API使用示例

### 基本分页查询
```http
GET /api/resource/page?pageIndex=1&pageSize=10
```

### 关键词搜索
```http
# 纯数字搜索（先ID匹配，无结果则名称搜索）
GET /api/resource/page?keywords=123

# 文本搜索（名称模糊搜索）
GET /api/resource/page?keywords=训练资源

# 混合搜索（名称模糊搜索）
GET /api/resource/page?keywords=资源123
```

### 筛选查询
```http
# 状态筛选
GET /api/resource/page?statusList=ENABLED,DRAFT

# application code筛选
GET /api/resource/page?applicationCodeList=PLAN,WORKOUT

# 性别筛选
GET /api/resource/page?genderCode=FEMALE
```

### 排序查询
```http
# 按创建时间升序
GET /api/resource/page?orderBy=createTime&orderDirection=asc

# 按名称降序
GET /api/resource/page?orderBy=name&orderDirection=desc
```

### 组合查询
```http
# 关键词搜索 + 筛选 + 排序
GET /api/resource/page?keywords=训练&statusList=ENABLED&applicationCodeList=PLAN&orderBy=createTime&orderDirection=desc
```

## 文件结构

```
backend/
├── routes/resource.js                    # 路由文件
├── sql/create_resource_table.sql         # 数据库表结构
├── scripts/initResourceTable.js          # 表初始化脚本
├── test/resourceApiTest.js               # API测试文件
└── docs/resource-module-implementation.md # 文档
```

## 使用的公共方法

1. **BusinessHelper.paginateWithValidation**: 分页查询
2. **BusinessHelper.findByIdWithValidation**: 单条记录查询
3. **batchUpdateStatus**: 批量状态更新
4. **batchLogicalDelete**: 批量逻辑删除
5. **convertToFrontendFormat**: 字段格式转换
6. **QueryConditionBuilder**: 查询条件构建
7. **sanitizeParams**: 参数安全处理
8. **validateApiData**: 参数验证

## 特性

1. **智能搜索**: 支持ID精确匹配和名称模糊搜索的智能切换
2. **草稿保存**: 草稿状态只需验证name字段，支持快速保存不完整数据
3. **参数安全**: 自动处理undefined参数，转换为SQL安全的null值
4. **事务支持**: 保存操作使用事务确保数据一致性
5. **字段转换**: 自动进行数据库字段名与前端字段名的转换
6. **分层验证**: 根据状态选择不同的验证规则（draft vs 完整）
7. **逻辑删除**: 使用is_deleted字段实现软删除
8. **排序支持**: 支持多字段排序和排序方向控制

## 初始化

运行以下命令初始化resource表：

```bash
node scripts/initResourceTable.js
```

## 测试

运行以下命令测试resource API：

```bash
node test/resourceApiTest.js
```
