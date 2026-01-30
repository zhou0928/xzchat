/**
 * 国际化(i18n)系统
 * 提供多语言支持、语言切换、翻译管理等功能
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  defaultLocale: 'zh-CN',
  availableLocales: ['zh-CN', 'en-US'],
  fallbackLocale: 'zh-CN',
  autoDetect: true,
  cacheTranslations: true
};

/**
 * 翻译资源存储
 */
let translations = {};
let currentLocale = DEFAULT_CONFIG.defaultLocale;
let config = { ...DEFAULT_CONFIG };

/**
 * 语言缓存
 */
const translationCache = new Map();

/**
 * I18n类 - 国际化管理器
 */
export class I18n {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.currentLocale = this.config.defaultLocale;
    this.fallbackLocale = this.config.fallbackLocale;
    this.availableLocales = this.config.availableLocales;
    this.translations = {};
    this.cache = this.config.cacheTranslations ? new Map() : null;
  }

  /**
   * 初始化i18n系统
   * @param {Object} options 配置选项
   */
  init(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.currentLocale = this.config.defaultLocale;
    this.availableLocales = this.config.availableLocales;
    this.fallbackLocale = this.config.fallbackLocale;
    
    if (this.config.localeDirectory) {
      this.loadFromDirectory(this.config.localeDirectory);
    }
  }

  /**
   * 从目录加载翻译文件
   * @param {string} directory 翻译文件目录
   */
  loadFromDirectory(directory) {
    try {
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const locale = path.basename(file, '.json');
          const filePath = path.join(directory, file);
          
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            this.translations[locale] = JSON.parse(content);
          } catch (error) {
            console.warn(`Failed to load translation file ${filePath}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load translations from directory ${directory}:`, error.message);
    }
  }

  /**
   * 加载翻译
   * @param {string} locale 语言代码
   * @param {Object} messages 翻译消息对象
   */
  load(locale, messages) {
    if (!this.translations[locale]) {
      this.translations[locale] = {};
    }
    
    this.mergeDeep(this.translations[locale], messages);
    
    if (this.cache) {
      this.cache.clear();
    }
  }

  /**
   * 深度合并对象
   * @param {Object} target 目标对象
   * @param {Object} source 源对象
   */
  mergeDeep(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.mergeDeep(target[key], source[key]));
      }
      Object.assign(target || {}, { [key]: source[key] });
    }
    return target;
  }

  /**
   * 获取当前语言
   * @returns {string} 当前语言代码
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * 设置当前语言
   * @param {string} locale 语言代码
   * @returns {boolean} 是否设置成功
   */
  setLocale(locale) {
    if (!this.availableLocales.includes(locale)) {
      console.warn(`Locale ${locale} is not available`);
      return false;
    }
    
    this.currentLocale = locale;
    
    if (this.cache) {
      this.cache.clear();
    }
    
    return true;
  }

  /**
   * 获取可用语言列表
   * @returns {Array} 语言代码列表
   */
  getAvailableLocales() {
    return [...this.availableLocales];
  }

  /**
   * 翻译文本
   * @param {string} key 翻译键(支持点号分隔的嵌套路径)
   * @param {Object} params 替换参数
   * @param {string} locale 目标语言(可选)
   * @returns {string} 翻译后的文本
   */
  t(key, params = {}, locale = null) {
    const targetLocale = locale || this.currentLocale;
    
    // 检查缓存
    if (this.cache && !locale) {
      const cacheKey = `${targetLocale}:${key}:${JSON.stringify(params)}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // 获取翻译
    const translation = this.getTranslation(key, targetLocale);
    
    // 替换参数
    let result = this.interpolate(translation, params);
    
    // 缓存结果
    if (this.cache && !locale) {
      const cacheKey = `${targetLocale}:${key}:${JSON.stringify(params)}`;
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }

  /**
   * 获取翻译文本
   * @param {string} key 翻译键
   * @param {string} locale 语言代码
   * @returns {string} 翻译文本
   */
  getTranslation(key, locale) {
    const keys = key.split('.');
    let value = this.translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 回退到fallback语言
        value = this.translations[this.fallbackLocale];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // 返回原始键
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  /**
   * 参数插值
   * @param {string} template 模板字符串
   * @param {Object} params 参数对象
   * @returns {string} 替换后的字符串
   */
  interpolate(template, params) {
    if (typeof template !== 'string') {
      return template;
    }
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * 检查翻译是否存在
   * @param {string} key 翻译键
   * @param {string} locale 语言代码
   * @returns {boolean} 是否存在
   */
  exists(key, locale = null) {
    const targetLocale = locale || this.currentLocale;
    const keys = key.split('.');
    let value = this.translations[targetLocale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }
    
    return typeof value === 'string';
  }

  /**
   * 获取语言名称
   * @param {string} locale 语言代码
   * @param {string} displayLocale 显示语言
   * @returns {string} 语言名称
   */
  getLanguageName(locale, displayLocale = null) {
    const targetLocale = displayLocale || this.currentLocale;
    return this.t(`locales.${locale}`, {}, targetLocale);
  }

  /**
   * 批量翻译
   * @param {Array} keys 翻译键数组
   * @param {Object} params 参数对象
   * @param {string} locale 目标语言
   * @returns {Object} 翻译结果对象
   */
  translateBatch(keys, params = {}, locale = null) {
    const result = {};
    
    for (const key of keys) {
      result[key] = this.t(key, params, locale);
    }
    
    return result;
  }

  /**
   * 创建命名空间翻译函数
   * @param {string} namespace 命名空间前缀
   * @returns {Function} 翻译函数
   */
  namespace(namespace) {
    return (key, params, locale) => {
      return this.t(`${namespace}.${key}`, params, locale);
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  }

  /**
   * 重置到初始状态
   */
  reset() {
    this.currentLocale = this.config.defaultLocale;
    this.translations = {};
    this.clearCache();
  }

  /**
   * 导出当前语言的所有翻译
   * @param {string} locale 语言代码
   * @returns {Object} 翻译对象
   */
  exportTranslations(locale = null) {
    const targetLocale = locale || this.currentLocale;
    return { ...this.translations[targetLocale] };
  }
}

/**
 * 全局i18n实例
 */
export const i18n = new I18n();

/**
 * 快捷函数 - 翻译
 */
export const t = (key, params, locale) => i18n.t(key, params, locale);

/**
 * 快捷函数 - 设置语言
 */
export const setLocale = (locale) => i18n.setLocale(locale);

/**
 * 快捷函数 - 获取当前语言
 */
export const getLocale = () => i18n.getLocale();

/**
 * 快捷函数 - 创建命名空间
 */
export const createNamespace = (namespace) => i18n.namespace(namespace);

/**
 * 检测系统语言
 * @returns {string} 检测到的语言代码
 */
export function detectSystemLocale() {
  const envLocale = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  const match = envLocale.match(/([a-z]{2})[_-]([A-Z]{2})/);
  
  if (match) {
    return `${match[1].toLowerCase()}-${match[2].toUpperCase()}`;
  }
  
  return DEFAULT_CONFIG.defaultLocale;
}

/**
 * 格式化数字
 * @param {number} number 数字
 * @param {Object} options 格式化选项
 * @param {string} locale 语言代码
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(number, options = {}, locale = null) {
  const targetLocale = locale || i18n.getLocale();
  return new Intl.NumberFormat(targetLocale, options).format(number);
}

/**
 * 格式化日期
 * @param {Date} date 日期
 * @param {Object} options 格式化选项
 * @param {string} locale 语言代码
 * @returns {string} 格式化后的字符串
 */
export function formatDate(date, options = {}, locale = null) {
  const targetLocale = locale || i18n.getLocale();
  return new Intl.DateTimeFormat(targetLocale, options).format(date);
}

/**
 * 格式化货币
 * @param {number} amount 金额
 * @param {string} currency 货币代码
 * @param {Object} options 格式化选项
 * @param {string} locale 语言代码
 * @returns {string} 格式化后的字符串
 */
export function formatCurrency(amount, currency, options = {}, locale = null) {
  const targetLocale = locale || i18n.getLocale();
  return new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency,
    ...options
  }).format(amount);
}

/**
 * 复数形式
 * @param {number} count 数量
 * @param {string} key 单数形式的翻译键
 * @param {string} pluralKey 复数形式的翻译键
 * @param {Object} params 参数对象
 * @param {string} locale 语言代码
 * @returns {string} 翻译后的字符串
 */
export function plural(count, key, pluralKey, params = {}, locale = null) {
  const paramsWithCount = { ...params, count };
  const targetKey = count === 1 ? key : pluralKey;
  return i18n.t(targetKey, paramsWithCount, locale);
}

export default I18n;
