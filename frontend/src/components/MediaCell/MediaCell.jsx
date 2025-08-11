import React, { useState, useCallback, useEffect, memo, useMemo, useRef } from 'react';
import { Image, Modal } from 'antd';
import { FileImageOutlined, CaretRightOutlined, EyeOutlined, LockFilled, CaretRightFilled, CloseOutlined } from '@ant-design/icons';
import { formatDuration } from '@/utils'; // 从 @/utils/index.js 导入
import styles from './MediaCell.module.less'; // 导入 CSS Modules
import { getFullUrl } from '@/utils';
import imageError from "@/assets/images/imageError.svg"
import audioError from "@/assets/images/audioError.svg"
import videoError from "@/assets/images/videoError.svg"
import { transform } from 'lodash';
// MediaType[] = ['video', 'audio', 'image'];
// 全局状态标记，用于跟踪是否有预览处于激活状态
window.MEDIA_PREVIEW = {
    IMAGE: false,
    VIDEO: false,
    AUDIO: false,
    currentAudio: null, // 添加当前播放的音频引用
    isAnyPreviewActive() {
        return this.IMAGE || this.VIDEO || this.AUDIO;
    }
};



// 新标签和锁图标组件
const MediaTags = memo(({ showNewTag, showLockIcon }) => {
    return (
        <>
            {
                !!showNewTag && <div className={styles['new-tag']}>New</div>
            }
            {
                !!showLockIcon && <div className={styles['lock-icon']}><LockFilled /></div>
            }

        </>
    );
});

// 视频媒体组件
const VideoMedia = memo(({ src, posterImage, duration, onPreview, mediaType }) => {
    if (!src) {
        return <div className={`${styles.videoContainer} ${styles.mediaCell}`}>
            <img style={{ width: "100%", height: "100%" }} src={mediaType === 'video' ? videoError : audioError} alt="" />
        </div>;
    }

    const fullSrc = getFullUrl(src);
    const fullPosterImage = getFullUrl(posterImage);

    return (
        <div
            className={`${styles.videoContainer} ${styles.mediaCell}`}
            onClick={(e) => onPreview(e, fullSrc)}
        >
            <div className={`${styles.videoOverlay} ${styles.videoPlayIconOverlay}`}>
                <CaretRightOutlined />
            </div>
            <div className={styles.videoDurationOverlay}>
                {formatDuration(duration)}
            </div>
        </div>
    );
});

// 音频媒体组件
const AudioMedia = memo(({ src, onPreview }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // 播放开始时的处理函数
        const handlePlay = () => {
            // 如果存在其他正在播放的音频，先暂停它
            if (window.MEDIA_PREVIEW.currentAudio && window.MEDIA_PREVIEW.currentAudio !== audio) {
                window.MEDIA_PREVIEW.currentAudio.pause();
            }
            // 更新当前播放的音频引用
            window.MEDIA_PREVIEW.currentAudio = audio;
        };

        // 播放结束或暂停时的处理函数
        const handleEnded = () => {
            if (window.MEDIA_PREVIEW.currentAudio === audio) {
                window.MEDIA_PREVIEW.currentAudio = null;
            }
        };

        // 添加事件监听器
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('pause', handleEnded);

        // 清理事件监听器
        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('pause', handleEnded);
            // 如果当前音频正在播放，清除引用
            if (window.MEDIA_PREVIEW.currentAudio === audio) {
                window.MEDIA_PREVIEW.currentAudio = null;
            }
        };
    }, []);

    if (!src) {
        return null;
    }

    const fullSrc = getFullUrl(src);

    return (
        <audio
            ref={audioRef}
            src={fullSrc}
            controls
            autoPlay={false}
        >
        </audio>
    );
});

// 图片媒体组件
const ImageMedia = memo(({ src, name, onImageError, onPreviewVisibleChange }) => {

    const fullSrc = getFullUrl(src);

    return (
        <div className={`${styles.imageContainer} ${styles.mediaCell}`}>
            <Image
                src={fullSrc}
                onClick={(e) => e.stopPropagation()}
                alt={`${name || 'Media'}'s image`}
                preview={{
                    onVisibleChange: onPreviewVisibleChange,
                    maskClassName: "no-mask"
                }}
                onError={onImageError}
                loading="lazy"
                fallback={imageError}
                placeholder={
                    <div className={styles.imagePlaceholder}>
                        <FileImageOutlined style={{ fontSize: '20px', opacity: 0.5 }} />
                    </div>
                }
            />
        </div>
    );
});

// 媒体预览模态框组件
const MediaPreviewModal = memo(({ type, url, visible, onCancel }) => {
    // 使用ref引用modal容器，避免事件冒泡
    const modalContainerRef = React.useRef(null);

    const isVideo = type === 'video';
    // 处理关闭按钮点击事件
    const handleCloseClick = useCallback((e) => {
        // 阻止事件冒泡但不阻止默认行为
        if (e) e.stopPropagation();
        onCancel();
    }, [onCancel]);

    const fullUrl = getFullUrl(url);

    return (
        <Modal
            open={visible}
            onCancel={handleCloseClick}
            footer={null}
            destroyOnClose
            centered
            width={800}
            maskClosable={true}
            closeIcon={
                <CloseOutlined style={{ fontSize: '30px', color: '#fff' }} />
            }
            wrapClassName="media-preview-modal-wrap prevent-row-click"
            styles={{
                mask: {
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    pointerEvents: 'auto'
                },
                wrapper: { pointerEvents: 'auto' },
                content: {
                    background: 'transparent',
                    boxShadow: 'none',
                },
                body: {
                    padding: '20px',
                    background: 'transparent'
                },
                header: {
                    borderBottom: 'none',
                    background: 'transparent',
                    color: '#fff',
                    padding: '16px 20px',
                    height: 'auto',
                    fontSize: '50px'
                },
                closeButton: {
                    pointerEvents: 'auto',
                    zIndex: 1001,
                    color: '#fff',
                    fontSize: '50px',
                    top: '50px',
                    right: '50px',
                    position: 'fixed'
                }
            }}
        >
            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isVideo ? (
                    <div className={styles.videoPlayer}>
                        <video
                            src={fullUrl}
                            controls
                            style={{ width: '100%', display: 'block', height: '100%', minWidth: '720px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                ) : (
                    <div className={styles.audioPlayer}>
                        <audio
                            src={fullUrl}
                            controls
                            autoPlay={'play'}
                            className={styles.audio}
                        >
                        </audio>
                    </div>
                )}
            </div>
        </Modal>
    );
});

// 主组件
const WorkoutMediaCell = memo(({ record, processedCol }) => {
    const { image, duration, name, newStartTime, newEndTime, posterImage, premium } = record;
    const { mediaType, showNewBadge, showLock, dataIndex } = processedCol;

    // 图片相关状态
    const [imgError, setImgError] = useState(false);
    const [isAntdPreviewVisible, setIsAntdPreviewVisible] = useState(false);

    // 媒体预览状态
    const [previewState, setPreviewState] = useState({
        visible: false,
        url: '',
        type: '' // 'video' 或 'audio'
    });

    // 判断是否显示New标签
    const showNewTag = useMemo(() => {
        const now = new Date().getTime();
        const start = newStartTime ? new Date(newStartTime).getTime() : null;
        const end = newEndTime ? new Date(newEndTime).getTime() : null;

        if (start && end && showNewBadge) {
            console.log(now >= start && now <= end && showNewBadge);

            return now >= start && now <= end && showNewBadge;
        }
        return false;
    }, [newStartTime, newEndTime, showNewBadge]);

    // 判断是否显示锁图标
    const showLockIcon = premium && showLock;

    // 图片加载错误处理
    const handleImageError = useCallback(() => {
        setImgError(true);
    }, []);

    // 媒体预览模态框状态控制
    const handleMediaPreview = useCallback((e, url, type) => {
        e.stopPropagation();
        // 设置全局预览状态
        if (type === 'video') {
            window.MEDIA_PREVIEW.VIDEO = true;
        } else if (type === 'audio') {
            window.MEDIA_PREVIEW.AUDIO = true;
        }
        setPreviewState({ visible: true, url, type });
    }, []);

    // 视频预览处理
    const handleVideoPreview = useCallback((e, url) => {
        handleMediaPreview(e, url, 'video');
    }, [handleMediaPreview]);

    // 音频预览处理
    const handleAudioPreview = useCallback((e, url) => {
        handleMediaPreview(e, url, 'audio');
    }, [handleMediaPreview]);

    // 媒体预览关闭处理
    const handleMediaPreviewClose = useCallback(() => {
        // 重置全局预览状态
        if (previewState.type === 'video') {
            window.MEDIA_PREVIEW.VIDEO = false;
        } else if (previewState.type === 'audio') {
            window.MEDIA_PREVIEW.AUDIO = false;
        }
        setPreviewState(prev => ({ ...prev, visible: false }));
    }, [previewState.type]);

    // 图片预览状态变化处理
    const handleImagePreviewChange = useCallback((visible) => {
        // 更新全局标志
        window.MEDIA_PREVIEW.IMAGE = visible;
        setIsAntdPreviewVisible(visible);
    }, []);

    // 更新全局状态并设置事件处理器
    useEffect(() => {
        // 全局事件拦截器
        const handleGlobalClick = (e) => {
            if (window.MEDIA_PREVIEW.isAnyPreviewActive() && e.target && e.target.classList) {
                // 检查是否点击了模态框关闭按钮（检查自定义数据属性或类名）
                const isCloseButton = e.target.dataset && e.target.dataset.mediaModalClose === 'true' ||
                    e.target.closest('.ant-modal-close') ||
                    e.target.classList.contains('ant-modal-close') ||
                    e.target.classList.contains('ant-modal-close-x') ||
                    e.target.classList.contains('custom-close-icon');

                // 如果是关闭按钮，不要阻止事件，让它正常工作
                if (isCloseButton) {
                    // 不执行任何操作，让默认的关闭处理逻辑工作
                    return;
                }

                const isMaskOrWrap =
                    e.target.classList.contains('ant-modal-mask') ||
                    e.target.classList.contains('ant-modal-wrap') ||
                    e.target.classList.contains('ant-image-preview-mask');

                if (isMaskOrWrap) {
                    e.stopPropagation();

                    // 如果是媒体预览的蒙层点击，关闭媒体预览
                    if (previewState.visible && !e.target.classList.contains('ant-image-preview-mask')) {
                        handleMediaPreviewClose();
                    }
                }
            }
        };

        // 使用捕获阶段处理事件
        if (window.MEDIA_PREVIEW.isAnyPreviewActive()) {
            document.addEventListener('click', handleGlobalClick, true);
            document.addEventListener('mousedown', handleGlobalClick, true);
        }

        return () => {
            document.removeEventListener('click', handleGlobalClick, true);
            document.removeEventListener('mousedown', handleGlobalClick, true);
        };
    }, [previewState.visible, handleMediaPreviewClose]);

    // 根据媒体类型渲染不同组件
    const renderMediaByType = () => {
        const mediaSrc = record[dataIndex];

        // 媒体标签组件（在各媒体组件内部使用）
        const tags = <MediaTags showNewTag={showNewTag} showLockIcon={showLockIcon} />;

        // 根据媒体类型渲染
        switch (mediaType) {
            case 'video':
                return (
                    <>
                        <VideoMedia
                            src={mediaSrc}
                            mediaType={mediaType}
                            posterImage={posterImage}
                            duration={duration}
                            onPreview={handleVideoPreview}
                        />
                        {tags}
                    </>
                );

            case 'audio':
                return (
                    <>
                        <AudioMedia
                            src={mediaSrc}
                            mediaType={mediaType}

                            onPreview={handleAudioPreview}
                        />
                        {tags}
                    </>
                );

            default: // 默认作为图片处理

                return (
                    <div className={`${styles.imageContainer} ${styles.mediaCell}`}>
                        <ImageMedia
                            src={mediaSrc}
                            name={name}
                            onImageError={handleImageError}
                            onPreviewVisibleChange={handleImagePreviewChange}
                        />
                        <div>
                            {tags}
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            {renderMediaByType()}
            {previewState.visible && (
                <MediaPreviewModal
                    type={previewState.type}
                    url={previewState.url}
                    visible={previewState.visible}
                    onCancel={handleMediaPreviewClose}
                />
            )}
        </>
    );
});

export default WorkoutMediaCell; 