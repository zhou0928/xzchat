/**
 * 主题定制系统类型定义
 */

/**
 * 颜色样式类型
 */
export type ColorStyle = string;

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  /** 用户消息颜色 */
  user: ColorStyle;
  /** 助手消息颜色 */
  assistant: ColorStyle;
  /** 系统消息颜色 */
  system: ColorStyle;
  /** 错误消息颜色 */
  error: ColorStyle;
  /** 警告消息颜色 */
  warning: ColorStyle;
  /** 成功消息颜色 */
  success: ColorStyle;
  /** 信息消息颜色 */
  info: ColorStyle;
  
  /** 命令颜色 */
  command: ColorStyle;
  /** 命令名称颜色 */
  commandName: ColorStyle;
  /** 命令参数颜色 */
  commandArgs: ColorStyle;
  
  /** 提示符颜色 */
  prompt: ColorStyle;
  /** 标题颜色 */
  header: ColorStyle;
  /** 边框颜色 */
  border: ColorStyle;
  /** 分隔线颜色 */
  separator: ColorStyle;
  
  /** 代码颜色 */
  code: ColorStyle;
  /** 代码块背景色 */
  codeBlock: ColorStyle;
  /** 代码关键字颜色 */
  codeKeyword: ColorStyle;
  /** 代码字符串颜色 */
  codeString: ColorStyle;
  /** 代码注释颜色 */
  codeComment: ColorStyle;
  /** 代码函数颜色 */
  codeFunction: ColorStyle;
  
  /** 链接颜色 */
  link: ColorStyle;
  /** 高亮颜色 */
  highlight: ColorStyle;
  /** 静音文本颜色 */
  muted: ColorStyle;
}

/**
 * 主题样式配置
 */
export interface ThemeStyles {
  /** 加载动画颜色 */
  spinner: ColorStyle;
  /** 进度条颜色 */
  progress: ColorStyle;
  /** 进度条背景色 */
  progressBar: ColorStyle;
  /** 思考状态颜色 */
  thinking: ColorStyle;
}

/**
 * 主题格式化配置
 */
export interface ThemeFormatting {
  /** 粗体样式 */
  bold: ColorStyle;
  /** 斜体样式 */
  italic: ColorStyle;
  /** 下划线样式 */
  underline: ColorStyle;
  /** 代码样式 */
  code: ColorStyle;
}

/**
 * 主题配置
 */
export interface Theme {
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description?: string;
  /** 颜色配置 */
  colors: ThemeColors;
  /** 样式配置 */
  styles: ThemeStyles;
  /** 格式化配置 */
  formatting: ThemeFormatting;
}

/**
 * 预设主题名称
 */
export type PresetThemeName =
  | 'default'
  | 'dark'
  | 'light'
  | 'highContrast'
  | 'minimal'
  | 'neon'
  | 'dracula'
  | 'nord';

/**
 * 主题信息
 */
export interface ThemeInfo {
  /** 主题名称 */
  name: string;
  /** 主题类型 */
  type: 'preset' | 'custom';
  /** 主题描述 */
  description: string;
}

/**
 * ThemeManager 类
 */
export class ThemeManager {
  /**
   * 加载预设主题
   * @param name 预设主题名称
   * @returns 主题配置
   */
  loadPreset(name: PresetThemeName): Theme;
  
  /**
   * 加载自定义主题
   * @param name 主题名称
   * @param theme 主题配置
   * @returns 主题配置
   */
  loadCustom(name: string, theme: Theme): Theme;
  
  /**
   * 设置当前主题
   * @param name 主题名称
   * @returns 主题配置
   */
  setTheme(name: string): Theme;
  
  /**
   * 获取当前主题
   * @returns 当前主题配置
   */
  getTheme(): Theme | null;
  
  /**
   * 获取主题列表
   * @returns 主题信息列表
   */
  getThemeList(): ThemeInfo[];
  
  /**
   * 应用颜色到文本
   * @param text 文本
   * @param colorName 颜色名称
   * @returns 着色后的文本
   */
  colorize(text: string, colorName: keyof ThemeColors): string;
  
  /**
   * 应用样式到文本
   * @param text 文本
   * @param styleName 样式名称
   * @returns 样式化后的文本
   */
  stylize(text: string, styleName: keyof ThemeFormatting): string;
  
  /**
   * 格式化消息
   * @param text 文本
   * @param type 消息类型
   * @returns 格式化后的消息
   */
  formatMessage(text: string, type?: keyof ThemeColors): string;
  
  /**
   * 格式化代码
   * @param code 代码
   * @param language 语言
   * @returns 格式化后的代码
   */
  formatCode(code: string, language?: string): string;
  
  /**
   * 格式化命令
   * @param command 命令
   * @param args 参数
   * @returns 格式化后的命令
   */
  formatCommand(command: string, args?: string[]): string;
  
  /**
   * 格式化标题
   * @param text 文本
   * @param level 标题级别
   * @returns 格式化后的标题
   */
  formatHeader(text: string, level?: number): string;
  
  /**
   * 格式化链接
   * @param text 文本
   * @param url URL
   * @returns 格式化后的链接
   */
  formatLink(text: string, url: string): string;
  
  /**
   * 格式化高亮
   * @param text 文本
   * @returns 高亮文本
   */
  formatHighlight(text: string): string;
  
  /**
   * 格式化静音文本
   * @param text 文本
   * @returns 静音文本
   */
  formatMuted(text: string): string;
  
  /**
   * 创建边框
   * @param char 边框字符
   * @param length 长度
   * @returns 边框字符串
   */
  createBorder(char?: string, length?: number): string;
  
  /**
   * 创建分隔线
   * @param length 长度
   * @returns 分隔线
   */
  createSeparator(length?: number): string;
  
  /**
   * 验证主题结构
   * @param theme 主题配置
   */
  validateTheme(theme: Theme): void;
  
  /**
   * 清除缓存
   */
  clearCache(): void;
  
  /**
   * 导出当前主题
   * @returns 主题配置
   */
  exportTheme(): Theme;
  
  /**
   * 导入主题
   * @param themeData 主题数据
   * @returns 主题配置
   */
  importTheme(themeData: Theme): Theme;
  
  /**
   * 创建主题变体
   * @param baseThemeName 基础主题名称
   * @param variantName 变体名称
   * @param overrides 覆盖配置
   * @returns 变体主题
   */
  createVariant(
    baseThemeName: string,
    variantName: string,
    overrides: Partial<Theme>
  ): Theme;
  
  /**
   * 深度合并对象
   * @param target 目标对象
   * @param source 源对象
   * @returns 合并后的对象
   */
  deepMerge<T extends Object>(target: T, source: Partial<T>): T;
  
  /**
   * 重置到默认状态
   */
  reset(): void;
}

/**
 * ANSI 颜色代码常量
 */
export const Colors: {
  reset: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
  bgBlack: string;
  bgRed: string;
  bgGreen: string;
  bgYellow: string;
  bgBlue: string;
  bgMagenta: string;
  bgCyan: string;
  bgWhite: string;
  bold: string;
  dim: string;
  italic: string;
  underline: string;
  inverse: string;
  hidden: string;
  strikethrough: string;
};

/**
 * 预设主题集合
 */
export const PresetThemes: Record<PresetThemeName, Theme>;

/**
 * 全局主题管理器实例
 */
export const theme: ThemeManager;

/**
 * 快捷函数 - 应用颜色
 */
export function color(text: string, colorName: keyof ThemeColors): string;

/**
 * 快捷函数 - 应用样式
 */
export function style(text: string, styleName: keyof ThemeFormatting): string;

/**
 * 快捷函数 - 格式化消息
 */
export function formatMessage(
  text: string,
  type?: keyof ThemeColors
): string;

/**
 * 快捷函数 - 设置主题
 */
export function setTheme(name: string): Theme;

/**
 * 快捷函数 - 获取主题
 */
export function getTheme(): Theme | null;

/**
 * 快捷函数 - 获取主题列表
 */
export function getThemeList(): ThemeInfo[];
