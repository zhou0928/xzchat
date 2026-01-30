/**
 * 国际化(i18n)系统单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  I18n,
  i18n,
  t,
  setLocale,
  getLocale,
  createNamespace,
  detectSystemLocale,
  formatNumber,
  formatDate,
  formatCurrency,
  plural
} from '../../lib/i18n/index.js';

describe('I18n System', () => {
  let i18nInstance;

  beforeEach(() => {
    i18nInstance = new I18n({
      defaultLocale: 'zh-CN',
      availableLocales: ['zh-CN', 'en-US'],
      fallbackLocale: 'zh-CN'
    });
  });

  afterEach(() => {
    i18nInstance.reset();
  });

  describe('I18n Class', () => {
    it('should create instance with default config', () => {
      const instance = new I18n();
      expect(instance.getLocale()).toBe('zh-CN');
      expect(instance.getAvailableLocales()).toContain('zh-CN');
      expect(instance.getAvailableLocales()).toContain('en-US');
    });

    it('should create instance with custom config', () => {
      const instance = new I18n({
        defaultLocale: 'en-US',
        availableLocales: ['en-US'],
        fallbackLocale: 'en-US'
      });
      expect(instance.getLocale()).toBe('en-US');
    });

    it('should load translations', () => {
      i18nInstance.load('zh-CN', {
        app: {
          name: '测试应用'
        }
      });

      expect(i18nInstance.t('app.name')).toBe('测试应用');
    });

    it('should switch locale', () => {
      i18nInstance.load('zh-CN', { hello: '你好' });
      i18nInstance.load('en-US', { hello: 'Hello' });

      expect(i18nInstance.getLocale()).toBe('zh-CN');
      expect(i18nInstance.t('hello')).toBe('你好');

      const success = i18nInstance.setLocale('en-US');
      expect(success).toBe(true);
      expect(i18nInstance.t('hello')).toBe('Hello');
    });

    it('should return false for invalid locale', () => {
      const success = i18nInstance.setLocale('fr-FR');
      expect(success).toBe(false);
    });

    it('should translate with nested keys', () => {
      i18nInstance.load('zh-CN', {
        messages: {
          error: {
            notFound: '未找到: {{item}}'
          }
        }
      });

      const result = i18nInstance.t('messages.error.notFound', { item: '文件' });
      expect(result).toBe('未找到: 文件');
    });

    it('should fallback to default locale when key not found', () => {
      i18nInstance.load('zh-CN', { hello: '你好' });
      i18nInstance.setLocale('en-US');

      const result = i18nInstance.t('hello');
      expect(result).toBe('你好');
    });

    it('should return key when translation not found', () => {
      const result = i18nInstance.t('non.existent.key');
      expect(result).toBe('non.existent.key');
    });

    it('should check if translation exists', () => {
      i18nInstance.load('zh-CN', { test: '测试' });

      expect(i18nInstance.exists('test')).toBe(true);
      expect(i18nInstance.exists('nonexistent')).toBe(false);
    });

    it('should translate batch keys', () => {
      i18nInstance.load('zh-CN', {
        key1: '值1',
        key2: '值2',
        key3: '值3'
      });

      const result = i18nInstance.translateBatch(['key1', 'key2', 'key3']);
      expect(result).toEqual({
        key1: '值1',
        key2: '值2',
        key3: '值3'
      });
    });

    it('should create namespace', () => {
      i18nInstance.load('zh-CN', {
        messages: {
          error: {
            notFound: '未找到',
            invalid: '无效'
          }
        }
      });

      const t = i18nInstance.namespace('messages.error');
      expect(t('notFound')).toBe('未找到');
      expect(t('invalid')).toBe('无效');
    });

    it('should clear cache', () => {
      i18nInstance.load('zh-CN', { test: '测试' });
      i18nInstance.t('test');

      const cacheClearSpy = vi.spyOn(i18nInstance.cache, 'clear');
      i18nInstance.clearCache();

      expect(cacheClearSpy).toHaveBeenCalled();
    });

    it('should export translations', () => {
      i18nInstance.load('zh-CN', { app: { name: '测试' } });

      const exported = i18nInstance.exportTranslations('zh-CN');
      expect(exported).toEqual({ app: { name: '测试' } });
    });
  });

  describe('Global Functions', () => {
    it('should translate using global t function', () => {
      i18n.load('zh-CN', { test: '测试' });
      expect(t('test')).toBe('测试');
    });

    it('should set locale using global setLocale', () => {
      i18n.load('en-US', { hello: 'Hello' });
      setLocale('en-US');
      expect(getLocale()).toBe('en-US');
    });

    it('should create namespace using global function', () => {
      i18n.load('zh-CN', { ns: { key: '值' } });
      const tNs = createNamespace('ns');
      expect(tNs('key')).toBe('值');
    });
  });

  describe('System Locale Detection', () => {
    it('should detect system locale', () => {
      const locale = detectSystemLocale();
      expect(locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    });

    it('should return default locale when env not set', () => {
      const originalLang = process.env.LANG;
      delete process.env.LANG;
      delete process.env.LC_ALL;
      delete process.env.LC_MESSAGES;

      const locale = detectSystemLocale();
      expect(locale).toBe('zh-CN');

      if (originalLang) {
        process.env.LANG = originalLang;
      }
    });
  });

  describe('Formatting Functions', () => {
    it('should format number', () => {
      const result = formatNumber(1234.56, { minimumFractionDigits: 2 }, 'en-US');
      expect(result).toBe('1,234.56');
    });

    it('should format date', () => {
      const date = new Date('2026-01-28');
      const result = formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' }, 'en-US');
      expect(result).toContain('2026');
    });

    it('should format currency', () => {
      const result = formatCurrency(1234.56, 'USD', {}, 'en-US');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should handle plural', () => {
      i18n.load('en-US', {
        item: '1 item',
        items: '{{count}} items'
      });

      const singular = plural(1, 'item', 'items', {}, 'en-US');
      const pluralForm = plural(5, 'item', 'items', { count: 5 }, 'en-US');

      expect(singular).toBe('1 item');
      expect(pluralForm).toBe('5 items');
    });
  });

  describe('Cache', () => {
    it('should cache translation results', () => {
      const instance = new I18n({ cacheTranslations: true });
      instance.load('zh-CN', { test: '测试' });

      const tSpy = vi.spyOn(instance, 'interpolate');
      instance.t('test');
      instance.t('test');

      expect(tSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear cache on locale change', () => {
      const instance = new I18n({ cacheTranslations: true });
      instance.load('zh-CN', { test: '测试' });
      instance.load('en-US', { test: 'Test' });

      instance.t('test');
      instance.setLocale('en-US');
      instance.t('test');

      const cacheClearSpy = vi.spyOn(instance.cache, 'clear');
      expect(cacheClearSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined params', () => {
      i18n.load('zh-CN', { test: '测试' });
      expect(i18n.t('test', null)).toBe('测试');
      expect(i18n.t('test', undefined)).toBe('测试');
    });

    it('should handle missing params in template', () => {
      i18n.load('zh-CN', { test: '测试 {{name}}' });
      const result = i18n.t('test', {});
      expect(result).toBe('测试 {{name}}');
    });

    it('should handle empty key', () => {
      const result = i18n.t('');
      expect(result).toBe('');
    });

    it('should handle special characters in key', () => {
      i18n.load('zh-CN', { 'key.with.dots': '测试' });
      expect(i18n.t('key.with.dots')).toBe('测试');
    });
  });

  describe('Performance', () => {
    it('should handle large translation object', () => {
      const largeTranslation = {};
      for (let i = 0; i < 1000; i++) {
        largeTranslation[`key${i}`] = `值${i}`;
      }

      const start = Date.now();
      i18nInstance.load('zh-CN', largeTranslation);
      const loadTime = Date.now() - start;

      expect(loadTime).toBeLessThan(100);
    });

    it('should handle many translations in batch', () => {
      i18nInstance.load('zh-CN', {
        key1: '值1',
        key2: '值2',
        key3: '值3'
      });

      const keys = Array(100).fill(null).map((_, i) => `key${(i % 3) + 1}`);
      const start = Date.now();
      i18nInstance.translateBatch(keys);
      const batchTime = Date.now() - start;

      expect(batchTime).toBeLessThan(50);
    });
  });
});
