# Sound 模块草稿状态验证

## 概述

Sound 模块的保存接口支持草稿状态的特殊验证逻辑。当状态为草稿（DRAFT）时，只需要验证 `name` 字段，其他字段都是可选的，允许用户保存不完整的数据。

## 验证规则差异

### 1. 完整状态验证（ENABLED/DISABLED）

使用验证规则：`sound`

**必填字段**：
- `name` - 名称
- `genderCode` - 性别代码
- `usageCode` - 用途代码  
- `translation` - 翻译标识
- `status` - 状态

**可选字段**：
- `femaleAudioUrl` - 女声音频URL
- `femaleAudioDuration` - 女声音频时长
- `maleAudioUrl` - 男声音频URL
- `maleAudioDuration` - 男声音频时长
- `femaleScript` - 女声翻译脚本
- `maleScript` - 男声翻译脚本

### 2. 草稿状态验证（DRAFT）

使用验证规则：`sound.draft`

**必填字段**：
- `name` - 名称
- `status` - 状态

**可选字段**：
- `genderCode` - 性别代码（如果提供，需要符合枚举值）
- `usageCode` - 用途代码（如果提供，需要符合枚举值）
- `translation` - 翻译标识（如果提供，需要是0或1）
- `femaleAudioUrl` - 女声音频URL（如果提供，需要是有效URL）
- `femaleAudioDuration` - 女声音频时长（如果提供，需要是整数）
- `maleAudioUrl` - 男声音频URL（如果提供，需要是有效URL）
- `maleAudioDuration` - 男声音频时长（如果提供，需要是整数）
- `femaleScript` - 女声翻译脚本（如果提供，需要是字符串）
- `maleScript` - 男声翻译脚本（如果提供，需要是字符串）

## 技术实现

### 1. 路由层验证逻辑

```javascript
// 根据状态选择验证规则
let validationKey = 'sound';
if (soundData.status === 'DRAFT') {
    validationKey = 'sound.draft';  // 草稿状态只验证必要字段
}

// 使用validator库进行参数验证
const validationResult = validateApiData(validationKey, soundData);
if (!validationResult.valid) {
    return sendError(res, ERROR_CODES.INVALID_PARAMETERS, validationResult.errors.join(', '), 400);
}
```

### 2. 验证规则配置

在 `utils/validator.js` 中定义了两套验证规则：

```javascript
// 完整状态验证
'sound': {
    name: [
        { rule: 'required' },
        { rule: 'string', message: '名称必须是字符串' }
    ],
    genderCode: [
        { rule: 'required' },
        { rule: 'enumFromLib', params: ['BizSoundGenderEnums'], message: '性别值无效' }
    ],
    usageCode: [
        { rule: 'required' },
        { rule: 'enumFromLib', params: ['BizSoundUsageEnums'], message: '用途值无效' }
    ],
    translation: [
        { rule: 'required' },
        { rule: 'enum', params: [[0, 1]], message: '翻译标识必须是0或1' }
    ],
    status: [
        { rule: 'required' },
        { rule: 'enumFromLib', params: ['BizSoundStatusEnums'], message: '状态值无效' }
    ]
    // ... 其他字段
},

// 草稿状态验证 
'sound.draft': {
    name: [
        { rule: 'required' },
        { rule: 'string', message: '名称必须是字符串' }
    ],
}
```

## 使用示例

### 1. 保存草稿（最小数据）

```javascript
// 前端请求
POST /templateCms/web/sound/save
{
    "name": "草稿音频",
    "translation": 0,  // 前端传递默认值
    "status": "DRAFT"
}

// 响应
{
    "success": true,
    "data": { "id": 123 },
    "message": "保存音频资源成功"
}
```

### 2. 保存草稿（部分数据）

```javascript
// 前端请求
POST /templateCms/web/sound/save
{
    "name": "部分草稿音频",
    "genderCode": "FEMALE",
    "femaleAudioUrl": "https://example.com/audio.mp3",
    "translation": 0,
    "status": "DRAFT"
    // 缺少 usageCode - 在草稿状态下允许
}

// 响应
{
    "success": true,
    "data": { "id": 124 },
    "message": "保存音频资源成功"
}
```

### 3. 保存完整状态（必须有所有必填字段）

```javascript
// 前端请求
POST /templateCms/web/sound/save
{
    "name": "完整音频",
    "genderCode": "FEMALE",
    "usageCode": "GENERAL",
    "translation": 1,
    "status": "ENABLED"
}

// 响应
{
    "success": true,
    "data": { "id": 125 },
    "message": "保存音频资源成功"
}
```

### 4. 草稿转为完整状态

```javascript
// 前端请求（更新草稿为启用状态）
POST /templateCms/web/sound/save
{
    "id": 123,
    "name": "草稿音频（已完善）",
    "genderCode": "FEMALE",
    "usageCode": "GENERAL", 
    "translation": 1,
    "status": "ENABLED"  // 从 DRAFT 改为 ENABLED
}

// 响应
{
    "success": true,
    "data": { "id": 123 },
    "message": "保存音频资源成功"
}
```

## 错误处理

### 1. 草稿状态缺少 name 字段

```json
{
    "success": false,
    "errCode": "INVALID_PARAMETERS",
    "errMessage": "【name】为必填项",
    "data": null
}
```

### 2. 完整状态缺少必填字段

```json
{
    "success": false,
    "errCode": "INVALID_PARAMETERS", 
    "errMessage": "【genderCode】为必填项, 性别值无效必须是以下值之一: FEMALE, MALE, FEMALE_AND_MALE, 【usageCode】为必填项, 用途值无效必须是以下值之一: FLOW, GENERAL",
    "data": null
}
```

### 3. 字段格式错误（草稿和完整状态都会验证）

```json
{
    "success": false,
    "errCode": "INVALID_PARAMETERS",
    "errMessage": "性别值无效必须是以下值之一: FEMALE, MALE, FEMALE_AND_MALE",
    "data": null
}
```

## 业务场景

### 1. 用户创建草稿

用户开始创建音频资源，但还没有完善所有信息：
- 只填写了名称
- 可能选择了部分字段
- 保存为草稿状态，稍后继续编辑

### 2. 草稿完善后发布

用户完善了所有必填信息：
- 补充了性别、用途等必填字段
- 上传了音频文件
- 将状态从草稿改为启用

### 3. 直接创建完整记录

用户一次性填写了所有必填信息：
- 直接保存为启用状态
- 跳过草稿阶段

## 测试验证

运行测试验证功能：

```bash
# 运行草稿状态验证测试
node backend/test/soundDraftValidationSimpleTest.js
```

测试覆盖：
- ✅ 草稿状态只验证 name 字段
- ✅ 完整状态验证所有必填字段
- ✅ 草稿可以保存不完整数据
- ✅ 草稿可以更新为完整状态
- ✅ 验证规则根据状态动态选择

## 总结

通过实现草稿状态的特殊验证逻辑，Sound 模块支持了灵活的数据保存方式：

1. **用户友好**：允许用户保存不完整的数据作为草稿
2. **数据完整性**：确保正式发布的数据包含所有必填信息
3. **灵活验证**：根据状态动态选择验证规则
4. **渐进式完善**：支持从草稿逐步完善到完整状态

这种设计模式可以应用到其他需要草稿功能的模块中。
