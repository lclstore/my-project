import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { router } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable';
import { useStore } from "@/store/index.js";
import { renderNameColumn } from '@/common';
export default function WorkoutsList() {

    // 定义筛选器配置
    let filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList',
        },
    ];


    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const optionsBase = useStore(i => i.optionsBase)
    const tableRef = useRef(null);

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 简单的状态-按钮映射关系
        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name', dataIndex: 'name', width: 350,
                // sorter: true,
                render: renderNameColumn
            },
            {
                title: 'Status',
                dataIndex: 'status',
                width: 150,
                // sorter: true,
                options: 'displayStatus',
            },
            {
                title: 'Rules',
                align: 'center',
                dataIndex: 'ruleList',
                render: (text, row) =>
                (text?.map(rule =>
                    `(${optionsBase.getLabel("BizPlanReplaceSettingsRuleMatchKeyEnums", rule.matchKey)} ${optionsBase.getLabel("BizPlanReplaceSettingsRuleMatchConditionEnums", rule.matchCondition)} ${optionsBase.getLabel(rule.matchKey === "GENDER" ? "BizPlanGenderEnums" : "BizPlanUserEnums", rule.matchValue)})`)
                    .join("\n& ")
                )
            },
            {
                title: 'Workout ID',
                align: 'center',
                dataIndex: 'workoutListStr',
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['edit', 'duplicate', 'enable', 'deprecate', 'delete', 'disable'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
            },
        ];
    }, [isButtonVisible]);

    // 7. 副作用 - 组件生命周期相关处理
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Replace Workout Settings');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Set Replace Workout',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => router().push('editor'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    return (
        <ConfigurableTable
            ref={tableRef}
            columns={allColumnDefinitions}
            moduleKey="planReplaceSettings"
            searchConfig={{
                placeholder: "Search name or ID...",
            }}
            filterConfig={{
                filterSections: filterSections,
            }}
        />
    );
}   