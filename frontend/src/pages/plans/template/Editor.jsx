import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/index.jsx';
import { FormOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { message } from 'antd';
import request from "@/request";
export default function UserEditorWithCommon() {
    const configRef = useRef();

    useEffect(() => {
        getWorkoutSettingConfig().then(res => {
            configRef.current = res
        })
    }, [])
    const initialValues = {
        days: 28,
        durationCode: "MIN_10_15",
        structureName: "",
        structureName1: "",
        structureName2: "",
    }

    // 表单字段配置
    const initialFormFields = useMemo(() => [
        {
            label: 'Basic Information',
            name: 'basicInfo',
            icon: <FormOutlined />,
            fields: [
                {
                    type: 'input',
                    name: 'name', // 遵循命名规范，使用驼峰命名
                    label: 'Name',
                    maxLength: 100,
                    required: true,
                    clickEditor: true,
                    placeholder: 'Enter user name',
                    rules: [
                        { max: 100, message: 'Name cannot exceed 100 characters' }
                    ],
                    tooltipInfo: () => {
                        return <>
                            <div>- Name must be unique.</div>
                        </>
                    },
                },
                {
                    type: 'textarea',
                    name: 'description', // 遵循命名规范，使用驼峰命名
                    label: 'Description',
                    maxLength: 1000,
                },
                {
                    type: 'numberStepper',
                    name: 'days',
                    label: 'Days',
                    required: true,
                    min: 28,
                    max: 28,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'select',
                    mode: 'single',
                    name: 'durationCode',
                    label: 'Duration Range (Min)',
                    options: "BizTemplateDurationEnums",
                    required: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- The duration range includes the start value but excludes the end value.</div>
                        </>
                    },
                },
            ]
        },
        {

            title: 'Structure',
            label: 'Workout Structure',
            name: 'unitList',
            displayName: 'name',
            systemCount: 3,
            isShowAdd: true,
            isGroup: true,
            icon: <VideoCameraOutlined />,
            fields: [

                {
                    type: 'input',

                    name: 'structureName',
                    flex: 1,
                    label: 'Name',
                    required: true,
                    initValue: 1,
                    maxLength: 100,
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    width: '160px',
                    name: 'count',
                    label: 'Count',
                    initValue: 2,
                    required: true,
                    min: 2,
                    max: 10,
                    step: 1,
                },
                {
                    type: 'numberStepper',
                    width: '160px',
                    name: 'round',
                    label: 'Rounds',
                    required: true,
                    initValue: 1,
                    min: 1,
                    max: 5,
                    step: 1,
                }

            ]

        }

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建
    const [formFields, setFormFields] = useState(initialFormFields);

    /**
     * 保存前对表单数据进行转换
     * 根据结构列表项目的位置，自动分配结构类型代码：
     * - 第一项为热身 (WARM_UP)
     * - 最后一项为冷却 (COOL_DOWN)
     * - 中间项为主要训练 (MAIN)
     */
    const saveBeforeTransform = useCallback(({ formValues }) => {
        const { unitList: structureList = [] } = formValues;

        // 处理结构列表，根据位置添加结构类型代码
        const unitList = structureList.map((item, index, arr) => {
            // 确定结构类型：第一项为热身，最后一项为冷却，其他为主要训练
            const structureTypeCode =
                index === 0 ? 'WARM_UP' :
                    index === arr.length - 1 ? 'COOL_DOWN' : 'MAIN';

            return { ...item, structureTypeCode };
        });
        formValues.unitList = unitList;
        return formValues;
    }, []);


    // 获取训练配置
    const getWorkoutSettingConfig = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/workoutSettings/detail`,
                load: false,
                callback: res => {
                    resolve(res.data.data)
                }
            });
        })
    }
    const formValidate = ({ formValues }) => {
        if (formValues.status === 'DRAFT') {
            return true
        } else {
            const duration = 15;
            const { previewVideoReps, executionVideoReps, introVideoReps } = configRef.current;
            const previewDuration = duration * previewVideoReps / 60;
            const executionDuration = duration * executionVideoReps / 60;
            const introDuration = duration * introVideoReps / 60;
            let totalStructureDuration = 0;
            // 如果previewVideoReps, executionVideoReps, introVideoReps都为0，则提示错误
            if (
                previewVideoReps == undefined ||
                previewVideoReps == null ||
                !executionVideoReps ||
                introVideoReps == undefined ||
                introVideoReps == null
            ) {
                message.error(`The workout settings do not match the Duration.`);
                return false;
            }
            const unitList = formValues.unitList;
            unitList.forEach((item) => {
                const round = item.round;
                const count = item.count;
                totalStructureDuration += (previewDuration + executionDuration) * round * count;
            })
            const totalDuration = Math.round((introDuration + totalStructureDuration));
            const [, start, end] = formValues.durationCode.split('_').map(Number);
            if (totalDuration < start || totalDuration >= end) {
                message.error(`The template do not match the Duration.`);
                return false;
            }

        }
        return true
    }
    return (
        <>

            <CommonEditorForm
                saveBeforeTransform={saveBeforeTransform}
                formValidate={formValidate}
                formType="advanced"
                config={{ formName: 'Template', hideSaveButton: false, hideBackButton: false }}
                fields={formFields}
                isCollapse={true}
                enableDraft={true}
                collapseFormConfig={{ defaultActiveKeys: 'all', isAccordion: false }}
                initialValues={initialValues}
                moduleKey='template'
            />
        </>
    );
} 