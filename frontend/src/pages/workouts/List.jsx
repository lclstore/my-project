import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Modal, message, Form, Select, Spin } from 'antd';
import TagSelector from '@/components/TagSelector/TagSelector';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDateRange } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable';
import request from "@/request/index.js";
import FormLabel from '@/components/FormLabel/FormLabel';
import { renderNewTag, renderLockIcon } from '@/common';
export default function WorkoutsList() {

    // 定义筛选器配置
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple',
            options: 'statusList',
        },
        {
            title: 'Gender',
            key: 'genderCodes',
            type: 'multiple',
            options: 'BizExerciseGenderEnums'
        },
        {
            title: 'Difficulty',
            key: 'difficultyCodes',
            type: 'multiple',
            options: 'BizExerciseDifficultyEnums'
        },
        {
            title: 'Position',
            key: 'positionCodes',
            type: 'multiple',
            options: 'BizExercisePositionEnums',
        },
        {
            title: 'Injured',
            key: 'injuredCodes',
            type: 'multiple',
            options: 'BizExerciseInjuredEnums'
        },
        {
            title: 'File Status',
            key: 'fileStatusList',
            type: 'multiple',
            options: 'BizGenerateTaskStatusEnums'
        }
    ];
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行
    const [messageApi, contextHolder] = message.useMessage();
    const [languageOptions, setLanguageOptions] = useState([]);
    const tableRef = useRef(null);
    // 暂存的listData用于判断 按钮展示
    const [listData, setListData] = useState([]);
    // 批量创建文件 Modal 状态
    const [isBatchCreateModalVisible, setIsBatchCreateModalVisible] = useState(false); // 批量创建弹窗可见性
    const [batchCreateForm] = Form.useForm(); // 批量创建表单实例
    const [batchCreateLoading, setBatchCreateLoading] = useState(false); // 批量创建提交加载状态
    const [showLangField, setShowLangField] = useState(false); // 添加状态控制Lang字段显示

    // 2. 回调函数定义 - 用户交互和事件处理
    /**
     * 批量创建文件按钮点击处理
     * 显示弹窗
     */
    const handleBatchCreateFile = useCallback(() => {
        setIsBatchCreateModalVisible(true);
    }, []);

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 简单的状态-按钮映射关系
        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [

            {
                title: 'Cover Image',
                width: 120,
                renderNewTag: renderNewTag,
                renderLockIcon: renderLockIcon,
                mediaType: 'image',
                dataIndex: 'coverImgUrl',
                visibleColumn: 0
            },
            {
                title: 'Name', dataIndex: 'name', width: 350, visibleColumn: 0, sorter: true,
                renderName: 'renderNameColumn'
            },
            {
                title: 'Status',
                dataIndex: 'status',
                sorter: true,
                width: 120,
                visibleColumn: 0,
                options: 'displayStatus',
            },

            {
                title: 'Premium',
                align: 'center',
                dataIndex: 'premium',
                width: 120,
                options: 'defaultStatus',
                sorter: true,
                visibleColumn: 2,
                renderName: 'renderSwitchColumn'
            },
            {
                title: 'Duration (Min)',
                align: 'center',
                dataIndex: 'duration',
                width: 150,
                visibleColumn: 2,
                render: (duration) => {
                    if (!duration) return 0;
                    //四舍五入单位毫秒转分
                    duration = Math.round(duration / 1000 / 60);
                    return duration;
                }
            },
            {
                title: 'Calorie (Kcal)',
                align: 'center',
                dataIndex: 'calorie',
                width: 150,
                visibleColumn: 2,
                // 向上取整
                render: (calorie) => {
                    if (!calorie) return 0;
                    return Math.ceil(calorie);
                }
            },
            {
                title: 'Difficulty',
                dataIndex: 'difficultyCode',
                sorter: true,
                width: 120,
                visibleColumn: 2,
                options: 'BizExerciseDifficultyEnums',
            },

            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
                width: 120,
                visibleColumn: 1,
                options: 'BizExerciseGenderEnums',
            },

            {
                title: 'Position',
                dataIndex: 'positionCode',
                sorter: true,
                width: 120,
                visibleColumn: 1,
                options: 'BizExercisePositionEnums',
            },
            {
                title: 'Injured',
                dataIndex: 'injuredCodes',
                width: 160,
                visibleColumn: 1,
                options: 'BizExerciseInjuredEnums',
            },
            {
                title: 'New Date',
                render: (text, record) => {
                    return formatDateRange(record.newStartTime, record.newEndTime);
                },
                width: 220,
                visibleColumn: 1
            },
            {
                title: 'Audio Lang',
                dataIndex: 'audioJsonLanguages',
                width: 120,
                visibleColumn: 1,
            },
            {
                title: 'File Status', dataIndex: 'fileStatus',
                width: 120,
                ellipsis: true,
                options: 'fileStatus',
                visibleColumn: 1
            },
            {
                title: 'Actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['edit', 'duplicate', 'enable', 'deprecate', 'delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
            },
        ];
    }, [isButtonVisible]);

    /**
     * 处理行选择变化
     * 用于批量操作功能
     */
    const onSelectChange = useCallback((newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    }, []);



    /**
     * 批量创建 Modal 取消处理
     */
    const handleBatchCreateModalCancel = useCallback(() => {
        setIsBatchCreateModalVisible(false);
        // 清空表单值
        batchCreateForm.resetFields();
        // 重置 Lang 字段显示状态
        setShowLangField(false);
    }, []);

    /**
     * 批量创建 Modal 确认处理
     */
    const handleBatchCreateModalOk = useCallback(async () => {
        try {
            const values = await batchCreateForm.validateFields(true);
            setBatchCreateLoading(true);
            // 更新 videoFlag 和 audioFlag
            values.videoFlag = values.files.includes('Video-M3U8');
            values.audioFlag = values.files.includes('Audio-JSON');
            values.workoutIdList = selectedRowKeys;
            request.post({
                url: '/workout/generateFile',
                point: false,
                data: values,
                callback(res) {
                    if (res.data.success) {
                        setBatchCreateLoading(false);
                        setIsBatchCreateModalVisible(false);
                        messageApi.success('Task in progress...');
                        // 成功后清空表单
                        batchCreateForm.resetFields();
                        setShowLangField(false);
                    } else {
                        messageApi.error(res.data.message);
                    }
                }
            })
        } catch (errorInfo) {
            console.log('表单验证失败:', errorInfo);
        }
    }, [batchCreateForm, selectedRowKeys]);

    // 监听files字段变化
    const handleFilesChange = (checkedValues = []) => {
        // 确保 checkedValues 是数组
        const values = Array.isArray(checkedValues) ? checkedValues : [];
        const videoFlag = values.includes('Video-M3U8');
        const audioFlag = values.includes('Audio-JSON');
        // 如果选择了 Audio-JSON，显示 Lang 字段
        setShowLangField(audioFlag);
        batchCreateForm.setFieldsValue({ videoFlag, audioFlag });
        // 如果取消选择 Audio-JSON，清空 Lang 字段的值
        if (!audioFlag) {
            batchCreateForm.setFieldsValue({ languageList: [] });
        }
        // 触发表单验证
        batchCreateForm.validateFields(['files', 'languageList'])
    };
    const handleLanguageChange = (checkedValues = []) => {
        // 确保 checkedValues 是数组
        const values = Array.isArray(checkedValues) ? checkedValues : [];
        batchCreateForm.setFieldsValue({ languageList: values });
    };

    // 7. 副作用 - 组件生命周期相关处理
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Workout');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create Workout',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => {
                    sessionStorage.clear();
                    navigate('/workouts/editor')
                },
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    /**
     * 左侧工具栏按钮定义
     */
    const leftToolbarItems = useMemo(() => ([
        {
            key: 'batchCreate',
            label: 'Batch Update Files',
            onClick: handleBatchCreateFile,
            icon: <PlusOutlined />,
        }
    ]), [handleBatchCreateFile, selectedRowKeys, listData]);
    // 获取语言数据
    const getLanguageOptions = useCallback(() => request.get({
        url: '/common/language/list',
        point: false,
        callback(res) {
            setLanguageOptions(res?.data?.data?.map(i => ({ label: i.toLocaleUpperCase(), value: i })) || [])
        }

    }))
    /**
     * 行选择配置
     */
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 60,
    };

    useEffect(() => {
        getLanguageOptions(); // 获取语言列表数据
    }, []);

    // 定义表单配置项
    const formConfig = useMemo(() => [
        {
            label: 'File',
            name: 'files',
            rules: [{ required: true, message: 'Please Select File' }],
            validateTrigger: ['onSubmit'],
            type: 'tagSelector',
            mode: 'multiple',
            required: true,
            options: [
                { label: 'Video File (M3U8)', value: 'Video-M3U8' },
                { label: 'Audio File (JSON)', value: 'Audio-JSON' }
            ],
            onChange: handleFilesChange

        },
        {
            label: 'Lang',
            name: 'languageList',
            rules: [{ required: true, message: 'Please Select Lang' }],
            validateTrigger: ['onChange'],
            type: 'tagSelector',
            visible: showLangField,
            required: true,
            mode: 'multiple',
            placeholder: 'Please Select Lang',
            options: languageOptions,
            onChange: handleLanguageChange
        }
    ], [showLangField, handleFilesChange]);

    // 渲染表单项
    const renderFormItem = (item) => {
        if (item.visible === false) return null;
        let childNode;
        switch (item.type) {
            case 'tagSelector':
                childNode = <TagSelector backgroundColor="#f8f8f8" key={item.name}  {...item} />;
                break;
            case 'select':
                childNode = <Select {...item.props} />;
                break;
            default:
                childNode = null;
        }

        return (
            <Form.Item
                key={item.name}
                label={<FormLabel field={item} />}
                name={item.name}
                rules={item.rules}
                style={{ marginBottom: 24, minHeight: item.height || '' }}
                validateTrigger={item.validateTrigger}
            >
                {childNode}
            </Form.Item>
        );
    };


    return (
        <div className="workoutsContainer page-list">
            {contextHolder}
            <ConfigurableTable
                ref={tableRef}
                getListAfer={(val) => setListData(val.data)}
                open={isBatchCreateModalVisible}
                onOk={handleBatchCreateModalOk}
                onCancel={handleBatchCreateModalCancel}
                rowSelection={rowSelection}
                columns={allColumnDefinitions}
                leftToolbarItems={leftToolbarItems}
                moduleKey="workout"
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={true}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />

            {/* 添加批量创建文件的 Modal */}
            <Modal
                title="Batch Update Files"
                open={isBatchCreateModalVisible}
                onOk={handleBatchCreateModalOk}
                onCancel={handleBatchCreateModalCancel}
                confirmLoading={batchCreateLoading}
            >
                <Spin spinning={batchCreateLoading} tip="Generating files...">
                    <Form

                        style={{ minHeight: '200px' }}
                        form={batchCreateForm}
                        layout="vertical"
                    >
                        {formConfig.map(renderFormItem)}
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
}   