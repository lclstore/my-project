import React from 'react';
import { Form, Table, Button, Select } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { useStore } from "@/store/index.js";
import './DynamicTableList.css';
import { renderFormControl } from './FormFields';

// 提取公共的Select渲染组件
const CommonSelect = ({
    record,
    fieldName,
    options: optionsProp,
    placeholder,
    form,
    dependsOn,
    transformOptions,
    listName,
    onChangeReset,
}) => {

    const optionsBase = useStore(i => i.optionsBase);

    // 如果有dependsOn配置，尝试获取依赖字段的值
    let finalOptionKey = optionsProp;
    if (dependsOn && dependsOn.field) {
        // 从表单中获取依赖字段的值，注意要使用listName来构造完整的字段路径
        const dependencyValue = form.getFieldValue([listName, record.name, dependsOn.field]);

        // 根据依赖字段的值查找映射的选项
        if (dependencyValue && dependsOn.mapping) {
            finalOptionKey = dependsOn.mapping[dependencyValue] || dependsOn.mapping.default || optionsProp;
        }
    }

    // 如果直接提供options数组，则使用提供的options
    // 如果提供options字符串，则从optionsBase中获取
    // 否则返回空数组
    let selectOptions = [];

    if (Array.isArray(finalOptionKey)) {
        selectOptions = finalOptionKey;
    } else if (typeof finalOptionKey === 'string') {
        selectOptions = optionsBase[finalOptionKey] || [];
    }

    // 如果需要转换options格式
    if (transformOptions && typeof transformOptions === 'function') {

        selectOptions = transformOptions({
            record,
            dependsOn,
            form,
            listName,
            fieldName,
            options: selectOptions,
        });
    }

    const handleChange = (value) => {
        // 如果配置了onChangeReset，则清空指定的字段
        if (onChangeReset && Array.isArray(onChangeReset)) {
            const resetFields = {};
            const currentFields = form.getFieldValue(listName);
            resetFields[record.key] = {
                ...currentFields[record.key],
            };
            onChangeReset.forEach(fieldNameToReset => {
                resetFields[record.key][fieldNameToReset] = undefined; // 或者 null
            });
            form.setFieldsValue({
                [listName]: { ...currentFields, ...resetFields }
            });
        }
    };


    return (
        <Form.Item name={[record.name, fieldName]} noStyle>
            <Select
                placeholder={placeholder}
                style={{ width: '100%' }}
                options={selectOptions}
                allowClear
                onChange={handleChange}
            />
        </Form.Item>
    );
};

// 默认的操作列渲染函数
const renderDeleteButton = (_, record, index, { remove, form, fieldName }) => (
    // <Button
    //     type="text"
    //     danger
    //     icon={<CloseCircleFilled />}
    //     className='row-close'
    //     onClick={() => {
    //         remove(record.name);
    //         // 只验证当前表单列表字段
    //         form.validateFields([fieldName]);
    //     }}
    // />
    <CloseCircleFilled
        onClick={() => {
            remove(record.name);
            // 只验证当前表单列表字段
            form.validateFields([fieldName]);
        }}
        className='row-close'
    />
);

// 动态表格列表组件
export default function DynamicTableList({ field = {}, config = {} }) {
    const { form } = config;
    const {
        columns = [],
        addButtonText = "+ Add a row",
        defaultRowValue = {},
        renderConnector,
        tableProps = {},
        hideDeleteAction = false, // 是否隐藏删除操作列
    } = field.tableConfig || {};

    // 自定义连接器组件
    const defaultConnector = () => (
        <div className='connect-head'>
            <div className='connect-line-top'></div>
            <div style={{ textAlign: 'center' }}>And</div>
            <div className='connect-line-bottom'></div>
        </div>
    );

    return (
        <div className='tableListContainer'>
            <Form.List name={field.name}>
                {(fields, { add, remove }) => {
                    console.log(fields);

                    // 处理列定义，为render函数添加form和remove参数
                    const processedColumns = columns.map(column => {
                        // 支持使用 name 代替 dataIndex
                        const dataIndex = column.dataIndex || column.name;

                        return {
                            ...column,
                            dataIndex, // 确保dataIndex存在
                            render: (text, record, index) => {
                                // 如果有render函数，调用它并传递额外的参数
                                if (column.render) {
                                    return column.render(text, record, index, { form, remove });
                                }

                                // 根据type自动渲染对应的表单控件
                                if (column.type) {
                                    const fieldConfig = {
                                        ...column,
                                        name: [record.name, dataIndex],
                                    };

                                    // select类型特殊处理
                                    if (column.type === 'select') {
                                        return (
                                            <CommonSelect
                                                record={record}
                                                fieldName={dataIndex}
                                                options={column.options}
                                                placeholder={column.placeholder || `Select ${column.title}`}
                                                form={form}
                                                transformOptions={column.transformOptions}
                                                dependsOn={column.dependsOn}
                                                listName={field.name}
                                                onChangeReset={column.onChangeReset}
                                            />
                                        );
                                    }

                                    // 使用FormFields的renderFormControl渲染其他类型
                                    return renderFormControl(fieldConfig, { ...config, record });
                                }

                                // 默认直接显示文本
                                return text;
                            }
                        };
                    });

                    // 自动添加操作列（如果没有隐藏）
                    if (!hideDeleteAction) {
                        const actionColumn = {
                            title: '',
                            dataIndex: 'action',
                            width: 50,
                            render: (text, record, index) => renderDeleteButton(text, record, index, {
                                form,
                                remove,
                                fieldName: field.name
                            })
                        };

                        // 将操作列添加到列数组末尾
                        processedColumns.push(actionColumn);
                    }

                    return (
                        <>
                            <div className='tableList'>
                                {fields.length > 0 && (
                                    <div className='tableList-main'>
                                        {fields.length > 1 && (renderConnector ? renderConnector() : defaultConnector())}
                                        <Table
                                            style={{ flex: 1 }}
                                            dataSource={fields.map(field => ({ ...field }))}
                                            pagination={false}
                                            rowKey="key"
                                            showHeader={false}
                                            columns={processedColumns}
                                            tableLayout="fixed"
                                            {...tableProps}
                                        />
                                    </div>
                                )}
                            </div>
                            <span
                                onClick={() => add(defaultRowValue)}
                                className='table-row-add'
                            >
                                {addButtonText}
                            </span>
                        </>
                    );
                }}
            </Form.List>
        </div>
    );
}

// 导出辅助组件，方便外部使用
export { CommonSelect };