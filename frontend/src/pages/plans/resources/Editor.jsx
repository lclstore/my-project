import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/index.jsx';

export default function UserEditorWithCommon() {


    // 初始用户数据状态--可设默认值
    const initialValues = {
        layoutType: 1,
        applicationCode: "WORKOUT",
        genderCode: "MALE",
        // status2: [1, 2],
        // status: 1, // 确保status有默认值1
        // // 为联动选择器设置默认值 - 使用数字类型
        // contentStyle: 'style1'
    }
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            clickEditor: true,
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
            type: 'select',
            mode: 'single',
            name: 'applicationCode',
            label: 'Usage',
            options: "BizResourceApplicationEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'genderCode',
            label: 'Gender',
            options: 'BizExerciseGenderEnums',
            required: true
        },
        {
            type: 'upload',
            style: {
                width: '100px',
            },
            layoutRegion: 'right',
            name: 'coverImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Cover Image',
            acceptedFileTypes: 'png,webp',
            //文件上传后修改name
            onChange: (value, file, form) => {
                const formValus = form.getFieldsValue();
                form.setFieldsValue({
                    detailImgUrl: formValus['detailImgUrl'] || value,
                    thumbnailImage: formValus['thumbnailImage'] || value,
                    completeImage: formValus['completeImage'] || value,
                });
            },
            maxFileSize: 2 * 1024,
            required: true
        },
        {
            type: 'upload',
            style: {
                width: '100px',
            },
            layoutRegion: 'right',
            name: 'detailImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Detail Image',
            acceptedFileTypes: 'png,webp',
            onChange: (value, file, form) => {
                const formValus = form.getFieldsValue();
                form.setFieldsValue({
                    coverImgUrl: formValus['coverImgUrl'] || value,
                    thumbnailImage: formValus['thumbnailImage'] || value,
                    completeImage: formValus['completeImage'] || value,
                });
            },
            maxFileSize: 2 * 1024,
            required: true
        },

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建
    return (
        <CommonEditorForm
            style={{
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: '3fr 2fr',
                maxWidth: '100%', padding: '0px', borderRadius: '6px'

            }}
            layoutRightConfig={{
                title: 'Associated Files',
            }}
            enableDraft={true}
            formType="basic"
            moduleKey="resource"
            config={{ formName: 'Resource', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={initialValues}
        />
    );
} 