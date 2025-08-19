import React, { useState, useMemo, useEffect, useRef } from 'react';
import { formatDate } from '@/utils/index';
import { message } from 'antd';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from "@/request";
import {
    ThunderboltOutlined,
    FormOutlined,
    PictureOutlined,
    VideoCameraOutlined
} from '@ant-design/icons';

export default function UserEditorWithCommon() {
    const [messageApi, contextHolder] = message.useMessage();
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList',
        },
        {
            title: 'Structure Type',
            key: 'structureTypeCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseStructureTypeEnums'
        },
        {
            title: 'Gender',
            key: 'genderCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseGenderEnums'
        },
        {
            title: 'Difficulty',
            key: 'difficultyCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseDifficultyEnums'
        },
        {
            title: 'Equipment',
            key: 'equipmentCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseEquipmentEnums'
        },
        {
            title: 'Position',
            key: 'positionCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExercisePositionEnums',
        },
        {
            title: 'Injured',
            key: 'injuredCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseInjuredEnums'
        },

    ];
    // 初始用户数据状态--可设默认值
    const initialValues = {
        premium: 0,
        genderCode: 'MALE',
        injuredCodes: ['NONE'],
        difficultyCode: 'BEGINNER',
        positionCode: 'SEATED',
        newStartTime: formatDate(new Date(Date.now()), 'YYYY-MM-DD HH:mm:ss'),
        newEndTime: formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm:ss'),//往后14天
    }

    let workoutSettingInfo = useRef(null);


    useEffect(() => {
        request.get({
            url: `/workoutSettings/detail`,
            callback: res => {
                // setWorkoutSettingInfo(res?.data?.data || {});
                workoutSettingInfo.current = res?.data?.data;
                window.sessionStorage.setItem('workoutSettingInfo', JSON.stringify(res?.data?.data || {}));
            }
        });
    }, []);

    /**
    * 自动计算运动总时长（单位：分钟，四舍五入）
    * @param {Array} [groupList] - 可选传入的运动组数据
    * @returns {number} 运动总时长（分钟）
    */
    const calculateWorkoutDuration = (groupList = []) => {

        // 获取配置
        workoutSettingInfo.current = workoutSettingInfo.current || JSON.parse(window.sessionStorage.getItem('workoutSettingInfo') || '{}');
        const config = workoutSettingInfo.current;
        if (!Array.isArray(groupList) || groupList.length === 0 || !config) return 0;
        // 获取第一个运动组的第一个运动
        const firstExercise = groupList.find(g => g.exerciseList?.length > 0)?.exerciseList?.[0] || { frontVideoUrlDuration: 0 };
        const frontVideoUrlDuration = (firstExercise.frontVideoUrlDuration || 0) / 1000;
        const previewVideoReps = Number(config.previewVideoReps) || 0;
        const executionVideoReps = Number(config.executionVideoReps) || 0;
        const introVideoReps = Number(config.introVideoReps) || 0;

        // 介绍视频总时长
        const introDuration = frontVideoUrlDuration * introVideoReps;

        let actionTotalDuration = 0;

        groupList.forEach(group => {
            if (!Array.isArray(group.exerciseList) || typeof group.structureRound !== 'number') return;

            group.exerciseList.forEach(exercise => {
                const durSec = (exercise.frontVideoUrlDuration || 0) / 1000;
                const previewDuration = durSec * previewVideoReps;
                const executionDuration = durSec * executionVideoReps;
                const totalDuration = group.structureRound * (previewDuration + executionDuration);
                actionTotalDuration += totalDuration;
            });
        });

        // 总时长，单位分钟，四舍五入
        const totalMinutes = Math.round((introDuration + actionTotalDuration) / 60);
        return Math.max(0, totalMinutes);
    };

    /**
  * 自动计算总卡路里（单位 kcal）
  * @param {Array} [exerciseGroupList] - 可选传入的运动组数据
  * @returns {number} 卡路里总值（向上取整）
  */
    const calculateWorkoutCalories = (exerciseGroupList = []) => {
        // 确保配置存在
        workoutSettingInfo.current = workoutSettingInfo.current || JSON.parse(window.sessionStorage.getItem('workoutSettingInfo') || '{}');
        const config = workoutSettingInfo.current;
        // 检查基础参数
        if (!config || !Array.isArray(exerciseGroupList) || exerciseGroupList.length === 0) {
            return 0;
        }
        const executionReps = Number(config.executionVideoReps) || 0; //执行视频重复次数

        // 累加卡路里
        let totalCalorie = 0;
        exerciseGroupList.forEach(group => {
            if (!Array.isArray(group.exerciseList) || typeof group.structureRound !== 'number') return;
            group.exerciseList.forEach(exercise => {
                if (typeof exercise?.met !== 'number') return;
                const frontVideoSeconds = (exercise.frontVideoUrlDuration || 0) / 1000;
                const executionDuration = frontVideoSeconds * executionReps;
                const calories = executionDuration * group.structureRound * exercise.met * 75 / 3600;
                totalCalorie += calories;
            });
        });
        // 向上取整并限制最小为 0
        const finalCalorie = Math.max(0, Math.ceil(totalCalorie));
        return finalCalorie;
    };


    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue();
        form.setFieldsValue({
            coverImgUrl: formValues.coverImgUrl || value,
            detailImgUrl: formValues.detailImgUrl || value,
            thumbnailImgUrl: formValues.thumbnailImgUrl || value,
            completeImgUrl: formValues.completeImgUrl || value,
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
                    maxLength: 1000,
                    showCount: true,
                },
                {
                    type: 'select',
                    name: 'genderCode',
                    label: 'Gender',
                    required: true,
                    options: 'BizExerciseGenderEnums'
                },

                {
                    type: 'select',
                    name: 'difficultyCode',
                    label: 'Difficulty',
                    required: true,
                    options: 'BizExerciseDifficultyEnums'
                },
                {
                    type: 'select',
                    name: 'positionCode',
                    label: 'Position',
                    required: true,
                    options: 'BizExercisePositionEnums'
                },
                {
                    type: 'select',
                    name: 'injuredCodes',
                    label: 'Injured',
                    mode: 'multiple',
                    required: true,
                    options: 'BizExerciseInjuredEnums',
                    onChange: (value, form) => {
                        if (value.length === 2 && value[0] === 'NONE') {
                            form.setFieldValue('injuredCodes', value.filter(item => item !== 'NONE'));
                            return;
                        }
                        if (value.includes('NONE') && value.length > 1) {
                            form.setFieldValue('injuredCodes', ['NONE']);
                            return;
                        }
                        form.setFieldValue('injuredCodes', value);
                    },
                },
                {
                    type: 'select',
                    name: 'premium',
                    label: 'Premium',
                    options: [
                        { label: 'Yes', value: 1 },
                        { label: 'No', value: 0 },
                    ],
                    required: true,
                },
                {
                    type: 'dateRange',
                    name: 'timeRange',
                    label: 'New Date',
                    keys: ['newStartTime', 'newEndTime'],
                    required: false,
                },
                {
                    type: 'input',
                    name: 'duration',
                    placeholder: 'Auto-updated based on selected exercise.',
                    tooltip: 'Auto-updated based on selected exercise.',
                    tooltipPlacement: 'right',
                    label: 'Duration (Min)',
                    disabled: true,
                    required: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- Auto-updated based on selected exercise.</div>
                            <div>- Workout duration = Intro duration + sum of exercise durations, rounded to the nearest minute (&lt;30s down, ≥30s up).</div>
                        </>
                    }
                },
                {
                    type: 'input',
                    placeholder: 'Auto-updated based on selected exercise.',
                    name: 'calorie',
                    tooltip: 'Auto-updated based on selected exercise.',
                    tooltipPlacement: 'right',
                    label: 'Calorie (Kcal)',
                    disabled: true,
                    required: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- Auto-updated based on selected exercise.</div>
                            <div>- Workout calories = sum of exercise calories, rounded up.</div>
                            {/* <div>- Exercise calories = Execution duration × MET × 75 ÷ 3600 × Rounds.</div> */}
                        </>
                    }
                },
            ]
        },
        {
            label: 'Image',
            name: 'ImageInfo',
            icon: <PictureOutlined />,
            fields: [
                {
                    type: 'upload',
                    name: 'coverImgUrl',
                    label: 'Cover Image',
                    style: {
                        width: '100px',
                    },
                    acceptedFileTypes: 'png,webp',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'detailImgUrl',
                    label: 'Detail Image',
                    style: {
                        width: '100px',
                    },
                    acceptedFileTypes: 'png,webp',
                    required: true,
                    onChange: imageUpload
                },
            ]
        },

        {

            title: 'Structure',
            label: 'Workout Structure',
            name: 'exerciseGroupList',
            displayName: 'name',
            // addText: '自定义按钮文字',
            systemCount: 1,
            isShowAdd: true,
            isGroup: true,
            icon: <VideoCameraOutlined />,
            fields: [

                {
                    type: 'input',
                    name: 'structureName',
                    label: 'Name',
                    flex: 1,
                    defaultInitialValue: '',
                    required: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- Workouts can have one or more structures (groups/units). Set the name here.</div>
                        </>
                    },
                },
                {
                    type: 'numberStepper',
                    min: 1,
                    max: 5,
                    step: 1,
                    defaultInitialValue: 1,
                    width: '180px',
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'structureRound', // 修改字段名避免重复
                    label: 'Rounds',
                    tooltipInfo: () => {
                        return <>
                            <div>- Workouts can have one or more structures (groups/units). Set Rounds here.</div>
                        </>
                    },
                    required: true,
                },
                {
                    type: 'list',
                    defaultInitialValue: [],
                    name: 'exerciseList',
                    emptyPlaceholder: 'Please add exercises',
                    label: 'Exercises',
                    rules: [{
                        required: true,
                        message: 'Please add at least one exercise',
                    }]

                },
            ]

        }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建



    const initCommonListData = (params) => {
        console.log('initCommonListData', params);

        return new Promise(resolve => {
            request.get({
                url: `/exercise/page`,
                load: false,
                data: params,
                callback: res => resolve(res?.data)
            });
        })
    }

    // 更新运动时长和卡路里
    const updateWorkoutDurationAndCalorie = (form) => {
        const data = form.getFieldsValue(true);
        const exerciseGroupList = data.exerciseGroupList || [];
        let workoutDuration = calculateWorkoutDuration(exerciseGroupList);
        let workoutCalorie = calculateWorkoutCalories(exerciseGroupList);
        workoutDuration && form.setFieldValue('duration', workoutDuration)
        workoutCalorie && form.setFieldValue('calorie', workoutCalorie)
    }
    const saveBeforeTransform = ({ formValues }) => {
        formValues.exerciseGroupList = formValues.exerciseGroupList.filter(item => item.exerciseList && item.exerciseList.length).map(item => {
            return {
                structureName: item.structureName,
                structureRound: item.structureRound,
                exerciseList: item.exerciseList?.map(item => item.id)
            }
        })


        return formValues;
    }

    /**
     * 验证表单数据
     * @param {Object} form - 表单数据对象
     * @returns {boolean} - 验证结果
     */
    const formValidate = ({ formValues = {} }) => {
        const structureNameSet = new Set(); // 结构名唯一性验证
        const currentGenderCode = formValues.genderCode; // 当前性别
        const exerciseGroupList = formValues.exerciseGroupList || []; // 运动组列表
        for (let index = 0; index < exerciseGroupList.length; index++) {
            const exerciseList = exerciseGroupList[index].exerciseList || [];
            const structureName = exerciseGroupList[index].structureName;

            // ✅ 结构名唯一性验证
            if (structureNameSet.has(structureName)) {
                messageApi.error(`Structure names cannot be repeated.`);
                return false;
            }
            structureNameSet.add(structureName);

            // ✅ 性别一致性验证
            const hasGenderMismatch = exerciseList.some(ex => ex.genderCode !== currentGenderCode);
            if (hasGenderMismatch) {
                messageApi.error(`Can only include exercises for one gender.`);
                return false;
            }

            // ✅ 左右配对验证
            const pairMap = new Map();

            for (const ex of exerciseList) {
                const match = ex.name.match(/\((Left|Right)\)/);
                if (!match) continue;

                const side = match[1];
                const baseName = ex.name.replace(/\s*\((Left|Right)\)/, '');

                if (!pairMap.has(baseName)) {
                    pairMap.set(baseName, { Left: false, Right: false });
                }
                pairMap.get(baseName)[side] = true;
            }

            const unpaired = Array.from(pairMap.entries())
                .filter(([, sides]) => sides.Left !== sides.Right)
                .map(([name]) => name);

            if (unpaired.length > 0) {
                messageApi.error(`You need to choose left and right exercises in pairs:【${unpaired.join(', ')}】`);
                return false;
            }
        }

        return true;
    };
    //监控表单字段变化
    const watchFormFieldChange = {
        exerciseGroupList: (value, form) => {
            updateWorkoutDurationAndCalorie(form)
        }
    }
    const displayKeys = ['id', { key: 'status', optionName: 'statusList', hiddenKeyName: true }, { key: 'structureTypeCode', optionName: 'BizExerciseStructureTypeEnums', hiddenKeyName: true }, { key: 'difficultyCode', optionName: 'BizExerciseDifficultyEnums', hiddenKeyName: true }];
    return (
        <>
            {contextHolder}
            <CommonEditorForm
                formValidate={formValidate}
                fields={formFields}
                saveBeforeTransform={saveBeforeTransform}
                commonListConfig={{
                    displayKeys,
                    displayTitle: 'name',
                    initCommonListData: initCommonListData,
                    placeholder: 'Search name or ID...',
                    filterSections: filterSections,
                    title: 'Exercises',
                }}

                moduleKey='workout'
                isCollapse={true}
                formType="advanced"

                enableDraft={true}
                watchFormFieldChange={watchFormFieldChange}
                collapseFormConfig={{ defaultActiveKeys: 'all', isAccordion: false }}
                fieldsToValidate={['name', 'birthday']}
                config={{ formName: 'Workout', title: 'Workout details' }}
                initialValues={initialValues}
            />
        </>
    );
} 