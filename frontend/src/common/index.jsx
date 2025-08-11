import { PauseCircleOutlined, PlayCircleOutlined, LockFilled } from '@ant-design/icons';
import { Switch, Space } from 'antd';


// 创建音频播放器的引用
let audioPlayer = null;
// 当前播放的音频URL
let playingUrl = null;

// 播放或暂停音频的函数
const playAudio = (option, e, isPlaying, setIsPlaying) => {
    // 阻止事件冒泡和默认行为
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(isPlaying === option.value ? null : option.value);
    // 如果点击的是当前正在播放的音频，则暂停
    if (playingUrl === option.url && audioPlayer) {
        audioPlayer.pause();


        audioPlayer.src = '';
        playingUrl = null;
        return;
    }

    // 如果有正在播放的音频，先停止它
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
    }

    // 创建新的音频对象并播放
    const audio = new Audio(option.url);
    audio.play();
    audioPlayer = audio;

    playingUrl = option.url;

    // 监听音频播放结束事件
    audio.onended = () => {
        playingUrl = null;
    };
};

// 音频选择播放标签
export const renderSelectAudioLabel = (option, isPlaying, setIsPlaying, form) => {
    return (
        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, justifyContent: 'space-between', padding: '0 20px' }}>
            <span>{option.label}</span>
            <div
                style={{ display: 'flex', height: '100%', alignItems: 'center' }}
                onClick={(e) => {
                    playAudio(option, e, isPlaying, setIsPlaying);
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    playAudio(option, e, isPlaying, setIsPlaying);

                }}>
                {isPlaying && isPlaying === option.value ? (
                    <PauseCircleOutlined
                        style={{ marginLeft: 16, color: '#1c8', fontSize: 20 }}
                    />
                ) : (
                    <PlayCircleOutlined
                        style={{ marginLeft: 16, color: '#1c8', fontSize: 20 }}
                    />
                )}
            </div>
        </span >
    );
}
// 渲染名称列
export const renderNameColumn = (text, row) => {
    return (
        <div>
            <div className='cell-name' style={{ marginBottom: "5px" }}>{text}</div>
            <div className='cell-id'>ID:{row.id}</div>
        </div>
    );
}

// 渲染开关列
export const renderSwitchColumn = (text) => {
    return (
        <Switch disabled={true} checked={!!text} />
    );
}
// 渲染New标签
export const renderNewTag = (record, processedCol) => {
    const { newStartTime, newEndTime } = record;
    const now = Date.now();
    const start = newStartTime ? new Date(newStartTime).getTime() : null;
    const end = newEndTime ? new Date(newEndTime).getTime() : null;
    const showNewTag = start && end && now >= start && now <= end;
    return (
        showNewTag ? <div className='new-tag'>New</div> : null
    );
}
// 渲染锁图标
export const renderLockIcon = (record, processedCol) => {
    const { premium } = record;
    return (
        premium ? <div className='lock-icon'><LockFilled /></div> : null
    );
}