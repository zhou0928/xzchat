/**
 * 插件管理 API 路由
 */

import { PluginManager } from '../../lib/plugins/plugin-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pluginManager = null;

/**
 * 初始化插件管理器
 */
function getPluginManager() {
  if (!pluginManager) {
    const pluginsDir = path.join(__dirname, '../../plugins');
    pluginManager = new PluginManager(pluginsDir);
  }
  return pluginManager;
}

/**
 * 设置插件 API 路由
 */
export function setupPluginRoutes(app, io) {
  const manager = getPluginManager();

  /**
   * 获取所有插件列表
   */
  app.get('/api/plugins', async (req, res) => {
    try {
      const plugins = manager.getAllPlugins();
      res.json({
        success: true,
        plugins: plugins.map(p => ({
          id: p.metadata.name,
          name: p.metadata.name,
          version: p.metadata.version,
          description: p.metadata.description,
          author: p.metadata.author,
          category: p.metadata.category,
          status: p.status,
          enabledAt: p.enabledAt,
          commands: Array.from(p.commands.keys()),
          keywords: p.metadata.keywords,
          dependencies: p.metadata.dependencies,
          license: p.metadata.license
        }))
      });
    } catch (error) {
      console.error('获取插件列表失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 获取插件详情
   */
  app.get('/api/plugins/:id', async (req, res) => {
    try {
      const plugin = manager.getPlugin(req.params.id);

      if (!plugin) {
        return res.status(404).json({ success: false, error: '插件不存在' });
      }

      res.json({
        success: true,
        plugin: {
          id: plugin.metadata.name,
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          description: plugin.metadata.description,
          author: plugin.metadata.author,
          category: plugin.metadata.category,
          status: plugin.status,
          enabledAt: plugin.enabledAt,
          commands: Array.from(plugin.commands.entries()).map(([name, cmd]) => ({
            name,
            description: cmd.description,
            usage: cmd.usage,
            category: cmd.category
          })),
          hooks: Array.from(plugin.hooks.keys()),
          keywords: plugin.metadata.keywords,
          dependencies: plugin.metadata.dependencies,
          license: plugin.metadata.license
        }
      });
    } catch (error) {
      console.error('获取插件详情失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 扫描插件目录
   */
  app.post('/api/plugins/scan', async (req, res) => {
    try {
      await manager.scanPlugins();
      res.json({
        success: true,
        message: '扫描完成'
      });
    } catch (error) {
      console.error('扫描插件失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 加载插件
   */
  app.post('/api/plugins/:id/load', async (req, res) => {
    try {
      const context = { config: {}, logger: console };
      const success = await manager.loadPlugin(req.params.id);

      if (success) {
        // 广播插件加载事件
        io?.emit('plugin:loaded', { id: req.params.id });

        res.json({
          success: true,
          message: '插件加载成功'
        });
      } else {
        res.json({ success: false, message: '插件已加载' });
      }
    } catch (error) {
      console.error('加载插件失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 启用插件
   */
  app.post('/api/plugins/:id/enable', async (req, res) => {
    try {
      const context = { config: {}, logger: console };
      const success = await manager.enablePlugin(req.params.id, context);

      if (success) {
        // 广播插件启用事件
        io?.emit('plugin:enabled', { id: req.params.id });

        res.json({
          success: true,
          message: '插件启用成功'
        });
      } else {
        res.json({ success: false, message: '插件启用失败' });
      }
    } catch (error) {
      console.error('启用插件失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 禁用插件
   */
  app.post('/api/plugins/:id/disable', async (req, res) => {
    try {
      const success = await manager.disablePlugin(req.params.id);

      if (success) {
        // 广播插件禁用事件
        io?.emit('plugin:disabled', { id: req.params.id });

        res.json({
          success: true,
          message: '插件禁用成功'
        });
      } else {
        res.json({ success: false, message: '插件禁用失败' });
      }
    } catch (error) {
      console.error('禁用插件失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 卸载插件
   */
  app.post('/api/plugins/:id/unload', async (req, res) => {
    try {
      const success = await manager.unloadPlugin(req.params.id);

      if (success) {
        // 广播插件卸载事件
        io?.emit('plugin:unloaded', { id: req.params.id });

        res.json({
          success: true,
          message: '插件卸载成功'
        });
      } else {
        res.json({ success: false, message: '插件卸载失败' });
      }
    } catch (error) {
      console.error('卸载插件失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 重新加载插件
   */
  app.post('/api/plugins/:id/reload', async (req, res) => {
    try {
      await manager.unloadPlugin(req.params.id);
      const context = { config: {}, logger: console };
      await manager.loadPlugin(req.params.id);
      await manager.enablePlugin(req.params.id, context);

      // 广播插件重新加载事件
      io?.emit('plugin:reloaded', { id: req.params.id });

      res.json({
        success: true,
        message: '插件重新加载成功'
      });
    } catch (error) {
      console.error('重新加载插件失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 执行插件命令
   */
  app.post('/api/commands/:name', async (req, res) => {
    try {
      const { args } = req.body;

      // 执行插件命令
      let result = null;
      for (const plugin of manager.getAllPlugins()) {
        if (plugin.status !== 'enabled') continue;

        const command = plugin.commands.get(`/${req.params.name}`);
        if (command && command.handler) {
          try {
            result = await command.handler(args || '');

            // 广播命令执行事件
            io?.emit('command:executed', {
              plugin: plugin.metadata.name,
              command: `/${req.params.name}`,
              result
            });

            break;
          } catch (error) {
            throw new Error(`命令执行失败: ${error.message}`);
          }
        }
      }

      if (!result) {
        return res.status(404).json({ success: false, error: '命令不存在' });
      }

      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error('执行命令失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * 获取所有可用命令
   */
  app.get('/api/commands', async (req, res) => {
    try {
      const commands = [];

      for (const plugin of manager.getAllPlugins()) {
        if (plugin.status !== 'enabled') continue;

        for (const [name, cmd] of plugin.commands.entries()) {
          commands.push({
            name,
            description: cmd.description,
            usage: cmd.usage,
            category: cmd.category,
            plugin: plugin.metadata.name
          });
        }
      }

      res.json({
        success: true,
        commands
      });
    } catch (error) {
      console.error('获取命令列表失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
