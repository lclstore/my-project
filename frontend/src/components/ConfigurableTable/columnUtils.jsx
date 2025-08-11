import { renderNameColumn, renderSwitchColumn } from '@/common';
/**
 * ConfigurableTable 工具函数
 */

/**
 * 从列定义中获取指定visibleColumn的键数组
 * 
 * @param {Array} columns 列定义数组
 * @param {Number} visibleColumn 可见性类型（0:强制显示, 1:可选, 2:默认显示）
 * @returns {Array} 键数组
 */
export function getVisibleColumnKeys(columns, visibleColumn) {
    return columns
        .filter(col => {
            const key = col.dataIndex;
            return key && col.visibleColumn === visibleColumn;
        })
        .map(col => col.dataIndex);
}

/**
 * 根据按钮类型获取颜色
 * 
 * @param {String} key 按钮类型
 * @returns {Object} 样式对象
 */
export function getActionButtonColor(key) {
    switch (key) {
        case 'delete':
            return { color: '#ff4d4f' };
        case 'enable':
            return { color: '#11cc88' };
        case 'generate':
            return { color: '#11cc88' };
        case 'disable':
            return { color: '#ff4d4f' };
        default:
            return {};
    }
}

/**
 * 处理自定义列渲染配置
 * 
 * @param {Array} columns 原始列定义
 * @param {Object} options 配置项
 * @param {Function} options.renderMedia 媒体渲染函数
 * @param {Object} options.optionsBase 选项数据
 * @param {Function} options.handleAction 操作处理函数
 * @returns {Array} 处理后的列定义
 */
export function processColumns(columns, options = {}) {
    const { renderMedia, optionsBase = {}, handleAction } = options;
    const mediaTypes = ['image', 'video', 'audio']; // 定义合法的媒体类型

    // 定义renderName和渲染函数的映射关系
    const renderNameMap = {
        renderNameColumn,
        renderSwitchColumn,
        // 可以在这里继续添加其他的渲染函数
    };

    return columns.map(col => {
        let processedCol = { ...col };
        // 设置排序显示提示默认值
        processedCol.showSorterTooltip = processedCol.showSorterTooltip ?? false;

        // 为align: 'center'的列添加类名 
        if (processedCol.align === 'center' || processedCol.dataIndex === 'actions') {
            processedCol.className = `td-center`;
        }

        if (!col.render) {
            // 处理媒体类型列
            if (mediaTypes.includes(processedCol.mediaType)) {
                processedCol.className = 'media-cell';
                processedCol.width = processedCol.width || 95;

                // 设置媒体渲染函数
                if (renderMedia) {
                    processedCol.render = (text, record, index) =>
                        <div className='media-cell-wrapper' onClick={e => e.stopPropagation()}>
                            {renderMedia(record, processedCol)}
                        </div>;
                }
            }
            // 处理选项类型列
            else if (processedCol.options) {
                const options = typeof processedCol.options === 'string'
                    ? optionsBase[processedCol.options]
                    : processedCol.options;

                processedCol.render = (text, record, index) => {
                    if (!record) return null;
                    if (!options) return text;

                    if (Array.isArray(text)) {
                        return text
                            .map(enumVal => {
                                const option = options.find(opt => opt.value === enumVal);
                                return option ? (option.label || enumVal) : enumVal;
                            })
                            .join(', ');
                    }
                    else {
                        const optionConfig = options.find(option => option.value === text);
                        return optionConfig
                            ? (optionConfig.label || optionConfig.name || text)
                            : text;
                    }
                };
            }
            // 处理操作按钮列
            else if (processedCol.actionButtons && Array.isArray(processedCol.actionButtons)) {
                if (handleAction) {
                    processedCol.render = (text, record, index) =>
                        handleAction(record, processedCol);
                }

                // 固定操作列宽度和位置
                processedCol.width = 70;
                processedCol.fixed = 'right';
                processedCol.align = 'center';

                // 为操作列添加action-cell类名
                processedCol.onCell = () => ({
                    className: 'action-cell',
                });
            }
            // 默认渲染
            else {
                processedCol.render = (text, record, index) => (
                    <div key={`${record[processedCol.rowKey || 'id'] || index}-default-${processedCol.dataIndex}`}>
                        {text}
                    </div>
                );
            }
        }
        // 处理renderName
        if (processedCol.renderName) {
            // 如果renderName在映射表中，使用对应的渲染函数，否则用默认渲染
            processedCol.render = renderNameMap[processedCol.renderName];
        }

        // 包装原有的render函数，添加td-cell容器
        const originalRender = processedCol.render;

        processedCol.render = (text, record, index) => {
            if (!record) return null;

            const content = originalRender(text, record, index);
            const key = `${record[processedCol.rowKey || 'id'] || index}-${processedCol.dataIndex}-cell`;

            return (
                <div key={key} className={`td-cell ${processedCol.className || ''}`}>
                    {content}
                </div>
            );
        };

        return processedCol;
    });
}

/**
 * 默认的操作按钮可见性规则
 * 
 * @param {Object} record 行数据
 * @param {String} btnName 按钮名称
 * @returns {Boolean} 是否可见
 */
export function defaultIsButtonVisible(record, btnName) {
    const status = record.status;
    // 简单的状态-按钮映射关系
    if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
    if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
    if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
    return false;
}

/**
 * 从存储中获取缓存数据
 * 
 * @param {String} pathname 路径名
 * @returns {Object} 缓存数据
 */
export function getStoredCache(pathname) {
    const searchData = sessionStorage.getItem(pathname);
    return searchData ? JSON.parse(searchData) : null;
}

/**
 * 设置缓存数据
 * 
 * @param {String} pathname 路径名
 * @param {Object} data 缓存数据
 */
export function setStoredCache(pathname, data) {
    sessionStorage.setItem(pathname, JSON.stringify(data));
}

/**
 * 删除缓存数据
 * 
 * @param {String} pathname 路径名
 */
export function removeStoredCache(pathname) {
    sessionStorage.removeItem(pathname);
}
