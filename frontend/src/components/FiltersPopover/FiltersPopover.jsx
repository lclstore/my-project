import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Space, Popover, Badge } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import styles from './FiltersPopover.module.css';
import { useStore } from "@/store/index.js";

/**
 * 自定义Hook - 管理过滤器状态和操作
 * @param {Object} activeFilters - 当前激活的过滤器值
 * @param {Object} defaultFilters - 默认过滤器值
 * @param {Function} onUpdate - 更新回调
 * @param {Function} onReset - 重置回调
 * @param {boolean} applyImmediately - 是否立即应用
 * @param {boolean} isSettingsType - 是否为设置类型
 */
const useFiltersState = (activeFilters, defaultFilters, onUpdate, onReset, applyImmediately, isSettingsType) => {
    // 临时选中值
    const [tempSelectedValues, setTempSelectedValues] = useState({});
    // Popover 显示状态
    const [isVisible, setIsVisible] = useState(false);
    const prevIsVisibleRef = useRef(isVisible);

    // Popover 打开时同步外部 activeFilters
    useEffect(() => {
        if (!prevIsVisibleRef.current && isVisible) {
            setTempSelectedValues(JSON.parse(JSON.stringify(activeFilters || {})));
        }
        prevIsVisibleRef.current = isVisible;
    }, [isVisible, activeFilters]);

    // 选项点击逻辑，支持单选/多选
    const handleOptionClick = useCallback((section, optionValue, isDisabled) => {
        if (isDisabled) return;

        const isSingleSelect = section.type === 'single';
        setTempSelectedValues(prev => {
            const currentValue = prev[section.key];
            let next;

            if (isSingleSelect) {
                next = { ...prev, [section.key]: currentValue === optionValue ? null : optionValue };
            } else {
                const currentSelection = Array.isArray(currentValue) ? [...currentValue] : [];
                const currentIndex = currentSelection.indexOf(optionValue);

                if (currentIndex === -1) {
                    currentSelection.push(optionValue);
                } else {
                    currentSelection.splice(currentIndex, 1);
                }

                next = { ...prev, [section.key]: currentSelection.length > 0 ? currentSelection : null };
            }

            // 立即应用时，直接回调
            if (applyImmediately && !isSettingsType && onUpdate) {
                onUpdate(next);
            }

            return next;
        });
    }, [applyImmediately, isSettingsType, onUpdate]);

    // 重置逻辑
    const handleReset = useCallback((isClear = false) => {
        if (onReset && !isClear) {
            onReset();
        }
        setTempSelectedValues(defaultFilters);
    }, [defaultFilters, onReset]);

    // 确认/更新逻辑
    const handleUpdate = useCallback(() => {
        if (onUpdate) {
            // 清理空值
            const cleanValues = Object.entries(tempSelectedValues).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined &&
                    (!Array.isArray(value) || value.length > 0)) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            onUpdate(cleanValues);
        }
        setIsVisible(false);
    }, [tempSelectedValues, onUpdate]);

    // Popover 显示/隐藏切换
    const handleOpenChange = useCallback((open) => {
        setIsVisible(open);
    }, []);

    return {
        tempSelectedValues,
        isVisible,
        handleOptionClick,
        handleReset,
        handleUpdate,
        handleOpenChange
    };
};

/**
 * 过滤器内容区子组件，专注于渲染过滤器选项和底部按钮
 */
const FiltersContent = React.memo(({
    filterSections = [],
    tempSelectedValues = {},
    optionsBase = {},
    onOptionClick,
    onReset,
    onUpdate,
    clearButtonText = 'Clear',
    confirmButtonText = 'Search',
    applyImmediately = false,
    isSettingsType = false,
    shouldShowFooter = true,
}) => {
    // 使用useMemo优化sectionOptions的生成
    const renderSections = useMemo(() => {
        return filterSections.map((section, index) => {
            // 字符串类型的 options 映射为 optionsBase
            const sectionOptions = typeof section.options === 'string'
                ? optionsBase[section.options] || []
                : section.options || [];

            return (
                <React.Fragment key={index}>
                    <div className={styles.filterSectionItem}>
                        <div className={styles.filterSectionTitle}>{section.title}</div>
                        <div className={styles.filterSection}>
                            {sectionOptions.map((option, optionIndex) => {
                                const optionValue = option.value || option;
                                const optionLabel = option.label || option;
                                let isSelected;

                                if (section.type === 'single') {
                                    isSelected = tempSelectedValues[section.key] === optionValue;
                                } else {
                                    isSelected = Array.isArray(tempSelectedValues[section.key]) &&
                                        tempSelectedValues[section.key]?.includes(optionValue);
                                }

                                return (
                                    <div
                                        key={optionIndex}
                                        onClick={() => onOptionClick(section, optionValue, option.disabled)}
                                        className={`${styles.filterButton} ${isSelected ? styles.active : ''} ${option.disabled ? styles.disabled : ''}`}
                                    >
                                        {optionLabel}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {index < filterSections.length - 1 && <hr className={styles.divider} />}
                </React.Fragment>
            );
        });
    }, [filterSections, tempSelectedValues, optionsBase, onOptionClick]);

    return (
        <div className={styles.filterContent}>
            <div className={styles.scrollContent}>
                {renderSections}
            </div>
            {shouldShowFooter && (
                <div className={styles.filterFooter}>
                    <Space>
                        {onReset && (
                            <Button onClick={() => onReset(true)} className={styles.footerButton}>
                                {clearButtonText}
                            </Button>
                        )}
                        {((!applyImmediately && onUpdate) || isSettingsType) && (
                            <Button type="primary" onClick={onUpdate} className={`${styles.footerButton} ${styles.updateButton}`}>
                                {isSettingsType ? 'Apply' : confirmButtonText}
                            </Button>
                        )}
                    </Space>
                </div>
            )}
        </div>
    );
});

FiltersContent.displayName = 'FiltersContent';

/**
 * 通用过滤器/设置 Popover 组件
 * @param {Array<Object>} filterSections - 过滤器区域配置 (仅过滤器类型需要)
 *   - title: string - 区域标题
 *   - key: string - 区域标识符 (用于 selectedValues)
 *   - type: string - 选择类型 ('single' 或 'multiple')
 *   - options: Array<Object> - 区域内的选项
 * @param {Object} activeFilters - 外部传入的、当前已应用的过滤器值 (用于初始化 Popover 内部状态)
 * @param {Function} onUpdate - 点击 'Search' 按钮或选项 (当 applyImmediately=true 时) 时的回调, 参数为当前选中的过滤器值
 * @param {Function} onReset - 点击 'Clear' 按钮或清除图标时的回调
 * @param {string} [popoverPlacement='bottomRight'] - Popover 的弹出位置
 * @param {boolean} [applyImmediately=false] - 点击选项后是否立即触发 onUpdate 并关闭 Popover (仅过滤器类型有效)
 * @param {string} [clearButtonText='Clear'] - 清除按钮的文本 (仅过滤器类型有效)
 * @param {string} [confirmButtonText='Search'] - 确认按钮的文本
 * @param {boolean} [showBadgeDot=false] - 是否在触发元素上显示小红点 (设置类型按钮不会显示)
 * @param {React.ReactNode} children - 触发 Popover 的元素 (必需)
 * @param {boolean} [showClearIcon=false] - 是否在触发元素旁边显示清除图标 (设置类型按钮不会显示)
 * @param {boolean} [isSettingsType=false] - 标识 Popover 是否为设置类型 (用于区分样式和行为, 如是否显示清除按钮和小红点)
 * @param {Object} [defaultFilters={}] - 默认选中的过滤器值 (用于重置)
 */
const FiltersPopover = ({
    filterSections = [],
    activeFilters = {},
    defaultFilters = {},
    onUpdate,
    onReset,
    popoverPlacement = 'bottomRight',
    applyImmediately = false,
    clearButtonText = 'Clear',
    confirmButtonText = 'Search',
    children,
    showBadgeDot = false,
    showClearIcon = false,
    isSettingsType = false,
}) => {
    const optionsBase = useStore(i => i.optionsBase);

    // 使用自定义Hook管理过滤器状态
    const {
        tempSelectedValues,
        isVisible,
        handleOptionClick,
        handleReset,
        handleUpdate,
        handleOpenChange
    } = useFiltersState(
        activeFilters,
        defaultFilters,
        onUpdate,
        onReset,
        applyImmediately,
        isSettingsType
    );

    // 使用useMemo计算UI相关的派生状态
    const uiConfig = useMemo(() => ({
        // 是否显示底部按钮区
        shouldShowFooter: onReset || (!applyImmediately && onUpdate) || isSettingsType,
        // 是否显示清除图标
        shouldShowClearIcon: showClearIcon && !isSettingsType,
        // 是否显示小红点
        shouldShowBadgeDot: showBadgeDot && !isSettingsType,
        // 是否为设置类型
        isSettingsPopover: isSettingsType
    }), [onReset, applyImmediately, onUpdate, isSettingsType, showClearIcon, showBadgeDot]);

    // 阻止清除按钮冒泡事件的处理函数
    const handleClearClick = useCallback((e) => {
        handleReset();
        e.stopPropagation();
    }, [handleReset]);

    return (
        <Popover
            content={
                <FiltersContent
                    filterSections={filterSections}
                    tempSelectedValues={tempSelectedValues}
                    optionsBase={optionsBase}
                    onOptionClick={handleOptionClick}
                    onReset={handleReset}
                    onUpdate={handleUpdate}
                    clearButtonText={clearButtonText}
                    confirmButtonText={confirmButtonText}
                    applyImmediately={applyImmediately}
                    isSettingsType={isSettingsType}
                    shouldShowFooter={uiConfig.shouldShowFooter}
                />
            }
            trigger="click"
            open={isVisible}
            onOpenChange={handleOpenChange}
            placement={popoverPlacement}
        >
            <Badge dot={uiConfig.shouldShowBadgeDot} offset={uiConfig.isSettingsPopover ? [0, 0] : [-35, 5]} className={styles.filterBadge}>
                <Space>
                    {children}
                    {uiConfig.shouldShowClearIcon && (
                        <Button
                            type="text"
                            shape="circle"
                            icon={<CloseCircleOutlined style={{ color: 'rgb(184, 204, 204)', fontSize: '22px' }} />}
                            size="small"
                            onClick={handleClearClick}
                            style={{ marginLeft: '-4px', cursor: 'pointer' }}
                            className={styles.clearIcon}
                        />
                    )}
                </Space>
            </Badge>
        </Popover>
    );
};

export default FiltersPopover;