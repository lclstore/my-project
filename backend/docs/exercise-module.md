# Exercise 动作资源模块

## 概述

Exercise 模块提供动作资源的完整管理功能，包括新增、修改、查询和分页列表等操作。支持草稿状态的灵活保存和智能搜索功能。

## 数据库表结构

### exercise 表

```sql
CREATE TABLE exercise (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    name VARCHAR(255) NOT NULL COMMENT '动作名称',
    cover_img_url VARCHAR(500) DEFAULT NULL COMMENT '封面图',
    met BIGINT DEFAULT NULL COMMENT 'met',
    structure_type_code ENUM('WARM_UP', 'MAIN', 'COOL_DOWN') DEFAULT NULL COMMENT '结构类型code',
    gender_code ENUM('FEMALE', 'MALE') DEFAULT NULL COMMENT '性别code',
    difficulty_code ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT NULL COMMENT '难度code',
    equipment_code ENUM('NO_EQUIPMENT', 'CHAIR') DEFAULT NULL COMMENT '器械code',
    position_code ENUM('STANDING', 'SEATED') DEFAULT NULL COMMENT '部位code',
    injured_codes JSON DEFAULT NULL COMMENT '受伤类型code数组',
    name_audio_url VARCHAR(500) DEFAULT NULL COMMENT '名称音频地址',
    name_audio_url_duration INT DEFAULT NULL COMMENT '名称音频时长(秒)',
    howtodo_script TEXT DEFAULT NULL COMMENT 'How to do文本',
    howtodo_audio_url VARCHAR(500) DEFAULT NULL COMMENT 'How to do音频',
    howtodo_audio_url_duration INT DEFAULT NULL COMMENT 'How to do音频时长(秒)',
    guidance_script TEXT DEFAULT NULL COMMENT '指导文本',
    guidance_audio_url VARCHAR(500) DEFAULT NULL COMMENT '指导音频地址',
    guidance_audio_url_duration INT DEFAULT NULL COMMENT '指导音频时长(秒)',
    front_video_url VARCHAR(500) DEFAULT NULL COMMENT '正机位视频地址',
    front_video_url_duration INT DEFAULT NULL COMMENT '正机位视频时长(秒)',
    side_video_url VARCHAR(500) DEFAULT NULL COMMENT '侧机位视频地址',
    side_video_url_duration INT DEFAULT NULL COMMENT '侧机位视频时长(秒)',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='动作资源表';
```

### 枚举值定义

```javascript
const EXERCISE_ENUMS = {
    STRUCTURE_TYPE: ['WARM_UP', 'MAIN', 'COOL_DOWN'],      // 结构类型
    GENDER: ['FEMALE', 'MALE'],                            // 性别
    DIFFICULTY: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],  // 难度
    EQUIPMENT: ['NO_EQUIPMENT', 'CHAIR'],                  // 器械
    POSITION: ['STANDING', 'SEATED'],                      // 部位
    INJURED: ['SHOULDER', 'BACK', 'WRIST', 'KNEE', 'ANKLE', 'HIP', 'NONE'], // 受伤类型
    STATUS: ['DRAFT', 'ENABLED', 'DISABLED']               // 状态
};
```

## API 接口

### 1. 保存动作资源（新增/修改）

**接口地址**: `POST /templateCms/web/exercise/save`

**功能说明**: 新增或修改动作资源信息，支持草稿状态的灵活保存

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 否 | 动作资源ID（修改时必填） |
| name | string | 是 | 动作名称 |
| coverImgUrl | string | 否* | 封面图URL |
| met | integer | 否* | MET值 |
| structureTypeCode | string | 否* | 结构类型（WARM_UP/MAIN/COOL_DOWN） |
| genderCode | string | 否* | 性别（FEMALE/MALE） |
| difficultyCode | string | 否* | 难度（BEGINNER/INTERMEDIATE/ADVANCED） |
| equipmentCode | string | 否* | 器械（NO_EQUIPMENT/CHAIR） |
| positionCode | string | 否* | 部位（STANDING/SEATED） |
| injuredCodes | array | 否 | 受伤类型数组 |
| nameAudioUrl | string | 否* | 名称音频地址 |
| nameAudioUrlDuration | integer | 否* | 名称音频时长(秒) |
| howtodoScript | string | 否* | How to do文本 |
| howtodoAudioUrl | string | 否* | How to do音频地址 |
| howtodoAudioUrlDuration | integer | 否* | How to do音频时长(秒) |
| guidanceScript | string | 否 | 指导文本 |
| guidanceAudioUrl | string | 否* | 指导音频地址 |
| guidanceAudioUrlDuration | integer | 否* | 指导音频时长(秒) |
| frontVideoUrl | string | 否* | 正机位视频地址 |
| frontVideoUrlDuration | integer | 否* | 正机位视频时长(秒) |
| sideVideoUrl | string | 否* | 侧机位视频地址 |
| sideVideoUrlDuration | integer | 否* | 侧机位视频时长(秒) |
| status | string | 是 | 状态（DRAFT/ENABLED/DISABLED） |

> *注：标记为"否*"的字段在草稿状态（DRAFT）下为可选，在启用/禁用状态下为必填

**请求示例**:

```javascript
// 草稿状态（最小数据）
{
    "name": "俯卧撑",
    "status": "DRAFT"
}

// 完整状态
{
    "name": "标准俯卧撑",
    "coverImgUrl": "https://example.com/cover.jpg",
    "met": 8,
    "structureTypeCode": "MAIN",
    "genderCode": "MALE",
    "difficultyCode": "INTERMEDIATE",
    "equipmentCode": "NO_EQUIPMENT",
    "positionCode": "STANDING",
    "injuredCodes": ["NONE"],
    "nameAudioUrl": "https://example.com/name.mp3",
    "nameAudioUrlDuration": 3,
    "howtodoScript": "双手撑地，身体保持直线，上下推动",
    "howtodoAudioUrl": "https://example.com/howtodo.mp3",
    "howtodoAudioUrlDuration": 30,
    "guidanceAudioUrl": "https://example.com/guidance.mp3",
    "guidanceAudioUrlDuration": 45,
    "frontVideoUrl": "https://example.com/front.mp4",
    "frontVideoUrlDuration": 60,
    "sideVideoUrl": "https://example.com/side.mp4",
    "sideVideoUrlDuration": 60,
    "status": "ENABLED"
}
```

**响应示例**:

```javascript
// 成功
{
    "success": true,
    "data": { "id": 123 },
    "message": "新增动作资源成功"
}

// 失败
{
    "success": false,
    "errCode": "INVALID_PARAMETERS",
    "errMessage": "name已存在，请使用其他name",
    "data": null
}
```

### 2. 通过ID查询动作资源

**接口地址**: `GET /templateCms/web/exercise/{id}`

**功能说明**: 根据ID获取单个动作资源的详细信息

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 动作资源ID |

**响应示例**:

```javascript
{
    "success": true,
    "data": {
        "id": 123,
        "name": "标准俯卧撑",
        "coverImgUrl": "https://example.com/cover.jpg",
        "met": 8,
        "structureTypeCode": "MAIN",
        "genderCode": "MALE",
        "difficultyCode": "INTERMEDIATE",
        "equipmentCode": "NO_EQUIPMENT",
        "positionCode": "STANDING",
        "injuredCodes": ["NONE"],
        "nameAudioUrl": "https://example.com/name.mp3",
        "nameAudioUrlDuration": 3,
        "howtodoScript": "双手撑地，身体保持直线，上下推动",
        "howtodoAudioUrl": "https://example.com/howtodo.mp3",
        "howtodoAudioUrlDuration": 30,
        "guidanceScript": "注意保持身体直线",
        "guidanceAudioUrl": "https://example.com/guidance.mp3",
        "guidanceAudioUrlDuration": 45,
        "frontVideoUrl": "https://example.com/front.mp4",
        "frontVideoUrlDuration": 60,
        "sideVideoUrl": "https://example.com/side.mp4",
        "sideVideoUrlDuration": 60,
        "status": "ENABLED",
        "createTime": "2025-08-14 16:35:32",
        "updateTime": "2025-08-14 16:35:32"
    },
    "message": "查询动作资源成功"
}
```

### 3. 分页查询动作资源列表

**接口地址**: `GET /templateCms/web/exercise/page`

**功能说明**: 分页获取动作资源列表，支持关键词搜索和多条件筛选

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keywords | string | 否 | 关键词搜索（支持ID精确匹配和名称模糊搜索） |
| statusList | string | 否 | 状态筛选，多个用逗号分隔 |
| structureTypeCodeList | string | 否 | 结构类型筛选，多个用逗号分隔 |
| genderCodeList | string | 否 | 性别筛选，多个用逗号分隔 |
| difficultyCodeList | string | 否 | 难度筛选，多个用逗号分隔 |
| equipmentCodeList | string | 否 | 器械筛选，多个用逗号分隔 |
| positionCodeList | string | 否 | 部位筛选，多个用逗号分隔 |
| pageIndex | integer | 否 | 页码（默认1） |
| pageSize | integer | 否 | 每页数量（默认10） |
| orderBy | string | 否 | 排序字段（默认id） |
| orderDirection | string | 否 | 排序方向（ASC/DESC，默认DESC） |

**请求示例**:

```
GET /templateCms/web/exercise/page?keywords=俯卧撑&statusList=ENABLED,DRAFT&genderCodeList=MALE&pageIndex=1&pageSize=10
```

**响应示例**:

```javascript
{
    "success": true,
    "data": {
        "list": [
            {
                "id": 123,
                "name": "标准俯卧撑",
                "coverImgUrl": "https://example.com/cover.jpg",
                "structureTypeCode": "MAIN",
                "genderCode": "MALE",
                "difficultyCode": "INTERMEDIATE",
                "status": "ENABLED",
                "createTime": "2025-08-14 16:35:32"
            }
        ],
        "total": 1,
        "pageIndex": 1,
        "pageSize": 10,
        "totalPages": 1
    },
    "message": "查询动作资源列表成功"
}
```

## 核心特性

### 1. 草稿状态支持

- **灵活保存**: 草稿状态下只需要 `name` 字段，其他字段都是可选的
- **渐进完善**: 支持从草稿逐步完善到完整状态
- **验证规则**: 根据状态动态选择验证规则（`exercise` vs `exercise.draft`）

### 2. 名称唯一性验证

- **新增检查**: 创建时检查名称是否重复
- **修改检查**: 更新时检查是否与其他记录重名
- **自身保持**: 允许保持自己当前的名称

### 3. 智能搜索功能

- **ID精确匹配**: 纯数字关键词优先按ID搜索
- **名称模糊搜索**: 文本关键词按名称模糊匹配
- **回退策略**: ID无结果时自动回退到名称搜索

### 4. 多条件筛选

支持按以下条件进行筛选：
- 状态（DRAFT/ENABLED/DISABLED）
- 结构类型（WARM_UP/MAIN/COOL_DOWN）
- 性别（FEMALE/MALE）
- 难度（BEGINNER/INTERMEDIATE/ADVANCED）
- 器械（NO_EQUIPMENT/CHAIR）
- 部位（STANDING/SEATED）

### 5. 字段自动转换

- **请求转换**: 前端字段名（camelCase）→ 数据库字段名（snake_case）
- **响应转换**: 数据库字段名（snake_case）→ 前端字段名（camelCase）
- **时间格式化**: 自动格式化时间字段为可读格式

## 测试验证

### 运行测试

```bash
# 创建表
node backend/test/createExerciseTable.js

# 简单功能测试
node backend/test/exerciseSimpleTest.js

# 完整功能测试
node backend/test/exerciseTest.js
```

### 测试覆盖

- ✅ 草稿状态创建（只需要name字段）
- ✅ 完整状态创建（需要所有必填字段）
- ✅ 通过ID查询动作资源
- ✅ 修改动作资源（草稿转完整）
- ✅ 名称重复验证
- ✅ 分页查询功能
- ✅ 关键词搜索（名称和ID）
- ✅ 多条件筛选（状态、性别等）
- ✅ 字段自动转换

## 总结

Exercise 动作资源模块提供了完整的动作资源管理功能，具有以下优势：

1. **灵活性**: 支持草稿状态的灵活保存
2. **完整性**: 确保正式发布的数据包含所有必填信息
3. **智能性**: 智能搜索和多条件筛选
4. **一致性**: 统一的字段转换和验证规则
5. **可靠性**: 名称唯一性验证和数据完整性保障

该模块为健身应用的动作资源管理提供了强大而灵活的后端支持。
