/**
 * 归档管理器 - 数据归档和备份
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ArchiveManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/archives.json');
    this.archives = [];
    this.archiveDir = path.join(__dirname, '../../archives');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.archiveDir, { recursive: true });

      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.archives = JSON.parse(data);
    } catch (err) {
      this.archives = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.archives, null, 2));
  }

  async create(name, data, options = {}) {
    const id = crypto.randomUUID();
    const filename = `${name}_${Date.now()}.json`;
    const filepath = path.join(this.archiveDir, filename);

    const archive = {
      id,
      name,
      type: options.type || 'backup',
      description: options.description || '',
      filename,
      filepath,
      data,
      size: JSON.stringify(data).length,
      checksum: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
      options: {
        compress: options.compress || false,
        encrypt: options.encrypt || false,
        ...options
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: options.expiresAt || null,
      restoreCount: 0
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    this.archives.push(archive);
    await this.save();

    return archive;
  }

  get(id) {
    return this.archives.find(a => a.id === id);
  }

  getAll() {
    return this.archives;
  }

  getByName(name) {
    return this.archives.filter(a => a.name === name);
  }

  getByType(type) {
    return this.archives.filter(a => a.type === type);
  }

  async restore(id) {
    const archive = this.get(id);
    if (!archive) {
      return { success: false, message: '归档不存在' };
    }

    try {
      const content = await fs.readFile(archive.filepath, 'utf-8');
      const data = JSON.parse(content);

      archive.restoreCount++;
      await this.save();

      return {
        success: true,
        message: `归档 "${archive.name}" 已恢复`,
        data
      };
    } catch (err) {
      return {
        success: false,
        message: `恢复失败: ${err.message}`
      };
    }
  }

  async remove(id) {
    const index = this.archives.findIndex(a => a.id === id);
    if (index !== -1) {
      const removed = this.archives.splice(index, 1)[0];

      try {
        await fs.unlink(removed.filepath);
      } catch (err) {
        // 文件可能已被删除，忽略错误
      }

      await this.save();
      return removed;
    }
    return null;
  }

  async verify(id) {
    const archive = this.get(id);
    if (!archive) {
      return { success: false, message: '归档不存在' };
    }

    try {
      const content = await fs.readFile(archive.filepath, 'utf-8');
      const currentChecksum = crypto.createHash('sha256').update(content).digest('hex');

      const isMatch = currentChecksum === archive.checksum;

      return {
        success: true,
        message: isMatch ? '✅ 归档完整性验证通过' : '❌ 归档已损坏',
        data: {
          valid: isMatch,
          expectedChecksum: archive.checksum,
          actualChecksum: currentChecksum
        }
      };
    } catch (err) {
      return {
        success: false,
        message: `验证失败: ${err.message}`
      };
    }
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.archives.filter(a =>
      a.name.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower)
    );
  }

  async cleanup(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    let deleted = 0;

    for (let i = this.archives.length - 1; i >= 0; i--) {
      const archive = this.archives[i];

      // 删除过期归档
      if (archive.expiresAt && new Date(archive.expiresAt) < new Date()) {
        await this.remove(archive.id);
        deleted++;
        continue;
      }

      // 删除旧归档
      if (new Date(archive.createdAt) < cutoff) {
        await this.remove(archive.id);
        deleted++;
      }
    }

    return deleted;
  }

  getStats() {
    const totalSize = this.archives.reduce((sum, a) => sum + a.size, 0);

    return {
      total: this.archives.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      byType: {
        backup: this.archives.filter(a => a.type === 'backup').length,
        snapshot: this.archives.filter(a => a.type === 'snapshot').length,
        manual: this.archives.filter(a => a.type === 'manual').length
      },
      totalRestores: this.archives.reduce((sum, a) => sum + a.restoreCount, 0),
      expired: this.archives.filter(a => a.expiresAt && new Date(a.expiresAt) < new Date()).length
    };
  }
}

module.exports = ArchiveManager;
