# Playlist 模块实现文档

## 概述

Playlist 模块提供了完整的播放列表管理功能，包括播放列表的创建、更新、查询、批量操作等功能。支持逻辑删除、音乐关联管理和完整的CRUD操作。

## 数据库设计

### 主表：playlist
```sql
CREATE TABLE IF NOT EXISTS playlist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '名称',
    type ENUM('REGULAR', 'YOGA', 'DANCE') DEFAULT 'REGULAR' COMMENT '类型',
    premium TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要订阅（0不需要 1需要）',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='playlist播放列表表';
```

### 关联表：playlist_music
```sql
CREATE TABLE IF NOT EXISTS playlist_music (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    playlist_id BIGINT NOT NULL COMMENT 'playlist ID',
    biz_music_id BIGINT NOT NULL COMMENT 'music ID',
    premium TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要订阅（0不需要 1需要）',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE
) COMMENT='playlist music关联表';
```

### 索引设计
- **playlist表**: name, type, premium, status, is_deleted
- **playlist_music表**: playlist_id, biz_music_id, sort_order

## API 接口

### 1. 保存播放列表 - POST /api/playlist/save

**功能**: 创建或更新播放列表

**请求参数**:
```json
{
  "id": 1,                        // 可选，更新时需要
  "name": "播放列表名称",          // 必填
  "type": "REGULAR",               // 可选，枚举值
  "premium": 0,                    // 必填，0或1
  "status": "DRAFT",               // 必填，枚举值
  "musicList": [                   // 可选
    {
      "bizMusicId": 1,             // music ID
      "premium": 0                 // 是否需要订阅
    }
  ]
}
```

**验证规则**:
- **草稿状态** (`status: "DRAFT"`): 只需要验证 `name`、`premium` 和 `status`
- **启用/禁用状态**: 需要验证所有必填字段

### 2. 批量启用 - POST /api/playlist/enable
### 3. 批量禁用 - POST /api/playlist/disable
### 4. 批量删除 - POST /api/playlist/del

**请求参数**:
```json
{
  "idList": [1, 2, 3]
}
```

### 5. 分页查询 - GET /api/playlist/page

**功能**: 分页查询播放列表（支持智能搜索，包含musicCount）

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keywords`: 关键词搜索（智能搜索：纯数字先ID匹配，无结果则名称搜索）
- `statusList`: 状态列表（逗号分隔，如：DRAFT,ENABLED）
- `typeList`: 类型列表（逗号分隔，如：REGULAR,YOGA）
- `premium`: 是否需要订阅（0或1）
- `orderBy`: 排序字段（如：id, name, createTime，默认id）
- `orderDirection`: 排序方向（asc/desc，默认desc）

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "播放列表名称",
      "type": "REGULAR",
      "premium": 0,
      "status": "ENABLED",
      "musicCount": 3
    }
  ]
}
```

### 6. 获取详情 - GET /api/playlist/detail/{id}

**功能**: 获取播放列表详情（包含完整的musicList和music信息）

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "播放列表名称",
    "type": "REGULAR",
    "premium": 0,
    "status": "ENABLED",
    "musicList": [
      {
        "bizMusicId": 1,
        "premium": 0,
        "sortOrder": 1,
        "id": 1,
        "name": "音乐名称",
        "displayName": "音乐显示名称",
        "audioUrl": "https://example.com/music.mp3",
        "audioDuration": 180,
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

## 字段规范

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer(int64) | false | 主键ID |
| name | string | true | 名称 |
| type | string | false | 类型 (REGULAR/YOGA/DANCE) |
| premium | integer(int32) | true | 是否需要订阅（0不需要 1需要） |
| status | string | true | 状态 (DRAFT/ENABLED/DISABLED) |
| musicList | array | false | music列表 |
| └─ bizMusicId | integer(int64) | false | music ID（关联字段） |
| └─ premium | integer(int32) | false | 是否需要订阅（0不需要 1需要） |
| └─ sortOrder | integer(int32) | false | 排序顺序 |
| └─ id | integer(int64) | false | 音乐ID（转换后字段） |
| └─ name | string | false | 音乐名称 |
| └─ displayName | string | false | 音乐显示名称 |
| └─ audioUrl | string | false | 音频文件地址 |
| └─ audioDuration | integer(int32) | false | 音频时长 |
| └─ status | string | false | 音乐状态 |
| └─ createTime | string | false | 音乐创建时间 |
| └─ updateTime | string | false | 音乐更新时间 |

## 枚举值定义

### 类型 (type)
- `REGULAR`: 常规
- `YOGA`: 瑜伽
- `DANCE`: 舞蹈

### 订阅状态 (premium)
- `0`: 不需要订阅
- `1`: 需要订阅

### 状态 (status)
- `DRAFT`: 草稿
- `ENABLED`: 启用
- `DISABLED`: 禁用

## 数据结构特点

### 二层关联结构
1. **playlist**: 主播放列表表
2. **playlist_music**: 音乐关联表（一对多）

### 响应数据结构
- **分页查询**: 返回 `musicCount` 字段（music数量）
- **详情查询**: 返回完整的 `musicList` 数组（包含完整的music信息）

### 级联删除
- 删除播放列表时，自动删除关联的music记录
- 支持逻辑删除和物理删除

### 排序支持
- music按`sort_order`排序
- 支持自定义音乐播放顺序

## 文件结构

```
backend/
├── routes/playlist.js                    # 路由文件
├── sql/create_playlist_table.sql         # 数据库表结构（2个表）
├── scripts/initPlaylistTable.js          # 表初始化脚本
├── test/playlistApiTest.js               # API测试文件
└── docs/playlist-module-implementation.md # 文档
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
2. **多维筛选**: 支持按状态、类型、订阅状态筛选
3. **草稿保存**: 草稿状态只需验证必要字段，支持快速保存
4. **逻辑删除**: 使用is_deleted字段实现软删除
5. **音乐管理**: 支持音乐列表的完整管理和排序
6. **级联操作**: 自动处理关联数据的创建、更新、删除
7. **订阅控制**: 支持播放列表和单个音乐的订阅控制
8. **类型分类**: 支持不同类型的播放列表管理

## 初始化

运行以下命令初始化playlist表：

```bash
node scripts/initPlaylistTable.js
```

## 测试

运行以下命令测试playlist API：

```bash
node test/playlistApiTest.js
```

## 使用示例

### 创建播放列表
```javascript
POST /api/playlist/save
{
    "name": "瑜伽音乐合集",
    "type": "YOGA",
    "premium": 1,
    "status": "ENABLED",
    "musicList": [
        {
            "bizMusicId": 1,
            "premium": 0
        },
        {
            "bizMusicId": 2,
            "premium": 1
        }
    ]
}
```

### 搜索播放列表
```javascript
// 按名称搜索
GET /api/playlist/page?keywords=瑜伽

// 按类型和订阅状态筛选
GET /api/playlist/page?typeList=YOGA,DANCE&premium=1

// 按状态筛选
GET /api/playlist/page?statusList=ENABLED,DRAFT
```

Playlist模块现在完全按照music模块的结构实现，支持完整的播放列表管理功能和音乐关联管理！
