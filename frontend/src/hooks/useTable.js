import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { PAGINATION } from '@/constants';

/**
 * 表格数据处理的自定义Hook
 * @param {Function} fetchData - 请求数据的函数
 * @param {Object} initialParams - 初始请求参数
 * @param {Object} options - 配置选项
 * @returns {Object} 表格相关的状态和方法
 */
const useTable = (fetchData, initialParams = {}, options = {}) => {
  const [tableState, setTableState] = useState({
    loading: false,
    dataSource: [],
    pagination: {
      current: PAGINATION.DEFAULT_CURRENT,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => `共 ${total} 条数据`,
      pageSizeOptions: PAGINATION.PAGE_SIZE_OPTIONS,
    },
    filters: {},
    sorter: {},
    selectedRowKeys: [],
    ...initialParams,
  });

  /**
   * 加载表格数据
   * @param {Object} queryParams - 查询参数
   */
  const loadData = useCallback(async (queryParams = {}) => {
    try {
      setTableState(prev => ({ ...prev, loading: true }));

      // 构建请求参数
      const requestParams = {
        page: tableState.pagination.current,
        limit: tableState.pagination.pageSize,
        ...tableState,
        ...queryParams,
      };

      // 添加排序参数
      if (tableState.sorter.field) {
        requestParams.sortField = tableState.sorter.field;
        requestParams.sortOrder = tableState.sorter.order;
      }

      // 添加筛选参数
      if (Object.keys(tableState.filters).length > 0) {
        Object.keys(tableState.filters).forEach(key => {
          if (tableState.filters[key]) {
            requestParams[key] = tableState.filters[key];
          }
        });
      }

      // 发起请求
      const response = await fetchData(requestParams);

      // 更新表格数据和分页信息
      if (response) {
        // 兼容不同的后端返回格式
        const list = response.list || response.data || response.records || response;
        const total = response.total || (Array.isArray(list) ? list.length : 0);

        setTableState(prev => ({
          ...prev,
          dataSource: list,
          pagination: {
            ...prev.pagination,
            current: response.current || response.page || prev.pagination.current,
            pageSize: response.pageSize || response.limit || prev.pagination.pageSize,
            total,
          },
        }));
      }
    } catch (error) {
      console.error('加载表格数据失败', error);
      message.error('加载数据失败：' + (error.message || '未知错误'));
    } finally {
      setTableState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchData, tableState.pagination.current, tableState.pagination.pageSize, tableState, tableState.filters]);

  /**
   * 刷新表格数据
   */
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  /**
   * 重置表格数据（回到第一页）
   */
  const reset = useCallback(() => {
    setTableState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        current: PAGINATION.DEFAULT_CURRENT,
      },
      filters: {},
      sorter: {},
      selectedRowKeys: [],
    }));
  }, []);

  /**
   * 表格变化处理（分页、排序、筛选）
   */
  const handleTableChange = useCallback((pagination, filters, sorter) => {
    setTableState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        ...pagination,
      },
      filters,
      sorter,
    }));
  }, []);

  /**
   * 搜索处理
   * @param {Object} values - 搜索表单值
   */
  const handleSearch = useCallback((values) => {
    // 重置分页到第一页
    setTableState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        current: PAGINATION.DEFAULT_CURRENT,
      },
    }));

    // 更新查询参数
    setTableState(prev => ({
      ...prev,
      ...values,
    }));

    // 清空选中
    setTableState(prev => ({ ...prev, selectedRowKeys: [] }));
  }, []);

  /**
   * 选择行变化处理
   * @param {Array} keys - 选中的行的key
   */
  const handleSelectChange = useCallback((keys) => {
    setTableState(prev => ({ ...prev, selectedRowKeys: keys }));
  }, []);

  // 监听依赖变化，自动加载数据
  useEffect(() => {
    loadData();
  }, [tableState.pagination.current, tableState.pagination.pageSize, tableState, tableState.sorter, tableState.filters, loadData]);

  const setLoading = useCallback((loading) => {
    setTableState(prev => ({ ...prev, loading }));
  }, []);

  const setDataSource = useCallback((dataSource) => {
    setTableState(prev => ({ ...prev, dataSource }));
  }, []);

  const setPagination = useCallback((pagination) => {
    setTableState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        ...pagination,
      },
    }));
  }, []);

  const setFilters = useCallback((filters) => {
    setTableState(prev => ({ ...prev, filters }));
  }, []);

  const setSorter = useCallback((sorter) => {
    setTableState(prev => ({ ...prev, sorter }));
  }, []);

  return {
    tableState,
    setLoading,
    setDataSource,
    setPagination,
    setFilters,
    setSorter,
    handleTableChange,
    handleSearch,
    handleSelectChange,
    reset,
    refresh,
    loadData,
  };
};

export default useTable; 