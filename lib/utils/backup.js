import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

/**
 * 数据导入导出管理器
 * 支持完整备份、增量备份和数据迁移
 */
class BackupManager {
  constructor() {
    this.backupDir = path.join(this.getHomeDir(), '.xzchat-backups');
    this.backupIndexPath = path.join(this.backupDir, 'index.json');
    this.backups = new Map();
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async init() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      await this.loadIndex();
    } catch (error) {
      throw new Error(`初始化备份系统失败: ${error.message}`);
    }
  }

  async loadIndex() {
    try {
      const data = await fs.readFile(this.backupIndexPath, 'utf-8');
      const index = JSON.parse(data);
      this.backups = new Map(Object.entries(index));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async saveIndex() {
    const indexObj = {};
    this.backups.forEach((value, key) => {
      indexObj[key] = value;
    });
    await fs.writeFile(this.backupIndexPath, JSON.stringify(indexObj, null, 2));
  }

  /**
   * 创建完整备份
   */
  async createBackup(options = {}) {
    await this.init();

    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    const backupPath = path.join(this.backupDir, `${backupId}.json.gz`);

    // 收集所有数据
    const data = {
      id: backupId,
      timestamp,
      type: 'full',
      version: '2.6.0',
      data: {
        sessions: await this.collectSessions(),
        snippets: await this.collectData('snippets'),
        todos: await this.collectData('todos'),
        bookmarks: await this.collectData('bookmarks'),
        notes: await this.collectData('notes'),
        templates: await this.collectData('templates'),
        personas: await this.collectData('personas'),
        workflows: await this.collectData('workflows'),
        env: await this.collectData('env'),
        cron: await this.collectData('cron'),
        keybinds: await this.collectData('keybinds')
      }
    };

    // 写入并压缩
    await this.writeCompressed(backupPath, data, options.encrypt);

    const backup = {
      id: backupId,
      path: backupPath,
      timestamp,
      type: 'full',
      encrypted: !!options.encrypt,
      size: (await fs.stat(backupPath)).size,
      description: options.description || '完整备份'
    };

    this.backups.set(backupId, backup);
    await this.saveIndex();

    // 清理旧备份
    if (options.keepDays) {
      await this.cleanOldBackups(options.keepDays);
    }

    return backup;
  }

  /**
   * 创建增量备份
   */
  async createIncrementalBackup(lastBackupId) {
    await this.init();

    const lastBackup = this.backups.get(lastBackupId);
    if (!lastBackup) {
      throw new Error(`备份 "${lastBackupId}" 不存在`);
    }

    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    const backupPath = path.join(this.backupDir, `${backupId}.json.gz`);

    // 读取上次备份
    const lastData = await this.readBackup(lastBackup.path, !!lastBackup.encrypted);
    
    // 收集当前数据
    const currentData = {
      sessions: await this.collectSessions(),
      snippets: await this.collectData('snippets'),
      todos: await this.collectData('todos'),
      bookmarks: await this.collectData('bookmarks'),
      notes: await this.collectData('notes'),
      templates: await this.collectData('templates'),
      personas: await this.collectData('personas'),
      workflows: await this.collectData('workflows'),
      env: await this.collectData('env'),
      cron: await this.collectData('cron'),
      keybinds: await this.collectData('keybinds')
    };

    // 计算差异
    const diff = this.calculateDiff(lastData.data, currentData);

    const data = {
      id: backupId,
      timestamp,
      type: 'incremental',
      basedOn: lastBackupId,
      version: '2.6.0',
      data: diff
    };

    await this.writeCompressed(backupPath, data, lastBackup.encrypted);

    const backup = {
      id: backupId,
      path: backupPath,
      timestamp,
      type: 'incremental',
      basedOn: lastBackupId,
      encrypted: !!lastBackup.encrypted,
      size: (await fs.stat(backupPath)).size
    };

    this.backups.set(backupId, backup);
    await this.saveIndex();

    return backup;
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupId, options = {}) {
    await this.init();

    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`备份 "${backupId}" 不存在`);
    }

    const data = await this.readBackup(backup.path, backup.encrypted);

    if (options.preview) {
      return {
        type: 'preview',
        backupId: backup.id,
        timestamp: backup.timestamp,
        summary: this.generateSummary(data.data)
      };
    }

    if (backup.type === 'incremental') {
      // 递归恢复完整数据
      const baseBackup = await this.readBackup(this.backups.get(backup.basedOn).path, backup.encrypted);
      data.data = this.applyDiff(baseBackup.data, data.data);
    }

    // 恢复数据
    await this.restoreData(data.data, options);

    return {
      type: 'restore',
      backupId: backup.id,
      timestamp: backup.timestamp,
      summary: this.generateSummary(data.data)
    };
  }

  /**
   * 列出备份
   */
  async listBackups(filter = {}) {
    await this.init();

    let backups = Array.from(this.backups.values());

    if (filter.type) {
      backups = backups.filter(b => b.type === filter.type);
    }

    if (filter.from || filter.to) {
      backups = backups.filter(b => {
        const date = new Date(b.timestamp);
        if (filter.from && date < new Date(filter.from)) return false;
        if (filter.to && date > new Date(filter.to)) return false;
        return true;
      });
    }

    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId) {
    await this.init();

    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`备份 "${backupId}" 不存在`);
    }

    await fs.unlink(backup.path);
    this.backups.delete(backupId);
    await this.saveIndex();

    return true;
  }

  /**
   * 导出备份到指定路径
   */
  async exportBackup(backupId, targetPath, format = 'json') {
    await this.init();

    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`备份 "${backupId}" 不存在`);
    }

    const data = await this.readBackup(backup.path, backup.encrypted);

    if (format === 'json') {
      await fs.writeFile(targetPath, JSON.stringify(data, null, 2));
    } else if (format === 'gzip') {
      await pipeline(
        createReadStream(backup.path),
        createWriteStream(targetPath)
      );
    } else {
      throw new Error(`不支持的导出格式: ${format}`);
    }

    return targetPath;
  }

  /**
   * 从文件导入备份
   */
  async importBackup(sourcePath, options = {}) {
    await this.init();

    let data;
    
    if (sourcePath.endsWith('.gz')) {
      data = await this.readCompressed(sourcePath, options.decrypt);
    } else {
      const content = await fs.readFile(sourcePath, 'utf-8');
      data = JSON.parse(content);
    }

    const backupId = this.generateBackupId();
    const backupPath = path.join(this.backupDir, `${backupId}.json.gz`);

    await this.writeCompressed(backupPath, data, options.encrypt);

    const backup = {
      id: backupId,
      path: backupPath,
      timestamp: new Date().toISOString(),
      type: 'imported',
      size: (await fs.stat(backupPath)).size
    };

    this.backups.set(backupId, backup);
    await this.saveIndex();

    return backup;
  }

  /**
   * 清理旧备份
   */
  async cleanOldBackups(days = 30) {
    await this.init();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const [id, backup] of this.backups) {
      if (new Date(backup.timestamp) < cutoffDate) {
        await fs.unlink(backup.path);
        this.backups.delete(id);
      }
    }

    await this.saveIndex();
  }

  /**
   * 辅助方法
   */
  generateBackupId() {
    return `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async collectSessions() {
    // 需要从会话管理器获取
    return [];
  }

  async collectData(type) {
    const configPath = path.join(this.getHomeDir(), `.xzchat-${type}.json`);
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async writeCompressed(filePath, data, encrypt = false) {
    let content = JSON.stringify(data);
    
    if (encrypt) {
      content = this.encrypt(content);
    }

    await pipeline(
      createReadableStream(content),
      createGzip(),
      createWriteStream(filePath)
    );
  }

  async readBackup(filePath, decrypt = false) {
    const content = await this.readCompressed(filePath, decrypt);
    return JSON.parse(content);
  }

  async readCompressed(filePath, decrypt = false) {
    let chunks = [];
    
    await pipeline(
      createReadStream(filePath),
      createGunzip(),
      createWritableStream(chunks)
    );

    let content = Buffer.concat(chunks).toString('utf-8');
    
    if (decrypt) {
      content = this.decrypt(content);
    }

    return content;
  }

  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 返回 key + iv + encrypted（实际应用中需要安全存储 key）
    return JSON.stringify({ key: key.toString('hex'), iv: iv.toString('hex'), data: encrypted });
  }

  decrypt(encryptedData) {
    const { key, iv, data } = JSON.parse(encryptedData);
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  calculateDiff(oldData, newData) {
    const diff = {};
    
    for (const key in newData) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        diff[key] = newData[key];
      }
    }
    
    return diff;
  }

  applyDiff(baseData, diff) {
    return {
      ...baseData,
      ...diff
    };
  }

  async restoreData(data, options) {
    for (const [type, content] of Object.entries(data)) {
      const configPath = path.join(this.getHomeDir(), `.xzchat-${type}.json`);
      
      if (options.overwrite) {
        await fs.writeFile(configPath, JSON.stringify(content, null, 2));
      } else {
        // 合并模式
        const existing = await this.collectData(type);
        const merged = { ...existing, ...content };
        await fs.writeFile(configPath, JSON.stringify(merged, null, 2));
      }
    }
  }

  generateSummary(data) {
    return {
      sessions: Object.keys(data.sessions || {}).length,
      snippets: Object.keys(data.snippets || {}).length,
      todos: Object.keys(data.todos || {}).length,
      bookmarks: Object.keys(data.bookmarks || {}).length,
      notes: Object.keys(data.notes || {}).length,
      templates: Object.keys(data.templates || {}).length,
      personas: Object.keys(data.personas || {}).length,
      workflows: Object.keys(data.workflows || {}).length
    };
  }
}

// Stream helpers
function createReadableStream(content) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(Buffer.from(content));
      controller.close();
    }
  });
}

function createWritableStream(chunks) {
  return new WritableStream({
    write(chunk) {
      chunks.push(chunk);
    }
  });
}

export default new BackupManager();
