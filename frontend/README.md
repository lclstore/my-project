# CMS 管理系统

基于 React + Vite + Ant Design 的现代化 CMS 管理系统模板。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 核心框架 | React | ^18.2.0 |
| 构建工具 | Vite | ^5.0.4 |
| UI组件库 | Ant Design | ^5.11.5 |
| 状态管理 | Redux Toolkit | ^1.9.7 |
| 路由 | React Router | ^7.5.0 |
| HTTP请求 | Axios | ^1.6.2 |

## 环境要求

- Node.js: v20.19.0+
- npm: v10.8.2+

## 项目结构

```
src/
├── api/                  # API接口统一管理
│   ├── request.js        # 请求封装
│   ├── user.js           # 用户相关接口
│   ├── team.js           # 团队相关接口
│   ├── dashboard.js      # 仪表盘相关接口
│   └── index.js          # API统一导出
├── assets/               # 静态资源
│   ├── images/           # 图片资源
│   ├── styles/           # 样式资源
│   │   └── variables.css # CSS变量定义
│   └── icons/            # 图标资源
├── components/           # 公共组件
│   ├── common/           # 通用基础组件
│   │   ├── DataTable/    # 数据表格组件
│   │   └── AuthGuard.jsx # 权限控制组件
│   ├── business/         # 业务组件
├── config/               # 全局配置
│   ├── routes.js         # 路由配置
│   ├── menu.js           # 菜单配置
│   └── settings.js       # 系统配置
├── constants/            # 常量定义
│   ├── http.js           # HTTP相关常量
│   ├── app.js            # 应用相关常量
│   └── index.js          # 常量统一导出
├── hooks/                # 自定义Hooks
│   ├── useAuth.js        # 认证相关钩子
│   ├── useTable.js       # 表格数据处理钩子
│   ├── useAsync.js       # 异步操作处理钩子
│   └── index.js          # Hooks统一导出
├── layout/               # 布局页面
├── pages/                # 页面
│   ├── auth/             # 认证相关页面
│   ├── dashboard/        # 仪表盘页面
│   ├── user/             # 用户管理页面
│   ├── team/             # 团队管理页面
│   ├── settings/         # 系统设置页面
│   └── error/            # 错误页面
├── router/               # 路由
│   ├── index.js          # 路由注册
│   └── guards.js         # 路由守卫
├── services/             # 业务服务层
│   ├── user.service.js   # 用户服务
│   └── index.js          # 服务统一导出
├── store/                # 状态管理
│   ├── index.js          # store配置
│   ├── modules/          # 按模块划分状态
│   └── slices/           # Redux Toolkit 切片
├── types/                # 类型定义
│   └── index.d.ts        # 全局类型定义
├── utils/                # 工具函数
├── App.jsx               # 应用根组件
├── main.jsx              # 入口文件
└── index.css             # 全局样式
```

## 核心特性

1. **模块化架构**：按功能和职责划分目录
2. **路由系统**：基于 React Router 7，支持路由守卫和懒加载
3. **状态管理**：使用 Redux Toolkit 管理应用状态
4. **UI组件**：集成 Ant Design 5，支持主题定制
5. **请求封装**：基于 Axios 的统一请求处理
6. **类型支持**：完整的 TypeScript 类型定义
7. **测试支持**：集成 Vitest 测试框架

## 开发指南

### 安装依赖
```bash
# 安装项目所有基础依赖
npm install

# 安装拖拽排序功能所需的依赖
npm install @dnd-kit/core @dnd-kit/sortable
```

### 运行命令
- 开发环境：`