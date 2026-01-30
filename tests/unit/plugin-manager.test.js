/**
 * PluginManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginManager } from '../../lib/plugins/plugin-manager.js';
import { PluginValidator } from '../../lib/plugins/plugin-validator.js';
import path from 'path';

describe('PluginManager', () => {
  let pluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager({
      pluginPaths: [path.join(process.cwd(), 'plugins')],
      autoLoad: false
    });
  });

  afterEach(async () => {
    // 清理
    for (const [id] of pluginManager.plugins) {
      await pluginManager.unload(id);
    }
  });

  describe('插件加载', () => {
    it('应该成功加载插件', async () => {
      const plugin = await pluginManager.load('translator');
      expect(plugin).toBeDefined();
      expect(plugin.status).toBe('loaded');
    });

    it('加载不存在的插件应该抛出错误', async () => {
      await expect(pluginManager.load('nonexistent-plugin')).rejects.toThrow();
    });

    it('重复加载插件应该返回已有实例', async () => {
      const plugin1 = await pluginManager.load('translator');
      const plugin2 = await pluginManager.load('translator');
      expect(plugin1).toBe(plugin2);
    });
  });

  describe('插件启用/禁用', () => {
    it('应该成功启用插件', async () => {
      await pluginManager.load('translator');
      const result = await pluginManager.enable('translator');
      expect(result).toBe(true);
    });

    it('应该成功禁用插件', async () => {
      await pluginManager.load('translator');
      await pluginManager.enable('translator');
      const result = await pluginManager.disable('translator');
      expect(result).toBe(true);
    });

    it('启用未加载的插件应该失败', async () => {
      await expect(pluginManager.enable('translator')).rejects.toThrow();
    });
  });

  describe('命令执行', () => {
    it('应该成功执行插件命令', async () => {
      await pluginManager.load('translator');
      await pluginManager.enable('translator');

      const result = await pluginManager.executeCommand(
        '/translate',
        'en:zh Hello'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('执行不存在的命令应该返回错误', async () => {
      const result = await pluginManager.executeCommand('/nonexistent', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('插件扫描', () => {
    it('应该扫描到插件', async () => {
      const discovered = await pluginManager.scanPlugins();
      expect(Array.isArray(discovered)).toBe(true);
      expect(discovered.length).toBeGreaterThan(0);
    });

    it('扫描应该返回插件ID列表', async () => {
      const discovered = await pluginManager.scanPlugins();
      expect(discovered).toContain('translator');
    });
  });
});

describe('PluginValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new PluginValidator();
  });

  describe('元数据验证', () => {
    it('应该验证有效的元数据', () => {
      const metadata = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        license: 'MIT',
        main: 'index.js'
      };

      const plugin = { metadata, instance: null };
      const result = validator.validateMetadata(metadata);

      expect(result.errors.length).toBe(0);
    });

    it('应该检测缺少必需字段', () => {
      const metadata = { name: 'test' };
      const result = validator.validateMetadata(metadata);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
      expect(result.errors.some(e => e.field === 'main')).toBe(true);
    });

    it('应该检测无效的版本格式', () => {
      const metadata = {
        name: 'test-plugin',
        version: 'invalid',
        main: 'index.js'
      };

      const result = validator.validateMetadata(metadata);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
    });

    it('应该警告缺少推荐字段', () => {
      const metadata = {
        name: 'test-plugin',
        version: '1.0.0',
        main: 'index.js'
      };

      const result = validator.validateMetadata(metadata);
      expect(result.warnings.some(e => e.field === 'description')).toBe(true);
      expect(result.warnings.some(e => e.field === 'author')).toBe(true);
    });
  });

  describe('代码质量验证', () => {
    it('应该验证有效的命令', () => {
      const commands = {
        '/test': {
          handler: () => ({ message: 'test' }),
          description: 'Test command',
          usage: '/test',
          category: 'test'
        }
      };

      const plugin = { commands };
      const result = validator.validateCodeQuality(plugin);

      expect(result.errors.length).toBe(0);
    });

    it('应该检测缺少描述的命令', () => {
      const commands = {
        '/test': {
          handler: () => ({ message: 'test' }),
          usage: '/test'
        }
      };

      const plugin = { commands };
      const result = validator.validateCodeQuality(plugin);

      expect(result.warnings.some(w => w.field === 'commands./test.description')).toBe(true);
    });

    it('应该检测无效的命令名称', () => {
      const commands = {
        'test': {  // 缺少 / 前缀
          handler: () => ({ message: 'test' }),
          description: 'Test command'
        }
      };

      const plugin = { commands };
      const result = validator.validateCodeQuality(plugin);

      expect(result.errors.some(e => e.field === 'commands.test')).toBe(true);
    });
  });

  describe('安全性验证', () => {
    it('应该检测使用 eval 的代码', () => {
      const instance = {
        toString: () => 'function test() { eval("code"); }'
      };

      const plugin = { metadata: {}, instance };
      const result = validator.validateSecurity(plugin);

      expect(result.errors.some(e => e.message.includes('eval'))).toBe(true);
    });

    it('应该警告缺少权限声明', () => {
      const instance = {
        toString: () => 'function test() { fetch("url"); }'
      };

      const plugin = { metadata: {}, instance };
      const result = validator.validateSecurity(plugin);

      expect(result.warnings.some(w => w.message.includes('permissions'))).toBe(true);
    });
  });

  describe('性能验证', () => {
    it('应该警告使用同步文件操作', () => {
      const instance = {
        toString: () => 'function test() { fs.readFileSync("file"); }'
      };

      const plugin = { metadata: {}, instance };
      const result = validator.validatePerformance(plugin);

      expect(result.warnings.some(w => w.message.includes('synchronous'))).toBe(true);
    });
  });

  describe('完整验证', () => {
    it('应该计算验证分数', () => {
      const metadata = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        main: 'index.js'
      };

      const commands = {
        '/test': {
          handler: () => ({ message: 'test' }),
          description: 'Test command'
        }
      };

      const plugin = { metadata, instance: null, commands };
      const result = validator.validate(plugin);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('应该生成验证报告', () => {
      const metadata = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        main: 'index.js'
      };

      const plugin = { metadata, instance: null, commands: {} };
      const validationResult = validator.validate(plugin);
      const report = validator.generateReport(plugin, validationResult);

      expect(report).toContain('Plugin Validation Report');
      expect(report).toContain('test-plugin');
      expect(report).toContain('1.0.0');
    });
  });
});

describe('依赖管理', () => {
  it('应该检测循环依赖', () => {
    const pluginManager = new PluginManager();

    // 模拟循环依赖
    pluginManager.dependencyManager.dependencyGraph.set('plugin-a', ['plugin-b']);
    pluginManager.dependencyManager.dependencyGraph.set('plugin-b', ['plugin-c']);
    pluginManager.dependencyManager.dependencyGraph.set('plugin-c', ['plugin-a']);

    const result = pluginManager.dependencyManager.checkCircularDependencies();

    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toContain('plugin-a');
  });

  it('应该解析正确的加载顺序', () => {
    const pluginManager = new PluginManager();

    pluginManager.dependencyManager.dependencyGraph.set('plugin-c', ['plugin-b']);
    pluginManager.dependencyManager.dependencyGraph.set('plugin-b', ['plugin-a']);
    pluginManager.dependencyManager.dependencyGraph.set('plugin-a', []);

    const order = pluginManager.dependencyManager.resolveLoadOrder();

    expect(order).toContain('plugin-a');
    expect(order).toContain('plugin-b');
    expect(order).toContain('plugin-c');
    expect(order.indexOf('plugin-a')).toBeLessThan(order.indexOf('plugin-b'));
    expect(order.indexOf('plugin-b')).toBeLessThan(order.indexOf('plugin-c'));
  });
});
