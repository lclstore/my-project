import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import { validateEmail, validatePassword } from '@/utils';

export default function UserEditorWithCommon({ id, setFormRef, headerButtons }) {
    // 初始用户数据状态
    const initialValues = {
    }

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name',
            clickEditor: true,
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Enter name...',
            rules: [
                { max: 100, message: 'Please input your name' }
            ],
            props: {
                // autoComplete:"new-password"
            }
        },
        {
            type: 'input',
            name: 'email',
            maxLength: 100,
            label: 'Email',
            required: true,
            placeholder: 'Enter email...',
            rules: [
                { required: true, message: 'Please input Email.' },
                { max: 100, message: 'Email cannot exceed 100 characters' },
                {
                    validator: async (_, value) => {
                        if (value && !validateEmail(value)) {
                            return Promise.reject('Email is not valid.');
                        }
                        return Promise.resolve();
                    },
                },
            ]
        },
        {
            type: 'password',
            name: 'password',
            label: 'Password',
            required: true,
            placeholder: 'Enter password...',
            rules: [
                { required: true, message: 'Please input passowrd.' },
                {
                    validator: async (_, value) => {
                        if (value && !validatePassword(value)) {
                            return Promise.reject(
                                'The password must contain letters (uppercase or lowercase) and numbers (0-9) and be 8-12 characters long.'
                            );
                        }
                        return Promise.resolve();
                    },
                }
            ],
            props: {
                // autoComplete:"new-password"
            }
        }
    ], []);

    return (
        <CommonEditorForm
            changeHeader={false}
            formType="basic"
            isBack={false}
            config={{ formName: 'User', headerButtons }}
            fields={formFields}
            initialValues={initialValues}
            id={id}
            moduleKey="user"
            setFormRef={setFormRef}
        />
    );
} 