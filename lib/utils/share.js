import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * 团队协作管理器
 * 支持分享会话、分支和资源
 */
class ShareManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-share.json');
    this.sharedItems = new Map();
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const items = JSON.parse(data);
      this.sharedItems = new Map(Object.entries(items));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载分享配置失败: ${error.message}`);
      }
    }
  }

  async save() {
    const itemsObj = {};
    this.sharedItems.forEach((value, key) => {
      itemsObj[key] = value;
    });
    await fs.writeFile(this.configPath, JSON.stringify(itemsObj, null, 2));
  }

  async list(filter = {}) {
    await this.load();
    let items = Array.from(this.sharedItems.values());

    if (filter.type) {
      items = items.filter(i => i.type === filter.type);
    }

    if (filter.category) {
      items = items.filter(i => i.category === filter.category);
    }

    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async get(id) {
    await this.load();
    return this.sharedItems.get(id) || null;
  }

  /**
   * 分享会话
   */
  async shareSession(sessionId, options = {}) {
    await this.load();

    const shareId = this.generateId();
    const item = {
      id: shareId,
      type: 'session',
      itemId: sessionId,
      title: options.title || '共享会话',
      description: options.description || '',
      category: options.category || 'Session',
      tags: options.tags || [],
      isPublic: !!options.isPublic,
      password: options.password ? this.hashPassword(options.password) : null,
      permissions: options.permissions || ['read'],
      metadata: {
        messageCount: options.messageCount || 0,
        createdAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      comments: []
    };

    this.sharedItems.set(shareId, item);
    await this.save();

    return item;
  }

  /**
   * 分享分支
   */
  async shareBranch(branchId, options = {}) {
    await this.load();

    const shareId = this.generateId();
    const item = {
      id: shareId,
      type: 'branch',
      itemId: branchId,
      title: options.title || '共享分支',
      description: options.description || '',
      category: options.category || 'Branch',
      tags: options.tags || [],
      isPublic: !!options.isPublic,
      password: options.password ? this.hashPassword(options.password) : null,
      permissions: options.permissions || ['read', 'comment'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      comments: []
    };

    this.sharedItems.set(shareId, item);
    await this.save();

    return item;
  }

  /**
   * 分享书签
   */
  async shareBookmark(bookmarkId, options = {}) {
    await this.load();

    const shareId = this.generateId();
    const item = {
      id: shareId,
      type: 'bookmark',
      itemId: bookmarkId,
      title: options.title || '共享书签',
      description: options.description || '',
      category: options.category || 'Bookmark',
      tags: options.tags || [],
      isPublic: !!options.isPublic,
      password: options.password ? this.hashPassword(options.password) : null,
      permissions: options.permissions || ['read'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      comments: []
    };

    this.sharedItems.set(shareId, item);
    await this.save();

    return item;
  }

  /**
   * 分享笔记
   */
  async shareNote(noteId, options = {}) {
    await this.load();

    const shareId = this.generateId();
    const item = {
      id: shareId,
      type: 'note',
      itemId: noteId,
      title: options.title || '共享笔记',
      description: options.description || '',
      category: options.category || 'Note',
      tags: options.tags || [],
      isPublic: !!options.isPublic,
      password: options.password ? this.hashPassword(options.password) : null,
      permissions: options.permissions || ['read', 'comment'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      comments: []
    };

    this.sharedItems.set(shareId, item);
    await this.save();

    return item;
  }

  /**
   * 取消分享
   */
  async unshare(shareId) {
    await this.load();
    
    if (!this.sharedItems.has(shareId)) {
      throw new Error(`分享项 "${shareId}" 不存在`);
    }

    this.sharedItems.delete(shareId);
    await this.save();

    return true;
  }

  /**
   * 更新分享项
   */
  async update(shareId, updates) {
    await this.load();
    
    const item = this.sharedItems.get(shareId);
    if (!item) {
      throw new Error(`分享项 "${shareId}" 不存在`);
    }

    if (updates.title !== undefined) {
      item.title = updates.title;
    }

    if (updates.description !== undefined) {
      item.description = updates.description;
    }

    if (updates.tags) {
      item.tags = Array.isArray(updates.tags) ? updates.tags : [updates.tags];
    }

    if (updates.isPublic !== undefined) {
      item.isPublic = updates.isPublic;
    }

    if (updates.permissions) {
      item.permissions = Array.isArray(updates.permissions) ? updates.permissions : [updates.permissions];
    }

    item.updatedAt = new Date().toISOString();

    this.sharedItems.set(shareId, item);
    await this.save();

    return item;
  }

  /**
   * 访问分享项
   */
  async access(shareId, password = null) {
    await this.load();
    
    const item = this.sharedItems.get(shareId);
    if (!item) {
      throw new Error(`分享项 "${shareId}" 不存在`);
    }

    // 检查密码
    if (item.password) {
      if (!password) {
        throw new Error('需要密码访问');
      }
      if (!this.verifyPassword(password, item.password)) {
        throw new Error('密码错误');
      }
    }

    // 更新访问计数
    item.accessCount++;
    await this.save();

    return item;
  }

  /**
   * 添加评论
   */
  async addComment(shareId, comment) {
    await this.load();
    
    const item = this.sharedItems.get(shareId);
    if (!item) {
      throw new Error(`分享项 "${shareId}" 不存在`);
    }

    if (!item.permissions.includes('comment')) {
      throw new Error('没有评论权限');
    }

    item.comments.push({
      id: this.generateId(),
      content: comment,
      createdAt: new Date().toISOString()
    });

    item.updatedAt = new Date().toISOString();
    await this.save();

    return item;
  }

  /**
   * 删除评论
   */
  async deleteComment(shareId, commentId) {
    await this.load();
    
    const item = this.sharedItems.get(shareId);
    if (!item) {
      throw new Error(`分享项 "${shareId}" 不存在`);
    }

    item.comments = item.comments.filter(c => c.id !== commentId);
    item.updatedAt = new Date().toISOString();
    await this.save();

    return true;
  }

  /**
   * 搜索分享项
   */
  async search(query) {
    await this.load();
    const term = query.toLowerCase();

    return Array.from(this.sharedItems.values())
      .filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
  }

  /**
   * 获取热门分享
   */
  async getPopular(limit = 10) {
    await this.load();

    return Array.from(this.sharedItems.values())
      .filter(item => item.isPublic)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * 导出分享链接
   */
  async exportLink(shareId) {
    await this.load();
    
    const item = this.sharedItems.get(shareId);
    if (!item) {
      throw new Error(`分享项 "${shareId}" 不存在`);
    }

    const baseUrl = 'https://xzchat.app/share';
    return `${baseUrl}/${item.id}`;
  }

  /**
   * 辅助方法
   */
  generateId() {
    return `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  verifyPassword(password, hash) {
    const computed = crypto.createHash('sha256').update(password).digest('hex');
    return computed === hash;
  }
}

export default new ShareManager();
