/**
 * 常量统一导出
 */
import { HTTP_STATUS, HTTP_METHODS, CONTENT_TYPES } from "./http";
import { storageKeys, themeModes, responseStatus, defaultPagination } from "./app";
import { optionsConstants } from "./options";
import { statusIconMap, menuIconMap, actionIconMap, resultIconMap, userStatusIconMap, fileStatusIconMap } from "./icon";
// 导出所有常量
export {
  // HTTP相关常量
  HTTP_STATUS,
  HTTP_METHODS,
  CONTENT_TYPES,
  // 分页相关常量
  defaultPagination,
  // 应用相关常量
  storageKeys,
  themeModes,
  responseStatus,
  // 选项常量
  optionsConstants,
  // 状态图标
  statusIconMap,
  // 菜单图标
  menuIconMap,
  // 操作图标
  actionIconMap,
  // 结果图标
  resultIconMap,
  // 用户状态图标
  userStatusIconMap,
  // 文件状态图标
  fileStatusIconMap,
};
