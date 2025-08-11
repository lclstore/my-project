import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Button, Image } from 'antd';
import { PlusOutlined, } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable';
import UserEditorWithCommon from './Editor';
import { useStore } from "@/store/index.js";
export default function UsersList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const [dataSource, setDataSource] = useState([]);
    const [actionClicked, setActionClicked] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [isEditorModalVisible, setIsEditorModalVisible] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editorActionsRef, setEditorActionsRef] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // 0 表示不刷新 1. 表示当前页面刷新 2. 表示全局刷新
    // 编辑处理
    const handleEdit = useCallback((record) => {
        setEditingUserId(record?.id || null);
        setIsEditorModalVisible(true);
        setRefreshKey(null);// 清空刷新
    }, []);


    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        if (status === 'ENABLED' && ['disable'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['enable'].includes(btnName)) return true;
        return false;
    }, []);

    // 用户单元格渲染
    const UserCell = ({ record }) => {
        const [imgError, setImgError] = useState(false);
        const headImage = useStore(i => i.defaultImg)
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Image
                    src={record.avatar ? record.avatar : headImage}
                    size={36}
                    preview={false}
                    style={{
                        marginRight: 12, color: '#999',
                        width: '36px'
                    }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4'
                    }}>{record.name}</span>
                    <span style={{
                        fontSize: 'var(--font-md-sm)',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                        fontWeight: 400
                    }}>{record.email}</span>
                </div>
            </div>
        );
    };

    const headerButtons = [
        {
            key: 'create',
            text: 'Add',
            icon: <PlusOutlined />,
            type: 'primary',
            onClick: () => handleEdit(),
        }
    ]
    // 表格列定义
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name & Email',
                key: 'nameAndEmail',
                // width: 350,
                visibleColumn: 0,
                render: (record) => <UserCell record={record} />
            },
            {
                title: 'User Type',
                dataIndex: 'type',
                // width: 120,
                visibleColumn: 0,
                options: [
                    {
                        label: 'Admin',
                        value: 'ADMIN',
                    }, {
                        label: 'Normal',
                        value: 'NORMAL',
                    }
                ]
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                options: 'displayStatus',
                // width: 120,
                visibleColumn: 0
            },
            {
                title: 'Create Time',
                dataIndex: 'createTime',
                key: 'createTime',
                showSorterTooltip: false,
                // width: 180,
                visibleColumn: 0,
                render: (createTime) => formatDate(createTime, 'YYYY-MM-DD HH:mm:ss')
            },
            {
                title: 'Create User',
                dataIndex: 'createUser',
                key: 'createUser',
                // width: 350
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                actionButtons: ['enable', 'disable'],
                isShow: isButtonVisible,
            }
        ];
    }, [isButtonVisible]);


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
        if (editorActionsRef && editorActionsRef.triggerSave) {
            const currentRecord = dataSource.find(user => user.id === editingUserId);
            const statusToSave = currentRecord?.status || 'ENABLED'; // 默认为 ENABLED
            let ret = await editorActionsRef.triggerSave(statusToSave, false);// 返回保存结果
            if (ret.success) {
                messageApi.success(ret.message || 'Save successful!');
                setIsEditorModalVisible(false);
                setEditingUserId(null);
                setRefreshKey(editingUserId ? 1 : 2); // 1. 表示当前页面刷新 2. 表示全局刷新
            }
        }
    };


    useEffect(() => {
        setCustomPageTitle && setCustomPageTitle('Users');

        setButtons(headerButtons);
        return () => {
            setButtons([]);
            setCustomPageTitle && setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, handleEdit, refreshKey]);

    useEffect(() => {
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    useEffect(() => {
        if (setEditorActionsRef && editorActionsRef) {
            const formActions = {
                form,
                triggerSave: handleStatusModalConfirmFromHook
            };
            setEditorActionsRef(formActions);
        }
    }, [setEditorActionsRef]);

    return (
        <div className="usersContainer page-list">
            {contextHolder}
            <ConfigurableTable
                refreshKey={refreshKey}
                moduleKey='user'
                columns={allColumnDefinitions}
                showColumnSettings={false}
                onRowClick={handleRowClick}
                searchConfig={{
                    placeholder: "Search name or email...",
                }}
            />
            {/* 编辑弹窗 */}
            <Modal
                title={editingUserId ? "Edit User" : "Add User"}
                open={isEditorModalVisible}
                onCancel={() => setIsEditorModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsEditorModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleModalSubmit}>
                        Confirm
                    </Button>
                ]}
                width={850}
                destroyOnClose
            >
                <UserEditorWithCommon
                    headerButtons={headerButtons}
                    id={editingUserId}
                    setFormRef={setEditorActionsRef}
                />
            </Modal>
        </div>
    );
}