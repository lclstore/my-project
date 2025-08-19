# Workout 模块 undefined 参数修复

## 问题描述

在保存workout时遇到以下错误：
```
事务执行错误: Bind parameters must not contain undefined. To pass SQL NULL specify JS null
保存workout错误: TypeError: Bind parameters must not contain undefined. To pass SQL NULL specify JS null
```

## 问题原因

MySQL驱动程序要求SQL参数不能包含 `undefined` 值。当前端传递的数据中某些字段为 `undefined` 时，直接传递给SQL执行会导致错误。

### 常见场景

1. **前端表单未填写的字段**: 如时间字段、图片URL等
2. **可选字段**: 如描述、卡路里、时长等
3. **条件性字段**: 根据业务逻辑可能不传递的字段

## 解决方案

### 1. 创建参数清理函数

```javascript
// 公共方法：处理SQL参数，将undefined转换为null
const sanitizeParams = (params) => {
    return params.map(param => param === undefined ? null : param);
};
```

### 2. 在所有SQL执行前使用参数清理

#### 更新操作
```javascript
const updateParams = sanitizeParams([
    workoutData.name, workoutData.description, workoutData.premium,
    workoutData.newStartTime, workoutData.newEndTime,
    workoutData.coverImgUrl, workoutData.detailImgUrl, 
    workoutData.thumbnailImgUrl, workoutData.completeImgUrl,
    workoutData.genderCode, workoutData.difficultyCode, workoutData.positionCode,
    workoutData.calorie, workoutData.duration, workoutData.status, workoutId
]);

const [updateResult] = await connection.execute(updateSql, updateParams);
```

#### 插入操作
```javascript
const insertParams = sanitizeParams([
    workoutData.name, workoutData.description, workoutData.premium,
    workoutData.newStartTime, workoutData.newEndTime,
    workoutData.coverImgUrl, workoutData.detailImgUrl, 
    workoutData.thumbnailImgUrl, workoutData.completeImgUrl,
    workoutData.genderCode, workoutData.difficultyCode, workoutData.positionCode,
    workoutData.calorie, workoutData.duration, workoutData.status
]);

const [insertResult] = await connection.execute(insertSql, insertParams);
```

#### 关联数据插入
```javascript
// 受伤类型
await connection.execute(injuredSql, sanitizeParams([workoutId, injuredCode]));

// 结构数据
await connection.execute(structureSql, sanitizeParams([
    workoutId, group.structureName, group.structureRound, i + 1
]));

// 动作关联
await connection.execute(exerciseSql, sanitizeParams([
    structureId, group.exerciseList[j], j + 1
]));
```

## 修复效果

### 修复前
- ❌ 前端传递 `undefined` 值时SQL执行失败
- ❌ 事务回滚，数据保存失败
- ❌ 用户体验差，无法保存草稿

### 修复后
- ✅ `undefined` 值自动转换为 `null`
- ✅ SQL执行正常，事务成功提交
- ✅ 支持保存包含空字段的数据
- ✅ 草稿模式正常工作

## 测试验证

### 测试场景

1. **新增包含undefined字段的workout**
   ```javascript
   const testData = {
       name: "测试训练",
       description: "测试描述",
       // newStartTime: undefined,  // 未设置
       // coverImgUrl: undefined,   // 未设置
       genderCode: "MALE",
       status: "DRAFT"
   };
   ```

2. **修改包含undefined字段的workout**
   ```javascript
   const updateData = {
       id: workoutId,
       name: "修改后的训练",
       // premium: undefined,       // 未设置
       // difficultyCode: undefined, // 未设置
       status: "ENABLED"
   };
   ```

### 测试结果

- ✅ 新增操作：成功保存，undefined字段在数据库中为NULL
- ✅ 修改操作：成功更新，undefined字段保持原值或设为NULL
- ✅ 查询操作：正常返回数据，NULL字段转换为前端格式
- ✅ 关联数据：正常保存结构和动作关联

## 最佳实践

### 1. 统一参数处理

所有涉及SQL参数的地方都应该使用 `sanitizeParams` 函数：

```javascript
// 推荐做法
await connection.execute(sql, sanitizeParams(params));

// 避免直接传递
await connection.execute(sql, params); // 可能包含undefined
```

### 2. 前端数据验证

虽然后端已经处理了undefined，但前端最好也进行数据清理：

```javascript
// 前端发送前清理数据
const cleanData = Object.fromEntries(
    Object.entries(formData).filter(([_, value]) => value !== undefined)
);
```

### 3. 数据库字段设计

对于可选字段，确保数据库字段允许NULL：

```sql
ALTER TABLE workout MODIFY COLUMN new_start_time DATETIME NULL;
ALTER TABLE workout MODIFY COLUMN cover_img_url VARCHAR(500) NULL;
```

## 相关文件

- **修复文件**: `backend/routes/workout.js`
- **测试文件**: `backend/test/testWorkoutSave.js`
- **涉及接口**: `POST /api/workout/save`

## 扩展应用

这个修复方案可以应用到其他模块：

1. **Exercise模块**: 处理动作数据的undefined字段
2. **User模块**: 处理用户信息的可选字段
3. **其他业务模块**: 任何涉及SQL参数的地方

### 通用工具函数

可以将 `sanitizeParams` 提取到工具类中：

```javascript
// utils/sqlHelper.js
const sanitizeParams = (params) => {
    return params.map(param => param === undefined ? null : param);
};

module.exports = { sanitizeParams };
```

## 总结

通过添加 `sanitizeParams` 函数，成功解决了workout保存时的undefined参数问题：

- 🔧 **技术修复**: 将undefined转换为null
- 🛡️ **防御性编程**: 避免SQL参数错误
- 📈 **用户体验**: 支持草稿模式和部分数据保存
- 🔄 **可复用**: 解决方案可应用到其他模块

这个修复确保了workout模块的稳定性和用户友好性。
