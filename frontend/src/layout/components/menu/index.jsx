import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import getMenus from '@/config/menu';
import styles from './menu.module.css';
import { useEffect, useState } from 'react';
import { useStore } from '@/store/index.js';

export default function SideMenu() {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedKeys, setSelectedKeys] = useState([]);
    const userInfo = useStore((state) => state.userInfo);
    const menuItems = getMenus(userInfo);
    useEffect(() => {
        const pathname = location.pathname;
        let targetKey = null;

        // 1. 处理根路径
        // if (pathname === '/') {
        //     const defaultMenu = menuItems.find(item => item.path === '/exercises');
        //     if (defaultMenu) {
        //         targetKey = defaultMenu.key;
        //     }
        // } else {
        //     // 2. 尝试查找直接匹配的可见菜单项
        //     const directMatch = menuItems.find(item => item.path === pathname && !item.hideInMenu);
        //     if (directMatch) {
        //         targetKey = directMatch.key;
        //     } else {
        //         // 3. 如果没有直接匹配，尝试查找关联的 List 菜单项 (针对 editor/detail 页)
        //         const pathParts = pathname.match(/^\/([a-zA-Z0-9-]+)-(editor|detail)$/);
        //         if (pathParts && pathParts[1]) {
        //             const baseName = pathParts[1]; // 例如从 "/users-editor" 提取 "users"
        //             const listPath = `/${baseName}-list`;
        //             const listMenu = menuItems.find(item => item.path === listPath);
        //             if (listMenu) {
        //                 targetKey = listMenu.key; // 高亮对应的 List 菜单项
        //             }
        //         }
        //     }
        // }
        targetKey = menuItems.find(item => pathname.startsWith(item.active))?.key;

        // 4. 设置选中的 Key
        if (targetKey) {
            setSelectedKeys([targetKey]);
        } else {
            // 如果找不到匹配项，则清空选中状态
            setSelectedKeys([]);
        }
    }, [location.pathname]);

    // 过滤掉hideInMenu为true的菜单项
    const filteredMenuItems = menuItems.filter(item => !item.hideInMenu);

    // 处理菜单点击事件
    const handleMenuClick = ({ key }) => {
        const targetMenuItem = menuItems.find(item => item.key === key);
        if (targetMenuItem && targetMenuItem.path) {
            let dumpPath = "";
            // 默认是list
            targetMenuItem.children.map(i => i.path).some(i => i === "list") && (dumpPath = "/list");
            // indexFatherDom 就跳本身
            navigate(targetMenuItem.path + dumpPath);
        }
    };

    return (
        <div className={styles.menuContainer}>
            <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                onClick={handleMenuClick}
                style={{ width: '100%', fontWeight: 600 }}
                items={filteredMenuItems.map(item => ({
                    key: item.key,
                    icon: item.icon,
                    label: item.title,
                }))}
            />
        </div>
    );
}