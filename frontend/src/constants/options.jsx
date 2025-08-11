import { EditFilled, CheckCircleFilled, CloseCircleFilled, LoadingOutlined, CheckOutlined, CloseOutlined, SyncOutlined, StopOutlined } from '@ant-design/icons';

export const optionsConstants = {
    displayStatus: [
        { name: <div><EditFilled style={{ marginRight: '5px', color: "#889e9e" }} />Draft</div>, value: 'DRAFT' },
        { name: <div> <CheckCircleFilled style={{ marginRight: '5px', color: "#1c8" }} />Enabled</div>, value: 'ENABLED' },
        { name: <div> <CloseCircleFilled style={{ marginRight: '5px', color: "#ff4d4f" }} />Disabled</div>, value: 'DISABLED' },
    ],
    displayEditStatus: [
        { name: <div><EditFilled style={{ marginRight: '5px', color: "#889e9e" }} />Save as Draft</div>, value: 'DRAFT' },
        { name: <div> <CheckCircleFilled style={{ marginRight: '5px', color: "#1c8" }} />Save as Enabled</div>, value: 'ENABLED' },
        { name: <div> <StopOutlined style={{ marginRight: '5px', color: "#ff4d4f" }} />Save as Disabled</div>, value: 'DISABLED' },
    ],
    userStatus: [
        { name: <div>Enabled <CheckCircleFilled style={{ marginLeft: '5px', color: "#1c8" }} /></div>, value: 1 },
        { name: <div>Disabled <CloseCircleFilled style={{ marginLeft: '5px', color: "#ff4d4f" }} /></div>, value: 2 },
    ],
    resultStatus: [
        { name: <div>success <CheckCircleFilled style={{ marginLeft: '5px', color: "#1c8" }} /></div>, value: 1 },
        { name: <div>faild <CloseCircleFilled style={{ marginLeft: '5px', color: "#ff4d4f" }} /></div>, value: 2 },
    ],
    defaultStatus: [
        { name: <div><CheckOutlined style={{ color: "#889e9e", fontSize: '18px' }} /></div>, value: 1 },
        { name: <div><CloseOutlined style={{ color: "#ff4d4f", fontSize: '18px' }} /></div>, value: 0 },
    ],
    testStatus: ['Draft1', 'Enabled1', 'Disabled1'],//用于测试后期删除
    statusList: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Enabled', value: 'ENABLED' },
        { label: 'Disabled', value: 'DISABLED' },
    ],
    difficulty: [
        { name: 'Beginner', value: 0 },
        { name: 'Intermediate', value: 1 },
        { name: 'Advanced', value: 2 },
    ],
    equipment: [
        { name: 'Dumbbells', value: 0 },
        { name: 'Resistance band', value: 1 },
        { name: 'None', value: 2 },
    ],
    position: [
        { name: <span style={{ color: '#1abc9c' }}>Standing</span>, value: 0 },
        { name: <span style={{ color: '#3498db' }}>Lying</span>, value: 1 },
        { name: <span style={{ color: '#9b59b6' }}>Seated</span>, value: 2 },
        { name: <span style={{ color: '#e67e22' }}>Prone</span>, value: 3 },
        { name: <span style={{ color: '#e74c3c' }}>Kneeling</span>, value: 4 },
    ],
    publishStatus: [
        {
            name: <div><LoadingOutlined style={{ marginRight: '5px', color: "#faad14" }} />Waiting</div>,
            value: 'WAITTING'
        },
        {
            name: <div><CheckOutlined style={{ marginRight: '5px', color: "#1c8" }} />Success</div>,
            value: 'SUCCESS'
        }, 
        {
            name: <div><CloseOutlined style={{ marginRight: '5px', color: "#ff4d4f" }} />Fail</div>,
            value: 'FAIL'
        },
        {
            name: <div><SyncOutlined style={{ marginRight: '5px', color: "#1890ff" }} />Processing</div>,
            value: 'PROCESSING'
        },
        {
            name: <div><SyncOutlined style={{ marginRight: '5px', color: "#1890ff" }} />Successful</div>,
            value: 'SUCCESSFUL',
        },
    ],
};