import settings from '@/config/settings';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from "@/store/index.js";
import md5 from 'md5';
import dayjs from 'dayjs';
/**
 * 工具函数集合
 */

export function router() {
  const state = useStore.getState()
  const location = state.location;
  const navigate = state.navigate;
  const routerList = location.pathname.split('/')
  return {
    push(path) {
      routerList[routerList.length - 1] = path
      navigate(routerList.join("/"))
    }
  }
}

/**
 * 深度克隆对象
 * @param {any} obj 需要克隆的对象
 * @returns {any} 克隆后的新对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  // 处理普通对象
  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否为有效邮箱格式
 */
export function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * 格式化日期
 * @param {Date|string|number} date 日期对象/日期字符串/时间戳
 * @param {string} format 格式化模板，如：'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';

  date = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const formatMap = {
    'YYYY': year,
    'MM': month < 10 ? `0${month}` : month,
    'DD': day < 10 ? `0${day}` : day,
    'HH': hours < 10 ? `0${hours}` : hours,
    'mm': minutes < 10 ? `0${minutes}` : minutes,
    'ss': seconds < 10 ? `0${seconds}` : seconds,
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
}
/**
* 格式化一段日期区间
* @param {string|Date|null|undefined} start - 开始时间
* @param {string|Date|null|undefined} end - 结束时间
* @param {string} pattern - 格式化模板，默认 'YYYY-MM-DD'
* @returns {string} - 返回 'start to end'，或全部为空时返回 '-'
*/
export function formatDateRange(start, end, pattern = 'YYYY-MM-DD') {
  const formattedStart = start ? formatDate(start, pattern) : '-';
  const formattedEnd = end ? formatDate(end, pattern) : '-';
  // 如果两端都为空，就直接返回 '-'
  if (formattedStart === '-' && formattedEnd === '-') {
    return '-';
  }
  return `${formattedStart} to ${formattedEnd}`;
}
/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {number} delay 延迟时间，单位毫秒
 * @returns {Function} 防抖处理后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;

  return function (...args) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 生成随机字符串
 * @param {number} length 随机字符串长度
 * @returns {string} 生成的随机字符串
 */
export function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// 格式化时长 (秒 -> MM:SS)
export const formatDuration = (seconds = 0) => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  return `${formattedMinutes}:${formattedSeconds}`;
};

export function TimeShow(second, isMilliseconds = false) {
  let Time = new Date('2023-1-1 00:00:00')
  Time = new Date(isMilliseconds ? Time.setMilliseconds(second) : Time.setSeconds(second))
  let Hours = Time.getHours()
  Hours = Hours >= 10 ? Hours.toString() : `0${Hours}`
  let Min = Time.getMinutes()
  Min = Min >= 10 ? Min.toString() : `0${Min}`
  let Second = Time.getSeconds()
  Second = Second >= 10 ? Second.toString() : `0${Second}`
  let Milliseconds = Time.getMilliseconds()
  Milliseconds = Milliseconds >= 100 ? Milliseconds.toString() : (Milliseconds >= 10 ? `0${Milliseconds}` : `00${Milliseconds}`)
  Time = `${Hours}:${Min}:${Second}${isMilliseconds ? ',' + Milliseconds : ''}`
  return Time
}
/**
 * 获取完整URL的辅助函数
 * @param {string} url 需要处理的URL
 * @returns {string} 完整URL
 */
export const getFullUrl = (url) => {
  if (!url) return '';
  // 如果已经是完整URL或者是数据URL，则不添加baseURL
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return `${settings.file.baseURL}${url}`;
};

/**
 * 验证密码格式
 * @param {string} password - 需要验证的密码字符串
 * @returns {boolean} 如果密码格式有效（8-12位，包含字母和数字），则返回 true，否则返回 false
 */
export const validatePassword = (password) => {
  // 密码必须包含字母（大写或小写）和数字，且长度为8到12位
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;
  // 扩展：如果包含 *****，也视为合法
  if (String(password).includes('*****')) {
    return true;
  }
  return passwordRegex.test(password);
};

/**
 * 生成 UUID (v4)
 * @returns {string} 返回一个新的 UUID 字符串
 */
export const generateUUID = () => {
  return uuidv4();
};
// uuid 生成
export const uuid = (is_) => {
  let str = ''
  function create16() {
    return parseInt(Math.random() * 16).toString(16)
  }
  for (let i = 0; i < 32; i++) {
    if (is_ === '-' && (i === 8 || i === 12 || i === 16 || i === 20)) {
      str += '-'
    }
    str += create16()
  }
  return str
}
/**
 * 睡眠函数
 * @param {number} ms 睡眠时间，单位毫秒
 * @returns {Promise} 返回一个 Promise 对象，在指定时间后 resolve
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * 加密字符串
 * @param {string} value 需要加密的字符串
 * @returns {string} 加密后的字符串
 */
export const md5Encrypt = (value) => {
  return md5(value || '')
}

/**
 * 验证版本号格式是否正确
 * @param {string} version - 版本号字符串
 * @returns {boolean} - 是否是有效的版本号
 */
export const validateVersion = (version) => {
  // 版本号格式：主版本号.次版本号.修订号 (如：1.0.0)
  const versionPattern = /^\d+\.\d+\.\d+$/;
  return versionPattern.test(version);
};

/**
 * 获取音频或视频 URL 的时长（单位：秒）
 * @param {string} url - 媒体文件的 URL 地址
 * @returns {Promise<number>} - 返回原始时长 秒
 */
export function getMediaDurationByUrl(url) {
  return new Promise((resolve, reject) => {
    const media = document.createElement('video');
    media.preload = 'metadata';
    media.src = url;

    media.onloadedmetadata = () => {
      resolve(Number(media.duration.toFixed(3))); // 保留最多3位小数
      media.remove();
    };

    media.onerror = () => {
      reject(0);
    };
  });
}

/**
 * 提取 URL 文件扩展名并归类为 audio / video / image / other
 * @param {string} url - 文件地址
 * @returns { 'audio' | 'video' | 'image' | 'other' }
 */
export function getFileCategoryFromUrl(url = '') {
  const audioTypes = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a']
  const videoTypes = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv']
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']

  if (!url || !/^https?:\/\//.test(url)) return 'image'


  const urlObj = new URL(url)

  // 优先从 pathname 中提取
  let pathnameFilename = urlObj.pathname.split('/').pop() || ''
  let pathnameExt = pathnameFilename.split('.').pop().toLowerCase()

  // 如果 pathname 有扩展名，优先用它
  if (pathnameExt && pathnameExt !== pathnameFilename) {
    if (audioTypes.includes(pathnameExt)) return 'audio'
    if (videoTypes.includes(pathnameExt)) return 'video'
    if (imageTypes.includes(pathnameExt)) return 'image'
  }

  // 否则尝试从 name 参数中提取
  const nameMatch = urlObj.searchParams.get('name') || ''
  const nameExt = nameMatch.split('.').pop().toLowerCase()

  if (audioTypes.includes(nameExt)) return 'audio'
  if (videoTypes.includes(nameExt)) return 'video'
  if (imageTypes.includes(nameExt)) return 'image'


}
