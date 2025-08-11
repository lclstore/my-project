import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import './NumberStepper.css'; // 引入样式

/**
 * @description 数值步进器组件，包含减号按钮、值显示和加号按钮。
 * @param {number} value - 当前值 (期望是数字)。
 * @param {function} onChange - 值改变时的回调函数 (传递数字)。
 * @param {number} min - 最小值。
 * @param {number} max - 最大值。
 * @param {number} step - 每次增减的步长。
 * @param {function} formatter - 格式化显示值的函数。
 * @param {object} form - 表单实例。
 */
const NumberStepper = ({
    value,
    onChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    name,
    form,
    formatter = (val) => val, // 默认格式化函数
    id, // 接收来自 Form.Item 的 id
}) => {

    const handleDecrement = () => {
        // 确保内部处理的是数字，如果 value 是 undefined/null，从 min 开始递减是不合适的，通常从 0 或 min 开始
        const currentValue = typeof value === 'number' ? value : min; // 或者根据场景定一个合适的默认值，比如 0
        const newValue = Math.max(min, currentValue - step);
        if (onChange && newValue !== currentValue) {
            onChange(newValue, {
                form, name
            });
        }
    };

    const handleIncrement = () => {
        const currentValue = typeof value === 'number' ? value : min; // 同上
        const newValue = Math.min(max, currentValue + step);
        if (onChange && newValue !== currentValue) {
            onChange(newValue, {
                form, name
            });
        }
    };

    // 直接使用 value，假设它是数字或 undefined
    const numericValue = value !== undefined ? value : min;
    // 格式化用于显示，如果值无效，可以显示基于 min 的格式化值或空/占位符
    const displayValue = numericValue !== undefined ? formatter(numericValue) : (min !== -Infinity ? formatter(min) : '...');
    // 禁用按钮的条件
    const isMinDisabled = numericValue !== undefined && numericValue <= min;
    const isMaxDisabled = numericValue !== undefined && numericValue >= max;
    useEffect(() => {
        if (value === undefined) {
            onChange(min, {
                form, name
            });
        }
    }, [value, onChange, min]);
    return (
        // 添加 id 以便 Form.Item 的 label 可以关联
        <div className="number-stepper-container" id={id}>
            <Button
                className="stepper-button"
                icon={<MinusOutlined />}
                onClick={handleDecrement}
                disabled={isMinDisabled}
                aria-label="Decrease value"
            />
            <span className="stepper-value" aria-live="polite">{displayValue}</span>
            <Button
                className="stepper-button"
                icon={<PlusOutlined />}
                onClick={handleIncrement}
                disabled={isMaxDisabled}
                aria-label="Increase value"
            />
        </div>
    );
};

NumberStepper.propTypes = {
    id: PropTypes.string, // 来自 Form.Item
    value: PropTypes.number, // 期望是数字
    onChange: PropTypes.func,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    formatter: PropTypes.func,
};

export default NumberStepper; 