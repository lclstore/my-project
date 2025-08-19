# Exercise 名称和性别组合重复检查逻辑

## 概述

Exercise 模块的名称重复检查逻辑已更新为基于 **名称和性别组合** 的重复检查，而不是仅基于名称。这样可以允许相同名称的动作针对不同性别存在，同时防止真正的重复。

## 核心规则

### 1. **相同名称 + 相同性别 = 重复**
- 不允许创建名称和性别都相同的动作
- 错误信息：`name和性别组合已存在，请使用其他name或性别`

### 2. **相同名称 + 不同性别 = 允许**
- 允许创建相同名称但不同性别的动作
- 例如：可以同时存在男性版"俯卧撑"和女性版"俯卧撑"

### 3. **草稿状态特殊处理**
- 草稿状态的动作可能没有性别信息（`genderCode` 为空）
- 如果存在同名草稿，不允许创建任何同名动作（无论性别）
- 如果存在同名的有性别动作，不允许创建同名草稿

## 详细逻辑

### 新增操作

```javascript
// 伪代码逻辑
if (当前动作有性别信息) {
    if (存在同名同性别的动作) {
        拒绝创建 // 直接冲突
    } else if (存在同名无性别的草稿) {
        拒绝创建 // 与草稿冲突
    } else {
        允许创建
    }
} else {
    // 当前是草稿（无性别信息）
    if (存在任何同名动作) {
        拒绝创建 // 草稿不允许与任何同名动作共存
    } else {
        允许创建
    }
}
```

### 修改操作

修改操作遵循相同的逻辑，但会排除当前记录本身：

```javascript
// 伪代码逻辑
const conflictRecords = 查找冲突记录().filter(record => record.id !== 当前记录ID);
if (conflictRecords.length > 0) {
    拒绝修改
} else {
    允许修改
}
```

## 实际场景示例

### ✅ **允许的操作**

1. **不同性别的相同动作**
   ```javascript
   // 创建男性俯卧撑
   { name: "俯卧撑", genderCode: "MALE" }
   
   // 创建女性俯卧撑（允许）
   { name: "俯卧撑", genderCode: "FEMALE" }
   ```

2. **完全不同的动作**
   ```javascript
   { name: "深蹲", genderCode: "MALE" }
   { name: "仰卧起坐", genderCode: "MALE" }
   ```

3. **修改为不冲突的组合**
   ```javascript
   // 将女性俯卧撑改名
   { id: 123, name: "女性俯卧撑", genderCode: "FEMALE" }
   ```

### ❌ **拒绝的操作**

1. **相同名称相同性别**
   ```javascript
   // 已存在男性俯卧撑
   { name: "俯卧撑", genderCode: "MALE" }
   
   // 再次创建男性俯卧撑（拒绝）
   { name: "俯卧撑", genderCode: "MALE" }
   ```

2. **草稿与完整动作冲突**
   ```javascript
   // 已存在草稿
   { name: "深蹲", status: "DRAFT" }
   
   // 创建同名完整动作（拒绝）
   { name: "深蹲", genderCode: "MALE", status: "ENABLED" }
   ```

3. **完整动作与草稿冲突**
   ```javascript
   // 已存在完整动作
   { name: "仰卧起坐", genderCode: "FEMALE", status: "ENABLED" }
   
   // 创建同名草稿（拒绝）
   { name: "仰卧起坐", status: "DRAFT" }
   ```

## 数据库查询逻辑

### 查询所有同名记录
```sql
SELECT id, name, gender_code 
FROM exercise 
WHERE name = ? AND is_deleted = 0
```

### 筛选冲突记录
```javascript
if (genderCode) {
    // 有性别信息：检查同名同性别 + 同名无性别
    existingNameRecords = allSameNameRecords.filter(record => 
        record.gender_code === genderCode || record.gender_code === null
    );
} else {
    // 无性别信息（草稿）：检查所有同名记录
    existingNameRecords = allSameNameRecords;
}
```

## 错误信息

### 有性别信息时的冲突
```javascript
{
    "success": false,
    "errCode": "INVALID_PARAMETERS",
    "errMessage": "name和性别组合已存在，请使用其他name或性别"
}
```

### 草稿状态时的冲突
```javascript
{
    "success": false,
    "errCode": "INVALID_PARAMETERS", 
    "errMessage": "name已存在，请使用其他name"
}
```

## 业务价值

### 1. **支持性别差异化**
- 允许为不同性别创建相同名称的动作
- 满足健身动作在不同性别间的差异化需求

### 2. **保持数据一致性**
- 防止真正的重复数据
- 确保每个性别下的动作名称唯一

### 3. **草稿状态兼容**
- 支持草稿状态的灵活保存
- 防止草稿与正式动作的命名冲突

### 4. **用户体验优化**
- 提供清晰的错误提示
- 指导用户如何解决命名冲突

## 测试覆盖

✅ **已测试场景**
- 相同名称不同性别允许创建
- 相同名称相同性别正确拒绝
- 草稿状态名称重复检查正常
- 修改操作重复检查正常
- 草稿与完整动作的冲突检查
- 错误信息正确返回

## 总结

新的名称重复检查逻辑实现了更精细的重复控制：

1. **基于组合的唯一性**：名称 + 性别组合唯一
2. **草稿状态保护**：草稿与任何同名动作互斥
3. **清晰的错误提示**：帮助用户理解和解决冲突
4. **向后兼容**：保持现有API接口不变

这种设计既满足了业务需求的灵活性，又保证了数据的一致性和完整性。
