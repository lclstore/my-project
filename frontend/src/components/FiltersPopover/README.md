# FiltersPopover 组件

## 组件简介

`FiltersPopover` 是一个通用的筛选器/设置弹窗组件，基于 Ant Design 的 Popover 实现，支持单选、多选、即时应用、重置、确认等多种过滤场景。组件经过重构优化，提取了自定义Hook和使用React.memo优化性能，更易于维护和复用。

## 组件架构

- **FiltersPopover**：主组件，负责整体渲染和状态管理
- **FiltersContent**：内容区子组件，使用React.memo优化渲染性能
- **useFiltersState**：自定义Hook，管理过滤器状态和相关操作

## 主要参数

| 参数名              | 说明                                   | 类型                | 默认值         |
|---------------------|----------------------------------------|---------------------|---------------|
| filterSections      | 过滤器区域配置，见下方结构说明         | array               | []            |
| activeFilters       | 当前已应用的过滤器值                   | object              | {}            |
| defaultFilters      | 默认选中的过滤器值（用于重置）         | object              | {}            |
| onUpdate            | 点击"确认"或即时应用时的回调           | function            | -             |
| onReset             | 点击"清除"按钮或图标时的回调           | function            | -             |
| popoverPlacement    | Popover 弹出位置                      | string              | bottomRight   |
| applyImmediately    | 是否点击选项后立即应用                 | boolean             | false         |
| clearButtonText     | 清除按钮文本                           | string              | Clear         |
| confirmButtonText   | 确认按钮文本                           | string              | Search        |
| children            | 触发 Popover 的元素                    | ReactNode           | 必需          |
| showBadgeDot        | 是否显示小红点                         | boolean             | false         |
| showClearIcon       | 是否显示清除图标                       | boolean             | false         |
| isSettingsType      | 是否为设置类型（影响样式和行为）       | boolean             | false         |

### filterSections 配置结构

每个 section 对象结构如下：

```
{
  title: '区域标题',
  key: '唯一标识',
  type: 'single' | 'multiple', // 单选/多选
  options: Array | String // 选项数组或全局 optionsBase 的 key
}
```

## 性能优化

组件进行了多方面的性能优化：

1. **React.memo**：使用React.memo包装FiltersContent组件，避免不必要的重渲染
2. **useMemo**：优化派生状态计算和区段渲染
3. **useCallback**：优化事件处理函数，避免不必要的函数重建
4. **自定义Hook**：抽取状态逻辑，提高代码可维护性

## Usage Example

```jsx
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import { Button } from 'antd';

const filterSections = [
  {
    title: 'Status',
    key: 'statusList',
    type: 'multiple',
    options: 'statusList', // Use global optionsBase
  },
];

<FiltersPopover
  filterSections={filterSections}
  activeFilters={activeFilters}
  onUpdate={handleUpdate}
  onReset={handleReset}
  showBadgeDot={hasActiveFilters}
  showClearIcon={hasActiveFilters}
>
  <Button>Filter</Button>
</FiltersPopover>
```

## 适用场景

- 表格筛选、列表筛选、设置弹窗等多种场景
- 支持单选、多选、即时应用、重置、确认等复杂过滤需求
- 适合需要高性能渲染的大量选项场景

---
如需更多用法或定制化支持，请参考源码或联系维护者。 