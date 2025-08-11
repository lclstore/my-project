import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable';
import request from "@/request/index.js";
import TagSelector from '@/components/TagSelector/TagSelector';
import { Table, Modal, Select, Form, Spin, message } from "antd";
import FormLabel from '@/components/FormLabel/FormLabel';

export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const location = useLocation()
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行
    const currentSelectedRowKeys = useRef([])
    // 暂存的listData用于判断 按钮展示
    const [listData, setListData] = useState([]);
    const [templateList, setTemplateList] = useState([])
    const [languageOptions, setLanguageOptions] = useState([])
    const [generateForm] = Form.useForm(); // 生成文件表单实例
    const [messageApi, contextHolder] = message.useMessage();
    const [generateModalVisible, setGenerateModalVisible] = useState(false);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [showLangField, setShowLangField] = useState(false); // 添加状态控制Lang字段显示


    //查询条件数组
    const filterSections = useMemo(() => [
        {
            title: 'Gender',
            key: 'genderCodes',
            type: 'multiple',
            options: "BizExerciseGenderEnums",
        },
        {
            title: 'Injured',
            key: 'injuredCodes',
            type: 'multiple',
            options: "BizExerciseInjuredEnums",
        },
        {
            title: 'Duration Range (Min)',
            key: 'durationCodes',
            type: 'multiple',
            options: "BizTemplateDurationEnums",

        },
        {
            title: 'Template ID',
            key: 'templateIdList',
            type: 'multiple',
            options: templateList,
        },
        {
            title: 'File Status',
            key: 'fileStatusList',
            type: 'multiple',
            options: "BizGenerateTaskStatusEnums",
        },
    ], [templateList]);
    // let templateId = new URLSearchParams(location.search).get('id')
    // templateId = templateId ? templateId : null
    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: "Template ID",
                dataIndex: "templateId",
                width: 100,
            },
            {
                title: 'Workout ID', dataIndex: 'id', key: 'id',
                width: 100,
            },
            {
                title: "Duration Range (Min)",
                align: 'center',
                dataIndex: "duration",
                render: ((text, record) => {
                    const duration = record.duration / 60000; // 转换为分钟
                    console.log('duration', duration, text)
                    if (duration * 60 > 30) {
                        return Math.ceil(duration)
                    } else {
                        return Math.floor(duration)
                    }
                })
            },
            { title: "Calorie (Kcal)", dataIndex: "calorie", align: 'center', },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                options: 'BizExerciseGenderEnums',
                width: 150,
            },
            {
                title: 'Injured (Query Param)',
                dataIndex: 'injuredCodes',
                options: 'BizExerciseInjuredEnums',
                // width: 140,
            },
            {
                title: 'Injured (Actual Result)',
                dataIndex: 'injuredActualCodes',
                options: 'BizExerciseInjuredEnums',
                // width: 140,
            },
            {
                title: 'Audio Lang',
                width: 100,
                render: (text, record) => record.audioJsonLanguages,
            },
            {
                title: 'File Status',
                dataIndex: 'fileStatus',
                options: 'BizGenerateTaskStatusEnums',
                width: 100,
            },
        ];
    }, []);

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Auto Workouts');

        // // 设置头部按钮
        // setButtons([
        //     {
        //         key: 'create',
        //         text: 'Add Auto Workouts',
        //         icon: <PlusOutlined/>,
        //         type: 'primary',
        //         onClick: () => router().push('editor'),
        //     }
        // ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);
    const getTableList = useCallback(async (params) => {
        return new Promise(resolve => {
            request.get({
                url: '/template/workout/page', data: { ...params },
                callback: (res) => {
                    resolve(res.data)
                }
            });
        })
    }, [])

    /**
     *
     * 批量生成功能
     */
    // 监听files字段变化
    const handleFilesChange = useCallback((checkedValues = []) => {
        // 确保 checkedValues 是数组
        const values = Array.isArray(checkedValues) ? checkedValues : [];
        const videoFlag = values.includes('Video-M3U8');
        const audioFlag = values.includes('Audio-JSON');
        // 如果选择了 Audio-JSON，显示 Lang 字段
        setShowLangField(audioFlag);
        generateForm.setFieldsValue({ videoFlag, audioFlag });
        // 如果取消选择 Audio-JSON，清空 Lang 字段的值
        if (!audioFlag) {
            generateForm.setFieldsValue({ languageList: [] });
        }
        // 触发表单验证
        generateForm.validateFields(['files', 'languageList']).catch(() => { });
    }, [generateForm]);

    // 监听language字段变化
    const handleLanguageChange = useCallback((checkedValues = []) => {
        // 确保 checkedValues 是数组
        const values = Array.isArray(checkedValues) ? checkedValues : [];
        generateForm.setFieldsValue({ languageList: values });
    }, [generateForm]);

    // 生成文件的表单配置
    const generateFormConfig = useMemo(() => [
        {
            label: 'File',
            name: 'files',
            rules: [{ required: true, message: 'Please Select File' }],
            validateTrigger: ['onChange', 'onSubmit'],
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
            required: true,
            type: 'tagSelector',
            mode: 'multiple',
            placeholder: 'Please Select Lang',
            options: languageOptions,
            visible: showLangField,
            onChange: handleLanguageChange
        }, {
            label: 'Template',
            name: 'templateId',
            required: true,
            rules: [{ required: true, message: 'Please Select Template' }],
            type: 'tagSelector',
            options: templateList
        }

    ], [languageOptions, templateList, showLangField, handleFilesChange, handleLanguageChange]);
    const onSelectChange = useCallback((newSelectedRowKeys) => {
        currentSelectedRowKeys.current = newSelectedRowKeys
        setSelectedRowKeys(newSelectedRowKeys)

    }, []);
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 60,
    };
    // 渲染表单项
    const renderFormItem = (item) => {
        if (item.visible === false) {
            // 对于隐藏字段，渲染Form.Item但不显示
            return (
                <Form.Item
                    label={<FormLabel field={item} />}
                    key={item.name}
                    name={item.name}
                    hidden
                >
                    <input type="hidden" />
                </Form.Item>
            );
        }
        if (item.name === 'languageList' && !showLangField) return null;

        let childNode;
        switch (item.type) {
            case 'tagSelector':
                childNode = <TagSelector backgroundColor="#f8f8f8" key={item.name} {...item} />;
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

    // 处理生成文件
    const handleGenerate = useCallback(async () => {
        try {
            const formValues = await generateForm.validateFields(true);
            formValues.videoFlag = formValues.files.includes('Video-M3U8');
            formValues.audioFlag = formValues.files.includes('Audio-JSON');
            formValues.workoutIdList = currentSelectedRowKeys.current;

            setGenerateLoading(true);
            generate(formValues);
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    }, [generateForm]);

    const expandedRowRender = useCallback((record) => {

        // 定义展开行表格的列配置
        const columns = [
            {
                title: 'Workout Structure Name',
                dataIndex: 'unitName',
            },
            {
                title: 'Image',
                dataIndex: 'coverImgUrl',
                mediaType: 'image',
                // width: 200
            },
            {
                title: 'Name',
                // sorter: true,
                dataIndex: 'name',
                renderName: 'renderNameColumn',
            },
            {
                title: 'Structure Type',
                dataIndex: 'structureTypeCode',
                options: 'BizExerciseStructureTypeEnums',
            },
            
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                options: "BizExerciseGenderEnums",
            },
            {
                title: 'Injured',
                dataIndex: 'injuredCodes',
                options: "BizExerciseInjuredEnums",
            },
        ];

        return (
            <Table
                className='expanded-table'
                columns={columns}
                dataSource={record.videoList}
                pagination={false}
                rowKey="id"
                size="small"
                bordered={false}
            />
        );
    });


    const leftToolbarItems = useMemo(() => [
        {
            key: 'batchCreate',
            label: 'Batch Update Files',
            onClick: () => {
                setGenerateModalVisible(true);
                // 设置表单初始值
                // generateForm.setFieldsValue({
                //     templateId
                // });
            },
            icon: <PlusOutlined />,
            // disabled: selectedRowKeys.length === 0
        }
    ], []);
    const generate = useCallback((params) => {
        return new Promise(resolve => {
            request.post({
                url: `/template/workout/generateFile`,
                point: false,
                data: params,
                callback(res) {
                    if (res?.data?.success) {
                        setGenerateLoading(false);
                        setGenerateModalVisible(false);
                        messageApi.success('Task in progress...');
                        // 成功后清空表单
                        generateForm.resetFields();
                        setShowLangField(false);
                    } else {
                        setGenerateLoading(false);
                        messageApi.error(res.message);
                    }
                }
            })
        })
    })
    // 获取template所有数据
    const getTemplateList = useCallback(() => request.get({
        url: '/template/page',
        data: {
            pageIndex: 1,
            pageSize: 999999
        },
        success(res) {
            const options = res?.data?.data?.map(i => ({ label: `${i.name} (ID:${i.id})`, value: i.id })) || [];
            setTemplateList(options)
        }
    }))
    // 获取语言数据
    const getLanguageList = useCallback(() => request.get({
        url: '/common/language/list',
        success(res) {
            setLanguageOptions(res?.data?.data?.map(i => ({ label: i.toLocaleUpperCase(), value: i })) || [])
        }
    }))
    useEffect(() => {
        getTemplateList()
        getLanguageList()
    }, [])
    //渲染表格组件
    return (
        <>
            {/* Generate Files Modal */}
            <Modal
                title="Batch Update Files"
                open={generateModalVisible}
                onOk={handleGenerate}
                onCancel={() => {
                    setGenerateModalVisible(false);
                    generateForm.resetFields();
                    setShowLangField(false);
                }}
                confirmLoading={generateLoading}
            >
                <Spin spinning={generateLoading} tip="Generating files...">
                    <Form
                        form={generateForm}
                        layout="vertical"
                        style={{ minHeight: '300px' }}
                        initialValues={{
                            templateId: ""
                        }}
                    >
                        {generateFormConfig.map(renderFormItem)}
                    </Form>
                </Spin>
            </Modal>
            {contextHolder}
            <ConfigurableTable
                getListAfer={(val) => setListData(val.data)}
                columns={allColumnDefinitions}
                expandedRowRender={expandedRowRender}
                leftToolbarItems={leftToolbarItems}
                getTableList={getTableList}
                moduleKey="workout"
                operationName="page"
                searchConfig={{
                    placeholder: "Search workout ID...",
                    fieldName: "id",

                }}
                onRowClick={() => { }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </>
    );
}