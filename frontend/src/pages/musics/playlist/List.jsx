import React, { useContext, useEffect, useMemo, useCallback } from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable';
import { renderNameColumn, renderSwitchColumn } from '@/common';
export default function Playlists() {
    //  状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航

    const filterSections = useMemo(() => [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple',
            options: 'statusList'
        }, {
            title: 'Type',
            key: 'typeList',
            type: 'multiple',
            options: 'BizPlaylistTypeEnums'
        }
    ], []);

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 简单的状态-按钮映射关系
        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        return false;
    }, []);

    //   表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name', dataIndex: 'name', width: 350,
                render: renderNameColumn
            },
            {
                title: 'Status',
                dataIndex: 'status',
                options: 'displayStatus'
            },
            {
                title: 'Premium', dataIndex: 'premium', render: renderSwitchColumn
            },
            {
                title: 'Type', dataIndex: 'type',
                options: "BizPlaylistTypeEnums"
            },

            { title: 'Music Num', dataIndex: 'musicCount', align: 'center' },


            {
                title: 'Actions',
                fixed: 'right',
                dataIndex: "actions",
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
            },
        ];
    }, [isButtonVisible]);

    //设置导航栏按钮
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Playlists');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create Playlist',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => {
                    sessionStorage.clear();
                    navigate('/musics/playList/editor')
                },
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    //渲染 - 组件UI呈现
    return (
        <>
            {/* 可配置表格组件 */}
            <ConfigurableTable
                moduleKey="playlist"
                paddingTop={50}
                columns={allColumnDefinitions}
                searchConfig={{
                    placeholder: "Search name or ID...",

                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections,
                }}
            />
        </>
    );
}   