import React, { useEffect, useState, useMemo } from 'react';
import { Form, Card, Button, Space, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './style.module.css';

import { renderPanelFields, renderBasicForm } from './FormFields';
import CollapseForm from './CollapseForm';
import CommonList from './CommonList';
import useFormFields from './hooks/useFormFields';

/**
 * 高级表单组件
 * 处理复杂表单布局和数据逻辑
 */
const AdvancedForm = (props) => {
    const {
        // 从父组件传递的属性
        id,
        duplicate,
        form,
        formState,
        navigate,
        loading,
        setLoading,
        onSubmitCallback,
        updateHeaderButtons,
        renderFormFooter,
        fetchData, // 从父组件接收 fetchData 函数

        // 组件自身的属性
        config = {},
        fields = [],
        formFields,
        style = {},
        moduleKey,
        operationName,
        gutter = 30,
        initialValues = {},
        onSave,
        validate,
        initFormData,
        getDataAfter,
        onFormValuesChange,
        isCollapse = true,

        // 布局配置
        layoutGroupConfig = {
            style: {
                maxWidth: '100%',
            }
        },
        // 其他配置
        commonListConfig = null,
        complexConfig = {},
        collapseFormConfig,
        renderItemMata,
        onFormFieldsChange = null,
        onCollapseChange = null,
        watchFormFieldChange,
    } = props;

    const {
        formConnected,
        isFormDirty,
        setIsFormDirty,
        messageApi,
        mounted
    } = formState;

    // 使用自定义Hook管理表单字段状态
    const {
        internalFormFields,
        setInternalFormFields,
        activeCollapseKeys,
        setActiveCollapseKeys,
        getActiveCollapseKeys,
        selectedItemFromList,
        setSelectedItemFromList,
        dataListPanels,
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
    } = useFormFields({
        initialFields: collapseFormConfig?.fields || formFields || fields || [],
        form,
        onFormFieldsChange,
        onCollapseChange,
        collapseFormConfig
    });
    // 复杂表单特定状态
    const [structurePanels, setStructurePanels] = useState(
        complexConfig.structurePanels || []
    );

    // 处理表单字段和自定义表单验证
    const processFields = (fields = [], dataToSave = {}, parent = null) => {
        for (const field of fields) {
            const value = dataToSave[field.name];
            const isRequired = field.required;
            const isStructureList = field.type === 'structureList';
            const isInvalid = isRequired && (
                (isStructureList && field.dataList && field.dataList.length === 0) ||
                (!isStructureList && (value === undefined || value === null || value === ''))
            );

            // 校验必填项
            if (isInvalid) {
                if (setActiveCollapseKeys && parent && parent.name) {
                    setActiveCollapseKeys([parent.name]);
                    const ruleMessage = field.rules?.find(rule => !!rule?.required)?.message;
                    const fallbackMessage = `请至少添加一个${field.label || '项目'}`;

                    throw new Error(
                        JSON.stringify({
                            errorFields: [{
                                type: 'notification',
                                message: `无法添加新的【${field.label || '未命名'}】`,
                                description: ruleMessage || fallbackMessage,
                            }]
                        })
                    );
                }

                // 抛出标准表单校验错误
                throw new Error(
                    JSON.stringify({
                        errorFields: [{
                            name: [field.name],
                            errors: [`${field.label}是必填项`]
                        }]
                    })
                );
            }

            // 处理 structureList 类型字段
            if (field.type === 'structureList') {
                // 如果有 formterList 函数，使用它来转换数据
                if (field.formterList && typeof field.formterList === 'function') {
                    const formValues = form.getFieldsValue();
                    dataToSave[field.name] = field.formterList(field.dataList, formValues);
                } else {
                    // 否则直接使用 dataList
                    dataToSave[field.name] = field.dataList;
                }
            }

            // 处理日期范围字段
            if (field.type === 'dateRange') {
                const date = form.getFieldValue(field.name);
                const format = field.props?.format || 'YYYY-MM-DD HH:mm:ss';

                if (date && date.length === 2 && typeof date[0]?.format === 'function') {
                    if (field.keys && Array.isArray(field.keys)) {
                        dataToSave[field.keys[0]] = date[0].format(format);
                        dataToSave[field.keys[1]] = date[1].format(format);
                        delete dataToSave[field.name];
                    } else {
                        dataToSave[field.name] = [
                            date[0].format(format),
                            date[1].format(format)
                        ];
                    }
                } else {
                    if (field.keys && Array.isArray(field.keys)) {
                        dataToSave[field.keys[0]] = null;
                        dataToSave[field.keys[1]] = null;
                        delete dataToSave[field.name];
                    }
                }
            }

            // 处理单个日期字段
            if ((field.type === 'date' || field.type === 'datepicker') && value?.format) {
                dataToSave[field.name] = value.format('YYYY-MM-DD');
            }

            // 递归处理嵌套字段
            if (Array.isArray(field.fields)) {
                processFields(field.fields, dataToSave, field);
            }
        }
    };

    // 处理表单提交
    const handleEditorSubmit = (values) => {
        const submitAction = async (values) => {
            try {
                // 执行表单验证
                await form.validateFields();

                // 如果有自定义验证函数，执行它
                if (validate && !validate(values, form)) {
                    return;
                }

                // 获取表单数据
                const dataToSave = form.getFieldsValue(true);

                // 如果是折叠面板，处理特殊字段
                if (isCollapse && internalFormFields) {
                    processFields(internalFormFields, dataToSave);
                }

                // 执行保存操作
                if (onSave) {
                    const editId = id;
                    const callbackUtils = {
                        setDirty: setIsFormDirty,
                        messageApi,
                        navigate
                    };
                    onSave(dataToSave, editId, callbackUtils);
                } else {
                    messageApi.success(config.saveSuccessMessage || '保存成功!');
                    setIsFormDirty(false);

                    if (config.navigateAfterSave) {
                        navigate(config.afterSaveUrl || -1);
                    }
                }
            } catch (error) {
                // 处理验证错误
                console.error('表单验证失败:', error);
                if (error.errorFields) {
                    // 显示第一个错误信息
                    messageApi.error(error.errorFields[0]?.errors?.[0] || '请检查表单填写是否正确');

                    // 如果是折叠面板，展开包含错误字段的面板
                    if (isCollapse && setActiveCollapseKeys) {
                        const errorFieldName = error.errorFields[0]?.name?.[0];
                        const matchedPanel = internalFormFields.find(panel =>
                            Array.isArray(panel.fields) &&
                            panel.fields.some(field => field.name === errorFieldName)
                        );

                        if (matchedPanel) {
                            setActiveCollapseKeys([matchedPanel.name]);
                        }
                    }
                } else {
                    messageApi.error('表单验证失败，请检查填写内容');
                }
            }
        };

        // 将提交函数传递给父组件
        onSubmitCallback(submitAction);
    };

    // 表单变更处理函数
    const handleFormValuesChange = (changedValues, allValues) => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }

        // 执行自定义表单变更处理器
        if (config.onFormChange) {
            config.onFormChange(changedValues, allValues, formConnected ? form : null);
        }

        // 调用父组件传入的回调函数，并传递 form 对象
        if (onFormValuesChange) {
            onFormValuesChange(changedValues, allValues, form);
        }
        // 监测特定字段变化
        if (watchFormFieldChange) {
            if (typeof watchFormFieldChange === 'function') {
                watchFormFieldChange(changedValues, form);
            } else if (typeof watchFormFieldChange === 'object') {
                for (const key in changedValues) {
                    if (Object.prototype.hasOwnProperty.call(watchFormFieldChange, key)) {
                        const callback = watchFormFieldChange[key];
                        if (typeof callback === 'function') {
                            callback(changedValues[key], form);
                        }
                    }
                }
            }
        }
    };

    // 左侧列表添加item - 在组件内部处理选中项
    const handleCommonListItemAdd = (item) => {
        setSelectedItemFromList(item);

        // 如果传入了外部回调函数，也调用它
        if (commonListConfig && commonListConfig.onSelectItem && typeof commonListConfig.onSelectItem === 'function') {
            commonListConfig.onSelectItem(item);
        }
    };

    // 清空选中项的回调函数 - 项目添加到表单后调用
    const handleSelectedItemProcessed = () => {
        setSelectedItemFromList(null);

        // 如果传入了外部回调函数，也调用它
        if (collapseFormConfig.onSelectedItemProcessed && typeof collapseFormConfig.onSelectedItemProcessed === 'function') {
            collapseFormConfig.onSelectedItemProcessed();
        }
    };

    // 处理添加项目的函数
    const handleAddItem = (panelIndex) => {
        const panel = structurePanels[panelIndex];
        if (!panel) return;

        const newItems = [...(panel.items || [])];
        const template = panel.itemTemplate || { title: `New Item ${newItems.length + 1}`, fields: [] };

        newItems.push({ ...template });

        const newPanels = [...structurePanels];
        newPanels[panelIndex] = { ...panel, items: newItems };

        // 更新面板状态
        setStructurePanels(newPanels);
    };

    // 处理移除项目的函数
    const handleRemoveItem = (panelIndex, itemIndex) => {
        const panel = structurePanels[panelIndex];
        if (!panel || !panel.items || !panel.items[itemIndex]) return;

        const newItems = [...panel.items];
        newItems.splice(itemIndex, 1);

        const newPanels = [...structurePanels];
        newPanels[panelIndex] = { ...panel, items: newItems };

        // 更新面板状态
        setStructurePanels(newPanels);

        // 如果存在外部结构面板变更处理器，调用它
        if (complexConfig.onStructurePanelsChange) {
            complexConfig.onStructurePanelsChange(newPanels);
        }
    };
    /**
     * 折叠form并且默认展开全部时统一展开折叠面板
     * @param {Object} data 数据
     */
    const expandAllCollapseKeys = (data = {}) => {
        const listInfo = fields.find(field => field.isGroup);
        const list = data?.[listInfo?.name] || [];
        // 如果列表信息存在，并且是折叠状态，并且有激活的折叠键，并且有设置激活折叠键的函数，并且列表存在，并且列表长度大于0，则设置激活折叠键
        if (activeCollapseKeys && setActiveCollapseKeys && list && list.length > 0) {
            let newActiveCollapseKeys = [];
            list.forEach((item, index) => {
                newActiveCollapseKeys.push(index ? `${listInfo.name}_${index}` : listInfo.name);
            });
            newActiveCollapseKeys = [...activeCollapseKeys, ...newActiveCollapseKeys];
            setActiveCollapseKeys([...new Set([...activeCollapseKeys, ...newActiveCollapseKeys])]); // 使用Set去重
        }
    }

    // 初始化表单数据
    useEffect(() => {
        let expandFn = null;
        // 折叠form并且默认展开全部时统一展开折叠面板
        if (isCollapse && collapseFormConfig.defaultActiveKeys == 'all') {
            expandFn = expandAllCollapseKeys;
        }
        // 使用父组件传入的 fetchData 函数获取数据
        fetchData && fetchData(expandFn);

    }, []);

    // 渲染结构面板
    const renderStructurePanels = () => {
        if (!complexConfig.includeStructurePanels || !structurePanels || structurePanels.length === 0) {
            return null;
        }

        return (
            <div className={styles.structurePanelsContainer}>
                {structurePanels.map((panel, panelIndex) => {
                    const panelItems = panel.items || [];

                    return (
                        <Card
                            key={`panel-${panelIndex}`}
                            title={panel.title}
                            className={styles.structurePanel}
                            extra={
                                <Space>
                                    {complexConfig.allowAddRemoveItems && (
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => handleAddItem(panelIndex)}
                                        >
                                            添加项目
                                        </Button>
                                    )}
                                </Space>
                            }
                        >
                            {panelItems.map((item, itemIndex) => (
                                <div key={`item-${panelIndex}-${itemIndex}`}>
                                    <div className={styles.itemHeader}>
                                        <h4>{item.title || `项目 ${itemIndex + 1}`}</h4>
                                        {complexConfig.allowAddRemoveItems && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveItem(panelIndex, itemIndex)}
                                            >
                                                移除
                                            </Button>
                                        )}
                                    </div>
                                    <div className={styles.itemFields}>
                                        {renderPanelFields(panel, panelIndex, item, itemIndex, {
                                            form,
                                            formConnected,
                                            initialValues,
                                            mounted
                                        })}
                                    </div>
                                </div>
                            ))}
                        </Card>
                    );
                })}
            </div>
        );
    };
    // 渲染高级表单内容
    return (
        <div className={`${styles.advancedFormContent} ${commonListConfig ? '' : styles.collapseFormContent}`}>
            {/* 渲染右侧表单 isCollapse 是否按照折叠方式展示 */}
            {isCollapse ? (
                <div className={`${styles.advancedEditorForm} ${commonListConfig ? '' : styles.withSidebar} `}>
                    {config.title && <div className={styles.title}>{config.title}</div>}
                    <Form
                        form={form}
                        scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
                        name={config.formName || 'advancedForm'}
                        layout={config.layout || 'vertical'}
                        onValuesChange={handleFormValuesChange}
                        onFinish={handleEditorSubmit}
                        initialValues={initialValues}
                        className={styles.form}
                    >
                        {/* 如果提供了折叠表单配置，则渲染CollapseForm组件 */}
                        {(internalFormFields && internalFormFields.length > 0) && (
                            <CollapseForm
                                editId={id}
                                setActiveCollapseKeys={setActiveCollapseKeys}
                                fields={internalFormFields}
                                form={form}
                                moduleKey={moduleKey}
                                gutter={gutter}
                                collapseFormConfig={collapseFormConfig}
                                operationName={operationName}
                                renderItemMata={renderItemMata}
                                commonListConfig={commonListConfig}
                                selectedItemFromList={selectedItemFromList}
                                activeCollapseKeys={activeCollapseKeys}
                                onCollapseChange={handleCollapseChange}
                                handleAddCustomPanel={handleAddCustomPanel}
                                handleDeletePanel={handleDeletePanel}
                                isCollapse={true}
                                // 添加回调函数
                                onItemAdded={handleItemAdded}
                                onSelectedItemProcessed={handleSelectedItemProcessed}
                                // 添加排序相关的回调函数
                                onSortItems={handleSortItems}
                                onExpandItem={handleExpandItem}
                                onDeleteItem={handleDeleteItem}
                                onCopyItem={handleCopyItem}
                                onUpdateItem={handleUpdateItem}
                                onReplaceItem={handleReplaceItem}
                                onIconChange={handleIconChange}
                            />
                        )}
                        {/* 如果配置了结构面板，则渲染结构面板 */}
                        {complexConfig.includeStructurePanels && renderStructurePanels()}
                    </Form>
                    {renderFormFooter && renderFormFooter()}
                </div>
            ) : (
                <div className={styles.advancedBasicBox}>
                    {/* 当isCollapse为false时，使用基础表单布局 */}
                    <div className={styles.basicEditorForm} style={layoutGroupConfig?.style || {}}>
                        {config.title && <div className={styles.title}>{config.title}</div>}
                        <Form
                            form={form}
                            scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
                            name={config.formName || 'basicForm'}
                            layout={config.layout || 'vertical'}
                            onValuesChange={handleFormValuesChange}
                            onFinish={handleEditorSubmit}
                            initialValues={initialValues}
                            className={`${styles.form} ${styles.basicFormContent}`}
                            style={{
                                gridTemplateColumns: '1fr',
                                ...style,

                            }}
                        >
                            <div className={styles.basicFormContentLeft}>
                                {renderBasicForm(fields.filter(field => !field.layoutRegion || field.layoutRegion === 'left'), {
                                    form,
                                    editId: id,
                                    moduleKey,
                                    operationName,
                                    gutter,
                                    collapseFormConfig,
                                    selectedItemFromList,
                                    onSelectedItemProcessed: handleSelectedItemProcessed,
                                    onItemAdded: handleItemAdded,
                                    onReplaceItem: handleReplaceItem,
                                    onIconChange: handleIconChange,
                                    onCopyItem: handleCopyItem,
                                    onSortItems: handleSortItems,
                                    onExpandItem: handleExpandItem,
                                    onUpdateItem: handleUpdateItem,
                                    onDeleteItem: handleDeleteItem,
                                    commonListConfig: commonListConfig,
                                    formConnected,
                                    initialValues,
                                    oneColumnKeys: config.oneColumnKeys || [],
                                    mounted,
                                })}
                            </div>
                        </Form>
                        {renderFormFooter && renderFormFooter()}
                    </div>
                </div>
            )}

            {/* 渲染左侧列表 */}
            {commonListConfig && (
                <CommonList
                    renderItemMata={renderItemMata}
                    {...commonListConfig}
                    onAddItem={handleCommonListItemAdd}
                />
            )}
        </div>
    );
};

export default AdvancedForm; 