# Exercise API 使用示例

## 概述

本文档提供了 Exercise 动作资源管理 API 的详细使用示例，包括各种场景下的请求和响应示例。

## 基础信息

- **Base URL**: `http://localhost:3000/templateCms/web`
- **认证方式**: Bearer Token
- **Content-Type**: `application/json`

## API 接口列表

### 1. 保存动作资源（新增/修改）

**接口地址**: `POST /exercise/save`

#### 1.1 创建草稿状态动作

```bash
curl -X POST "http://localhost:3000/templateCms/web/exercise/save" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "俯卧撑",
    "status": "DRAFT"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 123
  },
  "message": "新增动作资源成功"
}
```

#### 1.2 创建完整状态动作

```bash
curl -X POST "http://localhost:3000/templateCms/web/exercise/save" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
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
    "status": "ENABLED"
  }'
```

#### 1.3 修改现有动作

```bash
curl -X POST "http://localhost:3000/templateCms/web/exercise/save" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "name": "改进版俯卧撑",
    "coverImgUrl": "https://example.com/new-cover.jpg",
    "met": 9,
    "structureTypeCode": "MAIN",
    "genderCode": "MALE",
    "difficultyCode": "ADVANCED",
    "equipmentCode": "NO_EQUIPMENT",
    "positionCode": "STANDING",
    "injuredCodes": ["NONE"],
    "nameAudioUrl": "https://example.com/name.mp3",
    "nameAudioUrlDuration": 3,
    "howtodoScript": "双手撑地，身体保持直线，缓慢上下推动",
    "howtodoAudioUrl": "https://example.com/howtodo.mp3",
    "howtodoAudioUrlDuration": 35,
    "guidanceScript": "注意保持身体直线，控制节奏",
    "guidanceAudioUrl": "https://example.com/guidance.mp3",
    "guidanceAudioUrlDuration": 50,
    "frontVideoUrl": "https://example.com/front.mp4",
    "frontVideoUrlDuration": 65,
    "sideVideoUrl": "https://example.com/side.mp4",
    "sideVideoUrlDuration": 65,
    "status": "ENABLED"
  }'
```

### 2. 通过ID查询动作详情

**接口地址**: `GET /exercise/detail/{id}`

```bash
curl -X GET "http://localhost:3000/templateCms/web/exercise/detail/123" \
  -H "Authorization: Bearer your-token"
```

**响应示例**:
```json
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
    "createTime": "2025-08-14T16:35:32.000Z",
    "updateTime": "2025-08-14T16:35:32.000Z"
  },
  "message": "查询动作资源成功"
}
```

### 3. 分页查询动作列表

**接口地址**: `GET /exercise/page`

#### 3.1 基础分页查询

```bash
curl -X GET "http://localhost:3000/templateCms/web/exercise/page?pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer your-token"
```

#### 3.2 关键词搜索

```bash
# 按名称搜索
curl -X GET "http://localhost:3000/templateCms/web/exercise/page?keywords=俯卧撑&pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer your-token"

# 按ID搜索
curl -X GET "http://localhost:3000/templateCms/web/exercise/page?keywords=123&pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer your-token"
```

#### 3.3 状态筛选

```bash
curl -X GET "http://localhost:3000/templateCms/web/exercise/page?statusList=ENABLED,DRAFT&pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer your-token"
```

#### 3.4 多条件筛选

```bash
curl -X GET "http://localhost:3000/templateCms/web/exercise/page?statusList=ENABLED&structureTypeCodeList=MAIN,WARM_UP&genderCodeList=MALE&difficultyCodeList=INTERMEDIATE,ADVANCED&pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer your-token"
```

#### 3.5 自定义排序

```bash
curl -X GET "http://localhost:3000/templateCms/web/exercise/page?orderBy=createTime&orderDirection=ASC&pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer your-token"
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
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
      "status": "ENABLED",
      "createTime": "2025-08-14T16:35:32.000Z",
      "updateTime": "2025-08-14T16:35:32.000Z"
    },
    {
      "id": 124,
      "name": "深蹲",
      "coverImgUrl": "https://example.com/squat.jpg",
      "met": 6,
      "structureTypeCode": "MAIN",
      "genderCode": "FEMALE",
      "difficultyCode": "BEGINNER",
      "equipmentCode": "NO_EQUIPMENT",
      "positionCode": "STANDING",
      "injuredCodes": ["KNEE"],
      "status": "ENABLED",
      "createTime": "2025-08-14T16:40:15.000Z",
      "updateTime": "2025-08-14T16:40:15.000Z"
    }
  ],
  "pageIndex": 1,
  "pageSize": 10,
  "totalCount": 25,
  "totalPages": 3,
  "notEmpty": true,
  "empty": false,
  "errCode": null,
  "errMessage": null
}
```

## 错误响应示例

### 参数验证错误

```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "【coverImgUrl】为必填项",
  "data": null
}
```

### 名称重复错误

```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "name已存在，请使用其他name",
  "data": null
}
```

### 记录不存在错误

```json
{
  "success": false,
  "errCode": "RECORD_NOT_FOUND",
  "errMessage": "动作资源不存在",
  "data": null
}
```

### 服务器错误

```json
{
  "success": false,
  "errCode": "INTERNAL_ERROR",
  "errMessage": "保存动作资源失败",
  "data": null
}
```

## 枚举值参考

### 结构类型 (structureTypeCode)
- `WARM_UP`: 热身
- `MAIN`: 主要动作
- `COOL_DOWN`: 放松

### 性别 (genderCode)
- `FEMALE`: 女性
- `MALE`: 男性

### 难度 (difficultyCode)
- `BEGINNER`: 初级
- `INTERMEDIATE`: 中级
- `ADVANCED`: 高级

### 器械 (equipmentCode)
- `NO_EQUIPMENT`: 无器械
- `CHAIR`: 椅子

### 部位 (positionCode)
- `STANDING`: 站立
- `SEATED`: 坐姿

### 受伤类型 (injuredCodes)
- `SHOULDER`: 肩部
- `BACK`: 背部
- `WRIST`: 手腕
- `KNEE`: 膝盖
- `ANKLE`: 脚踝
- `HIP`: 髋部
- `NONE`: 无限制

### 状态 (status)
- `DRAFT`: 草稿
- `ENABLED`: 启用
- `DISABLED`: 禁用

## 使用技巧

### 1. 草稿状态的使用
- 创建草稿时只需要 `name` 和 `status` 字段
- 可以逐步完善草稿，最后发布为完整状态
- 草稿状态下的字段验证更宽松

### 2. 智能搜索功能
- 输入纯数字会优先按ID精确匹配
- 如果ID不存在，会自动回退到名称模糊搜索
- 输入文本会直接进行名称模糊搜索

### 3. 多条件筛选
- 多个值用逗号分隔，如：`statusList=ENABLED,DRAFT`
- 可以组合多个筛选条件
- 支持所有枚举字段的筛选

### 4. 分页和排序
- 页码从1开始
- 每页最大100条记录
- 支持按任意字段排序（使用camelCase格式）

## 访问 Swagger 文档

完整的 API 文档可以通过以下地址访问：

- **Swagger UI**: http://localhost:3000/api-docs
- **JSON 格式**: http://localhost:3000/api-docs/json

Swagger 文档提供了交互式的 API 测试界面，可以直接在浏览器中测试所有接口。
