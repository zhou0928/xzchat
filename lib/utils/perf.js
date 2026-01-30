import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'perf-history.json');

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  constructor() {
    this.sessions = new Map();
    this.history = [];
    this.loadHistory();
  }

  async loadHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(data);
    } catch (error) {
      this.history = [];
    }
  }

  async saveHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存历史失败:', error.message);
    }
  }

  start(label = 'session') {
    const session = {
      label,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      cpu: 0,
      memory: 0,
      operations: 0
    };

    this.sessions.set(label, session);
    return session;
  }

  stop(label = 'session') {
    const session = this.sessions.get(label);

    if (!session) {
      return { success: false, error: `会话 "${label}" 不存在` };
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    session.cpu = process.cpuUsage().user / 1000000;
    session.memory = process.memoryUsage().heapUsed / 1024 / 1024;

    this.sessions.delete(label);
    this.history.unshift(session);

    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveHistory();

    return { success: false, ...session };
  }

  getReport(label) {
    if (label === 'latest') {
      return this.history[0] || null;
    }
    return this.sessions.get(label) || this.history.find(h => h.label === label);
  }

  getHistory(limit = 10) {
    return this.history.slice(0, limit);
  }

  compareSessions(label1, label2) {
    const session1 = this.getReport(label1);
    const session2 = this.getReport(label2);

    if (!session1 || !session2) {
      return null;
    }

    const timeDiff = session2.duration - session1.duration;
    const percentDiff = ((timeDiff / session1.duration) * 100).toFixed(2);

    return {
      session1,
      session2,
      diff: {
        timeDiff,
        percentDiff: parseFloat(percentDiff)
      }
    };
  }

  analyzePerformance(label) {
    const session = this.getReport(label);

    if (!session) {
      return null;
    }

    let score = 100;
    const recommendations = [];

    if (session.duration > 5000) {
      score -= 20;
      recommendations.push('执行时间过长，建议优化算法');
    } else if (session.duration > 2000) {
      score -= 10;
      recommendations.push('考虑缓存中间结果');
    }

    if (session.memory > 100) {
      score -= 15;
      recommendations.push('内存使用较高，检查内存泄漏');
    }

    if (session.cpu > 50) {
      score -= 10;
      recommendations.push('CPU使用率较高，考虑异步处理');
    }

    return {
      label: session.label,
      score: Math.max(0, score),
      recommendations
    };
  }

  identifyBottlenecks() {
    const bottlenecks = [];

    if (this.history.length < 2) {
      return bottlenecks;
    }

    const latest = this.history[0];
    const avgDuration = this.history.slice(0, 5).reduce((sum, h) => sum + h.duration, 0) / 5;

    if (latest.duration > avgDuration * 1.5) {
      bottlenecks.push({
        type: '执行时间',
        severity: 'high',
        impact: `${((latest.duration / avgDuration - 1) * 100).toFixed(0)}% 慢于平均`,
        suggestion: '分析最近的性能下降原因'
      });
    }

    return bottlenecks;
  }

  exportReport(filePath) {
    try {
      const data = JSON.stringify(this.history, null, 2);
      fs.writeFile(filePath, data, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
