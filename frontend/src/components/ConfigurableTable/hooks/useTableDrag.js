/**
 * 表格拖拽功能Hook
 */
import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { sortPublicTableList } from '@/config/api.js';

/**
 * 处理表格行的拖拽排序功能
 * 
 * @param {Object} options 配置项
 * @param {Array} options.initialItems 初始项目数据
 * @param {Function} options.onDragEnd 拖拽结束回调
 * @param {String} options.rowKey 行键名
 * @param {String} options.moduleKey 模块键
 */
export function useTableDrag(options = {}) {
    const {
        initialItems = [],
        onDragEnd: externalOnDragEnd,
        rowKey = 'id',
        moduleKey
    } = options;

    // 当前项目
    const [items, setItems] = useState(initialItems);
    // 处理拖拽结束事件
    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;

        // 如果没有有效的拖拽，则直接返回
        if (!active || !over || active.id === over.id) return;

        // 查找索引
        const oldIndex = items.findIndex(item => item[rowKey] === active.id);
        const newIndex = items.findIndex(item => item[rowKey] === over.id);

        // 索引无效，直接返回
        if (oldIndex === -1 || newIndex === -1) return;

        // 重新排序
        const newItems = arrayMove(items, oldIndex, newIndex);

        // 更新本地状态
        setItems(newItems);
        try {
            // 如果提供了模块键，则调用API更新排序
            if (moduleKey) {
                const result = await sortPublicTableList(moduleKey, {
                    idList: newItems.map(item => item[rowKey])
                });

                if (result && result.success) {
                    // 调用外部拖拽结束回调
                    if (externalOnDragEnd) {
                        externalOnDragEnd(newItems);
                    }
                }
            } else if (externalOnDragEnd) {
                // 如果没有提供模块键，但有外部回调，则直接调用
                externalOnDragEnd(newItems);
            }
        } catch (error) {
            console.error('排序失败:', error);
        }
    }, [items, rowKey, moduleKey, externalOnDragEnd]);

    // 更新项目数据
    const updateItems = useCallback((newItems) => {
        setItems(newItems);
    }, []);

    // 当初始项目变化时更新状态
    const syncItems = useCallback((initialItems) => {
        if (initialItems && initialItems.length > 0 &&
            JSON.stringify(initialItems) !== JSON.stringify(items)) {
            setItems(initialItems);
        }
    }, []);

    return {
        items,
        updateItems,
        syncItems,
        handleDragEnd
    };
} 