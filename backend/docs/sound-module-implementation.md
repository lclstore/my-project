# Sound 模块接口实现文档

## 概述

根据提供的 SQL 表结构，完整实现了 sound 音频资源模块的所有接口，包括新增、删除、修改、通过ID查询和列表分页查询功能。

## 数据库表结构

```sql
CREATE TABLE sound (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    name VARCHAR(255) NOT NULL COMMENT '名称',
    genderCode ENUM('FEMALE', 'MALE', 'FEMALE_AND_MALE') NOT NULL COMMENT '性别',
    usageCode ENUM('FLOW', 'GENERAL') NOT NULL COMMENT '用途',
    femaleAudioUrl VARCHAR(500) COMMENT 'Female音频文件地址',
    femaleAudioDuration INT COMMENT 'Female音频时长(秒)',
    maleAudioUrl VARCHAR(500) COMMENT 'Male音频文件地址',
    maleAudioDuration INT COMMENT 'Male音频时长(秒)',
    translation TINYINT(1) NOT NULL COMMENT '是否进行翻译 1是 0否',
    femaleScript TEXT COMMENT 'female 翻译脚本',
    maleScript TEXT COMMENT 'male 翻译脚本',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL COMMENT '状态',
    createTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='音频资源表';
```

## 接口列表

### 1. 保存音频资源（新增/修改合并接口）

**接口地址**: `POST /api/sound/save`

**功能说明**: 
- 有 `id` 参数时为修改操作
- 无 `id` 参数时为新增操作

**请求参数**:
```json
{
  "id": 1,                                    // 可选，修改时必传
  "name": "欢迎语音",                          // 必填
  "genderCode": "FEMALE",                     // 必填，枚举值
  "usageCode": "GENERAL",                     // 必填，枚举值
  "femaleAudioUrl": "https://example.com/female.mp3",
  "femaleAudioDuration": 30,
  "maleAudioUrl": "https://example.com/male.mp3",
  "maleAudioDuration": 35,
  "translation": 1,                           // 必填，0或1
  "femaleScript": "Hello world",
  "maleScript": "Hello world",
  "status": "ENABLED"                         // 必填，枚举值
}
```

**响应示例**:
```json
{
  "success": true,
  "data": { "id": 1 },
  "message": "保存音频资源成功"
}
```

### 2. 删除音频资源

**接口地址**: `POST /api/sound/del`

**请求参数**:
```json
{
  "id": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "删除音频资源成功"
}
```

### 3. 通过ID查询音频资源

**接口地址**: `GET /api/sound/:id`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "欢迎语音",
    "genderCode": "FEMALE",
    "usageCode": "GENERAL",
    "femaleAudioUrl": "https://example.com/female.mp3",
    "femaleAudioDuration": 30,
    "translation": 1,
    "femaleScript": "Hello world",
    "status": "ENABLED",
    "createTime": "2025-08-14 10:30:45",
    "updateTime": "2025-08-14 10:30:45"
  },
  "message": "获取音频资源成功"
}
```

### 4. 分页查询音频资源列表

**接口地址**: `GET /api/sound/page`

**查询参数**:
- `pageSize`: 每页数量（默认10）
- `pageIndex`: 页码（默认1）
- `keywords`: 关键词搜索（支持ID全匹配和name模糊匹配）
- `orderBy`: 排序字段（默认id）
- `orderDirection`: 排序方向（ASC/DESC，默认DESC）

**关键词搜索逻辑**:
- 如果 `keywords` 是纯数字，则进行 ID 全匹配查询
- 如果 `keywords` 包含非数字字符，则进行 name 模糊匹配查询

**响应示例**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "欢迎语音",
      "genderCode": "FEMALE",
      "usageCode": "GENERAL",
      "status": "ENABLED",
      "createTime": "2025-08-14 10:30:45"
    }
  ],
  "pageIndex": 1,
  "pageSize": 10,
  "totalCount": 50,
  "totalPages": 5,
  "notEmpty": true,
  "empty": false
}
```

## 技术特性

### 1. 统一使用公共方法

所有接口都使用 `BusinessHelper` 公共方法，保持代码一致性：
- `BusinessHelper.insertWithValidation()` - 新增
- `BusinessHelper.updateWithValidation()` - 修改  
- `BusinessHelper.paginateWithValidation()` - 分页查询

### 2. 参数验证

使用 `validateApiData()` 进行统一的参数验证：
- 必填字段验证
- 枚举值验证
- 数据类型验证
- URL 格式验证

### 3. 字段转换

自动进行字段格式转换：
- 数据库字段名（snake_case）↔ 前端字段名（camelCase）
- 时间格式化
- 数据类型转换

### 4. 错误处理

统一的错误处理机制：
- 参数错误：400
- 记录不存在：404
- 服务器错误：500

## 文件结构

```
backend/
├── routes/sound.js                    # 路由定义
├── utils/validator.js                 # 验证规则（已添加sound配置）
├── server.js                         # 路由注册
├── sql/create_sound_table.sql        # 建表SQL
├── test/soundPageTest.js             # 分页接口测试
├── test/soundCompleteTest.js         # 完整功能测试
└── docs/sound-module-implementation.md # 本文档
```

## 测试验证

### 测试结果
- ✅ 新增音频资源（save接口）
- ✅ 修改音频资源（save接口带id）
- ✅ 通过ID查询音频资源
- ✅ 分页查询音频资源列表
- ✅ 关键词搜索（ID全匹配）
- ✅ 关键词搜索（名称模糊匹配）
- ✅ 删除音频资源

### 运行测试
```bash
# 测试分页接口
node backend/test/soundPageTest.js

# 测试完整功能
node backend/test/soundCompleteTest.js
```

## 使用示例

### 新增音频资源
```bash
curl -X POST http://localhost:3000/api/sound/save \
  -H "Content-Type: application/json" \
  -d '{
    "name": "欢迎语音",
    "genderCode": "FEMALE",
    "usageCode": "GENERAL",
    "translation": 1,
    "status": "ENABLED"
  }'
```

### 修改音频资源
```bash
curl -X POST http://localhost:3000/api/sound/save \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "name": "欢迎语音（修改）",
    "genderCode": "FEMALE_AND_MALE",
    "usageCode": "FLOW",
    "translation": 1,
    "status": "ENABLED"
  }'
```

### 分页查询
```bash
# 无关键词查询
curl "http://localhost:3000/api/sound/page?pageSize=10&pageIndex=1"

# 关键词搜索
curl "http://localhost:3000/api/sound/page?keywords=欢迎&pageSize=10&pageIndex=1"
```

## 总结

Sound 模块已完整实现，所有接口功能正常，采用了统一的公共方法和错误处理机制，具有良好的可维护性和扩展性。
