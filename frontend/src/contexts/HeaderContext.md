# HeaderContext 组件文档

## 概述

`HeaderContext`是一个React上下文(Context)组件，用于全局管理应用头部的按钮状态和页面标题。该组件通过动态按钮数组实现了灵活的头部控制，允许应用的不同部分根据需要定制头部按钮和标题。

## 功能特点

- 管理动态头部按钮数组
- 提供单个按钮更新机制
- 自定义页面标题管理
- 性能优化，避免不必要的重渲染
## API

### HeaderContext

提供以下内容:

| 属性 | 类型 | 描述 |
| --- | --- | --- |
| `buttons` | Array | 当前的动态按钮数组 |
| `setButtons` | Function | 设置整个按钮数组的方法 |
| `setButton` | Function | 更新单个按钮属性的方法 |
| `customPageTitle` | String | 自定义页面标题 |
| `setCustomPageTitle` | Function | 设置自定义页面标题的方法 |

### HeaderProvider

`HeaderProvider`组件接收`children`作为属性，并在内部管理按钮状态和页面标题。

## 使用示例

```jsx
import React, { useContext } from 'react';
import { HeaderContext, HeaderProvider } from './contexts/HeaderContext';

// 在应用根组件中使用Provider
const App = () => {
  return (
    <HeaderProvider>
      <MyComponent />
    </HeaderProvider>
  );
};

// 在子组件中使用Context
const MyComponent = () => {
  const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
  
  React.useEffect(() => {
    // 设置头部按钮
    setButtons([
      {
        key: 'save',
        text: '保存',
        type: 'primary',
        onClick: () => console.log('保存被点击')
      },
      {
        key: 'cancel',
        text: '取消',
        onClick: () => console.log('取消被点击')
      }
    ]);
    
    // 设置页面标题
    setCustomPageTitle('我的页面');
  }, []);
  
  return <div>页面内容</div>;
};
```

## 性能优化

组件内部实现了性能优化机制:

1. 使用`useRef`跟踪按钮数组和标题的先前状态
2. 自定义比较函数`areButtonArraysEqual`，仅比较按钮的关键属性
3. 仅当实际状态变化时才更新Context值

## 注意事项

- 按钮对象必须包含唯一的`key`属性以便正确更新
- 使用`setButton`更新单个按钮时，必须提供正确的按钮key 