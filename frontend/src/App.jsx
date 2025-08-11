import React from "react";
import {RouterProvider} from 'react-router';
import {router} from './router/index.jsx';
import {App as AntdApp} from "antd"
import './App.less';

/**
 * 应用根组件
 * @returns {JSX.Element}
 */
function App() {

    return (
        <AntdApp>
            <RouterProvider router={router}/>
        </AntdApp>
    );
}

export default App;
