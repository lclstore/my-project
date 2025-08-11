import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { RightOutlined, DownOutlined } from '@ant-design/icons';
import { Table, FloatButton } from 'antd';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableRow from './SortableRow';
import Empty from '@/components/Empty';
/**
 * 表格内容组件
 */
const TableContent = ({
    // 表格数据
    columns,
    getProcessedColumns, // 处理列
    dataSource = [],
    loading = false,
    draggableItems = [], // 用于拖拽排序的数据
    rowKey = 'id',

    // 表格配置
    pagination,
    scroll,
    rowSelection,
    expandable,

    // 交互
    onRow,
    onChange,
    draggable = false,
    onDragEnd,

    // 其他配置
    showEmpty = false,
    emptyText = '没有数据',
    tableProps = {}
}) => {
    // 设置拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 0.5,
                delay: 0,
                tolerance: 1
            },
        })
    );

    // 添加拖拽列
    const finalColumns = useMemo(() => {
        if (draggable) {
            return [
                {
                    title: 'Sort',
                    dataIndex: 'sort',
                    width: 60,
                    className: 'drag-visible',
                    align: 'center',
                },
                ...columns
            ];
        }
        return columns;
    }, [columns, draggable]);

    // 确定最终要渲染的表格数据
    const finalDataSource = draggable ? draggableItems : dataSource;

    // 定制的组件配置
    const components = useMemo(() => {
        if (draggable && finalDataSource.length > 0) {
            return {
                body: {
                    row: SortableRow,
                },
            };
        }
        return undefined;
    }, [draggable, finalDataSource]);

    // 定义内部expandable配置
    const expandableConfig = useMemo(() => {
        if (!expandable || !expandable.expandedRowRender) return undefined;

        return {
            expandedRowRender: (record) => {
                const expandedContent = expandable.expandedRowRender(record);
                //展示表格
                if (React.isValidElement(expandedContent) && expandedContent.type === Table) {
                    const modifiedTable = React.cloneElement(expandedContent, {
                        columns: getProcessedColumns(expandedContent.props.columns),
                    });
                    return modifiedTable;
                }
                //展示其他内容
                return <div className='expanded-row-render configurable-table-container'>{expandedContent}</div>;
            },
            rowExpandable: (record) => true,
            columnWidth: 50,
            fixed: 'left',
            indentSize: 20,
            expandIcon: ({ expanded, onExpand, record }) => {
                const Icon = expanded ? DownOutlined : RightOutlined;
                return (
                    <Icon
                        style={{
                            padding: '30px 20px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#0000004b'
                        }}
                        onClick={e => {
                            onExpand(record, e);
                            e.stopPropagation();
                        }}
                    />
                );
            }
        };
    }, []);

    // 渲染表格内容
    const renderTable = () => (
        <Table
            // 表格本身不需要应用外层容器样式
            columns={finalColumns}
            dataSource={finalDataSource}
            loading={loading}
            rowKey={rowKey}
            pagination={pagination}
            scroll={scroll}
            rowSelection={rowSelection}
            components={components}
            onRow={onRow}
            onChange={onChange}
            expandable={expandableConfig}
            locale={{
                emptyText: showEmpty ? <Empty title={emptyText} /> : undefined
            }}
            {...tableProps}
        />
    );

    // 根据是否启用拖拽功能决定渲染方式
    return (
        <>
            {/* 回到顶部 */}
            <FloatButton.BackTop
                target={() => document.querySelector('.ant-table-wrapper')}
                visibilityHeight={50}
            />
            {/* 拖拽排序 */}
            {draggable ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext
                        items={finalDataSource.map(item => item[rowKey])}
                        strategy={verticalListSortingStrategy}
                    >
                        {renderTable()}
                    </SortableContext>
                </DndContext>
            ) : (
                renderTable()
            )}

            {/* 当不显示分页时显示总条数 */}
            {!pagination && finalDataSource.length > 0 && (
                <div className="total-count-display">
                    {finalDataSource.length} items
                </div>
            )}
        </>
    );
};

TableContent.propTypes = {
    columns: PropTypes.array.isRequired,
    getProcessedColumns: PropTypes.func,
    dataSource: PropTypes.array,
    loading: PropTypes.bool,
    draggableItems: PropTypes.array,
    rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    pagination: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    scroll: PropTypes.object,
    rowSelection: PropTypes.object,
    expandable: PropTypes.object,
    onRow: PropTypes.func,
    onChange: PropTypes.func,
    draggable: PropTypes.bool,
    onDragEnd: PropTypes.func,
    showEmpty: PropTypes.bool,
    emptyText: PropTypes.string,
    tableProps: PropTypes.object
};

export default React.memo(TableContent); 