/**
 * 表格列配置Hook
 */
import { useMemo, useState, useCallback } from 'react';

/**
 * 处理表格列的可见性和配置
 * 
 * @param {Array} allColumns 所有列的配置
 * @param {Object} options 配置项
 * @param {Array} options.visibleColumnKeys 外部传入的可见列keys
 * @param {Array} options.mandatoryColumnKeys 必须显示的列keys
 * @param {String} options.storageKey 本地存储的key
 * @param {Function} options.onVisibilityChange 可见性变更回调
 */
export function useTableColumns(allColumns, options = {}) {
    const {
        visibleColumnKeys: externalVisibleKeys,
        mandatoryColumnKeys = [],
        storageKey,
        onVisibilityChange,
    } = options;

    // 计算列的分类
    const columnCategories = useMemo(() => {
        const disabledKeys = []; // visibleColumn = 0 的列 (强制显示)
        const configurableOptionKeys = []; // visibleColumn = 1 或 2 的列 (可配置)
        const defaultVisibleKeys = []; // visibleColumn = 2 的列 (默认可见)

        allColumns.forEach(col => {
            const key = col.dataIndex;
            if (!key) return;

            if (col.visibleColumn === 0 || col.visibleColumn === undefined) {
                disabledKeys.push(key);
            } else if (col.visibleColumn === 1) {
                configurableOptionKeys.push(key);
            } else if (col.visibleColumn === 2) {
                defaultVisibleKeys.push(key);
                configurableOptionKeys.push(key);
            }
        });
        return {
            disabledKeys,
            configurableOptionKeys,
            defaultVisibleKeys
        };
    }, [allColumns]);

    const { disabledKeys, configurableOptionKeys, defaultVisibleKeys } = columnCategories;

    // 初始状态：优先使用localStorage缓存的值，其次使用默认值
    const [internalVisibleKeys, setInternalVisibleKeys] = useState(() => {
        // 尝试从localStorage读取
        if (storageKey) {
            try {
                const savedValue = localStorage.getItem(storageKey);
                if (savedValue) {
                    return JSON.parse(savedValue);
                }
            } catch (error) {
                console.error("读取localStorage中的列配置失败:", error);
            }
        }
        // 默认返回默认可见列
        return defaultVisibleKeys;
    });

    // 实际可见的列keys：外部传入优先，其次使用内部状态，并合并强制显示的列
    const effectiveVisibleKeys = useMemo(() => {
        // 使用外部传入的可见列keys或内部状态
        const configuredVisibleKeys = Array.isArray(externalVisibleKeys)
            ? externalVisibleKeys
            : internalVisibleKeys;
        // 合并强制显示的列和可配置的可见列
        return Array.from(new Set([...mandatoryColumnKeys, ...configuredVisibleKeys]));
    }, [externalVisibleKeys, internalVisibleKeys, mandatoryColumnKeys]);
    // 更新列可见性
    const updateVisibility = useCallback((newVisibleKeys) => {
        // 如果有外部回调，则调用外部回调
        if (onVisibilityChange) {
            const finalKeys = [...disabledKeys, ...mandatoryColumnKeys, ...newVisibleKeys];
            onVisibilityChange(finalKeys);
        }

        // 如果没有外部回调，则更新内部状态并保存到localStorage
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(newVisibleKeys));
        }

        setInternalVisibleKeys(newVisibleKeys);
    }, [configurableOptionKeys, disabledKeys, mandatoryColumnKeys, onVisibilityChange, storageKey]);

    // 当前可见的列配置
    const visibleColumns = useMemo(() => {
        // 创建一个可见列的集合
        const visibleSet = new Set(effectiveVisibleKeys);
        // 筛选出可见的列
        return allColumns.filter(col => {
            const key = col.dataIndex;
            return visibleSet.has(key) || col.visibleColumn === 0 || col.visibleColumn === undefined || col.dataIndex === 'actions'; // actions列总是显示
        });
    }, [allColumns, effectiveVisibleKeys]);

    // 可配置的列选项
    const columnOptions = useMemo(() => {
        const options = allColumns
            .filter(col => {
                const key = col.dataIndex;
                return key && (col.dataIndex !== 'actions');
            })
            .map(col => ({
                key: col.dataIndex,
                title: col.title,
                value: col.dataIndex,
                label: col.title,
                disabled: col.visibleColumn === 0 || !col.visibleColumn
            }));
        return [{
            title: 'Visible Columns',
            key: 'visibleColumns',
            type: 'multiple',
            options: options
        }];
    }, [allColumns]);
    return {
        visibleColumns,        // 当前可见的列配置
        effectiveVisibleKeys,  // 当前可见的列keys
        updateVisibility,      // 更新列可见性
        defaultVisibleKeys, // 默认列配置
        columnOptions,         // 可配置的列选项
        systemKeys: disabledKeys,          // 不可配置的列keys
    };
} 