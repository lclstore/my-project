/**
 * Token黑名单管理
 * 用于管理已失效的JWT token
 */

const jwt = require('jsonwebtoken');

// 内存存储黑名单（生产环境建议使用Redis）
const blacklistedTokens = new Set();

/**
 * 将token添加到黑名单
 * @param {string} token - JWT token
 * @param {number} expiresIn - token过期时间（秒）
 */
const addToBlacklist = (token, expiresIn = null) => {
  blacklistedTokens.add(token);

  // 如果提供了过期时间，设置自动清理
  if (expiresIn) {
    setTimeout(() => {
      blacklistedTokens.delete(token);
    }, expiresIn * 1000);
  }
};

/**
 * 检查token是否在黑名单中
 * @param {string} token - JWT token
 * @returns {boolean} 是否在黑名单中
 */
const isBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

/**
 * 从黑名单中移除token
 * @param {string} token - JWT token
 */
const removeFromBlacklist = (token) => {
  blacklistedTokens.delete(token);
};

/**
 * 清空黑名单
 */
const clearBlacklist = () => {
  blacklistedTokens.clear();
};

/**
 * 获取黑名单大小
 * @returns {number} 黑名单中token数量
 */
const getBlacklistSize = () => {
  return blacklistedTokens.size;
};

/**
 * 从JWT token中提取过期时间
 * @param {string} token - JWT token
 * @returns {number|null} 剩余过期时间（秒）
 */
const getTokenExpiresIn = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      return expiresIn > 0 ? expiresIn : 0;
    }
    return null;
  } catch (error) {
    console.error('解析token过期时间失败:', error);
    return null;
  }
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
  removeFromBlacklist,
  clearBlacklist,
  getBlacklistSize,
  getTokenExpiresIn
};
