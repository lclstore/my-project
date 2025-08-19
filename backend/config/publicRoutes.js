/**
 * 公开路由配置
 * 这些路由不需要token验证，其他所有路由默认都需要token验证
 */

// 获取API前缀（从环境变量读取，默认为/api）
const API_PREFIX = process.env.API_PREFIX || '/api';

const PUBLIC_ROUTES = [
  // ===== 用户相关公开接口 =====
  { method: 'POST', path: `${API_PREFIX}/user/login`, description: '用户登录' },
  { method: 'POST', path: `${API_PREFIX}/user/register`, description: '用户注册' },

  // ===== API文档相关公开接口 =====
  { method: 'GET', path: `${API_PREFIX}/swagger-ui`, description: 'Swagger UI 页面' },

  // ===== 公共接口 =====
  { method: 'GET', path: `${API_PREFIX}/common/language/list`, description: '查询语言列表' },

  // ===== 系统接口 =====
  { method: 'GET', path: '/', description: '根路径' },
  { method: 'OPTIONS', path: '*', description: 'CORS预检请求' }
];

/**
 * 检查当前请求是否为公开路由
 * @param {string} method - HTTP方法
 * @param {string} path - 请求路径
 * @returns {boolean} 是否为公开路由
 */
const isPublicRoute = (method, path) => {
  return PUBLIC_ROUTES.some(route => {
    // 处理OPTIONS请求（CORS预检）
    if (route.method === 'OPTIONS' && route.path === '*') {
      return method === 'OPTIONS';
    }

    // 精确匹配
    if (route.path === path && route.method === method) {
      return true;
    }

    // 特殊处理 Swagger UI 路径 - 支持所有子路径和静态资源
    if (route.path.includes('/swagger-ui') && method === 'GET') {
      // 匹配 /swagger-ui 及其所有子路径
      return path.startsWith(route.path);
    }

    // 支持路径前缀匹配（例如 /api/files/download 匹配 /api/files/download/123）
    if (path.startsWith(route.path) && route.method === method) {
      // 确保是完整的路径段匹配，避免 /api/files 匹配到 /api/filesxxx
      const remainingPath = path.substring(route.path.length);
      return remainingPath === '' || remainingPath.startsWith('/');
    }

    return false;
  });
};

/**
 * 获取所有公开路由
 * @returns {Array} 公开路由列表
 */
const getPublicRoutes = () => {
  return [...PUBLIC_ROUTES];
};

module.exports = {
  PUBLIC_ROUTES,
  isPublicRoute,
  getPublicRoutes
};
