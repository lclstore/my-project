import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Button } from 'antd';
import ConfigurableTable from '@/components/ConfigurableTable';
import request from "@/request";
import { tabLabels as num } from "../List.jsx"
import { HeaderContext } from '@/contexts/HeaderContext';
import { renderNameColumn } from '@/common';

export default ({ bizType }) => {
    // 1. 状态定义 - 组件内部状态管理
    const [dataSource, setDataSource] = useState([]); // 表格数据源
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [], createUser: [] }); // 筛选条件
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dataAfter, setDataAfter] = useState(null);
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API

    const showModal = (e) => {
        console.log('333', e)
        let items = JSON.parse(e);
        for (const key in items) {
            console.log(key, items[key]);
            if (isJsonString(items[key])) {
                items[key] = JSON.parse(items[key]);
            }
        }
        setDataAfter(items);
        setIsModalOpen(true);
        function isJsonString(str) {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                return false;
            }
        }
    };



    // 查询渲染项
    const filterSections = useMemo(() => {
        console.log('bizType', bizType)
        if (bizType === 'Generate Tasks') {
            return [
                {
                    title: 'Operation Type',
                    key: 'operationTypeList',
                    options: [
                        { label: 'Template Generate Workout', value: 'TEMPLATE_GENERATE_WORKOUT' },
                        { label: 'Template Generate File', value: 'TEMPLATE_GENERATE_WORKOUT_FILE' },
                        { label: 'Workout Generate File', value: 'WORKOUT_GENERATE_FILE' }
                    ]
                }
            ]
        } else {
            return null
        }
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name',
                dataIndex: 'dataInfo',
                width: 120,
                visibleColumn: 0,
                render: renderNameColumn
            },
            {
                title: 'Operation Type',
                dataIndex: 'operationType',
                options: 'operationTypes',
                width: 120,
                visibleColumn: 0,

            },
            {
                title: 'After Data',
                dataIndex: 'dataAfter',
                width: 120,
                visibleColumn: 0,
                render: (value, row) => {
                    return (

                        <Button style={{ height: '25px', padding: "0px 10px", fontWeight: "400" }} onClick={() => {
                            showModal(value)
                        }} type="primary">view</Button>
                    )
                }
            },
            {
                title: 'Operation Time',
                dataIndex: 'operationTime',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Operation User',
                dataIndex: 'operationUser',
                width: 120,
                visibleColumn: 0
            },

        ];
    }, []);

    /**
     * 搜索处理函数
     * 直接执行搜索，根据条件过滤数据
     */
    const performSearch = useCallback((searchText, filters) => {
        setLoading(true);
        setTimeout(() => {
            // 复制原始数据
            let filteredData = [];

            // 按状态过滤
            const statuses = filters?.status || [];
            if (statuses.length > 0) {
                filteredData = filteredData.filter(user => statuses.includes(user.status));
            }

            // 按创建者过滤
            const createUsers = filters?.createUser || [];
            if (createUsers.length > 0) {
                filteredData = filteredData.filter(user => createUsers.includes(user.createUser));
            }

            // 关键词搜索
            if (searchText) {
                const lowerCaseSearch = searchText.toLowerCase();
                filteredData = filteredData.filter(user =>
                    (user.name && user.name.toLowerCase().includes(lowerCaseSearch)) ||
                    (user.email && user.email.toLowerCase().includes(lowerCaseSearch))
                );
            }

            setDataSource(filteredData);
            setLoading(false);
        }, 0); // 立即执行
    }, []);

    /**
     * 搜索输入变化处理
     */
    const handleSearchInputChange = useCallback((e) => {
        const { value } = e.target;
        setSearchValue(value);
        console.log(value)
        performSearch(value, selectedFilters);
    }, [performSearch, selectedFilters]);

    /**
     * 筛选更新处理
     */
    const handleFilterUpdate = useCallback((newFilters) => {
        setSelectedFilters(newFilters);
        performSearch(searchValue, newFilters);
    }, [performSearch, searchValue]);

    /**
     * 重置筛选器处理
     */
    const handleFilterReset = useCallback(() => {
        setSelectedFilters({});
        setSearchValue('');
        performSearch('', {});
    }, [performSearch]);

    /**
     * 处理行点击
     */
    const handleRowClick = useCallback((record, event) => {
        // 检查是否点击了操作区域
        const isActionClick = event.target.closest('.actions-container');
        if (isActionClick) {
            return;
        }

    }, []);
    /**
     * 筛选后的表格数据
     */
    const filteredDataForTable = useMemo(() => {
        setLoading(true);
        let tempData = [...dataSource];
        setLoading(false);
        return tempData;
    }, [dataSource]);

    // 副作用 - 组件生命周期相关处理getTableList

    const getTableList = useCallback(async (params) => {
        let value = num.filter(item => item.label === bizType)[0].value
        // 特殊情况bizType替换
        return new Promise(resolve => {
            request.get({
                url: '/opLogs/page', data: {
                    bizType: value,
                    ...params
                },
                callback: (res) => {
                    resolve(res.data)
                }
            });
        })
    }, [])
    useEffect(() => {
        setButtons([])
    }, [])
    /**
     * 重置操作标志
     */

    // 表格数据和配置
    // 渲染 - 组件UI呈现
    return (
        <>
            {/* 可配置表格组件 */}
            <ConfigurableTable
                uniqueId={'categoryList'}
                columns={allColumnDefinitions}
                getTableList={getTableList}
                dataSource={filteredDataForTable}
                loading={loading}
                onRowClick={handleRowClick}
                searchConfig={{
                    placeholder: "Search name or ID...",
                    searchValue: searchValue,
                    onSearchChange: handleSearchInputChange,
                }}
                filterConfig={{
                    filterSections,
                    activeFilters: selectedFilters,
                    onUpdate: handleFilterUpdate,
                    onReset: handleFilterReset,
                }}
            />

            {/* 展示JSON数据 */}
            <Modal
                title="After Data"
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsModalOpen(false)}>
                        close
                    </Button>,
                ]}
            >
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {dataAfter && JSON.stringify(dataAfter, null, 4)}
                </pre>
            </Modal>
        </>
    );
}