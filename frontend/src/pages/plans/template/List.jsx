import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Checkbox, Modal, Button } from 'antd';
import {
    PlusOutlined,
    VideoCameraAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable';
import { useStore } from "@/store/index.js";
import { router } from "@/utils/index.js";
import request from "@/request/index.js";
import { useImmer } from "use-immer";

export default function WorkoutsList() {
    const [generateModal, updateGenerateModal] = useImmer({
        id: null,
        loading: false,
        cleanWorkout: 0,
        modalShow: false
    })
    const [refreshKey, setRefreshKey] = useState(0);
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const optionsBase = useStore(state => state.optionsBase)
    console.log("optionsBase", optionsBase)
    //查询条件数组
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: "statusList",
        },
        {
            title: 'Duration Range(Min)',
            key: 'durationCodeList',
            type: 'multiple',
            options: "BizTemplateDurationEnums",
        }
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name',
                sorter: true,
                showSorterTooltip: false,
                dataIndex: 'name',
                // width: 350,
                renderName: 'renderNameColumn',
            },
            { title: "Duration Range (Min)", dataIndex: "durationCode", options: 'BizTemplateDurationEnums', sorter: true },
            {
                title: 'Status',
                dataIndex: 'status',
                sorter: true,
                options: 'displayStatus',
                // width: 120,
            },
            { title: "Workout Num", dataIndex: "workoutCount" },
            {
                title: "Generate Status",
                dataIndex: "generateStatus",
                options: 'publishStatus',
            },
            {
                title: 'Actions',
                fixed: 'right',
                width: 70,
                dataIndex: 'actions',
                align: 'center',
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'generate', 'delete'],
                customButtons: [
                    {
                        key: "generate",
                        click: ({ selectList }) => {
                            updateGenerateModal(draft => {
                                draft.id = selectList[0].id
                                draft.modalShow = true
                            })
                        }
                    }
                ],
                isShow(record, btnName) {
                    const status = record.status;
                    // 简单的状态-按钮映射关系
                    if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
                    if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
                    if (status === 'ENABLED' && ['disable', 'generate', 'duplicate'].includes(btnName)) return true;
                    return false;
                }
            },
        ];
    }, []);
    // 生成方法
    const generate = async () => {
        return new Promise(resolve => {
            request.post({
                url: `/template/generate`,
                data: generateModal,
                point: true,
                callback() {
                    resolve()
                }
            })
        })
    }

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Templates');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Template',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => {
                    sessionStorage.clear();
                    router().push('editor')
                },
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    //渲染表格组件
    return (
        <>
            <ConfigurableTable
                columns={allColumnDefinitions}
                refreshKey={refreshKey}
                moduleKey="template"
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
            <Modal
                title="Generate"
                styles={{ content: { width: '300px' } }}
                open={generateModal.modalShow}
                footer={[
                    <Button key="cancel" onClick={() => updateGenerateModal(draft => void (draft.modalShow = false))}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" loading={generateModal.loading} onClick={
                        () => {
                            updateGenerateModal(draft => {
                                draft.loading = true
                            })
                            generate().then(() => {
                                updateGenerateModal(draft => {
                                    setRefreshKey(2)
                                    draft.modalShow = false
                                    draft.loading = false
                                })
                            })
                        }
                    }>
                        Generate
                    </Button>
                ]}
                onCancel={() => updateGenerateModal(draft => void (draft.modalShow = false))}
            >
                <Checkbox onChange={() => updateGenerateModal(draft => void (draft.cleanWorkout = generateModal.cleanWorkout === 0 ? 1 : 0))}>Clear the existing workout</Checkbox>
            </Modal>
        </>
    );
}   