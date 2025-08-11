import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';

export default function UserEditorWithCommon() {

    // 初始用户数据状态--可设默认值
    const initialValues = {
        structureTypeCode: 'MAIN',
        genderCode: 'MALE',
        difficultyCode: 'BEGINNER',
        equipmentCode: 'CHAIR',
        positionCode: 'SEATED',
        injuredCodes: ["NONE"],
    }
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            clickEditor: true,
            required: true,
            placeholder: 'Enter name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ],
            tooltipInfo: () => {
                return <>
                    <div>- Name must be unique under the same gender.</div>
                </>
            },
        },
        {
            type: 'numberStepper',
            name: 'met',
            label: 'Met',
            required: true,
            min: 1,
            max: 12,
            step: 1,
            formatter: (value) => `${value}`,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'structureTypeCode',
            label: 'Structure Type',
            // disabled: true,
            options: "BizExerciseStructureTypeEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'genderCode',
            label: 'Gender',
            options: "BizExerciseGenderEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'difficultyCode',
            label: 'Difficulty',
            options: "BizExerciseDifficultyEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'equipmentCode',
            label: 'Equipment',
            options: "BizExerciseEquipmentEnums",
            required: true,
        },

        {
            type: 'select',
            name: 'positionCode',
            label: 'position',
            options: "BizExercisePositionEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'multiple',
            name: 'injuredCodes',
            label: 'Injured',
            required: true,
            options: "BizExerciseInjuredEnums",
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
            type: 'textarea',
            name: 'howtodoScript', // 遵循命名规范，使用驼峰命名
            label: 'Howtodo Script',
            maxLength: 1000,
            placeholder: 'Howtodo Script',
            rules: [
                { max: 1000, message: 'Name cannot exceed 100 characters' }
            ],
            required: true,
        },
        {
            type: 'textarea',
            name: 'guidanceScript', // 遵循命名规范，使用驼峰命名
            label: 'Guidance Script',
            maxLength: 1000,
            placeholder: 'Guidance Script',
            rules: [
                { max: 1000, message: 'Name cannot exceed 100 characters' }
            ],
        },


        {
            type: 'upload',
            style: {
                width: '100px',
            },
            name: 'coverImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Image',
            required: true,
            acceptedFileTypes: 'png,webp',
            layoutRegion: 'right',
        },


        {
            type: 'upload',
            required: true,
            layoutRegion: 'right',
            name: 'nameAudioUrl', // 视频文件
            label: 'Name Audio',
            maxFileSize: 1024 * 5,
            durationName: 'nameAudioUrlDuration',
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            required: true,
            layoutRegion: 'right',
            name: 'guidanceAudioUrl', // 视频文件
            label: 'Guidance Audio',
            durationName: 'guidanceAudioUrlDuration',
            maxFileSize: 5 * 1024, // 限制文件大小为10MB
            acceptedFileTypes: 'mp3',
        },

        {
            type: 'upload',
            layoutRegion: 'right',
            required: true,
            name: 'howtodoAudioUrl', // 视频文件
            label: 'Howtodo Audio',
            durationName: 'howtodoAudioUrlDuration',
            acceptedFileTypes: 'mp3',
            maxFileSize: 5 * 1024, // 限制文件大小为10MB
        },
        {
            type: 'upload',
            required: true,
            layoutRegion: 'right',
            name: 'frontVideoUrl', // 视频文件
            label: 'Front Video',
            durationName: 'frontVideoUrlDuration',
            maxFileSize: 1024 * 1024 * 2,
            acceptedFileTypes: 'mp4',
        },
        {
            type: 'upload',
            required: true,
            layoutRegion: 'right',
            name: 'sideVideoUrl', // 视频文件
            label: 'Side Video',
            durationName: 'sideVideoUrlDuration',
            //文件上传后修改name
            maxFileSize: 1024 * 1024 * 2,


            acceptedFileTypes: 'mp4',
        },

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建



    return (
        <CommonEditorForm

            layoutRightConfig={{
                title: 'Associated Files',
            }}
            enableDraft={true}
            formType="basic"
            moduleKey='exercise'
            config={{ formName: 'Exercise' }}
            fields={formFields}
            initialValues={initialValues}
        />
    );
} 