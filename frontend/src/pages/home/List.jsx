import styles from './list.module.css';
import { useEffect, useContext, useState, useMemo, useRef, useCallback } from 'react';
import { PlusOutlined, InfoCircleOutlined, QuestionCircleOutlined, ProfileOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { useNavigate } from 'react-router';
import { Button, Image, Tag, Timeline, Pagination, Modal, Form, Input, message, Spin, } from 'antd';
import appIcon from '@/assets/images/app-icon.png';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from '@/request';
import { useStore } from "@/store/index.js";
export default function Home() {
    const [messageApi, contextHolder] = message.useMessage();
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航

    // APP信息数据对象
    const [appInfo, setAppInfo] = useState();
    const [logs, setLogs] = useState([]);
    const [helps, setHelps] = useState([]);
    const [infoLoading, setInfoLoading] = useState([]);
    const [logsLoading, setLogsLoading] = useState([]);
    const [helpsLoading, setHelpsLoading] = useState([]);
    // 添加分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5; // 每页显示的日志数量
    const userData = useStore((state) => state.userInfo);
    // 添加展开状态管理，默认展开第一条
    const [expandedItems, setExpandedItems] = useState({
        0: true // 默认展开第一条
    });


    // 获取appInfo
    const getInfo = async () => {
        setInfoLoading(true);
        return new Promise(resolve => {
            request.get({
                url: `/home/info`,
                load: false,
                callback: res => {
                    if (res.data.success) {
                        setAppInfo(res?.data?.data || null);
                    }
                    setInfoLoading(false);
                }
            });
        })
    }
    // 日志分页参数
    const logsParams = useRef({
        pageIndex: 1,
        pageSize: 10,
        totalCount: 0
    })
    // 获取logs
    const getLogs = async () => {
        setLogsLoading(true);
        return new Promise(resolve => {
            request.get({
                url: `/home/changelogs/page`,
                load: false,
                data: logsParams.current,
                callback: res => {
                    if (res?.data?.success) {
                        setLogs(res?.data?.data || []);
                        logsParams.current.totalCount = res?.data?.totalCount || 0;

                    }
                    setLogsLoading(false);
                }
            });
        })
    }
    // 获取helps
    const getHelps = async () => {
        setHelpsLoading(true);
        return new Promise(resolve => {
            request.get({
                url: `/home/helps/page`,
                load: false,
                data: {
                    pageIndex: 1,
                    pageSize: 99999
                },
                callback: res => {
                    if (res.data.success) {
                        setHelps(res?.data?.data || []);
                    }
                    setHelpsLoading(false);
                }
            });
        })
    }


    useEffect(() => {
        getInfo();
        getLogs();
        getHelps();
        setCustomPageTitle('Home');
        setButtons([
        ]);
    }, [])
    // 切换展开状态
    const toggleExpand = (index) => {
        // 只展开当前点击的项
        setExpandedItems({ [index]: true });
    };

    // 处理页码变化
    const handlePageChange = (page) => {
        logsParams.current.pageIndex = page;
        getLogs();

    };

    // 监听 logs 数据变化，在数据更新后展开第一条记录
    useEffect(() => {
        if (logs.length > 0) {
            setExpandedItems({ 0: true }); // 直接展开第0条
        }
    }, [logs]);

    // Help Document表单字段配置
    const helpFormFields = useMemo(() => [

        {
            type: 'input',
            name: 'name',
            label: 'Name',
            required: true,
            maxLength: 100,
            showCount: true,
        },
        {
            type: 'input',
            name: 'url',
            label: 'URL',
            required: true,
            maxLength: 1000,
            showCount: true,
            rules: [{
                pattern: /^(https?:\/\/)([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
                message: 'Please enter a valid URL'
            }]
        },
    ], []);

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'version',
            label: 'Version',
            maxLength: 100,
            required: true,
        },
        {
            type: 'date',
            name: 'date',
            label: 'Date',
            className: 'date-input',
            required: true,
            style: {
                width: '100%'
            }
        },
        {
            type: 'textarea',
            name: 'newInfo',
            label: 'New',
            maxLength: 1000,
            showCount: true,
        },
        {
            type: 'textarea',
            name: 'improvedInfo',
            label: 'Improved',
            maxLength: 1000,
            showCount: true,
        },
        {
            type: 'textarea',
            name: 'fixedInfo',
            label: 'Fixed',
            maxLength: 1000,
            showCount: true,
        },
    ], []);

    // App Info 表单字段配置
    const appInfoFields = useMemo(() => [
        {
            type: 'upload',
            name: 'appIcon',
            label: 'App Icon',
            maxFileSize: 1024 * 1,
            acceptedFileTypes: 'png,webp',
            required: true,
            maxCount: 1,
        },
        {
            type: 'input',
            name: 'appStoreName',
            label: 'Apple Store Name',
            required: true,
            maxLength: 100,
        },
        {
            type: 'input',
            name: 'appCode',
            label: 'App Code',
            required: true,
            maxLength: 50,
        }
    ], []);

    // 统一的弹框配置
    const modalConfigs = useMemo(() => ({
        help: {
            title: 'Add Help Document',
            width: 600,
            formName: 'Help Document',
            fields: helpFormFields,
            successMessage: 'Link added',
            operationName: 'addHelps'
        },
        log: {
            title: 'Add Changelog',
            width: 600,
            formName: 'Add Changelog',
            fields: formFields,
            successMessage: 'Log Added',
            operationName: 'addChangeLogs'
        },
        appInfo: {
            title: 'Add App Info',
            width: 700,
            formName: 'App Info',
            fields: appInfoFields,
            successMessage: 'Info Updated',
            operationName: 'save'
        }
    }), [helpFormFields, formFields, appInfoFields]);

    // 当前激活的弹框类型
    const [activeModalType, setActiveModalType] = useState(null);

    // 统一的弹框状态管理
    const [modalStates, setModalStates] = useState({
        help: false,
        log: false,
        appInfo: false
    });

    // 统一的编辑器引用
    const [editorRef, setEditorRef] = useState(null);

    // 渲染日志内容
    const renderLogContent = (log) => (
        <div className={styles.logsBody}>
            {log.newInfo && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="success" style={{ color: 'var(--active-color)', borderColor: 'var(--active-color)' }}>New</Tag>
                    </div>
                    <div className={styles.logContent}>{log.newInfo}</div>
                </div>
            )}
            {log.improvedInfo && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="processing">Improved</Tag>
                    </div>
                    <div className={styles.logContent}>{log.improvedInfo}</div>
                </div>
            )}
            {log.fixedInfo && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="warning">Fixed</Tag>
                    </div>
                    <div className={styles.logContent}>{log.fixedInfo}</div>
                </div>
            )}
        </div>
    );

    // 统一的打开弹框方法
    const showModal = (type) => {
        setActiveModalType(type);
        setModalStates(prev => ({
            ...prev,
            [type]: true
        }));
    };

    // 统一的关闭弹框方法
    const hideModal = (type) => {
        setModalStates(prev => ({
            ...prev,
            [type]: false
        }));
        setActiveModalType(null);
        setEditorRef(null); // 清空编辑器引用
    };

    // 统一的表单提交处理方法
    const handleModalSubmit = async (type) => {
        try {
            if (editorRef?.triggerSave) {
                const ret = await editorRef.triggerSave('ENABLED');
                if (ret.success) {
                    messageApi.success(modalConfigs[type].successMessage);

                    // 特殊处理 appInfo 的情况
                    if (type === 'appInfo') {
                        getInfo()// 获取appInfo
                    } else if (type === 'log') {
                        getLogs()// 获取logs
                    } else if (type === 'help') {
                        getHelps()// 获取helps
                    }

                    hideModal(type);
                    editorRef.form.resetFields();
                }
            }
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };


    return (
        <div className={styles.homeContainer}>
            {contextHolder}
            <div className={styles.homeSidebar}>
                <div className={`${styles.homeBox} ${styles.info}`}>
                    <div className={styles.titleBar}>
                        <div className={styles.titleBarLeft}>
                            <InfoCircleOutlined className={styles.titleIcon} />
                            <span>Info</span>
                        </div>
                        <span></span>
                    </div>
                    <Spin spinning={infoLoading} >
                        <div className={`${styles.homeContent} ${styles.infoContent}`}>
                            {appInfo ? (
                                // 当 appInfo 有值时渲染内容
                                <div className={styles.infoItem}>
                                    <div className={styles.infoItemLeft}>
                                        <Image

                                            preview={{
                                                mask: null
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                borderRadius: '6px'
                                            }}
                                            src={appInfo.appIcon}
                                            alt="APP Icon"
                                            width={80}
                                            height={80}
                                            fallback={appIcon}
                                        />
                                    </div>
                                    <div className={styles.infoItemRight}>
                                        <div className={styles.infoItemRightTitle}>{appInfo.appStoreName}</div>
                                        <div className={styles.infoItemRightContent}>{appInfo.appCode}</div>
                                    </div>
                                </div>
                            ) : (
                                // 当 appInfo 为 null 时显示添加按钮
                                <div className={styles.emptyInfo}>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => showModal('appInfo')}
                                    >
                                        Add App Info
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Spin>
                </div>
                <div className={`${styles.homeBox} ${styles.help}`}>
                    <div className={styles.titleBar}>
                        <div className={styles.titleBarLeft}>
                            <QuestionCircleOutlined className={styles.titleIcon} />
                            <span> Help & Support</span>
                        </div>
                        <span className={styles.addIcon} onClick={() => showModal('help')}>
                            {
                                userData?.type === "ADMIN" ? <Button type="primary" icon={<PlusOutlined />}  >Add</Button> : ''
                            }
                        </span>
                    </div>
                    <Spin spinning={helpsLoading} >
                        <div className={`${styles.homeContent} ${styles.helpContent}`}>
                            {helps.map((help, index) => (
                                <Button
                                    key={index}
                                    style={{
                                        color: '#243636b3',
                                    }}
                                    className={styles.helpButton}
                                    onClick={() => window.open(help.url, '_blank')}
                                >
                                    {help.name}
                                </Button>
                            ))}

                        </div>
                    </Spin>
                </div>
            </div>
            <div className={`${styles.homeBox} ${styles.logs}`}>
                <div className={styles.titleBar}>
                    <div className={styles.titleBarLeft}>
                        <ProfileOutlined className={styles.titleIcon} />
                        <span>Changelogs</span>
                    </div>
                    <span className={styles.addIcon} onClick={() => showModal('log')}>
                        {
                            userData?.type === "ADMIN" ? <span className={styles.addIcon} onClick={() => showModal('log')}>
                                <Button type="primary" icon={<PlusOutlined />}  >Add</Button>
                            </span> : ''

                        }
                    </span>
                </div>
                <div className={`${styles.homeContent} ${styles.logsContent}`}>
                    {/* 使用时间轴展示所有日志 */}
                    <Spin spinning={logsLoading} >
                        <div className={styles.timelineContainer}>
                            <Timeline
                                items={logs.map((log, index) => ({
                                    key: index,
                                    children: (
                                        <div
                                            className={styles.timelineItem}
                                            onClick={() => toggleExpand(index)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.timelineHeader}>
                                                <Tag color="blue" className={styles.versionTag}>{log.version}</Tag>
                                                <span className={styles.date}>{log.date}</span>
                                            </div>
                                            {expandedItems[index] && renderLogContent(log)}
                                        </div>
                                    )
                                }))}
                            />
                        </div>
                    </Spin>
                    <div className={styles.paginationContainer}>
                        {logsParams.current.totalCount > logsParams.current.pageSize && (
                            <Pagination
                                current={logsParams.current.pageIndex}
                                total={logsParams.current.totalCount}
                                pageSize={logsParams.current.pageSize}
                                onChange={handlePageChange}
                                size="small"
                                showTotal={(total) => `${total} items`}
                                showSizeChanger={false}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 统一的弹框组件 */}
            {activeModalType && (
                <Modal
                    title={modalConfigs[activeModalType].title}
                    open={modalStates[activeModalType]}
                    okText="Confirm"
                    cancelText="Cancel"
                    onOk={() => handleModalSubmit(activeModalType)}
                    onCancel={() => hideModal(activeModalType)}
                    width={850}
                    destroyOnClose
                >
                    <div  >
                        <CommonEditorForm
                            changeHeader={false}
                            formType="basic"
                            isBack={false}
                            config={{
                                formName: "Home",
                                hideSaveButton: true,
                                hideBackButton: true,
                                layout: 'vertical',
                                hideTitleOperationName: true
                            }}
                            fields={modalConfigs[activeModalType].fields}
                            initialValues={{}}
                            moduleKey='home'
                            operationName={modalConfigs[activeModalType].operationName}
                            setFormRef={setEditorRef}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}