import React, { useState, useMemo, useEffect, useRef } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from "@/request";
import {

    FormOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';

export default function UserEditorWithCommon() {
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList',
        },
        {
            title: 'Gender',
            key: 'genderCodes',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseGenderEnums'
        },
        {
            title: 'Difficulty',
            key: 'difficultyCodes',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseDifficultyEnums'
        },
        {
            title: 'Position',
            key: 'positionCodes',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExercisePositionEnums',
        },
        {
            title: 'Injured',
            key: 'injuredCodes',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseInjuredEnums'
        },
        {
            title: 'File Status',
            key: 'fileStatusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizGenerateTaskStatusEnums'
        }
    ];
    // 初始用户数据状态--可设默认值
    const initialValues = {}

    let workoutSettingInfo = useRef(null);

    useEffect(() => {
        request.get({
            url: `/workoutSettings/detail`,
            callback: res => {
                workoutSettingInfo.current = res?.data?.data;
                window.sessionStorage.setItem('workoutSettingInfo', JSON.stringify(res?.data?.data || {}));
            }
        });
    }, []);

    const formFields = useMemo(() => [
        {
            label: 'Replace Rules',
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
                    label: 'Rules',
                    name: 'ruleList',
                    type: 'dynamicTableList',
                    tableConfig: {
                        addButtonText: "+ Add a rule",
                        defaultRowValue: { matchKey: null, matchCondition: null, matchValue: null },

                        columns: [
                            {
                                title: 'Match Key',
                                name: 'matchKey',
                                type: 'select',
                                options: 'BizPlanReplaceSettingsRuleMatchKeyEnums',
                                placeholder: 'Select match key',
                                onChangeReset: ['matchValue']
                            },
                            {
                                title: 'Match Condition',
                                name: 'matchCondition',
                                type: 'select',
                                options: 'BizPlanReplaceSettingsRuleMatchConditionEnums',
                                placeholder: 'Select condition',
                            },
                            {
                                title: 'Match Value',
                                name: 'matchValue',
                                type: 'select',
                                placeholder: 'Select match value',
                                options: "BizPlanUserEnums",
                                transformOptions: ({ fieldName, options }) => {
                                    if (fieldName === 'matchValue') {
                                        return options.map(i => ({
                                            ...i,
                                            label: i.name,
                                            value: i.code
                                        }));
                                    }
                                    return options;
                                },
                                dependsOn: {
                                    field: 'matchKey',
                                    mapping: {
                                        "USER": "BizPlanUserEnums",
                                        "GENDER": "BizSoundGenderEnums"
                                    }
                                }
                            },
                        ]
                    },
                    rules: [
                        {
                            validator: async (_, value) => {
                                if (value.find(i => !i.matchKey || !i.matchCondition || !i.matchValue)) {
                                    return Promise.reject('Please Fill in the rules completely');
                                }
                                return Promise.resolve();
                            },
                            validateTrigger: ['change']
                        },
                    ]
                },
                {
                    type: 'textarea',
                    name: 'description',
                    label: 'Description',
                    maxLength: 1000,
                    showCount: true,
                },
            ]
        },
        {

            label: 'Replace Workouts',
            name: 'workout',
            isCollapse: true,
            // systemCount: 1,
            isShowAdd: false,
            icon: <VideoCameraOutlined />,
            fields: [
                {
                    type: 'list',
                    name: 'workoutList',
                    dataList: [],
                    emptyPlaceholder: 'Please add workouts',
                    label: 'Workouts',
                    required: true,
                },
            ]

        },
        // }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建


    const initCommonListData = (params) => {
        console.log('initCommonListData', params);

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
        <>
            <CommonEditorForm
                fields={formFields}
                saveBeforeTransform={({ formValues }) => {
                    // 没有填写完全的过滤掉
                    formValues.ruleList && (formValues.ruleList = formValues.ruleList.filter(i => i.matchKey && i.matchCondition && i.matchValue));
                    formValues.workoutList && (formValues.workoutList = formValues.workoutList.map(i => i.id));
                    return formValues;
                }}
                commonListConfig={{
                    displayTitle: 'name',
                    displayKeys: ['id', { key: 'status', optionName: 'statusList', hiddenKeyName: true }, { key: 'difficultyCode', optionName: 'BizExerciseDifficultyEnums', hiddenKeyName: true }],
                    renderKey: {
                        imgKey: 'coverImgUrl',
                    },
                    initCommonListData: initCommonListData,
                    placeholder: 'Search name or ID...',
                    filterSections: filterSections,
                    title: 'Workouts',
                }}
                moduleKey='planReplaceSettings'
                isCollapse={true}
                formType="advanced"
                enableDraft={true}
                fieldsToValidate={['name', 'birthday']}
                config={{ formName: 'Replace Workout' }}
                collapseFormConfig={{ defaultActiveKeys: 'all', isAccordion: false, }}
                initialValues={initialValues}
            />
        </>
    );
}