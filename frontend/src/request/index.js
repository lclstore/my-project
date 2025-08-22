import axios from 'axios'
import settings from "@/config/settings.js";
import { message as Message } from "antd"
import { useStore } from "@/store/index.js"
// 从环境变量获取数据
const VITE_ENV = import.meta.env.VITE_ENV;
const baseUrl = import.meta.env.VITE_API_BASE_URL;

console.log('VITE_ENV =>>>>>>', VITE_ENV)
console.log("Message", Message)
const axios_default = axios.create({
    timeout: 0,
})
// const Loading = useStore(state => state.setLoadingGlobal);
const { setLoadingGlobal } = useStore.getState();
const Loading = setLoadingGlobal;

// message弹窗管理器
class MessageC {
    constructor() {
        this.codeControl = {}
    }

    open(messageConfig, code) {
        if (this.codeControl[code]) {
            return true
        } else {
            this.codeControl[code] = true
            Message.open({
                ...messageConfig,
                onClose: (() => {
                    return () => {
                        this.codeControl[code] = false
                    }
                })()
            })
        }
    }
}

let message = new MessageC()

// load是否要load状态 ，customBox是否进行返回提示
/**
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Function} callback - 请求成功回调函数
 * @param {Function} success - 请求成功,且正常回调函数
 * @param {String} method - 请求方法
 * @param {Boolean} load - 是否显示加载框
 * @param {Boolean} point - 是否进行提示
 * @param {Boolean} warningPoint - 是否进行warning提示
 * @param {Function} resInit - response 处理
 * */
class Request {
    constructor(config) {
        this.config = {
            ...config,
            callback: config.callback || (() => {
            }),
            warningPoint: config.warningPoint ?? true,
            success: config.success,
            method: config.method || 'post',
            point: config.point ?? false,
            url: (config.baseUrl || baseUrl) + config.url,
        }
    }

    send() {
        return new Promise((resolve, reject) => {
            let loading = Loading, config = this.config;
            if (config.load) {
                loading(true)
            }
            // get 请求做一些处理,array 转化为字符串 array
            if (config.method === 'get' && config.data) {
                Object.keys(config.data).some(item => {
                    if (config.data[item] && config.data[item].constructor === Array) {
                        config.data[item] = config.data[item].toString();
                    }
                });
            }
            // resInit init
            const resInit = config.resInit || settings.request.resInit;
            axios_default({
                ...config,
                [config.method === 'get' ? 'params' : 'data']: config.data ? config.data : {},
            }).then((res) => {

                if (config.load) {
                    loading(false)
                }
                res = resInit(res)
                // token 校验
                if (res.tokenError) {
                    localStorage.removeItem(settings.request.tokenName)
                    useStore.getState().navigate('/login')
                }
                if (res.data.success) {
                    config.point && message.open({ content: "success", type: 'success' }, 'success')
                    config.success && config.success(res)
                } else {
                    // error
                    config.warningPoint && message.open({
                        content: res.data.errMessage,
                        type: 'error',
                        duration: 3,
                    }, res.data.errCode)
                    res.error = res.data.errMessage
                }
                config.callback(res)
                resolve(res)
            }).catch((err) => {
                err = err.response ? err.response.data : err;
                if (config.load) {
                    loading(false)
                }
                message.open({ content: err.message, type: 'error' }, 'error');
                if (err.errCode === 'TOKEN_INVALID' || err.errCode === 'TOKEN_EXPIRED') {

                    useStore.getState().navigate('/login')
                }
                config.callback({ error: err })
                console.log(err)
            })
        })
    }

    async post() {
        this.config.method = "post";
        await this.send()
    }

    async get() {
        this.config.method = "get";
        await this.send()
    }

    async put() {
        this.config.method = "put";
        await this.send()
    }

    async delete() {
        this.config.method = "post";
        await this.send()
    }
}

axios_default.interceptors.request.use(config => {
    settings?.request?.interceptors(config)
    // 跨域申请
    config.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    config.method === "get" && config.params && Object.keys(config.params)
        .some(key => {
            config.params[key] === '' && (config.params[key] = null)
        })

    return config
})
export default {
    send: (config) => new Request(config).send(),
    get: (config) => new Request(config).get(),
    post: (config) => new Request(config).post(),
    put: (config) => new Request(config).put(),
    delete: (config) => new Request(config).delete(),
}