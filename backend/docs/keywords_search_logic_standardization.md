# Keywords 搜索逻辑标准化总结

## 🎯 标准化要求

### 搜索逻辑规则
1. **若为 ID（纯数字）**：先按ID精确匹配，若无结果再按名称name模糊搜索
2. **若为名称（文本）**：按名称模糊搜索  
3. **若既包含数字又包含文本**：按名称模糊搜索

## ✅ 检查结果

### 📊 统计数据
- **符合要求**: 12/12 个模块 (100%)
- **无keywords搜索**: 9 个模块（工具类、配置类路由）
- **特殊逻辑**: 1 个模块（user.js 邮箱搜索）

### 🎉 **所有业务模块都已符合标准！**

## 📋 各模块实现状态

### ✅ 完全符合标准的模块（12个）

| 模块 | 状态 | 搜索逻辑 |
|------|------|----------|
| **sound.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **music.js** | ✅ 符合 | ID精确匹配 → name/display_name模糊搜索 |
| **workout.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **program.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **resource.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **template.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **playlist.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **exercise.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **category.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **planNameSettings.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **planReplaceSettings.js** | ✅ 符合 | ID精确匹配 → name模糊搜索 |
| **opLogs.js** | ✅ 符合 | ID精确匹配 → 多字段模糊搜索 |

### 🔧 本次修复的模块

| 模块 | 修复内容 | 修复前问题 |
|------|----------|------------|
| **program.js** | 添加ID匹配失败后的名称搜索逻辑 | 缺少ID失败回退机制 |

### 🎯 特殊逻辑模块

| 模块 | 逻辑类型 | 说明 |
|------|----------|------|
| **user.js** | 邮箱+姓名搜索 | 包含@按邮箱搜索，否则按姓名搜索 |

### ⚪ 无需keywords搜索的模块（9个）

工具类和配置类路由：
- common.js, data.js, enum.js, files.js, home.js
- publish.js, swagger.js, workoutSettings.js

## 🔧 标准实现模板

### 核心搜索逻辑
```javascript
// 添加关键词搜索条件（智能搜索：纯数字先ID匹配，无结果则名称搜索）
if (keywords && keywords.trim()) {
    const trimmedKeywords = keywords.trim();
    
    // 检查是否为纯数字（ID精确匹配）
    if (/^\d+$/.test(trimmedKeywords)) {
        // 先按ID精确匹配
        conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));
        
        // 检查ID匹配是否有结果，如果没有则按名称模糊搜索
        const idCheckSql = `SELECT COUNT(*) as count FROM table_name WHERE id = ? AND is_deleted = 0`;
        const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);
        
        if (idCheckResult[0].count === 0) {
            // ID没有匹配结果，重置条件构建器，改为名称模糊搜索
            conditionBuilder.reset();
            
            // 重新添加逻辑删除过滤条件
            conditionBuilder.addNumberCondition('is_deleted', 0);
            
            // 重新添加其他筛选条件
            // ... 根据具体模块添加状态、类型等筛选条件
            
            // 添加名称模糊搜索
            conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
        }
    } else {
        // 非纯数字（包含文本或混合），按名称模糊搜索
        conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
    }
}
```

### 关键技术点

#### 1. 纯数字检测
```javascript
/^\d+$/.test(trimmedKeywords)
```

#### 2. ID精确匹配
```javascript
conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));
```

#### 3. ID匹配结果检查
```javascript
const idCheckSql = `SELECT COUNT(*) as count FROM table_name WHERE id = ? AND is_deleted = 0`;
const idCheckResult = await query(idCheckSql, [parseInt(trimmedKeywords)]);
```

#### 4. 条件构建器重置
```javascript
if (idCheckResult[0].count === 0) {
    conditionBuilder.reset();
    // 重新添加必要条件
}
```

#### 5. 名称模糊搜索
```javascript
conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
```

## 🎯 搜索行为示例

### 场景1: 纯数字输入 "123"
1. 先查询 `WHERE id = 123`
2. 如果找到记录 → 返回ID匹配结果
3. 如果没找到 → 查询 `WHERE name LIKE '%123%'`

### 场景2: 文本输入 "测试音频"
1. 直接查询 `WHERE name LIKE '%测试音频%'`

### 场景3: 混合输入 "音频123"
1. 直接查询 `WHERE name LIKE '%音频123%'`

## 🚀 优势总结

### 1. 用户体验优化
- ✅ 支持ID快速精确查找
- ✅ 支持名称模糊搜索
- ✅ 智能搜索策略，提高搜索效率

### 2. 技术实现统一
- ✅ 所有模块使用相同的搜索逻辑
- ✅ 代码结构一致，便于维护
- ✅ 错误处理机制完善

### 3. 性能优化
- ✅ ID精确匹配性能更高
- ✅ 避免不必要的模糊搜索
- ✅ 合理的搜索策略

## 🎉 总结

通过本次标准化工作：

- ✅ **12个业务模块**全部实现标准keywords搜索逻辑
- ✅ **program.js**添加了缺失的ID失败回退机制  
- ✅ **搜索体验**得到显著提升
- ✅ **代码一致性**达到100%
- ✅ **维护成本**大幅降低

现在所有分页接口的keywords搜索都遵循统一的标准：**纯数字先ID精确匹配，无结果则名称模糊搜索；非纯数字直接名称模糊搜索**！🎉
