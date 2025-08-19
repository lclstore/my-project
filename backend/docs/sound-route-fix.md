# Sound 模块路由问题修复

## 问题描述

访问 `http://localhost:8080/templateCms/web/sound/page` 时报错：

```json
{
  "data": null,
  "errCode": "INVALID_PARAMETERS", 
  "errMessage": "ID参数无效",
  "success": false
}
```

## 问题分析

### 1. 路由匹配问题

原始路由定义顺序：
```javascript
// ❌ 错误的顺序
router.get('/:id', ...)      // 这个会匹配 /page，把 'page' 当作 id
router.get('/page', ...)     // 永远不会被匹配到
```

当访问 `/sound/page` 时：
- Express 按顺序匹配路由
- `/:id` 路由首先匹配，将 `page` 作为 `id` 参数
- 由于 `page` 不是数字，触发 "ID参数无效" 错误
- `/page` 路由永远不会被执行

### 2. API 前缀配置

环境变量中配置了：
```env
API_PREFIX=/templateCms/web
```

所以实际的接口地址是：
- `/templateCms/web/sound/page` （不是 `/api/sound/page`）

## 解决方案

### 1. 调整路由顺序

将具体路径放在参数路径之前：

```javascript
// ✅ 正确的顺序
router.post('/save', ...)    // 保存（新增/修改）
router.post('/del', ...)     // 删除  
router.get('/page', ...)     // 分页查询
router.get('/:id', ...)      // 通过ID查询（放在最后）
```

### 2. 路由优先级规则

Express 路由匹配遵循以下规则：
1. **先定义先匹配**：按照路由定义的顺序进行匹配
2. **具体路径优先**：具体路径（如 `/page`）必须在参数路径（如 `/:id`）之前
3. **参数路径通配**：参数路径会匹配任何符合格式的请求

## 修复后的路由结构

```javascript
// 1. 保存接口（新增/修改合并）
router.post('/save', async (req, res) => {
    // 有 id 为修改，无 id 为新增
});

// 2. 删除接口
router.post('/del', async (req, res) => {
    // 删除音频资源
});

// 3. 分页查询接口
router.get('/page', async (req, res) => {
    // 分页查询列表
});

// 4. 通过ID查询接口（必须放在最后）
router.get('/:id', async (req, res) => {
    // 通过ID查询详情
});
```

## 测试验证

### 1. 路由匹配测试

```bash
# 分页查询 - 应该匹配 /page 路由
GET /templateCms/web/sound/page

# ID查询 - 应该匹配 /:id 路由  
GET /templateCms/web/sound/123

# 保存 - 应该匹配 /save 路由
POST /templateCms/web/sound/save

# 删除 - 应该匹配 /del 路由
POST /templateCms/web/sound/del
```

### 2. 测试结果

```bash
# 运行路由测试
node backend/test/soundRouteOrderTest.js

# 运行分页接口测试  
node backend/test/soundPageDebugTest.js
```

所有测试通过，路由匹配正常。

## 经验总结

### 1. Express 路由最佳实践

```javascript
// ✅ 推荐的路由定义顺序
router.post('/specific-action', ...)  // 具体的POST操作
router.get('/specific-path', ...)     // 具体的GET路径
router.get('/:param', ...)            // 参数路径放在最后
```

### 2. 常见错误

```javascript
// ❌ 错误：参数路径在前
router.get('/:id', ...)     // 会拦截所有GET请求
router.get('/page', ...)    // 永远不会被匹配

// ❌ 错误：过于宽泛的路由
router.get('/*', ...)       // 会拦截所有请求
```

### 3. 调试技巧

1. **检查路由顺序**：确保具体路径在参数路径之前
2. **查看错误信息**：分析错误来源，判断是否为路由匹配问题
3. **使用测试工具**：编写路由测试验证匹配逻辑
4. **日志调试**：在路由处理函数中添加日志确认匹配情况

## 修复文件

- `backend/routes/sound.js` - 调整路由定义顺序
- `backend/test/soundRouteOrderTest.js` - 路由顺序测试
- `backend/test/soundPageDebugTest.js` - 分页接口调试测试

## 结果

修复后，`/templateCms/web/sound/page` 接口正常工作，不再出现 "ID参数无效" 错误。
