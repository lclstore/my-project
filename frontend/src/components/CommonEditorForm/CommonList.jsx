import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { RenderItemMeta } from './FormFields';
import {
    Input,
    Button,
    List,
    Spin,
    Checkbox,
    Modal
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    FilterOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import Empty from '@/components/Empty';
import styles from './CommonList.module.css';

/**
 * 创建防抖hook
 * @param {any} value - 需要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {any} 防抖后的值
 */
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * 通用列表组件，支持搜索、筛选、无限滚动
 * @param {function} initCommonListData - 控制组件渲染的数据请求方法
 * @param {function} onSearchChange - 搜索框内容变化时的回调函数
 * @param {string} searchValue - 当前搜索框的值
 * @param {Array} filterSections - 过滤器数组
 * @param {object} activeFilters - 当前激活的筛选器对象
 * @param {string} placeholder - 搜索框的占位文本
 * @param {function} onAddItem - 点击添加按钮时的回调函数
 * @param {string} [selectionMode='add'] - 选择模式 ('add' 或 'replace')
 * @param {string} [selectedItemId=null] - 当前选中的项目 ID
 * @param {function} renderItemMata - 自定义渲染列表项的函数
 * @param {object} defaultQueryParams - 默认查询参数
 * @param {string} title - 列表标题
 * @param {Array} displayKeys - 显示的key
 * @param {string} displayFileName - 显示的文件名
 * @param {string} displayTitle - 显示的标题
 */
const CommonList = ({
    initCommonListData,
    displayKeys = [],
    displayFileName,
    displayTitle = 'name' || 'displayName',
    onSearchChange,
    searchValue = '',
    filterSections = [],
    placeholder = 'Search...',
    onAddItem,
    selectionMode = 'add',
    selectedItemId = null,
    onFilterChange,
    renderItemMata,
    activeFilters = {},
    defaultQueryParams = {
        pageIndex: 1,
        pageSize: 20,
    },
    title,
    renderItem // 新增支持自定义渲染整个列表项的属性
}) => {
    const [scrollableId] = useState(() => `commonListScrollableDiv-${Math.random().toString(36).substring(2, 9)}`);

    // 主列表状态
    const [keyword, setKeyword] = useState(searchValue);
    const debouncedKeyword = useDebounce(keyword, 500);
    const [selectedFilters, setSelectedFilters] = useState({ ...activeFilters });
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const scrollableContainerRef = useRef(null);
    const [internalListData, setInternalListData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    // 批量选择相关状态
    const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    // 默认的搜索方法
    const defaultSearchCommonListData = useCallback(() => {
        return new Promise((resolve) => {
            setTimeout(() => resolve([]), 1000);
        });
    }, []);

    // 主列表数据请求
    const fetchData = useCallback(async (filters, page = 1) => {
        setLoading(true);
        try {
            // 使用传入的过滤器或当前选中的过滤器
            const filtersToUse = filters || selectedFilters;
            const params = {
                ...defaultQueryParams,
                ...filtersToUse,
                keywords: debouncedKeyword,
                pageIndex: page,
                pageSize: defaultQueryParams.pageSize,
                orderBy: 'id',
                orderDirection: 'DESC',
            };

            const fetchFunction = initCommonListData || defaultSearchCommonListData;
            const { success, data, totalCount } = await fetchFunction(params);

            if (success) {
                let newData;
                if (params.pageIndex === 1) {
                    newData = data || [];
                    setInternalListData(newData);
                    // 重置滚动位置
                    scrollableContainerRef.current?.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } else {
                    newData = [...internalListData, ...(data || [])];
                    setInternalListData(newData);
                }
                setHasMore(newData.length < totalCount);
            }
        } catch (error) {
            console.error('获取列表数据失败:', error);
            if (page === 1) {
                setInternalListData([]);
            }
        } finally {
            setLoading(false);
        }
    }, [defaultQueryParams, selectedFilters, debouncedKeyword, internalListData, initCommonListData, defaultSearchCommonListData, scrollableContainerRef]);

    // 监听主列表防抖后的关键词和筛选条件变化，请求数据
    useEffect(() => {
        setCurrentPage(1); // 重置页码
        fetchData(selectedFilters, 1);
    }, [debouncedKeyword, selectedFilters]);

    // 加载主列表更多数据
    const loadMoreItems = useCallback(() => {
        if (loading || !hasMore) return;

        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchData(selectedFilters, nextPage);
    }, [loading, hasMore, currentPage, selectedFilters, fetchData]);

    // 判断主列表是否有激活的筛选器
    const hasActiveFilters = useMemo(() => {
        return Object.keys(selectedFilters || {}).length > 0;
    }, [selectedFilters]);

    // 处理主列表搜索框变化
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setKeyword(value);
        onSearchChange?.(value);
    }, [onSearchChange]);

    // 处理主列表筛选器更新
    const handleFilterUpdate = useCallback((newFilters) => {
        setSelectedFilters(newFilters);
        onFilterChange?.(newFilters);
    }, [onFilterChange]);

    // 重置主列表筛选器
    const handleFilterReset = useCallback(() => {
        setSelectedFilters({});
        onFilterChange?.({});
    }, [onFilterChange]);

    // 处理批量添加
    const handleBatchAddClick = useCallback(() => {
        // 重置状态
        setSelectedItems([]);
        setIsBatchModalVisible(true);
    }, []);

    // 处理批量确认
    const handleBatchConfirm = useCallback(() => {
        if (selectedItems.length > 0) {
            onAddItem(selectedItems);
        }
        setIsBatchModalVisible(false);
        setSelectedItems([]);
    }, [selectedItems, onAddItem]);

    // 列表项渲染函数
    const renderListItem = useCallback((item) => {
        // 如果提供了自定义渲染函数，则使用它
        if (renderItem) {
            return renderItem(item);
        }

        if (!item?.id) return null;

        const isDisabled = selectionMode === 'replace' && item.status !== 'ENABLED';
        let actions = [];

        if (selectionMode === 'add') {
            if (item.status === 'ENABLED') {
                actions.push(
                    <Button
                        key={`add-${item.id}`}
                        type="text"
                        shape="circle"
                        icon={<PlusOutlined style={{ color: 'var(--active-color)', fontSize: '20px' }} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddItem({ ...item, date: new Date().getTime() });
                        }}
                        title="Add to structure"
                    />
                );
            }
        } else if (selectionMode === 'replace') {
            actions.push(
                <Checkbox
                    key={`select-${item.id}`}
                    checked={selectedItemId === item.id}
                    disabled={isDisabled}
                    onChange={(e) => {
                        if (isDisabled) return;
                        e.stopPropagation();
                        onAddItem(selectedItemId === item.id ? null : { ...item, date: new Date().getTime() });
                    }}
                />
            );
        }

        const handleItemClick = () => {
            if (isDisabled || selectionMode !== 'replace') return;
            onAddItem(selectedItemId === item.id ? null : item);
        };

        return (
            <List.Item
                key={item.id}
                className={`${styles.item} 
                    ${selectionMode === 'replace' ? styles.selectableItem : ''} 
                    ${selectedItemId === item.id && selectionMode === 'replace' ? styles.itemSelected : ''} 
                    ${isDisabled ? styles.itemDisabled : ''}`}
                actions={actions}
                onClick={handleItemClick}
            >
                {renderItemMata ? renderItemMata(item) : <RenderItemMeta item={item} displayKeys={displayKeys} displayTitle={displayTitle} displayFileName={displayFileName} />}
            </List.Item>
        );
    }, [onAddItem, selectionMode, selectedItemId, renderItemMata, displayKeys, displayTitle, renderItem]);

    return (
        <div className={styles.commonList}>
            <div className={styles.search}>
                <div className={styles.titleContainer}>
                    <div className={styles.title}>{title}</div>
                </div>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder={placeholder}
                    className={styles.searchInput}
                    defaultValue={searchValue}
                    onChange={handleSearchChange}
                    allowClear
                />
                {filterSections?.length > 0 && (
                    <FiltersPopover
                        filterSections={filterSections}
                        activeFilters={selectedFilters}
                        onUpdate={handleFilterUpdate}
                        onReset={handleFilterReset}
                        showBadgeDot={hasActiveFilters}
                        showClearIcon={hasActiveFilters}
                    >
                        <Button icon={<FilterOutlined />}>
                            Filters
                        </Button>
                    </FiltersPopover>
                )}
                <Button icon={<PlusOutlined />} onClick={handleBatchAddClick}>
                    Batch Add
                </Button>
            </div>
            <div
                id={scrollableId}
                ref={scrollableContainerRef}
                className={styles.scrollContainer}
            >
                <InfiniteScroll
                    dataLength={internalListData.length}
                    next={loadMoreItems}
                    hasMore={hasMore}
                    loader={
                        currentPage > 1 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '10px',
                                color: '#999',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                <LoadingOutlined style={{ fontSize: '16px' }} />
                                loading more...
                            </div>
                        )
                    }
                    endMessage={
                        !hasMore && internalListData.length > 0 && (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                                no more data
                            </div>
                        )
                    }
                    scrollableTarget={scrollableId}
                >
                    <Spin spinning={loading} tip="Loading...">
                        <List
                            itemLayout="horizontal"
                            dataSource={internalListData}
                            className="common-list"
                            renderItem={renderListItem}
                            locale={{
                                emptyText: (
                                    <Empty title={`You don't have any ${title} yet`} />
                                )
                            }}
                        />
                    </Spin>
                </InfiniteScroll>
            </div>

            {/* 批量选择弹窗 */}
            <Modal
                title={`Batch Add ${title || ''}`}
                open={isBatchModalVisible}
                onCancel={() => setIsBatchModalVisible(false)}
                onOk={handleBatchConfirm}
                width="90%"
                okText="Confirm Batch Add"
                cancelText="Cancel"
                getContainer={document.body}
                styles={{ body: { height: '65vh', width: '100%', overflow: 'hidden' } }}
                destroyOnClose={true}
            >

                {/* 创建一个全新的列表组件，而不是使用嵌套的CommonList */}
                <div className={styles.commonList} style={{ height: "100%" }}>
                    <div className={styles.search}>
                        <div className={styles.titleContainer}>
                            <div className={styles.title}>{title}</div>
                        </div>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder={placeholder}
                            className={styles.searchInput}
                            defaultValue=""
                            onChange={(e) => {
                                // 使用独立的搜索处理
                                const searchFunction = initCommonListData || defaultSearchCommonListData;
                                searchFunction({
                                    ...defaultQueryParams,
                                    keywords: e.target.value,
                                    pageIndex: 1
                                });
                            }}
                            allowClear
                        />
                        {filterSections?.length > 0 && (
                            <FiltersPopover
                                filterSections={filterSections}
                                activeFilters={{}}
                                onUpdate={() => { }}
                                onReset={() => { }}
                                showBadgeDot={false}
                                showClearIcon={false}
                            >
                                <Button icon={<FilterOutlined />}>
                                    Filters
                                </Button>
                            </FiltersPopover>
                        )}
                    </div>
                    <div
                        id="batchModalScrollableDiv"
                        className={styles.scrollContainer}
                    >
                        <InfiniteScroll
                            dataLength={internalListData.length}
                            next={loadMoreItems}
                            hasMore={hasMore}
                            loader={
                                <div style={{
                                    textAlign: 'center',
                                    padding: '10px',
                                    color: '#999',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    <LoadingOutlined style={{ fontSize: '16px' }} />
                                    loading more...
                                </div>
                            }
                            endMessage={
                                !hasMore && internalListData.length > 0 && (
                                    <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                                        no more data
                                    </div>
                                )
                            }
                            scrollableTarget="batchModalScrollableDiv"
                        >
                            <Spin spinning={loading} tip="Loading...">
                                <List
                                    itemLayout="horizontal"
                                    dataSource={internalListData}
                                    className="common-list"
                                    renderItem={(item) => {
                                        if (!item?.id) return null;

                                        const isDisabled = item.status !== 'ENABLED';
                                        const isSelected = selectedItems.some(i => i.id === item.id);

                                        // 处理选择/取消选择
                                        const handleSelect = (e) => {
                                            e.stopPropagation();
                                            setSelectedItems(prev => {
                                                const isAlreadySelected = prev.some(i => i.id === item.id);
                                                if (isAlreadySelected) {
                                                    return prev.filter(i => i.id !== item.id);
                                                } else {
                                                    return [...prev, item];
                                                }
                                            });
                                        };

                                        return (
                                            <List.Item
                                                key={item.id}
                                                className={`${styles.item} ${isDisabled ? styles.itemDisabled : ''} ${isSelected ? styles.itemSelected : ''}`}
                                                onClick={isDisabled ? undefined : handleSelect}
                                                style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                                actions={[
                                                    <Checkbox
                                                        key={`modal-select-${item.id}`}
                                                        checked={isSelected}
                                                        disabled={isDisabled}
                                                        onChange={handleSelect}
                                                    />
                                                ]}
                                            >
                                                {renderItemMata ? renderItemMata(item) : <RenderItemMeta item={item} displayKeys={displayKeys} displayTitle={displayTitle} displayFileName={displayFileName} />}
                                            </List.Item>
                                        );
                                    }}
                                    locale={{
                                        emptyText: (
                                            <Empty title={`No ${title} available`} />
                                        )
                                    }}
                                />
                            </Spin>
                        </InfiniteScroll>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CommonList;