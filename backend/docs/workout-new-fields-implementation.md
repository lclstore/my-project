# Workout 表新增字段实现总结

## 新增字段概述

为workout表新增了两个字段，用于支持分组管理和页面展示控制：

1. **group_code**: 分组代码，ENUM类型
2. **show_in_page**: 是否在app的category页面展示，TINYINT(1)类型

## 数据库字段定义

### 1. group_code 字段

```sql
ALTER TABLE workout 
ADD COLUMN group_code ENUM('GROUPA','GROUPB','GROUPC','GROUPD','GROUPE','GROUPF','GROUPG') 
DEFAULT 'GROUPA' 
COMMENT '分组代码' 
AFTER audio_json_languages;
```

**字段特性**:
- **类型**: ENUM
- **可选值**: GROUPA, GROUPB, GROUPC, GROUPD, GROUPE, GROUPF, GROUPG
- **默认值**: GROUPA
- **用途**: 对workout进行分组管理

### 2. show_in_page 字段

```sql
ALTER TABLE workout 
ADD COLUMN show_in_page TINYINT(1) 
DEFAULT 1 
COMMENT '是否要在app的category页面展示' 
AFTER group_code;
```

**字段特性**:
- **类型**: TINYINT(1)
- **可选值**: 0 (不展示), 1 (展示)
- **默认值**: 1
- **用途**: 控制workout是否在app的category页面中显示

## 代码实现更新

### 1. Workout保存接口更新

#### UPDATE语句修改

```javascript
const updateSql = `
    UPDATE workout SET
        name = ?, description = ?, premium = ?, new_start_time = ?, new_end_time = ?,
        cover_img_url = ?, detail_img_url = ?, thumbnail_img_url = ?, complete_img_url = ?,
        gender_code = ?, difficulty_code = ?, position_code = ?, calorie = ?, duration = ?,
        status = ?, group_code = ?, show_in_page = ?, update_time = NOW()
    WHERE id = ? AND is_deleted = 0
`;

const updateParams = sanitizeParams([
    workoutData.name, workoutData.description, workoutData.premium,
    workoutData.newStartTime, workoutData.newEndTime,
    workoutData.coverImgUrl, workoutData.detailImgUrl,
    workoutData.thumbnailImgUrl, workoutData.completeImgUrl,
    workoutData.genderCode, workoutData.difficultyCode, workoutData.positionCode,
    workoutData.calorie, workoutData.duration, workoutData.status,
    workoutData.groupCode, workoutData.showInPage, workoutId
]);
```

#### INSERT语句修改

```javascript
const insertSql = `
    INSERT INTO workout (
        name, description, premium, new_start_time, new_end_time,
        cover_img_url, detail_img_url, thumbnail_img_url, complete_img_url,
        gender_code, difficulty_code, position_code, calorie, duration, status,
        group_code, show_in_page
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const insertParams = sanitizeParams([
    workoutData.name, workoutData.description, workoutData.premium,
    workoutData.newStartTime, workoutData.newEndTime,
    workoutData.coverImgUrl, workoutData.detailImgUrl,
    workoutData.thumbnailImgUrl, workoutData.completeImgUrl,
    workoutData.genderCode, workoutData.difficultyCode, workoutData.positionCode,
    workoutData.calorie, workoutData.duration, workoutData.status,
    workoutData.groupCode, workoutData.showInPage
]);
```

### 2. Category详情查询更新

```javascript
const workoutSql = `
    SELECT w.id, w.name, w.description, w.premium, w.new_start_time, w.new_end_time,
           w.cover_img_url, w.detail_img_url, w.thumbnail_img_url, w.complete_img_url,
           w.gender_code, w.difficulty_code, w.position_code, w.calorie, w.duration,
           w.status, w.file_status, w.audio_json_languages, w.group_code, w.show_in_page,
           cw.sort_order
    FROM category_workout cw
    INNER JOIN workout w ON cw.workout_id = w.id AND w.is_deleted = 0
    WHERE cw.category_id = ?
    ORDER BY cw.sort_order, w.id
`;
```

## 前端接口规范

### 1. Workout保存接口

**请求参数**（新增字段）:
```json
{
  "name": "训练名称",
  "description": "训练描述",
  // ... 其他字段
  "groupCode": "GROUPA",
  "showInPage": true
}
```

**字段说明**:
- `groupCode`: 分组代码，可选值为 GROUPA, GROUPB, GROUPC, GROUPD, GROUPE, GROUPF, GROUPG
- `showInPage`: 是否在app页面展示，布尔值

### 2. Category详情查询响应

**响应数据**（包含新字段）:
```json
{
  "id": 1,
  "name": "分类名称",
  "workouts": [
    {
      "id": 1,
      "name": "训练名称",
      // ... 其他字段
      "groupCode": "GROUPA",
      "showInPage": true,
      "sortOrder": 1
    }
  ]
}
```

## 业务应用场景

### 1. group_code 分组功能

**用途**:
- 将workout按照不同的分组进行管理
- 支持7个分组：GROUPA 到 GROUPG
- 可用于不同的业务场景分类

**应用示例**:
```javascript
// 按分组查询workout
const groupAWorkouts = await query(`
    SELECT * FROM workout 
    WHERE group_code = 'GROUPA' AND is_deleted = 0
`);

// 分组统计
const groupStats = await query(`
    SELECT group_code, COUNT(*) as count 
    FROM workout 
    WHERE is_deleted = 0 
    GROUP BY group_code
`);
```

### 2. show_in_page 展示控制

**用途**:
- 控制workout是否在app的category页面中显示
- 支持隐藏某些workout而不删除数据
- 灵活控制用户可见内容

**应用示例**:
```javascript
// 只查询需要在页面展示的workout
const visibleWorkouts = await query(`
    SELECT * FROM workout 
    WHERE show_in_page = 1 AND is_deleted = 0
`);

// category页面查询（只显示show_in_page=1的workout）
const categoryWorkouts = await query(`
    SELECT w.* FROM category_workout cw
    INNER JOIN workout w ON cw.workout_id = w.id 
    WHERE cw.category_id = ? 
    AND w.show_in_page = 1 
    AND w.is_deleted = 0
`);
```

## 测试验证结果

### 字段创建验证

```
✅ group_code字段存在
  类型: enum('GROUPA','GROUPB','GROUPC','GROUPD','GROUPE','GROUPF','GROUPG')
  默认值: GROUPA
  允许为空: YES

✅ show_in_page字段存在
  类型: tinyint(1)
  默认值: 1
  允许为空: YES
```

### 数据操作验证

```
✅ group_code更新: 成功
✅ show_in_page更新: 成功
✅ 枚举值验证: 所有有效值通过，无效值正确拒绝
✅ 查询功能: 包含新字段正常工作
✅ category详情查询: 支持新字段
```

## API文档更新

### Swagger文档示例

```yaml
# Workout保存接口
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
            description: 训练名称
          # ... 其他字段
          groupCode:
            type: string
            enum: [GROUPA, GROUPB, GROUPC, GROUPD, GROUPE, GROUPF, GROUPG]
            description: 分组代码
            example: GROUPA
          showInPage:
            type: boolean
            description: 是否要在app的category页面展示
            example: true

# Category详情响应
responses:
  200:
    content:
      application/json:
        schema:
          properties:
            workouts:
              type: array
              items:
                properties:
                  groupCode:
                    type: string
                    description: 分组代码
                  showInPage:
                    type: boolean
                    description: 是否在页面展示
```

## 数据迁移说明

### 现有数据处理

由于字段设置了默认值，现有的workout数据会自动获得：
- `group_code`: 默认值 'GROUPA'
- `show_in_page`: 默认值 1 (展示)

### 批量更新示例

```sql
-- 批量设置某些workout的分组
UPDATE workout 
SET group_code = 'GROUPB' 
WHERE id IN (1, 2, 3) AND is_deleted = 0;

-- 批量隐藏某些workout
UPDATE workout 
SET show_in_page = 0 
WHERE status = 'DRAFT' AND is_deleted = 0;
```

## 最佳实践建议

### 1. 分组管理

- 建议为不同类型的workout设置不同的group_code
- 可以根据业务需求定义每个分组的含义
- 在查询时可以按分组进行筛选和统计

### 2. 展示控制

- 使用show_in_page控制用户可见性
- 避免直接删除数据，优先使用展示控制
- 可以结合其他条件（如状态、时间等）进行复合筛选

### 3. 性能优化

- 考虑为group_code和show_in_page字段添加索引
- 在频繁查询的场景中使用复合索引

```sql
-- 建议的索引
CREATE INDEX idx_workout_group_show ON workout(group_code, show_in_page, is_deleted);
```

## 总结

新增的两个字段为workout模块提供了更灵活的管理能力：

🎯 **分组管理**: group_code支持7个分组，便于业务分类
🎛️ **展示控制**: show_in_page提供细粒度的可见性控制
🔧 **代码更新**: 保存和查询接口已完整支持新字段
✅ **向后兼容**: 现有数据自动获得合理的默认值
📋 **测试验证**: 所有功能经过完整测试验证

这些字段的添加为产品提供了更强的灵活性和可控性，支持更复杂的业务场景。
