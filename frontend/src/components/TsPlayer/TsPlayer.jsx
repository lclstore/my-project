import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import React, { memo } from 'react';

/**
 * TsPlayer组件 - 用于播放TS格式视频
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.url - 视频URL地址
 * @param {Function} props.onDurationChange - 视频时长变化回调
 * @param {Function} props.onError - 错误处理回调
 * @param {Object} props.style - 自定义样式
 * @returns {JSX.Element} 视频播放器组件
 */
const TsPlayer = memo(({
    url = '',
    onDurationChange,
    onError,
    style = {}
}) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const durationReported = useRef(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * 将TS文件转换为M3U8格式
     * @param {string} url - TS文件URL
     * @returns {string} - 生成的M3U8 blob URL
     */
    const tsTransformM3u8 = useCallback((url) => {
        const m3u8DataArray = [
            "#EXTM3U",
            "#EXT-X-VERSION:4",
            "#EXT-X-ALLOW-CACHE:NO",
            "#EXT-X-TARGETDURATION:3000",
            "#EXT-X-PLAYLIST-TYPE:VOD",
            "#EXT-X-START:TIME-OFFSET=0",
            "#EXT-X-MEDIA-SEQUENCE:0",
            "#EXTINF:0.000000,",
            `${url}`,
            "#EXT-X-ENDLIST"
        ];
        const m3u8Text = m3u8DataArray.map(line => line + '\n').join('');
        const blob = new Blob([m3u8Text], { type: 'application/vnd.apple.mpegurl' });
        return URL.createObjectURL(blob);
    }, []);

    /**
     * 创建视频播放器实例
     * @param {string} url - M3U8格式的URL
     */
    const createVideoPlayer = useCallback((url) => {
        setLoading(true);

        try {
            if (Hls.isSupported()) {
                // 销毁之前的HLS实例
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }

                // 创建新的HLS实例
                const hls = new Hls({
                    // HLS配置选项
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                });
                hlsRef.current = hls;

                // 挂载到视频元素
                hls.attachMedia(videoRef.current);
                hls.loadSource(url);

                // 监听事件
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setLoading(false);
                    // 不再自动播放视频
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS错误:', data);
                    const errorMsg = `Playback error: ${data.type} - ${data.details}`;
                    setError(errorMsg);
                    if (onError) onError(errorMsg);
                    setLoading(false);
                });
            } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari支持原生播放m3u8
                videoRef.current.src = url;
                setLoading(false);
            } else {
                // 不支持HLS的浏览器
                const errorMsg = 'Your browser does not support HLS playback';
                setError(errorMsg);
                if (onError) onError(errorMsg);
                setLoading(false);
            }
        } catch (err) {
            console.error('创建播放器失败:', err);
            setError('Failed to create player');
            if (onError) onError(err.message);
            setLoading(false);
        }
    }, [onError]);

    // URL变化时初始化播放器
    useEffect(() => {
        if (url) {
            setError(null); // 重置错误状态
            const m3u8Url = tsTransformM3u8(url);
            createVideoPlayer(m3u8Url);
        }
    }, [url, tsTransformM3u8, createVideoPlayer]);

    // 组件卸载时清理资源
    useEffect(() => {
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
            // 清理所有创建的blob URLs
            if (videoRef.current && videoRef.current.src.startsWith('blob:')) {
                URL.revokeObjectURL(videoRef.current.src);
            }
        };
    }, []);

    // 时长变化处理
    const handleMetadataChange = useCallback((e) => {
        if (onDurationChange) {
            onDurationChange(e);
        }
    }, [onDurationChange]);

    // URL变化时重置标记
    useEffect(() => {
        durationReported.current = false;
    }, [url]);

    return (
        <div className="ts-player-container">
            {loading && <div className="ts-player-loading">Loading...</div>}
            {error && <div className="ts-player-error">{error}</div>}
            <video
                ref={videoRef}
                onDurationChange={handleMetadataChange}
                controls
                style={{ width: '100%', height: '100%', ...style }}
                className="ts-player-video"
            >
                Your browser does not support video playback
            </video>
        </div>
    );
});

// 添加显示名称以便调试
TsPlayer.displayName = 'TsPlayer';

export default TsPlayer;
