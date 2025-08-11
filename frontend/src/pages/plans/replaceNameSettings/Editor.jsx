import React, { useState } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';


export default function UserEditorWithCommon() {


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
            tooltipInfo: () => {
                return <>
                    <div>- Name must be unique.</div>
                </>
            },
            // tooltipInfo: () => {
            //     return <> 
            //         <div>- Name must be unique.</div>
            //     </>
            // }
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
                        options: 'BizPlanNameSettingsRuleMatchKeyEnums',
                        placeholder: 'Select match key',
                        onChangeReset: ['matchValue']
                    },
                    {
                        title: 'Match Condition',
                        name: 'matchCondition',
                        type: 'select',
                        options: 'BizPlanNameSettingsRuleMatchConditionEnums',
                        placeholder: 'Select condition',
                    },
                    {
                        title: 'Match Value',
                        name: 'matchValue',
                        type: 'select',
                        placeholder: 'Select match value',
                        options: "BizPlanNameSettingsTrainingPositionEnums",
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
                                "COMPLETED_TIMES": "BizPlanNameSettingsCompletedTimesEnums",
                                "TRAINING_POSITION": "BizPlanNameSettingsTrainingPositionEnums"
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
        {
            type: 'input',
            name: 'planName', // 遵循命名规范，使用驼峰命名
            label: 'Plan Name',
            maxLength: 100,
            required: true,
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'input',
            name: 'stage1Name', // 遵循命名规范，使用驼峰命名
            label: 'Stage1 Name',
            maxLength: 100,
            required: true,
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'input',
            name: 'stage2Name', // 遵循命名规范，使用驼峰命名
            label: 'Stage2 Name',
            maxLength: 100,
            required: true,
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'input',
            name: 'stage3Name', // 遵循命名规范，使用驼峰命名
            label: 'Stage3 Name',
            maxLength: 100,
            required: true,
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'input',
            name: 'stage4Name', // 遵循命名规范，使用驼峰命名
            label: 'Stage4 Name',
            maxLength: 100,
            required: true,
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
    ]); // 使用useMemo优化性能，避免每次渲染重新创建


    return (
        <>
            <CommonEditorForm
                saveBeforeTransform={({ formValues }) => {
                    // 没有填写完全的过滤掉
                    formValues.ruleList && (formValues.ruleList = formValues.ruleList.filter(i => i.matchKey && i.matchCondition && i.matchValue));
                    return formValues;
                }}
                layoutLeftConfig={{ style: { background: 'none', padding: 0 } }}
                enableDraft={true}
                formType="basic"
                moduleKey="planNameSettings"
                config={{ formName: 'Plan Name', style: { maxWidth: '1000px', margin: '0 auto', background: 'none', padding: 0 } }}
                fields={formFields}
                initialValues={{
                    ruleList: []
                }}
            />
        </>
    );
}