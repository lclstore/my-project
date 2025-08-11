import { useState, useCallback } from 'react';

/**
 * 处理异步操作的自定义Hook
 * @param {Function} asyncFunction - 异步函数
 * @param {boolean} immediate - 是否立即执行
 * @returns {Object} - 包含执行状态、结果、错误和执行函数
 */
const useAsync = (asyncFunction, immediate = false) => {
    const [status, setStatus] = useState('idle');
    const [value, setValue] = useState(null);
    const [error, setError] = useState(null);

    // 包装异步执行函数
    const execute = useCallback(
        async (...params) => {
            setStatus('pending');
            setValue(null);
            setError(null);

            try {
                const response = await asyncFunction(...params);
                setValue(response);
                setStatus('success');
                return response;
            } catch (error) {
                setError(error);
                setStatus('error');
                throw error;
            }
        },
        [asyncFunction]
    );

    // 如果immediate为true，则立即执行
    useState(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    return {
        execute,
        status,
        value,
        error,
        isIdle: status === 'idle',
        isPending: status === 'pending',
        isSuccess: status === 'success',
        isError: status === 'error',
    };
};

export default useAsync; 