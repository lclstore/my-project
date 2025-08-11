import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getMediaDurationByUrl, formatDate, getFileCategoryFromUrl } from '@/utils';
import { useLocation } from 'react-router';
import { optionsConstants } from '@/constants/options';
import { List, Avatar, Typography } from 'antd';
import {
    Input,
    DatePicker,
    Form,
    Switch,
    Divider,
    Row,
    Col,
    Image,
    Select,
    Button
} from 'antd';
import {
    EyeOutlined,
    EyeInvisibleOutlined,
    EditOutlined,
    PauseOutlined,
    CaretRightOutlined
} from '@ant-design/icons';
import FormLabel from '@/components/FormLabel/FormLabel';//表单标签组件
import FileUpload from '@/components/FileUpload/FileUpload';//文件上传组件
import NumberStepper from '@/components/NumberStepper/NumberStepper';//数字步进器组件
import TagSelector from '@/components/TagSelector/TagSelector';//标签选择器组件
import DynamicFormList from '@/components/CommonEditorForm/DynamicFormList';//动态表单列表组件
import DynamicTableList from '@/components/CommonEditorForm/DynamicTableList';//动态表格列表组件
import styles from './style.module.css';
import { useStore } from "@/store/index.js";
const { Option } = Select;
const { Text } = Typography;

/**
 * 统一处理表单验证规则
 * @param {Array} rules 原始规则数组
 * @param {Boolean} required 是否必填
 * @param {String} label 字段标签
 * @param {String} type 字段类型
 * @param {String} requiredMessage 自定义必填消息
 * @returns {Array} 处理后的规则数组
 */
export const processValidationRules = (rules = [], { required, label, type, requiredMessage } = {}) => {
    // 复制规则数组，避免修改原始数组
    const finalRules = [...rules];

    // 添加必填规则（如果需要且不存在）
    if (required && !finalRules.some(rule => rule.required)) {
        // 根据字段类型确定动词
        const action = ['select', 'single', 'multiple', 'date', 'datepicker', 'dateRange', 'antdSelect'].includes(type)
            ? 'select'
            : type === 'upload' ? 'upload' : 'enter';

        finalRules.push({
            required: true,
            message: requiredMessage ?? `Please ${action} ${label}`
        });
    }

    return finalRules;
};


// ==========================
// 字段渲染逻辑
// ==========================

/**
 * 根据字段类型渲染表单控件
 * @param {Object} field 字段配置
 * @param {Object} options 渲染选项
 * @returns {ReactNode} 渲染的表单控件
 */
export const renderFormControl = (field, options = {}) => {
    const optionsBase = useStore.getState().optionsBase;

    // 表单字段的标准属性
    const {
        type = 'input',
        label,
        name,
        placeholder,
        disabled = false,
    } = field;
    const { form, formConnected, initialValues, mounted, moduleKey } = options;

    // 获取字段值，仅用于显示，不在渲染中更新状态
    let fieldValue = '';
    if (mounted?.current && formConnected && form) {
        fieldValue = form.getFieldValue(name);
    } else if (initialValues && name in initialValues) {
        fieldValue = initialValues[name];
    }

    // 如果提供了自定义渲染函数，使用它
    if (field.render) {
        return field.render(field, options);
    }

    // 创建通用的属性对象
    const createCommonProps = (customProps = {}) => ({
        placeholder: placeholder || `Enter ${label || name}`,
        disabled,
        style: field.style,
        ...field.props,
        ...customProps
    });

    // 基本输入属性（用于Input类组件）
    const createInputProps = (additionalProps = {}) => ({
        ...createCommonProps(),
        allowClear: true,
        maxLength: field.maxLength,
        showCount: field.showCount !== undefined ? field.showCount : field.maxLength,
        autoComplete: "new-password",
        ...additionalProps
    });

    // 根据类型渲染不同控件
    switch (type) {
        // 文本展示字段
        case 'displayText': {
            const content = field.displayFn
                ? field.displayFn(form, initialValues)
                : (fieldValue !== undefined ? fieldValue : '');

            return (
                <div
                    className={field.displayFn ? "displayText" : styles.displayText}
                    style={field.style}
                >
                    {content}
                </div>
            );
        }

        // 图片展示字段
        case 'displayImage': {
            const imageStyle = field.style || { width: '300px', height: '100px' };
            return field.content
                ? <Image className={styles.displayImg} src={field.content} style={imageStyle} />
                : '';
        }

        case 'input': {
            const { key: inputKey, ...inputRest } = field;
            return (
                <ControlledInput
                    field={field}
                    name={name}
                    options={options}
                    form={options.form}
                    label={label}
                    disabled={disabled}
                    placeholder={placeholder}
                    {...inputRest}
                />
            );
        }

        case 'line':
            return <div style={field.style || {}} className={styles.line}></div>;

        //文本输入框
        case 'textarea': {
            const { key: textareaKey, ...textareaRest } = field;
            const textareaProps = createInputProps({
                autoSize: { minRows: field.rows || 4 },
                ...textareaRest
            });

            return <Input.TextArea key={textareaKey} {...textareaProps} />;
        }

        //密码输入框
        case 'password': {
            const { key: passwordKey, ...passwordRest } = field;
            return (
                <ControlledInput
                    key={passwordKey}
                    field={field}
                    name={name}
                    form={options.form}
                    label={label}
                    disabled={disabled}
                    placeholder={placeholder}
                    type="password"
                    {...passwordRest}
                />
            );
        }

        case 'date': {
            const { key: dateKey, ...dateRest } = field;
            // 合并样式，确保宽度设置不会被覆盖
            const datePickerStyle = {
                width: '50%', // 百分比宽度
                position: 'relative',
                ...(field.style || {})
            };

            // 配置弹出层样式，防止撑开容器
            const popupStyle = {
                position: 'absolute',
                zIndex: 1050,
            };

            const datePickerPlaceholder = field.placeholder || `Select ${field.label}`;
            const datePickerProps = {
                onChange: (value) => field.onChange?.(value, form),
                style: datePickerStyle,
                popupStyle,
                placeholder: datePickerPlaceholder,
                getPopupContainer: triggerNode => triggerNode.parentNode,
                ...dateRest
            };

            return <DatePicker key={dateKey} {...datePickerProps} />;
        }

        case 'dateRange': {
            const { key: dateRangeKey, ...dateRangeRest } = field;
            const handleChange = (dates, dateStrings) => {
                const [startKey = 'startTime', endKey = 'endTime'] = field.keys || [];
                const [start, end] = dateStrings || [];

                if (start) form.setFieldValue(startKey, formatDate(start));
                if (end) form.setFieldValue(endKey, formatDate(end));
                field.onChange?.(dates, dateStrings);
            };

            const rangePickerProps = {
                placeholder,
                disabled,
                onChange: handleChange,
                format: field.format || 'YYYY-MM-DD',
                style: { width: field.width || '100%' },
                ...dateRangeRest
            };

            return <DatePicker.RangePicker key={dateRangeKey} {...rangePickerProps} />;
        }

        case 'switch': {
            const { checkedChildren = 'Enabled', unCheckedChildren = 'Disabled', key: switchKey, ...switchRest } = field;
            const initialChecked = Boolean(fieldValue);

            // 使用useEffect处理初始值设置
            useEffect(() => {
                if (fieldValue !== undefined) {
                    form.setFieldValue(name, initialChecked ? 1 : 0);
                }
            }, []);  // 仅在组件挂载时执行一次

            const switchProps = {
                checkedChildren,
                unCheckedChildren,
                onChange: (checked) => {
                    const newValue = checked ? 1 : 0;
                    form.setFieldValue(name, newValue);
                },
                ...switchRest
            };

            return <Switch key={switchKey} {...switchProps} />;
        }

        // antd模式select
        case 'antdSelect': {
            const [isPlaying, setIsPlaying] = useState(null);
            const { key: selectKey, ...selectRestProps } = field;
            const selectProps = {
                optionFilterProp: "label",
                maxTagCount: field.maxTagCount || 1,
                onChange: (value) => field.onChange?.(value, form),
                name: field.name,
                showSearch: field.showSearch ?? true,
                disabled: field.disabled,
                mode: field.mode,
                virtual: false,
                style: field.style || {},
                placeholder: field.placeholder || `Please select ${field.label}`,
                allowClear: field.allowClear ?? true
            };

            return (
                <Select key={selectKey} {...selectProps}>
                    {field.options.map((option) => (
                        <Option
                            key={option.value}
                            value={option.value}
                            label={option.label}
                        >
                            {field.renderLabel
                                ? field.renderLabel(option, isPlaying, setIsPlaying, form)
                                : option.label}
                        </Option>
                    ))}
                </Select>
            );
        }

        // 标准select/TagSelector
        case 'select': {
            //选项处理使用统一的options映射
            const fieldCopy = JSON.parse(JSON.stringify(field));
            if (field.options && typeof field.options === 'string') {
                fieldCopy.options = optionsBase[field.options];
            }

            // 确保完全移除key属性
            const { key: selectKey, ...selectRest } = fieldCopy;
            const tagSelectorProps = {
                defaultValue: field.defaultValue,
                onChange: (value) => {
                    field.onChange?.(value, form);
                    options?.onChange?.(value);
                },
                ...selectRest
            };

            return <TagSelector key={selectKey} {...tagSelectorProps} />;
        }

        // 文件上传并预览
        case 'upload': {
            const {
                acceptedFileTypes,
                maxFileSize,
                uploadDescription,
                uploadSuccessMessage,
                uploadFailMessage,
                uploadErrorMessage,
                dirKey,
                uploadFn,
                style,
                gutter,
                key: uploadKey,
                ...uploadRest
            } = field;

            const dirName = moduleKey || useLocation().pathname.split('/')[1];
            const fileUploadProps = {
                dirKey: dirName,
                form: options.form,
                value: fieldValue,
                onChange: async (value, file) => {
                    if (field.durationName && value) {
                        const duration = await getMediaDurationByUrl(value);
                        options.form.setFieldValue(field.durationName, duration * 1000);
                    }
                    field.onChange?.(value, file, form);
                },
                acceptedFileTypes,
                maxFileSize,
                uploadDescription,
                uploadSuccessMessage,
                uploadFailMessage,
                uploadErrorMessage,
                uploadFn,
                field,
                style,
                ...field.props,
                ...uploadRest
            };

            return <FileUpload key={uploadKey} {...fileUploadProps} />;
        }

        //输入框组
        case 'inputGroup': {
            const { inputConfig } = field;

            if (field.type === 'line') {
                return <div>{renderFormControl(field, options)}</div>;
            }

            const groupContainerStyle = {
                display: 'flex',
                gap: options.collapseFormConfig?.gap || 20,
                maxWidth: '100%',
                overflowX: 'hidden'
            };

            return (
                <Form.Item noStyle className='inputGroup'>
                    <div style={groupContainerStyle}>
                        {inputConfig.map((config, index) => {
                            const itemRules = processValidationRules(config.rules || [], {
                                required: config.required,
                                label: config.label || label,
                                type: config.type,
                                requiredMessage: config.requiredMessage
                            });

                            const itemStyle = {
                                ...(config.flex ? { flex: config.flex } : {}),
                                ...(config.width ? { minWidth: config.width } : {})
                            };

                            const formClassName = 'editorform-item' + (config.className ? config.className : '');

                            return (
                                <div style={itemStyle} key={index}>
                                    <Form.Item
                                        className={formClassName}
                                        name={config.name}
                                        label={config.label ? <FormLabel field={config} /> : null}
                                        required={config.required}
                                        rules={itemRules}
                                    >
                                        {renderFormControl(config, options)}
                                    </Form.Item>
                                </div>
                            );
                        })}
                    </div>
                </Form.Item>
            );
        }

        //数字步进器
        case 'numberStepper': {
            const { key: stepperKey, initValue, ...stepperRest } = field;
            // 修复：如果name为数组，转换为字符串，防止NumberStepper收到数组类型name
            let stepperName = stepperRest.name;
            if (Array.isArray(stepperName)) {
                // 用点连接数组，兼容Form.Item嵌套场景
                stepperName = stepperName.join('.')
            }
            // 传递修正后的name
            return <NumberStepper key={stepperKey} form={form} {...stepperRest} name={stepperName} />;
        }


        case 'list': {
            return (
                <DynamicFormList
                    form={form}
                    fieldValue={fieldValue}
                    field={field}
                    options={options}
                    // 从 options 中获取并传递 parentNamePath
                    parentNamePath={options.parentNamePath}
                />
            )
        }
        //动态表格列表
        case 'dynamicTableList': {
            return <DynamicTableList field={field} config={{ ...options, form }} />;
        }

        default:
            return null;
    }
};

// 创建一个独立的输入框组件
const ControlledInput = ({ field, defaultInitialValue, tooltipInfo, name, label, disabled: initialDisabled, placeholder, type = 'input', labelClassName, form, tooltipPlacement, initValue, tooltip, options, clickEditor, ...rest }) => {
    const [inputDisabled, setInputDisabled] = useState(initialDisabled);
    const [inputEditor, setInputEditor] = useState(false);

    const id = options?.editId; //是否编辑状态
    const isNameField = field.name === 'name';
    const isEditable = isNameField && field.clickEditor && id;

    // 特殊处理：当字段名称为 'name' 时的标签处理
    useEffect(() => {
        if (isEditable) {
            const labelDom = document.querySelector('.edit-name-label');
            if (labelDom && !inputEditor) {
                labelDom.parentElement.parentElement.classList.add('edit-name-label-hidden');
            } else {
                labelDom.parentElement.parentElement.classList.remove('edit-name-label-hidden');
            }
        }
    }, [isEditable, inputEditor]);

    // 处理点击编辑按钮
    const handleClickEditor = () => {
        setInputEditor(true);
        if (isEditable) {
            const labelDom = document.querySelector('.edit-name-label');
            labelDom?.parentElement.classList.remove('edit-name-label-hidden');
        }
    };

    // 处理按钮点击
    const handleButtonClick = () => {
        setInputDisabled(!inputDisabled);
        field.buttonClick?.(form, inputDisabled);
    };

    // 根据类型确定输入组件
    const InputComponent = type === 'password' ? Input.Password : Input;

    // 准备输入属性
    const inputProps = {
        style: field.style,
        placeholder: placeholder || `Enter ${label || name}`,
        disabled: inputDisabled,
        allowClear: true,
        maxLength: field.maxLength,
        showCount: field.showCount !== undefined ? field.showCount : field.maxLength,
        autoComplete: "new-password",
        ...field.props,
        ...rest
    };

    // 密码输入框特殊处理
    if (type === 'password') {
        inputProps.iconRender = (visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />;
    }

    // 移除不需要传递给输入组件的属性
    const { buttonClick, ...cleanInputProps } = inputProps;

    // 确定是否显示编辑按钮
    const showEditButton = field.clickEditor && id && !inputEditor;

    // 确定是否显示操作按钮
    const showActionButton = field.buttons?.length > 1;

    // 编辑状态下的值展示
    const displayValue = form.getFieldValue(field.name);
    const displayValueStyle = {
        lineHeight: "40px",
        fontWeight: "600",
        fontSize: "18px"
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 输入框或显示值 */}
            {(field.clickEditor && id ? inputEditor : true) ? (
                <InputComponent {...cleanInputProps} />
            ) : (
                <div style={displayValueStyle}>{displayValue}</div>
            )}

            {/* 编辑按钮 */}
            {showEditButton && <EditOutlined onClick={handleClickEditor} />}

            {/* 操作按钮 */}
            {showActionButton && (
                <Button
                    className='btn'
                    type={inputDisabled ? "primary" : "default"}
                    onClick={handleButtonClick}
                >
                    {inputDisabled ? field.buttons[0] : field.buttons[1]}
                </Button>
            )}
        </div>
    );
};


/**
 * 渲染表单项
 * 处理表单项的props和规则
 * 
 * @param {Object} field 字段配置
 * @param {Object} options 渲染选项
 * @returns {ReactNode} 渲染的表单项
 */
export const renderFormItem = (field, options = {}) => {
    if (!field) {
        return null;
    }

    const {
        name, // 字段的标识符
        label,
        rules = [], // 字段的原始规则
        labelCol,
        wrapperCol,
        dependencies,
        shouldUpdate,
        valuePropName: initialValuePropName, // 用户指定的 valuePropName
        hidden,
        noStyle,
        className,
        required // 字段级别的必填标记
    } = field;
    const { form, formConnected } = options;

    // 特殊渲染情况：当 shouldUpdate 为 true 时
    if (shouldUpdate) {
        const formItemProps = {
            shouldUpdate,
            label: <FormLabel field={field} />,
            className: `${className || ''} editorform-item`,
            hidden
        };

        return (
            <Form.Item key={name || `item-${Math.random()}`} {...formItemProps}>
                {() => field.render(formConnected ? form : null)}
            </Form.Item>
        );
    }

    // 特殊渲染情况：当存在 dependencies 时
    if (dependencies) {
        const newField = JSON.parse(JSON.stringify(field));
        delete newField.dependencies;
        return (
            <Form.Item
                noStyle
                dependencies={dependencies}
            >
                {({ getFieldValue, form }) => {
                    // 动态计算 content（可能是函数）
                    const content = typeof field.content === 'function'
                        ? field.content({ getFieldValue, form })
                        : field.content;

                    // 处理展示字段
                    if (['displayImage', 'displayText'].includes(field.type)) {
                        newField.content = content || null;
                    }

                    // 渲染组件
                    return content ? renderFormItem(newField, options) : null;
                }}
            </Form.Item>
        );
    }
    // 列表字段
    if (field.type === 'list') {
        return <div>{renderFormControl(field, options)}</div>;
    }

    // 通用 Form.Item 基础属性
    const formItemBaseProps = {
        label,
        labelCol,
        wrapperCol,
        className: `${className || ''} ${field.type === 'inputGroup' ? '' : 'editorform-item'}`.trim(),
        hidden,
        noStyle,
    };

    // 判断是否为纯展示类型的字段
    const isDisplayType = ['displayText', 'displayImage'].includes(field.type);
    const isStructuralType = ['line'].includes(field.type);
    const shouldHideLabel = !field.label || field.type === 'upload';

    // 对于纯展示类型，Form.Item 仅用于布局
    if (isDisplayType) {
        return (
            <Form.Item
                key={name}
                label={<FormLabel field={field} />}
                {...formItemBaseProps}
            >
                {renderFormControl(field, options)}
            </Form.Item>
        );
    }

    // 特殊结构类型，不需要Form.Item包装
    if (isStructuralType) {
        return <div>{renderFormControl(field, options)}</div>;
    }

    // 对于需要表单控制的输入/交互型字段
    // 处理表单验证规则
    const finalRules = processValidationRules(rules, {
        required,
        label,
        type: field.type,
        requiredMessage: field.requiredMessage
    });

    // 根据字段类型确定 valuePropName
    const finalValuePropName = initialValuePropName || (field.type === 'switch' ? 'checked' : 'value');

    // 完整的表单项属性
    const formItemProps = {
        ...formItemBaseProps,
        label: shouldHideLabel ? null : <FormLabel field={field} />,
        name,
        rules: finalRules,
        valuePropName: finalValuePropName
    };

    return (
        <Form.Item key={name} {...formItemProps}>
            {renderFormControl(field, options)}
        </Form.Item>
    );
};

/**
 * 基础表单渲染
 * 渲染一组表单字段
 */
export const renderBasicForm = (fields, options = {}) => {
    const { oneColumnKeys = [], gutter } = options || {};

    if (!fields || fields.length === 0) {
        return null;
    }

    // 分组字段
    const groups = [];
    let currentGroup = [];

    // 添加分组的帮助函数
    const addGroupAndReset = () => {
        if (currentGroup.length > 0) {
            groups.push([...currentGroup]);
            currentGroup = [];
        }
    };

    // 分析字段并创建分组
    fields.forEach((field, index) => {
        const isLastField = index === fields.length - 1;
        const isDivider = field.type === 'divider';
        const isOneColumn = oneColumnKeys.includes(field.name) || field.oneColumn;

        // 处理分割线字段
        if (isDivider) {
            addGroupAndReset();
            // 将分割线字段单独作为一个分组
            groups.push([field]);
            return;
        }

        // 处理单列字段
        if (isOneColumn) {
            // 如果当前分组不为空，先保存当前分组
            if (currentGroup.length > 0) {
                addGroupAndReset();
            }

            // 单列字段单独作为一个分组
            groups.push([field]);
            return;
        }

        // 常规字段添加到当前分组
        currentGroup.push(field);

        // 如果是最后一个字段且当前分组不为空，保存分组
        if (isLastField) {
            addGroupAndReset();
        }
    });

    // 渲染分组
    return groups.map((group, groupIndex) => {
        // 特殊处理：分割线
        if (group.length === 1 && group[0].type === 'divider') {
            const dividerField = group[0];
            const dividerProps = {
                orientation: dividerField.orientation || 'left',
                style: dividerField.style,
                className: `${styles.formDivider} ${dividerField.className || ''}`
            };

            return (
                <Divider key={`divider-${groupIndex}`} {...dividerProps}>
                    {dividerField.label}
                </Divider>
            );
        }

        // 常规字段分组 - 使用网格布局
        return (
            <Row
                gutter={gutter}
                key={`group-${groupIndex}`}
            >
                {group.map((field) => {
                    const fieldKey = field.name || `field-${Math.random()}`;
                    const colProps = {
                        className: styles.formCol,
                        span: field.colSpan || 24,
                        style: { width: field.width || '100%' }
                    };

                    return (
                        <Col key={fieldKey} {...colProps}>
                            {renderFormItem(field, options)}
                        </Col>
                    );
                })}
            </Row>
        );
    });
};

/**
 * 高级表单字段渲染
 * 渲染结构化面板中的字段
 */
export const renderPanelFields = (panel, panelIndex, item, itemIndex, options) => {
    if (!item.fields || item.fields.length === 0) {
        return <div className={styles.emptyItem}>No fields in this item</div>;
    }

    return (
        <div className={styles.panelItemFields}>
            {item.fields.map((field, fieldIndex) => {
                // 计算字段名 - 结构化格式
                const fieldName = `structurePanels[${panelIndex}].items[${itemIndex}].${field.name}`;

                // 复制字段配置，更新字段名
                const modifiedField = {
                    ...field,
                    name: fieldName
                };

                const fieldProps = {
                    className: styles.panelItemField,
                    style: { width: field.width || '100%' }
                };

                return (
                    <div key={`field-${fieldIndex}`} {...fieldProps}>
                        {renderFormItem(modifiedField, options)}
                    </div>
                );
            })}
        </div>
    );
};

// 获取状态对应的颜色
const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return '#889e9e';
        case 'ENABLED': return '#1c8';
        case 'DISABLED': return '#ff4d4f';
        default: return '#889e9e';
    }
};
// 渲染字段
const renderDisplayName = (item, displayKeyIndex, displayKey) => {
    // 确保item不为null
    const safeItem = item || {};

    // 如果displayKey是字符串，则直接返回item[displayKey] 
    if (typeof displayKey === 'string') {
        displayKey = { key: displayKey, hiddenKeyName: false, displayKeyName: displayKey };
    }
    const value = safeItem[displayKey.key];
    const optionsBase = useStore.getState().optionsBase;
    let valueArray = Array.isArray(value) ? value : value ? [value] : [];

    if (displayKey.optionName) {
        const matchedItems = optionsBase[displayKey.optionName];
        if (matchedItems?.length > 0) {
            valueArray = valueArray.map(code => {
                const displayItem = matchedItems.find(item => item.value === code);
                return displayItem ? displayItem.displayName || displayItem.label : code;
            });
        }
    }

    if (valueArray.length === 0) return null;

    return (
        <span key={displayKeyIndex} className={styles.displayKeyItem}>
            {displayKey.hiddenKeyName ? '' : (`${displayKey.key === 'id' ? 'ID' : displayKey.displayKeyName}:`)}
            {valueArray}
        </span>
    );
};

// 全局音频管理器
const audioManager = {
    currentAudio: null,
    currentCallback: null,
    stopCurrent: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
            if (this.currentCallback) {
                this.currentCallback(false);
            }
            // 清空当前音频引用，确保状态完全重置
            this.currentAudio = null;
            this.currentCallback = null;
        }
    },
    setCurrentAudio: function (audio, callback) {
        this.stopCurrent();
        this.currentAudio = audio;
        this.currentCallback = callback;
    }
};

/**
 * 默认的列表项渲染函数
 * @param {Object} params - 参数对象
 * @param {Object} params.item - 列表项数据
 * @param {Array} params.displayKeys - 需要显示的字段数组
 * @param {string} params.displayTitle - 显示为标题的字段名
 * @returns {ReactNode} 渲染的列表项
 */
export const RenderItemMeta = (({ item = {}, displayKeys, displayTitle, displayFileName = '' }) => {
    // 安全检查 - 如果item为null或undefined，使用空对象
    const safeItem = item && typeof item === 'object' ? { ...item } : {};

    const audioRef = useRef(null);
    const [currentPlayingItem, setCurrentPlayingItem] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const displayFile = safeItem[displayFileName] || safeItem.coverImgUrl || safeItem.imageUrl || safeItem.animationPhoneUrl || safeItem.audioUrl; // 当前文件
    const statusKey = displayKeys && displayKeys.find ? displayKeys.find(key => key === 'status' || key.key === 'status') : null;// 状态字段
    const otherDisplayKeys = displayKeys && displayKeys.filter ? displayKeys.filter(key => key !== 'status' && key.key !== 'status') : [];// 其他显示字段
    const fileCategory = getFileCategoryFromUrl(displayFile); // 文件分类

    // 使用 ref 跟踪组件挂载状态，防止内存泄漏
    const isMounted = useRef(true);

    // 组件卸载时清理资源
    useEffect(() => {
        return () => {
            isMounted.current = false;
            // 如果当前组件的音频正在播放，则停止
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current.removeEventListener('ended', handleAudioEnded);
                audioRef.current = null;
            }
        };
    }, []);

    // 处理音频播放结束
    const handleAudioEnded = useCallback(() => {
        if (!isMounted.current) return;
        setIsPlaying(false);
        audioManager.currentAudio = null;
        audioManager.currentCallback = null;
    }, []);

    // 播放新音频的辅助函数
    const playNewAudio = useCallback((item) => {
        // 使用安全的item
        const safeItem = item || {};

        if (!safeItem?.audioUrl || !isMounted.current) return;

        // 清理当前音频
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeEventListener('ended', handleAudioEnded);
            audioRef.current = null;
        }

        // 先停止其他正在播放的音频
        audioManager.stopCurrent();

        // 设置加载状态
        setIsPlaying(true);

        // 创建新的音频实例
        const audio = new Audio();

        // 先绑定事件，再设置src可以捕获更多加载错误
        audio.addEventListener('ended', handleAudioEnded);
        audio.addEventListener('error', (e) => {
            if (!isMounted.current) return;
            setIsPlaying(false);
        });

        // 设置音频源
        audio.src = safeItem.audioUrl;
        audioRef.current = audio;

        // 设置当前音频为活动音频
        audioManager.setCurrentAudio(audio, (playing) => {
            if (!playing && isMounted.current) {
                setIsPlaying(false);
            }
        });

        // 添加延时，确保pause操作完全完成后再play
        setTimeout(() => {
            if (!isMounted.current) return;

            audio.play().catch(error => {
                if (!isMounted.current) return;

                // 忽略AbortError，因为这通常是由快速切换导致的
                if (error.name !== 'AbortError') {
                }
                setIsPlaying(false);
            });
        }, 50);
    }, [handleAudioEnded]);

    // 使用 ref 防止重复操作，比 window 全局变量更安全
    const toggleLock = useRef(false);

    // 处理音频播放/暂停
    const handleAudioToggle = useCallback((item) => {
        // 使用安全的item
        const safeItem = item || {};

        // 防止频繁操作，添加状态锁定
        if (toggleLock.current) {
            return;
        }

        // 设置锁定状态
        toggleLock.current = true;

        if (!safeItem || !safeItem.audioUrl) {
            // 如果点击了一个无效的项目，并且当前有音频在播放，则停止当前音频
            if (isPlaying) {
                audioManager.stopCurrent(); // 这会暂停音频并通过回调将 isPlaying 设置为 false
                setCurrentPlayingItem(null); // 清除当前播放项目
                setIsPlaying(false); // 确保播放状态被重置
            }
        } else if (currentPlayingItem?.id === safeItem.id && isPlaying) {
            // 如果点击的是当前正在播放的音频项目
            audioManager.stopCurrent(); // 暂停当前音频，isPlaying 将通过回调变为 false
            setIsPlaying(false); // 直接设置播放状态为false
            // currentPlayingItem 保持不变，但由于 isPlaying 变为 false，图标会更新
        } else {
            // 否则 (点击了不同的项目，或当前项目未在播放，或没有项目在播放)
            // 播放点击的项目。playNewAudio 会处理停止其他任何音频。
            playNewAudio(safeItem); // playNewAudio 会将 isPlaying 设置为 true
            setCurrentPlayingItem(safeItem); // 设置当前激活的音频项目
        }

        // 操作完成后解除锁定
        toggleLock.current = false;
    }, [isPlaying, currentPlayingItem, playNewAudio]);

    // 修改点击事件处理
    const handleAudioClick = useCallback((e, item) => {
        e.preventDefault(); // 防止事件冒泡
        handleAudioToggle(item);
    }, [handleAudioToggle]);


    return (
        <List.Item.Meta
            style={{ alignItems: 'center' }}
            avatar={
                <div className='itemAvatar'>
                    {
                        fileCategory == 'audio' ? <div className='audioPreview'>
                            <div
                                className='audioPreview_box'
                                onPointerDown={e => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleAudioClick(e, safeItem) }}
                            >
                                {(currentPlayingItem?.id === safeItem.id && isPlaying) ? (
                                    <PauseOutlined style={{ fontSize: '20px' }} />
                                ) : (
                                    <CaretRightOutlined style={{ fontSize: '20px' }} />
                                )}
                            </div>
                        </div>
                            :
                            <div className='itemAvatar'>
                                <Avatar shape="square" size={64} src={displayFile} />
                            </div>
                    }
                </div>
            }
            title={<Text ellipsis={{ tooltip: safeItem[displayTitle] }}>{safeItem[displayTitle]}</Text>}
            description={
                <div>
                    {statusKey && (
                        <div>
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: '12px',
                                    color: getStatusColor(safeItem.status)
                                }}
                                ellipsis={{ tooltip: safeItem.status }}
                            >
                                {optionsConstants[statusKey.optionName]?.find(
                                    status => status.value === safeItem.status
                                )?.label}
                            </Text>
                        </div>
                    )}
                    <div className={styles.displayKeyItemContainer}>
                        {otherDisplayKeys.map((displayKey, index) =>
                            renderDisplayName(safeItem, index, displayKey)
                        )}
                    </div>
                </div>
            }
        />
    );
});
