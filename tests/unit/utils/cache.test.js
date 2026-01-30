import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimpleCache, modelsCache, embeddingCache, withCache, withCacheAsync } from '../lib/utils/cache.js';

describe('Cache Module', () => {
  let cache;

  beforeEach(() => {
    cache = new SimpleCache(1000, 'TestCache');
  });

  afterEach(() => {
    if (cache) {
      cache.clear();
      cache.destroy();
    }
  });

  describe('SimpleCache', () => {
    describe('set and get', () => {
      it('should set and get a value', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
      });

      it('should return null for non-existent key', () => {
        expect(cache.get('nonexistent')).toBeNull();
      });

      it('should set value with custom TTL', () => {
        cache.set('key1', 'value1', 2000);
        expect(cache.get('key1')).toBe('value1');
      });

      it('should expire cache after TTL', async () => {
        cache.set('key1', 'value1', 100);
        expect(cache.get('key1')).toBe('value1');
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(cache.get('key1')).toBeNull();
      });
    });

    describe('has', () => {
      it('should return true for existing key', () => {
        cache.set('key1', 'value1');
        expect(cache.has('key1')).toBe(true);
      });

      it('should return false for non-existent key', () => {
        expect(cache.has('nonexistent')).toBe(false);
      });

      it('should return false for expired key', async () => {
        cache.set('key1', 'value1', 100);
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(cache.has('key1')).toBe(false);
      });
    });

    describe('delete', () => {
      it('should delete a key', () => {
        cache.set('key1', 'value1');
        expect(cache.delete('key1')).toBe(true);
        expect(cache.get('key1')).toBeNull();
      });

      it('should return false for non-existent key', () => {
        expect(cache.delete('nonexistent')).toBe(false);
      });
    });

    describe('clear', () => {
      it('should clear all keys', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        expect(cache.size()).toBe(2);
        
        cache.clear();
        expect(cache.size()).toBe(0);
        expect(cache.get('key1')).toBeNull();
        expect(cache.get('key2')).toBeNull();
      });
    });

    describe('size', () => {
      it('should return correct size', () => {
        expect(cache.size()).toBe(0);
        cache.set('key1', 'value1');
        expect(cache.size()).toBe(1);
        cache.set('key2', 'value2');
        expect(cache.size()).toBe(2);
      });
    });

    describe('getStats', () => {
      it('should track hits and misses', () => {
        cache.set('key1', 'value1');
        cache.get('key1');
        cache.get('key1');
        cache.get('nonexistent');
        
        const stats = cache.getStats();
        expect(stats.hits).toBe(2);
        expect(stats.misses).toBe(1);
        expect(stats.sets).toBe(1);
      });

      it('should calculate hit rate correctly', () => {
        cache.set('key1', 'value1');
        cache.get('key1');
        cache.get('nonexistent');
        
        const stats = cache.getStats();
        expect(stats.hitRate).toBe('50.00%');
      });
    });

    describe('cleanup', () => {
      it('should remove expired entries', async () => {
        cache.set('key1', 'value1', 100);
        cache.set('key2', 'value2', 200);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const deleted = cache.cleanup();
        expect(deleted).toBe(1);
        expect(cache.size()).toBe(1);
        expect(cache.get('key1')).toBeNull();
        expect(cache.get('key2')).toBe('value2');
      });
    });

    describe('printStats', () => {
      it('should print stats without throwing', () => {
        cache.set('key1', 'value1');
        cache.get('key1');
        
        expect(() => cache.printStats()).not.toThrow();
      });
    });
  });

  describe('withCache', () => {
    it('should use cached value if available', () => {
      cache.set('key1', 'cached');
      
      const loader = vi.fn(() => 'fresh');
      const result = withCache(cache, 'key1', loader);
      
      expect(result).toBe('cached');
      expect(loader).not.toHaveBeenCalled();
    });

    it('should call loader and cache result if not available', () => {
      const loader = vi.fn(() => 'fresh');
      const result = withCache(cache, 'key1', loader);
      
      expect(result).toBe('fresh');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('fresh');
    });
  });

  describe('withCacheAsync', () => {
    it('should use cached value if available', async () => {
      cache.set('key1', 'cached');
      
      const loader = vi.fn(async () => 'fresh');
      const result = await withCacheAsync(cache, 'key1', loader);
      
      expect(result).toBe('cached');
      expect(loader).not.toHaveBeenCalled();
    });

    it('should call loader and cache result if not available', async () => {
      const loader = vi.fn(async () => 'fresh');
      const result = await withCacheAsync(cache, 'key1', loader);
      
      expect(result).toBe('fresh');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('fresh');
    });
  });

  describe('Global Cache Instances', () => {
    it('should have predefined cache instances', () => {
      expect(modelsCache).toBeDefined();
      expect(embeddingCache).toBeDefined();
      expect(modelsCache.name).toBe('ModelsCache');
      expect(embeddingCache.name).toBe('EmbeddingCache');
    });

    it('should have different TTL values', () => {
      expect(modelsCache.ttl).toBe(300000); // 5 minutes
      expect(embeddingCache.ttl).toBe(3600000); // 1 hour
    });
  });
});
