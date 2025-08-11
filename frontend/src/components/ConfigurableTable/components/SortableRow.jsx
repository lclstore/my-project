import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

/**
 * 表格可排序行组件
 */
const SortableRow = ({ children, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key']
    });

    // 设置行样式
    const style = {
        ...props.style,
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 1,
        cursor: isDragging ? 'grabbing' : 'default'
    };

    return (
        <tr {...props} ref={setNodeRef} style={style}>
            {React.Children.map(children, (child, index) => {
                // 为第一列（拖拽手柄列）添加特殊处理
                if (index === 0) {
                    return React.cloneElement(child, {
                        children: (
                            <div {...attributes} {...listeners}>
                                <MenuOutlined
                                    style={{
                                        cursor: 'grab',
                                        fontSize: '16px',
                                        color: isDragging ? '#1890ff' : '#999',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            </div>
                        )
                    });
                }
                return child;
            })}
        </tr>
    );
};

SortableRow.propTypes = {
    children: PropTypes.node,
    'data-row-key': PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    style: PropTypes.object
};

export default SortableRow; 