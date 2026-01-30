import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const PAGES_FILE = path.join(DATA_DIR, 'wiki-pages.json');
const HISTORY_FILE = path.join(DATA_DIR, 'wiki-history.json');

/**
 * 知识库管理器类
 */
export class WikiManager {
  constructor() {
    this.pages = [];
    this.history = [];
    this.loadData();
  }

  async loadData() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      const pagesData = await fs.readFile(PAGES_FILE, 'utf-8');
      this.pages = JSON.parse(pagesData);

      const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(historyData);
    } catch (error) {
      this.pages = [];
      this.history = [];
    }
  }

  async saveData() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(PAGES_FILE, JSON.stringify(this.pages, null, 2), 'utf-8');
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存数据失败:', error.message);
    }
  }

  listPages() {
    return this.pages.map(p => ({
      id: p.id,
      title: p.title,
      author: p.author,
      updatedAt: p.updatedAt
    }));
  }

  getPage(id) {
    const page = this.pages.find(p => p.id === id || p.title === id);
    return page ? { ...page } : null;
  }

  createPage(title, content, author = 'user') {
    const existing = this.pages.find(p => p.title === title);

    if (existing) {
      return { success: false, error: '文档已存在' };
    }

    const page = {
      id: Date.now().toString(),
      title,
      content,
      author,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.pages.push(page);
    this.addToHistory('create', title);

    this.saveData();

    return { success: true, id: page.id };
  }

  updatePage(id, content) {
    const index = this.pages.findIndex(p => p.id === id || p.title === id);

    if (index === -1) {
      return { success: false, error: '文档不存在' };
    }

    this.pages[index].content = content;
    this.pages[index].updatedAt = new Date().toISOString();

    this.addToHistory('update', this.pages[index].title);

    this.saveData();

    return { success: true };
  }

  deletePage(id) {
    const index = this.pages.findIndex(p => p.id === id || p.title === id);

    if (index === -1) {
      return { success: false, error: '文档不存在' };
    }

    const title = this.pages[index].title;
    this.pages.splice(index, 1);

    this.addToHistory('delete', title);

    this.saveData();

    return { success: true };
  }

  search(keyword) {
    const lowerKeyword = keyword.toLowerCase();

    return this.pages
      .map(page => {
        const titleMatch = page.title.toLowerCase().includes(lowerKeyword);
        const contentMatch = page.content.toLowerCase().includes(lowerKeyword);

        if (!titleMatch && !contentMatch) {
          return null;
        }

        let relevance = 0;
        if (titleMatch) relevance += 50;
        if (contentMatch) relevance += 30;

        const preview = page.content.substring(0, 100) + '...';

        return {
          id: page.id,
          title: page.title,
          relevance,
          preview
        };
      })
      .filter(r => r !== null)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  addToHistory(action, title) {
    this.history.unshift({
      timestamp: new Date().toISOString(),
      action,
      title
    });

    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveData();
  }

  getHistory(limit) {
    return this.history.slice(0, limit);
  }

  async export(filePath) {
    try {
      const exportData = this.pages.map(p => ({
        title: p.title,
        content: p.content,
        tags: p.tags,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async import(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      let count = 0;
      data.forEach(importPage => {
        const existing = this.pages.find(p => p.title === importPage.title);

        if (existing) {
          existing.content = importPage.content;
          existing.tags = importPage.tags || [];
          existing.updatedAt = importPage.updatedAt || new Date().toISOString();
        } else {
          this.pages.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: importPage.title,
            content: importPage.content,
            author: 'import',
            tags: importPage.tags || [],
            createdAt: importPage.createdAt || new Date().toISOString(),
            updatedAt: importPage.updatedAt || new Date().toISOString()
          });
        }
        count++;
      });

      this.saveData();

      return { success: true, count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
