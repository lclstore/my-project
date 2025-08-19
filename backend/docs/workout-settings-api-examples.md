# WorkoutSettings API 使用示例

## 概述

WorkoutSettings 模块管理训练设置的单例配置，系统中只会维护一条设置记录。支持创建、更新和查询操作。

## 基础信息

- **Base URL**: `http://localhost:3000/templateCms/web`
- **认证方式**: Bearer Token
- **Content-Type**: `application/json`

## API 接口

### 1. 查询训练设置详情

**接口地址**: `GET /workoutSettings/detail`

```bash
curl -X GET "http://localhost:3000/templateCms/web/workoutSettings/detail" \
  -H "Authorization: Bearer your-token"
```

**响应示例**:

**有设置数据时**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "introVideoReps": 3,
    "introAudioBizSoundId": 101,
    "introAudioStartTime": 5,
    "introAudioClosed": true,
    "previewVideoReps": 2,
    "previewFirstAudioBizSoundId": 102,
    "previewFirstAudioStartTime": 3,
    "previewFirstAudioClosed": false,
    "executionGoAudioBizSoundId": 108,
    "executionGoAudioStartTime": 0,
    "executionGoAudioClosed": false,
    "executionVideoReps": 1,
    "executionHalfwayAudioBizSoundIds": [114, 115, 116],
    "introVideoCycleCode": "FRONT_TO_SIDE",
    "previewVideoCycleCode": "SIDE_TO_FRONT",
    "executionVideoCycleCode": "FRONT_TO_SIDE",
    "status": "ENABLED",
    "createTime": "2025-08-14T17:54:58.000Z",
    "updateTime": "2025-08-14T17:54:58.000Z"
  },
  "message": "查询训练设置成功"
}
```

**无设置数据时**:
```json
{
  "success": true,
  "data": null,
  "message": "暂无训练设置"
}
```

### 2. 保存训练设置

**接口地址**: `POST /workoutSettings/save`

#### 2.1 创建草稿设置

```bash
curl -X POST "http://localhost:3000/templateCms/web/workoutSettings/save" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DRAFT"
  }'
```

#### 2.2 创建/更新完整设置

```bash
curl -X POST "http://localhost:3000/templateCms/web/workoutSettings/save" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "introVideoReps": 3,
    "introAudioBizSoundId": 101,
    "introAudioStartTime": 5,
    "introAudioClosed": true,
    "previewVideoReps": 2,
    "previewFirstAudioBizSoundId": 102,
    "previewFirstAudioStartTime": 3,
    "previewFirstAudioClosed": false,
    "previewNextAudioBizSoundId": 103,
    "previewNextAudioStartTime": 2,
    "previewNextAudioClosed": true,
    "previewLastAudioBizSoundId": 104,
    "previewLastAudioStartTime": 1,
    "previewLastAudioClosed": true,
    "previewNameAudioStartTime": 0,
    "previewNameAudioClosed": false,
    "previewThreeAudioBizSoundId": 105,
    "previewThreeAudioEndTime": 10,
    "previewThreeAudioClosed": true,
    "previewTwoAudioBizSoundId": 106,
    "previewTwoAudioEndTime": 8,
    "previewTwoAudioClosed": true,
    "previewOneAudioBizSoundId": 107,
    "previewOneAudioEndTime": 6,
    "previewOneAudioClosed": true,
    "executionGoAudioBizSoundId": 108,
    "executionGoAudioStartTime": 0,
    "executionGoAudioClosed": false,
    "executionVideoReps": 1,
    "executionGuidanceAudioStartTime": 5,
    "executionGuidanceAudioClosed": true,
    "executionHalfwayAudioStartTime": 15,
    "executionHalfwayAudioClosed": true,
    "executionThreeAudioBizSoundId": 109,
    "executionThreeAudioEndTime": 25,
    "executionThreeAudioClosed": true,
    "executionTwoAudioBizSoundId": 110,
    "executionTwoAudioEndTime": 27,
    "executionTwoAudioClosed": true,
    "executionOneAudioBizSoundId": 111,
    "executionOneAudioEndTime": 29,
    "executionOneAudioClosed": true,
    "executionBeepAudioBizSoundId": 112,
    "executionBeepAudioEndTime": 30,
    "executionBeepAudioClosed": false,
    "executionRestAudioBizSoundId": 113,
    "executionRestAudioEndTime": 60,
    "executionRestAudioClosed": true,
    "executionHalfwayAudioBizSoundIds": [114, 115, 116],
    "introVideoCycleCode": "FRONT_TO_SIDE",
    "previewVideoCycleCode": "SIDE_TO_FRONT",
    "executionVideoCycleCode": "FRONT_TO_SIDE",
    "status": "ENABLED"
  }'
```

**成功响应示例**:

**创建时**:
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "创建训练设置成功"
}
```

**更新时**:
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "更新训练设置成功"
}
```

## 字段说明

### Intro Video 相关
- `introVideoReps`: intro video 播放次数
- `introAudioBizSoundId`: intro audio 对应的 sound ID
- `introAudioStartTime`: intro audio 开始时间(秒)
- `introAudioClosed`: intro audio 是否可关闭
- `introVideoCycleCode`: intro video 循环模式

### Preview Video 相关
- `previewVideoReps`: preview video 播放次数
- `previewFirstAudioBizSoundId`: preview first audio 对应的 sound ID
- `previewFirstAudioStartTime`: preview first audio 开始时间(秒)
- `previewFirstAudioClosed`: preview first audio 是否可关闭
- `previewNextAudioBizSoundId`: preview next audio 对应的 sound ID
- `previewNextAudioStartTime`: preview next audio 开始时间(秒)
- `previewNextAudioClosed`: preview next audio 是否可关闭
- `previewLastAudioBizSoundId`: preview last audio 对应的 sound ID
- `previewLastAudioStartTime`: preview last audio 开始时间(秒)
- `previewLastAudioClosed`: preview last audio 是否可关闭
- `previewNameAudioStartTime`: preview name audio 开始时间(秒)
- `previewNameAudioClosed`: preview name audio 是否可关闭
- `previewThreeAudioBizSoundId`: preview 3 audio 对应的 sound ID
- `previewThreeAudioEndTime`: preview 3 audio 结束时间(秒)
- `previewThreeAudioClosed`: preview 3 audio 是否可关闭
- `previewTwoAudioBizSoundId`: preview 2 audio 对应的 sound ID
- `previewTwoAudioEndTime`: preview 2 audio 结束时间(秒)
- `previewTwoAudioClosed`: preview 2 audio 是否可关闭
- `previewOneAudioBizSoundId`: preview 1 audio 对应的 sound ID
- `previewOneAudioEndTime`: preview 1 audio 结束时间(秒)
- `previewOneAudioClosed`: preview 1 audio 是否可关闭
- `previewVideoCycleCode`: preview video 循环模式

### Execution 相关
- `executionGoAudioBizSoundId`: execution go audio 对应的 sound ID
- `executionGoAudioStartTime`: execution go audio 开始时间(秒)
- `executionGoAudioClosed`: execution go audio 是否可关闭
- `executionVideoReps`: execution video 播放次数
- `executionGuidanceAudioStartTime`: execution guidance audio 开始时间(秒)
- `executionGuidanceAudioClosed`: execution guidance audio 是否可关闭
- `executionHalfwayAudioStartTime`: execution halfway audio 开始时间(秒)
- `executionHalfwayAudioClosed`: execution halfway audio 是否可关闭
- `executionThreeAudioBizSoundId`: execution 3 audio 对应的 sound ID
- `executionThreeAudioEndTime`: execution 3 audio 结束时间(秒)
- `executionThreeAudioClosed`: execution 3 audio 是否可关闭
- `executionTwoAudioBizSoundId`: execution 2 audio 对应的 sound ID
- `executionTwoAudioEndTime`: execution 2 audio 结束时间(秒)
- `executionTwoAudioClosed`: execution 2 audio 是否可关闭
- `executionOneAudioBizSoundId`: execution 1 audio 对应的 sound ID
- `executionOneAudioEndTime`: execution 1 audio 结束时间(秒)
- `executionOneAudioClosed`: execution 1 audio 是否可关闭
- `executionBeepAudioBizSoundId`: execution beep audio 对应的 sound ID
- `executionBeepAudioEndTime`: execution beep audio 结束时间(秒)
- `executionBeepAudioClosed`: execution beep audio 是否可关闭
- `executionRestAudioBizSoundId`: execution rest audio 对应的 sound ID
- `executionRestAudioEndTime`: execution rest audio 结束时间(秒)
- `executionRestAudioClosed`: execution rest audio 是否可关闭
- `executionHalfwayAudioBizSoundIds`: execution halfway audio 对应的 sound ID 数组
- `executionVideoCycleCode`: execution video 循环模式

### 枚举值

#### Video Cycle Code
- `FRONT_TO_SIDE`: 从正面到侧面
- `SIDE_TO_FRONT`: 从侧面到正面

#### Status
- `DRAFT`: 草稿
- `ENABLED`: 启用
- `DISABLED`: 禁用

## 错误响应示例

### 参数验证错误
```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "【status】为必填项",
  "data": null
}
```

### 枚举值错误
```json
{
  "success": false,
  "errCode": "INVALID_PARAMETERS",
  "errMessage": "status 值无效，允许的值: DRAFT, ENABLED, DISABLED",
  "data": null
}
```

### 服务器错误
```json
{
  "success": false,
  "errCode": "INTERNAL_ERROR",
  "errMessage": "保存训练设置失败",
  "data": null
}
```

## 特性说明

### 1. 单例模式
- 系统中只维护一条训练设置记录
- 首次保存时创建记录，后续保存时更新现有记录
- ID 保持不变，确保配置的一致性

### 2. 草稿状态支持
- 支持草稿状态的灵活保存
- 草稿状态下只需要 `status` 字段
- 可以逐步完善配置后发布

### 3. JSON 字段支持
- `executionHalfwayAudioBizSoundIds` 字段支持数组格式
- 自动进行 JSON 序列化和反序列化
- 前端接收到的是解析后的数组格式

### 4. 字段自动转换
- 请求时：camelCase → snake_case
- 响应时：snake_case → camelCase
- 自动过滤内部字段（如 `is_deleted`）

## 访问 Swagger 文档

完整的 API 文档可以通过以下地址访问：
- **Swagger UI**: http://localhost:3000/api-docs
- **JSON 格式**: http://localhost:3000/api-docs/json

在 Swagger 文档中可以找到 "WorkoutSetttings" 分组，包含详细的接口说明和交互式测试功能。
