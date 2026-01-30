/**
 * 插件缓存系统
 * 提高性能并减少重复加载
 */

import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

/**
 * 缓存条目接口
 */
class CacheEntry {
  constructor(data, ttl = 3600000) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.hits = 0;
    this.lastAccess = Date.now();
  }

  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  touch() {
    this.hits++;
    this.lastAccess = Date.now();
  }

  toJSON() {
    return {
      data: this.data,
      timestamp: this.timestamp,
      ttl: this.ttl,
      hits: this.hits,
      lastAccess: this.lastAccess
    };
  }
}

/**
 * 插件缓存管理器
 */
export class PluginCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour
    this.cacheFile = options.cacheFile || path.join(process.cwd(), '.xzchat-plugin-cache.json');
    this.enableDiskCache = options.enableDiskCache !== false;
    this.enableMemoryCache = options.enableMemoryCache !== false;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * 获取缓存键
   */
  generateKey(...parts) {
    const key = parts.join(':');
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl) {
    if (!this.enableMemoryCache) {
      return false;
    }

    const cacheKey = this.generateKey(key);

    // 检查是否超过最大缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(cacheKey, new CacheEntry(value, ttl || this.defaultTTL));

    return true;
  }

  /**
   * 获取缓存
   */
  get(key) {
    if (!this.enableMemoryCache) {
      return null;
    }

    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    entry.touch();
    this.stats.hits++;

    return entry.data;
  }

  /**
   * 检查缓存是否存在
   */
  has(key) {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    return entry && !entry.isExpired();
  }

  /**
   * 删除缓存
   */
  delete(key) {
    const cacheKey = this.generateKey(key);
    return this.cache.delete(cacheKey);
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * 驱逐最近最少使用的缓存条目
   */
  evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.isExpired()) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 保存缓存到磁盘
   */
  async saveToDisk() {
    if (!this.enableDiskCache) {
      return;
    }

    try {
      const data = Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        ...entry.toJSON()
      }));

      await fs.writeFile(
        this.cacheFile,
        JSON.stringify({ data, stats: this.stats }, null, 2)
      );
    } catch (error) {
      console.error('Failed to save cache to disk:', error);
    }
  }

  /**
   * 从磁盘加载缓存
   */
  async loadFromDisk() {
    if (!this.enableDiskCache) {
      return;
    }

    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.data) {
        parsed.data.forEach(({ key, timestamp, ttl, data: cacheData, hits, lastAccess }) => {
          const entry = new CacheEntry(cacheData, ttl);
          entry.timestamp = timestamp;
          entry.hits = hits || 0;
          entry.lastAccess = lastAccess || timestamp;

          // 只加载未过期的缓存
          if (!entry.isExpired()) {
            this.cache.set(key, entry);
          }
        });
      }

      if (parsed.stats) {
        this.stats = parsed.stats;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load cache from disk:', error);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : '0.00'
    };
  }

  /**
   * 获取缓存信息
   */
  getCacheInfo() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 8) + '...',
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
      hits: entry.hits,
      expired: entry.isExpired()
    }));

    return {
      ...this.getStats(),
      entries
    };
  }
}

/**
 * 插件模块缓存
 */
export class PluginModuleCache {
  constructor() {
    this.modules = new Map();
    this.fileHashes = new Map();
  }

  /**
   * 计算文件哈希
   */
  async computeHash(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取缓存的模块
   */
  async get(filePath) {
    const currentHash = await this.computeHash(filePath);
    const cached = this.modules.get(filePath);

    if (!cached) {
      return null;
    }

    // 检查文件是否已更改
    if (this.fileHashes.get(filePath) !== currentHash) {
      this.modules.delete(filePath);
      this.fileHashes.delete(filePath);
      return null;
    }

    return cached;
  }

  /**
   * 设置缓存的模块
   */
  async set(filePath, module) {
    const hash = await this.computeHash(filePath);
    if (hash) {
      this.modules.set(filePath, module);
      this.fileHashes.set(filePath, hash);
    }
  }

  /**
   * 清除缓存
   */
  clear(filePath) {
    if (filePath) {
      this.modules.delete(filePath);
      this.fileHashes.delete(filePath);
    } else {
      this.modules.clear();
      this.fileHashes.clear();
    }
  }

  /**
   * 清空所有缓存
   */
  clearAll() {
    this.clear();
  }
}

/**
 * 插件懒加载器
 */
export class PluginLazyLoader {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.pendingLoads = new Map();
  }

  /**
   * 懒加载插件
   */
  async lazyLoad(pluginName) {
    // 如果已经加载，直接返回
    if (this.pluginManager.plugins.has(pluginName)) {
      return this.pluginManager.plugins.get(pluginName);
    }

    // 如果正在加载，等待完成
    if (this.pendingLoads.has(pluginName)) {
      return this.pendingLoads.get(pluginName);
    }

    // 开始加载
    const loadPromise = this._doLoad(pluginName);
    this.pendingLoads.set(pluginName, loadPromise);

    try {
      const plugin = await loadPromise;
      return plugin;
    } finally {
      this.pendingLoads.delete(pluginName);
    }
  }

  /**
   * 执行加载
   */
  async _doLoad(pluginName) {
    // 在实际的实现中，这里会扫描插件目录并加载插件
    // 这里是一个简化的实现
    throw new Error(`Plugin '${pluginName}' not found`);
  }

  /**
   * 预加载插件
   */
  async preload(pluginNames) {
    const promises = pluginNames.map(name => this.lazyLoad(name));
    return Promise.allSettled(promises);
  }
}

export default PluginCache;
