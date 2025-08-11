import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { Form, Space, Row, Col, Button, Modal, notification, message } from 'antd';
import { MenuOutlined, CopyOutlined, LockFilled, UnlockFilled, DeleteOutlined, RetweetOutlined, } from '@ant-design/icons';
import styles from './DynamicFormList.module.css';
import { RenderItemMeta } from '@/components/CommonEditorForm/FormFields';
import Empty from '@/components/Empty';
import CommonList from './CommonList';
import { DndContext, closestCenter, MeasuringStrategy } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isArray, get } from 'lodash';

/**
 * 辅助函数，用于安全地从嵌套对象中获取表单值。
 * antd form 的 namePath 可以是 string | number | (string | number)[]
 * @param {Object} formInstance - antd 表单实例
 * @param {String|Number|Array} name - 字段路径
 * @returns {*} 字段的值
 */
const getFieldValueByName = (formInstance, name) => {
    if (!formInstance || !name) return undefined;
    const allValues = formInstance.getFieldsValue(true);
    if (typeof name === 'string' || typeof name === 'number') {
        return allValues[name];
    }
    if (Array.isArray(name)) {
        return get(allValues, name);
    }
    return undefined;
};

/**
 * 生成统一的项目ID，用于滚动定位和数据关联
 * @param {String|Array} name - 字段名称
 * @param {Array} parentNamePath - 父级路径
 * @param {Number} index - 项目索引
 * @param {*} itemData - 项目数据
 * @returns {String} 生成的唯一ID
 */
const generateItemId = (name, parentNamePath = [], index, itemData = {}) => {
    // 从name中获取列表名称
    const listName = Array.isArray(name) ? name[name.length - 1] : name;
    // 完整列表路径
    const listPath = [...parentNamePath, listName];
    // 将路径转换为字符串标识
    const arrayName = listPath.join('-');
    // 简化ID格式，确保兼容性，主要使用索引定位
    return `${arrayName}-item-${index}`;
};


/**
 * 动态表单列表组件，支持拖拽排序、展开折叠、复制删除等功能
 * @param {Object} field - 字段配置，包含名称、标签等信息
 * @param {Object} options - 选项配置，包含回调函数和子组件配置
 * @param {Object} formProp - 表单实例，如果不提供则使用 Form.useFormInstance()
 */
export default function DynamicFormList({
    field,
    options,
    form: formProp,
    parentNamePath = [], // 新增 parentNamePath prop，默认为空数组
}) {

    /**
     * @param {Function} selectedItemFromList - 从列表中选择项目的回调函数
     * @param {Object} collapseFormConfig - 折叠表单配置
     * @param {Object} commonListConfig - 通用列表配置
     */
    const {
        selectedItemFromList,
        collapseFormConfig = {},
        commonListConfig = {},
        setActiveCollapseKeys,
        activeKeys,
        onExpanded, // 接收 onExpanded 回调
    } = options || {};
    const [messageApi, contextHolder] = message.useMessage();
    const addItemRef = useRef(null);
    const moveRef = useRef(null);
    // 添加一个ref用于跟踪上一次处理的selectedItemFromList
    const lastSelectedItemRef = useRef(null);
    // 替换弹框状态
    const [replaceModalVisible, setReplaceModalVisible] = useState(false);
    // 展开项状态管理
    const [expandedItem, setExpandedItem] = useState(null);
    // 在替换弹框中临时选中的项
    const [tempSelectedItem, setTempSelectedItem] = useState(null);
    // 当前选中的panel和item id
    const [currentReplaceItem, setCurrentReplaceItem] = useState({
        panelId: null,
        itemId: null,
        itemIndex: null
    });

    // 添加一个强制重新渲染的机制
    const [forceRender, setForceRender] = useState(0);



    // 在组件挂载时进行初始化
    useEffect(() => {
        const formInstance = formProp || Form.useFormInstance();


        // 查找嵌套数据
        if (field.name && Array.isArray(field.name) && field.name.length > 1) {
            // 这是嵌套路径

            // 检查父路径
            const parentPath = field.name.slice(0, -1);
            const childKey = field.name[field.name.length - 1];

            const parentData = formInstance.getFieldValue(parentPath);

            // 如果父路径存在但子数据不存在，可能需要初始化
            if (parentData && (!parentData[childKey] || !Array.isArray(parentData[childKey]))) {
                // 初始化一个空数组，或者复制现有的数据(如果存在)
                const initializedData = { ...parentData };
                initializedData[childKey] = initializedData[childKey] || [];

                // 更新父路径数据
                formInstance.setFieldValue(parentPath, initializedData);
            }
        }
    }, [field, formProp]);

    // 判断确认按钮是否应该禁用
    const isConfirmButtonDisabled = useMemo(() => {
        // 如果没有临时选中项，或者临时选中项的ID与当前项ID相同，则禁用按钮
        return !tempSelectedItem || tempSelectedItem.id === currentReplaceItem.itemId;
    }, [tempSelectedItem, currentReplaceItem.itemId]);


    // 处理从列表中选择项目
    useEffect(() => {
        // 基础检查：确保有可添加的项，且 add 函数已准备好，并且这个项是新的，防止重复处理
        if (!selectedItemFromList || !addItemRef.current || selectedItemFromList === lastSelectedItemRef.current) {
            // 如果外部选择被重置为 null，我们也同步重置
            if (selectedItemFromList === null) {
                lastSelectedItemRef.current = null;
            }
            return;
        }

        // 获取当前项列表
        let listPathName;
        if (Array.isArray(field.name) && parentNamePath && parentNamePath.length > 0) {
            const listName = field.name[field.name.length - 1];
            listPathName = [...parentNamePath, listName];
        } else {
            listPathName = field.name;
        }

        const formInstance = formProp || Form.useFormInstance();
        let listValues = formProp.getFieldValue(listPathName) || [];

        // 处理selectedItemFromList为数组的情况
        const itemsToAdd = Array.isArray(selectedItemFromList) ? selectedItemFromList : [selectedItemFromList];

        // 过滤掉重复项
        let filteredItemsToAdd = itemsToAdd;
        if (collapseFormConfig.disableDuplicate) {
            const originalLength = itemsToAdd.length;
            filteredItemsToAdd = itemsToAdd.filter(selectedItem =>
                !listValues.some(item => item.id === selectedItem.id)
            );

            // 如果过滤后没有剩余项目，显示错误并返回
            if (filteredItemsToAdd.length === 0) {
                messageApi.error(collapseFormConfig.disableDuplicatePlaceholder || 'All selected items already exist');
                return;
            }

            // 如果有被过滤掉的项目，显示提示信息
            // const filteredCount = originalLength - filteredItemsToAdd.length;
            // if (filteredCount > 0) {
            //     messageApi.error(collapseFormConfig.disableDuplicatePlaceholder)
            // }
        }

        const expandedItemInfo = formInstance.getFieldValue('expandedItemInfo') || {};

        const isAnyItemExpanded = expandedItemInfo.expandedName !== undefined;
        // 判断当前这个列表实例是否是那个包含了"已展开项"的列表
        const isThisTheExpandedList = isAnyItemExpanded && JSON.stringify(expandedItemInfo.expandedName) === JSON.stringify(field.name);
        let isTargetForAddition = false;
        console.log(activeKeys, field.name);
        console.log(expandedItemInfo.expandedName);

        if (isAnyItemExpanded) {
            // --- 情况1: 有项目被展开 ---
            // 只有当这个列表实例是包含展开项的那个列表时，才将它作为添加目标
            if (isThisTheExpandedList) {
                isTargetForAddition = true;
            }
        } else {

            // --- 情况2: 没有任何项目被展开 ---
            // 目标是"最后一个面板"
            if (parentNamePath && parentNamePath.length >= 2) {
                // 对于嵌套列表，例如 parentNamePath: ['exerciseGroupList', 0]
                const parentListName = parentNamePath[0]; // 'exerciseGroupList'
                const currentIndex = parentNamePath[1];   // 0
                const parentList = formInstance.getFieldValue(parentListName);

                // 确认父列表是个数组，并且当前索引是最后一个
                if (Array.isArray(parentList) && currentIndex === parentList.length - 1) {
                    isTargetForAddition = true;
                }
            } else {
                // 对于非嵌套列表（顶层列表），它本身就是唯一也是最后一个
                isTargetForAddition = true;
            }
        }

        // 如果当前列表实例不是目标，则直接退出
        if (!isTargetForAddition) {
            return;
        }

        // --- 执行添加操作 ---

        // 标记为已处理，防止重复添加
        lastSelectedItemRef.current = selectedItemFromList;

        // 核心修复：根据是否为嵌套列表来构造正确的路径
        let listPath;
        if (Array.isArray(field.name) && parentNamePath && parentNamePath.length > 0) {
            const listName = field.name[field.name.length - 1];
            listPath = [...parentNamePath, listName];
        } else {
            listPath = field.name;
        }

        const currentValues = formInstance.getFieldValue(listPath) || [];

        // 默认添加到末尾
        let insertIndex = currentValues.length;
        if (isThisTheExpandedList && expandedItemInfo.expandedIndex < currentValues.length) {
            // 如果有展开项，就添加到展开项的后面
            insertIndex = expandedItemInfo.expandedIndex + 1;
        }

        // 记录添加的最后一个元素的索引，用于展开
        let lastAddedIndex = insertIndex;

        // 添加所有项目
        filteredItemsToAdd.forEach((item, idx) => {
            const itemToAdd = typeof item === 'object' ? { ...item } : item;
            const currentInsertIndex = insertIndex + idx;
            addItemRef.current(itemToAdd, currentInsertIndex);
            lastAddedIndex = currentInsertIndex;
        });

        // 更新折叠面板的展开状态
        if (isArray(activeKeys)) {
            // 检查field.name是否已经存在于activeKeys数组中，避免重复添加
            if (setActiveCollapseKeys) {
                if (isArray(activeKeys)) {
                    // 如果不存在则添加，否则保持不变
                    if (!activeKeys.some(key => JSON.stringify(key) === JSON.stringify(field.name))) {
                        setActiveCollapseKeys([...activeKeys, field.name]);
                    }
                } else {
                    // 如果activeKeys不是数组，则直接设置
                    setActiveCollapseKeys([field.name]);
                }
            }
        }

        setTimeout(() => {
            // 将最后添加的项设置为展开状态
            formInstance.setFieldValue('expandedItemInfo', {
                expandedIndex: lastAddedIndex,
                expandedName: field.name
            });

            // 更新本地状态
            setExpandedItem({
                index: lastAddedIndex,
                name: field.name
            });

            // 强制重新渲染以确保UI同步
            setForceRender(prev => prev + 1);

            scrollIntoViewToItem(lastAddedIndex, field.name);
        }, 0);

        // 组件卸载时清理引用
        return () => {
            lastSelectedItemRef.current = null;
        };
    }, [selectedItemFromList]);

    /**
     * 切换项目锁定状态
     * @param {Object} item - 当前项目数据
     * @param {Number} index - 项目索引
     */
    const handleToggleLock = useCallback((e, item, index) => {
        e.stopPropagation();
        const formInstance = formProp || Form.useFormInstance();

        // 切换锁定状态 - 0变1，1变0
        const currentValue = item[field.lockName] || 0;
        const newValue = currentValue === 0 ? 1 : 0;

        // 获取当前字段所有值
        const values = formInstance.getFieldValue(field.name);

        // 更新特定索引处的特定属性
        const updatedValues = [...values];
        updatedValues[index] = {
            ...updatedValues[index],
            [field.lockName]: newValue
        };

        // 更新整个数组字段
        formInstance.setFieldValue(field.name, updatedValues);
    }, []);

    /**
     * 打开替换项目弹框
     * @param {Object} item - 当前项目数据
     * @param {Number} index - 项目索引
     */
    const handleOpenReplaceModal = useCallback((e, item, index) => {
        e.stopPropagation();

        // 列表名是 field.name 的最后一个元素
        const listName = Array.isArray(field.name) ? field.name[field.name.length - 1] : field.name;
        // 列表的完整路径 = 父路径 + 列表名
        const listPath = [...parentNamePath, listName];


        setReplaceModalVisible(true);
        setCurrentReplaceItem({
            panelId: listPath,
            itemId: item?.id,
            itemIndex: index,
            // 构造并保存当前项的完整 namePath
            namePath: [...listPath, index]
        });
    }, [parentNamePath, field.name]);

    /**
     * 复制项目
     * @param {Object} item - 当前项目数据
     * @param {Number} index - 项目索引
     */
    const handleCopyItem = useCallback((e, item, index) => {
        e.stopPropagation();
        const formInstance = formProp || Form.useFormInstance();

        // 复制项目逻辑
        const newItem = { ...item };
        // 使用addItemRef.current方法添加复制的项目
        if (addItemRef.current) {
            // 在当前项后面添加复制项
            addItemRef.current(newItem, index + 1);

            // 复制后自动展开新复制的项
            setTimeout(() => {
                formInstance.setFieldValue('expandedItemInfo', {
                    expandedIndex: index + 1,
                    expandedName: field.name
                });

                // 更新本地状态
                setExpandedItem({
                    index: index + 1,
                    name: field.name
                });

                scrollIntoViewToItem(index + 1, field.name);
            }, 0);
        }
    }, [formProp, field.name]);

    /**
     * 删除项目
     * @param {Object} item - 当前项目数据
     * @param {Number} index - 项目索引
     * @param {Boolean} isExpanded - 项目是否展开
     * @param {Function} remove - 删除函数
     */
    const handleDeleteItem = useCallback((e, isExpanded, index, remove, fields) => {
        e.stopPropagation();
        const formInstance = formProp || Form.useFormInstance();

        // 如果要删除的项正好是展开的项，先清除展开状态
        if (isExpanded) {
            formInstance.setFieldValue('expandedItemInfo', {});
            setExpandedItem(null);
        } else if (expandedItem &&
            JSON.stringify(expandedItem.name) === JSON.stringify(field.name) &&
            expandedItem.index > index) {
            // 如果删除的项在展开项之前，更新展开项索引
            const newExpandedIndex = expandedItem.index - 1;
            formInstance.setFieldValue('expandedItemInfo', {
                expandedIndex: newExpandedIndex,
                expandedName: field.name
            });

            // 更新本地状态
            setExpandedItem({
                index: newExpandedIndex,
                name: field.name
            });
        }

        // 删除项
        remove(index);
        // 删除后检查列表是否为空
        // 如果列表为空，设置expandedItemInfo为当前field.name和expandedIndex为0
        if (!fields || fields.length <= 1) {
            formInstance.setFieldValue('expandedItemInfo', {
                expandedIndex: 0,
                expandedName: field.name
            });

            // 更新本地状态
            setExpandedItem({
                index: 0,
                name: field.name
            });
        }

    }, [formProp, expandedItem, field.name]);

    /**
     * 可排序项组件
     * @param {Object} fieldItem - 字段项
     * @param {Number} index - 索引
     * @param {Array} fields - 字段数组
     * @param {Function} remove - 删除函数
     * @param {Function} move - 移动函数
     * @param {Object} itemData - 当前项的数据
     * @param {Object} allFormData - 整个表单数据(用于调试)
     */
    const SortableItem = ({ fieldItem, index, fields, remove, move, itemData, allFormData }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            isDragging,
            isOver,
        } = useSortable({
            id: `item-${index}`,
            transition: {
                duration: 200,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            },
            delay: 100,
            delayTouch: 100,
        });


        // 获取表单实例
        const formInstance = formProp || Form.useFormInstance();
        let fieldName = field.name;
        if (isArray(fieldName)) {
            fieldName = fieldName.find(item => item);
        }

        // 获取展开状态信息
        const expandedItemInfo = formInstance.getFieldValue('expandedItemInfo') || {};
        const isExpanded = JSON.stringify(expandedItemInfo.expandedName) === JSON.stringify(field.name) && expandedItemInfo.expandedIndex === index;

        // 使用传入的itemData作为当前项
        let item = itemData;

        // 如果没有数据，尝试从表单中获取
        if (!item) {
            const formInstance = formProp || Form.useFormInstance();

            if (Array.isArray(field.name)) {
                try {
                    if (field.name.length >= 2) {
                        // 获取父级数据 - 可能是两级或三级路径
                        // 如果是三级: ['exerciseGroupList', 0, 'exerciseIdList']
                        // 如果是两级: [0, 'exerciseIdList'] 或 ['exerciseGroupList', 0]

                        // Form.List的字段路径特殊处理
                        if (typeof field.name[0] === 'number') {
                            // 处理形如 [0, 'exerciseIdList'] 的情况，这是Form.List内部处理后的路径
                            // 需要从父级组件获取实际的完整路径
                            const arrayIndex = field.name[0]; // 例如 0
                            const arrayName = field.name[1];  // 例如 'exerciseIdList'

                            // 如果存在allFormData.exerciseGroupList这样的结构，试着使用它
                            if (allFormData && allFormData.exerciseGroupList &&
                                allFormData.exerciseGroupList[arrayIndex] &&
                                allFormData.exerciseGroupList[arrayIndex][arrayName]) {

                                // 从allFormData获取数据
                                item = allFormData.exerciseGroupList[arrayIndex][arrayName][fieldItem.name];
                            } else {
                                // 尝试直接通过fieldItem.namePath获取
                                if (fieldItem.namePath) {
                                    item = formInstance.getFieldValue(fieldItem.namePath);
                                }
                            }
                        }
                        else if (field.name.length === 3) {
                            // 处理完整的三级路径 ['exerciseGroupList', 0, 'exerciseIdList']
                            const [parentArrayName, parentIndex, childArrayName] = field.name;

                            const parentObj = formInstance.getFieldValue([parentArrayName, parentIndex]);
                            if (parentObj && Array.isArray(parentObj[childArrayName])) {
                                item = parentObj[childArrayName][fieldItem.name];
                            }
                        }
                        else {
                            // 处理简单的两级路径 ['someArray', 0]
                            const items = formInstance.getFieldValue(field.name) || [];
                            if (Array.isArray(items)) {
                                item = items[fieldItem.name];
                            } else if (typeof items === 'object') {
                                // 如果是对象，可能需要查找特定属性
                                for (const key in items) {
                                    if (Array.isArray(items[key])) {
                                        item = items[key][fieldItem.name];
                                        if (item) break;
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('获取嵌套数据失败:', error, { field: field.name, fieldItem });
                }
            }
            // 处理简单字段
            else {
                const items = formInstance.getFieldValue(field.name) || [];
                item = items[fieldItem.name];
            }

            // 如果没有通过field.name获取到数据，但有namePath，尝试直接通过namePath获取
            if (!item && fieldItem.namePath) {
                item = formInstance.getFieldValue(fieldItem.namePath);
                console.log('通过namePath获取:', fieldItem.namePath, item);
            }
        }

        // 应急处理：如果还是没有数据，尝试从所有可能的路径获取
        if (!item && allFormData) {
            // 遍历查找exerciseGroupList结构
            if (allFormData.exerciseGroupList) {
                for (const group of allFormData.exerciseGroupList) {
                    if (group && group.exerciseIdList && group.exerciseIdList[index]) {
                        item = group.exerciseIdList[index];
                        break;
                    }
                }
            }
        }

        // 如果还是没有数据，使用空对象防止报错
        if (!item) {
            item = {};
        }


        // 鼠标事件相关状态
        const [mouseDownPos, setMouseDownPos] = useState(null);
        const moveThreshold = 5; // 移动阈值，超过这个距离就认为是拖拽

        // 添加 ref 用于滚动
        const itemRef = useRef(null);
        const { displayKeys = [], displayTitle, displayFileName } = commonListConfig || {};

        // 拖拽相关样式
        const rowStyle = {
            transform: CSS.Transform.toString(transform),
            cursor: 'pointer',
            boxShadow: isDragging ? '0 0 20px rgba(0, 0, 0, 0.25)' : 'none',
            backgroundColor: isDragging ? '#fff' : 'transparent',
            borderRadius: isDragging ? '4px' : '0',
            position: isDragging ? 'relative' : 'static',
            zIndex: isDragging ? 9999 : 'auto',
            transition: 'none'
        };

        const wrapperStyle = {
            opacity: 1,
            transition: 'all 0.3s ease'
        };

        // 处理鼠标按下事件
        const handleMouseDown = useCallback((e) => {
            // 如果点击来自操作按钮，不设置mouseDownPos，阻止事件冒泡
            if (e.target.closest('.structure-item-actions') ||
                e.target.closest('.ant-list-item-meta-avatar')) {
                return;
            }
            setMouseDownPos({ x: e.clientX, y: e.clientY });
        }, []);

        // 处理鼠标抬起事件
        const handleMouseUp = useCallback((e) => {
            // 如果点击来自操作按钮，不处理展开/折叠
            if (e.target.closest('.structure-item-actions')) {
                return;
            }
            if (mouseDownPos) {
                const dx = Math.abs(e.clientX - mouseDownPos.x);
                const dy = Math.abs(e.clientY - mouseDownPos.y);

                // 如果移动距离小于阈值，认为是点击，触发展开/折叠
                if (dx < moveThreshold && dy < moveThreshold && !isDragging) {
                    toggleExpand();
                }
                setMouseDownPos(null);
            }
        }, [mouseDownPos, isDragging]);

        // 处理鼠标移动事件
        const handleMouseMove = useCallback((e) => {
            if (mouseDownPos) {
                const dx = Math.abs(e.clientX - mouseDownPos.x);
                const dy = Math.abs(e.clientY - mouseDownPos.y);

                // 如果移动距离超过阈值，清除mouseDownPos，避免触发点击
                if (dx >= moveThreshold || dy >= moveThreshold) {
                    setMouseDownPos(null);
                }
            }
        }, [mouseDownPos]);

        // 切换展开/折叠状态
        const toggleExpand = () => {
            // 构造列表的唯一路径
            const listName = Array.isArray(field.name) ? field.name[field.name.length - 1] : field.name;
            const listPath = [...parentNamePath, listName];

            if (isExpanded) {
                // 如果当前项已经展开，则收起
                formInstance.setFieldValue('expandedItemInfo', {});
                setExpandedItem(null);
                // 通知父组件已无展开项
                onExpanded && onExpanded(null);
            } else {
                // 展开当前项，同时会折叠其他项
                formInstance.setFieldValue('expandedItemInfo', {
                    expandedIndex: index,
                    expandedName: field.name
                });

                // 更新本地状态
                setExpandedItem({
                    index: index,
                    name: field.name
                });

                // 通知父组件当前展开项所在的列表路径
                onExpanded && onExpanded(listPath);

                // 展开后滚动到可见区域
                scrollIntoViewToItem(index, field.name);
            }
        };

        // 只有当项目是展开状态且不在拖拽中时，才添加expanded类名
        const wrapperClassName = `${styles.structureListItem} ${styles.itemWrapper}${isExpanded && !isDragging ? ' ' + styles.expanded : ''} ${isOver ? ' ' + styles.dragOver : ''}`;

        // 使用统一ID生成函数
        const itemIdAttr = generateItemId(field.name, parentNamePath, index, item);

        // 使用Form.Item的shouldUpdate模式获取当前项数据
        return (
            <div
                ref={itemRef}
                style={wrapperStyle}
                className={wrapperClassName}
                data-item-id={itemIdAttr}
            >
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => {
                        // 使用 lodash.get 安全地获取嵌套值
                        const path = Array.isArray(field.name) ? [...field.name, fieldItem.name] : [field.name, fieldItem.name];
                        const prevItem = get(prevValues, path);
                        const currentItem = get(currentValues, path);
                        return JSON.stringify(prevItem) !== JSON.stringify(currentItem);
                    }}
                >
                    {({ getFieldValue }) => {
                        // 展开/折叠状态
                        const expandedItemInfo = getFieldValue('expandedItemInfo') || {};
                        const isExpanded = JSON.stringify(expandedItemInfo.expandedName) === JSON.stringify(field.name) && expandedItemInfo.expandedIndex === index;
                        // 统一通过路径获取 itemData
                        const path = Array.isArray(field.name) ? [...field.name, fieldItem.name] : [field.name, fieldItem.name];
                        const itemData = getFieldValue(path);

                        return (
                            <Row
                                ref={setNodeRef}
                                style={rowStyle}
                                {...attributes}
                                wrap={false}
                                align="middle"
                                className={styles.sortableItemRow}
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setMouseDownPos(null)}
                                {...listeners}
                            >
                                <Col flex="auto">
                                    <RenderItemMeta
                                        item={item}
                                        displayKeys={displayKeys}
                                        displayTitle={displayTitle}
                                        displayFileName={displayFileName}
                                    />
                                </Col>
                                <Col flex="none">
                                    <Space className={`structure-item-actions ${styles.structureItemActions}`}>
                                        {field.lockName && (
                                            <Button
                                                style={{ fontSize: '15px', color: '#1c8' }}
                                                type="text"
                                                icon={item?.[field.lockName] ? <LockFilled style={{
                                                    color: 'var(--text-primary)'
                                                }} /> : <UnlockFilled />}
                                                onClick={(e) => handleToggleLock(e, item, index)}
                                                onPointerDown={e => e.stopPropagation()}
                                                title="Lock/Unlock"
                                            />
                                        )}
                                        {!collapseFormConfig.disableDuplicate && (
                                            <Button
                                                style={{ fontSize: '15px', color: '#1c8' }}
                                                type="text"
                                                icon={<RetweetOutlined />}
                                                onClick={(e) => handleOpenReplaceModal(e, item, index)}
                                                onPointerDown={e => e.stopPropagation()}
                                                title="Replace"
                                            />
                                        )}
                                        {
                                            !collapseFormConfig.disableDuplicate && <Button
                                                style={{ fontSize: '15px', color: '#1c8' }}
                                                type="text"
                                                icon={<CopyOutlined />}
                                                onClick={(e) => handleCopyItem(e, item, index)}
                                                onPointerDown={e => e.stopPropagation()}
                                                title="Copy"
                                            />
                                        }
                                        <Button
                                            style={{ fontSize: '15px', color: '#ff5252' }}
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => handleDeleteItem(e, isExpanded, index, remove, fields)}
                                            onPointerDown={e => e.stopPropagation()}
                                            title="Delete"
                                        />
                                        <Button
                                            type="text"
                                            style={{ fontSize: '15px', color: '#1c8', cursor: 'grab' }}
                                            icon={<MenuOutlined />}
                                            className={styles.sortHandle}
                                            title="Drag Sort"
                                        />
                                    </Space>
                                </Col>
                            </Row>
                        );
                    }}
                </Form.Item>
            </div>
        );
    };

    /**
     * 拖拽结束处理
     * @param {Object} event - 拖拽事件对象
     */
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeIndex = parseInt(active.id.split('-')[1], 10);
            const overIndex = parseInt(over.id.split('-')[1], 10);

            // 使用 antd form 自带的 move 方法，确保数据状态正确更新
            if (moveRef.current) {
                moveRef.current(activeIndex, overIndex);
            }

            // 通知上层组件数据已更新
            if (options?.onSortItems) {
                options.onSortItems(field.name, activeIndex, overIndex);
            }

            // 拖拽结束后，将拖拽的项设置为新的展开项
            const formInstance = formProp || Form.useFormInstance();
            const newExpandedIndex = overIndex;

            // 获取移动到新位置的数据
            let movedItemData;
            if (Array.isArray(field.name)) {
                const path = [...field.name, newExpandedIndex];
                movedItemData = getFieldValueByName(formInstance, path);
            } else {
                movedItemData = (formInstance.getFieldValue(field.name) || [])[newExpandedIndex];
            }

            // 更新展开项信息
            formInstance.setFieldValue('expandedItemInfo', {
                expandedName: field.name,
                expandedIndex: newExpandedIndex
            });

            // 更新本地状态
            setExpandedItem({
                index: newExpandedIndex,
                name: field.name
            });
        }
    }, [formProp, field.name, options]);

    /**
     * 滚动到指定项目
     * @param {Number} expandedIndex - 展开项索引
     * @param {String|Array} name - 字段名称
     */
    const scrollIntoViewToItem = useCallback((expandedIndex, name) => {
        // 确保name与当前field.name匹配，避免多个面板响应
        const currentNameStr = JSON.stringify(field.name);
        const targetNameStr = JSON.stringify(name);

        if (currentNameStr !== targetNameStr) {
            // 如果不匹配当前面板，则不执行滚动
            return;
        }

        setTimeout(() => {
            // 使用统一ID生成函数，这里只传索引作为关键参数
            const itemId = generateItemId(name, parentNamePath, expandedIndex);

            // 减少日志输出，仅在调试模式下记录
            if (process.env.NODE_ENV === 'development') {
                console.log(`面板 ${targetNameStr} 尝试滚动到元素:`, itemId);
            }

            const item = document.querySelector(`[data-item-id="${itemId}"]`);
            if (item) {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            } else {
                // 尝试使用备用选择器
                const backupSelector = `[data-item-id*="-item-${expandedIndex}"]`;
                const backupItem = document.querySelector(backupSelector);
                if (backupItem) {
                    backupItem.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        }, 0); // 延长等待时间，确保DOM已更新
    }, [field.name, parentNamePath]);

    // 监听 expandedItem 变化，滚动到展开项目
    useEffect(() => {
        // 只有当expandedItem存在且与当前组件关联时才执行滚动
        if (expandedItem && expandedItem.index != null) {
            // 检查当前expandedItem是否属于当前面板
            const currentNameStr = JSON.stringify(field.name);
            const expandedNameStr = JSON.stringify(expandedItem.name);

            if (currentNameStr === expandedNameStr) {
                // 只对匹配当前面板的展开项执行滚动
                scrollIntoViewToItem(expandedItem.index, expandedItem.name);
            }
        }
    }, [expandedItem]);

    /**
     * 处理替换项目选中后的回调
     */
    const handleReplaceItemSelected = useCallback(() => {

        // 只有当选中项不是当前项时才执行替换
        if (tempSelectedItem && tempSelectedItem.id !== currentReplaceItem.itemId) {
            // 获取表单实例
            const formInstance = formProp || Form.useFormInstance();

            // 如果存在 namePath，使用它来更新，这是最准确的方式
            if (currentReplaceItem.namePath) {
                const namePath = currentReplaceItem.namePath;
                const currentItem = formInstance.getFieldValue(namePath);

                let newItem = { ...tempSelectedItem };
                if (field.lockName && currentItem && currentItem[field.lockName] !== undefined) {
                    newItem[field.lockName] = currentItem[field.lockName];
                }
                formInstance.setFieldValue(namePath, newItem);
            } else {
                // 回退到旧的逻辑，用于非嵌套或简单场景
                const currentValues = formInstance.getFieldValue(currentReplaceItem.panelId) || [];
                const currentItem = currentValues[currentReplaceItem.itemIndex];

                const newValues = [...currentValues];
                if (field.lockName && currentItem && currentItem[field.lockName] !== undefined) {
                    newValues[currentReplaceItem.itemIndex] = {
                        ...tempSelectedItem,
                        [field.lockName]: currentItem[field.lockName]
                    };
                } else {
                    newValues[currentReplaceItem.itemIndex] = tempSelectedItem;
                }
                formInstance.setFieldValue(currentReplaceItem.panelId, newValues);
            }

            // 如果替换的是当前展开的项，保持展开状态
            const panelIdForCheck = Array.isArray(currentReplaceItem.panelId) ? currentReplaceItem.panelId.join(',') : currentReplaceItem.panelId;
            const expandedNameForCheck = Array.isArray(expandedItem?.name) ? expandedItem.name.join(',') : expandedItem?.name;

            if (expandedItem &&
                panelIdForCheck === expandedNameForCheck &&
                expandedItem.index === currentReplaceItem.itemIndex) {
                formInstance.setFieldValue('expandedItemInfo', {
                    expandedIndex: currentReplaceItem.itemIndex,
                    expandedName: currentReplaceItem.panelId
                });
                scrollIntoViewToItem(currentReplaceItem.itemIndex, currentReplaceItem.panelId);
            }

            // 强制重新渲染，确保UI更新
            setForceRender(prev => prev + 1);
        }

        // 关闭弹框
        setReplaceModalVisible(false);

        // 清除临时选中项
        setTempSelectedItem(null);
    }, [tempSelectedItem, currentReplaceItem, expandedItem, formProp, field.lockName, scrollIntoViewToItem]);

    // 处理CommonList中选中项变更
    const handleCommonListItemSelect = useCallback((selectedItem) => {
        setTempSelectedItem(selectedItem);
    }, []);
    field.rules = field.rules || [];

    return (
        <>
            {contextHolder}
            <Form.Item
                name={field.name}
                required={field.required}
                rules={[...field.rules, {
                    validator: (_, value) => {
                        if (!value || value.length === 0) {
                            return notification.error({
                                message: `Cannot Add New 【${field.label}】`,
                                description: field.rules?.[0]?.message || 'Please add at least one item',
                                placement: 'bottomRight',
                            });
                        }
                        return Promise.resolve();
                    }
                }]}
                help=''

            >

                {/* 嵌套Form.List处理修复 - 这里需要直接使用field.name，不做转换 */}
                <Form.List name={field.name}>
                    {(fields, { add, remove, move }) => {
                        addItemRef.current = add; // 保存add方法
                        moveRef.current = move; // 保存move方法

                        // 重要：在嵌套结构中，fields可能无法正确反映实际数据
                        // 直接从表单获取真实数据，确保界面和数据一致
                        const formInstance = formProp || Form.useFormInstance();
                        let actualData = [];

                        if (Array.isArray(field.name) && field.name.length > 1) {
                            // 嵌套结构，直接获取数据
                            const parentPath = field.name.slice(0, -1);
                            const childKey = field.name[field.name.length - 1];
                            const parentObj = formInstance.getFieldValue(parentPath);
                            if (parentObj && Array.isArray(parentObj[childKey])) {
                                actualData = parentObj[childKey];
                            }
                        } else {
                            // 简单结构，直接使用field.name
                            actualData = formInstance.getFieldValue(field.name) || [];
                        }

                        // 数据为空时显示空状态
                        if (fields.length === 0 && actualData.length === 0) {
                            return (
                                <div className={styles.dynamicFormList}>
                                    <Empty title={field.emptyPlaceholder || `Please add ${field.label || 'item'}`} />
                                </div>
                            );
                        }

                        // 使用fields或actualData中较长的那个来渲染，确保显示完整
                        const renderItems = actualData.length > fields.length ?
                            actualData.map((_, i) => ({ name: i, key: `actual-${i}` })) :
                            fields;

                        return (
                            <div className={styles.dynamicFormList}>
                                <div className={styles.listTotal}> {renderItems.length} {field.label}</div>
                                <DndContext
                                    sensors={options?.sensors}
                                    collisionDetection={closestCenter}
                                    modifiers={[restrictToVerticalAxis]}
                                    onDragEnd={handleDragEnd}
                                    measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                                    autoScroll={true}
                                >
                                    <SortableContext
                                        items={renderItems.map((_, index) => `item-${index}`)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className={styles.structureList}>
                                            {renderItems.map((fieldItem, index) => {
                                                // 生成唯一键，确保正确重新渲染
                                                const uniqueKey = `${fieldItem.key || `item-${index}`}-${forceRender}`;

                                                // 获取整个表单数据
                                                const formInstance = formProp || Form.useFormInstance();
                                                const allFormData = formInstance.getFieldsValue(true);
                                                const path = Array.isArray(field.name) ? [...field.name, fieldItem.name] : [field.name, fieldItem.name];
                                                const itemData = get(allFormData, path);

                                                return (
                                                    <Form.Item key={fieldItem.key} shouldUpdate noStyle>
                                                        {() => {
                                                            const formInstance = formProp || Form.useFormInstance();
                                                            // antd Form.List 嵌套时, fieldItem.namePath 会提供完整的路径
                                                            // 例如: ['exerciseGroupList', 0, 'exerciseIdList', 0]
                                                            const itemData = getFieldValueByName(formInstance, fieldItem.namePath);
                                                            const allFormData = formInstance.getFieldsValue(true);

                                                            return (
                                                                <SortableItem
                                                                    key={uniqueKey}
                                                                    fieldItem={fieldItem}
                                                                    index={index}
                                                                    fields={fields}
                                                                    remove={remove}
                                                                    move={move}
                                                                    itemData={itemData}
                                                                    allFormData={allFormData}
                                                                />
                                                            );
                                                        }}
                                                    </Form.Item>
                                                );
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        );
                    }}
                </Form.List>
            </Form.Item >

            {/* 替换弹框 */}
            < Modal
                title='Replace Item'
                open={replaceModalVisible}
                getContainer={document.body}
                onCancel={() => setReplaceModalVisible(false)
                }
                okText="Confirm Replace"
                cancelText="Cancel"
                width="90%"
                styles={{ body: { height: '65vh', width: '100%' } }}
                destroyOnClose={true}
                okButtonProps={{ disabled: isConfirmButtonDisabled }}
                onOk={handleReplaceItemSelected}
            >
                {
                    commonListConfig && (
                        <CommonList
                            selectionMode="replace"
                            selectedItemId={tempSelectedItem?.id || currentReplaceItem.itemId}
                            onAddItem={handleCommonListItemSelect}
                            {...commonListConfig}
                        />
                    )
                }
            </Modal >
        </>
    );
}
