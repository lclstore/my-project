import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { renderSelectAudioLabel } from '@/common';
import CommonEditorForm from '@/components/CommonEditorForm';
import {
    ThunderboltOutlined,
    PictureOutlined,
    SaveOutlined,
    FormOutlined

} from '@ant-design/icons';
import request from "@/request";
export default function UserEditorWithCommon() {
    const navigate = useNavigate();
    // 初始用户数据状态--可设默认值
    const initialValues = {
        introVideoReps: 0,
        previewVideoReps: 1,
        introVideoCycleCode: "FRONT_TO_SIDE",
        previewVideoCycleCode: "SIDE_TO_FRONT",
        executionVideoCycleCode: "SIDE_TO_FRONT",
        executionVideoReps: 2,
        introAudioStartTime: 0,
        previewRestAudioStartTime: 0,
        previewFirstAudioStartTime: 3,
        previewNextAudioStartTime: 3,
        previewLastAudioStartTime: 3,
        previewNameAudioStartTime: 6,
        previewThreeAudioEndTime: 3,
        previewTwoAudioEndTime: 2,
        previewOneAudioEndTime: 1,
        executionGoAudioStartTime: 0,
        executionGuidanceAudioStartTime: 2,
        executionHalfwayAudioStartTime: 30,
        executionThreeAudioEndTime: 4,
        executionTwoAudioEndTime: 3,
        executionOneAudioEndTime: 2,
        executionRestAudioEndTime: 1,
        executionBeepAudioEndTime: 5,
        introAudioClosed: 0,
        previewRestAudioClosed: 0,
        previewFirstAudioClosed: 0,
        previewNextAudioClosed: 0,
        previewLastAudioClosed: 0,
        previewNameAudioClosed: 0,
        previewThreeAudioClosed: 0,
        previewTwoAudioClosed: 0,
        previewOneAudioClosed: 0,
        executionGoAudioClosed: 0,
        executionGuidanceAudioClosed: 0,
        executionHalfwayAudioClosed: 0,
        executionThreeAudioClosed: 0,
        executionTwoAudioClosed: 0,
        executionOneAudioClosed: 0,
        executionBeepAudioClosed: 0,
        executionRestAudioClosed: 0,






    }
    const [audioOptions, setAudioOptions] = useState([]);
    const [workoutSetting, setWorkoutSetting] = useState(initialValues);
    const getData = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/workoutSettings/detail`,
                load: true,
                callback: res => {
                    resolve(res.data.data)
                }
            });
        })
    }
    const getAudioOptions = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/sound/page`,
                load: false,
                data: {
                    pageIndex: 1,
                    pageSize: 10000,
                    orderBy: 'id',
                    orderDirection: 'DESC',
                    usageCodeList: ['FLOW'],
                    statusList: ['ENABLED']
                },
                callback: res => {
                    if (res.data.success) {
                        const audioOptionList = res?.data?.data.map(item => { return { label: item.name, value: item.id } })
                        setAudioOptions(audioOptionList)
                    }
                    resolve();
                }
            })
        })
    }
    useEffect(() => {
        getData().then(res => {
            setWorkoutSetting(res || initialValues)
        })
        getAudioOptions()//获取音频列表
    }, []);


    const initialFormFields = useMemo(() => [
        {
            label: 'Workout Intro',
            name: 'basicInfo',
            icon: <FormOutlined />,

            fields: [
                {
                    type: 'numberStepper',
                    min: 0,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'introVideoReps', // 修改字段名避免重复
                    label: 'Intro Video Reps',
                    required: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- Not using exercise video as an intro? Set Intro Video Reps to 0.</div>
                        </>
                    },
                },
                {
                    type: 'select',
                    name: 'introVideoCycleCode',
                    label: 'Intro Video Cycle',
                    required: true,
                    options: "BizWorkoutSettingsVideoCycleEnums",
                    // required: true,
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp1',
                    label: 'Intro Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'introAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Intro Audio',
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                        },
                        {
                            type: 'input',
                            name: 'introAudioStartTime',
                            placeholder: 'Count-Up Seconds',
                            label: '',
                            maxLength: 100,
                            rules: [{
                                // required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],
                            flex: 1,
                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'introAudioClosed',
                            label: '',
                            flex: 1,
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],

                            // required: true,
                        },



                    ]
                },


            ]
        },
        {
            label: 'Exercise Preview',
            name: 'image',
            icon: <FormOutlined />,
            fields: [
                {
                    type: 'numberStepper',
                    min: 0,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'previewVideoReps', // 修改字段名避免重复
                    label: 'Preview Video Reps',
                    required: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- No preview needed? Set Preview Video Reps to 0.</div>
                        </>
                    },
                },
                {
                    type: 'select',
                    name: 'previewVideoCycleCode',
                    label: 'Preview Video Cycle',
                    options: "BizWorkoutSettingsVideoCycleEnums",
                    required: true,
                },

                {

                    type: 'inputGroup',
                    name: 'warmUp2',
                    label: 'Preview Audio & Count Node ( First | Next | Last | Name | 3 | 2 | 1 )',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',

                            name: 'previewFirstAudioBizSoundId',
                            label: '',
                            placeholder: 'Preview First Audio',
                            rules: [{
                                required: true,
                                message: 'Preview First Audio'
                            }],
                            flex: 1,
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'previewFirstAudioStartTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            flex: 1,
                            placeholder: 'Count-Up Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],

                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'previewFirstAudioClosed',
                            label: '',
                            flex: 1,
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp3',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'previewNextAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Preview Next Audio',
                            rules: [{
                                required: true,
                                message: 'Preview Next Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'previewNextAudioStartTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            flex: 1,
                            placeholder: 'Count-Up Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],

                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'previewNextAudioClosed',
                            label: '',
                            flex: 1,
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp4',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'previewLastAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Preview Last Audio',
                            rules: [{
                                required: true,
                                message: 'Preview Last Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'previewLastAudioStartTime',
                            label: '',
                            flex: 1,
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Up Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],
                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'previewLastAudioClosed',
                            label: '',
                            flex: 1,
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp5',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: '',
                            label: '',
                            placeholder: 'Preview Name Audio',
                            disabled: true,
                            flex: 1,
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                        },
                        {
                            type: 'input',
                            name: 'previewNameAudioStartTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            flex: 1,
                            placeholder: 'Count-Up Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],

                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'previewNameAudioClosed',
                            flex: 1,
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp6',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'previewThreeAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Preview 3 Audio',
                            rules: [{
                                required: true,
                                message: 'Preview 3 Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'previewThreeAudioEndTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            flex: 1,
                            placeholder: 'Count-Down Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            style: {
                                border: '1px solid #d5c031'
                            },
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'previewThreeAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                }, {

                    type: 'inputGroup',
                    name: 'warmUp7',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'previewTwoAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Preview 2 Audio',
                            rules: [{
                                required: true,
                                message: 'Preview 2 Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'previewTwoAudioEndTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            flex: 1,
                            placeholder: 'Count-Down Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            style: {
                                border: '1px solid #d5c031'
                            },
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'previewTwoAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                }, {

                    type: 'inputGroup',
                    name: 'warmUp8',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'previewOneAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Preview 1 Audio',
                            rules: [{
                                required: true,
                                message: 'Preview 1 Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'previewOneAudioEndTime',
                            label: '',
                            flex: 1,
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Down Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            style: {
                                border: '1px solid #d5c031'
                            },
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'previewOneAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },



            ]
        },
        {
            label: 'Exercise Execution',
            name: 'basicInfo1',
            icon: <FormOutlined />,
            fields: [
                {
                    type: 'numberStepper',
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'executionVideoReps', // 修改字段名避免重复
                    label: 'Execution Video Reps',
                    required: true,
                    tooltipInfo: () => {
                        return <>
                            <div>- This is the formal exercise part. Execution Video Reps cannot be 0</div>
                        </>
                    },
                },
                {
                    type: 'select',
                    name: 'executionVideoCycleCode',
                    label: 'Execution Video Cycle',
                    options: "BizWorkoutSettingsVideoCycleEnums",
                    required: true,
                },
                {

                    type: 'inputGroup',
                    name: 'executionVideoReps2',
                    label: 'Execution Audio & Count Node ( Go | Guidance | Halfway | 3 | 2 | 1 | Rest | Beep )',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionGoAudioBizSoundId',
                            label: '',
                            placeholder: 'Execution Go Audio',
                            rules: [{
                                required: true,
                                message: 'Execution Go Audio'
                            }],
                            flex: 1,
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'executionGoAudioStartTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            flex: 1,
                            placeholder: 'Count-Up Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],

                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'executionGoAudioClosed',
                            label: '',
                            flex: 1,
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp1',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionGuidanceAudioId',
                            label: '',
                            flex: 1,
                            disabled: true,
                            placeholder: 'Execution Guidance Audio',
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                        },
                        {
                            type: 'input',
                            flex: 1,
                            name: 'executionGuidanceAudioStartTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Up Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],
                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'executionGuidanceAudioClosed',
                            flex: 1,
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp9',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionHalfwayAudioBizSoundIds',
                            label: '',
                            placeholder: 'Execution Halfway Audio',
                            rules: [{
                                required: true,
                                message: 'Execution Halfway Audio'
                            }],
                            mode: 'multiple',
                            maxTagCount: 1,
                            options: audioOptions,
                            flex: 1,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                            onChange: (value, option, form) => {
                                console.log(value, option, form);
                            }
                        },
                        {
                            type: 'input',
                            flex: 1,
                            name: 'executionHalfwayAudioStartTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Up Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Up Seconds'
                            }],
                            showCount: true,
                        },
                        {
                            type: 'select',
                            name: 'executionHalfwayAudioClosed',
                            label: '',
                            flex: 1,
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp10',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionThreeAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Execution 3 Audio',
                            rules: [{
                                required: true,
                                message: 'Execution 3 Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            flex: 1,
                            name: 'executionThreeAudioEndTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Down Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            style: {
                                border: '1px solid #d5c031'
                            },
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'executionThreeAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp11',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionTwoAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Execution 2 Audio',
                            rules: [{
                                required: true,
                                message: 'Execution 2 Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            flex: 1,
                            name: 'executionTwoAudioEndTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Down Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            style: {
                                border: '1px solid #d5c031'
                            },
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'executionTwoAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp12',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionOneAudioBizSoundId',
                            label: '',
                            flex: 1,
                            placeholder: 'Execution 1 Audio',
                            rules: [{
                                required: true,
                                message: 'Execution 1 Audio'
                            }],
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'executionOneAudioEndTime',
                            label: '',
                            flex: 1,
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Down Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            style: {
                                border: '1px solid #d5c031'
                            },
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'executionOneAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp14',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionRestAudioBizSoundId',
                            label: '',
                            placeholder: 'Execution Rest Audio',
                            rules: [{
                                required: true,
                                message: 'Execution Rest Audio'
                            }],
                            flex: 1,
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'executionRestAudioEndTime',
                            label: '',
                            flex: 1,
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Down Seconds',
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            style: {
                                border: '1px solid #d5c031'
                            },
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'executionRestAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp13',
                    label: '',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'executionBeepAudioBizSoundId',
                            label: '',
                            placeholder: 'Execution Beep Audio',
                            rules: [{
                                required: true,
                                message: 'Execution Beep Audio'
                            }],
                            flex: 1,
                            options: audioOptions,
                            renderLabel: renderSelectAudioLabel,
                            required: true,
                        },
                        {
                            type: 'input',
                            flex: 1,
                            name: 'executionBeepAudioEndTime',
                            label: '',
                            required: true,
                            maxLength: 100,
                            placeholder: 'Count-Down Seconds',
                            style: {
                                border: '1px solid #d5c031'
                            },
                            rules: [{
                                required: true,
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Count-Down Seconds'
                            }],
                            showCount: true,
                        },
                        {
                            type: 'select',
                            flex: 1,
                            name: 'executionBeepAudioClosed',
                            label: '',
                            options: [
                                {
                                    label: 'Can be Closed',
                                    value: 1
                                }, {
                                    label: "Can't be closed",
                                    value: 0
                                },
                            ],
                            required: true,
                        }



                    ]
                }


            ]
        },
    ], [audioOptions]); // 使用useMemo优化性能，避免每次渲染重新创建

    // 使用新设计：只维护一个formFields状态，并提供更新回调
    const [formFields, setFormFields] = useState(initialFormFields);

    useEffect(() => {
        // 当 initialFormFields (因为 audioOptions 变化而重新计算) 改变时，
        // 更新 formFields 状态。
        setFormFields(initialFormFields);
    }, [initialFormFields]);
    // 处理formFields变更的回调
    const handleFormFieldsChange = (updatedFields) => {
        setFormFields(updatedFields);
    };



    // 自定义渲染列表项展示
    const renderItemMata = (item) => {
        return <div>{item.displayName}</div>
    }
    //折叠面板展开
    const handleCollapseChange = (activeKeys, form) => {
        // 如果在此函数内更新了 formFields，可以在更新回调中获取最新值
        if (activeKeys[0] == 'workoutData') {
            setFormFields(prevFields => {
                const newFields = [...prevFields]; // 进行某些更新操作、
                const formValues = form.getFieldsValue(true);//表单数据
                const preview = formValues.exercisePreviewDuration || 0;
                const execution = formValues.exerciseExecutionDuration || 0;
                const introDuration = formValues.introDuration || 0;

                let loopCount = 0;
                let workoutCalorie = 0;
                const MET = 1

                const structureList = newFields.filter(item => Array.isArray(item.dataList) && item.dataList.length > 0);
                if (structureList.length > 0) {
                    structureList.forEach((item, index) => {
                        const reps = formValues[`reps${index == 0 ? '' : index}`] | 0;
                        loopCount = reps * item.dataList.length;
                        const calories = MET * 75 / 3600 * execution * reps * item.dataList.length;
                        workoutCalorie += calories
                    })
                    const workOutTime = (preview + execution) * loopCount;
                    const workoutDurationRaw = introDuration + workOutTime;
                    // 如果时长小于30，则向下取整，否则向上取整
                    const workoutDuration = workoutDurationRaw < 30
                        ? Math.floor(workoutDurationRaw)
                        : Math.ceil(workoutDurationRaw);
                    form.setFieldsValue({
                        duration: workoutDuration,
                        calorie: Math.ceil(workoutCalorie)//向上取整
                    });
                } else {
                    form.setFieldsValue({
                        duration: 0,
                        calorie: 0
                    });
                }
                console.log(newFields);

                return newFields;
            });
        }


    };
    const headerButtons = [
        {
            key: 'save',
            text: 'Save',
            icon: <SaveOutlined />,
            type: 'primary',
            onClick: () => {

            },
        }
    ]

    return (
        <CommonEditorForm
            moduleKey='workoutSettings'
            // 传递当前formFields状态
            fields={formFields}
            // 提供更新配置项回调
            onFormFieldsChange={handleFormFieldsChange}
            // 提供折叠面板展开回调
            onCollapseChange={handleCollapseChange}
            config={{ formName: 'workout Settings', hideTitleOperationName: true, headerButtons }}
            isBack={false}
            isCollapse={true}
            formType="advanced"
            collapseFormConfig={{ defaultActiveKeys: 'all', isAccordion: false, gap: 30 }}
            initialValues={workoutSetting}
        />
    );
} 