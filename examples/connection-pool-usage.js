#!/usr/bin/env node

/**
 * 连接池和并发控制器使用示例
 *
 * 本文件展示了如何使用 ConnectionPool 和 ConcurrencyController
 * 来优化并发连接管理和请求控制。
 */

import { ConnectionPool, ConcurrencyController, withConnection, withConcurrency } from '../lib/utils/connection-pool.js';

// ============================================
// 示例 1: 基本连接池使用
// ============================================
async function example1_basicPool() {
  console.log('\n=== 示例 1: 基本连接池使用 ===');

  // 创建连接池
  const pool = new ConnectionPool({
    maxConnections: 5,
    minConnections: 2,
    idleTimeout: 60000
  });

  // 监听连接池事件
  pool.on('connectionCreated', (info) => {
    console.log(`✓ 连接创建: ${info.id}`);
  });

  pool.on('connectionAcquired', (info) => {
    console.log(`→ 连接获取: ${info.id}`);
  });

  pool.on('connectionReleased', (info) => {
    console.log(`← 连接释放: ${info.id}`);
  });

  // 使用连接执行操作
  await pool.use(async (connection) => {
    console.log(`执行操作，使用连接: ${connection.id}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return '操作完成';
  });

  // 获取统计信息
  const stats = pool.getStats();
  console.log('\n连接池统计:', stats);

  await pool.destroy();
}

// ============================================
// 示例 2: 自定义连接工厂
// ============================================
async function example2_customFactory() {
  console.log('\n=== 示例 2: 自定义连接工厂 ===');

  const pool = new ConnectionPool({
    maxConnections: 3,
    connectionFactory: async (config) => {
      // 模拟创建数据库连接
      console.log('创建数据库连接...');
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        connectedAt: Date.now()
      };
    }
  });

  await pool.use(async (connection) => {
    console.log('连接元数据:', connection.metadata);
    return '查询结果';
  });

  await pool.destroy();
}

// ============================================
// 示例 3: 自动重试机制
// ============================================
async function example3_retryMechanism() {
  console.log('\n=== 示例 3: 自动重试机制 ===');

  const pool = new ConnectionPool({
    maxConnections: 2,
    maxRetries: 3,
    retryDelay: 500
  });

  let attemptCount = 0;

  // 模拟偶尔失败的操作
  const result = await pool.use(async (connection) => {
    attemptCount++;
    console.log(`尝试 ${attemptCount}: 执行操作...`);

    if (attemptCount < 3) {
      throw new Error('临时错误');
    }

    return '成功!';
  });

  console.log(`最终结果: ${result} (尝试次数: ${attemptCount})`);

  await pool.destroy();
}

// ============================================
// 示例 4: 并发控制器
// ============================================
async function example4_concurrencyController() {
  console.log('\n=== 示例 4: 并发控制器 ===');

  const controller = new ConcurrencyController({
    maxConcurrent: 3,
    queueSize: 10
  });

  // 监听任务事件
  controller.on('taskCompleted', (data) => {
    console.log(`✓ 任务完成，耗时: ${data.executionTime}ms`);
  });

  // 添加多个任务
  const tasks = [];
  for (let i = 1; i <= 5; i++) {
    const task = controller.add(async () => {
      console.log(`执行任务 ${i}...`);
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
      return `任务 ${i} 结果`;
    });
    tasks.push(task);
  }

  // 等待所有任务完成
  const results = await Promise.all(tasks);
  console.log('\n所有任务完成:', results);

  // 获取统计信息
  const stats = controller.getStats();
  console.log('统计信息:', stats);
}

// ============================================
// 示例 5: 批量任务处理
// ============================================
async function example5_batchProcessing() {
  console.log('\n=== 示例 5: 批量任务处理 ===');

  const controller = new ConcurrencyController({
    maxConcurrent: 2
  });

  // 创建任务列表
  const tasks = Array.from({ length: 8 }, (_, i) => async () => {
    console.log(`处理数据项 ${i + 1}...`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return { id: i + 1, value: Math.random() * 100 };
  });

  // 批量执行
  const results = await controller.addAll(tasks);
  console.log('\n处理结果:', results);
  console.log('统计信息:', controller.getStats());
}

// ============================================
// 示例 6: 连接池 + 并发控制
// ============================================
async function example6_poolWithConcurrency() {
  console.log('\n=== 示例 6: 连接池 + 并发控制 ===');

  const pool = new ConnectionPool({
    maxConnections: 3
  });

  const controller = new ConcurrencyController({
    maxConcurrent: 2
  });

  // 模拟API请求
  const makeRequest = async (url) => {
    return controller.add(async () => {
      return pool.use(async (connection) => {
        console.log(`请求: ${url}，使用连接: ${connection.id}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        return { url, status: 200, data: `Response for ${url}` };
      });
    });
  };

  // 并发发送多个请求
  const urls = ['/api/user', '/api/posts', '/api/comments', '/api/stats'];
  const requests = urls.map(makeRequest);

  const results = await Promise.all(requests);
  console.log('\n所有请求完成:', results.map(r => r.url));

  await pool.destroy();
}

// ============================================
// 示例 7: 连接池事件监控
// ============================================
async function example7_eventMonitoring() {
  console.log('\n=== 示例 7: 连接池事件监控 ===');

  const pool = new ConnectionPool({
    maxConnections: 3,
    enableMetrics: true
  });

  // 监听各种事件
  const events = {
    connectionCreated: [],
    connectionAcquired: [],
    connectionReleased: [],
    requestCompleted: [],
    requestFailed: []
  };

  Object.keys(events).forEach(eventName => {
    pool.on(eventName, (data) => {
      events[eventName].push(data);
    });
  });

  // 执行多个操作
  const operations = [];
  for (let i = 0; i < 5; i++) {
    operations.push(pool.use(async (conn) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return i;
    }));
  }

  await Promise.all(operations);

  console.log('\n事件统计:');
  console.log('- 连接创建:', events.connectionCreated.length);
  console.log('- 连接获取:', events.connectionAcquired.length);
  console.log('- 连接释放:', events.connectionReleased.length);
  console.log('- 请求完成:', events.requestCompleted.length);
  console.log('- 请求失败:', events.requestFailed.length);

  await pool.destroy();
}

// ============================================
// 示例 8: 连接生命周期管理
// ============================================
async function example8_connectionLifecycle() {
  console.log('\n=== 示例 8: 连接生命周期管理 ===');

  const pool = new ConnectionPool({
    maxConnections: 3,
    idleTimeout: 1000
  });

  // 创建连接
  console.log('获取连接...');
  const conn1 = await pool.acquire();
  const conn2 = await pool.acquire();

  console.log('连接1信息:', conn1.getInfo());
  console.log('连接2信息:', conn2.getInfo());

  // 释放连接
  console.log('\n释放连接1...');
  pool.release(conn1);

  console.log('连接1释放后:', conn1.getInfo());

  // 等待连接空闲超时
  console.log('\n等待空闲超时...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('清理后连接数:', pool.connections.size);

  await pool.destroy();
}

// ============================================
// 示例 9: 错误处理和恢复
// ============================================
async function example9_errorHandling() {
  console.log('\n=== 示例 9: 错误处理和恢复 ===');

  const pool = new ConnectionPool({
    maxConnections: 2,
    maxRetries: 2
  });

  // 监听连接错误
  pool.on('connectionError', ({ id, error }) => {
    console.log(`连接错误: ${id} - ${error}`);
  });

  // 处理不可重试的错误
  try {
    await pool.use(async (connection) => {
      const error = new Error('Bad request');
      error.status = 400;
      throw error;
    });
  } catch (err) {
    console.log(`捕获错误: ${err.message}`);
  }

  // 处理可重试的错误
  try {
    const result = await pool.use(async (connection) => {
      const error = new Error('Service unavailable');
      error.status = 503;
      throw error;
    });
    console.log(`重试后成功: ${result}`);
  } catch (err) {
    console.log(`重试失败: ${err.message}`);
  }

  await pool.destroy();
}

// ============================================
// 示例 10: 快捷函数使用
// ============================================
async function example10_shortcutFunctions() {
  console.log('\n=== 示例 10: 快捷函数使用 ===');

  // 使用默认连接池
  const result1 = await withConnection(async (connection) => {
    console.log('使用默认连接池');
    return '任务完成';
  });
  console.log('结果1:', result1);

  // 使用默认并发控制器
  const result2 = await withConcurrency(async () => {
    console.log('使用默认并发控制器');
    await new Promise(resolve => setTimeout(resolve, 50));
    return '并发任务完成';
  });
  console.log('结果2:', result2);

  // 获取统计信息
  const poolStats = defaultPool.getStats();
  const concurrencyStats = defaultConcurrency.getStats();

  console.log('\n默认连接池统计:', poolStats);
  console.log('默认并发控制器统计:', concurrencyStats);
}

// ============================================
// 示例 11: 动态调整并发数
// ============================================
async function example11_dynamicConcurrency() {
  console.log('\n=== 示例 11: 动态调整并发数 ===');

  const controller = new ConcurrencyController({
    maxConcurrent: 2
  });

  // 阶段1: 低并发
  console.log('\n阶段1: 并发数 = 2');
  await runBatchTasks(controller, 4);

  // 调整并发数
  controller.config.maxConcurrent = 5;
  console.log('\n阶段2: 并发数 = 5');
  await runBatchTasks(controller, 4);

  // 调整并发数
  controller.config.maxConcurrent = 1;
  console.log('\n阶段3: 并发数 = 1');
  await runBatchTasks(controller, 4);
}

async function runBatchTasks(controller, count) {
  const startTime = Date.now();
  const tasks = Array(count).fill(null).map((_, i) => async () => {
    console.log(`  执行任务 ${i + 1}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  await controller.addAll(tasks);
  const duration = Date.now() - startTime;
  console.log(`  总耗时: ${duration}ms`);
}

// ============================================
// 示例 12: 连接池健康检查
// ============================================
async function example12_healthCheck() {
  console.log('\n=== 示例 12: 连接池健康检查 ===');

  const pool = new ConnectionPool({
    maxConnections: 3,
    minConnections: 2
  });

  // 定期健康检查
  const healthCheck = async () => {
    const stats = pool.getStats();
    const connections = pool.getConnectionsInfo();

    console.log('\n健康检查:');
    console.log(`总连接: ${stats.totalConnections}/${pool.config.maxConnections}`);
    console.log(`活动连接: ${stats.activeConnections}`);
    console.log(`空闲连接: ${stats.idleConnections}`);
    console.log(`等待请求: ${stats.pendingRequests}`);

    connections.forEach(conn => {
      const health = conn.isHealthy ? '✓' : '✗';
      console.log(`  ${health} ${conn.id}: ${conn.requestCount} 请求, ${conn.errorCount} 错误`);
    });

    return stats;
  };

  await healthCheck();

  // 执行一些操作
  await pool.use(async (conn) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return 'test';
  });

  await healthCheck();

  await pool.destroy();
}

// ============================================
// 示例 13: 资源清理
// ============================================
async function example13_resourceCleanup() {
  console.log('\n=== 示例 13: 资源清理 ===');

  const pool = new ConnectionPool({ maxConnections: 2 });
  const controller = new ConcurrencyController({ maxConcurrent: 2 });

  // 添加一些任务
  const tasks = [];
  for (let i = 0; i < 5; i++) {
    tasks.push(pool.use(async (conn) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return i;
    }));
  }

  // 排空连接池
  console.log('排空连接池...');
  await pool.drain();

  try {
    await pool.use(async () => {
      throw new Error('应该失败');
    });
  } catch (err) {
    console.log(`排空后无法使用: ${err.message}`);
  }

  // 清空并发控制器队列
  console.log('\n清空并发控制器队列...');
  controller.clearQueue();

  await pool.destroy();
}

// ============================================
// 示例 14: 超时处理
// ============================================
async function example14_timeoutHandling() {
  console.log('\n=== 示例 14: 超时处理 ===');

  const pool = new ConnectionPool({
    maxConnections: 1,
    acquireTimeout: 500,
    maxRetries: 1
  });

  // 模拟长时间操作
  const longOperation = pool.use(async (conn) => {
    console.log('执行长时间操作...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return '完成';
  });

  // 尝试获取另一个连接(应该超时)
  try {
    await pool.use(async (conn) => {
      return '应该超时';
    });
  } catch (err) {
    console.log(`捕获超时错误: ${err.message}`);
  }

  await longOperation;
  await pool.destroy();
}

// ============================================
// 示例 15: 实际应用场景 - API请求限流
// ============================================
async function example15_apiRateLimiting() {
  console.log('\n=== 示例 15: API请求限流 ===');

  const pool = new ConnectionPool({
    maxConnections: 5,
    minConnections: 1,
    maxRetries: 3
  });

  const controller = new ConcurrencyController({
    maxConcurrent: 3, // 限制同时最多3个请求
    queueSize: 20
  });

  // 模拟API客户端
  const apiClient = {
    request: async (endpoint) => {
      return controller.add(async () => {
        return pool.use(async (connection) => {
          console.log(`  → ${endpoint} [conn: ${connection.id}]`);
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
          return { endpoint, data: `Data from ${endpoint}` };
        });
      });
    }
  };

  // 发送多个API请求
  const endpoints = [
    '/api/users',
    '/api/posts',
    '/api/comments',
    '/api/settings',
    '/api/analytics',
    '/api/reports',
    '/api/dashboard',
    '/api/notifications'
  ];

  console.log('发送API请求...');
  const startTime = Date.now();
  const results = await Promise.all(endpoints.map(e => apiClient.request(e)));
  const duration = Date.now() - startTime;

  console.log(`\n完成 ${results.length} 个请求，耗时 ${duration}ms`);
  console.log('统计信息:');
  console.log('  连接池:', pool.getStats());
  console.log('  并发控制器:', controller.getStats());

  await pool.destroy();
}

// ============================================
// 运行所有示例
// ============================================
async function runAllExamples() {
  const examples = [
    example1_basicPool,
    example2_customFactory,
    example3_retryMechanism,
    example4_concurrencyController,
    example5_batchProcessing,
    example6_poolWithConcurrency,
    example7_eventMonitoring,
    example8_connectionLifecycle,
    example9_errorHandling,
    example10_shortcutFunctions,
    example11_dynamicConcurrency,
    example12_healthCheck,
    example13_resourceCleanup,
    example14_timeoutHandling,
    example15_apiRateLimiting
  ];

  for (const example of examples) {
    try {
      await example();
    } catch (error) {
      console.error(`\n❌ 示例执行失败: ${example.name}`);
      console.error(error);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ 所有示例执行完成');
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_basicPool,
  example2_customFactory,
  example3_retryMechanism,
  example4_concurrencyController,
  example5_batchProcessing,
  example6_poolWithConcurrency,
  example7_eventMonitoring,
  example8_connectionLifecycle,
  example9_errorHandling,
  example10_shortcutFunctions,
  example11_dynamicConcurrency,
  example12_healthCheck,
  example13_resourceCleanup,
  example14_timeoutHandling,
  example15_apiRateLimiting
};
