import React from 'react';
import { Input, Button, Space } from 'antd';
import { SearchOutlined, FilterOutlined, SettingOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
/**
* 表格头部组件，包含搜索框、筛选器和列设置等
*/
const TableHeader = ({
    // 搜索配置
    searchConfig,
    searchValue = '',
    onSearchChange,

    // 筛选器配置
    filterConfig,
    activeFilters = {},
    onFilterUpdate,
    onFilterReset,
    hasActiveFilters,

    // 列设置
    showColumnSettings = false,
    columnSettingsSection,
    columnSettingsActive = false,
    columnSettingsValue = {},
    defaultColumnSettingsValue = {},
    onColumnSettingsUpdate,

    // 左侧工具栏
    leftToolbarItems = []
}) => {
    // 搜索框变更处理
    const handleSearchChange = (e) => {
        if (onSearchChange) {
            onSearchChange(e.target.value);
        }
    };

    return (
        <div className="configurable-table-toolbar"
            style={leftToolbarItems.length === 0 ? { justifyContent: 'flex-end' } : {}}
        >
            {/* 左侧按钮区域 */}
            <Space wrap className="configurable-table-toolbar-left">
                {leftToolbarItems.map((item, index) => (
                    <Button
                        key={`${index}`}
                        onClick={item.onClick}
                        type={item.type || 'default'}
                        icon={item.icon}
                        disabled={item.disabled}
                        {...item.buttonProps}
                    >
                        {item.label}
                    </Button>
                ))}
            </Space>

            {/* 右侧工具区域 */}
            <Space wrap className="configurable-table-toolbar-right">
                {searchConfig && (
                    <Input
                        maxLength={searchConfig.fieldName === 'id' ? 10 : 100}
                        showCount
                        placeholder={searchConfig.placeholder || 'Search...'}
                        defaultValue={searchValue}
                        prefix={<SearchOutlined style={{ fontSize: 13 }} />}
                        onChange={handleSearchChange}
                        className="configurable-table-search-input"
                        allowClear
                    />
                )}

                {filterConfig && filterConfig.filterSections?.length > 0 && (
                    <FiltersPopover
                        filterSections={filterConfig.filterSections}
                        activeFilters={activeFilters}
                        onUpdate={onFilterUpdate}
                        onReset={onFilterReset}
                        showBadgeDot={hasActiveFilters}
                        showClearIcon={hasActiveFilters}
                    >
                        <Button
                            icon={<FilterOutlined />}
                            className="configurable-table-toolbar-btn"
                        >
                            Filters
                        </Button>
                    </FiltersPopover>
                )}

                {showColumnSettings && (
                    <FiltersPopover
                        filterSections={columnSettingsSection}
                        activeFilters={columnSettingsValue}
                        defaultFilters={defaultColumnSettingsValue}
                        onUpdate={onColumnSettingsUpdate}
                        onReset={() => { }}
                        popoverPlacement="bottomRight"
                        applyImmediately={false}
                        clearButtonText="Reset"
                        confirmButtonText="Apply"
                        showBadgeDot={columnSettingsActive}
                        showClearIcon={false}
                        isSettingsType
                    >
                        <Button
                            icon={<SettingOutlined />}
                            className="configurable-table-settings-btn"
                        >
                            Table Settings
                        </Button>
                    </FiltersPopover>
                )}
            </Space>
        </div>
    );
};

TableHeader.propTypes = {
    // 搜索配置
    searchConfig: PropTypes.object,
    searchValue: PropTypes.string,
    onSearchChange: PropTypes.func,

    // 筛选器配置
    filterConfig: PropTypes.object,
    activeFilters: PropTypes.object,
    onFilterUpdate: PropTypes.func,
    onFilterReset: PropTypes.func,
    hasActiveFilters: PropTypes.bool,

    // 列设置
    showColumnSettings: PropTypes.bool,
    columnSettingsSection: PropTypes.array,
    columnSettingsActive: PropTypes.bool,
    columnSettingsValue: PropTypes.object,
    defaultColumnSettingsValue: PropTypes.object,
    onColumnSettingsUpdate: PropTypes.func,

    // 左侧工具栏
    leftToolbarItems: PropTypes.array
};

export default React.memo(TableHeader); 