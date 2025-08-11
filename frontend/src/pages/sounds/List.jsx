import React, { useContext, useEffect, useMemo, } from 'react';

import {
    PlusOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable';

export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    //查询条件数组
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: [{
                label: 'Draft',
                value: 'DRAFT'
            }, {
                label: 'Enabled',
                value: 'ENABLED'
            }, {
                label: 'Disabled',
                value: 'DISABLED'
            }],
        },
        {
            title: 'Usage',
            key: 'usageCodeList',
            options: "BizSoundUsageEnums"
        },
        {
            title: 'Gender',
            key: 'genderCodeList',
            options: 'BizSoundGenderEnums'
        },
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [

            {
                title: 'Name',
                sorter: true,
                dataIndex: 'name',
                renderName: 'renderNameColumn'
            },
            {
                title: 'Status',
                dataIndex: 'status',
                sorter: true,
                options: 'displayStatus',
            },
            {
                title: 'Usage',
                dataIndex: 'usageCode',
                sorter: true,
                options: 'BizSoundUsageEnums',
            },
            {
                title: 'Has a Script',
                width: 150,
                sorter: true,
                dataIndex: 'translation',
                render: (text, record) => {
                    return record.translation ? <CheckOutlined style={{ color: 'rgb(17, 204, 136)',fontSize: '13px' }} /> : '';
                }
            },

            {
                title: 'Female Audio', mediaType: 'audio', dataIndex: 'femaleAudioUrl', width: 240,
            },
            { title: 'Male Audio', mediaType: 'audio', dataIndex: 'maleAudioUrl', width: 240, },

            {
                title: 'Actions',
                fixed: 'right',
                width: 70,
                dataIndex: 'actions',
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],
            },
        ];
    }, []);
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Sounds');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Sound',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => {
                    sessionStorage.clear();
                    navigate('/sounds/editor')

                },
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    //渲染表格组件
    return (
        <ConfigurableTable
            columns={allColumnDefinitions}
            moduleKey="sound"
            searchConfig={{
                placeholder: "Search name or ID...",
            }}
            filterConfig={{
                filterSections: filterSections,
            }}
        />
    );
}   