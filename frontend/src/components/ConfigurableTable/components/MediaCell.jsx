import React, { useEffect, memo, useRef } from 'react';
import { Image } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getFullUrl } from '@/utils';
import imageError from '@/assets/images/imageError.svg';
import videoError from '@/assets/images/videoError.svg';
// 通用 Hook：只允许一个音频或视频播放，type: 'audio' | 'video'
function useSingleMediaPlay(ref, type) {
    React.useEffect(() => {
        const media = ref.current;
        if (!media) return;
        // 全局状态初始化
        window.MEDIA_PREVIEW = window.MEDIA_PREVIEW || {
            IMAGE: false,
            VIDEO: false,
            AUDIO: false,
            currentAudio: null,
            currentVideo: null,
            isAnyPreviewActive() {
                return this.IMAGE || this.VIDEO || this.AUDIO;
            }
        };
        // 播放时只允许一个同类型媒体播放
        const handlePlay = () => {
            const key = type === 'audio' ? 'currentAudio' : 'currentVideo';
            if (window.MEDIA_PREVIEW[key] && window.MEDIA_PREVIEW[key] !== media) {
                window.MEDIA_PREVIEW[key].pause();
            }
            window.MEDIA_PREVIEW[key] = media;
        };
        // 结束或暂停时清理全局引用
        const handleEndedOrPause = () => {
            const key = type === 'audio' ? 'currentAudio' : 'currentVideo';
            if (window.MEDIA_PREVIEW[key] === media) {
                window.MEDIA_PREVIEW[key] = null;
            }
        };
        media.addEventListener('play', handlePlay);
        media.addEventListener('pause', handleEndedOrPause);
        media.addEventListener('ended', handleEndedOrPause);
        return () => {
            media.removeEventListener('play', handlePlay);
            media.removeEventListener('pause', handleEndedOrPause);
            media.removeEventListener('ended', handleEndedOrPause);
            const key = type === 'audio' ? 'currentAudio' : 'currentVideo';
            if (window.MEDIA_PREVIEW[key] === media) {
                window.MEDIA_PREVIEW[key] = null;
            }
        };
    }, [ref, type]);
}

// 标签组件（New/Lock）
const MediaTags = memo(({ record, processedCol }) => {
    const { renderNewTag, renderLockIcon } = processedCol;
    return (
        <>
            {renderNewTag && renderNewTag(record, processedCol)}
            {renderLockIcon && renderLockIcon(record, processedCol)}
        </>
    );
});

// 视频媒体组件
const VideoMedia = memo(({ src }) => {
    const videoRef = useRef(null);
    // 使用通用 Hook 只允许一个视频播放
    useSingleMediaPlay(videoRef, 'video');
    const fullSrc = getFullUrl(src);
    return (
        fullSrc ? <video
            className='video'
            style={{ width: '100%' }}
            src={fullSrc}
            controls
            autoPlay={false}
            ref={videoRef}
        /> : null
    );
});

// 音频媒体组件
const AudioMedia = memo(({ src }) => {
    const audioRef = useRef(null);
    // 使用通用 Hook 只允许一个音频播放
    useSingleMediaPlay(audioRef, 'audio');
    if (!src) return null;
    const fullSrc = getFullUrl(src);
    return <audio className='audio' style={{ width: '100%' }} ref={audioRef} src={fullSrc} controls autoPlay={false} />;
});

// 图片媒体组件
const ImageMedia = memo(({ src, name, onImageError }) => {
    const fullSrc = getFullUrl(src);
    return (
        <div className='image-cell'>
            <Image
                src={fullSrc}
                onClick={e => e.stopPropagation()}
                alt={name || 'Media'}
                preview={{ mask: '', }}
                onError={onImageError}
                loading="lazy"
                fallback={imageError}
                placeholder={
                    < div className='image-placeholder' >
                        <LoadingOutlined />
                    </div>
                }
            />
        </div >
    );
});

// 主单元格组件
const MediaCell = memo(({ record, processedCol }) => {
    const { duration, name, posterImage } = record;
    const { mediaType, dataIndex } = processedCol;


    // 渲染不同类型媒体
    const renderMediaByType = () => {
        const mediaSrc = record[dataIndex];
        const tags = <MediaTags record={record} processedCol={processedCol} />;
        if (mediaType === 'video') {
            return <><VideoMedia src={mediaSrc} posterImage={posterImage} duration={duration} />{tags}</>;
        }
        if (mediaType === 'audio') {
            return <><AudioMedia src={mediaSrc} />{tags}</>;
        }
        // 默认图片
        return (
            <>
                <ImageMedia src={mediaSrc} name={name} />
                <div>{tags}</div>
            </>
        );
    };
    return (
        renderMediaByType()
    );
});

export default React.memo(MediaCell); 