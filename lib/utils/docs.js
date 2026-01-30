/**
 * 文档管理器 - 项目文档生成和管理
 */

const fs = require('fs').promises;
const path = require('path');

class DocsManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/docs.json');
    this.documents = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.documents = JSON.parse(data);
    } catch (err) {
      this.documents = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.documents, null, 2));
  }

  add(title, content, category = 'general', tags = []) {
    const doc = {
      id: Date.now().toString(),
      title,
      content,
      category, // 'general', 'api', 'tutorial', 'guide', 'reference'
      tags: Array.isArray(tags) ? tags : [tags],
      author: 'system',
      version: '1.0.0',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0
    };
    this.documents.push(doc);
    this.save();
    return doc;
  }

  get(id) {
    return this.documents.find(d => d.id === id);
  }

  getAll() {
    return this.documents;
  }

  getByCategory(category) {
    return this.documents.filter(d => d.category === category);
  }

  getByTag(tag) {
    return this.documents.filter(d => d.tags.includes(tag));
  }

  update(id, updates) {
    const index = this.documents.findIndex(d => d.id === id);
    if (index !== -1) {
      this.documents[index] = {
        ...this.documents[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.documents[index];
    }
    return null;
  }

  remove(id) {
    const index = this.documents.findIndex(d => d.id === id);
    if (index !== -1) {
      const removed = this.documents.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  view(id) {
    const doc = this.get(id);
    if (doc) {
      doc.viewCount++;
      this.save();
    }
    return doc;
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.documents.filter(d =>
      d.title.toLowerCase().includes(lower) ||
      d.content.toLowerCase().includes(lower) ||
      d.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  getStats() {
    return {
      total: this.documents.length,
      byCategory: {
        general: this.documents.filter(d => d.category === 'general').length,
        api: this.documents.filter(d => d.category === 'api').length,
        tutorial: this.documents.filter(d => d.category === 'tutorial').length,
        guide: this.documents.filter(d => d.category === 'guide').length,
        reference: this.documents.filter(d => d.category === 'reference').length
      },
      totalViews: this.documents.reduce((sum, d) => sum + d.viewCount, 0)
    };
  }
}

module.exports = DocsManager;
