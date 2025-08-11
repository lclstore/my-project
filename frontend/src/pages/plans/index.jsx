import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import StickyBox from 'react-sticky-box';
import { Outlet, useNavigate, useLocation } from "react-router";



const tabItems = [
    {
        key: 'template/list',
        label: 'Templates',
    },
    {
        key: 'workout/list',
        label: 'Template-Workouts',
    },
    {
        key: 'resources/list',
        label: 'Resources',
    },
    {
        key: 'replaceWorkoutSettings/list',
        label: 'Replace Workout Settings',
    },
    {
        key: 'replaceNameSettings/list',
        label: 'Plan Name Settings',
    },
];
export default () => {
    const path = "/plans"
    const [defaultTabItem, setDefaultTabItem] = useState(tabItems[0]);
    const [showTab, setShowTab] = useState(true)
    const navigate = useNavigate(); // 路由导航
    const location = useLocation();
    // 路由监听
    useEffect(() => {
        // 初始加载自动跳转到默认的tab
        location.pathname === path && navigate(tabItems[0].key, { replace: true })
        // 初始加载的时候如果已有路由就重置 defaultTabItem
        tabItems.forEach(i => location.pathname.includes(i.key) && setDefaultTabItem(i))
        setShowTab(!location.pathname.includes("editor"))
    }, [location.pathname]);
    const onChange = (key) => {
        console.log(key, path)
        setDefaultTabItem(tabItems.find(item => item.key === key))
        navigate(path + '/' + key, { replace: true })
    };

    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    return (<>
        <Tabs style={{ backgroundColor: 'white', display: `${showTab ? "block" : "none"}` }} activeKey={defaultTabItem.key} onChange={onChange} renderTabBar={renderTabBar} items={tabItems} />
        <Outlet />
    </>);
}