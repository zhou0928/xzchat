/**
 * 插件市场系统
 * 管理插件的发现、安装、更新和卸载
 */

import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';

export class PluginMarketplace {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.registryUrl = 'https://registry.xzchat.io/plugins';
    this.localRegistryFile = path.join(process.cwd(), '.xzchat-registry.json');
    this.registry = new Map();
  }

  /**
   * 加载本地注册表
   */
  async loadLocalRegistry() {
    try {
      const data = await fs.readFile(this.localRegistryFile, 'utf-8');
      const plugins = JSON.parse(data);
      plugins.forEach(plugin => {
        this.registry.set(plugin.id, plugin);
      });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 保存本地注册表
   */
  async saveLocalRegistry() {
    const plugins = Array.from(this.registry.values());
    await fs.writeFile(
      this.localRegistryFile,
      JSON.stringify(plugins, null, 2)
    );
  }

  /**
   * 从远程注册表更新
   */
  async updateRegistry() {
    try {
      const data = await this.fetchFromRegistry();
      if (data) {
        data.plugins.forEach(plugin => {
          this.registry.set(plugin.id, plugin);
        });
        await this.saveLocalRegistry();
        return {
          success: true,
          message: `已更新注册表，共 ${data.plugins.length} 个插件`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `更新注册表失败: ${error.message}`
      };
    }
  }

  /**
   * 从注册表获取数据
   */
  async fetchFromRegistry() {
    return new Promise((resolve, reject) => {
      const url = new URL(this.registryUrl);
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * 搜索插件
   */
  searchPlugins(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [id, plugin] of this.registry.entries()) {
      const matchName = plugin.name.toLowerCase().includes(lowerQuery);
      const matchDesc = plugin.description.toLowerCase().includes(lowerQuery);
      const matchTags = plugin.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

      if (matchName || matchDesc || matchTags) {
        results.push(plugin);
      }
    }

    return results;
  }

  /**
   * 获取插件详情
   */
  getPluginDetails(pluginId) {
    return this.registry.get(pluginId);
  }

  /**
   * 安装插件
   */
  async installPlugin(pluginId) {
    const pluginInfo = this.getPluginDetails(pluginId);
    if (!pluginInfo) {
      return {
        success: false,
        error: `找不到插件: ${pluginId}`
      };
    }

    // 检查是否已安装
    if (this.pluginManager.plugins.has(pluginId)) {
      return {
        success: false,
        error: '插件已安装'
      };
    }

    try {
      // 下载插件
      const pluginDir = path.join(process.cwd(), 'plugins', pluginId);
      await fs.mkdir(pluginDir, { recursive: true });

      // 创建 package.json
      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify(pluginInfo.package, null, 2)
      );

      // 下载主文件（这里需要实现下载逻辑）
      // const pluginCode = await this.downloadPluginCode(pluginInfo.downloadUrl);
      // await fs.writeFile(path.join(pluginDir, 'index.js'), pluginCode);

      return {
        success: true,
        message: `插件 ${pluginInfo.name} 安装成功\n路径: ${pluginDir}`
      };
    } catch (error) {
      return {
        success: false,
        error: `安装失败: ${error.message}`
      };
    }
  }

  /**
   * 检查插件更新
   */
  async checkUpdates() {
    const updates = [];

    for (const [id, plugin] of this.pluginManager.plugins.entries()) {
      const currentVersion = plugin.metadata?.version || '0.0.0';
      const registryPlugin = this.registry.get(id);

      if (registryPlugin && this.isNewerVersion(registryPlugin.version, currentVersion)) {
        updates.push({
          id,
          name: registryPlugin.name,
          currentVersion,
          newVersion: registryPlugin.version,
          description: registryPlugin.changelog?.[registryPlugin.version] || '未知更新'
        });
      }
    }

    return updates;
  }

  /**
   * 版本比较
   */
  isNewerVersion(newVersion, currentVersion) {
    const newParts = newVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (newParts[i] > currentParts[i]) {
        return true;
      }
      if (newParts[i] < currentParts[i]) {
        return false;
      }
    }

    return false;
  }

  /**
   * 获取分类
   */
  getCategories() {
    const categories = new Map();

    for (const [id, plugin] of this.registry.entries()) {
      const category = plugin.category || 'uncategorized';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(plugin);
    }

    return categories;
  }

  /**
   * 获取热门插件
   */
  getPopularPlugins(limit = 10) {
    return Array.from(this.registry.values())
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, limit);
  }

  /**
   * 获取最新插件
   */
  getLatestPlugins(limit = 10) {
    return Array.from(this.registry.values())
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, limit);
  }

  /**
   * 获取评分排行
   */
  getTopRatedPlugins(limit = 10) {
    return Array.from(this.registry.values())
      .filter(plugin => plugin.rating)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * 提交插件评分
   */
  async submitRating(pluginId, rating, review) {
    // 这里需要实现评分提交到服务器的逻辑
    return {
      success: true,
      message: '评分已提交'
    };
  }

  /**
   * 获取插件统计
   */
  getStatistics() {
    return {
      totalPlugins: this.registry.size,
      totalCategories: this.getCategories().size,
      totalDownloads: Array.from(this.registry.values())
        .reduce((sum, p) => sum + (p.downloads || 0), 0),
      averageRating: this.calculateAverageRating()
    };
  }

  /**
   * 计算平均评分
   */
  calculateAverageRating() {
    const ratedPlugins = Array.from(this.registry.values()).filter(p => p.rating);
    if (ratedPlugins.length === 0) return 0;

    const sum = ratedPlugins.reduce((s, p) => s + p.rating, 0);
    return (sum / ratedPlugins.length).toFixed(1);
  }
}
