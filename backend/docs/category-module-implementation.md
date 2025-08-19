# Category 模块实现文档

## 概述

根据workout相关接口的设计模式，创建了完整的category分类管理模块，包括数据库设计、API接口和相关功能。

## 数据库设计

### 主表：category

```sql
CREATE TABLE IF NOT EXISTS category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '分类名称',
    cover_img_url VARCHAR(500) DEFAULT NULL COMMENT '封面图',
    detail_img_url VARCHAR(500) DEFAULT NULL COMMENT '详情图',
    description TEXT DEFAULT NULL COMMENT '描述',
    new_start_time DATETIME DEFAULT NULL COMMENT 'NEW 开始时间',
    new_end_time DATETIME DEFAULT NULL COMMENT 'NEW 结束时间',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='分类表';
```

### 关联表：category_workout

```sql
CREATE TABLE IF NOT EXISTS category_workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
    UNIQUE KEY uk_category_workout (category_id, workout_id)
) COMMENT='分类workout关联表';
```

### 设计特点

1. **逻辑删除**: 使用 `is_deleted` 字段实现逻辑删除
2. **状态管理**: 支持草稿、启用、禁用三种状态
3. **关联管理**: 通过关联表管理category与workout的多对多关系
4. **排序支持**: 支持workout在category中的排序
5. **时间标记**: NEW标签的开始和结束时间

## API接口设计

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 保存category | POST | `/api/category/save` | 新增或修改category |
| 查询详情 | GET | `/api/category/detail/{id}` | 查询category详情 |
| 分页查询 | GET | `/api/category/page` | 分页查询category列表 |
| 删除category | POST | `/api/category/del` | 逻辑删除category |
| 启用category | POST | `/api/category/enable` | 批量启用category |
| 禁用category | POST | `/api/category/disable` | 批量禁用category |

### 技术特性

1. **统一架构**: 完全参考workout模块的设计模式
2. **公共方法**: 使用相同的工具类和验证逻辑
3. **智能搜索**: 支持ID精确匹配和名称模糊搜索
4. **参数验证**: 完善的参数验证和错误处理
5. **字段转换**: 自动进行camelCase和snake_case转换

## 核心功能实现

### 1. 保存category（新增/修改）

```javascript
router.post('/save', async (req, res) => {
    // 使用事务处理
    const result = await transaction(async (connection) => {
        // 保存主表数据
        // 处理workout关联关系
        // 支持排序
    });
});
```

**特点**：
- 事务保证数据一致性
- 支持新增和修改模式
- 自动处理workout关联关系
- 参数sanitization防止undefined错误

### 2. 查询详情

```javascript
router.get('/detail/:id', async (req, res) => {
    // 查询category基本信息
    // 查询关联的workout列表（包含完整信息）
    // 查询workout的受伤类型
    // 字段转换和数据组装
});
```

**特点**：
- 返回完整的workout信息（不只是ID）
- 包含workout的受伤类型数据
- 自动字段转换
- 逻辑删除过滤

### 3. 分页查询

```javascript
router.get('/page', async (req, res) => {
    // 使用QueryConditionBuilder构建查询条件
    // 支持智能搜索
    // 支持状态筛选
    // 支持排序
});
```

**特点**：
- 智能关键词搜索（ID精确匹配 + 名称模糊搜索）
- 多条件筛选
- 灵活排序
- 分页响应格式统一

### 4. 状态管理

```javascript
// 批量状态更新的公共方法
const batchUpdateCategoryStatus = async (idList, status, operation) => {
    // 验证ID列表
    // 批量更新状态
    // 返回更新结果
};
```

**特点**：
- 批量操作支持
- 统一的状态管理逻辑
- 操作结果反馈

## 数据模型

### Category 基本模型

```typescript
interface Category {
    id: number;
    name: string;
    coverImgUrl?: string;
    detailImgUrl?: string;
    description?: string;
    newStartTime?: string;
    newEndTime?: string;
    status: 'DRAFT' | 'ENABLED' | 'DISABLED';
    createTime: string;
    updateTime: string;
}
```

### CategoryWithWorkouts 详情模型

```typescript
interface CategoryWithWorkouts extends Category {
    workoutList: BizWorkoutPageRes[];
}
```

### BizWorkoutPageRes 模型

```typescript
interface BizWorkoutPageRes {
    id: number;
    name: string;
    description?: string;
    premium: number;
    newStartTime?: string;
    newEndTime?: string;
    coverImgUrl?: string;
    detailImgUrl?: string;
    thumbnailImgUrl?: string;
    completeImgUrl?: string;
    genderCode: 'FEMALE' | 'MALE';
    difficultyCode: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    positionCode: 'STANDING' | 'SEATED';
    injuredCodes: string[];
    calorie?: number;
    duration?: number;
    status: 'DRAFT' | 'ENABLED' | 'DISABLED';
    fileStatus: 'WAITING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED';
    audioJsonLanguages: string[];
    groupCode: 'GROUPA' | 'GROUPB' | 'GROUPC' | 'GROUPD' | 'GROUPE' | 'GROUPF' | 'GROUPG';
    showInPage: number;
}
```

## 使用示例

### 1. 创建category

```javascript
const categoryData = {
    name: "全身训练",
    description: "全身综合性训练分类",
    status: "ENABLED",
    workoutList: [1, 2, 3] // workout ID列表
};

const response = await api.post('/category/save', categoryData);
```

### 2. 查询详情

```javascript
const response = await api.get('/category/detail/1');
// 返回包含完整workout信息的category详情
```

### 3. 分页查询

```javascript
// 基本分页
const response = await api.get('/category/page?pageIndex=1&pageSize=10');

// 关键词搜索
const response = await api.get('/category/page?keywords=全身训练');

// 状态筛选
const response = await api.get('/category/page?statusList=ENABLED,DRAFT');

// 排序
const response = await api.get('/category/page?orderBy=createTime&orderDirection=desc');
```

### 4. 状态管理

```javascript
// 启用
await api.post('/category/enable', { idList: [1, 2, 3] });

// 禁用
await api.post('/category/disable', { idList: [1, 2, 3] });

// 删除（逻辑删除）
await api.post('/category/del', { idList: [1, 2, 3] });
```

## 技术优势

### 1. 架构统一
- 与workout模块保持一致的设计模式
- 复用成熟的工具类和验证逻辑
- 统一的错误处理和响应格式

### 2. 功能完善
- 完整的CRUD操作
- 智能搜索和多条件筛选
- 批量操作支持
- 关联数据管理

### 3. 数据安全
- 逻辑删除保护数据
- 事务保证数据一致性
- 参数验证防止注入
- 权限控制（通过中间件）

### 4. 性能优化
- 高效的SQL查询
- 批量操作减少数据库访问
- 索引优化查询性能
- 分页避免大数据量问题

## 扩展建议

### 短期扩展
1. **缓存机制**: 添加Redis缓存提升查询性能
2. **图片处理**: 集成图片上传和处理功能
3. **排序管理**: 提供拖拽排序接口

### 长期扩展
1. **多级分类**: 支持父子分类结构
2. **标签系统**: 支持分类标签管理
3. **统计分析**: 提供分类使用统计
4. **国际化**: 支持多语言分类名称

## 相关文件

- **数据库脚本**: `backend/sql/create_category_table.sql`
- **路由文件**: `backend/routes/category.js`
- **测试文件**: `backend/test/testCategoryApi.js`
- **文档**: `backend/docs/category-module-implementation.md`

## 总结

Category模块完全按照workout模块的设计模式实现，具备：

- 🏗️ **完整架构**: 数据库设计 + API接口 + 测试验证
- 🔧 **技术统一**: 使用相同的工具类和设计模式
- 📋 **功能完善**: 支持完整的CRUD和状态管理
- 🛡️ **安全可靠**: 逻辑删除、事务处理、参数验证
- 🚀 **性能优化**: 高效查询、批量操作、智能搜索
- 📚 **文档完整**: 详细的API文档和使用说明

这个实现为分类管理提供了强大而灵活的解决方案。
