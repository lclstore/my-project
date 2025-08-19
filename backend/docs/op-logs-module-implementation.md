# OpLogs 操作日志模块实现文档

## 概述

OpLogs 模块提供了完整的操作日志管理功能，用于记录系统中各种业务操作的详细信息。支持分页查询、多维度搜索和详情查看等功能。

## 数据库设计

### 主表：op_logs
```sql
CREATE TABLE IF NOT EXISTS op_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    biz_type VARCHAR(100) NOT NULL COMMENT '业务类型',
    data_id INT NOT NULL COMMENT '数据id',
    data_info TEXT DEFAULT NULL COMMENT '数据信息',
    operation_type ENUM('ADD', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE', 'TEMPLATE_GENERATE_WORKOUT', 'TEMPLATE_GENERATE_WORKOUT_FILE', 'SAVE', 'WORKOUT_GENERATE_FILE') NOT NULL COMMENT '操作类型',
    data_after TEXT DEFAULT NULL COMMENT '操作后数据',
    operation_user VARCHAR(255) NOT NULL COMMENT '操作人',
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='操作日志表';
```

### 索引设计
- `idx_op_logs_biz_type`: 业务类型索引
- `idx_op_logs_data_id`: 数据ID索引
- `idx_op_logs_operation_type`: 操作类型索引
- `idx_op_logs_operation_user`: 操作人索引
- `idx_op_logs_operation_time`: 操作时间索引
- `idx_op_logs_create_time`: 创建时间索引

## API 接口

### 1. 分页查询 - GET /api/opLogs/page

**功能**: 分页查询操作日志列表（支持智能搜索和多维筛选）

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keywords`: 关键词搜索（智能搜索：纯数字先ID匹配，无结果则多字段搜索）
- `operationTypeList`: 操作类型列表（逗号分隔，如：ADD,UPDATE,DELETE）
- `orderBy`: 排序字段（如：id, operationTime, createTime，默认operationTime）
- `orderDirection`: 排序方向（asc/desc，默认desc）

**特殊功能**:
- 支持多字段搜索：业务类型、操作人、数据信息
- 智能搜索：纯数字优先ID匹配，无结果则按多字段搜索

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bizType": "music",
      "dataId": 1,
      "dataInfo": "测试音乐1",
      "operationType": "ADD",
      "dataAfter": "{\"name\":\"测试音乐1\",\"status\":\"ENABLED\"}",
      "operationUser": "测试用户1",
      "operationTime": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "pageIndex": 1,
  "pageSize": 10
}
```

### 2. 获取详情 - GET /api/opLogs/detail/{id}

**功能**: 获取操作日志详情

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bizType": "music",
    "dataId": 1,
    "dataInfo": "测试音乐1",
    "operationType": "ADD",
    "dataAfter": "{\"name\":\"测试音乐1\",\"status\":\"ENABLED\"}",
    "operationUser": "测试用户1",
    "operationTime": "2023-01-01T00:00:00.000Z",
    "createTime": "2023-01-01T00:00:00.000Z",
    "updateTime": "2023-01-01T00:00:00.000Z"
  }
}
```

## 字段规范

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer(int64) | false | 主键ID |
| bizType | string | true | 业务类型 |
| dataId | integer(int32) | true | 数据ID |
| dataInfo | string | false | 数据信息 |
| operationType | string | true | 操作类型 |
| dataAfter | string | false | 操作后数据 |
| operationUser | string | true | 操作人 |
| operationTime | string(date-time) | true | 操作时间 |

## 枚举值定义

### 操作类型 (operationType)
- `ADD`: 新增
- `UPDATE`: 更新
- `DELETE`: 删除
- `ENABLE`: 启用
- `DISABLE`: 禁用
- `TEMPLATE_GENERATE_WORKOUT`: 模板生成锻炼
- `TEMPLATE_GENERATE_WORKOUT_FILE`: 模板生成锻炼文件
- `SAVE`: 保存
- `WORKOUT_GENERATE_FILE`: 锻炼生成文件

## 数据结构特点

### 智能搜索
- 支持ID精确匹配和多字段模糊搜索的智能切换
- 多字段搜索：业务类型、操作人、数据信息
- 提供更好的用户搜索体验

### 日志记录
- 完整记录操作前后的数据状态
- 支持JSON格式的复杂数据存储
- 操作时间精确到秒级

### 查询优化
- 多维度索引支持高效查询
- 支持按时间、类型、用户等多种维度筛选

## 文件结构

```
backend/
├── routes/opLogs.js                    # 路由文件
├── sql/create_op_logs_table.sql        # 数据库表结构
├── scripts/initOpLogsTable.js          # 表初始化脚本
├── test/opLogsApiTest.js               # API测试文件
└── docs/op-logs-module-implementation.md # 文档
```

## 使用的公共方法

1. **BusinessHelper.paginateWithValidation**: 分页查询
2. **BusinessHelper.findByIdWithValidation**: 单条记录查询
3. **convertToFrontendFormat**: 字段格式转换
4. **QueryConditionBuilder**: 查询条件构建
5. **parseArrayParam**: 数组参数解析
6. **toSnakeCase**: 字段名转换

## 特性

1. **智能搜索**: 支持ID精确匹配和多字段模糊搜索的智能切换
2. **多维筛选**: 支持按操作类型、业务类型、操作人筛选
3. **时间排序**: 默认按操作时间倒序，支持自定义排序
4. **完整记录**: 记录操作前后的完整数据状态
5. **高性能查询**: 多维度索引支持高效查询
6. **标准化输出**: 使用公共方法进行字段格式转换

## 初始化

运行以下命令初始化op_logs表：

```bash
node scripts/initOpLogsTable.js
```

## 测试

运行以下命令测试opLogs API：

```bash
node test/opLogsApiTest.js
```

## 使用示例

### 查询操作日志
```javascript
// 分页查询所有日志
GET /api/opLogs/page?pageIndex=1&pageSize=20

// 按操作类型筛选
GET /api/opLogs/page?operationTypeList=ADD,UPDATE,DELETE

// 按关键词搜索
GET /api/opLogs/page?keywords=音乐

// 按操作人搜索
GET /api/opLogs/page?keywords=管理员

// 按时间排序
GET /api/opLogs/page?orderBy=operationTime&orderDirection=asc
```

### 记录操作日志
```javascript
// 在业务操作中记录日志
const logData = {
    bizType: 'music',
    dataId: musicId,
    dataInfo: '背景音乐1',
    operationType: 'ADD',
    dataAfter: JSON.stringify(musicData),
    operationUser: '管理员',
    operationTime: new Date()
};

// 插入日志记录
await query(`
    INSERT INTO op_logs (biz_type, data_id, data_info, operation_type, data_after, operation_user, operation_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`, [logData.bizType, logData.dataId, logData.dataInfo, logData.operationType, logData.dataAfter, logData.operationUser, logData.operationTime]);
```

OpLogs模块现在提供了完整的操作日志管理功能，支持智能搜索和多维度查询！
