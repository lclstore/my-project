import React, { useMemo, useState } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from '@/request';

export default function UserEditorWithCommon() {
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name',
            label: 'Name',
            maxLength: 100,
            required: true,
            clickEditor: true,
            placeholder: 'Music name',
            tooltipInfo: () => {
                return <>
                    <div>- Name must be unique.</div>
                </>
            },
        },

        {
            type: 'select',
            mode: 'single',
            name: 'type',
            label: 'Type',
            options: "BizPlaylistTypeEnums",
            required: true,
        },
        {
            type: 'select',
            name: 'premium',
            label: 'Premium',
            required: true,
            setDefaultValue: 0,
            options: [
                { label: 'Yes', value: 1 },
                { label: 'No', value: 0 },
            ],
        },
        {

            type: 'list',
            name: 'musicList',
            label: 'Musics',
            emptyPlaceholder: 'Please add music',
            lockName: 'premium', // 锁对应字段
            rules: [
                { required: true, message: 'Please add at least one music' },
            ]
        },


    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    const initCommonListData = (params) => {
        return new Promise(resolve => {
            request.get({
                url: `/music/page`,
                load: false,
                data: params,
                callback: res => resolve(res?.data)
            });
        })
    }


    const saveBeforeTransform = ({ formValues }) => {
        if (formValues?.musicList) {
            formValues.musicList = formValues.musicList.map(item => {
                return {
                    bizMusicId: item.id,
                    displayName: item.displayName,
                    premium: item.premium ? 1 : 0,
                }
            });
        }
        return formValues;
    }

    return (
        <CommonEditorForm
            moduleKey='playlist'
            commonListConfig={{
                displayKeys: ['id', { key: 'displayName', hiddenKeyName: false, displayKeyName: 'Display Name' }],
                displayTitle: 'name',
                initCommonListData: initCommonListData,
                placeholder: 'Search your content name...',
                title: 'Musics',
            }}
            initialValues={{
                type: 'REGULAR',
                premium: 0,
            }}
            saveBeforeTransform={saveBeforeTransform}
            formType="advanced"
            isCollapse={false}
            enableDraft={true}
            config={{ formName: 'Playlist', title: 'Playlist details' }}
            fields={formFields}
        />
    );
} 