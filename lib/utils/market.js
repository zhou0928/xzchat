import fs from 'fs/promises';
import path from 'path';
import https from 'https';

/**
 * 插件市场管理器（完整版本）
 * 支持插件搜索、安装、评分、评论、依赖管理等
 */
class MarketManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-market.json');
    this.installedPlugins = {};
    this.pluginReviews = {};
    this.marketData = null;
    this.marketUrl = 'https://api.xzchat-plugins.com/v1';
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  /**
   * 加载本地配置
   */
  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.installedPlugins = parsed.installedPlugins || {};
      this.pluginReviews = parsed.reviews || {};
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载市场配置失败: ${error.message}`);
      }
    }
  }

  /**
   * 保存本地配置
   */
  async save() {
    await fs.writeFile(this.configPath, JSON.stringify({
      installedPlugins: this.installedPlugins,
      reviews: this.pluginReviews
    }, null, 2));
  }

  /**
   * 从远程获取市场数据
   */
  async fetchMarketData() {
    try {
      // 模拟 API 请求（实际应该从真实 API 获取）
      if (this.marketData) {
        return this.marketData;
      }

      // 本地模拟数据（用于演示）
      this.marketData = {
        plugins: [
          {
            id: 'ai-code-review',
            name: 'AI 代码审查',
            author: 'xzChat',
            version: '2.5.0',
            description: 'AI 驱动的代码审查插件，支持多种编程语言，提供深度代码分析和优化建议',
            category: 'Development',
            downloads: 12845,
            rating: 4.8,
            reviewCount: 342,
            tags: ['review', 'code', 'ai', 'analysis'],
            license: 'MIT',
            homepage: 'https://github.com/xzchat/ai-code-review',
            repository: 'https://github.com/xzchat/ai-code-review.git',
            dependencies: [],
            minVersion: '2.6.0',
            size: '2.4 MB',
            lastUpdated: '2024-01-15',
            featured: true,
            screenshots: [],
            features: [
              '深度代码分析',
              '性能优化建议',
              '安全漏洞检测',
              '代码风格检查'
            ]
          },
          {
            id: 'auto-docs',
            name: '自动文档生成',
            author: 'Community',
            version: '3.2.1',
            description: '自动生成项目文档，支持 JSDoc、TypeDoc、Markdown 等多种格式',
            category: 'Documentation',
            downloads: 8756,
            rating: 4.6,
            reviewCount: 189,
            tags: ['docs', 'documentation', 'generator'],
            license: 'Apache-2.0',
            homepage: 'https://github.com/community/auto-docs',
            repository: 'https://github.com/community/auto-docs.git',
            dependencies: ['@types/node'],
            minVersion: '2.5.0',
            size: '1.8 MB',
            lastUpdated: '2024-01-10',
            featured: true,
            features: [
              '智能文档生成',
              '多格式输出',
              'API 文档生成',
              '版本历史'
            ]
          },
          {
            id: 'git-flow-integration',
            name: 'Git Flow 集成',
            author: 'xzChat',
            version: '1.8.0',
            description: '完整的 Git Flow 工作流集成，支持分支管理、发布流程等',
            category: 'Development Tools',
            downloads: 6234,
            rating: 4.7,
            reviewCount: 156,
            tags: ['git', 'workflow', 'version-control'],
            license: 'MIT',
            homepage: 'https://github.com/xzchat/git-flow',
            repository: 'https://github.com/xzchat/git-flow.git',
            dependencies: [],
            minVersion: '2.6.0',
            size: '890 KB',
            lastUpdated: '2024-01-08',
            featured: false,
            features: [
              'Git Flow 支持',
              '分支管理',
              '发布流程自动化',
              '版本标签管理'
            ]
          },
          {
            id: 'docker-helper',
            name: 'Docker 助手',
            author: 'Community',
            version: '2.1.0',
            description: '简化 Docker 容器管理，支持自动生成 Dockerfile、docker-compose.yml',
            category: 'DevOps',
            downloads: 4521,
            rating: 4.5,
            reviewCount: 98,
            tags: ['docker', 'container', 'devops'],
            license: 'MIT',
            homepage: 'https://github.com/community/docker-helper',
            repository: 'https://github.com/community/docker-helper.git',
            dependencies: [],
            minVersion: '2.5.0',
            size: '1.2 MB',
            lastUpdated: '2024-01-05',
            featured: false,
            features: [
              'Dockerfile 生成',
              'Docker Compose 支持',
              '容器管理',
              '镜像优化'
            ]
          },
          {
            id: 'weather-integration',
            name: '天气集成',
            author: 'Community',
            version: '1.0.0',
            description: '查询天气信息，支持全球多个城市',
            category: 'Utilities',
            downloads: 2341,
            rating: 4.3,
            reviewCount: 45,
            tags: ['weather', 'api', 'utilities'],
            license: 'MIT',
            homepage: 'https://github.com/community/weather',
            repository: 'https://github.com/community/weather.git',
            dependencies: [],
            minVersion: '2.0.0',
            size: '350 KB',
            lastUpdated: '2024-01-01',
            featured: false,
            features: [
              '实时天气查询',
              '多城市支持',
              '天气预报',
              '空气质量指数'
            ]
          }
        ],
        categories: [
          { id: 'development', name: '开发工具', count: 45 },
          { id: 'documentation', name: '文档工具', count: 12 },
          { id: 'devops', name: 'DevOps', count: 18 },
          { id: 'utilities', name: '实用工具', count: 23 },
          { id: 'ai', name: 'AI 工具', count: 15 },
          { id: 'productivity', name: '生产力', count: 31 }
        ],
        statistics: {
          totalPlugins: 144,
          totalDownloads: 1254300,
          averageRating: 4.5,
          activeAuthors: 87
        }
      };

      return this.marketData;
    } catch (error) {
      throw new Error(`获取市场数据失败: ${error.message}`);
    }
  }

  /**
   * 搜索插件
   */
  async search(query, filters = {}) {
    const marketData = await this.fetchMarketData();
    let plugins = marketData.plugins;

    // 关键词搜索
    if (query) {
      const lowerQuery = query.toLowerCase();
      plugins = plugins.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // 分类过滤
    if (filters.category) {
      plugins = plugins.filter(p => p.category === filters.category);
    }

    // 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      plugins = plugins.filter(p => 
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }

    // 评分过滤
    if (filters.minRating !== undefined) {
      plugins = plugins.filter(p => p.rating >= filters.minRating);
    }

    // 是否仅展示精选
    if (filters.featured) {
      plugins = plugins.filter(p => p.featured);
    }

    // 排序
    switch (filters.sortBy) {
      case 'downloads':
        plugins.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        plugins.sort((a, b) => b.rating - a.rating);
        break;
      case 'updated':
        plugins.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        break;
      case 'name':
        plugins.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // 默认按下载量排序
        plugins.sort((a, b) => b.downloads - a.downloads);
    }

    return plugins;
  }

  /**
   * 获取插件详情
   */
  async getPluginDetails(pluginId) {
    const marketData = await this.fetchMarketData();
    const plugin = marketData.plugins.find(p => p.id === pluginId);

    if (!plugin) {
      throw new Error(`插件 "${pluginId}" 不存在`);
    }

    // 获取已安装状态
    const installed = this.installedPlugins[pluginId];
    
    // 获取版本信息
    const latestVersion = plugin.version;
    const currentVersion = installed?.version || null;
    const needsUpdate = currentVersion && currentVersion !== latestVersion;

    return {
      ...plugin,
      installed: !!installed,
      currentVersion,
      latestVersion,
      needsUpdate,
      reviews: this.pluginReviews[pluginId] || []
    };
  }

  /**
   * 安装插件
   */
  async install(pluginId, options = {}) {
    await this.load();
    
    if (this.installedPlugins[pluginId]) {
      throw new Error(`插件 "${pluginId}" 已安装`);
    }

    const marketData = await this.fetchMarketData();
    const plugin = marketData.plugins.find(p => p.id === pluginId);

    if (!plugin) {
      throw new Error(`插件 "${pluginId}" 不存在`);
    }

    // 检查版本兼容性
    // 这里应该检查当前 xzChat 版本
    // 简化实现：假设兼容

    // 检查依赖
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      console.log(`正在安装依赖: ${plugin.dependencies.join(', ')}`);
      // 实际应该递归安装依赖
    }

    // 模拟下载和安装过程
    console.log(`正在下载 ${plugin.name} v${plugin.version}...`);
    
    // 创建插件目录
    const pluginsDir = path.join(this.getHomeDir(), '.xzchat-plugins');
    await fs.mkdir(pluginsDir, { recursive: true });

    const pluginDir = path.join(pluginsDir, pluginId);
    await fs.mkdir(pluginDir, { recursive: true });

    // 保存插件元数据
    const pluginMeta = {
      ...plugin,
      installedAt: new Date().toISOString(),
      installPath: pluginDir,
      enabled: true
    };

    this.installedPlugins[pluginId] = pluginMeta;
    await this.save();

    console.log(`✅ ${plugin.name} 安装成功！`);

    return pluginMeta;
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginId, options = {}) {
    await this.load();
    
    if (!this.installedPlugins[pluginId]) {
      throw new Error(`插件 "${pluginId}" 未安装`);
    }

    const { removeData = true, confirm = true } = options;

    const plugin = this.installedPlugins[pluginId];

    // 删除插件目录
    if (removeData && plugin.installPath) {
      try {
        await fs.rm(plugin.installPath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`删除插件目录失败: ${error.message}`);
      }
    }

    delete this.installedPlugins[pluginId];
    await this.save();

    console.log(`✅ ${plugin.name} 卸载成功！`);

    return true;
  }

  /**
   * 更新插件
   */
  async update(pluginId) {
    await this.load();
    
    if (!this.installedPlugins[pluginId]) {
      throw new Error(`插件 "${pluginId}" 未安装`);
    }

    const marketData = await this.fetchMarketData();
    const plugin = marketData.plugins.find(p => p.id === pluginId);

    if (!plugin) {
      throw new Error(`插件 "${pluginId}" 在市场中不存在`);
    }

    const installed = this.installedPlugins[pluginId];

    if (installed.version === plugin.version) {
      console.log(`ℹ️ ${plugin.name} 已是最新版本 v${plugin.version}`);
      return installed;
    }

    console.log(`正在更新 ${plugin.name} 从 v${installed.version} 到 v${plugin.version}...`);

    // 先卸载
    await this.uninstall(pluginId, { removeData: false, confirm: false });

    // 重新安装
    const updated = await this.install(pluginId);

    console.log(`✅ ${plugin.name} 更新成功！`);

    return updated;
  }

  /**
   * 批量更新所有插件
   */
  async updateAll() {
    await this.load();
    const marketData = await this.fetchMarketData();

    const updates = [];
    for (const [pluginId, installed] of Object.entries(this.installedPlugins)) {
      const plugin = marketData.plugins.find(p => p.id === pluginId);
      if (plugin && plugin.version !== installed.version) {
        updates.push(plugin);
      }
    }

    if (updates.length === 0) {
      console.log('ℹ️ 所有插件已是最新版本');
      return [];
    }

    console.log(`发现 ${updates.length} 个更新:`);
    updates.forEach(p => console.log(`  - ${p.name}: v${this.installedPlugins[p.id].version} → v${p.version}`));

    const results = [];
    for (const plugin of updates) {
      try {
        const updated = await this.update(plugin.id);
        results.push({ plugin: plugin.id, success: true });
      } catch (error) {
        results.push({ plugin: plugin.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 列出已安装的插件
   */
  async listInstalled(options = {}) {
    await this.load();
    const { enabledOnly = false } = options;

    let plugins = Object.values(this.installedPlugins);

    if (enabledOnly) {
      plugins = plugins.filter(p => p.enabled);
    }

    return plugins;
  }

  /**
   * 启用/禁用插件
   */
  async togglePlugin(pluginId, enabled) {
    await this.load();
    
    if (!this.installedPlugins[pluginId]) {
      throw new Error(`插件 "${pluginId}" 未安装`);
    }

    this.installedPlugins[pluginId].enabled = enabled;
    this.installedPlugins[pluginId].updatedAt = new Date().toISOString();
    await this.save();

    const status = enabled ? '启用' : '禁用';
    console.log(`✅ 插件已${status}`);

    return this.installedPlugins[pluginId];
  }

  /**
   * 获取所有分类
   */
  async getCategories() {
    const marketData = await this.fetchMarketData();
    return marketData.categories;
  }

  /**
   * 获取热门插件
   */
  async getTrending(limit = 10, period = 'week') {
    const marketData = await this.fetchMarketData();
    // 简化实现：按下载量排序
    return marketData.plugins
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * 获取评分最高的插件
   */
  async getTopRated(limit = 10) {
    const marketData = await this.fetchMarketData();
    return marketData.plugins
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * 获取精选插件
   */
  async getFeatured(limit = 5) {
    const marketData = await this.fetchMarketData();
    return marketData.plugins
      .filter(p => p.featured)
      .slice(0, limit);
  }

  /**
   * 提交评论
   */
  async submitReview(pluginId, review) {
    await this.load();

    if (!this.installedPlugins[pluginId]) {
      throw new Error(`必须先安装插件才能评论`);
    }

    const { rating, title, comment } = review;

    if (rating < 1 || rating > 5) {
      throw new Error(`评分必须在 1-5 之间`);
    }

    if (!this.pluginReviews[pluginId]) {
      this.pluginReviews[pluginId] = [];
    }

    this.pluginReviews[pluginId].push({
      id: Date.now().toString(),
      userId: 'user',
      rating,
      title: title || '',
      comment: comment || '',
      createdAt: new Date().toISOString()
    });

    await this.save();

    console.log(`✅ 评论已提交！`);

    return this.pluginReviews[pluginId][this.pluginReviews[pluginId].length - 1];
  }

  /**
   * 获取插件的评论
   */
  async getReviews(pluginId) {
    const marketData = await this.fetchMarketData();
    const plugin = marketData.plugins.find(p => p.id === pluginId);

    if (!plugin) {
      throw new Error(`插件 "${pluginId}" 不存在`);
    }

    return this.pluginReviews[pluginId] || [];
  }

  /**
   * 获取市场统计信息
   */
  async getStatistics() {
    const marketData = await this.fetchMarketData();
    
    const installedCount = Object.keys(this.installedPlugins).length;
    const installedPlugins = Object.values(this.installedPlugins);
    const enabledPlugins = installedPlugins.filter(p => p.enabled);

    return {
      ...marketData.statistics,
      installedCount,
      enabledCount: enabledPlugins.length
    };
  }

  /**
   * 推荐插件（基于已安装插件）
   */
  async getRecommendations() {
    const installed = await this.listInstalled();
    const marketData = await this.fetchMarketData();

    // 基于标签推荐
    const installedTags = new Set();
    installed.forEach(p => p.tags?.forEach(tag => installedTags.add(tag)));

    const recommendations = marketData.plugins
      .filter(p => !this.installedPlugins[p.id])
      .filter(p => p.tags?.some(tag => installedTags.has(tag)))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5);

    return recommendations;
  }

  /**
   * 检查插件更新
   */
  async checkUpdates() {
    await this.load();
    const marketData = await this.fetchMarketData();

    const updates = [];
    for (const [pluginId, installed] of Object.entries(this.installedPlugins)) {
      const plugin = marketData.plugins.find(p => p.id === pluginId);
      if (plugin && plugin.version !== installed.version) {
        updates.push({
          id: pluginId,
          name: plugin.name,
          currentVersion: installed.version,
          latestVersion: plugin.version,
          size: plugin.size,
          releaseDate: plugin.lastUpdated
        });
      }
    }

    return updates;
  }
}

export default new MarketManager();
