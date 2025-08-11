import React, { useMemo } from 'react';

import CommonEditorForm from '@/components/CommonEditorForm';
import request from "@/request";

import {
    ThunderboltOutlined,
    FormOutlined,
    PictureOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';

/**
 * 分类编辑器组件
 * 用于创建和编辑内容分类
 */
export default function UserEditorWithCommon() {

    // 筛选部分配置
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList'
        }, {
            title: 'Difficulty',
            key: 'difficultyCodes',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseDifficultyEnums'
        },

    ];

    /**
     * 图片上传处理函数
     * 上传图片后同时设置封面和详情图片
     */
    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue(true);
        form.setFieldsValue({
            coverImgUrl: formValues.coverImgUrl || value,
            detailImgUrl: formValues.detailImgUrl || value,
        });
    }


    // 表单字段配置，使用useMemo优化性能
    const formFields = useMemo(() => [
        {
            label: 'Basic Information', // 基本信息部分
            name: 'basicInfo',
            icon: <FormOutlined />,
            fields: [

                {
                    type: 'input',
                    name: 'name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    showCount: true,
                    clickEditor: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- Name must be unique.</div>
                        </>
                    },
                },
                {
                    type: 'textarea',
                    name: 'description',
                    label: 'Description',
                    maxLength: 1000,
                    showCount: true,
                },
                {
                    type: 'select',
                    name: 'groupCode',
                    label: 'Group',
                    required: true,
                    options: 'BizCategoryGroupEnums',
                    tooltipInfo: () => {
                        return <>
                            <div>- Groups A–G are used only for grouping — the names have no specific meaning.</div>
                        </>
                    },
                },
                {
                    type: 'select',
                    name: 'showInPage',
                    label: 'Show on Page?',
                    required: true,
                    options: [
                        { label: "Yes", value: 1 },
                        { label: "No", value: 0 },
                    ],
                    tooltipInfo: () => {
                        return <>
                            <div>- Yes: The category is shown on the page.</div>
                            <div>- No: The category is hidden from the page but may appear in other forms.</div>
                        </>
                    },
                }
            ]
        },
        {
            label: 'Image', // 图片部分
            name: 'Image',
            icon: <PictureOutlined />,
            fields: [
                {
                    type: 'upload',
                    name: 'coverImgUrl',
                    label: 'Cover Image',
                    required: true,
                    style: {
                        width: '100px',
                    },
                    acceptedFileTypes: 'png,webp',
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'detailImgUrl',
                    label: 'Detail Image',
                    style: {
                        width: '100px',
                    },
                    required: true,
                    acceptedFileTypes: 'png,webp',
                    onChange: imageUpload
                },
            ]
        },
        {
            label: 'Workout', // 锻炼计划部分
            name: 'workout',
            isCollapse: true,
            icon: <VideoCameraOutlined />,
            fields: [
                {
                    type: 'list',
                    name: 'workoutList',
                    label: 'Workout',
                    emptyPlaceholder: 'Please add workouts',
                    rules: [
                        { required: true, message: 'Please add at least one music' },
                    ]
                },
            ]
        }
    ], []);


    /**
     * 保存前数据转换
     * 将workoutList转换为ID数组
     */
    const saveBeforeTransform = ({ formValues = {} }) => {
        formValues.workoutList = formValues.workoutList?.map(item => item.id);
        return formValues;
    }


    /**
     * 初始化通用列表数据
     * 获取锻炼计划列表数据
     */
    const initCommonListData = (params) => {
        return new Promise(resolve => {
            request.get({
                url: `/workout/page`,
                load: false,
                data: params,
                callback: res => resolve(res?.data)
            });
        })
    }

    return (
        <CommonEditorForm
            fields={formFields}
            commonListConfig={{
                displayTitle: 'name', // 显示的标题字段
                displayKeys: ['id', { key: 'status', optionName: 'statusList', hiddenKeyName: true }, { key: 'difficultyCode', optionName: 'BizExerciseDifficultyEnums', hiddenKeyName: true }],
                initCommonListData: initCommonListData,
                placeholder: 'Search name or ID...',
                filterSections: filterSections,
                title: 'Workouts',
            }}
            moduleKey='category' // 模块标识
            isCollapse={true} // 是否可折叠
            formType="advanced" // 高级表单类型
            saveBeforeTransform={saveBeforeTransform}
            enableDraft={true} // 启用草稿功能
            config={{ formName: 'Collections', title: 'Category details', }}
            collapseFormConfig={{ isAccordion: false, disableDuplicate: true, disableDuplicatePlaceholder: 'Workout cannot be repeated.' }}
            initialValues={{
                showInPage: 1,
                groupCode: "GROUPA"
            }}
        />
    );
} 