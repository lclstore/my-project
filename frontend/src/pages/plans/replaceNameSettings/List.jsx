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
        if (status === 'ENABLED' && ['edit', 'duplicate'].includes(btnName)) return true;
        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name', dataIndex: 'name', 
                // width: 350, 
                // sorter: true,
                render: renderNameColumn
            },
            {
                title: 'Status',
                dataIndex: 'status',
                options: 'displayStatus',
            },
            // {
            //     title: 'Description',
            //     dataIndex: 'description',
            // },
            {
                title: 'Rules',
                align: 'center',
                width: 350,
                dataIndex: 'ruleList',
                render: (text, row) =>
                (text.map(rule =>
                    `(${optionsBase.getLabel("BizPlanNameSettingsRuleMatchKeyEnums", rule.matchKey)} ${optionsBase.getLabel("BizPlanNameSettingsRuleMatchConditionEnums", rule.matchCondition)} ${optionsBase.getLabel(rule.matchKey === "COMPLETED_TIMES" ? "BizPlanNameSettingsCompletedTimesEnums" : "BizPlanNameSettingsTrainingPositionEnums", rule.matchValue)})`)
                    .join("\n& ")
                )
            },
            {
                title: 'Plan Name',
                dataIndex: 'planName',
            },

            {
                title: 'Stage1 Name',
                dataIndex: 'stage1Name',
            },
            {
                title: 'Stage2 Name',
                dataIndex: 'stage2Name',
            },
            {
                title: 'Stage3 Name',
                dataIndex: 'stage3Name',
            },
            {
                title: 'Stage4 Name',
                dataIndex: 'stage4Name',
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['edit', 'duplicate', 'enable', 'deprecate', 'delete'],
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
        setCustomPageTitle('Plan Name Settings');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Set Plan Name',
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
            moduleKey="planNameSettings"
            searchConfig={{
                placeholder: "Search name or ID...",
            }}
            filterConfig={{
                filterSections: filterSections,
            }}
        />
    );
}   