/**
 * 简单的内存缓存系统
 * 支持 TTL（生存时间）和自动过期清理
 */

import { logger } from './logger.js';

class SimpleCache {
  constructor(ttl = 600000, name = 'Cache') {
    this.cache = new Map();
    this.ttl = ttl; // 默认 10 分钟
    this.name = name;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // 定期清理过期缓存（每5分钟）
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    logger.debug(`${this.name} 初始化`, { ttl: `${this.ttl}ms` });
  }

  /**
   * 获取缓存值
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > item.expire) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug(`${this.name} 缓存过期`, { key });
      return null;
    }
    
    this.stats.hits++;
    logger.debug(`${this.name} 缓存命中`, { key, age: `${Date.now() - item.createdAt}ms` });
    return item.value;
  }

  /**
   * 设置缓存值
   */
  set(key, value, customTtl = null) {
    const ttl = customTtl || this.ttl;
    const item = {
      value,
      expire: Date.now() + ttl,
      createdAt: Date.now()
    };
    
    this.cache.set(key, item);
    this.stats.sets++;
    logger.debug(`${this.name} 缓存设置`, { key, ttl: `${ttl}ms` });
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存
   */
  delete(key) {
    const existed = this.cache.delete(key);
    if (existed) {
      this.stats.deletes++;
      logger.debug(`${this.name} 缓存删除`, { key });
    }
    return existed;
  }

  /**
   * 清空所有缓存
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`${this.name} 缓存清空`, { deletedItems: size });
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    let deleted = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expire) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      logger.debug(`${this.name} 清理过期缓存`, { deleted });
    }
    
    return deleted;
  }

  /**
   * 获取缓存大小
   */
  size() {
    return this.cache.size;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2) 
      : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      totalRequests
    };
  }

  /**
   * 打印统计信息
   */
  printStats() {
    const stats = this.getStats();
    console.log(`\n📊 ${this.name} 统计:`);
    console.log(`   命中: ${stats.hits}`);
    console.log(`   未命中: ${stats.misses}`);
    console.log(`   设置: ${stats.sets}`);
    console.log(`   删除: ${stats.deletes}`);
    console.log(`   命中率: ${stats.hitRate}`);
    console.log(`   当前大小: ${stats.size} 项`);
  }

  /**
   * 销毁缓存（停止清理定时器）
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
    logger.info(`${this.name} 已销毁`);
  }
}

/**
 * 带有加载函数的缓存装饰器
 * 如果缓存不存在，自动调用加载函数
 */
function withCache(cache, key, loader, ttl = null) {
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }
  
  const value = loader();
  cache.set(key, value, ttl);
  return value;
}

/**
 * 异步缓存装饰器
 */
async function withCacheAsync(cache, key, loader, ttl = null) {
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }
  
  const value = await loader();
  cache.set(key, value, ttl);
  return value;
}

// 创建各种缓存实例
export const modelsCache = new SimpleCache(300000, 'ModelsCache'); // 模型列表缓存：5分钟
export const embeddingCache = new SimpleCache(3600000, 'EmbeddingCache'); // 嵌入缓存：1小时
export const tokenCache = new SimpleCache(600000, 'TokenCache'); // Token 估算缓存：10分钟
export const ragIndexCache = new SimpleCache(1800000, 'RAGIndexCache'); // RAG 索引缓存：30分钟

/**
 * 获取所有缓存的统计信息
 */
export function getAllCacheStats() {
  return {
    models: modelsCache.getStats(),
    embedding: embeddingCache.getStats(),
    token: tokenCache.getStats(),
    ragIndex: ragIndexCache.getStats()
  };
}

/**
 * 打印所有缓存统计信息
 */
export function printAllCacheStats() {
  console.log('\n📦 缓存系统统计：\n');
  modelsCache.printStats();
  embeddingCache.printStats();
  tokenCache.printStats();
  ragIndexCache.printStats();
}

/**
 * 清空所有缓存
 */
export function clearAllCaches() {
  modelsCache.clear();
  embeddingCache.clear();
  tokenCache.clear();
  ragIndexCache.clear();
  logger.info('所有缓存已清空');
}

export { SimpleCache, withCache, withCacheAsync };
