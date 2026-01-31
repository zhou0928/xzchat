/**
 * 导入管理器 - 数据导入功能
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImportManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/imports.json');
    this.history = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.history = JSON.parse(data);
    } catch (err) {
      this.history = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.history, null, 2));
  }

  async import(source, format, data, options = {}) {
    const record = {
      id: Date.now().toString(),
      source, // 'file', 'url', 'api', 'clipboard'
      format, // 'json', 'csv', 'xml', 'yaml'
      data,
      options: {
        overwrite: false,
        skipDuplicates: true,
        validate: true,
        ...options
      },
      status: 'completed',
      stats: {
        totalRecords: Array.isArray(data) ? data.length : 1,
        imported: Array.isArray(data) ? data.length : 1,
        failed: 0,
        skipped: 0
      },
      timestamp: new Date().toISOString(),
      errors: []
    };

    // 模拟导入处理
    await new Promise(resolve => setTimeout(resolve, 100));

    this.history.push(record);
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
    await this.save();

    return record;
  }

  get(id) {
    return this.history.find(h => h.id === id);
  }

  getAll(limit = 50) {
    return this.history.slice(-limit).reverse();
  }

  getByStatus(status) {
    return this.history.filter(h => h.status === status);
  }

  getByFormat(format) {
    return this.history.filter(h => h.format === format);
  }

  async importFromFile(filePath, format, options = {}) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let data;

      switch (format.toLowerCase()) {
        case 'json':
          data = JSON.parse(content);
          break;
        case 'csv':
          data = this._parseCSV(content);
          break;
        default:
          throw new Error(`不支持的格式: ${format}`);
      }

      return await this.import('file', format, data, options);
    } catch (err) {
      return {
        success: false,
        message: `导入失败: ${err.message}`
      };
    }
  }

  _parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] || '');
      return obj;
    });

    return rows;
  }

  async clearOld(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const before = this.history.length;
    this.history = this.history.filter(h => new Date(h.timestamp) > cutoff);
    const deleted = before - this.history.length;

    await this.save();
    return deleted;
  }

  getStats() {
    return {
      total: this.history.length,
      byStatus: {
        completed: this.history.filter(h => h.status === 'completed').length,
        failed: this.history.filter(h => h.status === 'failed').length,
        pending: this.history.filter(h => h.status === 'pending').length
      },
      byFormat: {
        json: this.history.filter(h => h.format === 'json').length,
        csv: this.history.filter(h => h.format === 'csv').length,
        xml: this.history.filter(h => h.format === 'xml').length,
        yaml: this.history.filter(h => h.format === 'yaml').length
      },
      totalRecords: this.history.reduce((sum, h) => sum + h.stats.imported, 0)
    };
  }
}

export default ImportManager;
