/**
 * 插件性能监控测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PluginPerformanceMonitor } from '../../lib/plugins/plugin-performance-monitor.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(() => Promise.reject({ code: 'ENOENT' })),
  writeFile: vi.fn(() => Promise.resolve())
}));
vi.mock('fs', () => ({
  existsSync: vi.fn(() => false)
}));

describe('PluginPerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PluginPerformanceMonitor({ plugins: new Map() });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await monitor.saveMetrics();
    await monitor.saveLogs();
  });

  describe('recordMetric', () => {
    it('should record performance metric', () => {
      monitor.recordMetric('test-plugin', 'operation', 100);

      const metric = monitor.getMetrics('test-plugin');

      expect(metric).toBeDefined();
      expect(metric.pluginId).toBe('test-plugin');
      expect(metric.operations.operation).toBeDefined();
      expect(metric.operations.operation.count).toBe(1);
      expect(metric.operations.operation.totalDuration).toBe(100);
    });

    it('should track min and max duration', () => {
      monitor.recordMetric('test-plugin', 'operation', 100);
      monitor.recordMetric('test-plugin', 'operation', 200);
      monitor.recordMetric('test-plugin', 'operation', 50);

      const metric = monitor.getMetrics('test-plugin');

      expect(metric.operations.operation.minDuration).toBe(50);
      expect(metric.operations.operation.maxDuration).toBe(200);
    });

    it('should calculate average duration', () => {
      monitor.recordMetric('test-plugin', 'operation', 100);
      monitor.recordMetric('test-plugin', 'operation', 200);
      monitor.recordMetric('test-plugin', 'operation', 300);

      const metric = monitor.getMetrics('test-plugin');

      expect(metric.operations.operation.avgDuration).toBe(200);
    });

    it('should update last timestamp', () => {
      const before = Date.now();
      monitor.recordMetric('test-plugin', 'operation', 100);
      const after = Date.now();

      const metric = monitor.getMetrics('test-plugin');
      const lastUpdated = new Date(metric.lastUpdated).getTime();

      expect(lastUpdated).toBeGreaterThanOrEqual(before);
      expect(lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe('recordError', () => {
    it('should record error count', () => {
      const error = new Error('Test error');
      monitor.recordError('test-plugin', 'operation', error);

      const metric = monitor.getMetrics('test-plugin');

      expect(metric.errors).toBe(1);
    });

    it('should add error log', () => {
      const error = new Error('Test error');
      monitor.recordError('test-plugin', 'operation', error);

      const logs = monitor.getLogs('test-plugin', 'error');

      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].operation).toBe('operation');
      expect(logs[0].error).toBe('Test error');
      expect(logs[0].stack).toBeDefined();
    });

    it('should increment error count on multiple errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      monitor.recordError('test-plugin', 'operation', error1);
      monitor.recordError('test-plugin', 'operation', error2);

      const metric = monitor.getMetrics('test-plugin');

      expect(metric.errors).toBe(2);
    });
  });

  describe('addLog', () => {
    it('should add log entry', () => {
      monitor.addLog('test-plugin', 'info', { message: 'Test log' });

      const logs = monitor.getLogs('test-plugin');

      expect(logs.length).toBe(1);
      expect(logs[0].pluginId).toBe('test-plugin');
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test log');
    });

    it('should generate unique log ID', () => {
      const log1 = monitor.addLog('test-plugin', 'info', { message: 'Log 1' });
      const log2 = monitor.addLog('test-plugin', 'info', { message: 'Log 2' });

      const logs = monitor.getLogs('test-plugin');

      expect(logs[0].id).toBeDefined();
      expect(logs[1].id).toBeDefined();
      expect(logs[0].id).not.toBe(logs[1].id);
    });

    it('should limit log size', () => {
      monitor.maxLogSize = 5;

      for (let i = 0; i < 10; i++) {
        monitor.addLog('test-plugin', 'info', { message: `Log ${i}` });
      }

      const logs = monitor.getLogs('test-plugin');

      expect(logs.length).toBe(5);
      expect(logs[0].message).toBe('Log 5');
      expect(logs[4].message).toBe('Log 9');
    });
  });

  describe('getLogs', () => {
    it('should filter logs by plugin ID', () => {
      monitor.addLog('plugin-1', 'info', { message: 'Log 1' });
      monitor.addLog('plugin-2', 'info', { message: 'Log 2' });
      monitor.addLog('plugin-1', 'info', { message: 'Log 3' });

      const logs = monitor.getLogs('plugin-1');

      expect(logs.length).toBe(2);
      expect(logs.every(log => log.pluginId === 'plugin-1')).toBe(true);
    });

    it('should filter logs by level', () => {
      monitor.addLog('test-plugin', 'info', { message: 'Info' });
      monitor.addLog('test-plugin', 'error', { message: 'Error' });
      monitor.addLog('test-plugin', 'info', { message: 'Info 2' });

      const logs = monitor.getLogs('test-plugin', 'error');

      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('error');
    });

    it('should limit number of logs', () => {
      for (let i = 0; i < 10; i++) {
        monitor.addLog('test-plugin', 'info', { message: `Log ${i}` });
      }

      const logs = monitor.getLogs('test-plugin', null, 5);

      expect(logs.length).toBe(5);
    });

    it('should return logs sorted by timestamp descending', () => {
      monitor.addLog('test-plugin', 'info', { message: 'Log 1' });
      monitor.addLog('test-plugin', 'info', { message: 'Log 2' });
      monitor.addLog('test-plugin', 'info', { message: 'Log 3' });

      const logs = monitor.getLogs('test-plugin');

      expect(logs[0].message).toBe('Log 3');
      expect(logs[1].message).toBe('Log 2');
      expect(logs[2].message).toBe('Log 1');
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      monitor.addLog('test-plugin', 'info', { message: 'Log 1' });
      monitor.addLog('test-plugin', 'info', { message: 'Log 2' });

      monitor.clearLogs();

      const logs = monitor.getLogs('test-plugin');

      expect(logs.length).toBe(0);
    });

    it('should clear logs for specific plugin', () => {
      monitor.addLog('plugin-1', 'info', { message: 'Log 1' });
      monitor.addLog('plugin-2', 'info', { message: 'Log 2' });

      monitor.clearLogs('plugin-1');

      const logs1 = monitor.getLogs('plugin-1');
      const logs2 = monitor.getLogs('plugin-2');

      expect(logs1.length).toBe(0);
      expect(logs2.length).toBe(1);
    });

    it('should clear logs before date', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      monitor.addLog('test-plugin', 'info', { message: 'Log 1', timestamp: date1.toISOString() });
      monitor.addLog('test-plugin', 'info', { message: 'Log 2', timestamp: date2.toISOString() });
      monitor.addLog('test-plugin', 'info', { message: 'Log 3', timestamp: date3.toISOString() });

      monitor.clearLogs(null, '2024-01-03');

      const logs = monitor.getLogs('test-plugin');

      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Log 3');
    });
  });

  describe('resetMetrics', () => {
    it('should reset specific plugin metrics', () => {
      monitor.recordMetric('plugin-1', 'op1', 100);
      monitor.recordMetric('plugin-2', 'op2', 200);

      monitor.resetMetrics('plugin-1');

      expect(monitor.getMetrics('plugin-1')).toBeUndefined();
      expect(monitor.getMetrics('plugin-2')).toBeDefined();
    });

    it('should reset all metrics', () => {
      monitor.recordMetric('plugin-1', 'op1', 100);
      monitor.recordMetric('plugin-2', 'op2', 200);

      monitor.resetMetrics();

      expect(monitor.getMetrics('plugin-1')).toBeUndefined();
      expect(monitor.getMetrics('plugin-2')).toBeUndefined();
    });
  });

  describe('getPerformanceReport', () => {
    it('should generate performance report', () => {
      monitor.recordMetric('plugin-1', 'op1', 100);
      monitor.recordMetric('plugin-1', 'op2', 200);
      monitor.recordError('plugin-1', 'op1', new Error('Test error'));

      const report = monitor.getPerformanceReport();

      expect(report.totalPlugins).toBe(1);
      expect(report.totalOperations).toBe(2);
      expect(report.totalErrors).toBe(1);
      expect(report.totalDuration).toBe(300);
    });

    it('should identify slow operations', () => {
      monitor.recordMetric('plugin-1', 'fast', 100);
      monitor.recordMetric('plugin-1', 'slow', 1500);
      monitor.recordMetric('plugin-1', 'slow', 2000);

      const report = monitor.getPerformanceReport();

      expect(report.slowOperations.length).toBe(1);
      expect(report.slowOperations[0].operation).toBe('slow');
    });

    it('should sort top plugins by operations', () => {
      monitor.recordMetric('plugin-1', 'op1', 100);
      monitor.recordMetric('plugin-1', 'op2', 200);
      monitor.recordMetric('plugin-2', 'op1', 100);

      const report = monitor.getPerformanceReport();

      expect(report.topPluginsByOperations[0].pluginId).toBe('plugin-1');
      expect(report.topPluginsByOperations[0].operationCount).toBe(2);
    });

    it('should sort top plugins by errors', () => {
      monitor.recordError('plugin-1', 'op1', new Error('Error'));
      monitor.recordError('plugin-1', 'op2', new Error('Error'));
      monitor.recordError('plugin-2', 'op1', new Error('Error'));

      const report = monitor.getPerformanceReport();

      expect(report.topPluginsByErrors[0].pluginId).toBe('plugin-1');
      expect(report.topPluginsByErrors[0].errors).toBe(2);
    });
  });

  describe('exportReport', () => {
    it('should export JSON report', async () => {
      monitor.recordMetric('test-plugin', 'operation', 100);

      const report = await monitor.exportReport('json');
      const parsed = JSON.parse(report);

      expect(parsed).toHaveProperty('generatedAt');
      expect(parsed).toHaveProperty('metrics');
      expect(parsed).toHaveProperty('performance');
      expect(parsed).toHaveProperty('recentLogs');
    });

    it('should export text report', async () => {
      monitor.recordMetric('test-plugin', 'operation', 100);

      const report = await monitor.exportReport('text');

      expect(typeof report).toBe('string');
      expect(report).toContain('插件性能报告');
      expect(report).toContain('概览');
    });
  });

  describe('monitorAsync', () => {
    it('should monitor async operation success', async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };

      const result = await monitor.monitorAsync('test-plugin', 'test-op', fn);

      expect(result).toBe('result');

      const metric = monitor.getMetrics('test-plugin');
      expect(metric.operations['test-op'].count).toBe(1);
    });

    it('should monitor async operation error', async () => {
      const error = new Error('Test error');
      const fn = async () => {
        throw error;
      };

      await expect(monitor.monitorAsync('test-plugin', 'test-op', fn))
        .rejects.toThrow('Test error');

      const metric = monitor.getMetrics('test-plugin');
      expect(metric.errors).toBe(1);

      const logs = monitor.getLogs('test-plugin', 'error');
      expect(logs.length).toBe(1);
    });

    it('should measure duration correctly', async () => {
      const duration = 50;
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, duration));
        return 'result';
      };

      await monitor.monitorAsync('test-plugin', 'test-op', fn);

      const metric = monitor.getMetrics('test-plugin');
      expect(metric.operations['test-op'].totalDuration).toBeGreaterThanOrEqual(duration);
    });
  });
});
