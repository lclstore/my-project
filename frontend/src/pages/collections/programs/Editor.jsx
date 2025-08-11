import React, { useState, useMemo } from 'react';
import { formatDate } from '@/utils';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from "@/request";

import {
    FormOutlined,
    TagsOutlined,
    PictureOutlined,
    VideoCameraOutlined,
    SettingOutlined
} from '@ant-design/icons';

export default function UserEditorWithCommon() {

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
    const initialValues = {
        newStartTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        newEndTime: formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm:ss'),//往后14天

    }

    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue(true);
        form.setFieldsValue({
            coverImgUrl: formValues.coverImgUrl || value,
            detailImgUrl: formValues.detailImgUrl || value,
        });
    }



    const formFields = useMemo(() => [
        {
            label: 'Basic Information',
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
                    required: true,
                    maxLength: 1000,
                    showCount: true,
                },
                {
                    type: 'select',
                    name: 'showTypeCode',
                    label: 'Show Type',
                    required: true,
                    options: 'BizProgramShowTypeEnums',
                },
                {
                    type: 'displayImage',
                    name: 'displayImage',
                    label: '',
                    dependencies: ['showTypeCode'],
                    content: ({ getFieldValue }) => {
                        const CARD = 'https://amber.7mfitness.com/category/image/e45cf328-57dc-4c23-a8cf-ad2e4cf14575.png?name=CARD.png'
                        const HORIZONTAL = 'https://amber.7mfitness.com/category/image/363ba524-6876-4ff2-b14c-b25f77e529c4.jpeg?name=HORIZONTAL.jpeg'
                        const showTypeCode = getFieldValue('showTypeCode');
                        return showTypeCode ? showTypeCode == 'CARD' ? CARD : HORIZONTAL : null
                    },
                    style: {
                        height: '100px',
                    },
                },
                {
                    type: 'numberStepper',
                    name: 'durationWeek',
                    label: 'Duration (Week)',
                    required: true,
                    min: 1,
                    max: 50,
                    step: 1,
                },
                {
                    type: 'dateRange',
                    name: 'timeRange',
                    label: 'New Date',
                    keys: ['newStartTime', 'newEndTime'],
                    required: false,
                },

            ]
        },
        {
            label: 'Image',
            name: 'image',
            icon: <PictureOutlined />,
            fields: [
                {
                    type: 'upload',
                    name: 'coverImgUrl',
                    label: 'Cover Image',
                    style: {
                        width: '100px',
                    },
                    required: true,
                    acceptedFileTypes: 'png,webp',
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    style: {
                        width: '100px',
                    },
                    name: 'detailImgUrl',
                    label: 'Detail Image',
                    required: true,
                    acceptedFileTypes: 'png,webp',
                    onChange: imageUpload
                }

            ]
        },
        {
            label: 'Labels',
            name: 'labels',
            icon: <TagsOutlined />,
            fields: [
                {
                    type: 'select',
                    name: 'difficultyCode',
                    label: 'Difficulty',
                    required: true,
                    options: 'BizExerciseDifficultyEnums',
                }, {
                    type: 'select',
                    name: 'equipmentCode',
                    label: 'Equipment',
                    required: true,
                    options: 'BizProgramEquipmentEnums',
                }
            ]
        },
        {
            label: 'Workouts',
            name: 'Workout',
            icon: <VideoCameraOutlined />,
            isCollapse: true,
            fields: [
                {
                    type: 'list',
                    name: 'workoutList',
                    // renderItemMata: renderItemMata,
                    label: 'Musics',
                    isCollapse: true,
                    emptyPlaceholder: 'Please add workout',
                    formterList: (dataList, formValues) => {
                        return dataList?.map(item => {
                            return {
                                bizMusicId: item.id,
                                displayName: item.name,
                                premium: formValues.premium,
                            }
                        });
                    },
                    dataList: [],
                },
            ]
        }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建



    const saveBeforeTransform = ({ formValues = {} }) => {
        formValues.workoutList = formValues.workoutList?.map(item => item.id);
        return formValues;
    }
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
                displayTitle: 'name',
                displayKeys: [
                    'id',
                    { key: 'status', optionName: 'statusList', hiddenKeyName: true },
                    { key: 'difficultyCode', optionName: 'BizExerciseDifficultyEnums', hiddenKeyName: true }],
                initCommonListData: initCommonListData,
                placeholder: 'Search your content name...',
                filterSections: filterSections,
                title: 'Workouts',
            }}
            moduleKey='program'
            isCollapse={true}
            formType="advanced"
            saveBeforeTransform={saveBeforeTransform}
            enableDraft={true}
            collapseFormConfig={{ isAccordion: false, disableDuplicate: true, disableDuplicatePlaceholder: 'Workout cannot be repeated.' }}
            config={{ formName: 'Programs', title: 'Programs details' }}
            initialValues={initialValues}
        />
    );
} 