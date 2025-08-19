# Category 模块逻辑删除实现总结

## 概述

Category模块已正确实现逻辑删除机制，确保所有查询都不会返回已删除的数据，同时保留数据的完整性和可追溯性。

## 逻辑删除实现检查

### ✅ 1. 删除接口（逻辑删除）

```javascript
router.post('/del', async (req, res) => {
    // 逻辑删除：设置 is_deleted = 1
    const deleteSql = `
        UPDATE category 
        SET is_deleted = 1, update_time = NOW() 
        WHERE id IN (${placeholders}) AND is_deleted = 0
    `;
});
```

**特点**：
- ✅ 使用UPDATE而不是DELETE
- ✅ 设置 `is_deleted = 1`
- ✅ 更新 `update_time`
- ✅ 只删除未删除的数据（`AND is_deleted = 0`）

### ✅ 2. 分页查询（过滤已删除数据）

```javascript
router.get('/list', async (req, res) => {
    // 添加逻辑删除过滤条件
    conditionBuilder.addNumberCondition('is_deleted', 0);
    
    // 排除敏感字段
    const options = {
        excludeFields: ['is_deleted']
    };
});
```

**特点**：
- ✅ 自动过滤 `is_deleted = 0`
- ✅ 返回结果不包含 `is_deleted` 字段
- ✅ 使用公共查询方法

### ✅ 3. 详情查询（过滤已删除数据）

```javascript
router.get('/detail/:id', async (req, res) => {
    const categorySql = `
        SELECT id, name, cover_img_url, detail_img_url, description,
               new_start_time, new_end_time, status, create_time, update_time
        FROM category
        WHERE id = ? AND is_deleted = 0
    `;
});
```

**特点**：
- ✅ 明确添加 `AND is_deleted = 0`
- ✅ 已删除的category返回404
- ✅ 关联的workout也过滤已删除数据

### ✅ 4. 保存接口（只操作未删除数据）

```javascript
router.post('/save', async (req, res) => {
    if (id) {
        // 修改模式：只更新未删除的数据
        const updateSql = `
            UPDATE category SET ... 
            WHERE id = ? AND is_deleted = 0
        `;
        
        if (updateResult.affectedRows === 0) {
            throw new Error('category不存在或已被删除');
        }
    }
});
```

**特点**：
- ✅ 修改时检查 `AND is_deleted = 0`
- ✅ 如果category已删除，抛出错误
- ✅ 保护已删除数据不被意外修改

### ✅ 5. 状态管理（只操作未删除数据）

```javascript
const batchUpdateCategoryStatus = async (idList, status, operation) => {
    const updateSql = `
        UPDATE category 
        SET status = ?, update_time = NOW() 
        WHERE id IN (${placeholders}) AND is_deleted = 0
    `;
};
```

**特点**：
- ✅ 启用/禁用只影响未删除的数据
- ✅ 已删除的category不会被状态变更影响

### ✅ 6. 智能搜索（ID检查包含逻辑删除过滤）

```javascript
// 检查ID匹配是否有结果
const idCheckSql = `SELECT COUNT(*) as count FROM category WHERE id = ? AND is_deleted = 0`;
```

**特点**：
- ✅ ID精确匹配时也检查逻辑删除状态
- ✅ 已删除的ID不会被匹配到

## 关联表处理

### category_workout 关联表

```javascript
// 删除原有的workout关联（物理删除）
await connection.execute('DELETE FROM category_workout WHERE category_id = ?', [categoryId]);
```

**说明**：
- ✅ 关联表使用物理删除是正确的
- ✅ 关联表没有 `is_deleted` 字段
- ✅ 关联关系的变更通常是直接删除重建

### 查询关联workout时的逻辑删除过滤

```javascript
const workoutSql = `
    SELECT w.*, cw.sort_order
    FROM category_workout cw
    INNER JOIN workout w ON cw.workout_id = w.id AND w.is_deleted = 0
    WHERE cw.category_id = ?
`;
```

**特点**：
- ✅ 关联查询时过滤已删除的workout
- ✅ 确保返回的workout都是有效的

## 数据库表结构

### category 主表

```sql
CREATE TABLE category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    -- ... 其他字段
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### category_workout 关联表

```sql
CREATE TABLE category_workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    workout_id BIGINT NOT NULL,
    sort_order INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
    -- 注意：没有 is_deleted 字段，使用物理删除
);
```

## 逻辑删除的优势

### 1. 数据安全
- ✅ 防止误删除导致的数据丢失
- ✅ 保留完整的数据历史
- ✅ 支持数据恢复

### 2. 业务连续性
- ✅ 关联数据不会因为删除而破坏
- ✅ 统计分析可以包含历史数据
- ✅ 审计追踪完整

### 3. 系统稳定性
- ✅ 避免级联删除的风险
- ✅ 减少数据库约束冲突
- ✅ 提高系统可靠性

## 最佳实践遵循

### 1. 查询时始终过滤
```javascript
// ✅ 正确：所有查询都添加逻辑删除过滤
WHERE id = ? AND is_deleted = 0

// ❌ 错误：忘记过滤逻辑删除
WHERE id = ?
```

### 2. 删除时使用UPDATE
```javascript
// ✅ 正确：逻辑删除
UPDATE table SET is_deleted = 1 WHERE id = ?

// ❌ 错误：物理删除
DELETE FROM table WHERE id = ?
```

### 3. 修改时检查删除状态
```javascript
// ✅ 正确：只修改未删除的数据
UPDATE table SET ... WHERE id = ? AND is_deleted = 0

// ❌ 错误：可能修改已删除的数据
UPDATE table SET ... WHERE id = ?
```

### 4. 返回结果排除敏感字段
```javascript
// ✅ 正确：排除内部字段
excludeFields: ['is_deleted']

// ❌ 错误：暴露内部实现
// 返回结果包含 is_deleted 字段
```

## 测试验证

### 删除操作测试
```javascript
// 1. 删除category
POST /api/category/del { idList: [1] }

// 2. 验证查询不到已删除的数据
GET /api/category/detail/1  // 应该返回404

// 3. 验证列表查询不包含已删除数据
GET /api/category/list  // 不应该包含ID为1的数据
```

### 修改操作测试
```javascript
// 1. 尝试修改已删除的category
POST /api/category/save { id: 1, name: "新名称" }  // 应该失败

// 2. 尝试改变已删除category的状态
POST /api/category/enable { idList: [1] }  // 应该无效果
```

## 总结

Category模块的逻辑删除实现完全符合最佳实践：

🛡️ **数据安全**: 所有删除操作都是逻辑删除，保护数据不丢失
🔍 **查询过滤**: 所有查询都自动过滤已删除数据
🚫 **操作保护**: 已删除数据不能被修改或状态变更
🔗 **关联处理**: 正确处理主表逻辑删除和关联表物理删除
📋 **字段保护**: 返回结果不暴露内部删除状态字段
✅ **一致性**: 与项目其他模块保持一致的删除策略

这个实现确保了数据的安全性、完整性和业务逻辑的正确性。
