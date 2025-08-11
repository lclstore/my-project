import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import './NumberStepper.css'; // 引入样式

/**
 * @description 数值步进器组件，用于通过加减按钮调整数值
 * @param {Object} props - 组件属性
 * @param {number} [props.value] - 当前值
 * @param {function} props.onChange - 值改变时的回调函数，参数为新值
 * @param {number} [props.min=-Infinity] - 最小值
 * @param {number} [props.max=Infinity] - 最大值
 * @param {number} [props.step=1] - 步长
 * @param {string} [props.name] - 表单字段名称
 * @param {object} [props.form] - 表单实例
 * @param {function} [props.formatter] - 格式化显示值的函数
 * @param {string} [props.id] - 组件ID，用于表单关联
 * @param {string} [props.className] - 自定义类名
 * @param {object} [props.buttonProps] - 按钮的额外属性
 * @returns {React.ReactElement} 步进器组件
 */
const NumberStepper = ({
    value,
    onChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    name,
    form,
    formatter = (val) => val,
    id,
    className = '',
    buttonProps = {},
}) => {
    // 处理数值及其显示
    const numericValue = useMemo(() => {
        return typeof value === 'number' ? value : min;
    }, [value, min]);
    const displayValue = useMemo(() => {
        if (numericValue !== undefined) {
            return formatter(numericValue);
        }
        return min !== -Infinity ? formatter(min) : '...';
    }, [numericValue, formatter, min]);

    // 按钮禁用状态
    const isMinDisabled = numericValue <= min;
    const isMaxDisabled = numericValue >= max;

    // 处理值变更
    const handleValueChange = (newValue) => {
        if (onChange && newValue !== numericValue) {
            onChange(newValue, { form, name });
        }
    };

    // 递减处理
    const handleDecrement = () => {
        const newValue = Math.max(min, numericValue - step);
        handleValueChange(newValue);
    };

    // 递增处理
    const handleIncrement = () => {
        const newValue = Math.min(max, numericValue + step);
        handleValueChange(newValue);
    };

    // 初始化值
    useEffect(() => {
        if (value === undefined && onChange) {
            onChange(min, { form, name });
        }
    }, []);

    return (
        <div
            id={name}
            className={`number-stepper-container ${className}`}
            role="group"
            aria-label="number stepper"
        >
            <Button
                className="stepper-button"
                icon={<MinusOutlined />}
                onClick={handleDecrement}
                disabled={isMinDisabled}
                aria-label={`Decrease value, current value: ${displayValue}`}
                {...buttonProps}
            />
            <span
                className="stepper-value"
                aria-live="polite"
                data-testid="stepper-value"
            >
                {displayValue}
            </span>
            <Button
                className="stepper-button"
                icon={<PlusOutlined />}
                onClick={handleIncrement}
                disabled={isMaxDisabled}
                aria-label={`Increase value, current value: ${displayValue}`}
                {...buttonProps}
            />
        </div>
    );
};

NumberStepper.propTypes = {
    id: PropTypes.string,
    value: PropTypes.number,
    onChange: PropTypes.func,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    formatter: PropTypes.func,
    name: PropTypes.string,
    form: PropTypes.object,
    className: PropTypes.string,
    buttonProps: PropTypes.object,
};

export default NumberStepper; 