import React, { useCallback, useRef, useState, useMemo, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { Upload, Button, Image, Spin, Typography, message, Modal, Tooltip } from 'antd';
import {
    PlusOutlined,
    DownloadOutlined,
    EditOutlined,
    DeleteOutlined,

} from '@ant-design/icons';
import { getFullUrl } from '@/utils';
import settings from '@/config/settings';
const { file: fileSettings } = settings;
import styles from './FileUpload.module.css';
import Hls from 'hls.js';
import FormLabel from '@/components/FormLabel/FormLabel';
import TsPlayer from '@/components/TsPlayer/TsPlayer';
import musicIcon from '@/assets/images/music.png';
import videoIcon from '@/assets/images/video.png';
import imageIcon from '@/assets/images/image.png';
import { duration } from 'moment/moment';

// 添加全局音频管理
const audioManager = {
    currentAudio: null,
    currentCallback: null,
    stopCurrent: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
            if (this.currentCallback) {
                this.currentCallback(false);
            }
        }
    },
    setCurrentAudio: function (audio, callback) {
        this.stopCurrent();
        this.currentAudio = audio;
        this.currentCallback = callback;
    }
};

/**
 * @description 自定义文件上传控件
 * @param {Object} field - 字段配置，包含上传逻辑、URL、限制等
 * @param {boolean} disabled - 是否禁用
 * @param {string} name - 字段名
 * @param {function} onChange - 文件状态改变时的回调 (Form.Item 注入)
 * @param {string} value - 当前文件值 (Form.Item 注入)
 */
const FileUpload = ({
    form,
    acceptedFileTypes,  // 接受的文件类型，字符串或数组，如 ['jpg', 'png'] 或 '.jpg,.png'
    maxFileSize,        // 最大文件大小，单位为KB
    disabled = false,   // 是否禁用上传功能
    name,               // 表单项名称
    onChange,           // 值变化时的回调函数
    value,              // 当前文件的URL值
    uploadDescription,  // 自定义上传区域描述文本，不提供则自动生成
    uploadErrorMessage, // 自定义上传错误消息
    uploadFn = fileSettings?.uploadFile, // 自定义上传函数
    dirKey, // 上传目录键名
    uploadSuccessMessage, // 自定义上传成功消息
    uploadFailMessage,    // 自定义上传失败消息
    beforeUpload,         // 上传前的自定义验证函数
    props = {},           // 传递给底层Upload组件的额外属性
    uploadPlaceholder,    // 上传区域占位文本
    changeButtonText,     // 更改按钮文本
    uploadButtonText,     // 上传按钮文本
    field,                // 字段配置
}) => {
    // 消息提示API
    const [messageApi, contextHolder] = message.useMessage();
    const durationRef = useRef(null);// 时长
    // 上传组件引用
    const draggerRef = useRef(null);
    // 文件输入引用
    const fileInputRef = useRef(null);
    // HLS <video> 元素引用
    const videoRef = useRef(null);
    // HLS.js 实例引用
    const hlsRef = useRef(null);
    // 上传状态
    const [uploading, setUploading] = useState(false);

    // 从 Form.Item 接收原始值并处理
    const [internalValue, setInternalValue] = useState(value);

    // HLS 相关状态
    const [hlsLoading, setHlsLoading] = useState(false);
    const [hlsError, setHlsError] = useState(null);

    // 添加音频相关状态
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState('');
    const audioRef = useRef(null);

    // 媒体预览状态
    const [previewState, setPreviewState] = useState({
        visible: false,
        url: '',
        type: '' // 'video' 或 'audio'
    });

    // 在组件顶部添加状态
    const [fileSize, setFileSize] = useState(null);

    // 添加文件大小加载状态
    const [fileSizeLoading, setFileSizeLoading] = useState(false);

    // 当外部 value 变化时更新内部状态
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const displayValue = internalValue ? getFullUrl(internalValue) : null;
    // 是否有文件
    const hasFile = !!displayValue;

    // 获取文件名 - 移动到前面定义，确保在使用前已初始化
    const getFileName = (url) => {
        if (!url) return '';
        // 移除查询参数和哈希片段
        const [cleanUrl] = url.split(/[?#]/);
        // 处理 data URI
        if (cleanUrl.startsWith('data:')) {
            // 优先匹配 name 参数
            const nameMatch = cleanUrl.match(/(?:name=)([^;,]+)/);
            if (nameMatch && nameMatch[1]) {
                return decodeURIComponent(nameMatch[1]);
            }
            // 使用 MIME 类型作为扩展名回退
            const mimeMatch = cleanUrl.match(/^data:([^;,]+)/);
            const ext = mimeMatch ? mimeMatch[1].split('/')[1] : 'bin';
            return `file.${ext}`;
        }

        try {
            // 通过 URL API 解析路径并提取文件名
            const pathname = new URL(cleanUrl, window.location.origin).pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            return decodeURIComponent(filename) || 'File';
        } catch {
            // URL API 解析失败时的简单回退
            const fallback = cleanUrl.split('/').pop();
            return decodeURIComponent(fallback) || 'File';
        }
    }
    // 获取上传类型
    const getUploadType = (failed) => {
        const types = failed?.acceptedFileTypes?.split(',').map(t => t.trim().toLowerCase().replace(/^\./, '')) || [];
        const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']);
        const audioExts = new Set(['mp3', 'wav', 'aac', 'ogg', 'flac']);
        const videoExts = new Set(['mp4', 'webm', 'avi', 'mov', 'mkv']);
        for (const ext of types) {
            if (imageExts.has(ext)) return imageIcon;
            if (audioExts.has(ext)) return musicIcon;
            if (videoExts.has(ext)) return videoIcon;
        }
        return imageIcon; // 默认图标
    };

    // 判断文件类型
    const getFileType = (url) => {
        if (!url) return 'none';
        let cleanPath = url;
        // 去掉 query/hash 参数
        let urlObj = new URL(url, window.location.origin);
        cleanPath = urlObj.pathname;
        let ext = cleanPath.split('.').pop().toLowerCase();

        const EXT_MAP = {
            hlsManifest: ['m3u8'],
            tsVideo: ['ts'],
            image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
            audio: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'],
            video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv']
        };

        // 优先用扩展名判断
        if (ext) {
            for (const type in EXT_MAP) {
                if (EXT_MAP[type].includes(ext)) {
                    return type;
                }
            }
        }

        // data URI 检测
        if (url.startsWith('data:')) {
            const mime = url.slice(5).split(';')[0]; // 获取 mime type
            if (mime === 'application/vnd.apple.mpegurl' || mime === 'audio/mpegurl') return 'hlsManifest';
            if (mime === 'video/mp2t') return 'tsVideo';
            const mainType = mime.split('/')[0];
            if (['image', 'audio', 'video'].includes(mainType)) return mainType;
        }

        return 'other';
    }

    // 修复acceptedFileTypes格式
    const formatAcceptedFileTypes = useMemo(() => {
        if (!acceptedFileTypes) return undefined;

        // 处理数组或字符串格式
        const types = typeof acceptedFileTypes === 'string'
            ? acceptedFileTypes.split(',')
            : acceptedFileTypes;

        return types.map(type => {
            type = type.trim();
            // 确保是MIME类型或带点的扩展名
            if (type && !type.startsWith('.') && !type.includes('/')) {
                return `.${type}`;
            }
            return type;
        }).filter(Boolean).join(',');
    }, [acceptedFileTypes]);

    // 动态生成上传区域的描述文本
    const generatedUploadDescription = useMemo(() => {
        // 初始化描述字符串
        let desc = '';

        // 文件类型描述
        if (acceptedFileTypes) {
            const types = (typeof acceptedFileTypes === 'string' ? acceptedFileTypes.split(',') : acceptedFileTypes);
            // 处理类型，去掉点并大写
            const typesText = types
                .map(t => t.trim().toUpperCase().replace(/^\./, '')) // 去掉前面的点并大写
                .filter(Boolean)
                .join(' • '); // 用 ' • ' 连接类型
            if (typesText) desc += typesText;
        }

        // 文件大小限制描述
        if (maxFileSize && typeof maxFileSize === 'number') {
            if (desc) desc += ' • '; // 添加前缀分隔

            const units = ['KB', 'MB', 'GB'];
            let size = maxFileSize;
            let unitIndex = 0;

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            const formattedSize = Number.isInteger(size) ? size : size.toFixed(1);
            desc += `${formattedSize}${units[unitIndex]}`;
        }

        // 如果都没有，显示默认
        if (!desc) desc = "支持常见格式";
        return desc;
    }, [acceptedFileTypes, maxFileSize]);

    // 处理清除文件
    const handleClearFile = useCallback(() => {
        // 更新内部状态
        setInternalValue(null);
        // 通知外部状态变化
        if (onChange) {
            onChange(null);
        }
        setUploading(false);

        // 确保清空后触发重新渲染
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // 清理视频资源
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }

        // 清理HLS实例
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setHlsError(null);
        setHlsLoading(false);
        setFileSize(null);

    }, [onChange]);

    // 上传失败处理
    const handleUploadError = useCallback((error) => {
        console.error('Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
        const failMsg = `${uploadErrorMessage || 'Upload failed'}: ${errorMessage}`;
        messageApi.error(failMsg);
        setUploading(false);
    }, [uploadErrorMessage, messageApi]);

    // 自定义上传请求
    const customUploadRequestHandler = useCallback(async (options) => {
        const { onSuccess, onError, file, onProgress } = options;
        if (!uploadFn) {
            const errorMsg = "Upload function not configured";
            console.error(errorMsg);
            onError(new Error(errorMsg));
            handleUploadError(new Error(errorMsg));
            return;
        }

        setUploading(true);
        try {
            const result = await uploadFn({
                file,
                dirKey: dirKey,
                onProgress: (event) => {
                    if (onProgress && typeof event?.percent === 'number') {
                        onProgress({ percent: event.percent });
                    }
                }
            });

            if (result && result.error) {
                const errorToThrow = result.error instanceof Error ?
                    result.error : new Error(String(result.error.message || result.error || 'Unknown upload error'));
                throw errorToThrow;
            }
            // 只调用一次上传成功回调，避免多次触发消息提示
            onSuccess(result);

            // 直接处理结果，不再调用handleUploadSuccess
            const urlToSet = result?.fileUrl || result?.fileRelativeUrl ||
                (typeof result === 'string' ? result : null);

            if (urlToSet) {
                console.log(`File upload successful, URL: ${urlToSet}`);

                // 获取文件扩展名，确定正确的处理方式
                const fileName = getFileName(urlToSet);
                const extension = fileName.split('.').pop()?.toLowerCase();
                console.log(`File type: ${extension}`);

                // 确保清除任何现有的 HLS 实例和错误状态
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
                setHlsError(null);
                setHlsLoading(false);

                // 确保清除任何现有的视频元素的src属性
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.removeAttribute('src');
                    videoRef.current.load();
                }

                // 重置所有视频元素的重试标记
                document.querySelectorAll('video').forEach(video => {
                    if (video.dataset && video.dataset.recoveryAttempted) {
                        delete video.dataset.recoveryAttempted;
                    }
                });

                // 更新内部状态 - 这将触发 useEffect 和重新渲染
                setInternalValue(urlToSet);

                // 更新表单值
                if (onChange) {
                    onChange(urlToSet, file, form);
                }

                // 显示成功消息 - 在这里处理一次即可
                const successMsg = uploadSuccessMessage || 'Upload successfully!';
                // messageApi.success(successMsg);
            } else {
                console.error('Upload did not return valid URL:', result);
                const failMsg = uploadFailMessage || 'Failed to get file upload URL';
                messageApi.error(failMsg);
            }

            setUploading(false);
        } catch (err) {
            onError(err);
            handleUploadError(err);
        }
    }, [uploadFn, dirKey, handleUploadError, onChange, setInternalValue, uploadSuccessMessage, uploadFailMessage, messageApi, getFileName]);

    // 处理 Upload 组件的 onChange - 确保这里不会重复显示消息
    const handleAntUploadChange = useCallback((info) => {
        if (info.file.status === 'uploading' && !uploading) {
            setUploading(true);
        } else if (['done', 'error', 'removed'].includes(info.file.status) && uploading) {
            setUploading(false);
        } else if (info.file.status === 'removed') {
            handleClearFile();
        }

        // 不在这里处理上传成功的消息提示
    }, [handleClearFile, uploading]);

    // 上传前验证
    const handleBeforeUpload = useCallback((file) => {
        let isValid = true;
        const errorMessages = [];

        // 文件类型验证
        if (acceptedFileTypes) {
            const acceptedTypes = (typeof acceptedFileTypes === 'string'
                ? acceptedFileTypes.split(',')
                : acceptedFileTypes)
                .map(t => t.trim().toLowerCase())
                .filter(Boolean);

            if (acceptedTypes.length > 0) {
                const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                const isAccepted = acceptedTypes.some(type => {
                    // 移除点前缀进行比较
                    return type.replace(/^\./, '') === fileExt;
                });
                if (!isAccepted) {
                    isValid = false;
                    const typesText = acceptedTypes.map(t => t.replace(/^\./, '')).join(', ');
                    errorMessages.push(`This file type is not supported. Allowed types: ${typesText}`);
                }
            }
        }

        // 文件大小验证
        if (maxFileSize && typeof maxFileSize === 'number') {
            const maxSizeInBytes = maxFileSize * 1024;
            if (file.size > maxSizeInBytes) {
                isValid = false;
                errorMessages.push(`File size exceeds limit ${maxFileSize}KB`);
            }
        }

        // 自定义验证
        if (typeof beforeUpload === 'function') {
            try {
                const result = beforeUpload(file);
                if (result === false) {
                    isValid = false;
                    if (errorMessages.length === 0) {
                        errorMessages.push('File rejected by custom validation');
                    }
                } else if (result instanceof Promise) {
                    return result.catch(err => {
                        messageApi.error(`Upload check failed: ${err?.message || 'Rejected by custom check'}`);
                        return Promise.reject(err);
                    });
                }
            } catch (e) {
                console.error("Custom validation function error:", e);
                isValid = false;
                errorMessages.push(`Custom validation error: ${e.message}`);
            }
        }

        if (!isValid && errorMessages.length > 0) {
            messageApi.error(errorMessages.join('. '));
            return false;
        }

        return true;
    }, [acceptedFileTypes, maxFileSize, beforeUpload, messageApi]);

    // 处理文件选择
    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 保存文件大小（转换为KB）
        setFileSize(file.size / 1024);

        // 验证文件
        const isValid = handleBeforeUpload(file);
        if (!isValid) return;

        // 手动上传文件
        customUploadRequestHandler({
            file,
            onSuccess: () => {
                // 不在这里调用handleUploadSuccess，避免重复处理
            },
            onError: (error) => {
                handleUploadError(error);
            },
            onProgress: (event) => {
                // 处理上传进度
            }
        });

        // 重置文件输入，以便下次选择同一文件时也能触发change事件
        event.target.value = '';
    }, [handleBeforeUpload, customUploadRequestHandler, handleUploadError]);

    // 手动触发文件选择对话框
    const triggerFileSelect = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        } else if (draggerRef.current?.upload?.uploader?.fileInput) {
            draggerRef.current.upload.uploader.fileInput.click();
        }
    }, []);

    // 上传组件属性
    const uploadProps = useMemo(() => ({
        name: name,
        beforeUpload: handleBeforeUpload,
        onChange: handleAntUploadChange,
        accept: formatAcceptedFileTypes, // 使用格式化后的类型
        multiple: false,
        disabled: disabled || uploading,
        showUploadList: false,
        customRequest: customUploadRequestHandler,
        // 确保打开文件选择对话框
        openFileDialogOnClick: true,
        ...(props || {})
    }), [
        name, handleBeforeUpload, handleAntUploadChange, formatAcceptedFileTypes,
        disabled, uploading, customUploadRequestHandler, props
    ]);

    // Effect Hook 用于管理 HLS 播放器
    useEffect(() => {
        const currentVideoElement = videoRef.current;
        const currentFileType = getFileType(displayValue); // 从 useMemo 获取当前文件类型

        // 只有 .m3u8 清单文件需要 HLS.js 处理
        if (currentFileType !== 'hlsManifest') {
            setHlsLoading(false);
            setHlsError(null);

            // 清理任何现有的 HLS 实例
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            return;
        }

        // 以下是处理 HLS 清单文件的逻辑
        // 重置 HLS 相关状态
        setHlsLoading(true);
        setHlsError(null);

        // 确保视频元素和文件 URL 都存在
        if (!displayValue || !currentVideoElement) {
            setHlsLoading(false);
            return;
        }

        // 确保视频元素被重置
        currentVideoElement.pause();
        currentVideoElement.removeAttribute('src');
        currentVideoElement.load();

        let isComponentMounted = true;

        // 尝试使用 HLS.js
        if (Hls.isSupported()) {
            // 如果已存在 HLS 实例，先销毁它
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            // 创建新的 HLS 实例，带优化配置
            const hls = new Hls({
                // 高级配置选项
                maxBufferLength: 30,          // 最大缓冲区长度（秒）
                maxMaxBufferLength: 60,       // 极端情况下的最大缓冲区长度
                enableWorker: true,           // 启用 Web Worker 提高解码性能
                lowLatencyMode: false,        // 非低延迟模式更稳定
                startLevel: -1,               // 自动选择初始质量级别（-1）
                autoStartLoad: true,          // 自动开始加载
                abrEwmaDefaultEstimate: 500000, // 初始带宽估计值（500kbps）
                // 调试选项
                debug: false,                 // 生产环境禁用调试
                // 分段加载优化
                fragLoadingMaxRetry: 6,       // 分段加载失败最大重试次数
                manifestLoadingMaxRetry: 4,   // 清单加载失败最大重试次数
                levelLoadingMaxRetry: 4,      // 级别加载最大重试次数
            });

            // 加载视频源
            hls.loadSource(displayValue);
            hls.attachMedia(currentVideoElement);

            // 监听 HLS 事件
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isComponentMounted) {
                    setHlsLoading(false);
                }
                // 允许播放但不自动开始，让用户控制
                // currentVideoElement.play().catch(e => console.warn('Auto-play was prevented:', e));
            });

            // 监听 HLS 级别切换事件
            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                // 可以在这里记录或响应质量级别的变化
                console.debug(`HLS 切换到质量级别: ${data.level}`);
            });

            // 添加媒体加载事件监听
            currentVideoElement.addEventListener('loadeddata', () => {
                if (isComponentMounted) {
                    setHlsLoading(false);
                }
            });

            // 错误处理
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS 错误:', data);

                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // 网络错误，可尝试恢复
                            const networkErrorMsg = 'Video network loading error, trying to recover...';
                            if (isComponentMounted) {
                                setHlsError(networkErrorMsg);
                                messageApi.error(networkErrorMsg);
                            }

                            // 尝试恢复网络错误
                            hls.startLoad();
                            break;

                        case Hls.ErrorTypes.MEDIA_ERROR:
                            // 媒体错误，可尝试恢复
                            const mediaErrorMsg = 'Video decoding error, trying to recover...';
                            if (isComponentMounted) {
                                setHlsError(mediaErrorMsg);
                                messageApi.error(mediaErrorMsg);
                            }

                            // 尝试恢复媒体错误
                            hls.recoverMediaError();
                            break;

                        default:
                            // 其他致命错误，无法恢复
                            const fatalMsg = 'An unrecoverable error occurred while playing the video';
                            if (isComponentMounted) {
                                setHlsError(fatalMsg);
                                setHlsLoading(false);
                                messageApi.error(fatalMsg);
                            }

                            // 销毁实例
                            hls.destroy();
                            hlsRef.current = null;
                            break;
                    }
                } else {
                    // 非致命错误，记录但不中断播放
                    console.warn('HLS 非致命错误:', data);
                }
            });

            // 保存 HLS 实例
            hlsRef.current = hls;
        } else if (currentVideoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // 浏览器原生支持 HLS (例如 Safari)
            try {
                // 设置源并监听事件
                currentVideoElement.src = displayValue;

                // 添加加载事件监听
                const loadedHandler = () => {
                    if (isComponentMounted) {
                        setHlsLoading(false);
                    }
                };

                // 添加错误处理
                const errorHandler = (error) => {
                    console.error('HLS 原生播放错误:', error);

                    if (isComponentMounted) {
                        setHlsError('Video playback failed, please check if the file is valid');
                        setHlsLoading(false);
                        messageApi.error('Video playback failed');
                    }
                };

                currentVideoElement.addEventListener('loadeddata', loadedHandler);
                currentVideoElement.addEventListener('error', errorHandler);

                // 清理函数中移除事件监听
                return () => {
                    isComponentMounted = false;
                    currentVideoElement.removeEventListener('loadeddata', loadedHandler);
                    currentVideoElement.removeEventListener('error', errorHandler);

                    // 移除源
                    currentVideoElement.removeAttribute('src');
                    currentVideoElement.load();
                };
            } catch (error) {
                console.error('原生 HLS 播放设置失败:', error);

                if (isComponentMounted) {
                    setHlsError(`Video playback failed: ${error.message}`);
                    setHlsLoading(false);
                    messageApi.error('Video player setup failed');
                }
            }
        } else {
            // 既不支持 HLS.js 也不支持原生 HLS
            const unsupportedMsg = 'Your browser does not support HLS video playback';

            if (isComponentMounted) {
                setHlsError(unsupportedMsg);
                setHlsLoading(false);
                messageApi.warning(unsupportedMsg);
            }
        }

        // 清理函数
        return () => {
            isComponentMounted = false;

            // 清理 HLS.js 实例
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [displayValue, getFileType, messageApi]);


    // 修改格式化时间函数
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    };

    // 添加获取时长的函数
    const getDuration = useCallback(async (url) => {
        return new Promise((resolve) => {
            const media = document.createElement('video');
            media.src = url;
            media.addEventListener('loadedmetadata', () => {
                const duration = formatTime(media.duration);
                field.durationName && form.setFieldValue(field.durationName, parseInt(media.duration * 1000))
                resolve(duration);
                media.remove(); // 清理临时音频元素
            });
            media.addEventListener('error', () => {
                resolve('00:00:00,000'); // 加载失败时返回默认值
                media.remove(); // 清理临时音频元素
            });
        });
    }, [formatTime]);

    // 添加初始化时获取时长的效果
    useEffect(() => {
        if (displayValue && (getFileType(displayValue) === 'audio' || getFileType(displayValue) === 'video')) {
            getDuration(displayValue).then(duration => {
                setAudioDuration(duration);
            });
        } else {
            setAudioDuration('');
        }
    }, [displayValue, getFileType, getDuration]);

    // 当文件改变时重置音频状态
    useEffect(() => {
        setIsPlaying(false);
        setAudioDuration('');
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }, [displayValue]);
    useEffect(() => {
        // 监听全局 audio 播放事件，确保只播放一个音频
        const handleAudioPlay = (e) => {
            // 获取所有 audio 元素
            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
                // 不是当前播放的 audio 就暂停
                if (audio !== e.target) {
                    audio.pause();
                }
            });
        };
        document.addEventListener('play', handleAudioPlay, true); // 捕获阶段

        // 卸载时移除监听
        return () => {
            document.removeEventListener('play', handleAudioPlay, true);
        };
    }, []);
    // 修改获取文件信息的函数和相关useEffect
    const getMediaInfo = useCallback(async (url) => {
        if (!url) return;

        setFileSizeLoading(true); // 开始加载时设置状态
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const size = response.headers.get('content-length');
            if (size) {
                setFileSize(parseInt(size) / 1024); // 转换为 KB
            }
        } catch (error) {
            console.error('获取文件大小失败:', error);
        } finally {
            setFileSizeLoading(false); // 无论成功失败都结束加载状态
        }
    }, []);

    // 将文件信息获取移到组件初始化阶段
    useEffect(() => {
        if (displayValue) {
            getMediaInfo(displayValue);
        } else {
            setFileSize(null);
        }
    }, [displayValue, getMediaInfo]);

    // 获取文件时长
    const getMediaDuration = (e) => {
        const duration = e.target.duration;
        // setAudioDuration(duration);
    }
    // 格式化时间
    const formatTimeForSubtitle = (seconds) => {
        if (!seconds) return '';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        // 补零格式化（padStart）
        const pad = (num, size) => String(num).padStart(size, '0');

        return ` • ${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
    };
    // 渲染文件预览
    const RenderFilePreview = ({ field }) => {
        if (!hasFile) return null;

        switch (getFileType(displayValue)) {
            case 'image':
                return (
                    <div style={field.style || {}}>
                        <Image
                            src={displayValue}
                            alt={getFileName(displayValue)}
                            className={styles.avatarImg}
                            preview={{ mask: null }}
                        />
                    </div>
                );

            case 'audio':
                return (
                    <audio controls onLoadedMetadata={getMediaDuration} src={displayValue} style={{ width: '100%' }} ></audio>
                );

            case 'video':

                return (
                    <video
                        onLoadedMetadata={getMediaDuration}
                        className={styles.videoPreview}
                        src={displayValue}
                        controls
                    >
                        Your browser does not support playing this video
                    </video>
                );
            case 'tsVideo': // HLS 清单文件 (.m3u8)

                return (
                    <TsPlayer url={displayValue} onDurationChange={(e) => {
                        if (durationRef.current) {
                            console.log(e.target.duration);
                            durationRef.current.innerHTML = formatTimeForSubtitle(e.target.duration);
                        }
                    }} />
                );
        }
    };
    // 格式化文件大小
    const formatFileSize = (sizeInKB) => {
        if (!sizeInKB) return '';

        const format = (value, unit) => {
            const num = Number(value.toFixed(2));
            return (Number.isInteger(num) ? num : num.toFixed(2)) + unit;
        };

        if (sizeInKB >= 1024 * 1024) {
            return format(sizeInKB / 1024 / 1024, 'GB');
        } else if (sizeInKB >= 1024) {
            return format(sizeInKB / 1024, 'MB');
        } else {
            return format(sizeInKB, 'KB');
        }
    };

    // 视频预览处理
    const getLabelWithTooltip = ({ label, tooltip, tooltipPlacement, trigger, acceptedFileTypes, maxFileSize }) => {
        if (!acceptedFileTypes && !maxFileSize) return <span ></span>;
        const fileTypesStr = acceptedFileTypes.toUpperCase().split(',').join('/');// 文件类型
        const fileSizeStr = formatFileSize(maxFileSize);// 文件大小
        const tip = `${fileTypesStr} only${fileSizeStr ? `, max ${fileSizeStr}` : ''}`;
        return (
            <span>
                <Tooltip
                    className={styles.tooltip}
                    trigger={trigger || 'hover'}
                    title={tooltip || tip}
                    placement={tooltipPlacement || 'right'}
                >
                    <span className={styles.infoIcon}>
                        i
                    </span>
                </Tooltip>
            </span>
        );
    };
    const fileTypesStr = acceptedFileTypes.toUpperCase().split(',').join('/');// 文件类型
    const fileSizeStr = formatFileSize(maxFileSize);// 文件大小
    return (
        <div className={styles.uploadContainer} id={field.name}>
            {contextHolder}
            <Spin spinning={uploading} size="small">
                <div className={styles.uploadContainerBox}>
                    <div className={styles.uploadContainerInfo}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept={formatAcceptedFileTypes}
                            disabled={disabled || uploading}
                        />
                        <Image style={{ width: '24px', height: '24px' }} preview={false}
                            src={`${getUploadType(field)}`} />
                        <div className={styles.uploadContent}>
                            {/* <div className={`${styles.uploadLabel} ${field?.required ? styles.uploadLabelRequired : ''}`}>
                                {field?.label} {getLabelWithTooltip(field)}
                            </div> */}
                            <FormLabel field={field} />
                            <div className={styles.uploadDescription}>
                                {displayValue ? (
                                    <>
                                        {fileSize && `${formatFileSize(fileSize)}`}
                                        <span ref={durationRef}>{audioDuration && ` • ${audioDuration}`}</span>
                                    </>
                                ) : ""}
                            </div>
                        </div>
                        {/* <div className={`${styles.uploadStatus} ${displayValue ? styles.uploadStatusActive : styles.uploadStatusInactive}`} >
                            {displayValue ? 'Uploaded' : "Not Uploaded"}
                        </div> */}
                        {
                            displayValue ?
                                <div className={styles.uploadActionsIcons}>
                                    {/* 暂时只允许图片下载 */}
                                    {
                                        getFileType(displayValue) === 'image' && <DownloadOutlined style={{ color: '#52C41A' }} className={styles.actionIcon} onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(displayValue, '_blank');
                                        }}
                                            disabled={disabled} />
                                    }
                                    <EditOutlined style={{ color: '#00a0d4' }} onClick={triggerFileSelect} className={styles.actionIcon} />
                                    <DeleteOutlined style={{ color: '#FF4D4F' }} onClick={handleClearFile} className={styles.actionIcon} />
                                </div>
                                :
                                // <div className={styles.uploadActions}>
                                //     <Button type="default" variant="filled"
                                //         onClick={(e) => {
                                //             e.stopPropagation();
                                //             triggerFileSelect();
                                //         }}
                                //         disabled={disabled || uploading}  >
                                //         {uploadButtonText || "Upload File"}
                                //     </Button>
                                // </div>
                                null
                        }
                    </div>
                    {/* 文件预览 */}
                    {
                        hasFile && <div className={styles.fileVIew}>
                            <div className={styles.previewContainer} onClick={() => getFileType(displayValue) === "video" && setPreviewState({ visible: true })}>
                                {fileSizeLoading ? <Spin tip="Loading file ..." style={{ color: '#606061' }}  >
                                    <div className={styles.fileSizeLoading}></div>
                                </Spin> : <RenderFilePreview field={field} ></RenderFilePreview>}
                            </div>
                        </div>
                    }
                    {
                        !hasFile &&
                        <Upload.Dragger
                            ref={draggerRef}
                            {...uploadProps}
                            className={styles.avatarUploader}
                        >
                            <div className={styles.uploadButton}>
                                {!uploading && <div className={styles.uploadAddContainer}>
                                    <PlusOutlined className={styles.uploadAddIcon} />
                                    <div className={styles.uploadAddText}><div>Drag & drop or click to upload</div>{` ${fileTypesStr} only${fileSizeStr ? `, max ${fileSizeStr}` : ''}`}</div >
                                </div>
                                }
                            </div>
                        </Upload.Dragger>
                    }
                </div>

            </Spin >
        </div >
    );
};

FileUpload.propTypes = {
    field: PropTypes.object,
    disabled: PropTypes.bool,
    name: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.string
};

export default FileUpload; 