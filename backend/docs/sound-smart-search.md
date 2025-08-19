# Sound 模块智能搜索功能

## 概述

Sound 模块的列表查询接口现在支持智能搜索功能，能够根据关键词的类型自动选择最合适的搜索策略，提供更精准和用户友好的搜索体验。

## 搜索策略

### 1. 纯数字搜索（ID优先策略）

当关键词为纯数字时，系统采用两阶段搜索策略：

**第一阶段：ID精确匹配**
- 先按ID进行精确匹配
- 如果找到匹配记录，返回结果

**第二阶段：名称模糊搜索（回退策略）**
- 如果ID匹配无结果，自动回退到名称模糊搜索
- 按名称字段进行模糊匹配

### 2. 纯文本搜索

当关键词为纯文本时：
- 直接按名称字段进行模糊匹配
- 使用 `LIKE '%关键词%'` 进行搜索

### 3. 混合内容搜索

当关键词既包含数字又包含文本时：
- 直接按名称字段进行模糊匹配
- 不进行ID匹配，因为混合内容不可能是有效的ID

## 技术实现

### 搜索逻辑判断

```javascript
const trimmedKeywords = keywords.trim();

// 检查是否为纯数字
if (/^\d+$/.test(trimmedKeywords)) {
    // 纯数字：先ID精确匹配，无结果则回退到名称搜索
    conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));
    
    // 检查ID匹配是否有结果
    const idCheckResult = await query('SELECT COUNT(*) as count FROM sound WHERE id = ?', [parseInt(trimmedKeywords)]);
    
    if (idCheckResult[0].count === 0) {
        // ID无结果，重置条件并改为名称搜索
        conditionBuilder.reset();
        // 重新添加其他筛选条件...
        conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
    }
} else {
    // 非纯数字：直接按名称模糊搜索
    conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
}
```

### 条件构建器重置

当ID搜索无结果需要回退时，系统会：
1. 重置查询条件构建器
2. 重新添加其他筛选条件（状态、性别、用途等）
3. 添加名称模糊搜索条件

## 使用示例

### 1. 纯数字搜索

#### 存在的ID（精确匹配）
```bash
GET /templateCms/web/sound/page?keywords=123&pageSize=10&pageIndex=1

# 搜索逻辑：
# 1. 检测到纯数字 "123"
# 2. 执行 SELECT * FROM sound WHERE id = 123
# 3. 找到记录，返回ID为123的音频资源
```

#### 不存在的ID（回退到名称搜索）
```bash
GET /templateCms/web/sound/page?keywords=99999&pageSize=10&pageIndex=1

# 搜索逻辑：
# 1. 检测到纯数字 "99999"
# 2. 执行 SELECT COUNT(*) FROM sound WHERE id = 99999
# 3. 结果为0，回退到名称搜索
# 4. 执行 SELECT * FROM sound WHERE name LIKE '%99999%'
# 5. 返回名称中包含"99999"的音频资源
```

### 2. 纯文本搜索

```bash
GET /templateCms/web/sound/page?keywords=欢迎&pageSize=10&pageIndex=1

# 搜索逻辑：
# 1. 检测到非数字内容 "欢迎"
# 2. 执行 SELECT * FROM sound WHERE name LIKE '%欢迎%'
# 3. 返回名称中包含"欢迎"的音频资源
```

### 3. 混合内容搜索

```bash
GET /templateCms/web/sound/page?keywords=123号提示&pageSize=10&pageIndex=1

# 搜索逻辑：
# 1. 检测到混合内容 "123号提示"（包含数字和文本）
# 2. 执行 SELECT * FROM sound WHERE name LIKE '%123号提示%'
# 3. 返回名称中包含"123号提示"的音频资源
```

### 4. 组合筛选搜索

```bash
GET /templateCms/web/sound/page?keywords=语音&statusList=ENABLED,DRAFT&genderCodeList=FEMALE&pageSize=10&pageIndex=1

# 搜索逻辑：
# 1. 检测到文本 "语音"
# 2. 执行复合查询：
#    WHERE name LIKE '%语音%' 
#    AND status IN ('ENABLED', 'DRAFT')
#    AND gender_code IN ('FEMALE')
```

## 搜索场景分析

### 场景1：用户记得ID

用户知道音频资源的ID，输入纯数字进行搜索：
- **输入**: `123`
- **期望**: 快速找到ID为123的音频资源
- **实现**: ID精确匹配，性能最优

### 场景2：用户输入不存在的ID

用户输入了一个不存在的ID：
- **输入**: `99999`
- **期望**: 如果没有该ID，希望看看名称中是否包含这个数字
- **实现**: ID匹配失败后自动回退到名称搜索

### 场景3：用户按名称搜索

用户记得音频资源名称的部分内容：
- **输入**: `欢迎`
- **期望**: 找到所有名称中包含"欢迎"的音频资源
- **实现**: 直接进行名称模糊匹配

### 场景4：用户输入混合内容

用户输入包含数字和文本的搜索词：
- **输入**: `123号提示音`
- **期望**: 找到名称中包含这个完整短语的音频资源
- **实现**: 按名称进行模糊匹配

## 性能优化

### 1. 索引建议

```sql
-- ID字段（主键，自动有索引）
-- 为name字段创建索引以优化模糊搜索
CREATE INDEX idx_sound_name ON sound(name);

-- 为筛选字段创建索引
CREATE INDEX idx_sound_status ON sound(status);
CREATE INDEX idx_sound_gender_code ON sound(gender_code);
CREATE INDEX idx_sound_usage_code ON sound(usage_code);
```

### 2. 查询优化

- **ID精确匹配**: 使用主键索引，性能最优
- **名称模糊搜索**: 使用name字段索引，支持前缀匹配
- **组合查询**: 利用多个索引进行条件筛选

### 3. 回退策略优化

回退策略只在必要时执行：
- 先进行轻量级的COUNT查询检查ID存在性
- 只有在ID不存在时才重置条件并进行名称搜索
- 避免不必要的复杂查询

## 用户体验提升

### 1. 智能识别

- 自动识别用户输入的类型
- 无需用户指定搜索类型
- 提供最符合用户期望的搜索结果

### 2. 容错能力

- ID不存在时自动回退到名称搜索
- 避免"无结果"的尴尬情况
- 最大化搜索结果的相关性

### 3. 搜索提示

前端可以根据搜索类型提供相应的提示：
```javascript
// 前端搜索提示逻辑
const getSearchHint = (keywords) => {
    if (/^\d+$/.test(keywords)) {
        return '正在按ID精确搜索，如无结果将按名称模糊搜索';
    } else {
        return '正在按名称模糊搜索';
    }
};
```

## 测试验证

### 测试覆盖

运行测试验证功能：

```bash
node backend/test/soundSmartSearchTest.js
```

测试场景：
- ✅ 纯数字（存在ID）：ID精确匹配
- ✅ 纯数字（不存在ID）：回退到名称模糊搜索
- ✅ 纯文本：名称模糊搜索
- ✅ 混合内容（数字+文本）：名称模糊搜索
- ✅ 搜索逻辑判断正确

### 测试结果示例

```
✅ 存在的ID（纯数字）: "35"
  ID存在性: true
  ✅ 执行ID精确匹配

✅ 不存在的ID（纯数字）: "99999"
  ID存在性: false
  ✅ ID不存在，回退到名称模糊搜索

✅ 纯文本: "欢迎"
  ✅ 执行名称模糊搜索

✅ 数字+文本: "123号"
  ✅ 执行名称模糊搜索
```

## 扩展性

### 其他模块应用

这种智能搜索策略可以应用到其他模块：

```javascript
// 通用智能搜索函数
const buildSmartSearchCondition = async (tableName, keywords, conditionBuilder) => {
    const trimmedKeywords = keywords.trim();
    
    if (/^\d+$/.test(trimmedKeywords)) {
        // 纯数字：先ID匹配，无结果则名称搜索
        const idCheckResult = await query(`SELECT COUNT(*) as count FROM ${tableName} WHERE id = ?`, [parseInt(trimmedKeywords)]);
        
        if (idCheckResult[0].count > 0) {
            conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));
        } else {
            conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
        }
    } else {
        // 非纯数字：名称模糊搜索
        conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
    }
};
```

## 总结

通过实现智能搜索功能，Sound 模块的列表查询提供了：

1. **智能识别**: 自动识别搜索类型，无需用户指定
2. **精确匹配**: 纯数字优先进行ID精确匹配
3. **容错回退**: ID无结果时自动回退到名称搜索
4. **模糊搜索**: 文本和混合内容进行名称模糊匹配
5. **性能优化**: 合理利用索引，优化查询性能
6. **用户友好**: 最大化搜索结果的相关性和有用性

这种搜索策略大大提升了用户的搜索体验，让用户能够更快速、准确地找到所需的音频资源。
