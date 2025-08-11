import { useState, useEffect, useMemo, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * 表单字段状态管理钩子
 * 处理复杂表单中的字段状态、面板操作和数据项管理
 * 
 * @param {Object} options 配置选项
 * @param {Array} options.initialFields 初始字段配置
 * @param {Object} options.form 表单实例
 * @param {Function} options.onFormFieldsChange 字段变更回调函数
 * @param {Function} options.onCollapseChange 折叠面板变化回调函数
 * @param {Object} options.collapseFormConfig 折叠表单配置
 * @returns {Object} 表单字段状态和操作方法
 */
const useFormFields = ({
    initialFields = [],
    form,
    onFormFieldsChange,
    onCollapseChange,
    collapseFormConfig = {}
}) => {

    // 内部字段状态
    const [internalFormFields, setInternalFormFields] = useState(initialFields);

    // 默认激活的折叠面板键
    const defaultActiveKeys = useMemo(() => {
        if (collapseFormConfig.defaultActiveKeys === 'all') {
            return initialFields.map(field => field.name);
        } else if (Array.isArray(collapseFormConfig.defaultActiveKeys)) {
            return collapseFormConfig.defaultActiveKeys;
        } else {
            // 如果配置了折叠面板为手风琴模式，则只激活第一个面板，类型为字符串类型
            const activeKeys = collapseFormConfig.isAccordion ? initialFields[0]?.name : [initialFields[0]?.name].filter(Boolean);
            return activeKeys;
        }
    }, [collapseFormConfig.defaultActiveKeys, initialFields]);

    // 折叠面板激活状态
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(defaultActiveKeys);

    // 选中项状态
    const [selectedItemFromList, setSelectedItemFromList] = useState(null);

    // 带数据列表的面板
    const [dataListPanels, setDataListPanels] = useState([]);

    // 用于防抖处理
    const debounceTimerRef = useRef(null);
    const [pendingItems, setPendingItems] = useState([]);

    // 获取可添加新面板的模板字段
    const newField = useMemo(() =>
        internalFormFields.find(item => item.isShowAdd),
        [internalFormFields]
    );

    // 当初始字段变化时，更新内部状态
    useEffect(() => {
        if (initialFields && initialFields.length > 0) {
            setInternalFormFields(initialFields);
        }

        // 初始化激活的面板键
        setTimeout(() => getActiveCollapseKeys(), 500);
    }, [initialFields]);

    // 更新带数据列表的面板
    useEffect(() => {
        const panels = internalFormFields.filter(
            item => item.isShowAdd && Array.isArray(item.dataList)
        );
        setDataListPanels(panels);
    }, [internalFormFields]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    /**
     * 获取激活的折叠面板键
     * @param {Array} newFields - 可选的新字段数组
     */
    const getActiveCollapseKeys = (newFields) => {
        // 如果已有激活的键，则不更新
        if (activeCollapseKeys && activeCollapseKeys.length > 0) return;

        const fields = newFields || internalFormFields;
        let collapseKeys = [];

        // 根据配置设置激活的键
        if (!collapseFormConfig || !fields || fields.length === 0) {
            collapseKeys = [];
        } else if (collapseFormConfig.defaultActiveKeys === 'all') {
            collapseKeys = fields.map(field => field.name);
        } else if (Array.isArray(collapseFormConfig.defaultActiveKeys)) {
            collapseKeys = collapseFormConfig.defaultActiveKeys;
        } else {
            collapseKeys = [fields[0]?.name].filter(Boolean);
        }

        setActiveCollapseKeys(collapseKeys);
    };

    /**
     * 处理折叠面板变化
     * @param {Array|string} key - 激活的键
     */
    const handleCollapseChange = (key) => {
        setActiveCollapseKeys(key);
        if (onCollapseChange) {
            onCollapseChange(key, form);
        }
    };

    /**
     * 添加自定义面板
     * @param {Object} newPanel - 新面板配置
     */
    const handleAddCustomPanel = (newPanel) => {
        if (!newField) return;

        const updatedFields = [...internalFormFields, newPanel];
        setInternalFormFields(updatedFields);
        setActiveCollapseKeys([...activeCollapseKeys, newPanel.name]);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }
    };

    /**
     * 删除面板
     * @param {string} panelName - 要删除的面板名称
     */
    const handleDeletePanel = (panelName) => {
        const updatedFields = internalFormFields.filter(item => item.name !== panelName);
        setInternalFormFields(updatedFields);
        setActiveCollapseKeys(activeCollapseKeys.filter(key => key !== panelName));

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 调用配置的回调
        if (collapseFormConfig.handleDeletePanel) {
            collapseFormConfig.handleDeletePanel(panelName);
        }
    };

    /**
     * 处理添加项目
     * @param {string|Array} panelName - 面板名称
     * @param {string} fieldName - 字段名称
     * @param {Object} itemData - 项目数据
     * @param {number} expandedItemIndex - 展开项索引
     */
    const processItemAdd = (panelName, fieldName, itemData, expandedItemIndex) => {
        // 处理数组形式的面板名称
        if (Array.isArray(panelName)) {
            panelName = panelName[0];
        }

        const updatedFields = internalFormFields.map(field => {
            if (field.name === panelName) {
                // 处理数据列表
                if (Array.isArray(field.dataList)) {
                    if (typeof expandedItemIndex === 'number' && expandedItemIndex >= 0) {
                        field.dataList.splice(expandedItemIndex + 1, 0, itemData);
                    } else {
                        field.dataList = [...field.dataList, itemData];
                    }
                }
                // 处理嵌套字段
                else if (Array.isArray(field.fields)) {
                    field.fields = field.fields.map(subField => {
                        if (Array.isArray(subField.dataList)) {
                            const expandedItemInfo = form.getFieldValue('expandedItemInfo') || {};

                            // 在指定位置插入或添加到末尾
                            if (typeof expandedItemIndex === 'number' && expandedItemIndex >= 0) {
                                subField.dataList.splice(expandedItemIndex + 1, 0, itemData);
                            } else {
                                subField.dataList = [...subField.dataList, itemData];
                            }

                            // 更新展开项信息
                            if (expandedItemInfo.expandedIndex >= subField.dataList.length) {
                                form.setFieldValue('expandedItemInfo', {
                                    expandedIndex: subField.dataList.length - 1,
                                    expandedName: subField.name
                                });
                            }
                        }
                        return subField;
                    });
                }
            }
            return field;
        });

        // 处理基础表单结构列表
        if (panelName === 'basic') {
            updatedFields.forEach(field => {
                if (field.type === 'structureList') {
                    if (typeof expandedItemIndex === 'number' && expandedItemIndex >= 0) {
                        field.dataList.splice(expandedItemIndex + 1, 0, itemData);
                    } else {
                        field.dataList = [...field.dataList, itemData];
                    }
                }
            });
        }

        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }
    };

    /**
     * 批量处理添加项目的函数
     * @param {Array} items - 要添加的项目数组
     */
    const debouncedHandleItems = (items) => {
        if (items.length === 0) return;

        // 只处理最后一个项目
        const currentItem = items[items.length - 1];
        processItemAdd(
            currentItem.panelName,
            currentItem.fieldName,
            currentItem.itemData,
            currentItem.expandedItemIndex
        );

        // 清空待处理项
        setPendingItems([]);
    };

    /**
     * 添加项目的处理函数（带防抖）
     * @param {string} panelName - 面板名称
     * @param {string} fieldName - 字段名称
     * @param {Object} itemData - 项目数据
     * @param {number} expandedItemIndex - 展开项索引
     */
    const handleItemAdded = (panelName, fieldName, itemData, expandedItemIndex) => {
        const newItem = { panelName, fieldName, itemData, expandedItemIndex };
        setPendingItems(prev => [...prev, newItem]);

        // 防抖处理
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            debouncedHandleItems([...pendingItems, newItem]);
        }, 10);
    };

    /**
     * 处理项目排序
     * @param {string} panelName - 面板名称 
     * @param {number} oldIndex - 旧索引
     * @param {number} newIndex - 新索引
     */
    const handleSortItems = (panelName, oldIndex, newIndex) => {
        if (oldIndex === newIndex) return;

        try {
            // 递归查找并排序数据列表
            const findAndSortItems = (field) => {
                // 查找匹配的数据列表并排序
                if (field.name === panelName && Array.isArray(field.dataList)) {
                    // 验证索引范围
                    if (oldIndex < 0 || oldIndex >= field.dataList.length ||
                        newIndex < 0 || newIndex >= field.dataList.length) {
                        return field;
                    }

                    // 重新排序数据列表
                    const newDataList = arrayMove([...field.dataList], oldIndex, newIndex);
                    const expandedItemInfo = form.getFieldValue('expandedItemInfo') || {};

                    // 更新展开项索引
                    if (expandedItemInfo.expandedIndex === oldIndex) {
                        form.setFieldValue('expandedItemInfo', {
                            expandedIndex: newIndex,
                            expandedName: expandedItemInfo.expandedName
                        });
                    }

                    return { ...field, dataList: newDataList };
                }

                // 递归处理嵌套字段
                if (field.fields) {
                    return {
                        ...field,
                        fields: field.fields.map(subField => findAndSortItems(subField))
                    };
                }

                return field;
            };

            // 更新所有字段
            const updatedFields = internalFormFields.map(field => findAndSortItems(field));

            // 验证更新是否有效
            const findChangedPanel = (fields) => {
                for (const field of fields) {
                    if (field.name === panelName && field.dataList) {
                        return field;
                    }
                    if (field.fields) {
                        const found = findChangedPanel(field.fields);
                        if (found) return found;
                    }
                }
                return null;
            };

            const changedPanel = findChangedPanel(updatedFields);
            if (changedPanel && changedPanel.dataList) {
                setInternalFormFields(updatedFields);

                // 通知父组件
                if (onFormFieldsChange) {
                    onFormFieldsChange(updatedFields, form);
                }

                // 调用配置的回调
                if (collapseFormConfig.onSortItems) {
                    collapseFormConfig.onSortItems(panelName, oldIndex, newIndex);
                }
            }
        } catch (error) {
            console.error('排序处理出错:', error);
        }
    };

    /**
     * 更新展开项
     */
    const handleExpandItem = () => {
        setInternalFormFields([...internalFormFields]);
    };

    /**
     * 删除项目
     * @param {string} panelName - 面板名称
     * @param {number} itemIndex - 项目索引
     */
    const handleDeleteItem = (panelName, itemIndex) => {
        // 递归处理字段数组
        const processFields = (fields) => {
            return fields.map(field => {
                // 递归处理嵌套字段
                if (Array.isArray(field.fields)) {
                    return { ...field, fields: processFields(field.fields) };
                }

                // 删除匹配面板中的项目
                if (field.name === panelName && Array.isArray(field.dataList)) {
                    const newDataList = [...field.dataList];
                    newDataList.splice(itemIndex, 1);
                    return { ...field, dataList: newDataList };
                }

                return field;
            });
        };

        const updatedFields = processFields(internalFormFields);
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 调用配置的回调
        if (collapseFormConfig.onDeleteItem) {
            collapseFormConfig.onDeleteItem(panelName, itemIndex);
        }
    };

    /**
     * 复制项目
     * @param {string} panelName - 面板名称
     * @param {string} itemId - 项目ID
     * @param {number} itemIndex - 项目索引
     */
    const handleCopyItem = (panelName, itemId, itemIndex) => {
        // 递归查找并复制项目
        const findAndCopyItem = (field, itemId, itemIndex, panelName) => {
            // 查找并复制数据列表中的项目
            if (field.name === panelName && Array.isArray(field.dataList)) {
                const itemToCopy = field.dataList.find(item => item.id === itemId);
                if (itemToCopy) {
                    // 复制项目并插入
                    const newItem = { ...itemToCopy };
                    const newDataList = [...field.dataList];
                    newDataList.splice(itemIndex + 1, 0, newItem);
                    return { ...field, dataList: newDataList };
                }
            }

            // 递归处理嵌套字段
            if (field.fields) {
                return {
                    ...field,
                    fields: field.fields.map(subField =>
                        findAndCopyItem(subField, itemId, itemIndex, panelName)
                    )
                };
            }

            return field;
        };

        // 更新所有字段
        const updatedFields = internalFormFields.map(field =>
            findAndCopyItem(field, itemId, itemIndex, panelName)
        );

        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 调用配置的回调
        if (collapseFormConfig.onCopyItem) {
            collapseFormConfig.onCopyItem(panelName, itemId, itemIndex);
        }
        if (collapseFormConfig.onUpdateItem) {
            collapseFormConfig.onUpdateItem(panelName, itemId, itemIndex);
        }
    };

    /**
     * 更新项目
     * @param {string} panelName - 面板名称
     * @param {Object} newItemData - 新项目数据
     * @param {string} itemId - 项目ID
     */
    const handleUpdateItem = (panelName, newItemData, itemId) => {
        const updatedFields = internalFormFields.map(field => {
            if (field.type === panelName && Array.isArray(field.dataList)) {
                // 更新数据列表中的指定项
                const updatedDataList = field.dataList.map(item => {
                    if (item.id === newItemData.id) {
                        return { ...item, ...newItemData };
                    }
                    return item;
                });

                return { ...field, dataList: updatedDataList };
            }
            return field;
        });

        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 调用配置的回调
        if (collapseFormConfig.onUpdateItem) {
            collapseFormConfig.onUpdateItem(panelName, newItemData, itemId);
        }
    };

    /**
     * 替换项目
     * @param {string} panelName - 面板名称
     * @param {string} itemId - 旧项目ID
     * @param {string} newItemId - 新项目ID
     * @param {Object} newItem - 新项目数据
     * @param {number} itemIndex - 项目索引
     */
    const handleReplaceItem = (panelName, itemId, newItemId, newItem, itemIndex) => {
        // 递归查找并替换项目
        const findAndReplaceItem = (field, panelName) => {
            // 查找匹配的数据列表并替换项目
            if (field.name === panelName && Array.isArray(field.dataList)) {
                let updatedItems;

                // 根据索引或ID替换项目
                if (typeof itemIndex === 'number') {
                    updatedItems = [...field.dataList];
                    if (itemIndex >= 0 && itemIndex < updatedItems.length) {
                        updatedItems[itemIndex] = { ...newItem, id: newItemId };
                    }
                } else {
                    updatedItems = field.dataList.map(item =>
                        item.id === itemId ? { ...newItem, id: newItemId } : item
                    );
                }

                return { ...field, dataList: updatedItems };
            }

            // 递归处理嵌套字段
            if (field.fields) {
                return {
                    ...field,
                    fields: field.fields.map(subField =>
                        findAndReplaceItem(subField, panelName)
                    )
                };
            }

            return field;
        };

        // 更新所有字段
        const updatedFields = internalFormFields.map(field =>
            findAndReplaceItem(field, panelName)
        );

        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 调用配置的回调
        if (collapseFormConfig.onReplaceItem) {
            collapseFormConfig.onReplaceItem(panelName, itemId, newItemId, newItem, itemIndex);
        }
    };

    /**
     * 切换项目图标状态
     * @param {string} panelName - 面板名称
     * @param {string} itemId - 项目ID
     * @param {number} itemIndex - 项目索引
     * @param {string} lockName - 锁定状态字段名
     */
    const handleIconChange = (panelName, itemId, itemIndex, lockName) => {
        const newFields = internalFormFields.map(field => {
            if (field.name === panelName && Array.isArray(field.dataList)) {
                const newDataList = [...field.dataList];
                const targetItem = { ...newDataList[itemIndex] };
                // 切换状态 (0/1)
                targetItem[lockName] = targetItem[lockName] ? 0 : 1;
                newDataList[itemIndex] = targetItem;
                return { ...field, dataList: newDataList };
            }
            return field;
        });

        setInternalFormFields(newFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(newFields, form);
        }
    };

    return {
        // 状态
        internalFormFields,
        setInternalFormFields,
        activeCollapseKeys,
        setActiveCollapseKeys,
        getActiveCollapseKeys,
        selectedItemFromList,
        setSelectedItemFromList,
        dataListPanels,
        newField,

        // 操作方法
        handleItemAdded,
        handleDeletePanel,
        handleCollapseChange,
        handleSortItems,
        handleDeleteItem,
        handleCopyItem,
        handleReplaceItem,
        handleUpdateItem,
        handleExpandItem,
        handleIconChange,
        handleAddCustomPanel
    };
};

export default useFormFields; 