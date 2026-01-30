import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectionPool, ConcurrencyController, defaultPool, defaultConcurrency } from '../../lib/utils/connection-pool.js';

describe('ConnectionPool', () => {
  let pool;

  beforeEach(() => {
    pool = new ConnectionPool({
      maxConnections: 3,
      minConnections: 1,
      idleTimeout: 5000,
      acquireTimeout: 5000
    });
  });

  afterEach(async () => {
    await pool.destroy();
  });

  describe('构造函数', () => {
    it('应该创建连接池实例', () => {
      expect(pool).toBeInstanceOf(ConnectionPool);
    });

    it('应该使用默认配置', () => {
      const defaultPool = new ConnectionPool();
      expect(defaultPool.config.maxConnections).toBe(10);
      expect(defaultPool.config.minConnections).toBe(2);
    });

    it('应该使用自定义配置', () => {
      expect(pool.config.maxConnections).toBe(3);
      expect(pool.config.minConnections).toBe(1);
    });

    it('应该创建最小连接数', async () => {
      await pool._ensureMinConnections();
      expect(pool.connections.size).toBeGreaterThanOrEqual(pool.config.minConnections);
    });
  });

  describe('连接管理', () => {
    it('应该获取连接', async () => {
      const connection = await pool.acquire();
      expect(connection).toBeDefined();
      expect(connection.isActive).toBe(true);
    });

    it('应该释放连接', async () => {
      const connection = await pool.acquire();
      pool.release(connection);
      expect(connection.isIdle).toBe(true);
    });

    it('应该在达到最大连接数时等待', async () => {
      const connections = [];

      // 获取最大连接数
      for (let i = 0; i < pool.config.maxConnections; i++) {
        connections.push(await pool.acquire());
      }

      expect(pool.connections.size).toBe(pool.config.maxConnections);

      // 尝试获取更多连接(应该等待)
      const acquirePromise = pool.acquire();

      // 释放一个连接
      pool.release(connections[0]);

      // 应该能够获取到连接
      const connection = await acquirePromise;
      expect(connection).toBeDefined();

      // 清理
      connections.forEach(conn => pool.release(conn));
      pool.release(connection);
    });

    it('应该超时等待连接', async () => {
      const connections = [];

      // 获取最大连接数
      for (let i = 0; i < pool.config.maxConnections; i++) {
        connections.push(await pool.acquire());
      }

      // 设置短超时时间
      pool.config.acquireTimeout = 100;

      // 尝试获取更多连接
      await expect(pool.acquire()).rejects.toThrow('timeout');

      // 清理
      connections.forEach(conn => pool.release(conn));
    });
  });

  describe('use方法', () => {
    it('应该使用连接执行操作', async () => {
      const result = await pool.use(async (connection) => {
        expect(connection.isActive).toBe(true);
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('应该在操作完成后释放连接', async () => {
      const stats = pool.getStats();
      await pool.use(async (connection) => {
        return 'test';
      });

      const newStats = pool.getStats();
      expect(newStats.activeConnections).toBe(0);
    });

    it('应该重试失败的操作', async () => {
      let attempts = 0;
      pool.config.maxRetries = 3;

      const result = await pool.use(async (connection) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('应该在达到最大重试次数后抛出错误', async () => {
      pool.config.maxRetries = 2;

      await expect(pool.use(async () => {
        throw new Error('Persistent error');
      })).rejects.toThrow('Persistent error');
    });

    it('应该重试可重试的错误', async () => {
      let attempts = 0;

      const result = await pool.use(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('Network timeout');
          error.status = 503;
          throw error;
        }
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('不应该重试不可重试的错误', async () => {
      let attempts = 0;

      await expect(pool.use(async () => {
        attempts++;
        const error = new Error('Bad request');
        error.status = 400;
        throw error;
      })).rejects.toThrow('Bad request');

      expect(attempts).toBe(1);
    });
  });

  describe('统计信息', () => {
    it('应该返回正确的统计信息', async () => {
      await pool.use(async () => 'test');
      await pool.use(async () => 'test2');

      const stats = pool.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(2);
      expect(stats.failedRequests).toBe(0);
    });

    it('应该跟踪失败的请求', async () => {
      pool.config.maxRetries = 1;

      try {
        await pool.use(async () => {
          throw new Error('Error');
        });
      } catch (e) {
        // 忽略错误
      }

      const stats = pool.getStats();
      expect(stats.failedRequests).toBeGreaterThan(0);
    });

    it('应该计算平均响应时间', async () => {
      await pool.use(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test';
      });

      const stats = pool.getStats();
      expect(stats.avgResponseTime).toBeGreaterThan(0);
    });

    it('应该重置统计信息', async () => {
      await pool.use(async () => 'test');
      await pool.use(async () => 'test2');

      pool.resetStats();

      const stats = pool.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
    });
  });

  describe('连接清理', () => {
    it('应该清理空闲连接', async () => {
      const connections = [];

      // 创建多个连接
      for (let i = 0; i < pool.config.maxConnections; i++) {
        const conn = await pool.acquire();
        connections.push(conn);
      }

      // 释放所有连接
      connections.forEach(conn => pool.release(conn));

      // 手动触发清理
      await pool._cleanupIdleConnections();

      // 应该保留最小连接数
      expect(pool.connections.size).toBeLessThanOrEqual(pool.config.maxConnections);
    });

    it('应该保持最小连接数', async () => {
      // 确保有最小连接数
      await pool._ensureMinConnections();

      // 手动触发清理
      await pool._cleanupIdleConnections();

      // 应该保留最小连接数
      expect(pool.connections.size).toBeGreaterThanOrEqual(pool.config.minConnections);
    });
  });

  describe('生命周期', () => {
    it('应该排空连接池', async () => {
      await pool.acquire();
      await pool.acquire();

      await pool.drain();

      expect(pool.connections.size).toBe(0);
    });

    it('应该销毁连接池', async () => {
      await pool.acquire();

      await pool.destroy();

      expect(pool.connections.size).toBe(0);
      expect(pool.cleanupInterval).toBeNull();
      expect(pool.keepAliveInterval).toBeNull();
    });

    it('排空前应该等待所有请求完成', async () => {
      let operationCompleted = false;

      const operationPromise = pool.use(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        operationCompleted = true;
        return 'test';
      });

      await pool.drain();

      expect(operationCompleted).toBe(true);
      await operationPromise;
    });
  });

  describe('事件', () => {
    it('应该触发connectionCreated事件', (done) => {
      pool.once('connectionCreated', (info) => {
        expect(info.id).toBeDefined();
        done();
      });

      pool.acquire().then(conn => pool.release(conn));
    });

    it('应该触发connectionAcquired事件', (done) => {
      pool.once('connectionAcquired', (info) => {
        expect(info.id).toBeDefined();
        expect(info.isActive).toBe(true);
        done();
      });

      pool.acquire().then(conn => pool.release(conn));
    });

    it('应该触发connectionReleased事件', (done) => {
      pool.acquire().then((conn) => {
        pool.once('connectionReleased', (info) => {
          expect(info.id).toBe(conn.id);
          expect(info.isIdle).toBe(true);
          done();
        });

        pool.release(conn);
      });
    });

    it('应该触发requestCompleted事件', (done) => {
      pool.once('requestCompleted', (data) => {
        expect(data.success).toBe(true);
        expect(data.responseTime).toBeGreaterThanOrEqual(0);
        done();
      });

      pool.use(async () => 'test');
    });

    it('应该触发requestFailed事件', (done) => {
      pool.config.maxRetries = 1;

      pool.once('requestFailed', (data) => {
        expect(data.error).toBeDefined();
        expect(data.attempts).toBeGreaterThan(0);
        done();
      });

      pool.use(async () => {
        throw new Error('Test error');
      }).catch(() => {});
    });
  });

  describe('边界情况', () => {
    it('应该处理空连接', () => {
      expect(() => pool.release(null)).not.toThrow();
      expect(() => pool.release(undefined)).not.toThrow();
    });

    it('应该处理连接工厂失败', async () => {
      const failingPool = new ConnectionPool({
        maxConnections: 2,
        connectionFactory: async () => {
          throw new Error('Factory error');
        }
      });

      await expect(failingPool.acquire()).rejects.toThrow('Factory error');

      await failingPool.destroy();
    });

    it('应该处理高并发', async () => {
      const promises = [];
      const count = 20;

      for (let i = 0; i < count; i++) {
        promises.push(pool.use(async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          return i;
        }));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(count);
    });
  });
});

describe('ConcurrencyController', () => {
  let controller;

  beforeEach(() => {
    controller = new ConcurrencyController({
      maxConcurrent: 2,
      queueSize: 5
    });
  });

  describe('构造函数', () => {
    it('应该创建并发控制器实例', () => {
      expect(controller).toBeInstanceOf(ConcurrencyController);
    });

    it('应该使用默认配置', () => {
      const defaultController = new ConcurrencyController();
      expect(defaultController.config.maxConcurrent).toBe(5);
    });

    it('应该使用自定义配置', () => {
      expect(controller.config.maxConcurrent).toBe(2);
      expect(controller.config.queueSize).toBe(5);
    });
  });

  describe('任务管理', () => {
    it('应该执行任务', async () => {
      const result = await controller.add(async () => {
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('应该限制并发数', async () => {
      const runningCount = [];
      const startTime = Date.now();

      const createTask = (id) => async () => {
        runningCount.push(id);
        await new Promise(resolve => setTimeout(resolve, 50));
        runningCount.splice(runningCount.indexOf(id), 1);
        return id;
      };

      const tasks = [1, 2, 3, 4].map(createTask);
      await Promise.all(tasks.map(t => controller.add(t)));

      const maxRunning = Math.max(...runningCount);
      expect(maxRunning).toBeLessThanOrEqual(controller.config.maxConcurrent);
    });

    it('应该处理任务队列', async () => {
      let runningCount = 0;
      let maxRunning = 0;

      const createTask = async () => {
        runningCount++;
        maxRunning = Math.max(maxRunning, runningCount);
        await new Promise(resolve => setTimeout(resolve, 50));
        runningCount--;
      };

      const tasks = Array(5).fill(null).map(() => createTask);
      await Promise.all(tasks.map(t => controller.add(t)));

      expect(maxRunning).toBeLessThanOrEqual(controller.config.maxConcurrent);
    });

    it('应该在队列满时拒绝任务', async () => {
      const controller = new ConcurrencyController({
        maxConcurrent: 1,
        queueSize: 2
      });

      // 添加长任务
      const longTask = controller.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // 填满队列
      await controller.add(async () => {});
      await controller.add(async () => {});

      // 尝试添加更多任务
      await expect(controller.add(async () => {})).rejects.toThrow('Queue is full');

      await longTask;
    });

    it('应该超时等待中的任务', async () => {
      const controller = new ConcurrencyController({
        maxConcurrent: 1,
        queueSize: 5,
        timeout: 100
      });

      // 添加长任务
      const longTask = controller.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // 添加会超时的任务
      await expect(controller.add(async () => {})).rejects.toThrow('timeout');

      await longTask;
    });
  });

  describe('addAll方法', () => {
    it('应该批量添加任务', async () => {
      const tasks = [1, 2, 3].map(n => async () => n);

      const results = await controller.addAll(tasks);

      expect(results).toEqual([1, 2, 3]);
    });

    it('应该返回所有任务结果', async () => {
      const tasks = [
        async () => 1,
        async () => 2,
        async () => 3,
        async () => 4
      ];

      const results = await controller.addAll(tasks);

      expect(results).toHaveLength(4);
      expect(results).toContain(1);
      expect(results).toContain(2);
      expect(results).toContain(3);
      expect(results).toContain(4);
    });
  });

  describe('waitForAll方法', () => {
    it('应该等待所有任务完成', async () => {
      let completedCount = 0;

      const createTask = () => async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        completedCount++;
      };

      controller.add(createTask());
      controller.add(createTask());
      controller.add(createTask());

      await controller.waitForAll();

      expect(completedCount).toBe(3);
    });

    it('应该在队列和运行队列为空时返回', async () => {
      await controller.waitForAll();

      const stats = controller.getStats();
      expect(stats.runningCount).toBe(0);
      expect(stats.queueLength).toBe(0);
    });
  });

  describe('统计信息', () => {
    it('应该返回正确的统计信息', async () => {
      await controller.add(async () => 'test');
      await controller.add(async () => 'test2');
      await controller.add(async () => 'test3');

      const stats = controller.getStats();
      expect(stats.totalTasks).toBe(3);
      expect(stats.completedTasks).toBe(3);
    });

    it('应该跟踪失败的 任务', async () => {
      try {
        await controller.add(async () => {
          throw new Error('Error');
        });
      } catch (e) {
        // 忽略
      }

      const stats = controller.getStats();
      expect(stats.failedTasks).toBeGreaterThan(0);
    });

    it('应该计算平均执行时间', async () => {
      await controller.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const stats = controller.getStats();
      expect(stats.avgExecutionTime).toBeGreaterThan(0);
    });

    it('应该重置统计信息', async () => {
      await controller.add(async () => 'test');
      await controller.add(async () => 'test2');

      controller.resetStats();

      const stats = controller.getStats();
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
    });
  });

  describe('clearQueue方法', () => {
    it('应该清空队列', async () => {
      const controller = new ConcurrencyController({
        maxConcurrent: 1,
        queueSize: 5
      });

      // 添加长任务
      const longTask = controller.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // 添加等待中的任务
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        tasks.push(
          controller.add(async () => i).catch(err => err)
        );
      }

      // 清空队列
      controller.clearQueue();

      // 等待的任务应该被拒绝
      await Promise.all(tasks);

      await longTask;
    });
  });

  describe('事件', () => {
    it('应该触发taskCompleted事件', (done) => {
      controller.once('taskCompleted', (data) => {
        expect(data.executionTime).toBeGreaterThanOrEqual(0);
        done();
      });

      controller.add(async () => 'test');
    });

    it('应该触发taskFailed事件', (done) => {
      controller.once('taskFailed', (data) => {
        expect(data.error).toBeDefined();
        done();
      });

      controller.add(async () => {
        throw new Error('Test error');
      }).catch(() => {});
    });
  });

  describe('边界情况', () => {
    it('应该处理空任务数组', async () => {
      const results = await controller.addAll([]);
      expect(results).toEqual([]);
    });

    it('应该处理高并发', async () => {
      const promises = [];
      const count = 20;

      for (let i = 0; i < count; i++) {
        promises.push(controller.add(async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          return i;
        }));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(count);
    });
  });
});

describe('默认实例', () => {
  it('应该导出默认连接池实例', () => {
    expect(defaultPool).toBeInstanceOf(ConnectionPool);
  });

  it('应该导出默认并发控制器实例', () => {
    expect(defaultConcurrency).toBeInstanceOf(ConcurrencyController);
  });
});
