# ConfigurableTable 可配置表格组件

## 组件概述

ConfigurableTable 是一个高度可定制的表格组件，基于 Ant Design Table 进行了功能扩展和优化。组件采用模块化设计，将复杂的表格功能拆分为多个子组件和自定义 Hook，实现了关注点分离，提高了代码可维护性和可复用性。

## 功能特性

- **列配置管理**：用户可自定义显示/隐藏列，并支持本地存储保持配置
- **筛选与搜索**：支持多条件筛选和关键字搜索
- **排序功能**：支持多列排序
- **拖拽排序**：支持行拖拽排序功能
- **媒体展示**：内置图片、视频、音频等媒体类型的渲染支持
- **行操作菜单**：可配置的行操作按钮
- **自适应布局**：响应式表格布局
- **分页管理**：灵活的分页配置
- **数据缓存**：支持搜索条件和配置的本地缓存

## 项目结构

组件采用模块化设计，包含以下文件结构：

```
src/components/ConfigurableTable/
├── index.jsx                  # 主入口文件
├── types.ts                   # 类型定义
├── context.jsx                # 上下文管理
├── styles.less                # 组件样式
├── utils.js                   # 工具函数
├── components/                # 子组件
│   ├── TableHeader.jsx        # 表头组件(搜索、过滤、列设置)
│   ├── TableContent.jsx       # 表格内容组件
│   ├── TableActions.jsx       # 行操作组件
│   ├── MediaCell.jsx          # 媒体单元格组件
│   └── SortableRow.jsx        # 可排序行组件
└── hooks/                     # 自定义Hook
    ├── useTableColumns.js     # 列配置Hook
    ├── useTableData.js        # 数据处理Hook
    └── useTableDrag.js        # 拖拽功能Hook
```

## 使用方法

### 基础用法

```jsx
import React, { useRef } from 'react';
import ConfigurableTable from '@/components/ConfigurableTable';

const Demo = () => {
  const tableRef = useRef(null);
  
  // 定义列配置
  const columns = [
    {
      title: 'Cover',
      dataIndex: 'coverImg',
      key: 'coverImg',
      width: 120,
      mediaType: 'image',
      visibleColumn: 0, // 0: 强制显示, 1: 可配置不显示, 2: 可配置默认显示
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      visibleColumn: 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      options: 'statusList', // 使用全局选项
      visibleColumn: 0,
    },
    {
      title: 'Created At',
      dataIndex: 'createTime',
      key: 'createTime',
      visibleColumn: 2,
    },
    {
      title: 'Actions',
      key: 'actions',
      actionButtons: ['edit', 'duplicate', 'delete'], // 配置操作按钮
      visibleColumn: 0,
    },
  ];
  
  // 数据源
  const dataSource = [
    { id: 1, name: 'Example 1', status: 'ENABLED', createTime: '2023-01-01', coverImg: 'url/to/image1.png' },
    { id: 2, name: 'Example 2', status: 'DISABLED', createTime: '2023-01-02', coverImg: 'url/to/image2.png' },
  ];
  
  // 搜索配置
  const searchConfig = {
    fieldName: 'keywords',
    placeholder: 'Please enter keyword...',
  };
  
  // 筛选器配置
  const filterConfig = {
    filterSections: [
      {
        title: 'Status',
        key: 'statusList',
        type: 'multiple',
        options: 'statusList', // 使用全局选项
      }
    ]
  };
  
  // 左侧工具栏配置
  const leftToolbarItems = [
    {
      key: 'create',
      label: 'Create',
      icon: <PlusOutlined />, // 英文按钮
      onClick: () => navigate('/demo/editor'),
    }
  ];
  
  return (
    <ConfigurableTable
      ref={tableRef}
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      searchConfig={searchConfig}
      filterConfig={filterConfig}
      leftToolbarItems={leftToolbarItems}
      showColumnSettings={true}
      moduleKey="demo"
    />
  );
};

export default Demo;
```

### 开启拖拽排序

```jsx
<ConfigurableTable
  columns={columns}
  dataSource={dataSource}
  draggable={true}
  onDragEnd={(newItems) => console.log('Sorted data:', newItems)}
  moduleKey="demo"
/>
```

### 自定义行点击事件

```jsx
<ConfigurableTable
  columns={columns}
  dataSource={dataSource}
  onRowClick={(record, event) => {
    console.log('Row clicked:', record);
    // Custom behavior
  }}
  moduleKey="demo"
/>
```

## API 参考

### ConfigurableTable Props

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| columns | ColumnConfig[] | [] | 表格列配置数组 |
| dataSource | object[] | [] | 表格数据源 |
| rowKey | string \| function | 'id' | 行数据的唯一标识字段 |
| paddingTop | number | 20 | 表格顶部内边距 |
| noDataTip | string | - | 无数据时的提示文本 |
| refreshKey | number | 0 | 刷新控制键(0: 不刷新, 1: 当前页刷新, 2: 全局刷新) |
| loading | boolean | false | 加载状态 |
| onRowClick | function | - | 行点击事件回调 |
| isInteractionBlockingRowClick | boolean | false | 是否阻止行点击事件 |
| mandatoryColumnKeys | string[] | [] | 强制显示的列键数组 |
| visibleColumnKeys | string[] | - | 当前可见列键数组 |
| onVisibilityChange | function | - | 列可见性变更回调 |
| searchConfig | object | - | 搜索配置 |
| filterConfig | object | - | 筛选器配置 |
| paginationConfig | object | defaultPagination | 分页配置 |
| scrollX | boolean \| number | true | 是否开启横向滚动 |
| rowSelection | object | - | 行选择配置 |
| tableProps | object | - | 传递给 Ant Design Table 的其他属性 |
| showColumnSettings | boolean | false | 是否显示列设置 |
| leftToolbarItems | object[] | [] | 左侧工具栏按钮配置 |
| getTableList | function | - | 自定义获取表格数据的函数 |
| moduleKey | string | - | 模块标识符 |
| operationName | string | 'page' | 操作名称 |
| showPagination | boolean | true | 是否显示分页 |
| draggable | boolean | false | 是否启用拖拽排序 |
| onDragEnd | function | - | 拖拽结束回调 |
| expandedRowRender | function | - | 展开行渲染函数 |
| getListAfer | function | - | 获取列表数据后的回调 |

### ColumnConfig

| 属性名 | 类型 | 描述 |
|--------|------|------|
| title | string | 列标题 |
| dataIndex | string | 数据字段名 |
| key | string | 列键名 |
| width | number \| string | 列宽度 |
| visibleColumn | number | 列可见性类型(0: 强制显示, 1: 可配置不显示, 2: 可配置默认显示) |
| mediaType | 'image' \| 'video' \| 'audio' | 媒体类型 |
| showNewBadge | boolean | 是否显示New标签 |
| showLock | boolean | 是否显示锁图标 |
| options | string \| object[] | 选项映射配置 |
| actionButtons | string[] | 操作按钮列表 |
| isShow | function | 按钮显示条件函数 |
| onActionClick | function | 操作按钮点击事件 |

### 实例方法

通过 ref 可访问的实例方法：

```jsx
// 获取表格引用
const tableRef = useRef(null);

// 获取当前搜索参数
const searchParams = tableRef.current.getSearchData();

// 获取选中项
const selectedItems = tableRef.current.selectList.get();

// 设置选中项
tableRef.current.selectList.set([1, 2, 3]);

// 获取当前表格数据
const currentData = tableRef.current.listData.get();

// 刷新表格数据
tableRef.current.refresh();
```

## 自定义 Hook 说明

### useTableColumns

处理表格列的可见性和配置。

```js
const {
  visibleColumns,        // 当前可见的列配置
  effectiveVisibleKeys,  // 当前可见的列keys
  updateVisibility,      // 更新列可见性
  resetColumns,          // 重置列配置
  columnOptions,         // 可配置的列选项
  hasConfigurableColumns // 是否有可配置的列
} = useTableColumns(columns, options);
```

### useTableData

处理表格数据的获取、筛选和排序。

```js
const {
  tableData,       // 表格数据
  loading,         // 加载状态
  totalCount,      // 总数量
  searchValue,     // 搜索值
  activeFilters,   // 激活的筛选条件
  paginationParams, // 分页参数
  setSearchValue,  // 设置搜索值
  setActiveFilters, // 设置筛选条件
  resetFilters,    // 重置筛选条件
  handleSort,      // 处理排序
  handlePagination, // 处理分页
  fetchData        // 获取数据
} = useTableData(options);
```

### useTableDrag

处理表格行的拖拽排序功能。

```js
const {
  items,       // 可拖拽项
  updateItems, // 更新项目
  syncItems,   // 同步项目
  handleDragEnd // 处理拖拽结束
} = useTableDrag(options);
``` 