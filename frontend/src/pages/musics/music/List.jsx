import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Form, Modal, Button, message } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable';
import UserEditorWithCommon from './Editor';
import { renderNameColumn } from '@/common';
//查询条件数组
const filterSections = [
    {
        title: 'Status',
        key: 'statusList',
        type: 'multiple', // 单选 //multiple 多选
        options: 'statusList'
    }
];
export default function Musics() {
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const [dataSource, setDataSource] = useState([]);
    const [editingMusicId, setEditingMusicId] = useState(null);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [actionClicked, setActionClicked] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [editorActionsRef, setEditorActionsRef] = useState(null);
    const [isEditorModalVisible, setIsEditorModalVisible] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // 0 表示不刷新 1. 表示当前页面刷新 2. 表示全局刷新
    const headerButtons = [
        {
            key: 'create',
            text: 'Add Music',
            icon: <PlusOutlined />,
            type: 'primary',
            onClick: () => {
                sessionStorage.clear();
                handleEdit()
            },
        }
    ]
    // 编辑处理
    const handleEdit = useCallback((record, isDuplicate = false) => {
        setEditingMusicId(record?.id || null);
        setIsEditorModalVisible(true);
        setIsDuplicate(isDuplicate);
        setRefreshKey(null);// 清空刷新
    }, []);

    // 批量创建文件 Modal 状态
    const [isBatchCreateModalVisible, setIsBatchCreateModalVisible] = useState(false); // 批量创建弹窗可见性
    const [batchCreateForm] = Form.useForm(); // 批量创建表单实例

    // 在Modal打开时重置表单
    useEffect(() => {
        if (isBatchCreateModalVisible) {
            batchCreateForm.resetFields();
            batchCreateForm.setFieldsValue({ files: ['Video-M3U8'], lang: ['EN'] }); // 设置默认值
        }
    }, [isBatchCreateModalVisible, batchCreateForm]);
    // 处理行点击
    const handleRowClick = useCallback((record, event) => {
        if (actionClicked) {
            setActionClicked(false);
            return;
        }

        const isActionClick = event.target.closest('.actions-container');
        if (isActionClick) {
            return;
        }

        handleEdit(record);
    }, [actionClicked, handleEdit]);

    // 提交form
    const handleModalSubmit = async () => {
        console.log('editorActionsRef', editorActionsRef)
        if (editorActionsRef && editorActionsRef.triggerSave) {
            console.log('1111111')
            const currentRecord = dataSource.find(user => user.id === editingMusicId);
            const statusToSave = currentRecord?.status || 'ENABLED'; // 默认为 ENABLED
            let ret = await editorActionsRef.triggerSave(statusToSave, false);// 返回保存结果
            if (ret.success) {
                messageApi.success(ret.message || 'Save successful!');
                setIsEditorModalVisible(false);
                setEditingMusicId(null);
                console.log(editingMusicId, 'editingMusicId')
                setRefreshKey(editingMusicId ? 1 : 2); // 1. 表示当前页面刷新 2. 表示全局刷新
            }
        }
    }
    useEffect(() => {
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);
    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {

        const status = record.status;
        //  console.log(status)
        // 简单的状态-按钮映射关系
        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        if (status === 'ENABLED' && ['edit', 'duplicate'].includes(btnName)) return true;
        if (status === 'Premium' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 'Deprecated' && ['duplicate'].includes(btnName)) return true;

        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [

            {
                title: 'Name',
                sorter: true,
                // width: 350,

                dataIndex: 'name',
                render: renderNameColumn
            },
            {
                title: 'Display Name',
                sorter: true,
                // width: 350,

                dataIndex: 'displayName',
                // render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
            },
            {
                title: 'Status',
                dataIndex: 'status',
                sorter: true,

                options: 'displayStatus',
            },
            {
                title: 'Audio', mediaType: 'audio', dataIndex: 'audioUrl',
                width: 240,
            },
            {
                title: 'Actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
                edit: (rowData) => {
                    handleEdit(rowData)
                },
                duplicate: (rowData) => {
                    handleEdit(rowData, true)
                },



            },
        ];
    }, [isButtonVisible]);

    useEffect(() => {
        if (setEditorActionsRef && editorActionsRef) {
            const formActions = {
                // form,
                // triggerSave: handleStatusModalConfirmFromHook
            };
            setEditorActionsRef(formActions);
        }
    }, [setEditorActionsRef]);

    //设置导航栏按钮
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Musics');

        // 设置头部按钮
        setButtons(headerButtons);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);


    //渲染表格
    return (
        <>
            {contextHolder}
            <ConfigurableTable
                refreshKey={refreshKey}
                moduleKey={'music'}
                paddingTop={50}
                columns={allColumnDefinitions}
                onRowClick={handleRowClick}
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
            {/* 编辑弹窗 */}
            <Modal
                title={editingMusicId ? "Edit Music" : "Add Music"}
                open={isEditorModalVisible}
                onCancel={() => setIsEditorModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsEditorModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleModalSubmit}>
                        Save
                    </Button>
                ]}
                width={850}
                destroyOnClose
            >
                <UserEditorWithCommon
                    id={editingMusicId}
                    headerButtons={headerButtons}
                    isDuplicate={isDuplicate}
                    setFormRef={setEditorActionsRef}
                />
            </Modal>
        </>
    );
}   