/**
 * 路由配置文件
 * 实现两种布局：登录页独立布局和其他页面共用Layout布局
 */
import React, { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, useLocation } from "react-router"
import getMenus from '@/config/menu.jsx';
import settings from '@/config/settings';
import AppLayout from '@/layout';
import { useStore } from '@/store/index.js';
import { Spin } from 'antd';

const userInfo = useStore.getState().userInfo; // 获取用户信息（非组件中用getState）
const menus = getMenus(userInfo); // 传递用户信息
/**
 * 组件懒加载包装
 */
const SuspenseWrapper = ({ component }) => (
  <Suspense fallback={
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.8)',
      zIndex: 1000
    }}>
      <Spin size="large" tip="Loading..." />
    </div>
  }>
    {component}
  </Suspense>
);
// 路由守卫
// eslint-disable-next-line react-refresh/only-export-components
const AuthGuard = ({ children }) => {
  const location = useLocation();
  const setLocation = useStore(i => i?.setLocation);
  // 更新当前路由信息
  setLocation && setLocation(location)
  if (!localStorage.getItem(settings.request.tokenName)) {
    // 如果未登录，重定向到登录页，并记录原路径
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children; // 已登录，正常渲染子组件
}

/**
 * 根据菜单配置动态生成路由
 */
const generateRoutes = () => {
  // 筛选有效路由项
  const validMenus = menus.filter(menu => menu.path && menu.key);

  // 登录页面路由配置（独立页面）
  const loginRoute = validMenus.find(menu => menu.key === 'login');
  let loginRouteConfig = null;

  if (loginRoute) {
    try {
      const LazyLoginComponent = lazy(() => import(`@/auth/login/index.jsx`));
      loginRouteConfig = {
        path: loginRoute.path,
        Component: () => <SuspenseWrapper component={<LazyLoginComponent />} />,
      };
    } catch (error) {
      console.error(`加载登录组件失败:`, error);
    }
  }

  // 处理非登录路由
  const layoutRoutes = validMenus
    .filter(menu => menu.key !== 'login')
    .map(menu => {
      try {
        // 动态引入组件
        return {
          path: menu.path,
          element: <SuspenseWrapper component={<menu.Component />} />,
          hideInMenu: menu.hideInMenu,
          children: menu.children
        };
      } catch (error) {
        console.error(`加载组件 ${menu.key} 失败:`, error);
        return null;
      }
    }).filter(Boolean);
  // 配置Layout布局路由
  const mainRoute = {
    element: <AuthGuard><AppLayout /></AuthGuard>,
    children: layoutRoutes,
    path: '/',
  };
  // 合并路由
  const routes = [];

  // 根路径重定向到登录页
  routes.push({
    path: '/',
    element: <Navigate to={settings.router.homePath} replace />
  });
  // // 创建默认的重定向
  // mainRoute.children.forEach(item => {
  //   routes.push({
  //     path: item.path,
  //     element: <Navigate to="list" replace />
  //   });
  // })
  // 添加主布局路由
  routes.push(mainRoute);

  // 添加登录路由
  if (loginRouteConfig) {
    routes.push(loginRouteConfig);
  }

  // 添加404路由
  routes.push({
    path: '*',
    element: <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h1>404</h1>
      <p>页面不存在</p>
      <a href={settings.router.homePath}>返回首页</a>
    </div>
  });


  return routes;
};

// 创建路由配置
const routes = generateRoutes();
console.log("挂载的路由", routes)

// 创建Router实例
const router = createHashRouter(routes);
console.log("实例化的的路由", router)
// 仅使用命名导出
export { router }; 