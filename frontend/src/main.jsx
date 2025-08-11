import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from '@/App'
import '@/assets/styles/variables.css'
import './index.css'
import settings from '@/config/settings'
import {HeaderProvider} from './contexts/HeaderContext';

// 设置文档标题
document.title = import.meta.env.VITE_APP_TITLE || '内容管理系统';


ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <ConfigProvider theme={settings.themeConfig}>
        <HeaderProvider>
            <App />
        </HeaderProvider>
    </ConfigProvider>
  // </React.StrictMode>,
)
console.log(import.meta.env.VITE_APP_TITLE)