import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { optionsConstants } from '@/constants';
import dayjs from 'dayjs';
import { md5Encrypt } from '@/utils';
import { savePublicFormData } from '@/config/api.js';
/**
 * 头部配置管理钩子
 * 处理表单头部区域的按钮和状态管理
 * 
 * @param {Object} params 参数对象
 * @returns {Object} 头部配置和操作方法
 */
const useHeaderConfig = (params) => {
    const {
        setLoading,           // 设置加载状态
        isBack,               // 是否显示返回按钮
        enableDraft = false,  // 是否启用草稿功能
        statusList = optionsConstants.displayEditStatus,     // 状态列表选项
        config,               // 表单配置
        moduleKey,            // 模块标识
        operationName,        // 操作名称
        id,                   // 编辑项ID
        isFormDirty,          // 表单是否被修改
        form,                 // 表单实例
        setActiveCollapseKeys,// 设置激活的折叠面板
        isCollapse,           // 是否使用折叠面板
        formConnected,        // 表单是否已连接
        validate,             // 验证函数
        onSave,               // 保存回调
        confirmSucess,        // 确认成功
        navigate,             // 导航函数
        messageApi,           // 消息API
        fields,               // 字段配置
        formFields,           // 表单字段配置
        formType,             // 表单类型
        complexConfig,        // 复杂表单配置
        structurePanels,      // 结构面板配置
        headerContext,        // 头部上下文
        formValidate,         // 表单验证函数
        setIsFormDirty,       // 设置表单修改状态
        fieldsToValidate,     // 需要验证的字段
        getLatestValues,      // 获取最新表单值
        initialValues = {},   // 初始值
        getDataAfter,         // 获取数据后处理
        saveBeforeTransform   // 保存前数据处理
    } = params;
    const location = useLocation();

    // 存储最新的字段配置
    const collapseFormConfigRef = useRef(fields);
    useEffect(() => {
        collapseFormConfigRef.current = fields || formFields;
    }, [fields]);

    // 状态选择弹框状态
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState(null);

    // 头部按钮状态
    const [buttons, setButtons] = useState([]);

    /**
     * 滚动到表单中第一个错误字段的位置
     * @param {Object} errorInfo - 表单验证错误信息
     * @returns {Promise|void} - 返回滚动操作的Promise或无返回
     */
    const scrollToFirstError = (errorInfo) => {
        if (errorInfo && errorInfo.errorFields && errorInfo.errorFields.length > 0) {
            // 获取第一个错误字段名
            const firstFieldName = errorInfo.errorFields[0].name[0];

            // 先尝试找上传组件元素
            const uploadElement = document.getElementById(firstFieldName);
            if (uploadElement) {
                // 直接滚动到上传组件
                uploadElement.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth',
                });
                return Promise.resolve();
            }

            // 使用表单实例的scrollToField方法滚动到错误字段位置
            return form.scrollToField(firstFieldName, {
                block: 'center',
                behavior: 'smooth',
            });
        }
        return Promise.resolve();
    };

    /**
     * 处理高级表单的结构面板
     * @param {Object} dataToSave - 要保存的数据
     */
    const processStructurePanels = (dataToSave) => {
        if (!structurePanels) return;

        structurePanels.forEach((panel, panelIndex) => {
            if (!panel.items || panel.items.length === 0) return;

            const panelData = panel.items.map(item => {
                const itemData = {};
                if (item.fields) {
                    item.fields.forEach(field => {
                        const fieldName = `${panel.dataKey}_${panelIndex}_${field.name}`;
                        itemData[field.name] = dataToSave[fieldName];
                        // 删除临时字段
                        delete dataToSave[fieldName];
                    });
                }
                return itemData;
            });

            // 保存面板数据到指定键
            if (panel.dataKey) {
                dataToSave[panel.dataKey] = panelData;
            }
        });
    };

    /**
     * 递归格式化所有类型为 date 或 dateRange 的字段
     * @param {Array} fields 字段配置数组
     * @param {Object} values 表单数据对象
     * @param {String} dateFormat 日期格式，默认 'YYYY-MM-DD HH:mm:ss'
     */
    const formatDateFieldsRecursively = (fields, values, dateFormat = 'YYYY-MM-DD HH:mm:ss') => {
        fields.forEach(field => {
            // 处理 date 类型
            if (field.type === 'date' || field.type === 'datepicker') {
                const value = values[field.name];
                if (value) {
                    // 格式化 date 字段
                    values[field.name] = dayjs(value).format(dateFormat);
                }
            }
            // 处理 dateRange 类型
            if (field.type === 'dateRange') {
                const value = values[field.name];
                const format = field.props?.format || dateFormat;
                if (Array.isArray(value) && value.length === 2) {
                    // 如果有 keys，则分别赋值
                    if (field.keys && Array.isArray(field.keys)) {
                        values[field.keys[0]] = dayjs(value[0]).format(format);
                        values[field.keys[1]] = dayjs(value[1]).format(format);
                        delete values[field.name];
                    }
                }
            }
            // 递归处理嵌套字段
            if (Array.isArray(field.fields)) {
                formatDateFieldsRecursively(field.fields, values, dateFormat);
            }
            return values;
        });
    };
    /**
     * 处理表单字段和验证
     * @param {Array} fields - 字段配置数组
     * @param {Object} dataToSave - 要保存的数据
     * @param {Object} parent - 父字段对象
     */
    const processFields = (fields = [], dataToSave = {}, parent = null) => {
        for (const field of fields) {
            const value = dataToSave[field.name];
            const isRequired = formType === 'advanced' && isCollapse && field.required;
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

                    // 滚动到错误字段位置
                    if (field.name) {
                        // 返回Promise，但不等待，因为随后会抛出错误
                        return form.scrollToField(field.name, {
                            block: 'center',
                            behavior: 'smooth',
                        });
                    }

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

                // 滚动到错误字段位置
                if (field.name) {
                    // 返回Promise，但不等待，因为随后会抛出错误
                    return form.scrollToField(field.name, {
                        block: 'center',
                        behavior: 'smooth',
                    });
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

            // 处理结构列表类型字段
            if (field.type === 'structureList') {
                if (field.formterList && typeof field.formterList === 'function') {
                    const formValues = form.getFieldsValue();
                    dataToSave[field.name] = field.formterList(field.dataList, formValues);
                } else {
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

    /**
     * 处理表单数据中的特殊字段（密码、日期、开关等）
     * @param {Object} dataToSave - 要保存的数据
     * @param {Array} formConfig - 表单配置
     */
    const processFormDataFields = (dataToSave, formConfig) => {
        // 处理密码字段--加密
        const passwordField = formConfig.find(field => field.type === 'password');
        if (passwordField && dataToSave[passwordField.name]) {
            // 如果是掩码密码，则置为null不更新；否则加密处理
            dataToSave[passwordField.name] = dataToSave[passwordField.name].includes('****')
                ? null
                : md5Encrypt(dataToSave[passwordField.name]);
        }

        // 处理日期字段
        formatDateFieldsRecursively(formConfig, dataToSave);

        // 处理switch值（转换为0/1）
        const switchFields = formConfig.filter(field => field.type === 'switch');
        switchFields.forEach(field => {
            if (field.name in dataToSave) {
                dataToSave[field.name] = dataToSave[field.name] ? 1 : 0;
            }
        });


        return dataToSave;
    };

    /**
     * 执行保存操作
     * @param {Object} dataToSave - 要保存的数据
     * @returns {Promise<Object>} - 保存操作的结果
     */
    const executeSave = async (dataToSave) => {
        setLoading(true);
        let ret = null;
        // 调用自定义保存函数或使用默认保存逻辑
        if (onSave) {
            ret = await onSave(dataToSave);
        } else {
            // 构建API路径
            const module = moduleKey || location.pathname.split('/')[1];
            const systemList = ['user']; // 系统级别操作对应update/add，业务层操作对应save
            const isSystem = systemList.includes(module);
            const operation = operationName || (isSystem ? id ? 'update' : 'add' : 'save');
            const apiUrl = `/${module}/${operation}`;

            // 调用API保存数据
            ret = await savePublicFormData(dataToSave, apiUrl, 'post');
        }

        // 处理成功回调
        if (confirmSucess) {
            confirmSucess(ret);
        }
        setLoading(false);
        return ret;

    };
    /**
     * 处理表单提交和状态选择
     * @param {number|string} status - 可选的状态值
     * @returns {Promise<Object>} - 保存操作的结果
     */
    const handleStatusModalConfirm = async (status = 'ENABLED', load = true) => {
        // 获取表单数据
        const formDatas = form.getFieldsValue(true);
        let dataToSave = { ...formDatas };
        dataToSave.status = status;
        // console.log(dataToSave);
        // return
        let validateResult = true;
        // 表单验证-草稿时只验证必填项name,其他状态全验证
        try {
            if (status === 'DRAFT' && fieldsToValidate) {
                await form.validateFields(fieldsToValidate);
            } else {
                await form.validateFields();
            }
        } catch (errorInfo) {
            // 移除调试语句
            // 表单验证失败时，滚动到第一个错误字段位置
            scrollToFirstError(errorInfo);
            return Promise.reject(errorInfo);
        }

        // 执行外部自定义表单验证
        if (formValidate) {
            validateResult = formValidate({
                formValues: dataToSave,
                setActiveCollapseKeys,
                formFields: collapseFormConfigRef.current,
            });

            // 如果验证失败，尝试找到错误字段并滚动
            if (!validateResult && validateResult.errorFields) {
                scrollToFirstError(validateResult);
            }
        }
        //antd表单验证
        if (!validateResult) return



        // 处理高级表单的结构面板
        if (formType === 'advanced' && structurePanels && structurePanels.length > 0) {
            processStructurePanels(dataToSave);
        }
        if (dataToSave.status == 'DRAFT') {
            if (dataToSave.newStartTime && dataToSave.newEndTime) {
                dataToSave.newStartTime = dayjs(dataToSave?.newStartTime, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
                dataToSave.newEndTime = dayjs(dataToSave?.newEndTime, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
            }

        }
        console.log(dataToSave);

        // 处理表单特殊字段
        processFormDataFields(dataToSave, collapseFormConfigRef.current);
        // 外部自定义数据转换
        if (saveBeforeTransform) {
            saveBeforeTransform({ formValues: dataToSave, formFields: collapseFormConfigRef.current, form });
        }
        //执行form数据保存
        try {
            const saveResult = await executeSave(dataToSave);
            if (saveResult.success) {
                if (load) {
                    messageApi.success(saveResult.message || 'Save successful!');
                }
                setIsFormDirty(false);
                if (isBack) {
                    navigate(config.afterSaveUrl || -1);
                }
                return Promise.resolve(saveResult);
            } else {
                messageApi.error(saveResult.errMessage || 'Save failed!');
                return Promise.reject(saveResult);
            }
        } catch (error) {
            messageApi.error(error?.message || 'Save failed!');
            return Promise.reject(error);
        }
    };

    /**
     * 取消状态选择弹窗
     */
    const handleStatusModalCancel = () => {
        setIsStatusModalVisible(false);
        setPendingSaveData(null);
    };
    /**
     * 根据表单数据状态过滤可用的状态列表
     * @param {string} status - 表单数据状态
     * @returns {Array} 过滤后的状态列表
     */
    const getVisibleStatusListByStatus = (status) => {
        let filteredStatusList = [];
        switch (status) {
            case 'DISABLED':
                filteredStatusList = statusList.filter(status => status.value !== 'DRAFT');
                break;
            case 'ENABLED':
                filteredStatusList = statusList.filter(status => status.value === 'ENABLED');
                break;
            default:
                filteredStatusList = statusList;
        }
        return filteredStatusList;
    };

    /**
     * 设置头部按钮
     * @param {Object} data - 表单数据
     */
    const setHeaderButtons = (data = {}) => {
        const buildButtons = () => {
            const buttons = [];

            // 添加返回按钮
            if (isBack) {
                buttons.push({
                    key: 'back',
                    text: 'Back',
                    icon: 'ArrowLeftOutlined',
                    onClick: () => navigate(-1)
                });
            }

            // 添加保存按钮
            buttons.push({
                key: 'save',
                text: 'Save',
                type: 'primary',
                icon: 'SaveOutlined',
                onClick: () => handleStatusModalConfirm(),
                disabled: !isFormDirty && id !== null
            });

            return buttons;
        };

        // 构建和设置按钮
        let newButtons = config.headerButtons || buildButtons();

        // 自定义按钮行为
        if (newButtons) {
            newButtons.forEach(button => {
                if (button.key === 'save') {
                    button.onClick = () => handleStatusModalConfirm();
                    button.disabled = false;
                    if (enableDraft) {
                        button.statusModalProps = {
                            visible: isStatusModalVisible,
                            statusList: getVisibleStatusListByStatus(data?.status || form?.getFieldValue('status') || initialValues?.status), // 获取最新状态值
                            onConfirm: handleStatusModalConfirm,
                            onCancel: handleStatusModalCancel
                        };
                    }
                }
            });
        }

        setButtons(newButtons);

        // 更新头部上下文
        if (headerContext.setButtons) {
            headerContext.setButtons(newButtons);
        }
    };


    return {
        headerButtons: buttons,
        setHeaderButtons,
        handleStatusModalConfirm,
        isStatusModalVisible,
        handleStatusModalCancel,
        scrollToFirstError,
    };
};

export default useHeaderConfig; 