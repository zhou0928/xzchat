/**
 * 插件系统类型定义
 */

import { PluginContext } from './index.d';

/**
 * 插件状态
 */
export type PluginStatus = 
  | 'unloaded'
  | 'loading'
  | 'loaded'
  | 'enabled'
  | 'disabled'
  | 'error';

/**
 * 插件元数据
 */
export interface PluginMetadata {
  /** 插件名称 */
  name: string;
  /** 版本号 */
  version: string;
  /** 描述 */
  description: string;
  /** 作者 */
  author: string;
  /** 许可证 */
  license: string;
  /** 主文件 */
  main: string;
  /** 依赖 */
  dependencies?: Record<string, string>;
  /** 对等依赖 */
  peerDependencies?: Record<string, string>;
  /** 关键词 */
  keywords?: string[];
  /** 分类 */
  category?: string;
}

/**
 * 命令定义
 */
export interface PluginCommand {
  /** 处理函数 */
  handler: (args: string) => Promise<PluginCommandResult>;
  /** 描述 */
  description: string;
  /** 用法 */
  usage: string;
  /** 分类 */
  category: string;
}

/**
 * 命令结果
 */
export interface PluginCommandResult {
  /** 是否成功 */
  success?: boolean;
  /** 消息 */
  message?: string;
  /** 错误 */
  error?: string;
  /** 附加数据 */
  data?: unknown;
}

/**
 * 钩子处理器
 */
export interface HookHandler {
  /** 处理函数 */
  handler: (data: unknown, context: PluginContext) => unknown | Promise<unknown>;
  /** 优先级 */
  priority: number;
}

/**
 * 中间件定义
 */
export interface PluginMiddleware {
  /** 事件名称 */
  event: string;
  /** 处理函数 */
  handler: (data: unknown, context: PluginContext) => unknown | Promise<unknown>;
}

/**
 * 插件信息
 */
export interface PluginInfo {
  /** 名称 */
  name: string;
  /** 版本 */
  version: string;
  /** 描述 */
  description: string;
  /** 作者 */
  author: string;
  /** 状态 */
  status: PluginStatus;
  /** 启用时间 */
  enabledAt: Date | null;
  /** 错误信息 */
  error: string | null;
}

/**
 * 插件类
 */
export class Plugin {
  /** 元数据 */
  metadata: PluginMetadata;
  /** 路径 */
  path: string;
  /** 实例 */
  instance: unknown;
  /** 状态 */
  status: PluginStatus;
  /** 钩子 */
  hooks: Map<string, HookHandler[]>;
  /** 命令 */
  commands: Map<string, PluginCommand>;
  /** 中间件 */
  middlewares: PluginMiddleware[];
  /** 上下文 */
  context: PluginContext;
  /** 错误 */
  error: Error | null;
  /** 启用时间 */
  enabledAt: Date | null;

  constructor(metadata: PluginMetadata, pluginPath: string);

  /** 加载插件 */
  load(context: PluginContext): Promise<boolean>;

  /** 启用插件 */
  enable(): Promise<boolean>;

  /** 禁用插件 */
  disable(): Promise<boolean>;

  /** 卸载插件 */
  unload(): Promise<boolean>;

  /** 注册钩子 */
  registerHook(event: string, handler: HookHandler): void;

  /** 注册命令 */
  registerCommand(name: string, command: PluginCommand): void;

  /** 注册中间件 */
  registerMiddleware(middleware: PluginMiddleware): void;

  /** 获取插件信息 */
  getInfo(): PluginInfo;
}

/**
 * 插件管理器选项
 */
export interface PluginManagerOptions {
  /** 插件路径 */
  pluginPaths?: string[];
  /** 上下文 */
  context?: PluginContext;
  /** 自动加载 */
  autoLoad?: boolean;
}

/**
 * 插件管理器
 */
export class PluginManager {
  /** 插件映射 */
  plugins: Map<string, Plugin>;
  /** 插件路径 */
  pluginPaths: string[];
  /** 上下文 */
  context: PluginContext;
  /** 全局钩子 */
  hooks: Map<string, Function[]>;
  /** 自动加载 */
  autoLoad: boolean;
  /** 加载顺序 */
  loadOrder: string[];

  constructor(options: PluginManagerOptions);

  /** 添加插件路径 */
  addPluginPath(pluginPath: string): void;

  /** 扫描插件 */
  scanPlugins(): Promise<Array<{ metadata: PluginMetadata; path: string }>>;

  /** 加载所有插件 */
  loadAll(): Promise<number>;

  /** 加载单个插件 */
  loadPlugin(name: string, pluginPath: string, metadata: PluginMetadata): Promise<Plugin>;

  /** 启用插件 */
  enablePlugin(name: string): Promise<boolean>;

  /** 禁用插件 */
  disablePlugin(name: string): Promise<boolean>;

  /** 卸载插件 */
  unloadPlugin(name: string): Promise<boolean>;

  /** 重新加载插件 */
  reloadPlugin(name: string): Promise<boolean>;

  /** 获取插件 */
  getPlugin(name: string): Plugin | undefined;

  /** 获取所有插件 */
  getAllPlugins(): Plugin[];

  /** 获取已启用的插件 */
  getEnabledPlugins(): Plugin[];

  /** 触发钩子 */
  emit(event: string, data: unknown): Promise<unknown[]>;

  /** 执行中间件链 */
  executeMiddleware(event: string, data: unknown): Promise<unknown>;

  /** 列出插件 */
  listPlugins(): PluginInfo[];

  /** 获取插件命令 */
  getPluginCommands(): Record<string, PluginCommand>;
}

/**
 * 插件基类
 */
export class BasePlugin {
  /** 元数据 */
  metadata: PluginMetadata;
  /** 上下文 */
  context: PluginContext;

  constructor(metadata: PluginMetadata, context: PluginContext);

  /** 初始化 */
  onInitialize(context: PluginContext): Promise<void>;

  /** 启用 */
  onEnable(context: PluginContext): Promise<void>;

  /** 禁用 */
  onDisable(context: PluginContext): Promise<void>;

  /** 卸载 */
  onUnload(context: PluginContext): Promise<void>;

  /** 获取配置 */
  getConfig(): Record<string, unknown>;

  /** 更新配置 */
  updateConfig(newConfig: Record<string, unknown>): void;

  /** 保存配置 */
  saveConfig(): Promise<void>;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 应用实例 */
  app: unknown;
  /** 配置 */
  config: Record<string, unknown>;
  /** 日志器 */
  logger: unknown;
  /** 状态 */
  state: Map<string, unknown>;
  /** 服务 */
  services: Record<string, unknown>;
  /** 事件 */
  events: Map<string, Function[]>;

  /** 设置状态 */
  setState(key: string, value: unknown): void;

  /** 获取状态 */
  getState(key: string, defaultValue?: unknown): unknown;

  /** 注册服务 */
  registerService(name: string, service: unknown): void;

  /** 获取服务 */
  getService(name: string): unknown;

  /** 监听事件 */
  on(event: string, handler: Function): void;

  /** 触发事件 */
  emit(event: string, data: unknown): Promise<unknown[]>;

  /** 获取应用 */
  getApp(): unknown;

  /** 获取配置 */
  getConfig(): Record<string, unknown>;

  /** 更新配置 */
  updateConfig(updates: Record<string, unknown>): void;

  /** 获取日志器 */
  getLogger(): unknown;
}

/**
 * 创建插件上下文
 */
export function createPluginContext(options?: Partial<PluginContext>): PluginContext;

/**
 * 创建插件管理器
 */
export function createPluginManager(options?: PluginManagerOptions): PluginManager;
