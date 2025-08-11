import React, { useEffect, useMemo, Fragment, useState, useCallback } from 'react';
import { Collapse, Form, Button, Typography, List, Avatar, Space, Row, Col, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, MenuOutlined, RetweetOutlined, ShrinkOutlined, ArrowsAltOutlined } from '@ant-design/icons';
import { renderFormItem } from './FormFields';
import CommonList from './CommonList';
import { optionsConstants } from '@/constants';
import styles from './CollapseForm.module.css';
import {
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const { Text } = Typography;

// --- 可排序项渲染器组件 ---
const SortableItemRenderer = React.memo(({ panelId, item, itemIndex, isExpanded, toggleExpandItem, onOpenReplaceModal, renderItemMata, onDeleteItem }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useSortable({
        id: `${panelId}-item-${itemIndex}`, // 使用面板ID和项目索引组合作为唯一标识符
        data: {
            type: 'item',
            item,
            panelId,
            itemIndex
        }
    });

    // Row（可拖拽元素）的样式
    const rowStyle = {
        transform: CSS.Transform.toString(transform),
    };

    // 外层 wrapper 的样式 (视觉效果，例如透明度)
    const wrapperStyle = {
        opacity: isDragging ? 0.5 : 1,
    };

    // 为拖拽中的元素添加样式类（去掉动画）
    const wrapperClassName = `structure-list-item item-wrapper ${isExpanded ? 'expanded' : ''}`;

    // 默认的列表项渲染函数 
    const defaultRenderItemMeta = useCallback((item) => {
        return <List.Item.Meta
            style={{
                display: 'flex',
                alignItems: 'center',
            }}
            avatar={
                <div className={styles.itemAvatar}>
                    <Avatar shape="square" size={64} src={item.imageUrl || item.animationPhoneUrl} />
                </div>
            }
            title={<Text ellipsis={{ tooltip: item.displayName || item.title }}>{item.displayName || item.title || '未命名项目'}</Text>}
            description={
                <div>
                    <div>
                        <Text
                            type="secondary"
                            style={{ fontSize: '12px' }}
                            ellipsis={{ tooltip: item.status }}
                        >
                            {optionsConstants.statusList.find(status => status.value === item.status)?.name || '-'}
                        </Text>
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: item.functionType || item.type }}>
                            {item.functionType || item.type || '-'}
                        </Text>
                    </div>
                </div>
            }
        />
    }, []);

    return (
        // 外层 wrapper 控制透明度/边距
        <div style={wrapperStyle} className={wrapperClassName}>
            {/* Row 同时处理拖拽监听和点击切换 */}
            <Row
                ref={setNodeRef}
                style={rowStyle}
                {...attributes}
                {...listeners}
                wrap={false}
                align="middle"
                className="sortable-item-row" // 添加类名以便在 CSS 中定位
                onClick={() => toggleExpandItem && toggleExpandItem(panelId, item.id)} // Row 点击切换展开
            >
                <Col flex="auto">
                    {renderItemMata ? renderItemMata(item) : defaultRenderItemMeta(item)}
                </Col>
                <Col flex="none">
                    <Space className="structure-item-actions">
                        {/* 替换按钮 */}
                        {onOpenReplaceModal && (
                            <Button
                                key="replace"
                                type="text"
                                icon={<RetweetOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onOpenReplaceModal(panelId, item.id, itemIndex); // 添加索引参数
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Replace"
                            />
                        )}
                        {/* 删除按钮 */}
                        {onDeleteItem && (
                            <Button
                                key="delete"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onDeleteItem(panelId, itemIndex); // 修改：传递索引而不是ID
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Delete"
                            />
                        )}
                        {/* 排序/拖拽句柄按钮 */}
                        <Button
                            key="sort"
                            type="text"
                            icon={<MenuOutlined />}
                            className="sort-handle" // 使用类名代替内联样式
                            onClick={(e) => e.stopPropagation()} // 阻止 Row 的 onClick
                            title="Sort"
                        />
                    </Space>
                </Col>
            </Row>
        </div>
    );
});

/**
 * 折叠表单组件
 * 根据formFields配置动态渲染表单项
 * @param {Object} props 组件属性
 * @param {Array} props.fields 表单字段配置数组
 * @param {Object} props.form 表单实例
 * @param {Object} props.initialValues 初始值
 * @param {Array} props.activeCollapseKeys 当前激活的面板keys
 * @param {Function} props.onCollapseChange 折叠面板变化回调
 * @param {Object} props.selectedItemFromList 左侧列表添加item
 * @param {Function} props.setActiveCollapseKeys 设置激活面板的函数
 * @param {boolean} props.isCollapse 是否可折叠
 * @param {Function} props.onItemAdded 添加项后的回调函数，用于清空选中状态
 * @param {Function} props.onSelectedItemProcessed 处理完选中项后的回调函数，用于清空选中状态
 * @param {Function} props.onSortItems 处理排序的回调函数
 * @param {Function} props.onExpandItem 处理展开项的回调函数
 * @param {Function} props.onDeleteItem 处理删除项的回调函数
 * @param {Function} props.onUpdateItem 处理更新项的回调函数
 * @param {Function} props.onReplaceItem 处理替换项的回调函数
 * @param {Component} props.commonListConfig 替换弹框中显示的commonListConfig组件
 * @param {Object} props.collapseFormConfig 折叠面板配置
 * @param {String} props.moduleKey 模块key
 * @param {String} props.editId 编辑ID
 */
const CollapseForm = ({
    fields = [],
    form,
    editId,
    moduleKey,
    renderItemMata,
    commonListConfig = {},
    selectedItemFromList = null,
    initialValues = {},
    activeCollapseKeys = [],
    setActiveCollapseKeys,
    collapseFormConfig = {},
    onCollapseChange,

    isCollapse = true,
    onItemAdded,
    onSelectedItemProcessed,
    onSortItems,
    onExpandItem,
    onDeleteItem,
    onUpdateItem,
    onReplaceItem,
}) => {
    // 表单连接状态
    const formConnected = !!form;
    // 挂载状态引用
    const mounted = useMemo(() => ({ current: true }), []);
    // 添加展开项的状态
    const [expandedItems, setExpandedItems] = useState({});
    // 追踪哪个 DynamicFormList 内部有展开项
    const [listWithExpandedItemPath, setListWithExpandedItemPath] = useState(null);
    // 添加替换弹框状态
    const [replaceModalVisible, setReplaceModalVisible] = useState(false);
    // 当前选中的panel和item id
    const [currentReplaceItem, setCurrentReplaceItem] = useState({
        panelId: null,
        itemId: null
    });
    // 在替换弹框中临时选中的项
    const [tempSelectedItem, setTempSelectedItem] = useState(null);

    // 处理展开/折叠项目的函数
    const toggleExpandItem = useCallback((panelId, itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [panelId]: prev[panelId] === itemId ? null : itemId // 切换展开状态
        }));
    }, []);



    // 处理CommonList中选中项变更
    const handleCommonListItemSelect = useCallback((selectedItem) => {
        // 更新临时选中的项
        setTempSelectedItem(selectedItem);
    }, []);

    // 处理替换项目选中后的回调
    const handleReplaceItemSelected = useCallback(() => {

        // 只有当选中项不是当前项时才执行替换
        if (tempSelectedItem.id !== currentReplaceItem.itemId) {
            const panelId = currentReplaceItem.panelId;     // 面板ID
            const oldItemId = currentReplaceItem.itemId;    // 旧项目ID
            const newItemId = tempSelectedItem.id;          // 新项目ID
            const newItem = tempSelectedItem;               // 新项目完整数据
            const itemIndex = currentReplaceItem.itemIndex; // 项目索引

            // 执行替换操作，传递面板ID、当前旧项目ID、新项目ID、新项目完整数据和项目索引
            onReplaceItem(panelId, oldItemId, newItemId, newItem, itemIndex);
        }

        // 关闭弹框
        setReplaceModalVisible(false);

        // 清除临时选中项
        setTempSelectedItem(null);
    }, [onReplaceItem, currentReplaceItem, tempSelectedItem]);

    // 判断确认按钮是否应该禁用
    const isConfirmButtonDisabled = useMemo(() => {
        // 如果没有临时选中项，或者临时选中项的ID与当前项ID相同，则禁用按钮
        return !tempSelectedItem || tempSelectedItem.id === currentReplaceItem.itemId;
    }, [tempSelectedItem, currentReplaceItem.itemId]);

    // dnd-kit 的传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 降低激活距离
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 收集具有 dataList 属性的面板
    const findFirstDataListItemAndParent = (fields, parent = null) => {
        if (!Array.isArray(fields)) {
            return null;
        }

        for (const item of fields) {
            // 如果当前项有 dataList 属性，直接返回结果
            if (item && item.dataList) {
                return {
                    dataListItem: item,
                    parentItem: parent || item,
                };
            }

            // 如果当前项有子字段，递归查找
            if (item && Array.isArray(item.fields)) {
                const result = findFirstDataListItemAndParent(item.fields, item);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    };

    // // 接收左侧列表添加item
    useEffect(() => {
        // 如果有从列表选择的数据，需要添加到相应的折叠面板中
        if (selectedItemFromList && setActiveCollapseKeys) {
            // 查找具有 isCollapse 属性的面板
            const collapseField = fields.find(item => item.isCollapse);
            if (collapseField) {
                // 判断面板是否已经展开
                const isCollapsed = Array.isArray(activeCollapseKeys) &&
                    activeCollapseKeys.some(key =>
                        JSON.stringify(key) === JSON.stringify(collapseField.name)
                    );

                // 如果面板未展开，则展开它
                if (!isCollapsed) {
                    if (collapseFormConfig.isAccordion) {
                        // 手风琴模式，只保留当前面板
                        setActiveCollapseKeys([collapseField.name]);
                    } else {
                        // 多面板模式，添加到现有展开面板
                        const newActiveKeys = Array.isArray(activeCollapseKeys)
                            ? [...activeCollapseKeys, collapseField.name]
                            : [collapseField.name];
                        setActiveCollapseKeys(newActiveKeys);
                    }
                }
            }
        }
    }, [selectedItemFromList]);

    useEffect(() => {
        // 当从外部列表选择一个项目时，智能地决定展开哪个面板
        if (selectedItemFromList) {
            const groupField = fields.find(item => item.isGroup);
            if (!groupField) return;

            const groupFieldName = groupField.name;

            setActiveCollapseKeys(prevKeys => {
                const currentKeys = prevKeys || [];

                // 优先：如果已知某个列表内部有展开项，直接展开其所在的面板
                if (listWithExpandedItemPath && Array.isArray(listWithExpandedItemPath)) {
                    // listWithExpandedItemPath 的格式可能是 ['exerciseGroupList', 0, 'exerciseIdList']
                    // 我们需要从中提取出面板的 key，即 'exerciseGroupList_0'
                    const [parentListName, parentIndex] = listWithExpandedItemPath;

                    if (parentListName === groupFieldName && parentIndex !== undefined) {
                        const keyToExpand = parentIndex > 0 ? `${groupFieldName}_${parentIndex}` : groupFieldName;

                        // 如果面板未展开，则展开它
                        if (!currentKeys.includes(keyToExpand)) {
                            return [...currentKeys, keyToExpand];
                        }
                    }
                }

                // 备选：如果当前没有展开的面板，则展开最后一个
                const isGroupPanelActive = currentKeys.some(key =>
                    typeof key === 'string' && key.startsWith(groupFieldName)
                );

                if (!isGroupPanelActive) {
                    const groupFieldList = form.getFieldValue(groupFieldName) || [];
                    if (groupFieldList.length > 0) {
                        const lastPanelIndex = groupFieldList.length - 1;
                        const keyToExpand = lastPanelIndex > 0 ? `${groupFieldName}_${lastPanelIndex}` : groupFieldName;
                        return [...currentKeys, keyToExpand];
                    }
                }

                // 默认：保持不变
                return currentKeys;
            });
        }
    }, [selectedItemFromList, fields, form, setActiveCollapseKeys, listWithExpandedItemPath]);

    // 根据 systemCount 初始化分组数量
    React.useEffect(() => {
        fields.filter(item => item.isGroup && item.systemCount > 0).forEach(item => {
            const current = form.getFieldValue(item.name);
            if (!current || !Array.isArray(current) || current.length === 0) {
                // 初始化为 systemCount 个空对象
                form.setFieldValue(item.name, Array(item.systemCount).fill({}));
            }
        });
    }, [fields, form]);

    // 初始化时自动展开所有分组面板
    useEffect(() => {
        fields.filter(item => item.isGroup).forEach(item => {
            const list = form.getFieldValue(item.name) || [];
            const keys = list.map((_, idx) => idx ? `${item.name}_${idx}` : item.name);
            if (typeof setActiveCollapseKeys === 'function') {
                setActiveCollapseKeys((prev = []) => {
                    // 合并去重
                    const merged = Array.from(new Set([...prev, ...keys]));
                    return merged;
                });
            }
        });
    }, [fields, form, setActiveCollapseKeys]);

    // 渲染表单字段组
    const renderFieldGroup = (fieldGroup) => {
        return fieldGroup.map((field, index) => (
            <div className={styles.collapsePanelContentItem} style={{
                width: field.width || '100%',
                flex: field.flex || '',
            }} key={field.name || `field-${index}`}>
                {renderFormItem(field, {
                    form,
                    editId,
                    fields,
                    collapseFormConfig,
                    activeCollapseKeys,
                    setActiveCollapseKeys,
                    formConnected,
                    initialValues,
                    mounted,
                    moduleKey,
                    isCollapse,
                    onDeleteItem,
                    onItemAdded,
                    onCollapseChange,
                    onReplaceItem,
                    onUpdateItem,
                    commonListConfig,
                    onSortItems,
                    onExpandItem,
                    selectedItemFromList,
                    onSelectedItemProcessed,
                    // 将回调传递给子组件
                    onExpanded: setListWithExpandedItemPath,
                })}
            </div>
        ));
    };

    // 如果没有字段配置或为空数组，则不渲染
    if (!fields || fields.length === 0) {
        return null;
    }

    // 分组添加按钮点击事件，自动展开并滚动到新面板
    const handleAddGroupPanel = async (item, add, form, setActiveCollapseKeys) => {
        const groupFieldName = item.name;
        const groupFieldList = form.getFieldValue(groupFieldName) || [];

        // 收集所有必填字段名（递归处理嵌套字段）
        const collectRequiredFieldNames = (fields = []) => {
            const names = [];

            const traverse = (list) => {
                for (const field of list) {
                    const isRequired =
                        field.required || field.rules?.some(rule => rule.required);

                    if (isRequired && field.name) {
                        names.push(field.name);
                    }

                    if (Array.isArray(field.fields)) {
                        traverse(field.fields);
                    }
                }
            };

            traverse(fields);
            return names;
        };

        // ------------------- Step 1: 构建需要验证的字段路径 -------------------
        const fieldsToValidate = [];

        if (groupFieldList.length > 0) {
            const lastPanelIndex = groupFieldList.length - 1;
            const requiredSubFieldNames = collectRequiredFieldNames(item.fields);

            requiredSubFieldNames.forEach(subFieldName => {
                fieldsToValidate.push([groupFieldName, lastPanelIndex, subFieldName]);
            });
        }

        try {
            // ------------------- Step 2: 验证 -------------------
            await form.validateFields(fieldsToValidate);

            // ------------------- Step 3: 清空展开项和添加新面板 -------------------
            form.setFieldValue('expandedItemInfo', {});
            setListWithExpandedItemPath?.(null);

            const newPanelIndex = groupFieldList.length;
            add({});

            const newKey = newPanelIndex > 0
                ? `${item.name}_${newPanelIndex}`
                : item.name;

            // 自动展开新面板
            setActiveCollapseKeys?.((prev = []) =>
                Array.from(new Set([...prev, newKey]))
            );

            // 添加后清空状态
            onSelectedItemProcessed?.();

            // ------------------- Step 4: 滚动到新面板 -------------------
            setTimeout(() => {
                document
                    .getElementById(`panel_${newKey}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 30);

        } catch (errorInfo) {
            // 验证失败，antd 表单已处理 UI 提示
            console.warn('Validation Failed:', errorInfo);
        }
    };


    // 渲染普通字段
    const renderNormalFields = () => {
        return fields.filter(item => !item.isGroup).map((item, index) => (
            <Fragment key={`fragment-${item.name || index}`}>
                <Collapse
                    expandIcon={({ isActive }) =>
                        isActive ? <ShrinkOutlined /> : <ArrowsAltOutlined />
                    }
                    destroyInactivePanel={false}
                    accordion={collapseFormConfig.isAccordion}
                    activeKey={activeCollapseKeys}
                    onChange={onCollapseChange}
                    ghost
                    expandIconPosition="end"
                    className={styles.workoutDetailsCollapse}
                    items={[
                        {
                            key: item.name || `panel-${index}`,
                            label: (
                                <div className={styles.collapseHeader}>
                                    {item.icon && <span className={styles.collapseLeftIcon}>{item.icon}</span>}
                                    <span>{item.label || item.title}</span>
                                </div>
                            ),
                            className: styles.collapsePanel,
                            children: (
                                <div className={styles.collapsePanelContent}>
                                    <div className={styles.collapsePanelContentRow}>
                                        {renderFieldGroup(item.fields || [])}
                                    </div>
                                </div>
                            )
                        }
                    ]}
                />
            </Fragment>
        ));
    };

    // 渲染所有 isShowAdd 分组到同一个 Form.List便于动态添加
    const renderGroupFields = () => {
        // 只取第一个 isGroup 字段
        const groupField = fields.find(item => item.isGroup || item.isCollapse); // 第一个分组字段
        const isShowAdd = fields.some(item => item.isShowAdd) || false;// 是否显示添加按钮

        if (!groupField) return null;
        return (
            <Form.List name={groupField.name}>
                {(fieldsList, { add, remove }) => {
                    // 删除面板时的处理函数
                    const handleRemovePanel = (panelIndex) => {
                        // 检查当前是否有展开项，并且该展开项是否位于即将被删除的面板内
                        if (
                            listWithExpandedItemPath &&
                            listWithExpandedItemPath[0] === groupField.name &&
                            listWithExpandedItemPath[1] === panelIndex
                        ) {
                            // 如果是，则重置展开状态
                            setListWithExpandedItemPath(null);
                            form.setFieldValue('expandedItemInfo', {});
                        }
                        // 执行删除操作
                        remove(panelIndex);
                    };

                    return (
                        <Fragment>
                            {/* 分组头部和添加按钮 */}
                            {isShowAdd && (
                                <div className={styles.structureSectionHeader}>
                                    <Button
                                        type='primary'
                                        onClick={() => handleAddGroupPanel(groupField, add, form, setActiveCollapseKeys)}
                                    >
                                        <PlusOutlined style={{ fontSize: '12px' }} />{groupField.addText || 'Add a Structure'}
                                    </Button>
                                </div>)}
                            {/* 分组面板 */}
                            <Collapse
                                accordion={collapseFormConfig.isAccordion}
                                activeKey={activeCollapseKeys}
                                onChange={onCollapseChange}
                                ghost
                                expandIconPosition="end"
                                className={`${styles.workoutDetailsCollapse} ${styles.structureCollapse}`}
                                items={fieldsList.map((field, index) => {
                                    const panelKey = index ? `${groupField.name}_${index}` : groupField.name;
                                    const canDelete = index >= (groupField.systemCount || 0);
                                    return {
                                        key: panelKey,
                                        label: (
                                            <div className={styles.collapseHeader}>
                                                {groupField.icon && <span className={styles.collapseLeftIcon}>{groupField.icon}</span>}
                                                <span>{groupField.label || groupField.title} {index + 1}</span>

                                                {canDelete && (
                                                    <DeleteOutlined
                                                        className={styles.deleteIcon}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleRemovePanel(field.name);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ),
                                        className: `${styles.collapsePanel} ${styles.structureItem}`,
                                        children: (
                                            <div
                                                className={styles.collapsePanelContent}
                                                id={`panel_${panelKey}`}
                                            >
                                                <div className={styles.collapsePanelContentRow}>
                                                    {/* 渲染该分组下的字段 */}
                                                    {groupField.fields?.map((subField, subIndex) => {
                                                        // 修复：name应该是相对于Form.List的路径
                                                        const nestedField = {
                                                            ...subField,
                                                            // 正确的相对路径：[当前项在父数组中的索引, 子字段名]
                                                            // 例如：[0, 'exerciseIdList']
                                                            name: [field.name, subField.name]
                                                        };

                                                        // 如果子字段需要父路径，我们就把它传下去
                                                        // const parentNamePath = subField.needsParentPath
                                                        //     ? [groupField.name, field.name]
                                                        //     : undefined;
                                                        const parentNamePath = [groupField.name, field.name]

                                                        return (
                                                            <div
                                                                className={styles.collapsePanelContentItem}
                                                                style={{
                                                                    width: subField.width || '100%',
                                                                    flex: subField.flex || '',
                                                                }}
                                                                key={`${field.key}-${subField.name || subIndex}`}
                                                            >
                                                                {renderFormItem(nestedField, {
                                                                    form,
                                                                    editId,
                                                                    fields,
                                                                    collapseFormConfig,
                                                                    activeCollapseKeys,
                                                                    formConnected,
                                                                    initialValues,
                                                                    mounted,
                                                                    moduleKey,
                                                                    isCollapse,
                                                                    onDeleteItem,
                                                                    onItemAdded,
                                                                    onCollapseChange,
                                                                    onReplaceItem,
                                                                    onUpdateItem,
                                                                    commonListConfig,
                                                                    onSortItems,
                                                                    onExpandItem,
                                                                    selectedItemFromList,
                                                                    onSelectedItemProcessed,
                                                                    // 在这里把父路径传给下一层
                                                                    parentNamePath,
                                                                    // 将回调传递给子组件
                                                                    onExpanded: setListWithExpandedItemPath,
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    };
                                })}
                            />
                        </Fragment>
                    );
                }}
            </Form.List>
        );
    };

    return (
        <div className={styles.collapseForm}>
            {/* 渲染普通字段 */}
            {renderNormalFields()}
            {/* 渲染分组字段 */}
            {renderGroupFields()}
            {/* 替换弹框 */}
            <Modal
                title={commonListConfig?.title || 'Replace Item'}
                open={replaceModalVisible}
                onCancel={() => setReplaceModalVisible(false)}
                okText="Confirm Replace"
                cancelText="Cancel"
                width="90%"
                styles={{ body: { height: '60vh', width: '100%' } }}
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
            </Modal>
        </div>
    );
};

export default CollapseForm;