import {
    EditOutlined,
    StopOutlined,
    CheckCircleOutlined,
    CheckCircleFilled,
    CheckOutlined,
    CloseOutlined,
    CopyOutlined,
    DeleteOutlined,
    CloseCircleFilled,
    EditFilled,
    ThunderboltOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    VideoCameraOutlined,
    PlayCircleOutlined,
    UsergroupAddOutlined,
    CalendarOutlined,
    UserOutlined,
    SendOutlined,
    SettingOutlined,
    LoginOutlined,
    AudioOutlined,
    FileOutlined,
    SyncOutlined,
    FormOutlined,
    HomeOutlined
} from '@ant-design/icons';
// 状态图标
export const statusIconMap = {
    0: {
        icon: EditFilled,
        color: '#889e9e',
    },
    1: {
        icon: CloseCircleFilled,
        color: '#ff4d4f',
    },
    2: {
        icon: CheckCircleFilled,
        color: '#1c8',
    }
};
// 左侧菜单图标映射
export const menuIconMap = {
    exercises: DatabaseOutlined,
    workouts: VideoCameraOutlined,
    users: UsergroupAddOutlined,
    'profile-settings': SettingOutlined,
    login: LoginOutlined,
    musics: PlayCircleOutlined,
    collections: CopyOutlined,
    home: HomeOutlined,
    operationRecords: FileOutlined,
    plans: CalendarOutlined,
    profile: UserOutlined,
    publish: SendOutlined,
    sounds: AudioOutlined,
    workoutSettings: SettingOutlined

};

// 启用状态图标映射配置
export const resultIconMap = {
    1: {
        icon: CheckOutlined,
        color: '#1c8' // 绿色，表示正确
    },
    0: {
        icon: CloseOutlined,
        color: '#ff4d4f' // 红色，表示错误
    }
};
//用户状态
export const userStatusIconMap = {
    Enable: {
        icon: CheckCircleFilled,
        color: '#1c8', // 绿色，表示启用状态
    },
    Disable: {
        icon: CloseCircleFilled,
        color: '#ff4d4f', // 红色，表示禁用状态
    }
};
// 定义操作按钮图标映射
export const actionIconMap = {
    'edit': EditOutlined,
    'duplicate': CopyOutlined,
    'delete': DeleteOutlined,
    'enable': CheckCircleOutlined,
    'disable': StopOutlined,
    'deprecate': StopOutlined
};


//  文件状态图标
export const fileStatusIconMap = {
    successful: {
        color: '#1c8' // 绿色，表示正确
    },
    processing: {
        color: '#889e9e' //  表示处理中
    },
    failed: {
        color: '#ff4d4f' // 红色，表示错误  
    }
}