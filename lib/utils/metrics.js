import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const METRICS_FILE = path.join(DATA_DIR, 'metrics.json');

/**
 * 性能指标管理器
 * 记录和分析性能指标
 */
export class MetricsManager {
  constructor() {
    this.metrics = [];
    this.loadMetrics();
  }

  async loadMetrics() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(METRICS_FILE, 'utf-8');
      this.metrics = JSON.parse(data);
    } catch (error) {
      this.metrics = [];
      await this.saveMetrics();
    }
  }

  async saveMetrics() {
    await fs.writeFile(METRICS_FILE, JSON.stringify(this.metrics, null, 2), 'utf-8');
  }

  recordMetric(name, value, tags = {}) {
    this.metrics.push({
      id: Date.now().toString(),
      name,
      value,
      tags,
      timestamp: new Date().toISOString()
    });
    if (this.metrics.length > 1000) this.metrics = this.metrics.slice(-1000);
    this.saveMetrics();
    return { success: true };
  }

  getMetrics(name, timeRange = '1h') {
    const now = Date.now();
    const ranges = { '1h': 3600000, '24h': 86400000, '7d': 604800000 };
    const since = now - (ranges[timeRange] || ranges['1h']);

    return this.metrics.filter(m => {
      const matchName = !name || m.name === name;
      const matchTime = new Date(m.timestamp).getTime() > since;
      return matchName && matchTime;
    });
  }

  getStats(name, timeRange) {
    const metrics = this.getMetrics(name, timeRange);
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      sum: values.reduce((a, b) => a + b, 0)
    };
  }
}
