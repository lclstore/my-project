import React from 'react';
import { Button, Dropdown } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { getActionButtonColor, defaultIsButtonVisible } from '../columnUtils';

/**
 * 表格行操作按钮组件
 */
const TableActions = ({
    record,
    columnConfig,
    onActionClick,
    moduleKey,
    rowKey = 'id',
    buttonsConfig = []
}) => {
    // 获取列配置
    const { actionButtons = [], isShow, customButtons = [] } = columnConfig;

    // 组合按钮配置
    const allButtons = [...buttonsConfig, ...(customButtons || [])];
    // 处理操作按钮点击
    const handleActionClick = (key, e) => {
        e.domEvent.stopPropagation();
        if (onActionClick) {
            onActionClick(key, record, e, columnConfig);
        }
    };

    // 生成下拉菜单项
    const generateDropdownItems = () => {
        // 筛选出可见的按钮
        const visibleButtons = allButtons
            .filter(btn => actionButtons.includes(btn.key))
            .filter(btn => {
                const isVisibleFn = isShow || defaultIsButtonVisible;
                return isVisibleFn(record, btn.key);
            })
            // 按照actionButtons中的顺序排序
            // .sort((a, b) => {
            //     return actionButtons.indexOf(a.key) - actionButtons.indexOf(b.key);
            // })
            // 转换为下拉菜单项
            .map(btn => {
                const ItemIcon = btn.icon;

                return {
                    key: btn.key,
                    label: btn.label || btn.key.charAt(0).toUpperCase() + btn.key.slice(1), // 首字母大写
                    icon: ItemIcon ? <ItemIcon /> : null,
                    style: getActionButtonColor(btn.key),
                    onClick: (e) => handleActionClick(btn.key, e)
                };
            });
        console.log(visibleButtons);
        console.log();

        return visibleButtons;
    };

    // 生成下拉菜单项
    const dropdownItems = generateDropdownItems();

    // 如果没有操作按钮，则不渲染
    if (dropdownItems.length === 0) {
        return null;
    }

    return (
        <div className="actions-container" onClick={(e) => e.stopPropagation()} key={`actions-${record[rowKey]}`}>
            <Dropdown
                menu={{ items: dropdownItems }}
                trigger={['click']}
                className="action-dropdown"
            >
                <Button
                    type="text"
                    icon={<EllipsisOutlined />}
                    className="action-button"
                    onClick={(e) => e.stopPropagation()}
                />
            </Dropdown>
        </div>
    );
};

TableActions.propTypes = {
    record: PropTypes.object.isRequired,
    columnConfig: PropTypes.object.isRequired,
    onActionClick: PropTypes.func,
    moduleKey: PropTypes.string,
    rowKey: PropTypes.string,
    buttonsConfig: PropTypes.array
};

export default React.memo(TableActions); 