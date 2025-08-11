import React, { useEffect } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import styles from './style.module.css';
import { renderBasicForm } from './FormFields';
// 移除 getformDataById 导入，现在由父组件处理
// import { getformDataById } from '@/config/api.js';
import { dateRangeKeys } from '@/constants/app';

/**
 * 基础表单组件
 * 处理简单表单布局和数据获取/提交逻辑
 * 
 * @param {Object} props 组件属性
 */
const BasicForm = (props) => {
    const {
        // 从父组件传递的属性
        id,                     // 编辑项ID
        duplicate,              // 是否为复制模式
        form,                   // 表单实例
        formState,              // 表单状态
        navigate,               // 路由导航函数
        loading,                // 加载状态
        setLoading,             // 设置加载状态
        onSubmitCallback,       // 提交回调
        updateHeaderButtons,    // 更新头部按钮
        renderFormFooter,       // 渲染表单底部
        fetchData,              // 从父组件接收的获取数据函数

        // 组件自身的属性
        config = {},            // 表单配置
        fields = [],            // 字段配置
        style = {},             // 表单样式
        moduleKey,              // 模块标识
        operationName,          // 操作名称
        gutter = 30,            // 间距
        initialValues = {},     // 初始值
        onSave,                 // 保存回调
        validate,               // 验证函数
        initFormData,           // 自定义数据获取函数
        getDataAfter,           // 数据获取后处理
        saveBeforeTransform,    // 保存前数据处理
        onFormValuesChange,     // 表单值变更回调
        watchFormFieldChange,

        layoutLeftConfig = {},
        layoutRightConfig = {},
    } = props;
    // 从formState获取状态和方法
    const {
        formConnected,
        isFormDirty,
        setIsFormDirty,
        messageApi,
        mounted
    } = formState;

    /**
     * 处理表单提交
     * @param {Object} values - 表单值
     */
    const handleEditorSubmit = (values) => {
        const submitAction = async (values) => {
            try {
                // 执行表单验证
                await form.validateFields();

                // 执行自定义验证
                if (validate && !validate(values, form)) {
                    return;
                }

                // 获取表单数据
                const dataToSave = form.getFieldsValue(true);

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
                } else {
                    messageApi.error('表单验证失败，请检查填写内容');
                }
            }
        };

        // 将提交函数传递给父组件
        onSubmitCallback(submitAction);
    };

    /**
     * 处理表单值变更
     * @param {Object} changedValues - 变更的值
     * @param {Object} allValues - 所有值
     */
    const handleFormValuesChange = (changedValues, allValues) => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }

        // 执行自定义表单变更处理器
        if (config.onFormChange) {
            config.onFormChange(changedValues, allValues, formConnected ? form : null);
        }

        // 调用父组件传入的回调函数
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


    // 初始化表单数据
    useEffect(() => {
        // 使用父组件传入的 fetchData 函数获取数据
        fetchData && fetchData();
    }, []);

    const rightFields = fields.filter(field => field.layoutRegion === 'right');
    const leftFields = fields.filter(field => field.layoutRegion === 'left' || !field.layoutRegion);
    console.log(config);

    // 渲染表单
    return (
        <div className={styles.basicEditorForm} style={
            config.style || {}
        }>
            {config.title && <div className={styles.title}>{config.title}</div>}
            < Form
                form={form}
                scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
                name={config.formName || 'basicForm'}
                layout={config.layout || 'vertical'}
                onValuesChange={handleFormValuesChange}
                onFinish={handleEditorSubmit}
                initialValues={initialValues}
                className={`${styles.form} ${styles.basicFormContent}`}
                style={
                    {
                        ...(rightFields.length > 0 ? {
                            gridTemplateColumns: '3fr 2fr'
                        } : {
                            gridTemplateColumns: '1fr'
                        }),
                        ...style
                    }}
            >
                {/* 左侧表单区域 */}
                < div className={styles.basicFormContentLeft} style={layoutLeftConfig?.style || {}}>
                    {layoutLeftConfig?.title && (
                        <div className={styles.title} style={{ marginLeft: '0px' }}>
                            {layoutLeftConfig.title}
                        </div>
                    )}
                    {
                        renderBasicForm(leftFields, {
                            form,
                            editId: id,
                            moduleKey,
                            operationName,
                            gutter,
                            formConnected,
                            initialValues,
                            oneColumnKeys: config.oneColumnKeys || [],
                            mounted,
                        })
                    }
                </div >

                {/* 右侧表单区域 (如果存在) */}
                {
                    fields.filter(field => field.layoutRegion === 'right')?.length > 0 && (
                        <div style={layoutRightConfig?.style || {}} className={styles.basicFormContentRight}>
                            <div className={styles.title} style={{ marginLeft: '0' }}>
                                {layoutRightConfig?.title || ''}
                            </div>
                            {renderBasicForm(rightFields, {
                                form,
                                editId: id,
                                moduleKey,
                                operationName,
                                gutter,
                                formConnected,
                                initialValues,
                                oneColumnKeys: config.oneColumnKeys || [],
                                mounted,
                            })}
                        </div>
                    )
                }
            </Form >

            {renderFormFooter && renderFormFooter()}
        </div >
    );
};

export default BasicForm; 