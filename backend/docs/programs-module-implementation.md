# Programs 模块实现文档

## 概述

Programs 模块是参考 Categories 模块实现的训练计划管理系统，提供完整的 CRUD 操作、批量管理、智能搜索等功能。

## 数据库设计

### 主表：program

```sql
CREATE TABLE IF NOT EXISTS program (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'program名称',
    cover_img_url VARCHAR(500) DEFAULT NULL COMMENT '封面图',
    detail_img_url VARCHAR(500) DEFAULT NULL COMMENT '详情图',
    description TEXT DEFAULT NULL COMMENT '描述',
    new_start_time DATETIME DEFAULT NULL COMMENT 'NEW 开始时间',
    new_end_time DATETIME DEFAULT NULL COMMENT 'NEW 结束时间',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    group_code ENUM('GROUPA', 'GROUPB', 'GROUPC', 'GROUPD', 'GROUPE', 'GROUPF', 'GROUPG') NOT NULL COMMENT 'group code',
    show_in_page TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否要在app的category页面展示（0否 1是）',
    sort INT DEFAULT 0 COMMENT '排序字段',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='programs表';
```

### 关联表：programs_workout

```sql
CREATE TABLE IF NOT EXISTS programs_workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    programs_id BIGINT NOT NULL COMMENT 'program ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (programs_id) REFERENCES program(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
    UNIQUE KEY uk_programs_workout (programs_id, workout_id)
) COMMENT='program workout关联表';
```

## 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer(int64) | false | 主键ID |
| name | string | true | program名称 |
| coverImgUrl | string | true | 封面图URL |
| detailImgUrl | string | true | 详情图URL |
| description | string | false | 描述 |
| newStartTime | string(date-time) | false | NEW 开始时间 |
| newEndTime | string(date-time) | false | NEW 结束时间 |
| status | string | true | 状态(DRAFT,ENABLED,DISABLED) |
| workoutList | array[integer] | false | workout列表 |
| groupCode | string | true | group code(GROUPA,GROUPB,GROUPC,GROUPD,GROUPE,GROUPF,GROUPG) |
| showInPage | integer(int32) | true | 是否要在app的category页面展示 |

## API 接口

### 1. 保存接口

```javascript
POST /api/program/save
```

**功能**：新增或修改 program
- 支持新增和修改操作（通过 id 参数区分）
- 自动处理 workout 关联关系
- 使用事务确保数据一致性

### 2. 详情查询

```javascript
GET /api/program/detail/:id
```

**功能**：获取 program 详情
- 返回 program 基本信息
- 包含关联的 workout 列表
- 自动处理字段转换

### 3. 分页查询

```javascript
GET /api/program/page
```

**功能**：分页查询 program 列表
- 支持关键词搜索（ID精确匹配 + 名称模糊搜索）
- 支持多条件筛选（状态、group code、展示状态）
- 支持自定义排序

### 4. 列表查询

```javascript
GET /api/program/list
```

**功能**：查询所有 program（不分页）
- 与分页查询相同的筛选条件
- 返回所有符合条件的数据

### 5. 批量操作

```javascript
POST /api/program/del      // 批量删除（逻辑删除）
POST /api/program/enable   // 批量启用
POST /api/program/disable  // 批量禁用
POST /api/program/sort     // 批量排序
```

## 验证配置

### 主要验证规则

```javascript
'program': {
    name: [
        { rule: 'required' },
        { rule: 'string', message: '名称必须是字符串' }
    ],
    status: [
        { rule: 'required' },
        { rule: 'enumFromLib', params: ['BizStatusEnums'], message: '状态值无效' }
    ],
    groupCode: [
        { rule: 'required' },
        { rule: 'enumFromLib', params: ['BizCategoryGroupEnums'], message: 'group code值无效' }
    ],
    showInPage: [
        { rule: 'required' },
        { rule: 'enum', params: [[0, 1]], message: '是否展示必须是0或1' }
    ]
}
```

### 查询条件验证

```javascript
'program.query': {
    statusList: [
        { rule: 'stringArray', message: '状态列表必须是字符串数组' },
        { rule: 'enumArrayFromLib', params: ['BizStatusEnums'], message: '状态列表包含无效值' }
    ],
    groupCodeList: [
        { rule: 'stringArray', message: 'group code列表必须是字符串数组' },
        { rule: 'enumArrayFromLib', params: ['BizCategoryGroupEnums'], message: 'group code列表包含无效值' }
    ]
}
```

## 技术特性

### 1. 架构统一
- 与 category 模块保持一致的设计模式
- 复用成熟的工具类和验证逻辑
- 统一的错误处理和响应格式

### 2. 功能完善
- 完整的 CRUD 操作
- 智能搜索和多条件筛选
- 批量操作支持
- 关联数据管理（workout 列表）

### 3. 数据安全
- 逻辑删除保护数据
- 事务保证数据一致性
- 参数验证防止注入
- 枚举值验证确保数据规范

### 4. 性能优化
- 高效的 SQL 查询
- 批量操作减少数据库访问
- 索引优化查询性能
- 分页避免大数据量问题

## 使用示例

### 创建 program

```javascript
POST /api/program/save
{
  "name": "初级训练计划",
  "description": "适合初学者的训练计划",
  "coverImgUrl": "https://example.com/cover.jpg",
  "detailImgUrl": "https://example.com/detail.jpg",
  "status": "ENABLED",
  "groupCode": "GROUPA",
  "showInPage": 1,
  "workoutList": [1, 2, 3]
}
```

### 查询 program

```javascript
// 分页查询
GET /api/program/page?pageSize=10&pageIndex=1&keywords=训练&statusList=ENABLED,DISABLED

// 获取详情
GET /api/program/detail/1
```

### 批量操作

```javascript
// 批量启用
POST /api/program/enable
{ "idList": [1, 2, 3] }

// 批量排序
POST /api/program/sort
{ "idList": [3, 1, 2] }

// 删除（逻辑删除）
POST /api/program/del
{ "idList": [1, 2, 3] }
```

## 相关文件

- **数据库脚本**: `backend/sql/create_programs_table.sql`
- **路由文件**: `backend/routes/program.js`
- **测试文件**: `backend/test/testProgramsApi.js`
- **文档**: `backend/docs/program-module-implementation.md`

## 总结

Programs 模块成功参考 Categories 模块实现，提供了完整的训练计划管理功能。通过复用现有的工具类和验证逻辑，确保了代码的一致性和可维护性。模块支持完整的 CRUD 操作、智能搜索、批量管理等功能，满足训练计划管理的各种需求。
