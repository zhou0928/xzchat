import { logger } from './logger.js';
import { EventEmitter } from 'events';

/**
 * 连接池配置选项
 * @typedef {Object} ConnectionPoolConfig
 * @property {number} maxConnections - 最大连接数 (默认: 10)
 * @property {number} minConnections - 最小连接数 (默认: 2)
 * @property {number} acquireTimeout - 获取连接超时时间(ms) (默认: 30000)
 * @property {number} idleTimeout - 空闲连接超时时间(ms) (默认: 60000)
 * @property {number} maxRetries - 最大重试次数 (默认: 3)
 * @property {number} retryDelay - 重试延迟(ms) (默认: 1000)
 * @property {boolean} enableKeepAlive - 是否启用Keep-Alive (默认: true)
 * @property {number} keepAliveTimeout - Keep-Alive超时(ms) (默认: 300000)
 * @property {boolean} enableMetrics - 是否启用指标收集 (默认: false)
 * @property {Function} [connectionFactory] - 连接工厂函数
 */

/**
 * 连接统计信息
 * @typedef {Object} ConnectionStats
 * @property {number} totalConnections - 总连接数
 * @property {number} activeConnections - 活动连接数
 * @property {number} idleConnections - 空闲连接数
 * @property {number} pendingRequests - 等待请求数
 * @property {number} totalRequests - 总请求数
 * @property {number} successfulRequests - 成功请求数
 * @property {number} failedRequests - 失败请求数
 * @property {number} avgResponseTime - 平均响应时间(ms)
 */

/**
 * 连接对象
 * @class Connection
 * @extends EventEmitter
 */
class Connection extends EventEmitter {
  /**
   * 创建一个新连接
   * @param {Object} config - 连接配置
   * @param {string} id - 连接ID
   */
  constructor(config, id) {
    super();
    this.id = id;
    this.config = config;
    this.createdAt = Date.now();
    this.lastUsedAt = Date.now();
    this.lastActiveAt = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.isActive = false;
    this.isIdle = false;
    this.isHealthy = true;
    this.metadata = {};
  }

  /**
   * 标记为活动状态
   */
  markActive() {
    this.isActive = true;
    this.isIdle = false;
    this.lastActiveAt = Date.now();
  }

  /**
   * 标记为空闲状态
   */
  markIdle() {
    this.isActive = false;
    this.isIdle = true;
    this.lastUsedAt = Date.now();
  }

  /**
   * 记录请求
   */
  recordRequest() {
    this.requestCount++;
    this.lastActiveAt = Date.now();
  }

  /**
   * 记录错误
   */
  recordError() {
    this.errorCount++;
    if (this.errorCount >= 3) {
      this.isHealthy = false;
    }
  }

  /**
   * 获取连接年龄(秒)
   * @returns {number}
   */
  getAge() {
    return Math.floor((Date.now() - this.createdAt) / 1000);
  }

  /**
   * 获取空闲时间(秒)
   * @returns {number}
   */
  getIdleTime() {
    return Math.floor((Date.now() - this.lastUsedAt) / 1000);
  }

  /**
   * 重置错误计数
   */
  resetErrors() {
    this.errorCount = 0;
    this.isHealthy = true;
  }

  /**
   * 获取连接信息
   * @returns {Object}
   */
  getInfo() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      lastActiveAt: this.lastActiveAt,
      age: this.getAge(),
      idleTime: this.getIdleTime(),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      isActive: this.isActive,
      isIdle: this.isIdle,
      isHealthy: this.isHealthy,
      metadata: this.metadata
    };
  }
}

/**
 * 连接池管理器
 * @class ConnectionPool
 * @extends EventEmitter
 */
export class ConnectionPool extends EventEmitter {
  /**
   * 创建连接池
   * @param {ConnectionPoolConfig} config - 连接池配置
   */
  constructor(config = {}) {
    super();

    this.config = {
      maxConnections: config.maxConnections ?? 10,
      minConnections: config.minConnections ?? 2,
      acquireTimeout: config.acquireTimeout ?? 30000,
      idleTimeout: config.idleTimeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      enableKeepAlive: config.enableKeepAlive ?? true,
      keepAliveTimeout: config.keepAliveTimeout ?? 300000,
      enableMetrics: config.enableMetrics ?? false,
      connectionFactory: config.connectionFactory || this._defaultConnectionFactory
    };

    // 连接存储
    this.connections = new Map(); // id -> Connection
    this.connectionQueue = []; // 等待获取连接的请求
    this.connectionCounter = 0;

    // 统计信息
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity
    };

    // 定时器
    this.cleanupInterval = null;
    this.keepAliveInterval = null;

    this._initialize();
  }

  /**
   * 初始化连接池
   * @private
   */
  _initialize() {
    // 创建最小连接数
    this._ensureMinConnections();

    // 启动清理定时器
    this.cleanupInterval = setInterval(() => {
      this._cleanupIdleConnections();
    }, Math.min(this.config.idleTimeout / 2, 30000));

    // 启动Keep-Alive定时器
    if (this.config.enableKeepAlive) {
      this.keepAliveInterval = setInterval(() => {
        this._keepAliveConnections();
      }, Math.min(this.config.keepAliveTimeout / 2, 150000));
    }

    logger.debug('ConnectionPool initialized', {
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections,
      idleTimeout: this.config.idleTimeout
    });
  }

  /**
   * 默认连接工厂
   * @private
   * @returns {Promise<Object>}
   */
  async _defaultConnectionFactory() {
    return {
      connected: true,
      createdAt: Date.now()
    };
  }

  /**
   * 确保最小连接数
   * @private
   */
  async _ensureMinConnections() {
    const currentCount = this.connections.size;
    const needed = this.config.minConnections - currentCount;

    if (needed > 0) {
      logger.debug(`Creating ${needed} initial connections`);
      for (let i = 0; i < needed; i++) {
        await this._createConnection();
      }
    }
  }

  /**
   * 创建新连接
   * @private
   * @returns {Promise<Connection>}
   */
  async _createConnection() {
    const id = `conn_${++this.connectionCounter}`;
    const connection = new Connection(this.config, id);

    try {
      const connectionData = await this.config.connectionFactory(this.config);
      connection.metadata.connectionData = connectionData;
      connection.isHealthy = true;

      this.connections.set(id, connection);
      this.emit('connectionCreated', connection.getInfo());

      logger.debug(`Connection created: ${id}`, {
        totalConnections: this.connections.size
      });

      return connection;
    } catch (error) {
      this.emit('connectionError', { id, error: error.message });
      throw error;
    }
  }

  /**
   * 获取连接
   * @returns {Promise<Connection>}
   */
  async acquire() {
    // 尝试获取空闲连接
    const idleConnection = this._findIdleConnection();
    if (idleConnection) {
      idleConnection.markActive();
      idleConnection.recordRequest();
      this.emit('connectionAcquired', idleConnection.getInfo());
      return idleConnection;
    }

    // 如果未达到最大连接数,创建新连接
    if (this.connections.size < this.config.maxConnections) {
      const connection = await this._createConnection();
      connection.markActive();
      connection.recordRequest();
      this.emit('connectionAcquired', connection.getInfo());
      return connection;
    }

    // 等待连接可用
    logger.debug('No available connections, waiting...', {
      queueLength: this.connectionQueue.length
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.connectionQueue.findIndex(
          item => item.resolve === resolve
        );
        if (index !== -1) {
          this.connectionQueue.splice(index, 1);
        }
        reject(new Error(`Connection acquire timeout after ${this.config.acquireTimeout}ms`));
      }, this.config.acquireTimeout);

      this.connectionQueue.push({ resolve, reject, timeout });
    });
  }

  /**
   * 查找空闲连接
   * @private
   * @returns {Connection|null}
   */
  _findIdleConnection() {
    // 优先使用健康的空闲连接
    const healthyIdle = Array.from(this.connections.values()).find(
      conn => conn.isIdle && conn.isHealthy
    );
    if (healthyIdle) {
      return healthyIdle;
    }

    // 其次使用不健康的空闲连接(尝试恢复)
    const unhealthyIdle = Array.from(this.connections.values()).find(
      conn => conn.isIdle && !conn.isHealthy
    );
    if (unhealthyIdle) {
      unhealthyIdle.resetErrors();
      return unhealthyIdle;
    }

    return null;
  }

  /**
   * 释放连接
   * @param {Connection} connection - 要释放的连接
   */
  release(connection) {
    if (!connection) {
      logger.warn('Attempted to release null connection');
      return;
    }

    if (!this.connections.has(connection.id)) {
      logger.warn(`Connection ${connection.id} not found in pool`);
      return;
    }

    connection.markIdle();
    this.emit('connectionReleased', connection.getInfo());

    // 处理等待队列
    if (this.connectionQueue.length > 0) {
      const { resolve, timeout } = this.connectionQueue.shift();
      clearTimeout(timeout);
      connection.markActive();
      connection.recordRequest();
      resolve(connection);
    }
  }

  /**
   * 使用连接执行操作
   * @param {Function} operation - 要执行的操作
   * @param {Object} [options] - 选项
   * @returns {Promise<any>}
   */
  async use(operation, options = {}) {
    const startTime = Date.now();
    const stats = {
      attempts: 0,
      lastError: null
    };

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      stats.attempts = attempt;
      let connection;

      try {
        // 获取连接
        connection = await this.acquire();
        this.stats.totalRequests++;

        // 执行操作
        const result = await operation(connection);

        // 成功:更新统计
        const responseTime = Date.now() - startTime;
        this._updateStats(responseTime, true);
        this.stats.successfulRequests++;

        // 释放连接
        this.release(connection);

        this.emit('requestCompleted', {
          connectionId: connection.id,
          responseTime,
          attempts,
          success: true
        });

        return result;

      } catch (error) {
        stats.lastError = error;

        // 记录错误
        if (connection) {
          connection.recordError();
          this.release(connection);
        }

        this.stats.failedRequests++;

        // 检查是否需要重试
        if (attempt < this.config.maxRetries && this._shouldRetry(error)) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          logger.debug(`Request failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries: this.config.maxRetries,
            error: error.message
          });

          await this._sleep(delay);
          continue;
        }

        // 不重试或达到最大重试次数
        this.emit('requestFailed', {
          connectionId: connection?.id,
          attempts,
          error: error.message,
          stats
        });

        throw error;
      }
    }
  }

  /**
   * 判断是否应该重试
   * @private
   * @param {Error} error - 错误对象
   * @returns {boolean}
   */
  _shouldRetry(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const message = error.message.toLowerCase();

    // 检查状态码
    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }

    // 检查错误消息
    const retryablePatterns = [
      'timeout',
      'network',
      'econnrefused',
      'etimedout',
      'rate limit',
      'too many requests'
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * 更新统计信息
   * @private
   * @param {number} responseTime - 响应时间
   * @param {boolean} success - 是否成功
   */
  _updateStats(responseTime, success) {
    if (!success) return;

    this.stats.totalResponseTime += responseTime;
    this.stats.maxResponseTime = Math.max(this.stats.maxResponseTime, responseTime);
    this.stats.minResponseTime = Math.min(this.stats.minResponseTime, responseTime);
  }

  /**
   * 清理空闲连接
   * @private
   */
  _cleanupIdleConnections() {
    const now = Date.now();
    const toRemove = [];

    // 查找需要清理的连接
    for (const [id, connection] of this.connections.entries()) {
      if (!connection.isIdle) continue;

      // 保持最小连接数
      if (this.connections.size <= this.config.minConnections) {
        continue;
      }

      // 检查空闲超时
      const idleTime = now - connection.lastUsedAt;
      if (idleTime > this.config.idleTimeout) {
        toRemove.push(id);
      }
    }

    // 移除连接
    if (toRemove.length > 0) {
      logger.debug(`Cleaning up ${toRemove.length} idle connections`);
      for (const id of toRemove) {
        const connection = this.connections.get(id);
        if (connection) {
          this.connections.delete(id);
          this.emit('connectionClosed', connection.getInfo());
        }
      }
    }
  }

  /**
   * 保持连接活跃
   * @private
   */
  _keepAliveConnections() {
    const now = Date.now();

    for (const connection of this.connections.values()) {
      if (!connection.isIdle) continue;

      // 检查是否需要Keep-Alive
      const idleTime = now - connection.lastUsedAt;
      if (idleTime > this.config.keepAliveTimeout * 0.8) {
        // 发送Keep-Alive信号
        this.emit('keepAlive', connection.getInfo());
        connection.lastUsedAt = Date.now();
      }
    }
  }

  /**
   * 延迟函数
   * @private
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取统计信息
   * @returns {ConnectionStats}
   */
  getStats() {
    const activeConnections = Array.from(this.connections.values()).filter(c => c.isActive).length;
    const idleConnections = Array.from(this.connections.values()).filter(c => c.isIdle).length;
    const avgResponseTime = this.stats.successfulRequests > 0
      ? Math.floor(this.stats.totalResponseTime / this.stats.successfulRequests)
      : 0;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      idleConnections,
      pendingRequests: this.connectionQueue.length,
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      avgResponseTime,
      maxResponseTime: this.stats.maxResponseTime,
      minResponseTime: this.stats.minResponseTime === Infinity ? 0 : this.stats.minResponseTime
    };
  }

  /**
   * 获取所有连接信息
   * @returns {Array<Object>}
   */
  getConnectionsInfo() {
    return Array.from(this.connections.values()).map(conn => conn.getInfo());
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity
    };
  }

  /**
   * 清空连接池
   */
  async drain() {
    logger.debug('Draining connection pool');

    // 等待所有等待的请求完成
    for (const { reject, timeout } of this.connectionQueue) {
      clearTimeout(timeout);
      reject(new Error('Connection pool is being drained'));
    }
    this.connectionQueue = [];

    // 关闭所有连接
    for (const connection of this.connections.values()) {
      this.emit('connectionClosed', connection.getInfo());
    }
    this.connections.clear();

    this.emit('poolDrained');
  }

  /**
   * 销毁连接池
   */
  async destroy() {
    await this.drain();

    // 清理定时器
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    this.emit('poolDestroyed');
  }

  /**
   * 打印连接池状态
   */
  printStatus() {
    const stats = this.getStats();
    const status = {
      pool: {
        config: {
          maxConnections: this.config.maxConnections,
          minConnections: this.config.minConnections,
          idleTimeout: this.config.idleTimeout
        },
        stats
      },
      connections: this.getConnectionsInfo()
    };

    console.log(JSON.stringify(status, null, 2));
  }
}

/**
 * 并发控制器
 * @class ConcurrencyController
 * @extends EventEmitter
 */
export class ConcurrencyController extends EventEmitter {
  /**
   * 创建并发控制器
   * @param {Object} config - 配置选项
   * @param {number} config.maxConcurrent - 最大并发数 (默认: 5)
   * @param {number} config.queueSize - 队列大小 (默认: 100)
   * @param {number} config.timeout - 请求超时(ms) (默认: 30000)
   */
  constructor(config = {}) {
    super();

    this.config = {
      maxConcurrent: config.maxConcurrent ?? 5,
      queueSize: config.queueSize ?? 100,
      timeout: config.timeout ?? 30000
    };

    this.runningCount = 0;
    this.queue = [];
    this.completedCount = 0;
    this.failedCount = 0;

    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgExecutionTime: 0,
      totalExecutionTime: 0
    };
  }

  /**
   * 添加任务
   * @param {Function} task - 任务函数
   * @param {Object} [options] - 选项
   * @returns {Promise<any>}
   */
  async add(task, options = {}) {
    const startTime = Date.now();

    // 检查队列大小
    if (this.queue.length >= this.config.queueSize) {
      throw new Error('Queue is full');
    }

    this.stats.totalTasks++;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.queue.findIndex(item => item.taskWrapper === taskWrapper);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error(`Task timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      const taskWrapper = async () => {
        try {
          this.runningCount++;
          const result = await task();

          const executionTime = Date.now() - startTime;
          this._updateStats(executionTime, true);
          this.completedCount++;

          clearTimeout(timeout);
          resolve(result);

          this.emit('taskCompleted', {
            executionTime,
            runningCount: this.runningCount - 1
          });

        } catch (error) {
          this.failedCount++;
          this.stats.failedTasks++;

          clearTimeout(timeout);
          reject(error);

          this.emit('taskFailed', {
            error: error.message,
            runningCount: this.runningCount - 1
          });

        } finally {
          this.runningCount--;
          this._processQueue();
        }
      };

      this.queue.push({ taskWrapper, options });

      if (this.runningCount < this.config.maxConcurrent) {
        this._processQueue();
      }
    });
  }

  /**
   * 处理队列
   * @private
   */
  _processQueue() {
    while (this.runningCount < this.config.maxConcurrent && this.queue.length > 0) {
      const { taskWrapper } = this.queue.shift();
      taskWrapper();
    }
  }

  /**
   * 更新统计信息
   * @private
   * @param {number} executionTime - 执行时间
   * @param {boolean} success - 是否成功
   */
  _updateStats(executionTime, success) {
    if (!success) return;

    this.stats.completedTasks++;
    this.stats.totalExecutionTime += executionTime;
    this.stats.avgExecutionTime = Math.floor(
      this.stats.totalExecutionTime / this.stats.completedTasks
    );
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      runningCount: this.runningCount,
      queueLength: this.queue.length,
      completedCount: this.completedCount,
      failedCount: this.failedCount
    };
  }

  /**
   * 批量添加任务
   * @param {Array<Function>} tasks - 任务数组
   * @returns {Promise<Array<any>>}
   */
  async addAll(tasks) {
    const promises = tasks.map(task => this.add(task));
    return Promise.all(promises);
  }

  /**
   * 等待所有任务完成
   * @returns {Promise<void>}
   */
  async waitForAll() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.runningCount === 0 && this.queue.length === 0) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * 清空队列
   */
  clearQueue() {
    for (const { reject, timeout } of this.queue) {
      clearTimeout(timeout);
      reject(new Error('Queue cleared'));
    }
    this.queue = [];
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgExecutionTime: 0,
      totalExecutionTime: 0
    };
    this.completedCount = 0;
    this.failedCount = 0;
  }
}

// 导出默认实例
export const defaultPool = new ConnectionPool({
  maxConnections: 10,
  minConnections: 2,
  enableMetrics: true
});

export const defaultConcurrency = new ConcurrencyController({
  maxConcurrent: 5,
  queueSize: 100
});

// 导出快捷函数
export async function withConnection(operation, options = {}) {
  return defaultPool.use(operation, options);
}

export async function withConcurrency(task, options = {}) {
  return defaultConcurrency.add(task, options);
}
