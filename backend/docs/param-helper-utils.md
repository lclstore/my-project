# 参数处理工具函数

## 概述

`paramHelper.js` 提供了一套通用的参数处理工具函数，用于统一处理各种类型的请求参数，包括数组、整数、布尔值、分页、排序等参数的解析和验证。

## 核心功能

### 1. 数组参数解析 (`parseArrayParam`)

支持多种格式的数组参数输入：

```javascript
const { parseArrayParam } = require('../utils/paramHelper');

// 支持的输入格式
parseArrayParam(['a', 'b', 'c']);           // ['a', 'b', 'c'] - 已有数组
parseArrayParam('a,b,c');                   // ['a', 'b', 'c'] - 逗号分隔字符串
parseArrayParam('a, b , c ');               // ['a', 'b', 'c'] - 带空格的逗号分隔
parseArrayParam('single');                  // ['single'] - 单个值转数组
parseArrayParam(123);                       // [123] - 数字转数组
parseArrayParam(null);                      // null - 空值
parseArrayParam('');                        // null - 空字符串
```

### 2. 基础类型参数解析

#### 整数参数 (`parseIntParam`)

```javascript
const { parseIntParam } = require('../utils/paramHelper');

parseIntParam('123', 0);        // 123 - 字符串数字
parseIntParam(456, 0);          // 456 - 数字
parseIntParam('12.34', 0);      // 12 - 浮点数转整数
parseIntParam('abc', 99);       // 99 - 无效值使用默认值
parseIntParam(null, 10);        // 10 - null使用默认值
```

#### 布尔参数 (`parseBooleanParam`)

```javascript
const { parseBooleanParam } = require('../utils/paramHelper');

parseBooleanParam('true', false);    // true - 字符串true
parseBooleanParam('false', true);    // false - 字符串false
parseBooleanParam('1', false);       // true - 字符串1
parseBooleanParam('0', true);        // false - 字符串0
parseBooleanParam(1, false);         // true - 数字1
parseBooleanParam(0, true);          // false - 数字0
parseBooleanParam('yes', false);     // true - 字符串yes
parseBooleanParam('no', true);       // false - 字符串no
```

#### 字符串参数 (`parseStringParam`)

```javascript
const { parseStringParam } = require('../utils/paramHelper');

parseStringParam('hello', null);     // 'hello' - 正常字符串
parseStringParam('  hello  ', null); // 'hello' - 自动去除空格
parseStringParam('', 'default');     // 'default' - 空字符串使用默认值
parseStringParam(null, 'default');   // 'default' - null使用默认值
```

### 3. 复合参数解析

#### 分页参数 (`parsePaginationParams`)

```javascript
const { parsePaginationParams } = require('../utils/paramHelper');

// 输入查询参数
const query = { pageIndex: '2', pageSize: '20' };
const result = parsePaginationParams(query);
// 输出: { pageIndex: 2, pageSize: 20, offset: 20 }

// 边界值处理
const invalidQuery = { pageIndex: '0', pageSize: '200' };
const safeResult = parsePaginationParams(invalidQuery);
// 输出: { pageIndex: 1, pageSize: 100, offset: 0 } - 自动修正边界值
```

#### 排序参数 (`parseSortParams`)

```javascript
const { parseSortParams } = require('../utils/paramHelper');

parseSortParams('name', 'asc');           // { orderBy: 'name', orderDirection: 'ASC' }
parseSortParams('createTime', 'invalid'); // { orderBy: 'createTime', orderDirection: 'DESC' }
parseSortParams(null, null);              // { orderBy: 'id', orderDirection: 'DESC' }
```

### 4. 批量参数解析 (`parseQueryParams`)

配置化的批量参数解析：

```javascript
const { parseQueryParams } = require('../utils/paramHelper');

const query = {
    statusList: 'ENABLED,DISABLED',
    pageIndex: '2',
    pageSize: '20',
    isActive: 'true',
    keywords: 'test'
};

const config = {
    statusList: { type: 'array' },
    pageIndex: { type: 'int', defaultValue: 1 },
    pageSize: { type: 'int', defaultValue: 10 },
    isActive: { type: 'boolean', defaultValue: false },
    keywords: { type: 'string', defaultValue: null, required: true }
};

const result = parseQueryParams(query, config);
// 输出: {
//   statusList: ['ENABLED', 'DISABLED'],
//   pageIndex: 2,
//   pageSize: 20,
//   isActive: true,
//   keywords: 'test'
// }
```

### 5. 参数清理 (`cleanEmptyParams`)

移除空值参数：

```javascript
const { cleanEmptyParams } = require('../utils/paramHelper');

const dirtyParams = {
    name: 'test',
    value: null,
    list: [],
    count: 0,
    flag: false,
    empty: '',
    validList: ['a', 'b']
};

const cleaned = cleanEmptyParams(dirtyParams);
// 输出: {
//   name: 'test',
//   count: 0,
//   flag: false,
//   validList: ['a', 'b']
// }
```

## 在路由中的使用

### 替换前（重复代码）

```javascript
// sound.js 中的重复代码
const parseArrayParam = (param) => {
    if (!param) return null;
    if (Array.isArray(param)) return param;
    if (typeof param === 'string') {
        const parsed = param.split(',').map(item => item.trim()).filter(item => item);
        return parsed.length > 0 ? parsed : null;
    }
    return [param];
};

const pageIndex = Math.max(1, parseInt(req.query.pageIndex) || 1);
const pageSize = Math.min(Math.max(1, parseInt(req.query.pageSize) || 10), 100);
```

### 替换后（使用公共工具）

```javascript
// sound.js 中使用公共工具
const { parseArrayParam, parsePaginationParams } = require('../utils/paramHelper');

// 数组参数处理
const queryParams = {};
if (statusList) queryParams.statusList = parseArrayParam(statusList);
if (genderCodeList) queryParams.genderCodeList = parseArrayParam(genderCodeList);

// 分页参数处理
const { pageIndex, pageSize, offset } = parsePaginationParams(req.query);
```

### BusinessHelper 中的使用

```javascript
// database.js 中使用公共工具
static async paginateWithValidation(tableName, req, options = {}) {
    const { parsePaginationParams } = require('../utils/paramHelper');
    const { pageIndex, pageSize, offset } = parsePaginationParams(req.query);
    
    // 其他逻辑...
}
```

## 优势

### 1. 代码复用

- 消除重复的参数处理逻辑
- 统一的参数处理标准
- 减少代码维护成本

### 2. 类型安全

- 自动类型转换和验证
- 默认值处理
- 边界值检查

### 3. 容错能力

- 处理各种异常输入
- 提供合理的默认值
- 自动修正边界值

### 4. 扩展性

- 支持配置化的批量解析
- 易于添加新的参数类型
- 支持自定义验证规则

## 测试验证

运行测试验证功能：

```bash
node backend/test/paramHelperTest.js
```

测试覆盖：
- ✅ 数组参数解析（支持逗号分隔字符串）
- ✅ 整数参数解析（带默认值）
- ✅ 布尔参数解析（多种格式支持）
- ✅ 分页参数解析（边界值处理）
- ✅ 排序参数解析（默认值处理）
- ✅ 批量参数解析（配置化）
- ✅ 空值参数清理

## 最佳实践

### 1. 统一使用公共工具

```javascript
// ✅ 推荐：使用公共工具
const { parseArrayParam, parsePaginationParams } = require('../utils/paramHelper');

// ❌ 不推荐：重复实现参数处理逻辑
const parseArray = (param) => { /* 重复代码 */ };
```

### 2. 配置化参数解析

```javascript
// ✅ 推荐：配置化批量解析
const config = {
    statusList: { type: 'array' },
    pageIndex: { type: 'int', defaultValue: 1 },
    isActive: { type: 'boolean', defaultValue: false }
};
const params = parseQueryParams(req.query, config);

// ❌ 不推荐：逐个手动解析
const statusList = parseArrayParam(req.query.statusList);
const pageIndex = parseIntParam(req.query.pageIndex, 1);
const isActive = parseBooleanParam(req.query.isActive, false);
```

### 3. 参数验证和清理

```javascript
// ✅ 推荐：先解析再清理
const params = parseQueryParams(req.query, config);
const cleanParams = cleanEmptyParams(params);

// 使用清理后的参数进行业务逻辑
```

## 扩展计划

### 1. 新增参数类型

- 日期时间参数解析
- 枚举参数验证
- 正则表达式验证

### 2. 高级功能

- 参数依赖关系验证
- 条件参数解析
- 参数转换管道

### 3. 性能优化

- 参数解析缓存
- 批量验证优化
- 内存使用优化

## 总结

通过实现公共参数处理工具，我们实现了：

1. **代码复用**：消除重复的参数处理逻辑
2. **类型安全**：自动类型转换和验证
3. **容错能力**：处理各种异常输入
4. **扩展性**：支持配置化的批量解析
5. **一致性**：统一的参数处理标准

这套工具大大提升了参数处理的效率和可靠性，为整个项目提供了坚实的基础设施支持。
