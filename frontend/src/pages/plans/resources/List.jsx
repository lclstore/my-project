import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable';
import { router } from "@/utils/index.js";
import { renderNameColumn } from '@/common';
export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    //查询条件数组
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: "statusList",
        },
        {
            title: 'Usage',
            key: 'applicationCodeList',
            type: 'multiple',
            options: "BizResourceApplicationEnums",
        },
        {
            title: 'Gender',
            key: 'genderCode',
            type: 'multiple',
            options: "BizExerciseGenderEnums",
        },
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: "Cover Image",
                width: 200, 
                dataIndex: "coverImgUrl", mediaType: 'image',
            },
            {
                title: "Detail Image",
                width: 200,
                dataIndex: "detailImgUrl", mediaType: 'image',
            },
            {
                title: 'Name',
                sorter: true,
                showSorterTooltip: false,
                dataIndex: 'name',
                key: 'name',
                // width: 350,
                // visibleColumn: 1,
                render: renderNameColumn
            },
            {
                title: 'Status',
                dataIndex: 'status',
                sorter: true,
                options: 'displayStatus',
                // width: 120,
            },
            {
                title: 'Usage',
                dataIndex: 'applicationCode',
                sorter: true,
                options: 'BizResourceApplicationEnums',
                // width: 120,
            },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
                options: 'BizExerciseGenderEnums',
                // width: 120,
            },

            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                actionButtons: ['edit', 'duplicate', 'enable', 'delete'],
                isShow(record, btnName) {
                    const status = record.status;
                    // 简单的状态-按钮映射关系
                    if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
                    if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
                    if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
                    return false;
                }
            },
        ];
    }, []);

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Resources');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Resource',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => {
                    sessionStorage.clear();
                    router().push('editor')
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
            moduleKey="resource"
            searchConfig={{
                placeholder: "Search name or ID...",
            }}
            showColumnSettings={false}
            filterConfig={{
                filterSections: filterSections,
            }}
        />
    );
}   