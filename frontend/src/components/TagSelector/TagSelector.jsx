import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './TagSelector.css';

/**
 * 自定义标签选择器组件
 * 提供类似 Tag 的视觉选项，可替代 Select 组件
 * 支持在 Form.Item 中作为表单控件使用，通过配置项控制验证规则
 */
const TagSelector = ({
    options = [],
    value,
    defaultValue,
    backgroundColor,
    onChange,
    mode = 'single',
    disabled = false,
    form,
    fieldConfig = {}
}) => {
    // 初始化内部状态值
    const [internalValue, setInternalValue] = useState(() => {
        const initialValue = value !== undefined ? value : defaultValue;
        if (initialValue === undefined || initialValue === null) {
            return mode === 'multiple' ? [] : undefined;
        }
        return initialValue;
    });

    // 当外部 value 变化时更新内部状态
    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    // 规范化当前值
    const normalizedValue = useMemo(() => {
        // 优先使用外部传入的值
        const current = value !== undefined ? value : internalValue;

        if (current === undefined || current === null) {
            return mode === 'multiple' ? [] : undefined;
        }

        if (mode === 'multiple') {
            return Array.isArray(current) ? current : [current];
        } else {
            return Array.isArray(current) && current.length > 0 ? current[0] : current;
        }
    }, [value, internalValue, mode]);

    // 判断选项是否被选中
    const isSelected = (option) => {
        const optionValue = typeof option === 'object' ? option.value : option;

        if (mode === 'multiple') {
            if (!Array.isArray(normalizedValue)) return false;

            return normalizedValue.some(val => {
                if (typeof val === 'object') return val.value === optionValue;
                return val === optionValue;
            });
        } else {
            if (typeof normalizedValue === 'object') {
                return normalizedValue.value === optionValue;
            }
            return normalizedValue === optionValue;
        }
    };


    // 处理标签点击事件
    const handleTagClick = (option) => {
        if (disabled) return;

        const optionValue = typeof option === 'object' ? option.value : option;
        let newValue;

        if (mode === 'multiple') {
            const currentValues = Array.isArray(normalizedValue) ? [...normalizedValue] : [];
            const isCurrentlySelected = isSelected(option);

            if (isCurrentlySelected) {
                newValue = currentValues.filter(val =>
                    val !== optionValue && (typeof val === 'object' ? val.value !== optionValue : true)
                );
            } else {
                newValue = [...currentValues, optionValue];
            }

            // 多选模式下，空数组时设置为 undefined
            if (newValue.length === 0) {
                newValue = undefined;
            }
        } else {
            // 单选模式下不允许取消选择，只能切换
            if (isSelected(option)) return;
            newValue = optionValue;
        }

        // 更新内部状态
        setInternalValue(newValue);

        // 通知父组件值变化
        if (typeof onChange === 'function') {
            onChange(newValue);

            // 如果有表单实例，手动触发所在字段的验证
            if (form && fieldConfig.name) {
                setTimeout(() => {
                    form.validateFields([fieldConfig.name]).catch(() => {
                        // 忽略验证错误
                    });
                }, 0);
            }
        }
    };

    return (
        <div className="tag-selector-container">
            <div className={`tag-selector-options tag-selector-container-${mode} ${disabled ? 'tag-selector-disabled' : ''}`}>
                {options?.map(option => {
                    const selected = isSelected(option);
                    const optionKey = typeof option === 'object' ? option.value : option;
                    const optionLabel = typeof option === 'object' ? (option.label || option.name || option.value) : option;

                    return (
                        <div
                            key={optionKey}
                            className={`tag-option ${selected ? 'selected' : ''}`}
                            style={backgroundColor ? { backgroundColor } : {}}
                            onClick={() => handleTagClick(option)}
                        >
                            {optionLabel}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

TagSelector.propTypes = {
    options: PropTypes.array.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    backgroundColor: PropTypes.string,
    onChange: PropTypes.func,
    mode: PropTypes.oneOf(['single', 'multiple']),
    disabled: PropTypes.bool,
    form: PropTypes.object,
    fieldConfig: PropTypes.object
};

export default TagSelector;
