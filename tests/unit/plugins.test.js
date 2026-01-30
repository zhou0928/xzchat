/**
 * 插件系统测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PluginManager,
  Plugin,
  PluginMetadata,
  PluginStatus,
  BasePlugin,
  PluginHooks,
  createPluginContext,
  createPluginManager,
} from '../../lib/plugins/plugin-manager.js';

describe('PluginMetadata', () => {
  it('should validate metadata', () => {
    const metadata = new PluginMetadata({
      name: 'test-plugin',
      version: '1.0.0',
      description: 'Test plugin',
      author: 'Test',
      main: 'index.js',
    });

    const errors = metadata.validate();
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid version', () => {
    const metadata = new PluginMetadata({
      name: 'test-plugin',
      version: 'invalid',
      main: 'index.js',
    });

    const errors = metadata.validate();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('version'))).toBe(true);
  });

  it('should detect missing required fields', () => {
    const metadata = new PluginMetadata({});

    const errors = metadata.validate();
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('Plugin', () => {
  let plugin;
  let metadata;
  let context;

  beforeEach(() => {
    metadata = new PluginMetadata({
      name: 'test-plugin',
      version: '1.0.0',
      description: 'Test plugin',
      main: 'index.js',
    });

    context = createPluginContext({
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    });

    plugin = new Plugin(metadata, '/fake/path');
  });

  it('should create plugin instance', () => {
    expect(plugin).toBeInstanceOf(Plugin);
    expect(plugin.metadata.name).toBe('test-plugin');
    expect(plugin.status).toBe(PluginStatus.UNLOADED);
  });

  it('should register hook', () => {
    const handler = vi.fn();
    plugin.registerHook('test:event', { handler, priority: 10 });

    expect(plugin.hooks.has('test:event')).toBe(true);
    expect(plugin.hooks.get('test:event')).toHaveLength(1);
  });

  it('should register command', () => {
    const command = {
      handler: vi.fn(),
      description: 'Test command',
      usage: '/test',
      category: 'test',
    };

    plugin.registerCommand('/test', command);
    expect(plugin.commands.has('/test')).toBe(true);
  });

  it('should register middleware', () => {
    const middleware = {
      event: 'message:send',
      handler: vi.fn(),
    };

    plugin.registerMiddleware(middleware);
    expect(plugin.middlewares).toHaveLength(1);
  });

  it('should get plugin info', () => {
    plugin.status = PluginStatus.ENABLED;
    plugin.enabledAt = new Date();

    const info = plugin.getInfo();
    expect(info.name).toBe('test-plugin');
    expect(info.status).toBe(PluginStatus.ENABLED);
    expect(info.enabledAt).toBeInstanceOf(Date);
  });
});

describe('PluginManager', () => {
  let manager;
  let context;

  beforeEach(() => {
    context = createPluginContext({
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    });

    manager = createPluginManager({
      context,
      autoLoad: false,
    });
  });

  it('should create manager instance', () => {
    expect(manager).toBeInstanceOf(PluginManager);
    expect(manager.plugins).toBeInstanceOf(Map);
  });

  it('should add plugin path', () => {
    manager.addPluginPath('/fake/path');
    expect(manager.pluginPaths).toContain('/fake/path');
  });

  it('should load plugin', async () => {
    const metadata = new PluginMetadata({
      name: 'test-plugin',
      version: '1.0.0',
      main: 'index.js',
    });

    const mockPlugin = {
      load: vi.fn().mockResolvedValue(true),
    };

    const plugin = await manager.loadPlugin('test-plugin', '/fake/path', metadata);
    expect(plugin).toBeDefined();
  });

  it('should get plugin', () => {
    manager.plugins.set('test', {});
    const plugin = manager.getPlugin('test');
    expect(plugin).toBeDefined();
  });

  it('should list plugins', () => {
    const plugin = {
      getInfo: () => ({
        name: 'test',
        version: '1.0.0',
        status: 'enabled',
      }),
    };

    manager.plugins.set('test', plugin);
    const list = manager.listPlugins();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('test');
  });

  it('should emit hook events', async () => {
    const handler = vi.fn().mockResolvedValue('result');
    manager.hooks.set('test:event', [handler]);

    const results = await manager.emit('test:event', { data: 'test' });
    expect(handler).toHaveBeenCalled();
    expect(results).toHaveLength(1);
  });
});

describe('BasePlugin', () => {
  let plugin;
  let metadata;
  let context;

  beforeEach(() => {
    metadata = new PluginMetadata({
      name: 'test-plugin',
      version: '1.0.0',
      description: 'Test plugin',
    });

    context = createPluginContext({
      config: { plugins: {} },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
      saveConfig: vi.fn(),
    });

    plugin = new BasePlugin(metadata, context);
  });

  it('should create base plugin', () => {
    expect(plugin).toBeInstanceOf(BasePlugin);
    expect(plugin.metadata.name).toBe('test-plugin');
  });

  it('should handle onEnable', async () => {
    await plugin.onEnable(context);
    expect(context.logger.info).toHaveBeenCalled();
  });

  it('should handle onDisable', async () => {
    await plugin.onDisable(context);
    expect(context.logger.info).toHaveBeenCalled();
  });

  it('should get empty config', () => {
    const config = plugin.getConfig();
    expect(config).toEqual({});
  });

  it('should update config', () => {
    plugin.updateConfig({ setting: 'value' });
    expect(context.config.plugins['test-plugin']).toEqual({
      setting: 'value',
    });
  });

  it('should save config', async () => {
    await plugin.saveConfig();
    expect(context.saveConfig).toHaveBeenCalled();
  });
});

describe('PluginHooks', () => {
  it('should define all hook types', () => {
    expect(PluginHooks.INIT).toBe('plugin:init');
    expect(PluginHooks.ENABLE).toBe('plugin:enable');
    expect(PluginHooks.DISABLE).toBe('plugin:disable');
    expect(PluginHooks.UNLOAD).toBe('plugin:unload');
    expect(PluginHooks.START).toBe('app:start');
    expect(PluginHooks.STOP).toBe('app:stop');
    expect(PluginHooks.MESSAGE_SEND).toBe('message:send');
    expect(PluginHooks.MESSAGE_RECEIVED).toBe('message:received');
    expect(PluginHooks.COMMAND_EXECUTE).toBe('command:execute');
    expect(PluginHooks.ERROR).toBe('error');
  });
});

describe('createPluginContext', () => {
  it('should create context with defaults', () => {
    const context = createPluginContext();
    expect(context).toBeDefined();
    expect(context.app).toBeNull();
    expect(context.config).toEqual({});
    expect(context.state).toBeInstanceOf(Map);
  });

  it('should create context with options', () => {
    const logger = { info: vi.fn() };
    const context = createPluginContext({ logger });
    expect(context.logger).toBe(logger);
  });

  it('should set and get state', () => {
    const context = createPluginContext();
    context.setState('key', 'value');
    expect(context.getState('key')).toBe('value');
  });

  it('should register and get service', () => {
    const context = createPluginContext();
    const service = { method: vi.fn() };
    context.registerService('test', service);
    expect(context.getService('test')).toBe(service);
  });

  it('should handle events', async () => {
    const context = createPluginContext();
    const handler = vi.fn().mockResolvedValue('result');
    
    context.on('test:event', handler);
    const results = await context.emit('test:event', { data: 'test' });
    
    expect(handler).toHaveBeenCalled();
    expect(results).toHaveLength(1);
  });
});
