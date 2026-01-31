/**
 * 审计日志管理器 - 操作审计和安全日志
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AuditManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/audit-logs.json');
    this.logs = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.logs = JSON.parse(data);
    } catch (err) {
      this.logs = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.logs, null, 2));
  }

  add(action, details, userId = 'system', level = 'info', success = true) {
    const log = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action, // 操作类型：create, read, update, delete, login, logout等
      details,
      userId,
      level, // 'info', 'warning', 'error', 'critical'
      success,
      ip: null, // 可选的IP地址
      userAgent: null // 可选的用户代理
    };
    this.logs.push(log);

    // 限制日志数量
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    this.save();
    return log;
  }

  get(id) {
    return this.logs.find(l => l.id === id);
  }

  getAll(filters = {}) {
    let filtered = [...this.logs];

    if (filters.action) {
      filtered = filtered.filter(l => l.action === filters.action);
    }
    if (filters.userId) {
      filtered = filtered.filter(l => l.userId === filters.userId);
    }
    if (filters.level) {
      filtered = filtered.filter(l => l.level === filters.level);
    }
    if (filters.success !== undefined) {
      filtered = filtered.filter(l => l.success === filters.success);
    }
    if (filters.startDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
    }

    return filtered.reverse();
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.logs.filter(l =>
      l.action.toLowerCase().includes(lower) ||
      (typeof l.details === 'string' && l.details.toLowerCase().includes(lower))
    );
  }

  getStats() {
    return {
      total: this.logs.length,
      byLevel: {
        info: this.logs.filter(l => l.level === 'info').length,
        warning: this.logs.filter(l => l.level === 'warning').length,
        error: this.logs.filter(l => l.level === 'error').length,
        critical: this.logs.filter(l => l.level === 'critical').length
      },
      byAction: this._countBy('action'),
      byUser: this._countBy('userId'),
      successRate: this.logs.length > 0
        ? (this.logs.filter(l => l.success).length / this.logs.length * 100).toFixed(2)
        : 0
    };
  }

  _countBy(field) {
    const counts = {};
    this.logs.forEach(log => {
      const key = log[field];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  export(format = 'json', filters = {}) {
    const logs = this.getAll(filters);

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      case 'csv':
        return this._toCSV(logs);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  _toCSV(logs) {
    if (logs.length === 0) return '';
    const headers = ['id', 'timestamp', 'action', 'userId', 'level', 'success', 'details'];
    const rows = logs.map(log =>
      headers.map(h => {
        const value = log[h];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  clearOlderThan(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(l => new Date(l.timestamp) > cutoff);
    const deletedCount = beforeCount - this.logs.length;
    this.save();
    return deletedCount;
  }

  clearAll() {
    this.logs = [];
    this.save();
  }
}

export default AuditManager;
