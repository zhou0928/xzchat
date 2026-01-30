/**
 * 国际化(i18n)系统类型定义
 */

/**
 * I18n配置选项
 */
export interface I18nConfig {
  /** 默认语言代码 */
  defaultLocale?: string;
  /** 可用语言列表 */
  availableLocales?: string[];
  /** 回退语言 */
  fallbackLocale?: string;
  /** 是否自动检测系统语言 */
  autoDetect?: boolean;
  /** 是否缓存翻译结果 */
  cacheTranslations?: boolean;
  /** 翻译文件目录 */
  localeDirectory?: string;
}

/**
 * 翻译消息对象
 */
export interface TranslationMessages {
  [key: string]: string | TranslationMessages;
}

/**
 * 翻译参数对象
 */
export interface TranslationParams {
  [key: string]: string | number | boolean;
}

/**
 * 语言信息
 */
export interface LocaleInfo {
  /** 语言代码 */
  code: string;
  /** 语言名称(原生) */
  name: string;
  /** 语言名称(英语) */
  englishName: string;
  /** 是否为默认语言 */
  isDefault?: boolean;
}

/**
 * I18n类
 */
export class I18n {
  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options?: I18nConfig);

  /**
   * 初始化i18n系统
   * @param options 配置选项
   */
  init(options?: I18nConfig): void;

  /**
   * 从目录加载翻译文件
   * @param directory 翻译文件目录
   */
  loadFromDirectory(directory: string): void;

  /**
   * 加载翻译
   * @param locale 语言代码
   * @param messages 翻译消息对象
   */
  load(locale: string, messages: TranslationMessages): void;

  /**
   * 获取当前语言
   * @returns 当前语言代码
   */
  getLocale(): string;

  /**
   * 设置当前语言
   * @param locale 语言代码
   * @returns 是否设置成功
   */
  setLocale(locale: string): boolean;

  /**
   * 获取可用语言列表
   * @returns 语言代码列表
   */
  getAvailableLocales(): string[];

  /**
   * 翻译文本
   * @param key 翻译键(支持点号分隔的嵌套路径)
   * @param params 替换参数
   * @param locale 目标语言(可选)
   * @returns 翻译后的文本
   */
  t(key: string, params?: TranslationParams, locale?: string): string;

  /**
   * 检查翻译是否存在
   * @param key 翻译键
   * @param locale 语言代码
   * @returns 是否存在
   */
  exists(key: string, locale?: string): boolean;

  /**
   * 获取语言名称
   * @param locale 语言代码
   * @param displayLocale 显示语言
   * @returns 语言名称
   */
  getLanguageName(locale: string, displayLocale?: string): string;

  /**
   * 批量翻译
   * @param keys 翻译键数组
   * @param params 参数对象
   * @param locale 目标语言
   * @returns 翻译结果对象
   */
  translateBatch(
    keys: string[],
    params?: TranslationParams,
    locale?: string
  ): Record<string, string>;

  /**
   * 创建命名空间翻译函数
   * @param namespace 命名空间前缀
   * @returns 翻译函数
   */
  namespace(namespace: string): (
    key: string,
    params?: TranslationParams,
    locale?: string
  ) => string;

  /**
   * 清除缓存
   */
  clearCache(): void;

  /**
   * 重置到初始状态
   */
  reset(): void;

  /**
   * 导出当前语言的所有翻译
   * @param locale 语言代码
   * @returns 翻译对象
   */
  exportTranslations(locale?: string): TranslationMessages;
}

/**
 * 全局i18n实例
 */
export const i18n: I18n;

/**
 * 快捷函数 - 翻译
 */
export function t(
  key: string,
  params?: TranslationParams,
  locale?: string
): string;

/**
 * 快捷函数 - 设置语言
 */
export function setLocale(locale: string): boolean;

/**
 * 快捷函数 - 获取当前语言
 */
export function getLocale(): string;

/**
 * 快捷函数 - 创建命名空间
 */
export function createNamespace(
  namespace: string
): (key: string, params?: TranslationParams, locale?: string) => string;

/**
 * 检测系统语言
 * @returns 检测到的语言代码
 */
export function detectSystemLocale(): string;

/**
 * 格式化数字
 * @param number 数字
 * @param options 格式化选项
 * @param locale 语言代码
 * @returns 格式化后的字符串
 */
export function formatNumber(
  number: number,
  options?: Intl.NumberFormatOptions,
  locale?: string
): string;

/**
 * 格式化日期
 * @param date 日期
 * @param options 格式化选项
 * @param locale 语言代码
 * @returns 格式化后的字符串
 */
export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
): string;

/**
 * 格式化货币
 * @param amount 金额
 * @param currency 货币代码
 * @param options 格式化选项
 * @param locale 语言代码
 * @returns 格式化后的字符串
 */
export function formatCurrency(
  amount: number,
  currency: string,
  options?: Intl.NumberFormatOptions,
  locale?: string
): string;

/**
 * 复数形式
 * @param count 数量
 * @param key 单数形式的翻译键
 * @param pluralKey 复数形式的翻译键
 * @param params 参数对象
 * @param locale 语言代码
 * @returns 翻译后的字符串
 */
export function plural(
  count: number,
  key: string,
  pluralKey: string,
  params?: TranslationParams,
  locale?: string
): string;

/**
 * 获取所有可用语言
 * @returns 语言信息列表
 */
export function getAvailableLocalesInfo(): LocaleInfo[];
