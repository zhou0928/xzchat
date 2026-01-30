/**
 * 快捷键模块类型定义
 */

import { Interface } from 'readline';
import { AbortController } from 'abort-controller';

/**
 * 按键对象
 */
export interface Key {
  /** 按键名称 */
  name: string;
  /** 是否按下了 Ctrl */
  ctrl?: boolean;
  /** 是否按下了 Alt */
  alt?: boolean;
  /** 是否按下了 Shift */
  shift?: boolean;
  /** 按键元数据 */
  meta?: boolean;
  /** 按键序列 */
  sequence?: string;
  /** 键码 */
  code?: string;
}

/**
 * 快捷键绑定配置
 */
export interface KeyBinding {
  /** 按键名称 */
  key: string;
  /** 是否需要 Ctrl */
  ctrl?: boolean;
  /** 是否需要 Alt */
  alt?: boolean;
  /** 是否需要 Shift */
  shift?: boolean;
  /** 快捷键显示名称 */
  name: string;
  /** 功能描述 */
  description: string;
  /** 操作标识 */
  action: string;
}

/**
 * 快捷键管理器配置
 */
export interface KeyBindingManagerOptions {
  /** readline 接口实例 */
  rl: Interface;
  /** 获取当前 AbortController 的函数 */
  abortController: () => AbortController | null;
  /** 检查是否正在处理的函数 */
  isProcessing?: () => boolean;
  /** 清屏回调 */
  onClear?: () => void;
  /** 退出回调 */
  onExit?: () => void;
  /** 中断回调 */
  onInterrupt?: () => void;
}

/**
 * 快捷键处理函数
 */
export type KeyBindingHandler = (key: Key) => void | Promise<void>;

/**
 * 快捷键常量
 */
export const KeyBindings: {
  [key: string]: KeyBinding;
};

/**
 * 快捷键管理器类
 */
export class KeyBindingManager {
  /**
   * 创建快捷键管理器实例
   */
  constructor(options: KeyBindingManagerOptions);

  /**
   * 注册自定义快捷键处理
   * @param action 操作标识
   * @param handler 处理函数
   */
  register(action: string, handler: KeyBindingHandler): void;

  /**
   * 处理按键事件
   * @param str 按键字符
   * @param key 按键对象
   * @returns 是否处理了该按键
   */
  handleKey(str: string, key: Key): boolean;

  /**
   * 显示所有快捷键帮助
   */
  showKeyBindings(): void;

  /**
   * 获取快捷键帮助文本
   * @returns 帮助文本
   */
  getHelpText(): string;

  /**
   * 自定义处理程序映射
   */
  customHandlers: Map<string, KeyBindingHandler>;

  /**
   * readline 接口
   */
  rl: Interface;

  /**
   * AbortController 获取函数
   */
  abortController: () => AbortController | null;

  /**
   * 是否正在处理
   */
  isProcessing?: () => boolean;

  /**
   * 清屏回调
   */
  onClear?: () => void;

  /**
   * 退出回调
   */
  onExit?: () => void;

  /**
   * 中断回调
   */
  onInterrupt?: () => void;
}

/**
 * 创建快捷键管理器实例
 * @param options 配置选项
 * @returns 快捷键管理器实例
 */
export function createKeyBindingManager(options: KeyBindingManagerOptions): KeyBindingManager;

/**
 * 设置 stdin 原始模式
 */
export function setupRawMode(): void;

/**
 * 恢复 stdin 正常模式
 */
export function restoreRawMode(): void;

/**
 * 检测按键组合名称
 * @param str 按键字符
 * @param key 按键对象
 * @returns 按键组合名称
 */
export function detectKeyBinding(str: string, key: Key): string;
