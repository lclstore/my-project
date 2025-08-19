# Music 模块实现文档

## 概述

Music 模块提供了完整的音乐管理功能，包括音乐的创建、更新、查询、批量操作等功能。支持逻辑删除和完整的CRUD操作。

## 数据库设计

### 主表：music
```sql
CREATE TABLE IF NOT EXISTS music (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '名称',
    display_name VARCHAR(255) NOT NULL COMMENT '显示名称',
    audio_url VARCHAR(500) DEFAULT NULL COMMENT '音频文件地址',
    audio_duration INT NOT NULL COMMENT '音频时长（秒）',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='music音乐表';
```

### 索引设计
- `idx_music_name`: 名称索引
- `idx_music_display_name`: 显示名称索引
- `idx_music_status`: 状态索引
- `idx_music_is_deleted`: 逻辑删除索引
- `idx_music_audio_duration`: 音频时长索引

## API 接口

### 1. 保存音乐 - POST /api/music/save

**功能**: 创建或更新音乐

**请求参数**:
```json
{
  "id": 1,                        // 可选，更新时需要
  "name": "音乐名称",              // 必填
  "displayName": "显示名称",       // 必填
  "audioUrl": "https://example.com/music.mp3", // 可选
  "audioDuration": 180,            // 必填，音频时长（秒）
  "status": "DRAFT"                // 必填，枚举值
}
```

**验证规则**:
- **草稿状态** (`status: "DRAFT"`): 只需要验证 `name`、`displayName`、`audioDuration` 和 `status`
- **启用/禁用状态**: 需要验证所有必填字段

### 2. 批量启用 - POST /api/music/enable
### 3. 批量禁用 - POST /api/music/disable
### 4. 批量删除 - POST /api/music/del

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 5. 分页查询 - GET /api/music/page

**功能**: 分页查询音乐列表（支持智能搜索）

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keywords`: 关键词搜索（智能搜索：纯数字先ID匹配，无结果则名称搜索）
- `statusList`: 状态列表（逗号分隔，如：DRAFT,ENABLED）
- `orderBy`: 排序字段（如：id, name, createTime，默认id）
- `orderDirection`: 排序方向（asc/desc，默认desc）

**特殊功能**:
- 支持同时搜索 `name` 和 `displayName` 字段
- 智能搜索：纯数字优先ID匹配，无结果则按名称搜索

### 6. 获取详情 - GET /api/music/detail/{id}

**功能**: 获取音乐详情

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "音乐名称",
    "displayName": "显示名称",
    "audioUrl": "https://example.com/music.mp3",
    "audioDuration": 180,
    "status": "ENABLED",
    "createTime": "2023-01-01T00:00:00.000Z",
    "updateTime": "2023-01-01T00:00:00.000Z"
  }
}
```

## 字段规范

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer(int64) | false | 主键ID |
| name | string | true | 名称 |
| displayName | string | true | 显示名称 |
| audioUrl | string | false | 音频文件地址 |
| audioDuration | integer(int32) | true | 音频时长（秒） |
| status | string | true | 状态 (DRAFT/ENABLED/DISABLED) |

## 枚举值定义

### 状态 (status)
- `DRAFT`: 草稿
- `ENABLED`: 启用
- `DISABLED`: 禁用

## 数据结构特点

### 逻辑删除
- 使用 `is_deleted` 字段实现软删除
- 所有查询自动过滤已删除记录
- 删除操作只更新 `is_deleted` 字段为 1

### 智能搜索
- 支持ID精确匹配和名称模糊搜索的智能切换
- 同时搜索 `name` 和 `displayName` 字段
- 提供更好的用户搜索体验

### 音频时长管理
- 支持音频时长的存储和查询
- 可用于播放时间计算和筛选

## 文件结构

```
backend/
├── routes/music.js                    # 路由文件
├── sql/create_music_table.sql         # 数据库表结构
├── scripts/initMusicTable.js          # 表初始化脚本
├── test/musicApiTest.js               # API测试文件
└── docs/music-module-implementation.md # 文档
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
2. **双字段搜索**: 同时搜索name和displayName字段
3. **草稿保存**: 草稿状态只需验证必要字段，支持快速保存
4. **逻辑删除**: 使用is_deleted字段实现软删除
5. **完整CRUD**: 支持创建、读取、更新、删除的完整操作
6. **批量操作**: 支持批量启用、禁用、删除
7. **参数验证**: 完整的参数验证和错误处理
8. **音频管理**: 专门针对音频文件的管理功能

## 初始化

运行以下命令初始化music表：

```bash
node scripts/initMusicTable.js
```

## 测试

运行以下命令测试music API：

```bash
node test/musicApiTest.js
```

## 使用示例

### 创建音乐
```javascript
POST /api/music/save
{
    "name": "背景音乐1",
    "displayName": "轻松背景音乐",
    "audioUrl": "https://example.com/bg-music-1.mp3",
    "audioDuration": 240,
    "status": "ENABLED"
}
```

### 搜索音乐
```javascript
// 按名称搜索
GET /api/music/page?keywords=背景音乐

// 按状态筛选
GET /api/music/page?statusList=ENABLED,DRAFT

// 按时长排序
GET /api/music/page?orderBy=audioDuration&orderDirection=desc
```

Music模块现在完全按照planReplaceSettings的结构实现，支持完整的音乐管理功能和逻辑删除！
