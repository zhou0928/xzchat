/**
 * 插件性能监控和日志系统
 */

import { promises as fs } from 'fs';
import path from 'path';

export class PluginPerformanceMonitor {
  constructor(pluginManager) {
    // 支持传入对象或pluginManager
    this.pluginManager = pluginManager?.plugins ? pluginManager : { plugins: pluginManager || new Map() };
    this.metrics = new Map();
    this.logs = [];
    this.metricsFile = path.join(process.cwd(), '.xzchat-plugin-metrics.json');
    this.logsFile = path.join(process.cwd(), '.xzchat-plugin-logs.json');
    this.maxLogSize = 10000;
  }

  /**
   * 初始化
   */
  async initialize() {
    await this.loadMetrics();
    await this.loadLogs();
  }

  /**
   * 加载指标
   */
  async loadMetrics() {
    try {
      const data = await fs.readFile(this.metricsFile, 'utf-8');
      const metrics = JSON.parse(data);
      metrics.forEach(m => this.metrics.set(m.pluginId, m));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 保存指标
   */
  async saveMetrics() {
    const metrics = Array.from(this.metrics.values());
    await fs.writeFile(
      this.metricsFile,
      JSON.stringify(metrics, null, 2)
    );
  }

  /**
   * 加载日志
   */
  async loadLogs() {
    try {
      const data = await fs.readFile(this.logsFile, 'utf-8');
      this.logs = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 保存日志
   */
  async saveLogs() {
    await fs.writeFile(
      this.logsFile,
      JSON.stringify(this.logs, null, 2)
    );
  }

  /**
   * 记录性能指标
   */
  recordMetric(pluginId, operation, duration, metadata = {}) {
    if (!this.metrics.has(pluginId)) {
      this.metrics.set(pluginId, {
        pluginId,
        operations: {},
        errors: 0,
        totalDuration: 0,
        operationCount: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    const metric = this.metrics.get(pluginId);

    // 记录操作指标
    if (!metric.operations[operation]) {
      metric.operations[operation] = {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0
      };
    }

    const opMetric = metric.operations[operation];
    opMetric.count++;
    opMetric.totalDuration += duration;
    opMetric.minDuration = Math.min(opMetric.minDuration, duration);
    opMetric.maxDuration = Math.max(opMetric.maxDuration, duration);
    opMetric.avgDuration = opMetric.totalDuration / opMetric.count;

    // 更新总体指标
    metric.totalDuration += duration;
    metric.operationCount++;
    metric.lastUpdated = new Date().toISOString();

    // 添加元数据
    Object.assign(metric, metadata);
  }

  /**
   * 记录错误
   */
  recordError(pluginId, operation, error) {
    // 确保metric存在
    if (!this.metrics.has(pluginId)) {
      this.metrics.set(pluginId, {
        pluginId,
        operations: {},
        errors: 0,
        totalDuration: 0,
        operationCount: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    const metric = this.metrics.get(pluginId);
    metric.errors++;
    metric.lastUpdated = new Date().toISOString();

    this.addLog(pluginId, 'error', {
      operation,
      error: error.message || error,
      stack: error.stack
    });
  }

  /**
   * 添加日志
   */
  addLog(pluginId, level, data) {
    const log = {
      id: `${pluginId}_${Date.now()}_${Math.random().toString(36).substr(2)}`,
      pluginId,
      level,
      timestamp: new Date().toISOString(),
      ...data
    };

    this.logs.push(log);

    // 限制日志大小
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  /**
   * 获取插件指标
   */
  getMetrics(pluginId) {
    return this.metrics.get(pluginId);
  }

  /**
   * 获取所有指标
   */
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const report = {
      totalPlugins: this.metrics.size,
      totalOperations: 0,
      totalErrors: 0,
      totalDuration: 0,
      topPluginsByOperations: [],
      topPluginsByErrors: [],
      topPluginsByDuration: [],
      slowOperations: []
    };

    for (const metric of this.metrics.values()) {
      report.totalOperations += metric.operationCount;
      report.totalErrors += metric.errors;
      report.totalDuration += metric.totalDuration;

      // 收集慢操作
      for (const [op, opMetric] of Object.entries(metric.operations)) {
        if (opMetric.avgDuration > 1000) {
          report.slowOperations.push({
            pluginId: metric.pluginId,
            operation: op,
            avgDuration: opMetric.avgDuration,
            maxDuration: opMetric.maxDuration
          });
        }
      }
    }

    // 排序
    const sortedByOps = Array.from(this.metrics.values())
      .sort((a, b) => b.operationCount - a.operationCount);
    report.topPluginsByOperations = sortedByOps.slice(0, 10);

    const sortedByErrs = Array.from(this.metrics.values())
      .sort((a, b) => b.errors - a.errors);
    report.topPluginsByErrors = sortedByErrs.slice(0, 10);

    const sortedByDur = Array.from(this.metrics.values())
      .sort((a, b) => b.totalDuration - a.totalDuration);
    report.topPluginsByDuration = sortedByDur.slice(0, 10);

    report.slowOperations.sort((a, b) => b.avgDuration - a.avgDuration);
    report.slowOperations = report.slowOperations.slice(0, 10);

    return report;
  }

  /**
   * 获取日志
   */
  getLogs(pluginId, level = null, limit = 100) {
    let filtered = this.logs;

    if (pluginId) {
      filtered = filtered.filter(log => log.pluginId === pluginId);
    }

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * 清除日志
   */
  clearLogs(pluginId = null, beforeDate = null) {
    if (pluginId) {
      if (beforeDate) {
        this.logs = this.logs.filter(log =>
          log.pluginId !== pluginId || new Date(log.timestamp) >= new Date(beforeDate)
        );
      } else {
        this.logs = this.logs.filter(log => log.pluginId !== pluginId);
      }
    } else if (beforeDate) {
      this.logs = this.logs.filter(log => new Date(log.timestamp) >= new Date(beforeDate));
    } else {
      this.logs = [];
    }
  }

  /**
   * 重置指标
   */
  resetMetrics(pluginId = null) {
    if (pluginId) {
      this.metrics.delete(pluginId);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * 导出报告
   */
  async exportReport(format = 'json') {
    const report = {
      generatedAt: new Date().toISOString(),
      metrics: this.getAllMetrics(),
      performance: this.getPerformanceReport(),
      recentLogs: this.getLogs(null, 'error', 50)
    };

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'text') {
      return this.formatTextReport(report);
    }
  }

  /**
   * 格式化文本报告
   */
  formatTextReport(report) {
    const lines = [];

    lines.push('=== 插件性能报告 ===');
    lines.push(`生成时间: ${report.generatedAt}`);
    lines.push('');

    lines.push('--- 概览 ---');
    lines.push(`总插件数: ${report.performance.totalPlugins}`);
    lines.push(`总操作数: ${report.performance.totalOperations}`);
    lines.push(`总错误数: ${report.performance.totalErrors}`);
    lines.push(`总耗时: ${Math.round(report.performance.totalDuration / 1000)}s`);
    lines.push('');

    lines.push('--- 操作最多的插件 ---');
    report.performance.topPluginsByOperations.forEach((m, i) => {
      lines.push(`${i + 1}. ${m.pluginId}: ${m.operationCount} 次操作`);
    });
    lines.push('');

    lines.push('--- 错误最多的插件 ---');
    report.performance.topPluginsByErrors.forEach((m, i) => {
      lines.push(`${i + 1}. ${m.pluginId}: ${m.errors} 个错误`);
    });
    lines.push('');

    lines.push('--- 最慢的操作 ---');
    report.performance.slowOperations.forEach((op, i) => {
      lines.push(`${i + 1}. ${op.pluginId}::${op.operation}`);
      lines.push(`   平均: ${Math.round(op.avgDuration)}ms, 最大: ${Math.round(op.maxDuration)}ms`);
    });

    return lines.join('\n');
  }

  /**
   * 监控执行时间
   */
  monitor(pluginId, operation, fn) {
    const startTime = Date.now();

    return fn()
      .then(result => {
        const duration = Date.now() - startTime;
        this.recordMetric(pluginId, operation, duration);
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        this.recordError(pluginId, operation, error);
        throw error;
      });
  }

  /**
   * 异步监控
   */
  async monitorAsync(pluginId, operation, fn) {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.recordMetric(pluginId, operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordError(pluginId, operation, error);
      throw error;
    }
  }
}
