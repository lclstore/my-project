import React, { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from 'react-router';
import { Tabs } from 'antd';
import StickyBox from "react-sticky-box";

export default function CollectionsList() {
    const [showTab, setShowTab] = useState(true)
    const navigate = useNavigate(); // 路由导航
    const tabItems = [
        {
            key: 'music/list',
            label: 'Musics',
        },
        {
            key: 'playlist/list',
            label: 'Playlists',
        },
    ];
    const [defaultTabItem, setDefaultTabItem] = useState(tabItems[0]);
    const location = useLocation();
    // 路由监听
    useEffect(() => {
        setShowTab(!location.pathname.includes("editor"))
    }, [location]);
    function onChange(key) {
        setDefaultTabItem(tabItems.find(item => item.key === key))
        navigate("/musics/" + key, { replace: true })
    }
    useEffect(() => {
        const path = "/musics"
        // if (location.pathname.includes("editor")) {
        //     navigate(location.pathname, { replace: true })
        //     return
        // }
        let currentTab = tabItems.find(item => location.pathname.includes(item.key)) || tabItems[0];
        setDefaultTabItem(currentTab);
        // 初始加载自动跳转到默认的tab
        location.pathname === path && navigate(currentTab.key,{ replace: true })
    }, [location.pathname]);
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );
    return (
        <>
            <Tabs style={{ backgroundColor: 'white', display: `${showTab ? "block" : "none"}`, flex: 1 }} activeKey={defaultTabItem.key}
                renderTabBar={renderTabBar}
                items={tabItems.map(i => ({ ...i, children: <div>{i.children}</div> }))}
                onChange={onChange} />
            <Outlet />
        </>)
}