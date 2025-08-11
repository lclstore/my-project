import { EditFilled, CheckCircleFilled, CloseCircleFilled, LoadingOutlined, CheckOutlined, CloseOutlined, SyncOutlined, StopOutlined } from '@ant-design/icons';

export const optionsConstants = {
    displayStatus: [
        { label: <div><EditFilled style={{ marginRight: '5px', color: "#889e9e" }} />Draft</div>, value: 'DRAFT' },
        { label: <div> <CheckCircleFilled style={{ marginRight: '5px', color: "#1c8" }} />Enabled</div>, value: 'ENABLED' },
        { label: <div> <StopOutlined style={{ marginRight: '5px', color: "#ff4d4f" }} />Disabled</div>, value: 'DISABLED' },
    ],
    userStatus: [
        { label: <div>Enabled <CheckCircleFilled style={{ marginLeft: '5px', color: "#1c8" }} /></div>, value: 1 },
        { label: <div>Disabled <CloseCircleFilled style={{ marginLeft: '5px', color: "#ff4d4f" }} /></div>, value: 2 },
    ],
    resultStatus: [
        { label: <div>success <CheckCircleFilled style={{ marginLeft: '5px', color: "#1c8" }} /></div>, value: 1 },
        { label: <div>faild <CloseCircleFilled style={{ marginLeft: '5px', color: "#ff4d4f" }} /></div>, value: 2 },
    ],
    defaultStatus: [
        { label: <div><CheckOutlined style={{ color: "#889e9e", fontSize: '18px' }} /></div>, value: 1 },
        { label: <div><CloseOutlined style={{ color: "#ff4d4f", fontSize: '18px' }} /></div>, value: 0 },
    ],
    testStatus: ['Draft1', 'Enabled1', 'Disabled1'],//用于测试后期删除

    statusList: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Enabled', value: 'ENABLED' },
        { label: 'Disabled', value: 'DISABLED' },
    ],
    difficulty: [
        { label: 'Beginner', value: 0 },
        { label: 'Intermediate', value: 1 },
        { label: 'Advanced', value: 2 },
    ],
    equipment: [
        { label: 'Dumbbells', value: 0 },
        { label: 'Resistance band', value: 1 },
        { label: 'None', value: 2 },
    ],
    position: [
        { label: <span style={{ color: '#1abc9c' }}>Standing</span>, value: 0 },
        { label: <span style={{ color: '#3498db' }}>Lying</span>, value: 1 },
        { label: <span style={{ color: '#9b59b6' }}>Seated</span>, value: 2 },
        { label: <span style={{ color: '#e67e22' }}>Prone</span>, value: 3 },
        { label: <span style={{ color: '#e74c3c' }}>Kneeling</span>, value: 4 },
    ],
    publishStatus: [
        {
            label: <div><LoadingOutlined style={{ marginRight: '5px', color: "#faad14" }} />WAITTING</div>,
            value: 'WAITTING'
        },
        {
            label: <div><CheckOutlined style={{ marginRight: '5px', color: "#1c8" }} />SUCCESS</div>,
            value: 'SUCCESS'
        },
        { 
            label: <div><CloseOutlined style={{ marginRight: '5px', color: "#ff4d4f" }} />FAIL</div>,
            value: 'FAIL'
        },
        {
            label: <div><SyncOutlined style={{ marginRight: '5px', color: "#1890ff" }} />PROCESSING</div>,
            value: 'PROCESSING'
        },
        {
            label: <div><CheckOutlined style={{ marginRight: '5px', color: "#1c8" }} />Successful</div>,
            value: 'SUCCESSFUL'
        },
    ],
    operationTypes: [
        { name: "Add", value: "ADD" },
        { name: "Update", value: "UPDATE" },
        { name: "Delete", value: "DELETE" },
        { name: "Enable", value: "ENABLE" },
        { name: "Disable", value: "DISABLE" },
        { name: "Template Grenerate Workout", value: "TEMPLATE_GENERATE_WORKOUT" },
        { name: "Template Grenerate Workout File", value: "TEMPLATE_GENERATE_WORKOUT_FILE" },
        { name: "Save", value: "SAVE" },
        { name: "Workout Grenerate File", value: "WORKOUT_GENERATE_FILE" },
    ]
};