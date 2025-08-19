import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Modal, message } from 'antd';
import { useStore } from "@/store/index.js";
import PropTypes from 'prop-types';

// 导入子组件
import TableHeader from './components/TableHeader';
import TableContent from './components/TableContent';
import TableActions from './components/TableActions';
import MediaCell from './components/MediaCell';

// 导入Hooks
import { useTableColumns } from './hooks/useTableColumns';
import { useTableData } from './hooks/useTableData';
import { useTableDrag } from './hooks/useTableDrag';

// 导入工具函数
import { processColumns, getVisibleColumnKeys, getStoredCache } from './columnUtils';
import { publicDeleteData, publicUpdateStatus } from "@/config/api.js";
import { defaultPagination } from '@/constants';

// 导入样式
import './style.less';
/**
 * 可配置表格组件
 * 
 * 经过重构的表格组件，将复杂的逻辑拆分为多个可复用的子组件和hooks
 */
const ConfigurableTable = forwardRef((props, ref) => {
    const {
        // 表格数据
        columns = [],
        dataSource = [],
        rowKey = 'id',

        // 表格配置
        paddingTop = 20,
        noDataTip,
        refreshKey = 0,
        loading: externalLoading = false,

        // 交互配置
        onRowClick,
        isInteractionBlockingRowClick = false,

        // 列配置
        mandatoryColumnKeys = [],
        visibleColumnKeys,
        onVisibilityChange,
        showColumnSettings = false,

        // 功能配置
        searchConfig,
        filterConfig,
        paginationConfig = defaultPagination,
        scrollX = true,
        rowSelection,
        tableProps,
        leftToolbarItems = [],

        // 特殊功能
        getTableList,
        moduleKey,
        operationName = 'page',
        showPagination = true,
        draggable = false,
        onDragEnd,
        expandedRowRender,
        getListAfer,
    } = props;
    // 获取路由和存储
    const navigate = useNavigate();
    const location = useLocation();
    const optionsBase = useStore(i => i.optionsBase);
    const [messageApi, contextHolder] = message.useMessage();

    // 从URL获取模块信息
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const routeLevel = pathSegments.length;
    const urlModuleKey = pathSegments[1];
    const effectiveModuleKey = moduleKey || urlModuleKey;
    // 获取路径
    const pathUrl = routeLevel == 3 ? `${pathSegments[0]}/${pathSegments[1]}` : location.pathname.split('/')[1];

    // 本地存储key
    const storageKey = `table_visible_columns_${effectiveModuleKey}`;

    // 获取缓存的搜索条件
    const cachedSearch = getStoredCache(location.pathname);

    // 删除确认对话框状态
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteRowData, setDeleteRowData] = useState(null);

    // 使用表格列配置Hook
    const {
        visibleColumns,
        effectiveVisibleKeys,
        defaultVisibleKeys,
        updateVisibility,
        columnOptions,
    } = useTableColumns(columns, {
        visibleColumnKeys,
        mandatoryColumnKeys,
        storageKey,
        onVisibilityChange
    });

    // 使用表格数据Hook
    const {
        tableData,
        loading: dataLoading,
        searchValue,
        setSearchValue,
        activeFilters,
        paginationParams,
        updateFilters,
        resetFilters,
        handleSort,
        handlePainate,
        fetchData
    } = useTableData({
        initialData: dataSource,
        getTableList,
        moduleKey: effectiveModuleKey,
        operationName,
        defaultPagination: paginationConfig
    });

    // 使用表格拖拽Hook
    const {
        items: draggableItems,
        updateItems,
        syncItems,
        handleDragEnd
    } = useTableDrag({
        initialItems: tableData,
        onDragEnd,
        rowKey,
        moduleKey: effectiveModuleKey
    });

    // 当表格数据变更时，同步到拖拽项
    useEffect(() => {
        if (draggable) {
            syncItems(tableData);
        }
    }, [tableData, draggable, syncItems]);

    // 监听refreshKey变化，触发数据刷新
    useEffect(() => {
        if (refreshKey > 0) {
            if (refreshKey === 1) {
                // 当前页面刷新
                fetchData();
            } else if (refreshKey === 2) {
                // 重置页码并刷新
                fetchData({ pageIndex: 1 });
            }
        }
    }, [refreshKey]);

    // 最终加载状态
    const finalLoading = externalLoading || dataLoading;

    // 是否有激活的筛选器
    const hasActiveFilters = useMemo(() => {
        if (!activeFilters) return false;

        return Object.values(activeFilters).some(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return !!value;
        });
    }, [activeFilters]);
    // 当前列配置
    const columnSettingsValue = useMemo(() => {
        const visibleColumns = { visibleColumns: effectiveVisibleKeys }
        return visibleColumns;
    }, [effectiveVisibleKeys]);
    // 默认列配置
    const defaultColumnSettingsValue = useMemo(() => {
        const visibleColumns = { visibleColumns: defaultVisibleKeys }

        return visibleColumns;
    }, [defaultVisibleKeys]);
    // 是否有非默认的列设置
    const hasActiveColumnSettings = useMemo(() => {
        // 从实际可见列中过滤出可配置的列
        const configuredColumns = effectiveVisibleKeys.filter(key =>
            !mandatoryColumnKeys.includes(key)
        );

        // 默认可见的可配置列
        const defaultConfigurableKeys = getVisibleColumnKeys(columns, 2);

        // 比较当前配置与默认配置是否一致
        if (configuredColumns.length !== defaultConfigurableKeys.length) return true;

        const configuredSet = new Set(configuredColumns);
        for (const key of defaultConfigurableKeys) {
            if (!configuredSet.has(key)) return true;
        }

        return false;
    }, [effectiveVisibleKeys, mandatoryColumnKeys, columns]);


    // 处理行点击
    const handleRow = useCallback((record) => {
        // 如果交互状态阻止点击，则不绑定点击事件
        if (isInteractionBlockingRowClick) {
            return {};
        }

        // 绑定点击事件
        return {
            onClick: (event) => {
                // 检查是否点击了操作区域
                const isActionClick = event.target.closest('.actions-container');
                if (isActionClick) {
                    return;
                }

                // 检查是否点击了媒体单元格
                const isMediaClick = event.target.closest('.media-cell') ||
                    (event.target.classList &&
                        (event.target.classList.contains('media-cell') ||
                            event.target.classList.contains('mediaCell')));
                if (isMediaClick) {
                    return;
                }

                // 检查是否点击了复选框
                const isCheckboxClick = event.target.closest('td.ant-table-cell.ant-table-selection-column') ||
                    (event.target.classList &&
                        (event.target.classList.contains('ant-table-selection-column') ||
                            event.target.classList.contains('ant-checkbox-wrapper') ||
                            event.target.classList.contains('ant-checkbox') ||
                            event.target.classList.contains('ant-checkbox-input')));
                if (isCheckboxClick) {
                    return;
                }

                // 调用外部行点击处理函数
                if (onRowClick) {
                    onRowClick(record, event);
                } else {

                    // 默认行为：导航到编辑页面
                    navigate(`/${pathUrl}/editor?id=${record[rowKey]}`);
                }
            },
            style: { cursor: 'pointer' }
        };
    }, [isInteractionBlockingRowClick, onRowClick, navigate, pathUrl, rowKey]);

    // 处理表格操作按钮点击
    const handleActionClick = useCallback(async (key, rowData, e, processedCol) => {
        console.log(processedCol, 'processedCol')
        switch (key) {
            case 'edit':
                processedCol.edit ? processedCol.edit(rowData, e) : navigate(`/${pathUrl}/editor?id=${rowData[rowKey]}`);
                break;

            case 'duplicate':
                processedCol.duplicate ? processedCol.duplicate(rowData, e) : navigate(`/${pathUrl}/editor?id=${rowData[rowKey]}&isDuplicate=true`);
                break;

            case 'delete':
                setDeleteRowData(rowData);
                setDeleteModalVisible(true);
                break;

            case 'enable':
            case 'disable':

                // 实现启用/禁用功能
                try {
                    const result = await publicUpdateStatus(
                        { idList: [rowData[rowKey]] },
                        `/${moduleKey}/${key}`
                    );

                    if (result.success) {
                        messageApi.success(`successfully!`);
                        fetchData(); // 刷新表格数据
                    }
                } catch (error) {
                    messageApi.error(`operation failed: ${error.message}`);
                }
                break;

            default:
                // 其他操作
                break;
        }
    }, [navigate, pathUrl, rowKey, messageApi, fetchData]);

    // 处理媒体渲染
    const renderMedia = useCallback((record, processedCol) => {
        return <MediaCell record={record} processedCol={processedCol} />;
    }, []);

    // 处理操作按钮渲染
    const renderActions = useCallback((record, columnConfig) => {
        return (
            <TableActions
                record={record}
                columnConfig={columnConfig}
                onActionClick={handleActionClick}
                moduleKey={effectiveModuleKey}
                rowKey={rowKey}
                buttonsConfig={[
                    { key: 'edit', icon: null, label: 'Edit' },
                    { key: 'duplicate', icon: null, label: 'Duplicate' },
                    { key: 'enable', icon: null, label: 'Enable' },
                    { key: 'disable', icon: null, label: 'Disable' },
                    { key: 'delete', icon: null, label: 'Delete' },
                ]}
            />
        );
    }, [handleActionClick, effectiveModuleKey, rowKey]);

    // 公共的列处理参数
    const processColumnsCommonProps = {
        renderMedia,
        optionsBase,
        handleAction: renderActions
    };

    // 封装列处理函数
    const getProcessedColumns = useCallback(
        (columnList = visibleColumns) => processColumns(columnList, processColumnsCommonProps),
        [visibleColumns, renderMedia, optionsBase, renderActions]
    );

    // 主表格列
    const processedColumns = useMemo(() => getProcessedColumns(), [getProcessedColumns]);

    // 计算可见列的总宽度
    const totalVisibleWidth = useMemo(() => {
        if (!scrollX) return undefined;
        return processedColumns.reduce((acc, col) => {
            let width = 0;
            if (typeof col.width === 'number') width = col.width;
            else if (typeof col.width === 'string') {
                const parsedWidth = parseInt(col.width, 10);
                if (!isNaN(parsedWidth)) width = parsedWidth;
            }
            return acc + (width > 0 ? width : 150);
        }, 0);
    }, [processedColumns, scrollX]);
    // 计算可见列的总高度
    const [tableHeight, setTableHeight] = useState(0)

    // 计算滚动配置
    const finalScrollConfig = useMemo(() => {
        if (!scrollX && !tableProps?.scroll?.y) return undefined;

        const config = {};

        if (scrollX) {
            config.x = totalVisibleWidth;
            config.scrollToFirstRowOnChange = true;
        }

        // 如果外部传入了明确的scroll.y数值，则使用它
        // config.y = tableHeight
        if (tableProps?.scroll?.y && typeof tableProps.scroll.y === 'number') {
            config.y = tableProps.scroll.y;
        }
        return config;
    }, [scrollX, totalVisibleWidth, tableHeight, tableProps?.scroll?.y]);

    // 处理分页配置
    const finalPaginationConfig = useMemo(() => {
        if (!showPagination) return false;

        return {
            current: paginationParams.pageIndex,
            pageSize: paginationParams.pageSize,
            total: paginationParams.totalCount || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000'],
            showTotal: (total) => `${total} items`,
        };
    }, [showPagination, paginationParams,]);

    // 处理表格变更
    const handleTableChange = useCallback((pagination, filters, sorter, extra) => {
        const { action } = extra;
        // 处理排序
        if (action === 'sort' && sorter) {
            const isAscending = sorter.order === 'ascend';
            const orderBy = sorter.field;
            const orderDirection = isAscending ? 'ASC' : 'DESC';
            handleSort(orderBy ? {
                field: orderBy,
                order: orderDirection
            } : null);
        }
        // 处理分页
        if (action === 'paginate' && pagination) {
            handlePainate(pagination)
        }
    }, []);



    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
        // 获取查询参数
        getSearchData: () => ({
            ...paginationParams,
            ...activeFilters,
            [searchConfig?.fieldName || 'keywords']: searchValue
        }),

        // 获取/设置选中项
        selectList: {
            get: () => rowSelection?.selectedRowKeys || [],
            set: (keys) => rowSelection?.onChange?.(keys, tableData.filter(item => keys.includes(item[rowKey])))
        },

        // 获取表格数据
        listData: {
            get: () => tableData
        },

        // 刷新数据
        refresh: fetchData
    }));
    return (
        <div className="configurable-table-container" style={{ paddingTop }}>
            {contextHolder}

            {/* 表格头部 */}
            <TableHeader
                searchConfig={searchConfig}
                searchValue={searchValue}
                onSearchChange={(value) => {
                    console.log(value);

                    setSearchValue(value);
                }}
                filterConfig={filterConfig}
                activeFilters={activeFilters}
                onFilterUpdate={updateFilters}
                onFilterReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
                showColumnSettings={showColumnSettings}
                columnSettingsSection={columnOptions}
                columnSettingsActive={hasActiveColumnSettings}
                columnSettingsValue={columnSettingsValue}
                defaultColumnSettingsValue={defaultColumnSettingsValue}
                onColumnSettingsUpdate={(values) => updateVisibility(values.visibleColumns || [])}

                leftToolbarItems={leftToolbarItems}
            />

            {/* 表格内容 */}
            <TableContent
                getProcessedColumns={getProcessedColumns}
                columns={processedColumns}
                dataSource={tableData}
                loading={finalLoading}
                draggableItems={draggableItems}
                rowKey={rowKey}

                pagination={finalPaginationConfig}
                scroll={finalScrollConfig}
                rowSelection={rowSelection}
                expandable={expandedRowRender ? {
                    expandedRowRender,
                    rowExpandable: () => true
                } : undefined}

                onRow={handleRow}
                onChange={handleTableChange}
                draggable={draggable}
                onDragEnd={handleDragEnd}

                // showEmpty={!tableData || tableData.length === 0}
                // emptyText={noDataTip || `You don't have any ${effectiveModuleKey} yet`}
                tableProps={tableProps}
            />

            {/* 删除确认对话框 */}
            <Modal
                title="Confirm Delete"
                open={deleteModalVisible}
                centered
                width={500}
                zIndex={100}
                onOk={async () => {
                    if (deleteRowData) {
                        try {
                            const result = await publicDeleteData(
                                { idList: [deleteRowData[rowKey]] },
                                `/${effectiveModuleKey}/del`
                            );

                            if (result.success) {
                                messageApi.success('successful!');
                                fetchData(); // 刷新表格数据
                            } else {
                                messageApi.error('failed!');
                            }
                        } catch (error) {
                            messageApi.error(`failed: ${error.message}`);
                        }
                    }
                    setDeleteModalVisible(false);
                    setDeleteRowData(null);
                }}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setDeleteRowData(null);
                }}
                okText="DELETE"
                cancelText="CANCEL"
                okButtonProps={{ danger: true }}
            >
                <p style={{ fontSize: 15, textAlign: 'center' }}>
                    Delete【{deleteRowData?.name}】? You will not be able to use it anymore once it is deleted.
                </p>
            </Modal>
        </div>
    );
});

ConfigurableTable.displayName = 'ConfigurableTable';

ConfigurableTable.propTypes = {
    // 表格数据
    columns: PropTypes.array.isRequired,
    dataSource: PropTypes.array,
    rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),

    // 表格配置
    paddingTop: PropTypes.number,
    noDataTip: PropTypes.string,
    refreshKey: PropTypes.number,
    loading: PropTypes.bool,

    // 交互配置
    onRowClick: PropTypes.func,
    isInteractionBlockingRowClick: PropTypes.bool,

    // 列配置
    mandatoryColumnKeys: PropTypes.array,
    visibleColumnKeys: PropTypes.array,
    onVisibilityChange: PropTypes.func,
    showColumnSettings: PropTypes.bool,

    // 功能配置
    searchConfig: PropTypes.object,
    filterConfig: PropTypes.object,
    paginationConfig: PropTypes.object,
    scrollX: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    rowSelection: PropTypes.object,
    tableProps: PropTypes.object,
    leftToolbarItems: PropTypes.array,

    // 特殊功能
    getTableList: PropTypes.func,
    moduleKey: PropTypes.string,
    operationName: PropTypes.string,
    showPagination: PropTypes.bool,
    draggable: PropTypes.bool,
    onDragEnd: PropTypes.func,
    expandedRowRender: PropTypes.func,
    getListAfer: PropTypes.func
};

export default ConfigurableTable; 