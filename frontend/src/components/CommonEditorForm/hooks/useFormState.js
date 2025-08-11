import { Form, message } from 'antd';
import { useEffect, useRef, useState, useMemo } from 'react';

/**
 * 表单状态管理钩子
 * 处理表单初始化、状态跟踪和值缓存
 * 
 * @param {Object} initialValues 表单初始值
 * @returns {Object} 表单状态和操作方法
 */
const useFormState = (initialValues = {}) => {
    // 创建表单实例
    const [form] = Form.useForm();

    // 表单状态
    const [formConnected, setFormConnected] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // 表单初始值的缓存
    const formValues = useMemo(() => ({ ...initialValues }), [initialValues]);
    // 状态引用
    const initialValuesRef = useRef(initialValues);
    const mounted = useRef(false);
    const initialized = useRef(false);

    // 更新初始值
    useEffect(() => {
        initialValuesRef.current = { ...initialValues };

        // 只有表单连接后才设置值
        if (form && formConnected && Object.keys(initialValues).length > 0) {
            form.resetFields();
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form, formConnected]);

    // 监控表单实例状态
    useEffect(() => {
        if (form && typeof form.getFieldsValue === 'function') {
            setFormConnected(true);
            mounted.current = true;

            // 标记表单为已初始化
            if (!form._init) {
                form._init = true;
            }

            // 设置初始值
            // if (Object.keys(initialValues).length > 0 && !initialized.current) {
            //     initialized.current = true;
            //     form.setFieldsValue(initialValues);
            // }
        }

        return () => {
            mounted.current = false;
        };
    }, [form, initialValues]);

    /**
     * 获取最新的表单值
     * @returns {Object} 表单当前值
     */
    const getLatestValues = () => {
        if (form && formConnected) {
            return form.getFieldsValue(true);
        }
        return formValues;
    };

    return {
        form,
        formConnected,
        isFormDirty,
        setIsFormDirty,
        formValues,
        messageApi,
        contextHolder,
        mounted,
        getLatestValues
    };
};

export default useFormState; 