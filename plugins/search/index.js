/**
 * 搜索插件
 * 支持多平台搜索
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class SearchPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.commands = {
      '/search': {
        handler: this.handleSearch.bind(this),
        description: '搜索内容',
        usage: '/search <query>',
        category: 'utility'
      },
      '/google': {
        handler: this.handleGoogle.bind(this),
        description: 'Google 搜索',
        usage: '/google <query>',
        category: 'utility'
      },
      '/bing': {
        handler: this.handleBing.bind(this),
        description: 'Bing 搜索',
        usage: '/bing <query>',
        category: 'utility'
      },
      '/duckduckgo': {
        handler: this.handleDuckDuckGo.bind(this),
        description: 'DuckDuckGo 搜索',
        usage: '/duckduckgo <query>',
        category: 'utility'
      },
      '/github': {
        handler: this.handleGitHub.bind(this),
        description: 'GitHub 搜索',
        usage: '/github <query>',
        category: 'utility'
      },
      '/stack': {
        handler: this.handleStackOverflow.bind(this),
        description: 'Stack Overflow 搜索',
        usage: '/stack <query>',
        category: 'utility'
      }
    };
  }

  async onEnable(context) {
    this.context.logger.info('搜索插件已启用');
  }

  async onDisable(context) {
    this.context.logger.info('搜索插件已禁用');
  }

  /**
   * 处理通用搜索
   */
  async handleSearch(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入搜索内容' };
    }

    const query = args.trim();
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    return {
      success: true,
      message: `🔍 搜索: ${query}\n\n🌐 打开链接:\n${url}`
    };
  }

  /**
   * 处理 Google 搜索
   */
  async handleGoogle(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入搜索内容' };
    }

    const query = args.trim();
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    try {
      // 尝试使用 DuckDuckGo API 获取搜索结果摘要
      const results = await this.getSearchResults(query);

      let message = `🔍 Google 搜索: ${query}\n\n`;

      if (results.length > 0) {
        message += `📋 搜索结果:\n\n`;
        results.slice(0, 5).forEach((result, i) => {
          message += `${i + 1}. ${result.title}\n   ${result.url}\n   ${result.snippet}\n\n`;
        });
        message += `🌐 完整搜索: ${url}`;
      } else {
        message += `🌐 打开链接:\n${url}`;
      }

      return {
        success: true,
        message
      };
    } catch (error) {
      return {
        success: true,
        message: `🔍 Google 搜索: ${query}\n\n🌐 打开链接:\n${url}`
      };
    }
  }

  /**
   * 处理 Bing 搜索
   */
  async handleBing(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入搜索内容' };
    }

    const query = args.trim();
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

    return {
      success: true,
      message: `🔍 Bing 搜索: ${query}\n\n🌐 打开链接:\n${url}`
    };
  }

  /**
   * 处理 DuckDuckGo 搜索
   */
  async handleDuckDuckGo(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入搜索内容' };
    }

    const query = args.trim();
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;

    try {
      const results = await this.getSearchResults(query);

      let message = `🦆 DuckDuckGo 搜索: ${query}\n\n`;

      if (results.length > 0) {
        message += `📋 搜索结果:\n\n`;
        results.slice(0, 5).forEach((result, i) => {
          message += `${i + 1}. ${result.title}\n   ${result.url}\n   ${result.snippet}\n\n`;
        });
      }

      message += `🌐 完整搜索: ${url}`;

      return {
        success: true,
        message
      };
    } catch (error) {
      return {
        success: true,
        message: `🦆 DuckDuckGo 搜索: ${query}\n\n🌐 打开链接:\n${url}`
      };
    }
  }

  /**
   * 处理 GitHub 搜索
   */
  async handleGitHub(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入搜索内容' };
    }

    const query = args.trim();
    const url = `https://github.com/search?q=${encodeURIComponent(query)}`;

    try {
      const results = await this.getGitHubResults(query);

      let message = `🐱 GitHub 搜索: ${query}\n\n`;

      if (results.length > 0) {
        message += `📋 搜索结果:\n\n`;
        results.slice(0, 5).forEach((result, i) => {
          message += `${i + 1}. ${result.title}\n   ⭐ ${result.stars} 🍴 ${result.forks}\n   ${result.url}\n   ${result.description}\n\n`;
        });
      }

      message += `🌐 完整搜索: ${url}`;

      return {
        success: true,
        message
      };
    } catch (error) {
      return {
        success: true,
        message: `🐱 GitHub 搜索: ${query}\n\n🌐 打开链接:\n${url}`
      };
    }
  }

  /**
   * 处理 Stack Overflow 搜索
   */
  async handleStackOverflow(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入搜索内容' };
    }

    const query = args.trim();
    const url = `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`;

    return {
      success: true,
      message: `📚 Stack Overflow 搜索: ${query}\n\n🌐 打开链接:\n${url}`
    };
  }

  /**
   * 获取搜索结果（使用 DuckDuckGo API）
   */
  async getSearchResults(query) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=0`;
      const response = await fetch(url);
      const data = await response.json();

      const results = [];

      if (data.RelatedTopics) {
        data.RelatedTopics.forEach(topic => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text,
              url: topic.FirstURL,
              snippet: topic.Text.substring(0, 200)
            });
          }
        });
      }

      return results.slice(0, 10);
    } catch (error) {
      console.error('获取搜索结果失败:', error);
      return [];
    }
  }

  /**
   * 获取 GitHub 搜索结果
   */
  async getGitHubResults(query) {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('GitHub API 请求失败');
      }

      const data = await response.json();

      return data.items.map(repo => ({
        title: repo.full_name,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        description: repo.description || '无描述'
      }));
    } catch (error) {
      console.error('获取 GitHub 结果失败:', error);
      return [];
    }
  }
}
