/**
 * 国际化 (i18n) 模块
 * 支持多语言切换和本地化
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = {
  zh: { name: '中文', code: 'zh-CN' },
  en: { name: 'English', code: 'en-US' },
  ja: { name: '日本語', code: 'ja-JP' }
};

/**
 * 默认语言包（中文）
 */
const DEFAULT_LOCALE = 'zh';

/**
 * 语言包缓存
 */
const localeCache = new Map();

/**
 * 当前语言
 */
let currentLocale = DEFAULT_LOCALE;

/**
 * 语言包目录
 */
const LOCALES_DIR = path.join(__dirname, '..', 'locales');

/**
 * 加载语言包
 */
async function loadLocale(locale) {
  // 检查缓存
  if (localeCache.has(locale)) {
    return localeCache.get(locale);
  }

  // 尝试从文件加载
  const localeFile = path.join(LOCALES_DIR, `${locale}.json`);
  try {
    const data = await fs.readFile(localeFile, 'utf-8');
    const localeData = JSON.parse(data);
    localeCache.set(locale, localeData);
    return localeData;
  } catch (error) {
    // 如果文件不存在，尝试加载默认语言
    if (locale !== DEFAULT_LOCALE) {
      console.warn(`Locale ${locale} not found, falling back to ${DEFAULT_LOCALE}`);
      return loadLocale(DEFAULT_LOCALE);
    }
    throw error;
  }
}

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @param {Object} params - 替换参数
 * @param {string} locale - 语言代码（可选）
 * @returns {string} 翻译后的文本
 */
export function t(key, params = {}, locale = currentLocale) {
  const localeData = localeCache.get(locale) || {};
  let text = key.split('.').reduce((obj, k) => obj?.[k], localeData) || key;

  // 替换参数
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
  });

  return text;
}

/**
 * 设置当前语言
 * @param {string} locale - 语言代码
 */
export async function setLocale(locale) {
  if (!SUPPORTED_LANGUAGES[locale]) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  currentLocale = locale;
  await loadLocale(locale);
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
export function getLocale() {
  return currentLocale;
}

/**
 * 获取支持的语言列表
 * @returns {Array} 语言列表
 */
export function getSupportedLanguages() {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code,
    name: info.name,
    displayName: info.code
  }));
}

/**
 * 检测系统语言
 * @returns {string} 检测到的语言代码
 */
export function detectSystemLocale() {
  const envVars = ['LC_ALL', 'LC_MESSAGES', 'LANG'];
  
  for (const envVar of envVars) {
    const value = process.env[envVar];
    if (value) {
      const lang = value.split('.')[0].split('_')[0];
      if (SUPPORTED_LANGUAGES[lang]) {
        return lang;
      }
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * 初始化 i18n 系统
 * @param {string} locale - 初始语言（可选）
 */
export async function initI18n(locale) {
  const targetLocale = locale || detectSystemLocale();
  await setLocale(targetLocale);
}

/**
 * I18n 类
 */
export class I18nManager {
  constructor(options = {}) {
    this.currentLocale = options.locale || DEFAULT_LOCALE;
    this.fallbackLocale = options.fallbackLocale || DEFAULT_LOCALE;
    this.locales = new Map();
  }

  /**
   * 加载语言包
   */
  async loadLocale(locale) {
    if (this.locales.has(locale)) {
      return this.locales.get(locale);
    }

    const localeFile = path.join(LOCALES_DIR, `${locale}.json`);
    try {
      const data = await fs.readFile(localeFile, 'utf-8');
      const localeData = JSON.parse(data);
      this.locales.set(locale, localeData);
      return localeData;
    } catch (error) {
      if (locale !== this.fallbackLocale) {
        return this.loadLocale(this.fallbackLocale);
      }
      throw error;
    }
  }

  /**
   * 设置当前语言
   */
  async setLocale(locale) {
    if (!SUPPORTED_LANGUAGES[locale]) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    await this.loadLocale(locale);
    this.currentLocale = locale;
  }

  /**
   * 获取翻译
   */
  translate(key, params = {}) {
    let text = key.split('.').reduce((obj, k) => obj?.[k], this.locales.get(this.currentLocale)) ||
               key.split('.').reduce((obj, k) => obj?.[k], this.locales.get(this.fallbackLocale)) ||
               key;

    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
    });

    return text;
  }

  /**
   * 格式化数字
   */
  formatNumber(number, locale = this.currentLocale) {
    return new Intl.NumberFormat(SUPPORTED_LANGUAGES[locale]?.code).format(number);
  }

  /**
   * 格式化日期
   */
  formatDate(date, locale = this.currentLocale) {
    return new Intl.DateTimeFormat(SUPPORTED_LANGUAGES[locale]?.code).format(date);
  }

  /**
   * 格式化相对时间
   */
  formatRelativeTime(date, locale = this.currentLocale) {
    const rtf = new Intl.RelativeTimeFormat(SUPPORTED_LANGUAGES[locale]?.code);
    const diff = date.getTime() - Date.now();
    const absDiff = Math.abs(diff);

    const units = [
      ['year', 31536000000],
      ['month', 2592000000],
      ['day', 86400000],
      ['hour', 3600000],
      ['minute', 60000],
      ['second', 1000]
    ];

    for (const [unit, ms] of units) {
      if (absDiff >= ms || unit === 'second') {
        const value = Math.floor(diff / ms);
        return rtf.format(value, unit);
      }
    }

    return rtf.format(0, 'second');
  }

  /**
   * 获取当前语言
   */
  getLocale() {
    return this.currentLocale;
  }
}

/**
 * 创建全局 i18n 实例
 */
let globalI18n = null;

export function createI18nInstance(options = {}) {
  globalI18n = new I18nManager(options);
  return globalI18n;
}

export function getI18nInstance() {
  if (!globalI18n) {
    globalI18n = new I18nManager();
  }
  return globalI18n;
}

// 导出便捷函数
export const translate = t;
export const __ = t;
