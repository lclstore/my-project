/**
 * 表格数据管理Hook
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useLocation } from 'react-router';
import { getPublicTableList } from '@/config/api.js';
import { debounce } from 'lodash';
import { setStoredCache, getStoredCache } from '../columnUtils';

/**
 * 处理表格数据的获取、过滤和排序
 * 
 * @param {Object} options 配置项
 * @param {Array} options.initialData 初始数据
 * @param {Function} options.getTableList 自定义获取数据的函数
 * @param {String} options.moduleKey 模块键
 * @param {String} options.operationName 操作名称
 * @param {Object} options.defaultPagination 默认分页参数
 */
export function useTableData(options = {}) {
    const {
        initialData = [],
        getTableList,
        moduleKey,
        operationName = 'page',
        defaultPagination = { pageIndex: 1, pageSize: 10 }
    } = options;
    const location = useLocation();
    const cachedSearch = getStoredCache(location.pathname) || {};//获取缓存数据

    // 表格数据状态
    const [tableData, setTableData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // 搜索状态
    const searchValue = useRef(cachedSearch?.searchValue || '');
    const activeFilters = useRef(cachedSearch?.activeFilters || {});
    const [paginationParams, setPaginationParams] = useState(cachedSearch?.paginationParams || defaultPagination);
    console.log(paginationParams);
    // 搜索值改变
    const setSearchValue = (value) => {
        searchValue.current = value;
        setPaginationParams(prev => ({ ...prev, pageIndex: 1 }));//重置页码
        searchWithDebounce({ keywords: value, pageIndex: 1 }, false);
    }
    const defaultSorter = {
        field: 'id',
        order: 'DESC'
    }
    // 排序状态
    const sorter = useRef(cachedSearch?.sorter || defaultSorter);
    // 初始化数据
    useEffect(() => {
        if (cachedSearch?.paginationParams) {
            setPaginationParams(cachedSearch?.paginationParams);
        }
        fetchData();
    }, []);

    // 用于取消请求的控制器
    const abortControllerRef = useRef(null);

    // 防抖搜索函数引用
    const debouncedFetchRef = useRef(null);

    // 获取数据的方法 - 直接使用状态值而不是ref
    const fetchData = useCallback(async (params = {}) => {
        // 如果存在正在进行的请求，取消它
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 创建新的 AbortController
        abortControllerRef.current = new AbortController();

        // 构建查询参数
        const searchParams = {
            ...paginationParams,
            ...activeFilters.current,
            keywords: searchValue.current,
            orderBy: sorter.current.field,
            orderDirection: sorter.current.order,
            ...params
        };
        setStoredCache(location.pathname, {
            paginationParams: paginationParams,
            activeFilters: activeFilters.current,
            searchValue: searchValue.current,
            sorter: sorter.current,
        });
        console.log(params.keywords);

        console.log(searchParams.keywords)

        try {
            setLoading(true);

            // 使用传入的获取数据函数或默认的API函数
            const response = getTableList
                ? await getTableList(searchParams)
                : await getPublicTableList(
                    moduleKey,
                    operationName,
                    searchParams,
                    { signal: abortControllerRef.current.signal }
                );

            // 请求完成后清除当前的 AbortController
            abortControllerRef.current = null;

            if (response && response.success) {
                const newData = response.data || [];
                setTableData(newData);
                setPaginationParams(prev => ({ ...prev, totalCount: response.totalCount || 0 }));
                return response;
            } else {
                setTableData([]);
                setPaginationParams(prev => ({ ...prev, totalCount: 0 }));
                messageApi.error('获取数据失败');
                return { data: [], success: false, totalCount: 0 };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request cancelled');
                return;
            }
            console.error('Search error:', error);
            setTableData([]);
            setPaginationParams(prev => ({ ...prev, totalCount: 0 }));
            messageApi.error('获取数据失败');
            return { data: [], success: false, totalCount: 0 };
        } finally {
            if (abortControllerRef.current === null) {
                setLoading(false);
            }
        }
    }, []);

    // 搜索处理 - 防抖
    const searchWithDebounce = useCallback((params, immediate = false) => {
        // 如果是即时搜索，立即执行并取消防抖
        if (immediate) {
            if (debouncedFetchRef.current) {
                debouncedFetchRef.current.cancel();
            }
            fetchData(params);
            return;
        }

        // 懒加载创建防抖函数
        if (!debouncedFetchRef.current) {
            debouncedFetchRef.current = debounce((latestParams) => {
                fetchData(latestParams);
            }, 500);
        }

        // 执行防抖搜索，传入最新的参数
        debouncedFetchRef.current(params);
    }, []);

    // 搜索并筛选
    const updateFilters = useCallback((filters) => {

        setPaginationParams(prev => ({ ...prev, pageIndex: 1 }));
        activeFilters.current = filters;
        fetchData({ pageIndex: 1 });
    }, []);

    // 重置筛选
    const resetFilters = useCallback(() => {
        setPaginationParams(prev => ({ ...prev, pageIndex: 1 }));
        activeFilters.current = {};
        fetchData({ pageIndex: 1 });
    }, []);


    // 排序处理
    const handleSort = useCallback((newSorter) => {
        sorter.current = newSorter || defaultSorter;
        setPaginationParams(prev => ({ ...prev, pageIndex: 1 }));
        fetchData({ pageIndex: 1 });
    }, []);
    //分页处理
    const handlePainate = useCallback((pagination) => {
        const { current, pageSize } = pagination;
        setPaginationParams(prev => ({ ...prev, pageIndex: current, pageSize }));
        fetchData({ pageIndex: current, pageSize });
    }, []);


    // 组件卸载时取消防抖
    useEffect(() => {
        return () => {
            if (debouncedFetchRef.current) {
                debouncedFetchRef.current.cancel();
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        tableData,
        loading,
        searchValue: searchValue.current,
        setSearchValue,
        activeFilters: activeFilters.current,
        paginationParams,
        searchWithDebounce: searchWithDebounce,
        updateFilters,
        resetFilters,
        handleSort,
        handlePainate,
        fetchData,
        contextHolder
    };
} 