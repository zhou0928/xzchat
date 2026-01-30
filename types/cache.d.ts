/**
 * Cache Module Type Definitions
 * 缓存模块类型定义
 */

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  statsEnabled?: boolean;
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  hits: number;
  ttl?: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

export class LRUCache<T = any> {
  constructor(options?: CacheOptions);

  set(key: string, value: T, ttl?: number): void;

  get(key: string): T | null;

  has(key: string): boolean;

  delete(key: string): boolean;

  clear(): void;

  keys(): string[];

  values(): T[];

  size(): number;

  getStats(): CacheStats;

  resetStats(): void;
}

export const embeddingCache: LRUCache<number[]>;

export const ragIndexCache: LRUCache<Chunk[]>;

export const modelListCache: LRUCache<string[]>;
