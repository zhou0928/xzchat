# 连接池和并发控制文档

## 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [连接池 (ConnectionPool)](#连接池-connectionpool)
- [并发控制器 (ConcurrencyController)](#并发控制器-concurrencycontroller)
- [API 参考](#api-参考)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

---

## 概述

连接池和并发控制系统提供了高效的资源管理和请求控制能力，包括:

- ✅ **连接池管理** - 自动管理连接创建、获取、释放和清理
- ✅ **并发控制** - 限制同时执行的任务数量
- ✅ **自动重试** - 智能重试失败的操作
- ✅ **超时处理** - 防止无限等待
- ✅ **统计监控** - 详细的性能统计
- ✅ **事件系统** - 完整的事件通知机制

---

## 快速开始

### 基本使用

```javascript
import { ConnectionPool, ConcurrencyController } from './lib/utils/connection-pool.js';

// 创建连接池
const pool = new ConnectionPool({
  maxConnections: 10,
  minConnections: 2
});

// 使用连接执行操作
const result = await pool.use(async (connection) => {
  console.log('使用连接:', connection.id);
  return '操作结果';
});

// 创建并发控制器
const controller = new ConcurrencyController({
  maxConcurrent: 5
});

// 添加任务
const result = await controller.add(async () => {
  console.log('执行任务');
  return '任务结果';
});
```

### 使用快捷函数

```javascript
import { withConnection, withConcurrency } from './lib/utils/connection-pool.js';

// 使用默认连接池
const result1 = await withConnection(async (connection) => {
  return '操作完成';
});

// 使用默认并发控制器
const result2 = await withConcurrency(async () => {
  return '任务完成';
});
```

---

## 连接池 (ConnectionPool)

### 配置选项

```javascript
const pool = new ConnectionPool({
  maxConnections: 10,        // 最大连接数 (默认: 10)
  minConnections: 2,         // 最小连接数 (默认: 2)
  acquireTimeout: 30000,    // 获取连接超时(ms) (默认: 30000)
  idleTimeout: 60000,       // 空闲连接超时(ms) (默认: 60000)
  maxRetries: 3,            // 最大重试次数 (默认: 3)
  retryDelay: 1000,         // 重试延迟(ms) (默认: 1000)
  enableKeepAlive: true,    // 是否启用Keep-Alive (默认: true)
  keepAliveTimeout: 300000, // Keep-Alive超时(ms) (默认: 300000)
  enableMetrics: false,     // 是否启用指标收集 (默认: false)
  connectionFactory: async (config) => {
    // 自定义连接工厂
    return { connected: true };
  }
});
```

### 核心方法

#### acquire()

获取连接。如果没有可用连接且未达到最大连接数，则创建新连接；否则等待连接可用。

```javascript
const connection = await pool.acquire();
console.log('连接ID:', connection.id);
console.log('连接信息:', connection.getInfo());

// 使用连接...

// 释放连接
pool.release(connection);
```

#### release(connection)

释放连接回连接池。

```javascript
const connection = await pool.acquire();
try {
  // 使用连接...
} finally {
  pool.release(connection);
}
```

#### use(operation, options)

使用连接执行操作，自动处理连接获取和释放。

```javascript
const result = await pool.use(async (connection) => {
  // 执行操作
  console.log('使用连接:', connection.id);
  return '操作结果';
});

// 连接自动释放
```

#### getStats()

获取连接池统计信息。

```javascript
const stats = pool.getStats();
console.log('总连接数:', stats.totalConnections);
console.log('活动连接数:', stats.activeConnections);
console.log('空闲连接数:', stats.idleConnections);
console.log('等待请求数:', stats.pendingRequests);
console.log('总请求数:', stats.totalRequests);
console.log('成功请求数:', stats.successfulRequests);
console.log('失败请求数:', stats.failedRequests);
console.log('平均响应时间:', stats.avgResponseTime);
```

#### resetStats()

重置统计信息。

```javascript
pool.resetStats();
```

#### getConnectionsInfo()

获取所有连接的详细信息。

```javascript
const connections = pool.getConnectionsInfo();
connections.forEach(conn => {
  console.log('连接ID:', conn.id);
  console.log('年龄(秒):', conn.age);
  console.log('空闲时间(秒):', conn.idleTime);
  console.log('请求次数:', conn.requestCount);
  console.log('错误次数:', conn.errorCount);
  console.log('是否健康:', conn.isHealthy);
});
```

#### drain()

排空连接池，等待所有操作完成。

```javascript
await pool.drain();
```

#### destroy()

销毁连接池，释放所有资源。

```javascript
await pool.destroy();
```

---

## 并发控制器 (ConcurrencyController)

### 配置选项

```javascript
const controller = new ConcurrencyController({
  maxConcurrent: 5,   // 最大并发数 (默认: 5)
  queueSize: 100,     // 队列大小 (默认: 100)
  timeout: 30000      // 请求超时(ms) (默认: 30000)
});
```

### 核心方法

#### add(task, options)

添加任务到队列。

```javascript
const result = await controller.add(async () => {
  console.log('执行任务');
  await new Promise(resolve => setTimeout(resolve, 100));
  return '任务结果';
});
```

#### addAll(tasks)

批量添加任务。

```javascript
const tasks = [
  async () => '结果1',
  async () => '结果2',
  async () => '结果3'
];

const results = await controller.addAll(tasks);
console.log(results); // ['结果1', '结果2', '结果3']
```

#### waitForAll()

等待所有任务完成。

```javascript
// 添加多个任务
controller.add(task1);
controller.add(task2);
controller.add(task3);

// 等待所有完成
await controller.waitForAll();
```

#### clearQueue()

清空任务队列。

```javascript
controller.clearQueue();
```

#### getStats()

获取统计信息。

```javascript
const stats = controller.getStats();
console.log('总任务数:', stats.totalTasks);
console.log('完成任务数:', stats.completedTasks);
console.log('失败任务数:', stats.failedTasks);
console.log('平均执行时间:', stats.avgExecutionTime);
console.log('运行中任务数:', stats.runningCount);
console.log('队列长度:', stats.queueLength);
```

#### resetStats()

重置统计信息。

```javascript
controller.resetStats();
```

---

## API 参考

### ConnectionPool 类

#### 构造函数

```javascript
new ConnectionPool(config?)
```

**参数:**
- `config` (ConnectionPoolConfig): 连接池配置

#### 方法

- `acquire(): Promise<Connection>` - 获取连接
- `release(connection: Connection): void` - 释放连接
- `use<T>(operation: Function): Promise<T>` - 使用连接执行操作
- `getStats(): ConnectionStats` - 获取统计信息
- `getConnectionsInfo(): ConnectionInfo[]` - 获取连接信息
- `resetStats(): void` - 重置统计信息
- `drain(): Promise<void>` - 排空连接池
- `destroy(): Promise<void>` - 销毁连接池

#### 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `connectionCreated` | `ConnectionInfo` | 连接创建 |
| `connectionAcquired` | `ConnectionInfo` | 连接获取 |
| `connectionReleased` | `ConnectionInfo` | 连接释放 |
| `connectionClosed` | `ConnectionInfo` | 连接关闭 |
| `connectionError` | `{id, error}` | 连接错误 |
| `keepAlive` | `ConnectionInfo` | Keep-Alive |
| `requestCompleted` | `{connectionId, responseTime, attempts, success}` | 请求完成 |
| `requestFailed` | `{connectionId, attempts, error, stats}` | 请求失败 |
| `poolDrained` | - | 连接池排空 |
| `poolDestroyed` | - | 连接池销毁 |

### ConcurrencyController 类

#### 构造函数

```javascript
new ConcurrencyController(config?)
```

**参数:**
- `config` (ConcurrencyControllerConfig): 并发控制器配置

#### 方法

- `add<T>(task: Function): Promise<T>` - 添加任务
- `addAll<T>(tasks: Function[]): Promise<T[]>` - 批量添加任务
- `waitForAll(): Promise<void>` - 等待所有任务完成
- `clearQueue(): void` - 清空队列
- `getStats(): ConcurrencyStats` - 获取统计信息
- `resetStats(): void` - 重置统计信息

#### 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `taskCompleted` | `{executionTime, runningCount}` | 任务完成 |
| `taskFailed` | `{error, runningCount}` | 任务失败 |

---

## 最佳实践

### 1. 连接池大小配置

根据应用需求合理配置连接池大小:

```javascript
const pool = new ConnectionPool({
  maxConnections: process.env.MAX_CONCURRENT || 10,
  minConnections: 2
});
```

### 2. 错误处理

始终处理可能的错误:

```javascript
try {
  const result = await pool.use(async (connection) => {
    // 操作
    return result;
  });
} catch (error) {
  console.error('操作失败:', error);
  // 重试或记录错误
}
```

### 3. 资源清理

在应用退出时清理资源:

```javascript
process.on('SIGTERM', async () => {
  console.log('清理资源...');
  await pool.destroy();
  process.exit(0);
});
```

### 4. 监控和日志

使用事件系统监控连接池状态:

```javascript
pool.on('connectionCreated', (info) => {
  logger.debug(`连接创建: ${info.id}`);
});

pool.on('requestCompleted', (data) => {
  if (data.responseTime > 1000) {
    logger.warn(`慢请求: ${data.responseTime}ms`);
  }
});
```

### 5. API限流

使用并发控制器限制API请求:

```javascript
const apiController = new ConcurrencyController({
  maxConcurrent: 3 // 限制同时最多3个API请求
});

async function fetchAPI(endpoint) {
  return apiController.add(async () => {
    const response = await fetch(endpoint);
    return response.json();
  });
}
```

### 6. 批量处理

使用 `addAll` 高效处理批量任务:

```javascript
const tasks = items.map(item => async () => {
  return processItem(item);
});

const results = await controller.addAll(tasks);
```

---

## 故障排除

### 问题: 获取连接超时

**原因:** 连接池已满且没有可用连接

**解决方案:**
- 增加 `maxConnections`
- 检查是否有连接未正确释放
- 减少并发请求数

```javascript
const pool = new ConnectionPool({
  maxConnections: 20, // 增加连接数
  acquireTimeout: 60000 // 增加超时时间
});
```

### 问题: 连接泄漏

**原因:** 连接获取后未释放

**解决方案:** 使用 `use` 方法自动管理连接生命周期

```javascript
// 不推荐
const conn = await pool.acquire();
// 如果这里抛出异常，连接不会释放
pool.release(conn);

// 推荐
await pool.use(async (connection) => {
  // 即使抛出异常，连接也会自动释放
});
```

### 问题: 任务执行超时

**原因:** 任务执行时间过长

**解决方案:**
- 增加 `timeout` 设置
- 优化任务性能
- 分解大任务为小任务

```javascript
const controller = new ConcurrencyController({
  timeout: 60000 // 60秒超时
});
```

### 问题: 队列满

**原因:** 任务生成速度 > 消费速度

**解决方案:**
- 增加 `maxConcurrent` 和 `queueSize`
- 使用背压控制
- 优化任务执行效率

### 问题: 重试不生效

**原因:** 错误类型不可重试

**解决方案:** 确保错误状态码是可重试的 (408, 429, 500-504)

```javascript
// 可重试的错误
error.status = 503;

// 不可重试的错误
error.status = 400;
```

---

## 示例

查看完整示例: `examples/connection-pool-usage.js`

包含15个实用示例:
1. 基本连接池使用
2. 自定义连接工厂
3. 自动重试机制
4. 并发控制器
5. 批量任务处理
6. 连接池 + 并发控制
7. 连接池事件监控
8. 连接生命周期管理
9. 错误处理和恢复
10. 快捷函数使用
11. 动态调整并发数
12. 连接池健康检查
13. 资源清理
14. 超时处理
15. API请求限流

---

## 性能建议

1. **连接池大小**: 通常设置为 CPU 核心数的 2-4 倍
2. **并发控制**: 根据后端服务承受能力设置
3. **超时设置**: 根据实际操作耗时设置，避免过长或过短
4. **监控指标**: 定期检查统计信息，优化配置
5. **资源清理**: 确保正确清理连接池和控制器

---

## 相关文档

- [API 文档](./API.md)
- [性能优化文档](./OPTIMIZATION_SUMMARY.md)
- [配置管理](../lib/config.js)
