import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class BookmarkManager {
  constructor() {
    this.bookmarksPath = path.join(os.homedir(), '.xzchat-bookmarks.json');
    this.bookmarks = [];
  }

  async load() {
    try {
      const data = await fs.readFile(this.bookmarksPath, 'utf-8');
      this.bookmarks = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.bookmarks = [];
        await this.save();
      }
    }
  }

  async save() {
    await fs.writeFile(this.bookmarksPath, JSON.stringify(this.bookmarks, null, 2), 'utf-8');
  }

  async add(content, category = 'general', tags = []) {
    await this.load();
    const bookmark = {
      id: Date.now().toString(),
      content,
      category,
      tags: Array.isArray(tags) ? tags : [tags],
      createdAt: new Date().toISOString()
    };
    this.bookmarks.push(bookmark);
    await this.save();
    return bookmark;
  }

  async remove(id) {
    await this.load();
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      const removed = this.bookmarks.splice(index, 1)[0];
      await this.save();
      return removed;
    }
    return null;
  }

  async get(id) {
    await this.load();
    return this.bookmarks.find(b => b.id === id);
  }

  async list(options = {}) {
    await this.load();
    let results = [...this.bookmarks];
    if (options.category) results = results.filter(b => b.category === options.category);
    if (options.tag) results = results.filter(b => b.tags.includes(options.tag));
    if (options.search) results = results.filter(b => b.content.toLowerCase().includes(options.search.toLowerCase()));
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return results;
  }

  async addTag(id, tag) {
    await this.load();
    const bookmark = this.bookmarks.find(b => b.id === id);
    if (bookmark && !bookmark.tags.includes(tag)) {
      bookmark.tags.push(tag);
      await this.save();
      return bookmark;
    }
    return null;
  }

  async getCategories() {
    await this.load();
    const categories = new Set();
    this.bookmarks.forEach(b => categories.add(b.category));
    return Array.from(categories).sort();
  }

  async getTags() {
    await this.load();
    const tags = new Set();
    this.bookmarks.forEach(b => b.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }

  async clear() {
    this.bookmarks = [];
    await this.save();
  }

  formatList(bookmarks) {
    if (bookmarks.length === 0) return '暂无书签';
    let output = '';
    bookmarks.forEach((b, i) => {
      const preview = b.content.length > 50 ? b.content.substring(0, 50) + '...' : b.content;
      const tags = b.tags.length > 0 ? ` [${b.tags.join(', ')}]` : '';
      output += `${i + 1}. 🔖 ${preview}${tags}\n`;
      output += `   ID: ${b.id} | ${b.category} | ${new Date(b.createdAt).toLocaleDateString('zh-CN')}\n`;
    });
    return output.trim();
  }
}

const bookmarkManager = new BookmarkManager();
export default bookmarkManager;
export { BookmarkManager };
