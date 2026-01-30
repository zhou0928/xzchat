import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'ask-history.json');

/**
 * AI问答管理器类
 * 提供快速AI问答功能，支持历史记录、收藏和智能建议
 */
export class AskManager {
  constructor() {
    this.history = [];
    this.favorites = [];
    this.loadHistory();
  }

  /**
   * 加载历史记录
   */
  async loadHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      const saved = JSON.parse(data);
      this.history = saved.history || [];
      this.favorites = saved.favorites || [];
    } catch (error) {
      this.history = [];
      this.favorites = [];
      await this.saveHistory();
    }
  }

  /**
   * 保存历史记录
   */
  async saveHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        HISTORY_FILE,
        JSON.stringify({ history: this.history, favorites: this.favorites }, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`保存历史记录失败: ${error.message}`);
    }
  }

  /**
   * 添加问答记录
   */
  async addQuestion(question, answer) {
    const entry = {
      id: Date.now().toString(),
      question,
      answer,
      timestamp: new Date().toISOString(),
      tags: this.extractTags(question)
    };

    this.history.unshift(entry);
    // 保留最近100条记录
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    await this.saveHistory();
    return entry;
  }

  /**
   * 搜索历史记录
   */
  searchHistory(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.history.filter(entry =>
      entry.question.toLowerCase().includes(lowerKeyword) ||
      entry.answer?.toLowerCase().includes(lowerKeyword) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * 添加收藏
   */
  async addFavorite(id) {
    const entry = this.history.find(h => h.id === id);
    if (!entry) {
      return { success: false, error: '记录不存在' };
    }

    if (this.favorites.some(f => f.id === id)) {
      return { success: false, error: '已收藏' };
    }

    this.favorites.push(entry);
    await this.saveHistory();
    return { success: true };
  }

  /**
   * 移除收藏
   */
  async removeFavorite(id) {
    const index = this.favorites.findIndex(f => f.id === id);
    if (index === -1) {
      return { success: false, error: '未找到收藏' };
    }

    this.favorites.splice(index, 1);
    await this.saveHistory();
    return { success: true };
  }

  /**
   * 获取热门问题
   */
  getPopularQuestions(limit = 10) {
    const frequency = {};
    this.history.forEach(entry => {
      const q = entry.question;
      frequency[q] = (frequency[q] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([question, count]) => ({ question, count }));
  }

  /**
   * 获取建议问题
   */
  getSuggestions(prefix) {
    const lowerPrefix = prefix.toLowerCase();
    const suggestions = this.history
      .filter(h => h.question.toLowerCase().startsWith(lowerPrefix))
      .map(h => h.question);

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * 提取标签
   */
  extractTags(question) {
    const keywords = question.match(/\b\w+\b/g) || [];
    return keywords.filter(k => k.length > 2).slice(0, 5);
  }

  /**
   * 清除历史记录
   */
  async clearHistory() {
    this.history = [];
    await this.saveHistory();
    return { success: true };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalQuestions: this.history.length,
      totalFavorites: this.favorites.length,
      uniqueQuestions: new Set(this.history.map(h => h.question)).size,
      averageLength: Math.round(
        this.history.reduce((sum, h) => sum + h.question.length, 0) / (this.history.length || 1)
      )
    };
  }
}
