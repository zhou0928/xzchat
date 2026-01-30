import fs from 'fs/promises';
import path from 'path';

/**
 * 笔记系统管理器
 */
class NoteManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-notes.json');
    this.notesDir = path.join(this.getHomeDir(), '.xzchat-notes');
    this.notes = {};
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.notes = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.notes = {};
        await this.save();
      } else {
        throw new Error(`加载笔记配置失败: ${error.message}`);
      }
    }

    // 确保笔记目录存在
    try {
      await fs.mkdir(this.notesDir, { recursive: true });
    } catch (error) {
      // 目录可能已存在
    }
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify(this.notes, null, 2));
  }

  async list(filter = {}) {
    await this.load();
    let notes = Object.values(this.notes);

    if (filter.category) {
      notes = notes.filter(n => n.category === filter.category);
    }

    if (filter.tag) {
      notes = notes.filter(n => n.tags.includes(filter.tag));
    }

    if (filter.search) {
      const term = filter.search.toLowerCase();
      notes = notes.filter(n => 
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term)
      );
    }

    return notes;
  }

  async get(id) {
    await this.load();
    const note = this.notes[id];
    if (!note) {
      throw new Error(`笔记 "${id}" 不存在`);
    }

    // 如果是文件存储的笔记，读取文件内容
    if (note.storage === 'file') {
      try {
        const filePath = path.join(this.notesDir, id + '.md');
        const content = await fs.readFile(filePath, 'utf-8');
        note.content = content;
      } catch (error) {
        // 文件不存在，返回缓存内容
      }
    }

    return note;
  }

  async add(title, content, options = {}) {
    await this.load();
    const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

    const note = {
      id,
      title,
      content,
      tags: options.tags || [],
      category: options.category || 'General',
      storage: options.storage || 'memory', // 'memory' or 'file'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 如果是文件存储，写入文件
    if (note.storage === 'file') {
      const filePath = path.join(this.notesDir, id + '.md');
      await fs.writeFile(filePath, content, 'utf-8');
      note.content = `[文件存储] ${filePath}`;
    }

    this.notes[id] = note;
    await this.save();

    return note;
  }

  async remove(id) {
    await this.load();
    if (!this.notes[id]) {
      throw new Error(`笔记 "${id}" 不存在`);
    }

    // 删除文件存储的笔记
    if (this.notes[id].storage === 'file') {
      try {
        const filePath = path.join(this.notesDir, id + '.md');
        await fs.unlink(filePath);
      } catch (error) {
        // 文件可能不存在
      }
    }

    delete this.notes[id];
    await this.save();
    return true;
  }

  async update(id, updates) {
    await this.load();
    if (!this.notes[id]) {
      throw new Error(`笔记 "${id}" 不存在`);
    }

    const note = this.notes[id];

    if (updates.title !== undefined) {
      note.title = updates.title;
    }

    if (updates.content !== undefined) {
      note.content = updates.content;
      note.updatedAt = new Date().toISOString();

      // 更新文件
      if (note.storage === 'file') {
        const filePath = path.join(this.notesDir, id + '.md');
        await fs.writeFile(filePath, updates.content, 'utf-8');
      }
    }

    if (updates.tags) {
      note.tags = Array.isArray(updates.tags) ? updates.tags : [updates.tags];
    }

    if (updates.category !== undefined) {
      note.category = updates.category;
    }

    await this.save();
    return note;
  }

  async addTag(id, tag) {
    await this.load();
    if (!this.notes[id]) {
      throw new Error(`笔记 "${id}" 不存在`);
    }

    if (!this.notes[id].tags.includes(tag)) {
      this.notes[id].tags.push(tag);
      await this.save();
    }

    return this.notes[id];
  }

  async removeTag(id, tag) {
    await this.load();
    if (!this.notes[id]) {
      throw new Error(`笔记 "${id}" 不存在`);
    }

    this.notes[id].tags = this.notes[id].tags.filter(t => t !== tag);
    await this.save();
    return this.notes[id];
  }

  async getCategories() {
    await this.load();
    const categories = new Set();
    Object.values(this.notes).forEach(note => {
      categories.add(note.category);
    });
    return Array.from(categories);
  }

  async getTags() {
    await this.load();
    const tags = new Set();
    Object.values(this.notes).forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }

  async search(query) {
    return this.list({ search: query });
  }

  async export(format = 'json') {
    await this.load();
    if (format === 'json') {
      return JSON.stringify(this.notes, null, 2);
    }
    if (format === 'markdown') {
      let md = '# 笔记导出\n\n';
      for (const note of Object.values(this.notes)) {
        md += `## ${note.title}\n\n`;
        md += `**分类**: ${note.category}\n`;
        md += `**标签**: ${note.tags.join(', ') || '无'}\n`;
        md += `**创建时间**: ${new Date(note.createdAt).toLocaleString('zh-CN')}\n\n`;
        md += '---\n\n';
        md += note.content + '\n\n';
        md += '---\n\n';
      }
      return md;
    }
    throw new Error(`不支持的导出格式: ${format}`);
  }

  async import(content, format = 'json') {
    let notes;
    if (format === 'json') {
      notes = JSON.parse(content);
    } else {
      throw new Error(`不支持的导入格式: ${format}`);
    }

    await this.load();
    let count = 0;
    for (const note of Object.values(notes)) {
      const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      note.id = id;
      note.createdAt = new Date().toISOString();
      note.updatedAt = new Date().toISOString();
      this.notes[id] = note;
      count++;
    }

    await this.save();
    return count;
  }

  async getStats() {
    await this.load();
    const notes = Object.values(this.notes);

    return {
      total: notes.length,
      byCategory: notes.reduce((acc, note) => {
        acc[note.category] = (acc[note.category] || 0) + 1;
        return acc;
      }, {}),
      byTag: notes.reduce((acc, note) => {
        note.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {}),
      byStorage: notes.reduce((acc, note) => {
        acc[note.storage] = (acc[note.storage] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * 从 AI 对话自动创建笔记
   */
  async fromConversation(title, conversation, summary = '') {
    return this.add(
      title,
      `## 对话摘要\n${summary}\n\n## 对话内容\n${conversation}`,
      {
        category: 'Conversation',
        tags: ['conversation', 'ai']
      }
    );
  }

  /**
   * Markdown 格式化笔记
   */
  toMarkdown(note) {
    let md = `# ${note.title}\n\n`;
    md += `**分类**: ${note.category}\n`;
    md += `**标签**: ${note.tags.join(', ') || '无'}\n`;
    md += `**创建**: ${new Date(note.createdAt).toLocaleString('zh-CN')}\n`;
    md += `**更新**: ${new Date(note.updatedAt).toLocaleString('zh-CN')}\n\n`;
    md += '---\n\n';
    md += note.content;
    return md;
  }
}

export default new NoteManager();
