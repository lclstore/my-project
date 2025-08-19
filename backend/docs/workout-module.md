# Workout 训练管理模块

## 概述

Workout模块提供完整的训练管理功能，支持复杂的训练结构设计，包括多个动作组、受伤类型限制等功能。

## 数据库设计

### 表结构

#### 1. 主表：workout
存放整体训练的元信息
- `id`: 主键ID
- `name`: workout名称（必填）
- `description`: 描述
- `premium`: 是否需要订阅（0不需要 1需要）
- `new_start_time`: NEW 开始时间
- `new_end_time`: NEW 结束时间
- `cover_img_url`: 封面图
- `detail_img_url`: 详情图
- `thumbnail_img_url`: 缩略图
- `complete_img_url`: 完成图
- `gender_code`: 性别code (FEMALE, MALE)
- `difficulty_code`: 难度code (BEGINNER, INTERMEDIATE, ADVANCED)
- `position_code`: 部位code (STANDING, SEATED)
- `calorie`: 卡路里
- `duration`: 时长（秒）
- `status`: 状态 (DRAFT, ENABLED, DISABLED)
- `file_status`: 文件状态 (WAITING, PROCESSING, SUCCESSFUL, FAILED)
- `audio_json_languages`: 音频语言数组（JSON格式）
- `is_deleted`: 是否删除（0正常 1已删除）

#### 2. 受伤类型关联表：workout_injured
存储workout与受伤类型的多对多关系
- `id`: 主键ID
- `workout_id`: workout ID（外键）
- `injured_code`: 受伤类型code (SHOULDER, BACK, WRIST, KNEE, ANKLE, HIP, NONE)

#### 3. 结构表：workout_structure
每个workout下的分组/结构
- `id`: 主键ID
- `workout_id`: workout ID（外键）
- `structure_name`: 结构名称
- `structure_round`: 结构轮数
- `sort_order`: 排序顺序

#### 4. 动作关联表：workout_structure_exercise
记录某组包含哪些动作
- `id`: 主键ID
- `workout_structure_id`: workout结构ID（外键）
- `exercise_id`: 动作ID（外键）
- `sort_order`: 排序顺序

## API接口

### 1. 保存workout（新增/修改）
- **路径**: `POST /api/workout/save`
- **功能**: 新增或修改workout信息
- **特点**: 
  - 支持复杂的结构化数据保存
  - 使用事务确保数据一致性
  - 自动处理关联表数据

**请求示例**:
```json
{
  "name": "全身燃脂训练",
  "description": "高强度全身燃脂训练",
  "premium": 0,
  "genderCode": "MALE",
  "difficultyCode": "BEGINNER",
  "positionCode": "STANDING",
  "injuredCodes": ["NONE"],
  "calorie": 300,
  "duration": 1800,
  "status": "ENABLED",
  "exerciseGroupList": [
    {
      "structureName": "热身",
      "structureRound": 1,
      "exerciseList": [1, 2, 3]
    },
    {
      "structureName": "主要训练",
      "structureRound": 3,
      "exerciseList": [4, 5, 6, 7]
    }
  ]
}
```

### 2. 查询workout详情
- **路径**: `GET /api/workout/detail/{id}`
- **功能**: 根据ID获取单个workout的详细信息
- **返回**: 包含基本信息、受伤类型数组、动作组结构

### 3. 分页查询workout列表
- **路径**: `GET /api/workout/page`
- **功能**: 分页查询workout列表
- **支持筛选**: 状态、性别、难度、关键词搜索

**查询参数**:
- `pageIndex`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `status`: 状态筛选
- `genderCode`: 性别筛选
- `difficultyCode`: 难度筛选
- `keyword`: 关键词搜索（名称）

### 4. 删除workout
- **路径**: `POST /api/workout/del`
- **功能**: 根据ID数组逻辑删除workout
- **特点**: 使用逻辑删除，数据仍保留在数据库中，但标记为已删除

### 5. 启用workout
- **路径**: `POST /api/workout/enable`
- **功能**: 根据ID数组批量启用workout

### 6. 禁用workout
- **路径**: `POST /api/workout/disable`
- **功能**: 根据ID数组批量禁用workout

## 安装和初始化

### 1. 创建数据库表
```bash
# 运行初始化脚本
node scripts/initWorkoutTables.js
```

### 2. 测试功能
```bash
# 运行测试脚本
node test/workoutTest.js
```

## 使用说明

### 1. 数据保存流程
1. 保存主表信息（workout）
2. 保存受伤类型关联（workout_injured）
3. 保存动作组结构（workout_structure）
4. 保存动作关联（workout_structure_exercise）

### 2. 数据查询流程
1. 查询主表信息
2. 查询受伤类型数组
3. 查询动作组结构（包含动作列表）
4. 组装完整数据返回

### 3. 数据删除流程
- 使用逻辑删除，将`is_deleted`字段设置为1
- 关联数据保持不变，但查询时会过滤掉已删除的主记录
- 所有查询接口都会自动添加`is_deleted = 0`的条件

## 逻辑删除机制

### 设计原理
- 使用`is_deleted`字段标记数据删除状态（0=正常，1=已删除）
- 删除操作不会真正删除数据，只是标记为已删除
- 保证数据安全性，支持数据恢复和审计

### 实现细节
1. **删除操作**: `UPDATE workout SET is_deleted = 1 WHERE id = ?`
2. **查询过滤**: 所有查询都添加`WHERE is_deleted = 0`条件
3. **关联数据**: 关联表数据保持不变，通过主表过滤实现逻辑删除效果

### 优势
- **数据安全**: 误删除可以恢复
- **审计追踪**: 保留完整的数据历史
- **性能优化**: 避免级联删除的性能开销
- **业务灵活**: 支持软删除和硬删除的业务需求

## 注意事项

1. **事务处理**: 所有涉及多表操作的接口都使用事务确保数据一致性
2. **字段转换**: 自动处理数据库字段名（snake_case）与前端字段名（camelCase）的转换
3. **参数验证**: 所有接口都包含完整的参数验证
4. **错误处理**: 提供详细的错误信息和状态码
5. **逻辑删除**: 使用`is_deleted`字段实现逻辑删除，保证数据安全性
6. **查询过滤**: 所有查询接口自动过滤已删除数据（`is_deleted = 0`）

## 扩展功能

### 可能的扩展方向
1. **版本管理**: 支持workout的版本控制
2. **模板功能**: 支持从模板创建workout
3. **统计分析**: 添加workout使用统计
4. **导入导出**: 支持批量导入导出功能
5. **审核流程**: 添加workout发布审核机制

## 相关文档

- [API文档]: 访问 `/api/swagger-ui/` 查看完整API文档
- [数据库设计]: 参考 `sql/create_workout_tables.sql`
- [测试用例]: 参考 `test/workoutTest.js`
