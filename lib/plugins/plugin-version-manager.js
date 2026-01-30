/**
 * 插件版本控制和管理系统
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export class PluginVersionManager {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.versionsFile = path.join(process.cwd(), '.xzchat-plugin-versions.json');
    this.backupDir = path.join(process.cwd(), '.xzchat-plugin-backups');
    this.versions = new Map();
  }

  /**
   * 初始化版本管理器
   */
  async initialize() {
    await this.loadVersions();
    await this.ensureBackupDir();
  }

  /**
   * 加载版本信息
   */
  async loadVersions() {
    try {
      const data = await fs.readFile(this.versionsFile, 'utf-8');
      const versions = JSON.parse(data);
      versions.forEach(v => this.versions.set(v.id, v));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 保存版本信息
   */
  async saveVersions() {
    const versions = Array.from(this.versions.values());
    await fs.writeFile(
      this.versionsFile,
      JSON.stringify(versions, null, 2)
    );
  }

  /**
   * 确保备份目录存在
   */
  async ensureBackupDir() {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  /**
   * 计算文件哈希
   */
  calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 创建备份
   */
  async createBackup(pluginId, version) {
    const plugin = this.pluginManager.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    const backupId = `${pluginId}_${Date.now()}`;
    const backupPath = path.join(this.backupDir, backupId);
    const pluginPath = path.join(process.cwd(), 'plugins', pluginId);

    await fs.mkdir(backupPath, { recursive: true });

    // 复制插件文件
    const files = await fs.readdir(pluginPath);
    for (const file of files) {
      const src = path.join(pluginPath, file);
      const dest = path.join(backupPath, file);

      const stat = await fs.stat(src);
      if (stat.isDirectory()) {
        await this.copyDirectory(src, dest);
      } else {
        await fs.copyFile(src, dest);
      }
    }

    // 记录备份信息
    const backupInfo = {
      id: backupId,
      pluginId,
      version,
      timestamp: new Date().toISOString(),
      path: backupPath,
      hash: await this.calculatePluginHash(pluginPath)
    };

    return backupInfo;
  }

  /**
   * 复制目录
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const files = await fs.readdir(src);

    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = await fs.stat(srcPath);

      if (stat.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * 计算插件哈希
   */
  async calculatePluginHash(pluginPath) {
    const files = await this.getAllFiles(pluginPath);
    const hashes = [];

    for (const file of files) {
      const content = await fs.readFile(file);
      hashes.push(this.calculateHash(content));
    }

    return this.calculateHash(hashes.join(''));
  }

  /**
   * 获取所有文件
   */
  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 记录版本
   */
  async recordVersion(pluginId, version) {
    const backup = await this.createBackup(pluginId, version);

    this.versions.set(pluginId, {
      id: pluginId,
      currentVersion: version,
      backups: (this.versions.get(pluginId)?.backups || []).concat(backup),
      lastBackup: backup.timestamp
    });

    await this.saveVersions();
    return backup;
  }

  /**
   * 恢复版本
   */
  async restoreVersion(pluginId, backupId) {
    const versionInfo = this.versions.get(pluginId);
    if (!versionInfo) {
      throw new Error(`插件没有版本记录: ${pluginId}`);
    }

    const backup = versionInfo.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`备份不存在: ${backupId}`);
    }

    // 先创建当前版本的备份
    await this.createBackup(pluginId, versionInfo.currentVersion);

    // 恢复文件
    const pluginPath = path.join(process.cwd(), 'plugins', pluginId);
    await fs.rm(pluginPath, { recursive: true, force: true });
    await this.copyDirectory(backup.path, pluginPath);

    return {
      success: true,
      message: `已恢复到版本 ${backup.version}`,
      version: backup.version
    };
  }

  /**
   * 检查兼容性
   */
  checkCompatibility(pluginMetadata, systemVersion) {
    const pluginMinVersion = pluginMetadata.minSystemVersion || '1.0.0';
    const pluginMaxVersion = pluginMetadata.maxSystemVersion || '999.0.0';

    return {
      compatible: this.isVersionInRange(systemVersion, pluginMinVersion, pluginMaxVersion),
      minVersion: pluginMinVersion,
      maxVersion: pluginMaxVersion,
      currentVersion: systemVersion
    };
  }

  /**
   * 版本范围检查
   */
  isVersionInRange(version, minVersion, maxVersion) {
    const v = this.parseVersion(version);
    const min = this.parseVersion(minVersion);
    const max = this.parseVersion(maxVersion);

    for (let i = 0; i < 3; i++) {
      if (v[i] < min[i]) return false;
      if (v[i] > max[i]) return false;
    }

    return true;
  }

  /**
   * 解析版本号
   */
  parseVersion(versionStr) {
    const parts = versionStr.split('.').map(Number);
    while (parts.length < 3) parts.push(0);
    return parts;
  }

  /**
   * 清理旧备份
   */
  async cleanupOldBackups(pluginId, keep = 5) {
    const versionInfo = this.versions.get(pluginId);
    if (!versionInfo || versionInfo.backups.length <= keep) {
      return;
    }

    const toDelete = versionInfo.backups
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(0, versionInfo.backups.length - keep);

    for (const backup of toDelete) {
      await fs.rm(backup.path, { recursive: true, force: true });
    }

    versionInfo.backups = versionInfo.backups.filter(b => !toDelete.includes(b));
    await this.saveVersions();

    return {
      deleted: toDelete.length,
      remaining: versionInfo.backups.length
    };
  }

  /**
   * 获取版本历史
   */
  getVersionHistory(pluginId) {
    const versionInfo = this.versions.get(pluginId);
    if (!versionInfo) {
      return [];
    }

    return versionInfo.backups
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(backup => ({
        id: backup.id,
        version: backup.version,
        timestamp: backup.timestamp,
        hash: backup.hash
      }));
  }

  /**
   * 验证插件完整性
   */
  async verifyIntegrity(pluginId) {
    const versionInfo = this.versions.get(pluginId);
    if (!versionInfo) {
      return {
        verified: false,
        reason: '没有版本记录'
      };
    }

    const pluginPath = path.join(process.cwd(), 'plugins', pluginId);
    const currentHash = await this.calculatePluginHash(pluginPath);
    const lastBackup = versionInfo.backups[versionInfo.backups.length - 1];

    return {
      verified: currentHash === lastBackup?.hash,
      currentHash,
      backupHash: lastBackup?.hash,
      lastBackup: lastBackup?.timestamp
    };
  }
}
