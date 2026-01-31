/**
 * 高级导出管理器 - 灵活的数据导出功能
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExportAdvancedManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/exports.json');
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

  async export(data, format, destination, options = {}) {
    const record = {
      id: Date.now().toString(),
      format, // 'json', 'csv', 'xml', 'yaml', 'pdf', 'excel'
      destination, // 'file', 'api', 'clipboard', 'email'
      data,
      options: {
        includeHeaders: true,
        compress: false,
        encrypt: false,
        ...options
      },
      status: 'completed',
      stats: {
        totalRecords: Array.isArray(data) ? data.length : 1,
        size: 0
      },
      outputPath: null,
      timestamp: new Date().toISOString(),
      errors: []
    };

    let exportData;
    try {
      switch (format.toLowerCase()) {
        case 'json':
          exportData = JSON.stringify(data, null, 2);
          break;
        case 'csv':
          exportData = this._toCSV(data);
          break;
        case 'xml':
          exportData = this._toXML(data);
          break;
        default:
          throw new Error(`不支持的格式: ${format}`);
      }

      record.stats.size = exportData.length;

      if (destination === 'file') {
        const filename = `export_${Date.now()}.${format}`;
        const filepath = path.join(__dirname, '../../exports', filename);
        await fs.writeFile(filepath, exportData);
        record.outputPath = filepath;
      }

      record.exportData = exportData;
    } catch (err) {
      record.status = 'failed';
      record.errors.push(err.message);
    }

    this.history.push(record);
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
    await this.save();

    return record;
  }

  _toCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const value = row[h];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  _toXML(data, root = 'root') {
    if (Array.isArray(data)) {
      const items = data.map(item => this._toXML(item, 'item')).join('');
      return `<${root}>${items}</${root}>`;
    } else if (typeof data === 'object' && data !== null) {
      const items = Object.entries(data)
        .map(([k, v]) => `<${k}>${this._toXML(v)}</${k}>`)
        .join('');
      return `<${root}>${items}</${root}>`;
    } else {
      return String(data);
    }
  }

  get(id) {
    return this.history.find(h => h.id === id);
  }

  getAll(limit = 50) {
    return this.history.slice(-limit).reverse();
  }

  getByFormat(format) {
    return this.history.filter(h => h.format === format);
  }

  getByDestination(destination) {
    return this.history.filter(h => h.destination === destination);
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
      byFormat: {
        json: this.history.filter(h => h.format === 'json').length,
        csv: this.history.filter(h => h.format === 'csv').length,
        xml: this.history.filter(h => h.format === 'xml').length,
        yaml: this.history.filter(h => h.format === 'yaml').length
      },
      byDestination: {
        file: this.history.filter(h => h.destination === 'file').length,
        api: this.history.filter(h => h.destination === 'api').length,
        clipboard: this.history.filter(h => h.destination === 'clipboard').length
      },
      totalSize: this.history.reduce((sum, h) => sum + (h.stats?.size || 0), 0)
    };
  }
}

export default ExportAdvancedManager;
