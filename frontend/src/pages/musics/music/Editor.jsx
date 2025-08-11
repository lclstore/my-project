import React, { useMemo, } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
export default function UserEditorWithCommon({ id, setFormRef, isDuplicate, headerButtons }) {

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'upload',
            // required: true,
            name: 'audioUrl', // 视频文件
            label: 'Audio',
            required: true,
            durationName: 'audioDuration',
            acceptedFileTypes: 'mp3',
            maxFileSize: 5 * 1024, // 限制文件大小为10MB

            //文件上传后修改name
            onChange: (value, file, form) => {
                form.setFieldsValue({
                    displayName: file?.name.replace('.mp3', '').replace('.MP3', '') || '',
                    name: file?.name.replace('.mp3', '').replace('.MP3', '') || '',
                });
            },
        },
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            clickEditor: true,
            placeholder: 'Music name',
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
            type: 'input',
            name: 'displayName', // 遵循命名规范，使用驼峰命名
            label: 'Display Name',
            maxLength: 100,
            required: true,
            placeholder: 'Music name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        }


    ], []); // 使用useMemo优化性能，避免每次渲染重新创建


    return (
        <CommonEditorForm

            changeHeader={false}
            formType="basic"
            moduleKey="music"
            isBack={false}
            enableDraft={true}
            config={{
                formName: 'Music', headerButtons
            }}
            fields={formFields}
            id={id}
            isDuplicate={isDuplicate}
            initialValues={{}}
            setFormRef={setFormRef}
        />
    );
} 