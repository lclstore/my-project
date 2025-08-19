# Template 模块实现文档

## 概述

Template 模块提供了完整的模板管理功能，包括模板的创建、更新、查询、批量操作等功能。

## 数据库设计

### 主表：template
```sql
CREATE TABLE IF NOT EXISTS template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'template名称',
    description TEXT DEFAULT NULL COMMENT '描述',
    duration_code ENUM('MIN_5_10', 'MIN_10_15', 'MIN_15_20', 'MIN_20_30') NOT NULL COMMENT '时长',
    days INT NOT NULL COMMENT '天数',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='template表';
```

### 关联表：template_unit
```sql
CREATE TABLE IF NOT EXISTS template_unit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    template_id BIGINT NOT NULL COMMENT 'template ID',
    structure_name VARCHAR(255) DEFAULT NULL COMMENT 'template unit名称',
    structure_type_code ENUM('WARM_UP', 'MAIN', 'COOL_DOWN') DEFAULT NULL COMMENT 'exercise 结构类型code',
    count INT DEFAULT NULL COMMENT 'exercise 数量',
    round INT DEFAULT NULL COMMENT 'exercise 循环次数',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (template_id) REFERENCES template(id) ON DELETE CASCADE
) COMMENT='template unit表';
```

## API 接口

### 1. 保存模板 - POST /api/template/save

**功能**: 创建或更新模板

**请求参数**:
```json
{
  "id": 1,                    // 可选，更新时需要
  "name": "模板名称",          // 必填
  "description": "描述",       // 可选
  "durationCode": "MIN_10_15", // 草稿状态可选，其他状态必填
  "days": 7,                  // 草稿状态可选，其他状态必填
  "status": "DRAFT",          // 必填，枚举值
  "unitList": [               // 可选
    {
      "structureName": "热身",
      "structureTypeCode": "WARM_UP",
      "count": 3,
      "round": 1
    }
  ]
}
```

**验证规则**:
- **草稿状态** (`status: "DRAFT"`): 只需要验证 `name` 和 `status`，其他字段可选
- **启用/禁用状态**: 需要验证所有必填字段 (`name`, `durationCode`, `days`, `status`)

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "创建template成功"
}
```

### 2. 批量启用 - POST /api/template/enable

**功能**: 批量启用模板

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 3. 批量禁用 - POST /api/template/disable

**功能**: 批量禁用模板

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 4. 批量删除 - POST /api/template/del

**功能**: 批量逻辑删除模板

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 5. 分页查询 - GET /api/template/page

**功能**: 分页查询模板列表（支持智能搜索）

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keywords`: 关键词搜索（智能搜索：纯数字先ID匹配，无结果则名称搜索）
- `name`: 模板名称（模糊查询，兼容旧版）
- `status`: 状态筛选（单个值，兼容旧版）
- `statusList`: 状态列表（逗号分隔，如：DRAFT,ENABLED）
- `durationCode`: 时长代码筛选（单个值，兼容旧版）
- `durationCodeList`: 时长代码列表（逗号分隔，如：MIN_5_10,MIN_10_15）
- `orderBy`: 排序字段（如：id, name, createTime，默认id）
- `orderDirection`: 排序方向（asc/desc，默认desc）

**智能搜索逻辑**:
1. **纯数字搜索**（如"123"）：先按ID精确匹配，无结果则按名称模糊搜索
2. **文本搜索**（如"测试模板"）：直接按名称模糊搜索
3. **混合搜索**（如"模板123"）：按名称模糊搜索

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

### 6. 获取详情 - GET /api/template/detail/{id}

**功能**: 获取模板详情（包含unit列表）

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "模板名称",
    "description": "描述",
    "durationCode": "MIN_10_15",
    "days": 7,
    "status": "ENABLED",
    "unitList": [
      {
        "structureName": "热身",
        "structureTypeCode": "WARM_UP",
        "count": 3,
        "round": 1,
        "sortOrder": 1
      }
    ]
  }
}
```

## 枚举值定义

### 时长代码 (durationCode)
- `MIN_5_10`: 5-10分钟
- `MIN_10_15`: 10-15分钟
- `MIN_15_20`: 15-20分钟
- `MIN_20_30`: 20-30分钟

### 状态 (status)
- `DRAFT`: 草稿
- `ENABLED`: 启用
- `DISABLED`: 禁用

### 结构类型代码 (structureTypeCode)
- `WARM_UP`: 热身
- `MAIN`: 主要训练
- `COOL_DOWN`: 放松

## 文件结构

```
backend/
├── routes/template.js              # 路由文件
├── sql/create_template_table.sql   # 数据库表结构
├── scripts/initTemplateTable.js    # 表初始化脚本
├── test/templateApiTest.js         # API测试文件
└── docs/template-module-implementation.md  # 文档
```

## 使用的公共方法

1. **BusinessHelper.paginateWithValidation**: 分页查询
2. **BusinessHelper.findByIdWithValidation**: 单条记录查询
3. **batchUpdateStatus**: 批量状态更新
4. **batchLogicalDelete**: 批量逻辑删除
5. **convertToFrontendFormat**: 字段格式转换
6. **QueryConditionBuilder**: 查询条件构建

## API使用示例

### 基本分页查询
```http
GET /api/template/page?pageIndex=1&pageSize=10
```

### 关键词搜索
```http
# 纯数字搜索（先ID匹配，无结果则名称搜索）
GET /api/template/page?keywords=123

# 文本搜索（名称模糊搜索）
GET /api/template/page?keywords=训练模板

# 混合搜索（名称模糊搜索）
GET /api/template/page?keywords=模板123
```

### 筛选查询
```http
# 单个状态筛选
GET /api/template/page?status=ENABLED

# 多个状态筛选
GET /api/template/page?statusList=ENABLED,DRAFT

# 时长代码筛选
GET /api/template/page?durationCodeList=MIN_5_10,MIN_10_15
```

### 排序查询
```http
# 按创建时间升序
GET /api/template/page?orderBy=createTime&orderDirection=asc

# 按名称降序
GET /api/template/page?orderBy=name&orderDirection=desc
```

### 组合查询
```http
# 关键词搜索 + 筛选 + 排序
GET /api/template/page?keywords=训练&statusList=ENABLED&orderBy=createTime&orderDirection=desc
```

## 特性

1. **智能搜索**: 支持ID精确匹配和名称模糊搜索的智能切换
2. **草稿保存**: 草稿状态只需验证name字段，支持快速保存不完整数据
3. **参数安全**: 自动处理undefined参数，转换为SQL安全的null值
4. **事务支持**: 保存操作使用事务确保数据一致性
5. **字段转换**: 自动进行数据库字段名与前端字段名的转换
6. **分层验证**: 根据状态选择不同的验证规则（draft vs 完整）
7. **逻辑删除**: 使用is_deleted字段实现软删除
8. **排序支持**: 支持多字段排序和排序方向控制
9. **关联查询**: 详情接口自动查询关联的unit数据
10. **向下兼容**: 同时支持新的数组参数和旧的单个参数

## 初始化

运行以下命令初始化template表：

```bash
node scripts/initTemplateTable.js
```

## 测试

运行以下命令测试template API：

```bash
node test/templateApiTest.js
```
