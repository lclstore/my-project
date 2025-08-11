import React, { useState, useMemo, useReducer, useCallback } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';

export default function UserEditorWithCommon() {

    // 初始用户数据状态--可设默认值
    const [initialValues, setInitialValues] = useState({
        translation: 1,
        usageCode: "FLOW",
        genderCode: "FEMALE_AND_MALE"
    })

    // 表单字段配置
    const [formFields, setFormFields] = useState([
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            clickEditor: true,
            maxLength: 100,
            required: true,
            placeholder: 'Enter name...',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ],
            tooltipInfo: ()=>{
                return <>
                    <div>- Name must be unique.</div>
                </>
            },
        },
        {
            label: 'Usage',
            name: 'usageCode',
            type: 'select',
            required: true,
            options: "BizSoundUsageEnums",
            tooltipInfo: ()=>{
                return <>
                    <div>- Flow: For audio that plays within a workout video.</div>
                    <div>- General: For audio that plays outside a workout video or elsewhere.</div>
                </>
            },
        },
        {
            label: 'Gender',
            name: 'genderCode',
            type: 'select',
            options: 'BizSoundGenderEnums',
            required: true,
            tooltipInfo: ()=>{
                return <>
                    <div>- Female: For female audio only.</div>
                    <div>- Male: For male audio only.</div>
                    <div>- Female & Male: For both female and male audio.</div>
                </>
            },
        },
        {
            type: 'select',
            name: 'translation',
            label: 'Has a Script',
            options: [
                {
                    label: 'Yes',
                    value: 1
                }, {
                    label: "No",
                    value: 0
                },
            ],
            required: true,
        },
        {
            type: 'textarea',
            name: 'femaleScript',
            label: 'Female Script',
            required: true,
            maxLength: 1000,
            showCount: true,
            dependencies: ['translation', 'genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {
                const translation = getFieldValue("translation") === 1 && (getFieldValue("genderCode") === "FEMALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
                return translation
            },
        },
        {
            type: 'textarea',
            name: 'maleScript',
            label: 'Male Script',
            required: true,
            maxLength: 1000,
            showCount: true,
            dependencies: ['translation', 'genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {    // content 支持函数
                return getFieldValue("translation") === 1 && (getFieldValue("genderCode") === "MALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
            },
        },
        {
            type: 'upload',
            layoutRegion: 'right',
            name: 'femaleAudioUrl', // 视频文件
            durationName: 'femaleAudioDuration',
            label: 'Female Audio',
            required: true,
            maxFileSize: 1024 * 5,
            acceptedFileTypes: 'mp3',
            dependencies: ['genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {    // content 支持函数
                return (getFieldValue("genderCode") === "FEMALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
            },
        },
        {
            type: 'upload',
            layoutRegion: 'right',
            name: 'maleAudioUrl', // 视频文件
            durationName: 'maleAudioDuration',
            label: 'Male Audio',
            required: true,
            maxFileSize: 1024 * 5,
            acceptedFileTypes: 'mp3',
            dependencies: ['genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {    // content 支持函数
                return (getFieldValue("genderCode") === "MALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
            },
        }

    ]); // 使用useMemo优化性能，避免每次渲染重新创建


    return (
        <CommonEditorForm
            layoutRightConfig={{
                title: 'Associated Files',
            }}
            enableDraft={true}
            moduleKey="sound"
            config={{
                formName: 'Sound',
            }}
            fields={formFields}
            initialValues={initialValues}
        />
    );
} 