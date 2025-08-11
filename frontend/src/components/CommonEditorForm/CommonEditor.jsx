import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { FloatButton, Spin } from 'antd';
import { HeaderContext } from '@/contexts/HeaderContext';
import styles from './style.module.css';
import { useFormState, useHeaderConfig } from './hooks';
import BasicForm from './BasicForm';
import AdvancedForm from './AdvancedForm';
import { getformDataById } from '@/config/api.js';
import dayjs from 'dayjs';
import { dateRangeKeys } from '@/constants/app';

/**
 * 通用编辑器组件 - 主入口
 * 根据formType动态渲染基础表单或高级表单
 * 
 * @param {Object} props 组件属性，详细属性说明见下方参数列表
 */
export default function CommonEditor(props) {
    const {
        formType = 'basic', // 表单类型: 'basic'(基础表单) 或 'advanced'(高级表单)
        config = {},        // 表单全局配置
        id: propId,         // 编辑项ID，覆盖URL中的ID
        initialValues = {}, // 表单初始值
        changeHeader = true,// 是否更新头部按钮
        setFormRef,         // 获取表单引用的函数
        renderFormFooter,   // 自定义表单底部渲染函数
        isDuplicate = false,// 是否为复制模式
        isBack = true,      // 是否显示返回按钮
        collapseFormConfig = { // 折叠表单配置
            isAccordion: true,
            disableDuplicate: false, // 是否可以重复添加数据
        },
        ...restProps        // 其余属性传递给子组件
    } = props;


    // 用于回到顶部功能的引用
    const scrollableContainerRef = useRef(null);

    // 路由和ID处理
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const idFromUrl = params.get('id');
    const duplicate = params.get('isDuplicate') || isDuplicate;
    const id = propId !== undefined ? propId : idFromUrl;
    const [loading, setLoading] = useState(true);

    // 表单状态管理
    const formState = useFormState(initialValues);
    const {
        form,
        formConnected,
        isFormDirty,
        setIsFormDirty,
        messageApi,
        contextHolder,
        getLatestValues
    } = formState;

    // 提交回调管理
    const [onSubmitCallback, setOnSubmitCallback] = useState(null);

    // 头部上下文
    const headerContext = useContext(HeaderContext);

    // 头部配置管理
    const headerConfig = useHeaderConfig({
        config,
        isBack,
        id,
        moduleKey: restProps.moduleKey,
        gutter: restProps.gutter || 30,
        operationName: restProps.operationName,
        onSubmit: onSubmitCallback,
        fieldsToValidate: restProps.fieldsToValidate || ['name'],
        enableDraft: restProps.enableDraft || false,
        isFormDirty,
        form,
        formConnected,
        validate: restProps.validate,
        onSave: restProps.onSave,
        confirmSucess: restProps.confirmSucess,
        navigate,
        messageApi,
        fields: restProps.fields || [],
        formFields: restProps.formFields,
        formType,
        complexConfig: restProps.complexConfig || {},
        collapseFormConfig: collapseFormConfig,
        commonListConfig: restProps.commonListConfig,
        structurePanels: restProps.structurePanels || [],
        headerContext,
        formValidate: restProps.formValidate,
        setIsFormDirty,
        getLatestValues,
        setLoading,
        getDataAfter: restProps.getDataAfter,
        saveBeforeTransform: restProps.saveBeforeTransform
    });
    const { headerButtons, handleStatusModalConfirm, setHeaderButtons } = headerConfig;



    // 设置页面标题和头部按钮
    useEffect(() => {
        // 设置页面标题
        if (headerContext.setCustomPageTitle) {
            const titleOperationName = config.hideTitleOperationName ? '' : id ? 'Edit' : 'Add';
            const pageTitle = config.title ?? `${titleOperationName} ${config.formName}`;
            headerContext.setCustomPageTitle(pageTitle);
        }
        // 设置表单引用ref 用于外部访问表单实例
        if (setFormRef && form && handleStatusModalConfirm) {
            setFormRef({ form, triggerSave: handleStatusModalConfirm });
        }
    }, [
    ]);

    /**
     * 从服务器获取表单数据
     * 用于初始化表单或刷新数据
     */
    const fetchData = async (expandAllCollapseKeys) => {
        setLoading(true);
        let formData = initialValues;

        // 如果id存在，则请求获取数据
        if (id) {
            const module = restProps.moduleKey || location.pathname.split('/')[1]; // 获取模块名称
            const url = `/${module}/detail/${id}`;
            const fetchFormData = restProps.initFormData || getformDataById; // 公共方法--根据id获取表单数据
            const response = await fetchFormData(url) || {};

            if (response.data) {
                if (duplicate) {
                    // 如果是复制，则将数据中的id设置为null
                    response.data.id = null; // 重置id
                    response.data.status = null; // 重置状态
                }

                // 如果有表单字段和设置内部表单字段的函数（高级表单特有）
                // if (formType === 'advanced' && restProps.formFields && restProps.onFormFieldsChange) {
                //     // 递归处理字段映射的辅助函数
                //     const recursiveMapFields = (fields, responseData) => {
                //         return fields.map(field => {
                //             // 处理当前字段的 dataList
                //             if (field.dataList) {
                //                 field.dataList = responseData[field.name];
                //             }

                //             // 如果字段有子字段，递归处理
                //             if (field.fields && Array.isArray(field.fields)) {
                //                 field.fields = recursiveMapFields(field.fields, responseData);
                //             }

                //             return field;
                //         });
                //     };

                //     // 使用递归函数处理所有字段
                //     const allFields = restProps.fields || restProps.formFields;
                //     const updatedFields = recursiveMapFields(allFields, response.data);

                //     // 通知父组件
                //     if (restProps.onFormFieldsChange) {
                //         restProps.onFormFieldsChange(updatedFields, form);
                //     }
                // }
                // 折叠form并且默认展开全部时统一展开折叠面板
                expandAllCollapseKeys && expandAllCollapseKeys(response.data);

                // 获取数据后回调
                if (restProps.getDataAfter) {
                    response.data = restProps.getDataAfter(response.data, {
                        setInternalFormFields: restProps.setInternalFormFields,
                        updatedFields: restProps.fields || restProps.formFields,
                        getActiveCollapseKeys: restProps.getActiveCollapseKeys
                    });
                }
                formData = response.data;

            }
        }
        // 如果id不存在，则根据systemCountField的值初始化表单数据
        let systemCountField = restProps.fields.find(item => item.systemCount);
        if (systemCountField) {
            const systemCountFieldValue = formData[systemCountField.name];
            if (!systemCountFieldValue || systemCountFieldValue.length === 0) {
                formData[systemCountField.name] = Array(systemCountField.systemCount).fill({});
            }
        }

        // 处理日期转换
        if (formType === 'advanced' && formData) {
            formData = transformDatesInObject(formData, restProps.fields || restProps.formFields || []);
        }

        // 设置表单值
        form && form.setFieldsValue(formData || {});

        // 立即执行一次监听
        if (restProps.watchFormFieldChange && typeof restProps.watchFormFieldChange === 'object' && formData) {
            for (const key in restProps.watchFormFieldChange) {
                if (Object.prototype.hasOwnProperty.call(restProps.watchFormFieldChange, key) &&
                    Object.prototype.hasOwnProperty.call(formData, key)) {
                    const callback = restProps.watchFormFieldChange[key];
                    if (typeof callback === 'function') {
                        callback(formData[key], form);
                    }
                }
            }
        }

        // 确保表单值更新后，设置表单状态为"未修改"
        setIsFormDirty(false);

        // 在这里可以添加一个回调函数通知其他组件数据已加载完成
        if (config.onDataLoaded) {
            config.onDataLoaded(formData);
        }

        // 设置头部按钮状态
        if (changeHeader) {
            setHeaderButtons(formData);
        }

        setLoading(false);
    };

    // 转换日期对象
    const transformDatesInObject = (obj = {}, fields = []) => {
        fields.forEach(field => {
            if (field.fields) {
                transformDatesInObject(obj, field.fields);
            }

            if (field.type === 'date' || field.type === 'dateRange') {
                obj[field.name] = obj[field.name] ? dayjs(obj[field.name]) : null;

                if (field.type === 'dateRange') {
                    // 如果是日期范围，则将日期范围转换为dayjs数组
                    const { keys = dateRangeKeys } = field;
                    const startDate = obj[keys[0]] ? dayjs(obj[keys[0]]) : null;
                    const endDate = obj[keys[1]] ? dayjs(obj[keys[1]]) : null;
                    obj[field.name] = [startDate, endDate];
                    obj[keys[0]] = startDate ? dayjs(startDate).format('YYYY-MM-DD HH:mm:ss') : null;
                    obj[keys[1]] = endDate ? dayjs(endDate).format('YYYY-MM-DD HH:mm:ss') : null;
                }
            }
        });

        // 处理具有 dataKey 的结构
        const structure = fields.find(field => field?.dataKey && field.dataKey);
        if (structure && Array.isArray(obj[structure.dataKey])) {
            // 这部分逻辑较复杂，应由子组件处理，此处仅做基础处理
            if (restProps.handleDataKeyStructure) {
                restProps.handleDataKeyStructure(obj, structure);
            }
        }

        return obj;
    };

    // 接收子组件的提交回调
    const handleSubmitCallback = (callback) => {
        setOnSubmitCallback(() => callback);
    };

    // 设置头部按钮状态
    const updateHeaderButtons = (values) => {
        if (changeHeader) {
            setHeaderButtons(values);
        }
    };

    return (
        <div ref={scrollableContainerRef} className={`${styles.commonEditorContainer} ${formType === 'basic' ? styles.basicEditorContainer : styles.advancedEditorContainer}`}
        >
            <div style={{ display: loading ? 'flex' : 'none' }} className={styles.loadingContainer}>
                < Spin spinning={loading}></Spin>
            </div>
            {contextHolder}
            {formType === 'basic' ? (
                <BasicForm
                    {...restProps}
                    id={id}
                    duplicate={duplicate}
                    form={form}
                    config={config}
                    formState={formState}
                    navigate={navigate}
                    loading={loading}
                    setLoading={setLoading}
                    onSubmitCallback={handleSubmitCallback}
                    updateHeaderButtons={updateHeaderButtons}
                    renderFormFooter={renderFormFooter}
                    fetchData={fetchData}
                />
            ) : (
                <AdvancedForm
                    {...restProps}
                    id={id}
                    duplicate={duplicate}
                    form={form}
                    config={config}
                    formState={formState}
                    navigate={navigate}
                    collapseFormConfig={collapseFormConfig}
                    loading={loading}
                    setLoading={setLoading}
                    onSubmitCallback={handleSubmitCallback}
                    updateHeaderButtons={updateHeaderButtons}
                    renderFormFooter={renderFormFooter}
                    fetchData={fetchData}
                />
            )}


            <FloatButton.BackTop target={() => scrollableContainerRef.current} visibilityHeight={50} />
        </div>
    );
} 