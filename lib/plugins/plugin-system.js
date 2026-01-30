/**
 * 插件系统核心
 * 提供插件基类、装饰器和工具函数
 */

import { logger } from '../utils/logger.js';

/**
 * 插件基类
 * 所有插件都应该继承此类
 */
export class BasePlugin {
  constructor(metadata, context) {
    this.metadata = metadata;
    this.context = context;
    this._initialized = false;
  }

  /**
   * 初始化插件
   * 在插件加载时调用
   */
  async onInitialize(context) {
    logger.debug(`Plugin '${this.metadata.name}' initializing`);
    this._initialized = true;
  }

  /**
   * 启用插件
   */
  async onEnable(context) {
    logger.info(`Plugin '${this.metadata.name}' enabled`);
  }

  /**
   * 禁用插件
   */
  async onDisable(context) {
    logger.info(`Plugin '${this.metadata.name}' disabled`);
  }

  /**
   * 卸载插件
   */
  async onUnload(context) {
    logger.info(`Plugin '${this.metadata.name}' unloaded`);
  }

  /**
   * 获取插件配置
   */
  getConfig() {
    return this.context.config?.plugins?.[this.metadata.name] || {};
  }

  /**
   * 更新插件配置
   */
  updateConfig(newConfig) {
    if (!this.context.config) {
      this.context.config = { plugins: {} };
    }
    if (!this.context.config.plugins) {
      this.context.config.plugins = {};
    }
    this.context.config.plugins[this.metadata.name] = {
      ...this.getConfig(),
      ...newConfig,
    };
  }

  /**
   * 保存配置
   */
  async saveConfig() {
    if (this.context.saveConfig) {
      await this.context.saveConfig();
    }
  }
}

/**
 * 插件装饰器
 */
export const PluginDecorator = {
  /**
   * 定义命令
   */
  command(name, handler, options = {}) {
    return function(target, key, descriptor) {
      if (!target.commands) {
        target.commands = {};
      }
      target.commands[name] = {
        handler: descriptor.value || handler,
        description: options.description || '',
        usage: options.usage || '',
        category: options.category || 'general',
      };
      return descriptor;
    };
  },

  /**
   * 定义钩子
   */
  hook(event, priority = 10) {
    return function(target, key, descriptor) {
      if (!target.hooks) {
        target.hooks = {};
      }
      if (!target.hooks[event]) {
        target.hooks[event] = [];
      }
      target.hooks[event].push({
        handler: descriptor.value,
        priority,
      });
      return descriptor;
    };
  },

  /**
   * 定义中间件
   */
  middleware(event) {
    return function(target, key, descriptor) {
      if (!target.middleware) {
        target.middleware = [];
      }
      target.middleware.push({
        event,
        handler: descriptor.value,
      });
      return descriptor;
    };
  },
};

/**
 * 插件生命周期钩子
 */
export const PluginHooks = {
  // 插件生命周期
  INIT: 'plugin:init',
  ENABLE: 'plugin:enable',
  DISABLE: 'plugin:disable',
  UNLOAD: 'plugin:unload',

  // 应用生命周期
  START: 'app:start',
  STOP: 'app:stop',
  RESTART: 'app:restart',

  // 命令相关
  COMMAND_REGISTER: 'command:register',
  COMMAND_EXECUTE: 'command:execute',
  COMMAND_SUCCESS: 'command:success',
  COMMAND_ERROR: 'command:error',

  // 消息相关
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_PROCESSED: 'message:processed',

  // 配置相关
  CONFIG_LOAD: 'config:load',
  CONFIG_SAVE: 'config:save',
  CONFIG_CHANGE: 'config:change',

  // 其他
  ERROR: 'error',
  LOG: 'log',
};

/**
 * 插件上下文
 */
export class PluginContext {
  constructor(options = {}) {
    this.app = options.app || null;
    this.config = options.config || {};
    this.logger = options.logger || logger;
    this.state = new Map();
    this.services = {};
    this.events = new Map();
  }

  /**
   * 设置状态
   */
  setState(key, value) {
    this.state.set(key, value);
  }

  /**
   * 获取状态
   */
  getState(key, defaultValue) {
    return this.state.has(key) ? this.state.get(key) : defaultValue;
  }

  /**
   * 注册服务
   */
  registerService(name, service) {
    this.services[name] = service;
  }

  /**
   * 获取服务
   */
  getService(name) {
    return this.services[name];
  }

  /**
   * 监听事件
   */
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
  }

  /**
   * 触发事件
   */
  async emit(event, data) {
    const handlers = this.events.get(event) || [];
    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler(data);
        results.push(result);
      } catch (error) {
        this.logger.error(`Error in event '${event}':`, error);
      }
    }
    return results;
  }

  /**
   * 获取应用实例
   */
  getApp() {
    return this.app;
  }

  /**
   * 获取配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 获取日志器
   */
  getLogger() {
    return this.logger;
  }
}

/**
 * 创建插件上下文
 */
export function createPluginContext(options) {
  return new PluginContext(options);
}

/**
 * 插件验证工具
 */
export const PluginValidator = {
  /**
   * 验证插件元数据
   */
  validateMetadata(metadata) {
    const errors = [];

    if (!metadata.name) errors.push('name is required');
    if (!metadata.version) errors.push('version is required');
    if (!metadata.main) errors.push('main file is required');

    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
      errors.push('version must follow semantic versioning');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * 验证插件接口
   */
  validateInterface(plugin) {
    const requiredMethods = [];
    const optionalMethods = ['onInitialize', 'onEnable', 'onDisable', 'onUnload'];
    const hasRequired = requiredMethods.every(m => typeof plugin[m] === 'function');
    const hasOptional = optionalMethods.some(m => typeof plugin[m] === 'function');

    return {
      valid: hasRequired || hasOptional,
      hasRequired,
      hasOptional,
    };
  },

  /**
   * 验证插件依赖
   */
  validateDependencies(metadata, availablePlugins) {
    const errors = [];
    const warnings = [];

    for (const [dep, version] of Object.entries(metadata.dependencies || {})) {
      if (!availablePlugins.includes(dep)) {
        errors.push(`Missing dependency: ${dep}`);
      }
    }

    for (const [dep, version] of Object.entries(metadata.peerDependencies || {})) {
      if (!availablePlugins.includes(dep)) {
        warnings.push(`Optional dependency not found: ${dep}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },
};

/**
 * 插件打包工具
 */
export const PluginBuilder = {
  /**
   * 生成插件模板
   */
  generateTemplate(name, options = {}) {
    const metadata = {
      name,
      version: options.version || '1.0.0',
      description: options.description || `A xzChat plugin`,
      author: options.author || '',
      license: options.license || 'MIT',
      main: 'index.js',
      keywords: options.keywords || ['xzchat', 'plugin'],
      category: options.category || 'general',
    };

    const pluginCode = `
import { BasePlugin, PluginHooks } from './plugin-system.js';

export default class ${this._toCamelCase(name)}Plugin extends BasePlugin {
  async onEnable(context) {
    console.log('${name} plugin enabled');
  }

  async onDisable(context) {
    console.log('${name} plugin disabled');
  }

  // 可以在这里定义命令、钩子等
}
`.trim();

    const packageJson = JSON.stringify(metadata, null, 2);

    return {
      metadata,
      pluginCode,
      packageJson,
    };
  },

  /**
   * 转换为驼峰命名
   */
  _toCamelCase(str) {
    return str
      .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  },
};

/**
 * 默认导出
 */
export default {
  BasePlugin,
  PluginDecorator,
  PluginHooks,
  PluginContext,
  createPluginContext,
  PluginValidator,
  PluginBuilder,
};
