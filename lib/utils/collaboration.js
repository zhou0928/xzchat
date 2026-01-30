/**
 * 协作功能模块
 * 支持会话分享、团队知识库等功能
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 会话分享器
 */
export class SessionSharer {
  constructor(options = {}) {
    this.shareDir = options.shareDir || path.join(__dirname, '..', '..', 'shares');
    this.expiryDays = options.expiryDays || 7;
  }

  /**
   * 初始化
   */
  async init() {
    await fs.mkdir(this.shareDir, { recursive: true });
  }

  /**
   * 生成分享链接
   */
  async generateShareLink(sessionId, sessionData, options = {}) {
    const {
      password = null,
      expiry = null,
      readonly = false
    } = options;

    const shareId = this._generateShareId();
    const shareData = {
      id: shareId,
      sessionId,
      data: sessionData,
      password: password ? this._hashPassword(password) : null,
      expiry: expiry || this._calculateExpiry(),
      readonly,
      createdAt: new Date().toISOString(),
      accessCount: 0
    };

    await this._saveShare(shareId, shareData);

    return {
      shareId,
      link: this._formatShareLink(shareId),
      expiry: shareData.expiry,
      password: password ? '已设置密码保护' : '无密码'
    };
  }

  /**
   * 加载分享的会话
   */
  async loadSharedSession(shareId, password = null) {
    const share = await this._loadShare(shareId);

    if (!share) {
      throw new Error('分享链接不存在或已过期');
    }

    // 检查过期
    if (share.expiry && new Date() > new Date(share.expiry)) {
      await this._deleteShare(shareId);
      throw new Error('分享链接已过期');
    }

    // 检查密码
    if (share.password) {
      if (!password) {
        throw new Error('需要密码才能访问');
      }
      if (share.password !== this._hashPassword(password)) {
        throw new Error('密码错误');
      }
    }

    // 更新访问计数
    share.accessCount++;
    await this._saveShare(shareId, share);

    return share;
  }

  /**
   * 列出所有分享
   */
  async listShares() {
    const files = await fs.readdir(this.shareDir);
    const shares = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const shareId = file.replace('.json', '');
        const share = await this._loadShare(shareId);
        if (share) {
          shares.push({
            id: shareId,
            sessionId: share.sessionId,
            createdAt: share.createdAt,
            expiry: share.expiry,
            accessCount: share.accessCount,
            readonly: share.readonly,
            hasPassword: !!share.password,
            expired: share.expiry && new Date() > new Date(share.expiry)
          });
        }
      }
    }

    return shares;
  }

  /**
   * 删除分享
   */
  async deleteShare(shareId) {
    return await this._deleteShare(shareId);
  }

  /**
   * 清理过期分享
   */
  async cleanupExpired() {
    const shares = await this.listShares();
    let cleaned = 0;

    for (const share of shares) {
      if (share.expired) {
        await this._deleteShare(share.id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 生成分享ID
   */
  _generateShareId() {
    return crypto.randomBytes(16).toString('hex').substring(0, 16);
  }

  /**
   * 哈希密码
   */
  _hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * 计算过期时间
   */
  _calculateExpiry() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.expiryDays);
    return expiry.toISOString();
  }

  /**
   * 格式化分享链接
   */
  _formatShareLink(shareId) {
    // 在实际应用中，这应该是一个真实的URL
    return `https://xzchat.app/share/${shareId}`;
  }

  /**
   * 保存分享数据
   */
  async _saveShare(shareId, data) {
    const filePath = path.join(this.shareDir, `${shareId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * 加载分享数据
   */
  async _loadShare(shareId) {
    try {
      const filePath = path.join(this.shareDir, `${shareId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * 删除分享
   */
  async _deleteShare(shareId) {
    try {
      const filePath = path.join(this.shareDir, `${shareId}.json`);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 团队知识库
 */
export class TeamKnowledgeBase {
  constructor(options = {}) {
    this.kbDir = options.kbDir || path.join(__dirname, '..', '..', 'team-kb');
    this.teamId = options.teamId || 'default';
  }

  /**
   * 初始化
   */
  async init() {
    await fs.mkdir(this.kbDir, { recursive: true });
  }

  /**
   * 添加知识条目
   */
  async addEntry(title, content, options = {}) {
    const {
      category = 'general',
      tags = [],
      author = 'anonymous'
    } = options;

    const entry = {
      id: this._generateEntryId(),
      title,
      content,
      category,
      tags,
      author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const categoryDir = path.join(this.kbDir, category);
    await fs.mkdir(categoryDir, { recursive: true });

    const filePath = path.join(categoryDir, `${entry.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));

    return entry;
  }

  /**
   * 搜索知识条目
   */
  async searchEntries(query, options = {}) {
    const {
      category = null,
      tags = [],
      author = null
    } = options;

    const allEntries = await this._loadAllEntries();

    return allEntries.filter(entry => {
      // 类别过滤
      if (category && entry.category !== category) return false;

      // 标签过滤
      if (tags.length > 0) {
        const hasAllTags = tags.every(tag => entry.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      // 作者过滤
      if (author && entry.author !== author) return false;

      // 搜索查询
      if (query) {
        const q = query.toLowerCase();
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.content.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }

  /**
   * 获取知识条目
   */
  async getEntry(entryId) {
    const allEntries = await this._loadAllEntries();
    return allEntries.find(e => e.id === entryId) || null;
  }

  /**
   * 更新知识条目
   */
  async updateEntry(entryId, updates) {
    const allEntries = await this._loadAllEntries();
    const index = allEntries.findIndex(e => e.id === entryId);

    if (index === -1) {
      throw new Error('Knowledge entry not found');
    }

    const entry = allEntries[index];
    Object.assign(entry, updates, {
      updatedAt: new Date().toISOString()
    });

    await this._saveEntry(entry);
    return entry;
  }

  /**
   * 删除知识条目
   */
  async deleteEntry(entryId) {
    const allEntries = await this._loadAllEntries();
    const entry = allEntries.find(e => e.id === entryId);

    if (!entry) {
      throw new Error('Knowledge entry not found');
    }

    const filePath = path.join(this.kbDir, entry.category, `${entryId}.json`);
    await fs.unlink(filePath);
    return true;
  }

  /**
   * 列出所有类别
   */
  async listCategories() {
    const dirs = await fs.readdir(this.kbDir, { withFileTypes: true });
    return dirs
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  /**
   * 获取统计数据
   */
  async getStats() {
    const allEntries = await this._loadAllEntries();

    const categoryStats = {};
    const tagStats = {};

    for (const entry of allEntries) {
      // 类别统计
      categoryStats[entry.category] = (categoryStats[entry.category] || 0) + 1;

      // 标签统计
      for (const tag of entry.tags) {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      }
    }

    return {
      totalEntries: allEntries.length,
      categories: categoryStats,
      tags: tagStats,
      topCategories: this._getTopN(categoryStats, 5),
      topTags: this._getTopN(tagStats, 10)
    };
  }

  /**
   * 导出知识库
   */
  async exportKnowledge(format = 'json') {
    const allEntries = await this._loadAllEntries();

    if (format === 'json') {
      return JSON.stringify(allEntries, null, 2);
    } else if (format === 'markdown') {
      return this._exportAsMarkdown(allEntries);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * 导入知识库
   */
  async importKnowledge(data) {
    try {
      const entries = typeof data === 'string' ? JSON.parse(data) : data;

      if (!Array.isArray(entries)) {
        throw new Error('Invalid knowledge data format');
      }

      let imported = 0;
      for (const entry of entries) {
        if (entry.title && entry.content) {
          await this._saveEntry(entry);
          imported++;
        }
      }

      return { imported, total: entries.length };
    } catch (error) {
      throw new Error(`Failed to import knowledge: ${error.message}`);
    }
  }

  /**
   * 生成条目ID
   */
  _generateEntryId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * 加载所有条目
   */
  async _loadAllEntries() {
    const categories = await this.listCategories();
    const entries = [];

    for (const category of categories) {
      const categoryDir = path.join(this.kbDir, category);
      const files = await fs.readdir(categoryDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(categoryDir, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const entry = JSON.parse(data);
            entries.push(entry);
          } catch (error) {
            console.error(`Failed to load ${file}:`, error);
          }
        }
      }
    }

    return entries;
  }

  /**
   * 保存条目
   */
  async _saveEntry(entry) {
    const categoryDir = path.join(this.kbDir, entry.category);
    await fs.mkdir(categoryDir, { recursive: true });

    const filePath = path.join(categoryDir, `${entry.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
  }

  /**
   * 导出为Markdown
   */
  _exportAsMarkdown(entries) {
    const lines = ['# Team Knowledge Base\n\n'];

    for (const entry of entries) {
      lines.push(`## ${entry.title}`);
      lines.push(`\n${entry.content}\n`);

      if (entry.tags.length > 0) {
        lines.push(`**Tags:** ${entry.tags.map(t => `\`${t}\``).join(', ')}`);
      }

      lines.push(`*Category: ${entry.category}*`);
      lines.push(`*Author: ${entry.author}*`);
      lines.push(`*Updated: ${entry.updatedAt}*\n`);
    }

    return lines.join('\n');
  }

  /**
   * 获取Top N
   */
  _getTopN(obj, n) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, value]) => ({ key, value }));
  }
}

/**
 * 会话导出器
 */
export class SessionExporter {
  /**
   * 导出会话为JSON
   */
  static exportJSON(session) {
    return JSON.stringify(session, null, 2);
  }

  /**
   * 导出会话为Markdown
   */
  static exportMarkdown(session) {
    const lines = [`# Session: ${session.name || 'Untitled'}\n`];
    lines.push(`*Created: ${session.createdAt}*\n`);
    lines.push(`*Messages: ${session.messages?.length || 0}*\n\n`);
    lines.push('---\n\n');

    if (session.messages) {
      for (const msg of session.messages) {
        const role = msg.role === 'user' ? '👤 You' : '🤖 AI';
        lines.push(`### ${role}`);
        lines.push(`\n${msg.content}\n\n`);
      }
    }

    return lines.join('');
  }

  /**
   * 导出会话为纯文本
   */
  static exportText(session) {
    const lines = [];

    if (session.messages) {
      for (const msg of session.messages) {
        const role = msg.role === 'user' ? 'You:' : 'AI:';
        lines.push(`${role}\n${msg.content}\n\n`);
      }
    }

    return lines.join('');
  }

  /**
   * 导出会话为HTML
   */
  static exportHTML(session) {
    const messages = session.messages?.map(msg => `
      <div class="message ${msg.role}">
        <div class="role">${msg.role === 'user' ? 'You' : 'AI'}</div>
        <div class="content">${msg.content}</div>
      </div>
    `).join('') || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${session.name || 'Session'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
    .message.user { background: #f0f0f0; }
    .message.assistant { background: #e8f5e9; }
    .role { font-weight: bold; margin-bottom: 10px; }
    .content { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${session.name || 'Session'}</h1>
  ${messages}
</body>
</html>
    `;
  }
}

/**
 * 创建全局实例
 */
let globalSessionSharer = null;
let globalTeamKB = null;

export function getSessionSharer() {
  if (!globalSessionSharer) {
    globalSessionSharer = new SessionSharer();
    globalSessionSharer.init();
  }
  return globalSessionSharer;
}

export function getTeamKnowledgeBase() {
  if (!globalTeamKB) {
    globalTeamKB = new TeamKnowledgeBase();
    globalTeamKB.init();
  }
  return globalTeamKB;
}
