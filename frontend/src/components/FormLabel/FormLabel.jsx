import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import styles from './FormLabel.module.css'
import infoIcon from "@/assets/images/info.png";

// 默认文本常量
const DEFAULT_TEXTS = {
    OPTIONAL: '(Optional)',
    INFO_ICON: 'i',
};

// 文件大小单位常量
const SIZE_UNITS = {
    KB: 1,
    MB: 1024,
    GB: 1024 * 1024,
};

/**
 * 格式化文件大小
 * @param {number} sizeKB - 文件大小（KB为单位）
 * @returns {string} 格式化后的文件大小字符串
 */
const formatFileSize = (sizeKB) => {
    if (!sizeKB || typeof sizeKB !== 'number' || sizeKB <= 0) {
        return '';
    }

    if (sizeKB < SIZE_UNITS.MB) {
        return `max ${sizeKB}KB`;
    }

    if (sizeKB < SIZE_UNITS.GB) {
        const sizeMB = sizeKB / SIZE_UNITS.MB;
        return `max ${sizeMB % 1 === 0 ? sizeMB : sizeMB.toFixed(1)}MB`;
    }

    const sizeGB = sizeKB / SIZE_UNITS.GB;
    return `max ${sizeGB % 1 === 0 ? sizeGB : sizeGB.toFixed(2)}GB`;
};

/**
 * 表单标签组件，支持必填/选填标识、提示信息、上传类型说明等
 * @param {object} props
 * @returns {JSX.Element|null}
 */
export default function FormLabel({ field = {}, className = '', labelStyle = {}, ...props }) {
    // 若无标签文本，则不渲染组件
    if (!field.label) return null;

    /**
     * 获取上传类型和大小提示
     * @param {object} field - 字段配置
     * @returns {string} 提示文本
     */
    const getUploadHint = (field) => {
        if (!field.acceptedFileTypes) return '';

        // 格式化文件类型
        const types = field.acceptedFileTypes
            .split(',')
            .map(type => type.trim().toUpperCase())
            .join('/');

        // 格式化文件大小
        const sizeText = formatFileSize(field.maxFileSize);

        return sizeText ? `${types} only, ${sizeText}` : `${types} only`;
    };

    // 若为上传类型，自动生成提示
    const uploadTooltip = field.type === 'upload' ? getUploadHint(field) : '';
    const isOptional = !field.required && field.type !== 'inputGroup';
    const hasTooltip = field.tooltipInfo || field.type === 'upload';

    return (
        <div
            className={`${field.name === 'name' && field.clickEditor ? 'edit-name-label' : ''} ${field.labelClassName || ''} ${styles.formLabel} ${field.required ? '' : styles.optional} ${className}`.trim()}
            style={labelStyle}
            {...props}
        >
            <span>{field.label}</span>
            {/* 非必填且非输入组时显示选填提示 */}
            {isOptional && (
                <span className={styles.optionalTip}>
                    {field.optionalTip || DEFAULT_TEXTS.OPTIONAL}
                </span>
            )}
            {/* 有tooltip或上传类型时显示提示气泡 */}
            {hasTooltip && (
                <Tooltip
                    className={styles.tooltip}
                    trigger={field.trigger || 'hover'}
                    title={field.tooltipInfo || uploadTooltip}
                    placement={field.tooltipPlacement || 'right'}
                >
                    <img src={infoIcon} className={styles.infoImge} alt="" />
                    {/* <span className={styles.infoIcon}>{DEFAULT_TEXTS.INFO_ICON}</span> */}
                </Tooltip>
            )}
        </div>
    );
}

// 组件属性类型校验
FormLabel.propTypes = {
    field: PropTypes.shape({
        label: PropTypes.string,
        required: PropTypes.bool,
        type: PropTypes.string,
        acceptedFileTypes: PropTypes.string,
        maxFileSize: PropTypes.number,
        tooltip: PropTypes.string,
        optionalTip: PropTypes.string,
        tooltipPlacement: PropTypes.string,
        trigger: PropTypes.string,
    }),
    className: PropTypes.string,
    labelStyle: PropTypes.object,
};