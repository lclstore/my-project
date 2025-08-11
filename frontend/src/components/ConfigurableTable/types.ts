/**
 * ConfigurableTable 组件类型定义
 */
import { ReactNode, CSSProperties, Key } from 'react';
import { TableProps, PaginationProps, InputProps } from 'antd';

// 表格列定义
export interface ColumnConfig {
    title: string;
    dataIndex: string;
    key?: string;
    width?: number | string;
    fixed?: 'left' | 'right' | boolean;
    align?: 'left' | 'center' | 'right';
    sorter?: boolean;
    render?: (text: any, record: any, index: number) => ReactNode;
    className?: string;
    visibleColumn?: number; // 0: 强制显示, 1: 可配置不显示, 2: 可配置默认显示
    showNewBadge?: boolean; // 是否显示New标签
    showLock?: boolean; // 是否显示锁图标
    mediaType?: 'image' | 'video' | 'audio'; // 媒体类型
    options?: string | Array<{ value: string | number; label: string }>; // 映射选项
    actionButtons?: string[]; // 操作按钮列表
    isShow?: (record: any, btnName: string) => boolean; // 按钮显示条件
    onActionClick?: (key: string, record: any, e: any, click?: Function) => void; // 操作按钮点击事件
    customButtons?: Array<{ key: string; icon: ReactNode; click?: Function }>; // 自定义按钮
}

// 搜索配置
export interface SearchConfig {
    fieldName?: string;
    placeholder?: string;
}

// 筛选器配置
export interface FilterSection {
    title: string;
    key: string;
    type: 'single' | 'multiple';
    options: string | Array<{ value: string | number; label: string }>;
}

export interface FilterConfig {
    filterSections?: FilterSection[];
    activeFilters?: Record<string, any>;
}

// 左侧工具栏项
export interface ToolbarItem {
    key?: string;
    label: string;
    icon?: ReactNode;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
    type?: string;
    disabled?: boolean;
    buttonProps?: Record<string, any>;
}

// 组件Props
export interface ConfigurableTableProps {
    columns: ColumnConfig[];
    dataSource?: any[];
    paddingTop?: number;
    noDataTip?: string;
    refreshKey?: number; // 0: 不刷新, 1: 当前页刷新, 2: 全局刷新
    rowKey?: string | ((record: any) => string);
    loading?: boolean;
    onRowClick?: (record: any, event: React.MouseEvent<HTMLElement>) => void;
    isInteractionBlockingRowClick?: boolean;
    mandatoryColumnKeys?: string[];
    visibleColumnKeys?: string[];
    onVisibilityChange?: (keys: string[]) => void;
    searchConfig?: SearchConfig;
    filterConfig?: FilterConfig;
    paginationConfig?: PaginationProps;
    scrollX?: boolean | number;
    rowSelection?: any;
    tableProps?: TableProps<any>;
    showColumnSettings?: boolean;
    leftToolbarItems?: ToolbarItem[];
    getTableList?: (params: any) => Promise<any>;
    moduleKey?: string;
    operationName?: string;
    showPagination?: boolean;
    draggable?: boolean;
    onDragEnd?: (items: any[]) => void;
    expandedRowRender?: (record: any) => ReactNode;
    getListAfer?: (res: any) => void;
}

// 上下文状态
export interface TableContextState {
    tableData: any[];
    setTableData: (data: any[]) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    searchValue: string;
    setSearchValue: (value: string) => void;
    activeFilters: Record<string, any>;
    setActiveFilters: (filters: Record<string, any>) => void;
    paginationParams: {
        pageIndex: number;
        pageSize: number;
        orderBy?: string;
        orderDirection?: string;
    };
    setPaginationParams: (params: any) => void;
    selectedRowKeys: Key[];
    setSelectedRowKeys: (keys: Key[]) => void;
    selectedRows: any[];
    setSelectedRows: (rows: any[]) => void;
    visibleColumns: string[];
    setVisibleColumns: (columns: string[]) => void;
    fetchData: (params?: any) => Promise<void>;
} 