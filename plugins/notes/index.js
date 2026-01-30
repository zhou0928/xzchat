/**
 * 笔记插件
 * 快速笔记和备忘录管理
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';
import fs from 'fs';
import path from 'path';

export default class NotesPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.notes = [];
    this.notesFile = path.join(process.cwd(), '.xzchat-notes.json');

    this.commands = {
      '/note': {
        handler: this.handleNote.bind(this),
        description: '添加笔记',
        usage: '/note <content>',
        category: 'productivity'
      },
      '/notes': {
        handler: this.handleList.bind(this),
        description: '列出所有笔记',
        usage: '/notes [limit]',
        category: 'productivity'
      },
      '/note-search': {
        handler: this.handleSearch.bind(this),
        description: '搜索笔记',
        usage: '/note-search <keyword>',
        category: 'productivity'
      },
      '/note-delete': {
        handler: this.handleDelete.bind(this),
        description: '删除笔记',
        usage: '/note-delete <id>',
        category: 'productivity'
      },
      '/note-clear': {
        handler: this.handleClear.bind(this),
        description: '清空所有笔记',
        usage: '/note-clear',
        category: 'productivity'
      },
      '/note-export': {
        handler: this.handleExport.bind(this),
        description: '导出笔记',
        usage: '/note-export [format]',
        category: 'productivity'
      },
      '/note-import': {
        handler: this.handleImport.bind(this),
        description: '导入笔记',
        usage: '/note-import <filepath>',
        category: 'productivity'
      },
      '/note-tags': {
        handler: this.handleTags.bind(this),
        description: '列出所有标签',
        usage: '/note-tags',
        category: 'productivity'
      },
      '/note-stats': {
        handler: this.handleStats.bind(this),
        description: '笔记统计',
        usage: '/note-stats',
        category: 'productivity'
      }
    };
  }

  async onEnable(context) {
    await this.loadNotes();
    this.context.logger.info('笔记插件已启用');
  }

  async onDisable(context) {
    await this.saveNotes();
    this.context.logger.info('笔记插件已禁用');
  }

  /**
   * 加载笔记
   */
  async loadNotes() {
    try {
      if (fs.existsSync(this.notesFile)) {
        const data = fs.readFileSync(this.notesFile, 'utf-8');
        this.notes = JSON.parse(data);
      }
    } catch (error) {
      this.context.logger.error('加载笔记失败:', error);
      this.notes = [];
    }
  }

  /**
   * 保存笔记
   */
  async saveNotes() {
    try {
      fs.writeFileSync(this.notesFile, JSON.stringify(this.notes, null, 2));
    } catch (error) {
      this.context.logger.error('保存笔记失败:', error);
    }
  }

  /**
   * 处理添加笔记
   */
  async handleNote(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入笔记内容' };
    }

    const note = {
      id: Date.now().toString(),
      content: args.trim(),
      timestamp: new Date().toISOString(),
      tags: this.extractTags(args)
    };

    this.notes.unshift(note);
    await this.saveNotes();

    return {
      success: true,
      message: `📝 笔记已添加 (ID: ${note.id})\n\n${note.content}`
    };
  }

  /**
   * 处理列表笔记
   */
  async handleList(args) {
    const limit = parseInt(args) || this.notes.length;

    if (this.notes.length === 0) {
      return { message: '📒 没有笔记' };
    }

    const displayNotes = this.notes.slice(0, limit);
    const message = `📒 笔记列表 (显示 ${Math.min(limit, this.notes.length)}/${this.notes.length} 条):\n\n` +
      displayNotes.map((note, index) => {
        const date = new Date(note.timestamp).toLocaleString();
        const tags = note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
        return `${index + 1}. [${note.id}] ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}${tags}\n   ${date}`;
      }).join('\n\n');

    return {
      success: true,
      message
    };
  }

  /**
   * 处理搜索笔记
   */
  async handleSearch(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入搜索关键词' };
    }

    const keyword = args.toLowerCase();
    const results = this.notes.filter(note =>
      note.content.toLowerCase().includes(keyword) ||
      note.tags.some(tag => tag.toLowerCase().includes(keyword))
    );

    if (results.length === 0) {
      return { message: `🔍 没有找到包含 "${args}" 的笔记` };
    }

    const message = `🔍 搜索结果 "${args}" (${results.length} 条):\n\n` +
      results.map((note, index) => {
        const date = new Date(note.timestamp).toLocaleString();
        return `${index + 1}. [${note.id}] ${note.content}\n   ${date}`;
      }).join('\n\n');

    return {
      success: true,
      message
    };
  }

  /**
   * 处理删除笔记
   */
  async handleDelete(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入笔记 ID' };
    }

    const noteId = args.trim();
    const index = this.notes.findIndex(note => note.id === noteId);

    if (index === -1) {
      return { error: `找不到 ID 为 ${noteId} 的笔记` };
    }

    const deleted = this.notes.splice(index, 1)[0];
    await this.saveNotes();

    return {
      success: true,
      message: `🗑️ 笔记已删除:\n\n${deleted.content}`
    };
  }

  /**
   * 处理清空笔记
   */
  async handleClear() {
    const count = this.notes.length;
    if (count === 0) {
      return { message: '📒 笔记已经是空的了' };
    }

    if (confirm(`确定要删除所有 ${count} 条笔记吗？`)) {
      this.notes = [];
      await this.saveNotes();
      return {
        success: true,
        message: `🗑️ 已清空 ${count} 条笔记`
      };
    }

    return { message: '操作已取消' };
  }

  /**
   * 处理导出笔记
   */
  async handleExport(args) {
    const format = args.trim() || 'json';

    if (this.notes.length === 0) {
      return { message: '📒 没有笔记可以导出' };
    }

    let content, filename;

    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(this.notes, null, 2);
        filename = 'notes.json';
        break;
      case 'txt':
        content = this.notes.map((note, i) =>
          `[${i + 1}] ${new Date(note.timestamp).toLocaleString()}\n${note.content}\n${note.tags.length > 0 ? `标签: ${note.tags.join(', ')}` : ''}\n`
        ).join('\n---\n\n');
        filename = 'notes.txt';
        break;
      case 'md':
        content = this.notes.map(note =>
          `## ${new Date(note.timestamp).toLocaleString()}\n\n${note.content}\n${note.tags.length > 0 ? `\n**标签:** ${note.tags.join(', ')}` : ''}\n`
        ).join('\n---\n');
        filename = 'notes.md';
        break;
      default:
        return { error: '不支持的格式，支持: json, txt, md' };
    }

    try {
      const exportDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const exportPath = path.join(exportDir, filename);
      fs.writeFileSync(exportPath, content);

      return {
        success: true,
        message: `📤 笔记已导出到:\n${exportPath}\n\n格式: ${format}`
      };
    } catch (error) {
      return {
        error: `导出失败: ${error.message}`
      };
    }
  }

  /**
   * 提取标签
   */
  extractTags(content) {
    const tagPattern = /#(\w+)/g;
    const tags = [];
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      tags.push(match[1]);
      content = content.replace(match[0], '');
    }

    return tags;
  }

  /**
   * 处理导入笔记
   */
  async handleImport(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入文件路径' };
    }

    const filepath = args.trim();
    try {
      if (!fs.existsSync(filepath)) {
        return { error: `文件不存在: ${filepath}` };
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      let importedNotes = [];

      if (filepath.endsWith('.json')) {
        importedNotes = JSON.parse(content);
      } else if (filepath.endsWith('.txt') || filepath.endsWith('.md')) {
        // 简单导入：每行一条笔记
        importedNotes = content.split('\n')
          .filter(line => line.trim())
          .map((line, i) => ({
            id: Date.now().toString() + i,
            content: line.trim(),
            timestamp: new Date().toISOString(),
            tags: this.extractTags(line)
          }));
      } else {
        return { error: '不支持的文件格式，支持: json, txt, md' };
      }

      // 合并笔记
      const initialCount = this.notes.length;
      this.notes.unshift(...importedNotes);
      await this.saveNotes();

      return {
        success: true,
        message: `📥 成功导入 ${importedNotes.length} 条笔记\n总计: ${this.notes.length} 条笔记`
      };
    } catch (error) {
      return {
        error: `导入失败: ${error.message}`
      };
    }
  }

  /**
   * 处理标签列表
   */
  async handleTags() {
    if (this.notes.length === 0) {
      return { message: '📒 没有笔记' };
    }

    const tagCounts = {};
    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    if (Object.keys(tagCounts).length === 0) {
      return { message: '📒 没有标签' };
    }

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]);

    const message = `🏷️ 标签列表 (${sortedTags.length} 个):\n\n` +
      sortedTags.map(([tag, count]) => `  #${tag} (${count} 条笔记)`)
        .join('\n');

    return {
      success: true,
      message
    };
  }

  /**
   * 处理笔记统计
   */
  async handleStats() {
    if (this.notes.length === 0) {
      return { message: '📒 没有笔记' };
    }

    const tagCounts = {};
    const notesByDay = {};

    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      const day = note.timestamp.split('T')[0];
      notesByDay[day] = (notesByDay[day] || 0) + 1;
    });

    const avgLength = this.notes.reduce((sum, note) => sum + note.content.length, 0) / this.notes.length;
    const totalWords = this.notes.reduce((sum, note) => sum + note.content.split(/\s+/).length, 0);

    const message = `📊 笔记统计:\n\n` +
      `  总笔记数: ${this.notes.length}\n` +
      `  总标签数: ${Object.keys(tagCounts).length}\n` +
      `  总字数: ${totalWords}\n` +
      `  平均笔记长度: ${Math.round(avgLength)} 字\n` +
      `  最常用标签: ${Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '无'} (${Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} 条)\n` +
      `  记录天数: ${Object.keys(notesByDay).length} 天\n` +
      `  第一条笔记: ${new Date(this.notes[this.notes.length - 1].timestamp).toLocaleDateString()}`;

    return {
      success: true,
      message
    };
  }
}
