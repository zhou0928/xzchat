import { loadConfig, getActiveConfig, updateConfig, getWriteConfigFile } from "../config.js";
import { sanitizeConfigObj, loadConfigFrom } from "../config.js";

/**
 * 配置缓存管理器
 * 避免重复加载配置文件
 */
export class ConfigCache {
  constructor(options = {}) {
    this.cacheTime = options.cacheTime || 5000; // 默认5秒缓存
    this.cache = null;
    this.lastLoadTime = 0;
    this.activeConfigCache = null;
    this.activeConfigLastLoadTime = 0;
    this.watchers = new Map();
    this.fileStates = new Map();
  }

  /**
   * 检查缓存是否过期
   */
  isCacheExpired() {
    return Date.now() - this.lastLoadTime > this.cacheTime;
  }

  /**
   * 检查活跃配置缓存是否过期
   */
  isActiveConfigCacheExpired() {
    return Date.now() - this.activeConfigLastLoadTime > this.cacheTime;
  }

  /**
   * 获取文件修改时间
   */
  getFileModifiedTime(filePath) {
    const fs = require('node:fs');
    try {
      const stats = fs.statSync(filePath);
      return stats.mtimeMs;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 检查文件是否变更
   */
  hasFileChanged(filePath) {
    const lastMtime = this.fileStates.get(filePath) || 0;
    const currentMtime = this.getFileModifiedTime(filePath);
    return currentMtime > lastMtime;
  }

  /**
   * 更新文件状态
   */
  updateFileState(filePath) {
    const mtime = this.getFileModifiedTime(filePath);
    this.fileStates.set(filePath, mtime);
  }

  /**
   * 获取配置（带缓存）
   */
  getConfig(forceReload = false) {
    const configFile = getWriteConfigFile();
    
    // 检查文件是否变更
    if (!forceReload && !this.isCacheExpired() && !this.hasFileChanged(configFile)) {
      return this.cache;
    }

    // 重新加载
    const config = loadConfig();
    this.cache = config;
    this.lastLoadTime = Date.now();
    this.updateFileState(configFile);

    return config;
  }

  /**
   * 获取活跃配置（带缓存）
   */
  getActiveConfigObj(config) {
    // 使用传入的配置或缓存的配置
    const configToUse = config || this.getConfig();
    
    // 检查缓存是否过期
    if (!this.isActiveConfigCacheExpired()) {
      return this.activeConfigCache;
    }

    // 重新计算
    const activeConfig = getActiveConfig(configToUse);
    this.activeConfigCache = activeConfig;
    this.activeConfigLastLoadTime = Date.now();

    return activeConfig;
  }

  /**
   * 更新配置（清除缓存）
   */
  updateConfigValue(key, value) {
    const result = updateConfig(key, value);
    
    // 清除缓存
    this.invalidateCache();
    
    return result;
  }

  /**
   * 设置配置文件值（清除缓存）
   */
  setProfileValue(profileName, key, value) {
    const { setProfileValue } = require('../config.js');
    const result = setProfileValue(profileName, key, value);
    
    // 清除缓存
    this.invalidateCache();
    
    return result;
  }

  /**
   * 清除所有缓存
   */
  invalidateCache() {
    this.cache = null;
    this.activeConfigCache = null;
    this.lastLoadTime = 0;
    this.activeConfigLastLoadTime = 0;
  }

  /**
   * 清除活跃配置缓存
   */
  invalidateActiveConfigCache() {
    this.activeConfigCache = null;
    this.activeConfigLastLoadTime = 0;
  }

  /**
   * 监听配置文件变更
   */
  watchConfigFile(callback) {
    const fs = require('node:fs');
    const configFile = getWriteConfigFile();

    if (this.watchers.has(configFile)) {
      // 已存在监听器
      return;
    }

    try {
      const watcher = fs.watchFile(configFile, (curr, prev) => {
        if (curr.mtimeMs !== prev.mtimeMs) {
          console.log(`\n📝 配置文件已变更: ${configFile}`);
          this.invalidateCache();
          
          if (callback) {
            callback(this.getConfig(true));
          }
        }
      });

      this.watchers.set(configFile, watcher);
    } catch (e) {
      console.log(`⚠️  无法监听配置文件: ${e.message}`);
    }
  }

  /**
   * 停止监听
   */
  stopWatching() {
    const fs = require('node:fs');
    
    for (const [file, watcher] of this.watchers) {
      try {
        fs.unwatchFile(file);
      } catch (e) {
        // ignore
      }
    }
    
    this.watchers.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const configFile = getWriteConfigFile();
    
    return {
      hasCache: this.cache !== null,
      cacheAge: Date.now() - this.lastLoadTime,
      cacheExpired: this.isCacheExpired(),
      hasActiveConfigCache: this.activeConfigCache !== null,
      activeConfigCacheAge: Date.now() - this.activeConfigLastLoadTime,
      activeConfigCacheExpired: this.isActiveConfigCacheExpired(),
      configFile,
      fileChanged: this.hasFileChanged(configFile),
      watchers: this.watchers.size
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.stopWatching();
    this.invalidateCache();
    this.fileStates.clear();
  }
}

/**
 * 创建全局配置缓存实例
 */
let globalConfigCache = null;

/**
 * 获取全局配置缓存实例
 */
export function getGlobalConfigCache() {
  if (!globalConfigCache) {
    globalConfigCache = new ConfigCache();
  }
  return globalConfigCache;
}

/**
 * 便捷函数：获取配置（使用缓存）
 */
export function getCachedConfig(forceReload = false) {
  return getGlobalConfigCache().getConfig(forceReload);
}

/**
 * 便捷函数：获取活跃配置（使用缓存）
 */
export function getCachedActiveConfig(config) {
  return getGlobalConfigCache().getActiveConfigObj(config);
}

/**
 * 便捷函数：更新配置
 */
export function updateCachedConfig(key, value) {
  return getGlobalConfigCache().updateConfigValue(key, value);
}

/**
 * 便捷函数：设置配置文件值
 */
export function setCachedProfileValue(profileName, key, value) {
  return getGlobalConfigCache().setProfileValue(profileName, key, value);
}

/**
 * 便捷函数：清除缓存
 */
export function clearConfigCache() {
  getGlobalConfigCache().invalidateCache();
}

/**
 * 便捷函数：监听配置变更
 */
export function watchConfigChanges(callback) {
  getGlobalConfigCache().watchConfigFile(callback);
}

/**
 * 便捷函数：停止监听
 */
export function stopConfigWatch() {
  getGlobalConfigCache().stopWatching();
}
