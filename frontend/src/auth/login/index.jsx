import React, { useCallback, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Modal } from 'antd';
import { UserOutlined, LockOutlined, QuestionCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { validateEmail, validatePassword } from '@/utils/index.js';
import { HeaderContext } from '@/contexts/HeaderContext';
import settings from "@/config/settings.js";
import lionImg from '@/assets/images/lion.png';
import loginLeftImg from '@/assets/images/login-left.svg';
import md5 from "md5"
import './login.css'; // 将样式移到单独的CSS文件中
import request from "@/request/index.js";
import { useStore } from "@/store/index.js";

const Login = () => {
    const navigate = useNavigate();
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    // 状态管理
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [accountError, setAccountError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const setUserInfo = useStore((state) => state.setUserInfo);
    // 本地存储token
    const localDown = (token) => {
        localStorage.setItem(settings.request.tokenName, token);
    };
    // 清除token
    useEffect(() => {
        localStorage.removeItem(settings.request.tokenName)
    }, []);

    // 登录逻辑
    const login = useCallback(() => {
        // 本地开发环境跳过登录校验
        console.log(account)
        if (import.meta.env.VITE_ENV !== 'development') {
            console.log(account)
            // 表单验证
            let hasError = false;
            console.log(!account)
            if (!account) {
                setAccountError("Email cannot be empty.");
                hasError = true;
            } else if (!validateEmail(account)) {
                setAccountError("Email is not valid.");
                hasError = true;
            }

            if (!password) {
                setPasswordError("Password cannot be empty.");
                hasError = true;
            } else if (!validatePassword(password)) {
                setPasswordError("The password must contain both letters and numbers and be 8 to 12 characters long.");
                hasError = true;
            }

            if (hasError) {
                return false;
            }

            // 清除错误提示
            setAccountError('');
            setPasswordError('');
        }
        setLoading(true);

        // 使用API登录
        request.post({
            url: "/user/login",
            data: {
                email: account,
                password: md5(password)
            },
            callback(res) {
                console.log('res', res.data)
                if (res.data.success) {
                    localDown(res.data.data.token)
                    localStorage.setItem('users', JSON.stringify(res.data.data));
                    setUserInfo(res.data.data)
                    setButtons([])// 登录后隐藏homeheader按钮(避免进入homeyem后闪烁)
                    setCustomPageTitle('Home')
                    navigate(settings.router.homePath);

                } else {
                    setLoading(false)
                }


            }
        })
    }, [account, password])

    // 处理账号输入变化
    const handleAccountChange = (e) => {
        const value = e.target.value;
        setAccount(value);
        // 实时验证
        if (value && !validateEmail(value)) {
            setAccountError("Email is not valid.");
        } else {
            setAccountError('');
        }
    };
    // 处理账号输入变化
    const handlePaswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        // 实时验证
        console.log(value, validatePassword(value))
        if (value && !validatePassword(value)) {
            setPasswordError('The password must contain both letters and numbers and be 8 to 12 characters long.');

        } else {
            setPasswordError('');
        }
    };

    // 渲染浮动圆圈
    const renderFloatingCircles = () => {
        const circles = [];
        for (let i = 1; i <= 6; i++) {
            circles.push(
                <div key={i} className={`floating-circle circle-${i}`}></div>
            );
        }
        return circles;
    };

    return (
        <div>
            <div className="login-container">
                {renderFloatingCircles()}
                <div className="login-content">
                    <div className="login-left-panel login-panel">
                        <div className="title-decoration"></div>
                        <div className="login-title">
                            <div className="title-line first-line">Content</div>
                            <div className="highlight">Management</div>
                            <div className="title-line last-line">System</div>
                        </div>
                        <div className="login-description">Power your work with our powerful CMS</div>

                        <img className="login-img" src={loginLeftImg} alt="" />
                        {/* <div className="login-company-info">成都莱嗯信息技术有限公司</div> */}
                    </div>

                    <div className="login-right-panel login-panel">
                        <div className="login-form">
                            {/* <div className="login-header">
                                <img src={lionImg} alt="Logo" />
                                <div>CMS</div> 
                            </div> */}
                            <div className="login-title">Hey, Welcome back!</div>
                            <div className="login-subtitle"> </div>

                            <form onKeyDown={(e) => e.key === 'Enter' && login()}>
                                <div className="input-label">Email Address</div>
                                <div className="login-input-wrapper">
                                    <Input
                                        prefix={<UserOutlined />}
                                        className={accountError ? 'errorInput' : ''}
                                        placeholder="Enter email..."
                                        value={account}
                                        onChange={handleAccountChange}
                                    // onFocus={() => setAccountError('')}
                                    />
                                </div>
                                <div className="login-form-error">{accountError}</div>

                                <div className="input-label">Password</div>
                                <div className="login-input-wrapper">
                                    <Input.Password
                                        className={passwordError ? 'errorInput' : ''}
                                        prefix={<LockOutlined />}
                                        placeholder="Enter password..."
                                        value={password}
                                        onChange={handlePaswordChange}
                                        // onFocus={() => setPasswordError('')}
                                        visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                                        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                                    />
                                </div>
                                <div className="login-form-error">{passwordError}</div>

                                <Button
                                    className="login-submit-button"
                                    type="primary"
                                    onClick={login}
                                    loading={loading}
                                    color="#243636"
                                    block
                                >
                                    <span className="btn-text">SIGN IN</span>
                                </Button>

                            </form>
                            <div className="login-description1">Don't have an account? Contact the system administrator</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 密码重置对话框 */}
            <Modal
                title="Password Recovery"
                open={dialogVisible}
                onCancel={() => setDialogVisible(false)}
                footer={null}
                width={500}
                className="custom-dialog"
            >
                <div className="dialog-content">
                    <QuestionCircleOutlined style={{ fontSize: 64, color: '#4158d0', marginBottom: 24 }} />
                    <p>Please contact your system administrator for password reset assistance.</p>
                </div>
            </Modal>
        </div>
    );
};

export default Login;