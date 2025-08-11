/**
 * 应用菜单配置 - 根据pages目录动态生成
 * 
 * 菜单生成规则：
 * 1. 文件命名规则影响菜单显示和URL路径
 *    - xxxList.jsx: 生成列表页面，如 /workouts-list
 *    - xxxEditor.jsx: 生成编辑页面，如 /workouts-editor
 *    - xxxDetail.jsx: 生成详情页面，如 /workouts-detail
 * 2. 文件夹名决定菜单分组，如 workouts 文件夹下的文件都归属于 Workouts 菜单组
 * 3. 菜单排序通过 settings 配置中的 menuOrder 字段控制
 * 4. 菜单项Key生成规则：
 *    - 文件夹名转为大驼峰格式，如 profile-settings 转为 ProfileSettings
 *    - 文件特性拼接在后面，如 ProfileSettingsList、ProfileSettingsEditor
 */
import React from 'react';
import { Outlet } from "react-router";
import RouterRegister from "./RouterRegister.js";
import settings from './settings';
import { menuIconMap } from '@/constants';
import { useStore } from '@/store/index.js';

// 静态菜单项 - 只有登录页
const staticMenus = [
    {
        key: 'login',
        path: '/login',
        title: 'Login',
        icon: (() => {
            const IconComponent = menuIconMap.login;
            return IconComponent ? <IconComponent /> : null;
        })(),
        hideInMenu: true,
    }
];

/**
 * 菜单生成函数，返回菜单数组
 * @param {Object} userInfo - 用户信息
 * @returns {Array} 菜单数组
 */
export default function getMenus(userInfo) {
    // 动态生成菜单
    let dynamicMenus = [];

    try {
        // 动态获取所有pages目录下的jsx文件
        const pageFiles = import.meta.glob('../pages/**/*.jsx', { eager: true });

        // 处理菜单隐藏逻辑
        let hideInMenus = settings.menu?.menuHidden || [];
        if (userInfo.type === "NORMAL" && !hideInMenus.includes("users")) {
            hideInMenus.push("users");
        } else if (userInfo.type === "ADMIN" && hideInMenus.includes("users")) {
            hideInMenus = hideInMenus.filter(item => item !== "users");
        }

        // 创建路由注册列表
        let registerList = new RouterRegister({
            fileAddresList: Object.keys(pageFiles),
            dir: '../pages/',
            sign: 'pages',
            suffix: '.jsx',
            // 二次处理符合api结构
            createRule(routerConfig) {
                [
                    routerConfig.folderName,
                    routerConfig.hideInMenu,
                    routerConfig.icon,
                    routerConfig.key,
                    routerConfig.order,
                    routerConfig.title,
                    routerConfig.Component,
                ] = [
                        routerConfig.meta,
                        routerConfig.noShow || hideInMenus.includes(routerConfig.meta),
                        (() => {
                            const IconComponent = menuIconMap[routerConfig.meta];
                            return IconComponent ? <IconComponent /> : null;
                        })(),
                        routerConfig.path,
                        settings.menu?.menuOrder?.[routerConfig.meta] || 999,
                        routerConfig.showName,
                        (routerConfig.isFatherDom) ? { default: () => <Outlet /> } : pageFiles['../pages/' + routerConfig.component]
                    ];
                if (routerConfig.Component) {
                    routerConfig.Component = routerConfig.Component.default;
                }
            },
            indexCreateRule(routerConfig) {
                routerConfig.Component = pageFiles['../pages/' + routerConfig.component];
                if (routerConfig.Component) {
                    routerConfig.Component = routerConfig.Component.default;
                }
            }
        });

        dynamicMenus = registerList;
        // 按照order字段排序菜单
        dynamicMenus.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error('菜单生成错误:', error);
    }

    // 合并静态菜单和动态菜单
    return [...dynamicMenus, ...staticMenus];
}


