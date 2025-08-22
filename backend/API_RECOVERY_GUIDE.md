# API接口恢复指南

## 概述

本文档说明了重构后恢复的API接口功能和使用方法。

## 已恢复的接口模块

### 1. 用户管理 (`/user`)
- **登录**: `POST /templateCms/web/user/login`
- **注册**: `POST /templateCms/web/user/register`
- **获取用户信息**: `GET /templateCms/web/user/profile`
- **用户列表**: `GET /templateCms/web/user/list`
- **用户详情**: `GET /templateCms/web/user/:id`

### 2. 分类管理 (`/category`)
- **分类树**: `GET /templateCms/web/category/tree`
- **分类列表**: `GET /templateCms/web/category/list`
- **创建分类**: `POST /templateCms/web/category`
- **更新分类**: `PUT /templateCms/web/category/:id`
- **删除分类**: `DELETE /templateCms/web/category/:id`

### 3. 动作资源管理 (`/exercise`)
- **分页查询**: `GET /templateCms/web/exercise/page`
- **详情查询**: `GET /templateCms/web/exercise/detail/:id`
- **保存动作**: `POST /templateCms/web/exercise/save`
- **批量启用**: `POST /templateCms/web/exercise/enable`
- **批量禁用**: `POST /templateCms/web/exercise/disable`
- **批量删除**: `POST /templateCms/web/exercise/del`

### 4. 音频资源管理 (`/sound`)
- **分页查询**: `GET /templateCms/web/sound/page`
- **详情查询**: `GET /templateCms/web/sound/detail/:id`
- **保存音频**: `POST /templateCms/web/sound/save`
- **批量启用**: `POST /templateCms/web/sound/enable`
- **批量禁用**: `POST /templateCms/web/sound/disable`
- **批量删除**: `POST /templateCms/web/sound/del`

### 5. 文件上传 (`/files`)
- **单文件上传**: `POST /templateCms/web/files/upload`
- **多文件上传**: `POST /templateCms/web/files/upload-multiple`

### 6. 枚举值 (`/enum`)
- **所有枚举**: `GET /templateCms/web/enum/all`
- **枚举类型**: `GET /templateCms/web/enum/types`
- **特定枚举**: `GET /templateCms/web/enum/:type`

### 7. 首页和系统信息 (`/home`)
- **仪表板**: `GET /templateCms/web/home/dashboard`
- **系统信息**: `GET /templateCms/web/home/system-info`
- **健康检查**: `GET /templateCms/web/home/health`
- **欢迎信息**: `GET /templateCms/web/home/welcome`

## 接口测试

### 运行测试脚本
```bash
# 确保服务器正在运行
npm start

# 在另一个终端运行测试
node test-api.js
```

### 手动测试示例

#### 1. 健康检查
```bash
curl http://localhost:3000/templateCms/web/health
```

#### 2. 获取枚举值
```bash
curl http://localhost:3000/templateCms/web/enum/all
```

#### 3. 获取动作资源列表（需要认证）
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/templateCms/web/exercise/page?pageIndex=1&pageSize=10
```

## 重构后的架构变化

### 1. 目录结构
```
src/
├── controllers/     # 控制器层
├── services/        # 服务层
├── core/           # 核心类
├── middleware/     # 中间件
├── routes/         # 路由配置
├── config/         # 配置文件
└── utils/          # 工具函数
```

### 2. 主要改进
- **分层架构**: 采用Controller-Service-Model分层架构
- **统一响应**: 使用统一的响应格式和错误处理
- **基类封装**: 提供BaseController和BaseService基类
- **中间件优化**: 重构认证、验证、日志等中间件
- **配置管理**: 统一的配置管理和环境变量处理

### 3. 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "errCode": null,
  "errMessage": null
}
```

### 8. 训练管理 (`/workout`) ✅ 已恢复
- **分页查询**: `GET /templateCms/web/workout/page`
- **详情查询**: `GET /templateCms/web/workout/detail/:id`
- **保存训练**: `POST /templateCms/web/workout/save`
- **批量启用**: `POST /templateCms/web/workout/enable`
- **批量禁用**: `POST /templateCms/web/workout/disable`
- **批量删除**: `POST /templateCms/web/workout/del`

### 9. 训练计划管理 (`/program`) ✅ 已恢复
- **分页查询**: `GET /templateCms/web/program/page`
- **详情查询**: `GET /templateCms/web/program/detail/:id`
- **保存训练计划**: `POST /templateCms/web/program/save`
- **批量启用**: `POST /templateCms/web/program/enable`
- **批量禁用**: `POST /templateCms/web/program/disable`
- **批量删除**: `POST /templateCms/web/program/del`

### 10. 音乐管理 (`/music`) ✅ 已恢复
- **分页查询**: `GET /templateCms/web/music/page`
- **详情查询**: `GET /templateCms/web/music/detail/:id`
- **保存音乐**: `POST /templateCms/web/music/save`
- **批量启用**: `POST /templateCms/web/music/enable`
- **批量禁用**: `POST /templateCms/web/music/disable`
- **批量删除**: `POST /templateCms/web/music/del`

### 11. 模板管理 (`/template`) ✅ 已恢复
- **分页查询**: `GET /templateCms/web/template/page`
- **详情查询**: `GET /templateCms/web/template/detail/:id`
- **保存模板**: `POST /templateCms/web/template/save`
- **批量启用**: `POST /templateCms/web/template/enable`
- **批量禁用**: `POST /templateCms/web/template/disable`
- **批量删除**: `POST /templateCms/web/template/del`

### 12. 播放列表管理 (`/playlist`) ✅ 已恢复
- **分页查询**: `GET /templateCms/web/playlist/page`
- **详情查询**: `GET /templateCms/web/playlist/detail/:id`
- **保存播放列表**: `POST /templateCms/web/playlist/save`
- **批量启用**: `POST /templateCms/web/playlist/enable`
- **批量禁用**: `POST /templateCms/web/playlist/disable`
- **批量删除**: `POST /templateCms/web/playlist/del`

### 13. 发布管理 (`/publish`) ✅ 已恢复
- **分页查询**: `GET /templateCms/web/publish/page`
- **详情查询**: `GET /templateCms/web/publish/detail/:id`
- **新增发布记录**: `POST /templateCms/web/publish/publish`
- **更新发布状态**: `PUT /templateCms/web/publish/update/:id`

## 待完成的模块

以下模块的控制器还需要创建：
- **资源管理** (`/resource`)
- **操作日志** (`/opLogs`)
- **计划名称设置** (`/planNameSettings`)
- **计划替换设置** (`/planReplaceSettings`)
- **训练设置** (`/workoutSettings`)
- **通用数据接口** (`/data`)

## 注意事项

1. **认证要求**: 大部分业务接口需要JWT认证
2. **数据库连接**: 确保数据库配置正确
3. **环境变量**: 检查.env文件中的配置
4. **文件上传**: 需要配置Cloudinary相关环境变量

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库配置
   - 确保数据库服务正在运行

2. **认证失败**
   - 检查JWT密钥配置
   - 确保请求头包含正确的Authorization

3. **文件上传失败**
   - 检查Cloudinary配置
   - 确保网络连接正常

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

## API文档

访问Swagger文档：
- **开发环境**: http://localhost:3000/templateCms/web/swagger-ui/
- **JSON格式**: http://localhost:3000/templateCms/web/swagger.json

## 联系支持

如果遇到问题，请检查：
1. 服务器日志
2. 数据库连接状态
3. 环境变量配置
4. 网络连接状况
