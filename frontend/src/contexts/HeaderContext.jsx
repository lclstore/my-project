import React, { createContext, useState, useCallback, useRef } from 'react';

/**
 * HeaderContext - 全局头部按钮状态管理上下文
 * 使用动态按钮数组实现灵活的头部控制
 */
export const HeaderContext = createContext({
    buttons: [],                  // 动态按钮数组
    setButtons: () => { },       // 设置按钮数组的方法
    setButton: () => { },        // 更新单个按钮的方法
    customPageTitle: null,        // 自定义页面标题
    setCustomPageTitle: (title) => { } // 设置自定义页面标题的方法
});

/**
 * 简单比较两个按钮数组是否基本相同
 * 只比较关键属性而不是整个对象
 */
const areButtonArraysEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        const btn1 = arr1[i];
        const btn2 = arr2[i];

        // 比较关键属性
        if (btn1.key !== btn2.key ||
            btn1.text !== btn2.text ||
            btn1.type !== btn2.type ||
            btn1.loading !== btn2.loading ||
            btn1.disabled !== btn2.disabled) {
            return false;
        }
    }

    return true;
};

/**
 * HeaderProvider - 提供全局头部按钮状态的组件
 */
export const HeaderProvider = ({ children }) => {
    // 使用useRef跟踪上一次的按钮和标题状态，避免不必要的重复设置
    const prevButtonsRef = useRef([]);
    const prevTitleRef = useRef(null);

    // 头部按钮数组状态
    const [buttons, setButtonsState] = useState([]);

    // 自定义页面标题状态
    const [customPageTitle, setCustomPageTitleState] = useState("");

    // 更新整个按钮数组
    const setButtons = useCallback((newButtons) => {
        // 使用自定义函数比较按钮数组，避免JSON.stringify的循环引用问题
        if (!areButtonArraysEqual(newButtons, prevButtonsRef.current)) {
            prevButtonsRef.current = newButtons;
            setButtonsState(newButtons);
        }
    }, []);

    // 更新单个按钮属性
    const setButton = useCallback((key, buttonProps) => {
        setButtonsState(prevButtons => {
            const index = prevButtons.findIndex(btn => btn.key === key);
            if (index === -1) return prevButtons;

            const newButtons = [...prevButtons];
            newButtons[index] = { ...newButtons[index], ...buttonProps };
            prevButtonsRef.current = newButtons;
            return newButtons;
        });
    }, []);

    // 设置自定义标题
    const setCustomPageTitle = useCallback((title) => {
        // 只有当标题实际变化时才更新状态
        if (title !== prevTitleRef.current) {
            prevTitleRef.current = title;
            setCustomPageTitleState(title);
        }
    }, []);

    return (
        <HeaderContext.Provider
            value={{
                buttons,
                setButtons,
                setButton,
                customPageTitle,
                setCustomPageTitle,
            }}
        >
            {children}
        </HeaderContext.Provider>
    );
};