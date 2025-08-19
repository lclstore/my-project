# PlanReplaceSettings 模块实现文档

## 概述

PlanReplaceSettings 模块提供了完整的计划替换设置管理功能，包括设置的创建、更新、查询、批量操作等功能。支持复杂的规则配置和workout列表管理。

## 数据库设计

### 主表：plan_replace_settings
```sql
CREATE TABLE IF NOT EXISTS plan_replace_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'workout名称',
    description TEXT DEFAULT NULL COMMENT '描述',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='plan replace settings表';
```

### 规则表：plan_replace_settings_rule
```sql
CREATE TABLE IF NOT EXISTS plan_replace_settings_rule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    plan_replace_settings_id BIGINT NOT NULL COMMENT 'plan replace settings ID',
    match_key ENUM('GENDER', 'USER') DEFAULT NULL COMMENT '匹配的key',
    match_condition ENUM('EQUALS', 'NOT_EQUALS') DEFAULT NULL COMMENT '匹配条件',
    match_value INT DEFAULT NULL COMMENT '匹配值',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (plan_replace_settings_id) REFERENCES plan_replace_settings(id) ON DELETE CASCADE
) COMMENT='plan replace settings rule表';
```

### Workout关联表：plan_replace_settings_workout
```sql
CREATE TABLE IF NOT EXISTS plan_replace_settings_workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    plan_replace_settings_id BIGINT NOT NULL COMMENT 'plan replace settings ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (plan_replace_settings_id) REFERENCES plan_replace_settings(id) ON DELETE CASCADE
) COMMENT='plan replace settings workout表';
```

## API 接口

### 1. 保存设置 - POST /api/planReplaceSettings/save

**功能**: 创建或更新计划替换设置

**请求参数**:
```json
{
  "id": 1,                        // 可选，更新时需要
  "name": "设置名称",              // 必填
  "description": "描述",           // 可选
  "status": "DRAFT",               // 必填，枚举值
  "ruleList": [                    // 可选
    {
      "matchKey": "GENDER",        // 匹配的key (GENDER/USER)
      "matchCondition": "EQUALS",  // 匹配条件 (EQUALS/NOT_EQUALS)
      "matchValue": 1              // 匹配值 (integer)
    }
  ],
  "workoutList": [101, 102, 103]   // 可选，workout列表（与ruleList同级）
}
```

**验证规则**:
- **草稿状态** (`status: "DRAFT"`): 只需要验证 `name` 和 `status`，其他字段可选
- **启用/禁用状态**: 需要验证所有必填字段

### 2. 批量启用 - POST /api/planReplaceSettings/enable
### 3. 批量禁用 - POST /api/planReplaceSettings/disable
### 4. 批量删除 - POST /api/planReplaceSettings/del

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 5. 分页查询 - GET /api/planReplaceSettings/page

**功能**: 分页查询设置列表（支持智能搜索，包含ruleList和workoutListStr）

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keywords`: 关键词搜索（智能搜索：纯数字先ID匹配，无结果则名称搜索）
- `statusList`: 状态列表（逗号分隔，如：DRAFT,ENABLED）
- `orderBy`: 排序字段（如：id, name, createTime，默认id）
- `orderDirection`: 排序方向（asc/desc，默认desc）

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "设置名称",
      "description": "描述",
      "status": "ENABLED",
      "ruleList": [
        {
          "matchKey": "GENDER",
          "matchCondition": "EQUALS",
          "matchValue": 1,
          "sortOrder": 1
        }
      ],
      "workoutListStr": "127,125,121"
    }
  ],
  "total": 10,
  "pageIndex": 1,
  "pageSize": 10
}
```

### 6. 获取详情 - GET /api/planReplaceSettings/detail/{id}

**功能**: 获取设置详情（包含完整的规则和workout列表）

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "设置名称",
    "description": "描述",
    "status": "ENABLED",
    "ruleList": [
      {
        "matchKey": "GENDER",
        "matchCondition": "EQUALS",
        "matchValue": 1,
        "sortOrder": 1
      }
    ],
    "workoutList": [  // 与ruleList同级，包含完整的workout信息
      {
        "id": 101,
        "name": "Workout A",
        "description": "Description A",
        "status": "ENABLED",
        "createTime": "2023-01-01T00:00:00.000Z",
        "updateTime": "2023-01-01T00:00:00.000Z"
      },
      {
        "id": 102,
        "name": "Workout B",
        "description": "Description B",
        "status": "ENABLED",
        "createTime": "2023-01-01T00:00:00.000Z",
        "updateTime": "2023-01-01T00:00:00.000Z"
      }
    ],
    "createTime": "2023-01-01T00:00:00.000Z",
    "updateTime": "2023-01-01T00:00:00.000Z"
  }
}
```

## 枚举值定义

### 匹配Key (matchKey)
- `GENDER`: 性别
- `USER`: 用户

### 匹配条件 (matchCondition)
- `EQUALS`: 等于
- `NOT_EQUALS`: 不等于

### 状态 (status)
- `DRAFT`: 草稿
- `ENABLED`: 启用
- `DISABLED`: 禁用

## 数据结构特点

### 数据关联结构
1. **plan_replace_settings**: 主设置表
2. **plan_replace_settings_rule**: 规则表（一对多，关联到主设置）
3. **plan_replace_settings_workout**: workout关联表（一对多，直接关联到主设置）

### 响应数据结构
详情接口返回的数据包含两个重要字段：

1. **ruleList**: 规则列表
   - 包含匹配规则的配置信息
   - 不再包含workoutList字段

2. **workoutList**: workout完整信息列表（与ruleList同级）
   - 直接关联到plan_replace_settings主表
   - 包含所有相关workout的完整信息对象
   - 通过workout ID查询workout表获取完整信息

### 数据查询逻辑
1. 查询主设置信息
2. 查询关联的规则列表（不包含workout信息）
3. 查询直接关联到主设置的workout ID列表
4. 通过workout ID查询workout表获取完整信息
5. 组装最终响应数据（ruleList和workoutList同级）

### 级联删除
- 删除设置时，自动删除关联的规则和workout记录
- 删除规则时，自动删除关联的workout记录

### 排序支持
- 规则按`sort_order`排序
- workout按`sort_order`排序

## 文件结构

```
backend/
├── routes/planReplaceSettings.js                    # 路由文件
├── sql/create_plan_replace_settings_table.sql      # 数据库表结构
├── scripts/initPlanReplaceSettingsTable.js         # 表初始化脚本
├── test/planReplaceSettingsApiTest.js              # API测试文件
└── docs/plan-replace-settings-module-implementation.md # 文档
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
3. **复杂关联**: 支持三层数据结构的完整管理
4. **事务支持**: 保存操作使用事务确保数据一致性
5. **级联操作**: 自动处理关联数据的创建、更新、删除
6. **排序支持**: 规则和workout都支持自定义排序
7. **逻辑删除**: 使用is_deleted字段实现软删除

## 初始化

运行以下命令初始化planReplaceSettings表：

```bash
node scripts/initPlanReplaceSettingsTable.js
```

## 测试

运行以下命令测试planReplaceSettings API：

```bash
node test/planReplaceSettingsApiTest.js
```
