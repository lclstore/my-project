import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
    CloudUploadOutlined,


} from '@ant-design/icons';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable';
import { Modal, message } from 'antd';
import CommonEditorForm from '@/components/CommonEditorForm';

export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();

    // 发布相关状态
    const [isPublishModalVisible, setIsPublishModalVisible] = useState(false);
    const [editorRef, setEditorRef] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    // 新增：当前环境状态
    const [currentEnv, setCurrentEnv] = useState('PRODUCTION');

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'textarea',
            name: 'remark',
            label: 'Comment',
            required: true,
            maxLength: 1000,
            showCount: true,
            placeholder: 'Enter comment...'
        }
    ], []);

    // 处理发布提交
    const handlePublish = useCallback(async () => {
        try {
            if (editorRef?.triggerSave) {
                const ret = await editorRef.triggerSave();
                if (ret.success) {
                    messageApi.success('Published successfully');
                    setIsPublishModalVisible(false);
                    setRefreshKey(2);
                    // if (editorRef.form) {
                    //     editorRef.form.resetFields();
                    // }
                }
            }
        } catch (error) {

        }
    }, [editorRef, messageApi]);

    // 新增：统一的发布处理函数
    const handlePublishClick = useCallback((env) => {
        setIsPublishModalVisible(true);
        setRefreshKey(null);
        setCurrentEnv(env);
        setInitialValues({
            env: env,
        });
    }, []);
    //
    const envOptions = [
        {
            label: <div><CloudUploadOutlined style={{ marginRight: '5px', color: "#11cc88" }} />Publish</div>,
            value: 'PRODUCTION'
        },
        {
            label: <div><CloudUploadOutlined style={{ marginRight: '5px', color: "#889e9e" }} />Pre-Publish</div>,
            value: 'PRE_PRODUCTION'
        }
    ]
    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            { title: 'Version', dataIndex: 'version', width: 80, },
            {
                title: 'Comment', dataIndex: 'remark',
                className: 'cell-name',
            },
            {
                title: 'Publish Type',
                dataIndex: 'env',
                width: 150,
                options: envOptions,
            },
            {
                title: 'User',
                dataIndex: 'createUser',
                width: 250,
            },

            {
                title: 'Time',
                dataIndex: 'createTime',
                width: 200,
            },
            {
                title: 'Result',
                dataIndex: 'status',
                width: 120,
                options: 'publishStatus',
            }
        ];
    }, []);
    const [initialValues, setInitialValues] = useState({});
    const headerButtons = useMemo(() => {
        return [
            {
                key: 'publish',
                text: 'Publish',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => handlePublishClick('PRODUCTION'),
            },
            {
                key: 'prePublish',
                text: 'Pre-Publish',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => handlePublishClick('PRE_PRODUCTION'),
            }
        ];
    }, []);

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Publish');
        // 设置头部按钮
        setButtons(headerButtons);


    }, [setButtons, setCustomPageTitle, navigate, handlePublishClick]);

    //渲染表格组件
    return (
        <div >
            {contextHolder}
            <ConfigurableTable
                refreshKey={refreshKey}
                columns={allColumnDefinitions}
                moduleKey="publish"
                noDataTip="You don't have any publish records yet"
                isInteractionBlockingRowClick={true}
                showColumnSettings={false}
                rowKey={(record) => `${record.version}-${record.createTime}`}
            />
            {/* 发布确认弹框 */}
            <Modal
                title={currentEnv === 'PRODUCTION' ? 'Publish' : 'Pre-Publish'}
                open={isPublishModalVisible}
                onOk={handlePublish}
                width={850}
                onCancel={() => {
                    setIsPublishModalVisible(false);
                    if (editorRef?.form) {
                        editorRef.form.resetFields();
                    }
                }}
                okText="Confirm"
                cancelText="Cancel"
                destroyOnClose
            >
                <div style={{ width: '802px' }}>
                    <CommonEditorForm
                        changeHeader={false}
                        formType="basic"
                        isBack={false}
                        config={{
                            formName: 'Publish',
                            headerButtons,
                            hideTitleOperationName: true
                        }}
                        fields={formFields}
                        initialValues={initialValues}
                        moduleKey='publish'
                        operationName='publish'
                        setFormRef={setEditorRef}
                    />
                </div>
            </Modal>
        </div>
    );
}   