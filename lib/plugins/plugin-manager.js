/**
 * 插件管理器
 * 提供插件的加载、卸载、管理和生命周期管理
 */

import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import { PluginDependencyManager } from './plugin-dependency-manager.js';
import { PluginMarketplace } from './plugin-marketplace.js';
import { PluginVersionManager } from './plugin-version-manager.js';
import { PluginPerformanceMonitor } from './plugin-performance-monitor.js';
import { PluginValidator } from './plugin-validator.js';
import { PluginCache, PluginLazyLoader } from './plugin-cache.js';
import {
  PluginLoadError,
  PluginValidationError,
  DependencyError,
  PluginVersionError,
  PluginAlreadyLoadedError,
  PluginNotFoundError
} from '../errors/plugin-errors.js';

/**
 * 插件状态枚举
 */
export const PluginStatus = {
  UNLOADED: 'unloaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  ERROR: 'error',
};

/**
 * 插件元数据
 */
export class PluginMetadata {
  constructor(options = {}) {
    this.name = options.name || '';
    this.version = options.version !== undefined ? options.version : '';
    this.description = options.description || '';
    this.author = options.author || '';
    this.license = options.license || 'MIT';
    this.main = options.main || 'index.js';
    this.dependencies = options.dependencies || {};
    this.peerDependencies = options.peerDependencies || {};
    this.keywords = options.keywords || [];
    this.category = options.category || 'general';
  }

  static fromJSON(json) {
    return new PluginMetadata(json);
  }

  toJSON() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      license: this.license,
      main: this.main,
      dependencies: this.dependencies,
      peerDependencies: this.peerDependencies,
      keywords: this.keywords,
      category: this.category,
    };
  }

  validate() {
    const errors = [];

    if (!this.name) errors.push('Plugin name is required');
    if (!this.version) errors.push('Plugin version is required');
    if (!this.main) errors.push('Plugin main file is required');

    // 验证版本格式
    if (this.version && !/^\d+\.\d+\.\d+/.test(this.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    return errors;
  }
}

/**
 * 插件类
 */
export class Plugin {
  constructor(metadata, pluginPath) {
    this.metadata = metadata;
    this.path = pluginPath;
    this.instance = null;
    this.status = PluginStatus.UNLOADED;
    this.hooks = new Map();
    this.commands = new Map();
    this.middlewares = [];
    this.context = null;
    this.error = null;
    this.enabledAt = null;
  }

  /**
   * 加载插件
   */
  async load(context) {
    if (this.status === PluginStatus.LOADED || this.status === PluginStatus.ENABLED) {
      logger.warn(`Plugin '${this.metadata.name}' is already loaded`);
      return true;
    }

    this.status = PluginStatus.LOADING;
    this.context = context;

    try {
      const mainFile = path.join(this.path, this.metadata.main);

      if (!fs.existsSync(mainFile)) {
        throw new Error(`Main file not found: ${mainFile}`);
      }

      // 动态导入插件模块
      const pluginModule = await import(`file://${mainFile}`);

      // 创建插件实例
      const PluginClass = pluginModule.default || pluginModule.Plugin;
      
      if (typeof PluginClass === 'function') {
        this.instance = new PluginClass(this.metadata, context);
      } else if (typeof pluginModule === 'object') {
        this.instance = pluginModule;
      } else {
        throw new Error('Invalid plugin format: must export a class or object');
      }

      // 验证插件接口
      this._validateInstance();

      // 注册钩子
      if (this.instance.hooks) {
        for (const [event, handler] of Object.entries(this.instance.hooks)) {
          this.registerHook(event, handler);
        }
      }

      // 注册命令
      if (this.instance.commands) {
        for (const [name, command] of Object.entries(this.instance.commands)) {
          this.registerCommand(name, command);
        }
      }

      // 注册中间件
      if (this.instance.middleware) {
        this.registerMiddleware(this.instance.middleware);
      }

      this.status = PluginStatus.LOADED;
      logger.info(`Plugin '${this.metadata.name}' loaded successfully`);
      return true;

    } catch (error) {
      this.status = PluginStatus.ERROR;
      this.error = error;
      logger.error(`Failed to load plugin '${this.metadata.name}':`, error);
      throw error;
    }
  }

  /**
   * 启用插件
   */
  async enable() {
    if (this.status === PluginStatus.ENABLED) {
      logger.warn(`Plugin '${this.metadata.name}' is already enabled`);
      return true;
    }

    if (this.status === PluginStatus.ERROR) {
      logger.error(`Cannot enable plugin '${this.metadata.name}' in error state`);
      return false;
    }

    try {
      // 调用插件的 enable 钩子
      if (this.instance.onEnable && typeof this.instance.onEnable === 'function') {
        await this.instance.onEnable(this.context);
      }

      this.status = PluginStatus.ENABLED;
      this.enabledAt = new Date();
      logger.info(`Plugin '${this.metadata.name}' enabled`);
      return true;

    } catch (error) {
      this.status = PluginStatus.ERROR;
      this.error = error;
      logger.error(`Failed to enable plugin '${this.metadata.name}':`, error);
      return false;
    }
  }

  /**
   * 禁用插件
   */
  async disable() {
    if (this.status !== PluginStatus.ENABLED) {
      logger.warn(`Plugin '${this.metadata.name}' is not enabled`);
      return true;
    }

    try {
      // 调用插件的 disable 钩子
      if (this.instance.onDisable && typeof this.instance.onDisable === 'function') {
        await this.instance.onDisable(this.context);
      }

      this.status = PluginStatus.DISABLED;
      this.enabledAt = null;
      logger.info(`Plugin '${this.metadata.name}' disabled`);
      return true;

    } catch (error) {
      this.status = PluginStatus.ERROR;
      this.error = error;
      logger.error(`Failed to disable plugin '${this.metadata.name}':`, error);
      return false;
    }
  }

  /**
   * 卸载插件
   */
  async unload() {
    if (this.status === PluginStatus.UNLOADED) {
      return true;
    }

    try {
      // 如果插件已启用,先禁用
      if (this.status === PluginStatus.ENABLED) {
        await this.disable();
      }

      // 调用插件的 unload 钩子
      if (this.instance.onUnload && typeof this.instance.onUnload === 'function') {
        await this.instance.onUnload(this.context);
      }

      // 清理
      this.hooks.clear();
      this.commands.clear();
      this.middlewares = [];
      this.instance = null;
      this.status = PluginStatus.UNLOADED;

      logger.info(`Plugin '${this.metadata.name}' unloaded`);
      return true;

    } catch (error) {
      this.status = PluginStatus.ERROR;
      this.error = error;
      logger.error(`Failed to unload plugin '${this.metadata.name}':`, error);
      return false;
    }
  }

  /**
   * 注册钩子
   */
  registerHook(event, handler) {
    // 支持 { handler, priority } 格式
    const hookData = typeof handler === 'object' && handler.handler ? handler : { handler };
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(hookData);
  }

  /**
   * 注册命令
   */
  registerCommand(name, command) {
    this.commands.set(name, command);
  }

  /**
   * 注册中间件
   */
  registerMiddleware(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * 验证实例接口
   */
  _validateInstance() {
    if (!this.instance) {
      throw new Error('Plugin instance is null');
    }

    // 检查必需方法
    const requiredMethods = ['activate', 'deactivate'];
    for (const method of requiredMethods) {
      if (typeof this.instance[method] === 'undefined') {
        // 可选方法,不强制要求
      }
    }
  }

  /**
   * 获取插件信息
   */
  getInfo() {
    return {
      name: this.metadata.name,
      version: this.metadata.version,
      description: this.metadata.description,
      author: this.metadata.author,
      status: this.status,
      enabledAt: this.enabledAt,
      error: this.error ? this.error.message : null,
    };
  }
}

/**
 * 插件管理器类
 */
export class PluginManager {
  constructor(options = {}) {
    this.plugins = new Map();
    this.pluginPaths = options.pluginPaths || [];
    this.context = options.context || {};
    this.hooks = new Map();
    this.autoLoad = options.autoLoad !== false;
    this.loadOrder = [];
    this.enableValidation = options.enableValidation !== false;
    this.enablePerformanceMonitoring = options.enablePerformanceMonitoring !== false;
    this.enableCache = options.enableCache !== false;

    // 初始化子系统
    this.dependencyManager = new PluginDependencyManager(this);
    this.marketplace = new PluginMarketplace(this);
    this.versionManager = new PluginVersionManager(this);
    this.performanceMonitor = new PluginPerformanceMonitor(this);
    this.validator = new PluginValidator();

    // 初始化缓存系统
    this.cache = new PluginCache({
      maxSize: options.cacheSize || 100,
      defaultTTL: options.cacheTTL || 3600000,
      enableMemoryCache: options.enableMemoryCache !== false,
      enableDiskCache: options.enableDiskCache !== false
    });

    // 初始化懒加载器
    this.lazyLoader = new PluginLazyLoader(this);
  }

  /**
   * 添加插件路径
   */
  addPluginPath(pluginPath) {
    if (!this.pluginPaths.includes(pluginPath)) {
      this.pluginPaths.push(pluginPath);
      logger.debug(`Added plugin path: ${pluginPath}`);
    }
  }

  /**
   * 扫描插件目录
   */
  async scanPlugins() {
    const discovered = [];

    for (const pluginPath of this.pluginPaths) {
      try {
        const entries = fs.readdirSync(pluginPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const manifestPath = path.join(pluginPath, entry.name, 'package.json');

            if (fs.existsSync(manifestPath)) {
              try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                const metadata = new PluginMetadata({
                  ...manifest,
                  name: manifest.name || entry.name,
                });

                const errors = metadata.validate();
                if (errors.length > 0) {
                  logger.warn(`Invalid plugin manifest for '${entry.name}':`, errors.join(', '));
                  continue;
                }

                discovered.push({
                  metadata,
                  path: path.join(pluginPath, entry.name),
                });
              } catch (error) {
                logger.error(`Failed to load manifest for '${entry.name}':`, error);
              }
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to scan plugin path '${pluginPath}':`, error);
      }
    }

    logger.info(`Discovered ${discovered.length} plugins`);
    return discovered;
  }

  /**
   * 加载所有插件
   */
  async loadAll() {
    const discovered = await this.scanPlugins();

    for (const pluginInfo of discovered) {
      try {
        await this.loadPlugin(pluginInfo.metadata.name, pluginInfo.path, pluginInfo.metadata);
      } catch (error) {
        logger.error(`Failed to load plugin '${pluginInfo.metadata.name}':`, error);
      }
    }

    return this.plugins.size;
  }

  /**
   * 加载单个插件
   */
  async loadPlugin(name, pluginPath, metadata) {
    if (this.plugins.has(name)) {
      throw new PluginAlreadyLoadedError(name);
    }

    // 验证插件
    if (this.enableValidation) {
      const validation = this.validator.validate({ metadata, path: pluginPath });
      if (!validation.isValid) {
        throw new PluginValidationError(name, validation.errors);
      }
    }

    const plugin = new Plugin(metadata, pluginPath);

    // 将插件添加到依赖图中
    if (metadata.dependencies) {
      this.dependencyManager.dependencyGraph.set(name, Object.keys(metadata.dependencies));
    }

    // 性能监控
    if (this.enablePerformanceMonitoring) {
      await this.performanceMonitor.monitorAsync(name, 'load', async () => {
        await plugin.load(this.context);
      });
    } else {
      await plugin.load(this.context);
    }

    this.plugins.set(name, plugin);
    this.loadOrder.push(name);

    return plugin;
  }

  /**
   * 按名称加载插件（从已扫描的插件中查找）
   * 便利方法，只需提供插件名称
   */
  async loadPluginByName(name) {
    if (this.plugins.has(name)) {
      throw new PluginAlreadyLoadedError(name);
    }

    // 扫描插件以获取路径和元数据
    const discovered = await this.scanPlugins();
    const pluginInfo = discovered.find(p => p.metadata.name === name);

    if (!pluginInfo) {
      throw new PluginNotFoundError(name);
    }

    return await this.loadPlugin(name, pluginInfo.path, pluginInfo.metadata);
  }

  /**
   * 启用插件
   */
  async enablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new PluginNotFoundError(name);
    }

    // 检查依赖是否满足
    if (plugin.metadata.dependencies && Object.keys(plugin.metadata.dependencies).length > 0) {
      const depCheck = this.dependencyManager.checkDependencies(name);
      if (!depCheck.satisfied) {
        throw new DependencyError(
          name,
          depCheck.missing,
          depCheck.unsatisfied
        );
      }
    }

    const result = await plugin.enable();
    if (result) {
      this._registerPluginHooks(plugin);
    }
    return result;
  }

  /**
   * 禁用插件
   */
  async disablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new PluginNotFoundError(name);
    }

    // 检查是否有其他插件依赖此插件
    const canUnload = this.dependencyManager.canSafelyUnload(name);
    if (!canUnload.canUnload) {
      throw new DependencyError(
        name,
        [],
        [],
        `Cannot disable: ${canUnload.dependents.length} plugin(s) depend on it`
      );
    }

    const result = await plugin.disable();
    if (result) {
      this._unregisterPluginHooks(plugin);
    }
    return result;
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new PluginNotFoundError(name);
    }

    // 检查是否有其他插件依赖此插件
    const canUnload = this.dependencyManager.canSafelyUnload(name);
    if (!canUnload.canUnload) {
      throw new DependencyError(
        name,
        [],
        [],
        `Cannot unload: ${canUnload.dependents.length} plugin(s) depend on it`
      );
    }

    const result = await plugin.unload();
    if (result) {
      this.plugins.delete(name);
      this.loadOrder = this.loadOrder.filter(n => n !== name);
      this.performanceMonitor.resetMetrics(name);
    }
    return result;
  }

  /**
   * 重新加载插件
   */
  async reloadPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new PluginNotFoundError(name);
    }

    // 创建备份
    await this.versionManager.createBackup(name);

    try {
      await this.unloadPlugin(name);
      await this.loadPlugin(name, plugin.path, plugin.metadata);
      await this.enablePlugin(name);

      return true;
    } catch (error) {
      // 发生错误时回滚
      await this.versionManager.restoreFromBackup(name);
      throw new PluginLoadError(name, `Failed to reload plugin: ${error.message}`);
    }
  }

  /**
   * 获取插件
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已启用的插件
   */
  getEnabledPlugins() {
    return Array.from(this.plugins.values()).filter(
      p => p.status === PluginStatus.ENABLED
    );
  }

  /**
   * 触发钩子
   */
  async emit(event, data) {
    const handlers = this.hooks.get(event) || [];

    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler(data, this.context);
        results.push(result);
      } catch (error) {
        logger.error(`Error in hook '${event}':`, error);
        results.push({ error });
      }
    }

    return results;
  }

  /**
   * 执行中间件链
   */
  async executeMiddleware(event, data) {
    const plugins = this.getEnabledPlugins();

    let result = data;
    for (const plugin of plugins) {
      for (const middleware of plugin.middlewares) {
        try {
          if (middleware.event === event || middleware.event === '*') {
            result = await middleware.handler(result, this.context);
          }
        } catch (error) {
          logger.error(`Error in middleware of plugin '${plugin.metadata.name}':`, error);
        }
      }
    }

    return result;
  }

  /**
   * 注册插件钩子到全局钩子
   */
  _registerPluginHooks(plugin) {
    for (const [event, handlers] of plugin.hooks) {
      if (!this.hooks.has(event)) {
        this.hooks.set(event, []);
      }
      this.hooks.get(event).push(...handlers);
    }
  }

  /**
   * 从全局钩子注销插件钩子
   */
  _unregisterPluginHooks(plugin) {
    for (const [event, handlers] of plugin.hooks) {
      const globalHandlers = this.hooks.get(event);
      if (globalHandlers) {
        // 移除所有属于该插件的处理器
        const filtered = globalHandlers.filter(h => !handlers.includes(h));
        if (filtered.length === 0) {
          this.hooks.delete(event);
        } else {
          this.hooks.set(event, filtered);
        }
      }
    }
  }

  /**
   * 获取插件列表
   */
  listPlugins() {
    return this.getAllPlugins().map(plugin => plugin.getInfo());
  }

  /**
   * 获取插件命令
   */
  getPluginCommands() {
    const commands = {};
    for (const plugin of this.getEnabledPlugins()) {
      for (const [name, command] of plugin.commands) {
        commands[name] = {
          ...command,
          plugin: plugin.metadata.name,
        };
      }
    }
    return commands;
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * 清理缓存
   */
  cleanupCache() {
    return this.cache.cleanup();
  }

  /**
   * 清空缓存
   */
  clearCache() {
    return this.cache.clear();
  }

  /**
   * 保存缓存到磁盘
   */
  async saveCache() {
    await this.cache.saveToDisk();
  }

  /**
   * 从磁盘加载缓存
   */
  async loadCache() {
    await this.cache.loadFromDisk();
  }

  /**
   * 预加载插件
   */
  async preloadPlugins(pluginNames) {
    return this.lazyLoader.preload(pluginNames);
  }
}

/**
 * 创建插件管理器实例
 */
export function createPluginManager(options) {
  return new PluginManager(options);
}

/**
 * 基础插件类
 */
export class BasePlugin {
  constructor(metadata, context = null) {
    this.metadata = metadata || null;
    this.context = context;
    this.hooks = new Map();
    this.commands = new Map();
  }

  onLoad() {}
  async onEnable(context = this.context) {
    if (context?.logger?.info) {
      const name = this.metadata?.name || this.constructor.name;
      context.logger.info(`Plugin enabled: ${name}`);
    }
  }
  async onDisable(context = this.context) {
    if (context?.logger?.info) {
      const name = this.metadata?.name || this.constructor.name;
      context.logger.info(`Plugin disabled: ${name}`);
    }
  }
  onUnload() {}

  registerHook(eventName, options) {
    if (!this.hooks.has(eventName)) {
      this.hooks.set(eventName, []);
    }
    this.hooks.get(eventName).push(options);
  }

  registerCommand(name, command) {
    this.commands.set(name, command);
  }

  getConfig() {
    const name = this.metadata?.name || this.constructor.name;
    return this.context?.config?.plugins?.[name] || {};
  }

  updateConfig(updates) {
    if (!this.context?.config?.plugins) {
      this.context.config.plugins = {};
    }
    const name = this.metadata?.name || this.constructor.name;
    if (!this.context.config.plugins[name]) {
      this.context.config.plugins[name] = {};
    }
    Object.assign(this.context.config.plugins[name], updates);
  }

  async saveConfig() {
    if (this.context?.saveConfig) {
      await this.context.saveConfig();
    }
  }
}

/**
 * 插件钩子系统
 */
export class PluginHooks {
  static INIT = 'plugin:init';
  static ENABLE = 'plugin:enable';
  static DISABLE = 'plugin:disable';
  static UNLOAD = 'plugin:unload';
  static LOAD = 'plugin:load';
  static CONFIG = 'plugin:config';
  static ERROR = 'error';
  static COMMAND = 'plugin:command';
  static MIDDLEWARE = 'plugin:middleware';
  static START = 'app:start';
  static STOP = 'app:stop';
  static MESSAGE_SEND = 'message:send';
  static MESSAGE_RECEIVED = 'message:received';
  static COMMAND_EXECUTE = 'command:execute';

  constructor() {
    this.hooks = new Map();
  }

  register(eventName, handler, priority = 10) {
    if (!this.hooks.has(eventName)) {
      this.hooks.set(eventName, []);
    }
    this.hooks.get(eventName).push({ handler, priority });
  }

  async execute(eventName, data) {
    const handlers = this.hooks.get(eventName) || [];
    const sorted = handlers.sort((a, b) => a.priority - b.priority);

    for (const { handler } of sorted) {
      const result = await handler(data);
      if (result !== undefined) {
        return result;
      }
    }
  }
}

/**
 * 创建插件上下文
 */
export function createPluginContext(options = {}) {
  const state = options.state || new Map();
  const handlers = new Map();

  return {
    app: options.app || null,
    logger: options.logger || {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    },
    config: options.config || {},
    state,
    services: new Map(),
    saveConfig: options.saveConfig || (() => Promise.resolve()),

    setState(key, value) {
      state.set(key, value);
    },

    getState(key) {
      return state.get(key);
    },

    hasState(key) {
      return state.has(key);
    },

    deleteState(key) {
      state.delete(key);
    },

    clearState() {
      state.clear();
    },

    registerService(name, service) {
      this.services.set(name, service);
    },

    getService(name) {
      return this.services.get(name);
    },

    async emit(eventName, data) {
      const eventHandlers = handlers.get(eventName) || [];
      const results = [];
      for (const handler of eventHandlers) {
        const result = await handler(data);
        results.push(result);
      }
      return results;
    },

    on(eventName, handler) {
      if (!handlers.has(eventName)) {
        handlers.set(eventName, []);
      }
      handlers.get(eventName).push(handler);
    },

    off(eventName, handler) {
      if (!handlers.has(eventName)) return;
      const eventHandlers = handlers.get(eventName);
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
      }
    }
  };
}

