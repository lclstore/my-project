import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { login as loginApi, getUserInfo as getUserInfoApi, logout as logoutApi } from '@/api/user';
import { storageKeys } from '../constants';
import settings from '@/config/settings';

/**
 * 认证相关的自定义Hook
 * @returns {Object} 认证相关的状态和方法
 */
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(storageKeys.TOKEN));
  const navigate = useNavigate();

  /**
   * 登录
   * @param {Object} values - 登录表单值
   * @returns {Promise}
   */
  const login = useCallback(async (values) => {
    try {
      setLoading(true);
      const response = await loginApi(values);

      // 保存token到localStorage
      localStorage.setItem(storageKeys.TOKEN, response.token);
      setIsAuthenticated(true);

      // 获取用户信息
      const userInfo = await getUserInfoApi();
      setUser(userInfo);

      // 保存用户信息到localStorage
      localStorage.setItem(storageKeys.USER_INFO, JSON.stringify(userInfo));

      message.success('登录成功');

      // 跳转到首页
      navigate(settings.router.homePath);

      return { success: true };
    } catch (error) {
      message.error('登录失败: ' + (error.message || '未知错误'));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * 退出登录
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // 调用退出登录接口
      await logoutApi();

      // 清除本地存储的认证信息
      localStorage.removeItem(storageKeys.TOKEN);
      localStorage.removeItem(storageKeys.USER_INFO);

      // 重置状态
      setUser(null);
      setIsAuthenticated(false);

      message.success('已退出登录');

      // 跳转到登录页
      navigate(settings.router.loginPath);
    } catch (error) {
      message.error('退出登录失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * 获取用户信息
   */
  const getUserInfo = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const userInfo = await getUserInfoApi();
      setUser(userInfo);
      localStorage.setItem(storageKeys.USER_INFO, JSON.stringify(userInfo));
    } catch (error) {
      console.error('获取用户信息失败', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * 检查用户是否有权限
   * @param {string} permission - 权限标识
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // 在组件挂载时尝试获取用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem(storageKeys.USER_INFO);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('解析用户信息失败', error);
      }
    }

    if (isAuthenticated && !user) {
      getUserInfo();
    }
  }, [isAuthenticated, user, getUserInfo]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    getUserInfo,
    hasPermission
  };
} 