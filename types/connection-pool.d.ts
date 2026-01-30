/**
 * 连接池配置选项
 */
export interface ConnectionPoolConfig {
  /** 最大连接数 */
  maxConnections?: number;
  /** 最小连接数 */
  minConnections?: number;
  /** 获取连接超时时间(ms) */
  acquireTimeout?: number;
  /** 空闲连接超时时间(ms) */
  idleTimeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟(ms) */
  retryDelay?: number;
  /** 是否启用Keep-Alive */
  enableKeepAlive?: boolean;
  /** Keep-Alive超时(ms) */
  keepAliveTimeout?: number;
  /** 是否启用指标收集 */
  enableMetrics?: boolean;
  /** 连接工厂函数 */
  connectionFactory?: (config: ConnectionPoolConfig) => Promise<any>;
}

/**
 * 连接统计信息
 */
export interface ConnectionStats {
  /** 总连接数 */
  totalConnections: number;
  /** 活动连接数 */
  activeConnections: number;
  /** 空闲连接数 */
  idleConnections: number;
  /** 等待请求数 */
  pendingRequests: number;
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successfulRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 平均响应时间(ms) */
  avgResponseTime: number;
  /** 最大响应时间(ms) */
  maxResponseTime: number;
  /** 最小响应时间(ms) */
  minResponseTime: number;
}

/**
 * 连接信息
 */
export interface ConnectionInfo {
  /** 连接ID */
  id: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后使用时间戳 */
  lastUsedAt: number;
  /** 最后活动时间戳 */
  lastActiveAt: number;
  /** 连接年龄(秒) */
  age: number;
  /** 空闲时间(秒) */
  idleTime: number;
  /** 请求次数 */
  requestCount: number;
  /** 错误次数 */
  errorCount: number;
  /** 是否活动 */
  isActive: boolean;
  /** 是否空闲 */
  isIdle: boolean;
  /** 是否健康 */
  isHealthy: boolean;
  /** 元数据 */
  metadata: Record<string, any>;
}

/**
 * 连接对象
 */
export interface IConnection {
  /** 连接ID */
  id: string;
  /** 配置 */
  config: ConnectionPoolConfig;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后使用时间戳 */
  lastUsedAt: number;
  /** 最后活动时间戳 */
  lastActiveAt: number;
  /** 请求次数 */
  requestCount: number;
  /** 错误次数 */
  errorCount: number;
  /** 是否活动 */
  isActive: boolean;
  /** 是否空闲 */
  isIdle: boolean;
  /** 是否健康 */
  isHealthy: boolean;
  /** 元数据 */
  metadata: Record<string, any>;

  /** 标记为活动状态 */
  markActive(): void;
  /** 标记为空闲状态 */
  markIdle(): void;
  /** 记录请求 */
  recordRequest(): void;
  /** 记录错误 */
  recordError(): void;
  /** 获取连接年龄(秒) */
  getAge(): number;
  /** 获取空闲时间(秒) */
  getIdleTime(): number;
  /** 重置错误计数 */
  resetErrors(): void;
  /** 获取连接信息 */
  getInfo(): ConnectionInfo;
}

/**
 * 连接池事件
 */
export interface ConnectionPoolEvents {
  /** 连接创建 */
  connectionCreated: (info: ConnectionInfo) => void;
  /** 连接获取 */
  connectionAcquired: (info: ConnectionInfo) => void;
  /** 连接释放 */
  connectionReleased: (info: ConnectionInfo) => void;
  /** 连接关闭 */
  connectionClosed: (info: ConnectionInfo) => void;
  /** 连接错误 */
  connectionError: (error: { id: string; error: string }) => void;
  /** Keep-Alive */
  keepAlive: (info: ConnectionInfo) => void;
  /** 请求完成 */
  requestCompleted: (data: {
    connectionId: string;
    responseTime: number;
    attempts: number;
    success: boolean;
  }) => void;
  /** 请求失败 */
  requestFailed: (data: {
    connectionId?: string;
    attempts: number;
    error: string;
    stats: any;
  }) => void;
  /** 连接池排空 */
  poolDrained: () => void;
  /** 连接池销毁 */
  poolDestroyed: () => void;
}

/**
 * 连接池类
 */
export class ConnectionPool extends EventEmitter {
  constructor(config?: ConnectionPoolConfig);

  /** 获取连接 */
  acquire(): Promise<IConnection>;

  /** 释放连接 */
  release(connection: IConnection): void;

  /** 使用连接执行操作 */
  use<T>(operation: (connection: IConnection) => Promise<T>, options?: any): Promise<T>;

  /** 获取统计信息 */
  getStats(): ConnectionStats;

  /** 获取所有连接信息 */
  getConnectionsInfo(): ConnectionInfo[];

  /** 重置统计信息 */
  resetStats(): void;

  /** 清空连接池 */
  drain(): Promise<void>;

  /** 销毁连接池 */
  destroy(): Promise<void>;

  /** 打印连接池状态 */
  printStatus(): void;

  /** 事件监听 */
  on<K extends keyof ConnectionPoolEvents>(
    event: K,
    listener: ConnectionPoolEvents[K]
  ): this;

  /** 一次性事件监听 */
  once<K extends keyof ConnectionPoolEvents>(
    event: K,
    listener: ConnectionPoolEvents[K]
  ): this;

  /** 移除事件监听 */
  off<K extends keyof ConnectionPoolEvents>(
    event: K,
    listener: ConnectionPoolEvents[K]
  ): this;
}

/**
 * 并发控制器配置
 */
export interface ConcurrencyControllerConfig {
  /** 最大并发数 */
  maxConcurrent?: number;
  /** 队列大小 */
  queueSize?: number;
  /** 请求超时(ms) */
  timeout?: number;
}

/**
 * 并发控制器统计信息
 */
export interface ConcurrencyStats {
  /** 总任务数 */
  totalTasks: number;
  /** 完成任务数 */
  completedTasks: number;
  /** 失败任务数 */
  failedTasks: number;
  /** 平均执行时间(ms) */
  avgExecutionTime: number;
  /** 总执行时间(ms) */
  totalExecutionTime: number;
  /** 运行中任务数 */
  runningCount: number;
  /** 队列长度 */
  queueLength: number;
  /** 完成计数 */
  completedCount: number;
  /** 失败计数 */
  failedCount: number;
}

/**
 * 并发控制器事件
 */
export interface ConcurrencyControllerEvents {
  /** 任务完成 */
  taskCompleted: (data: {
    executionTime: number;
    runningCount: number;
  }) => void;
  /** 任务失败 */
  taskFailed: (data: {
    error: string;
    runningCount: number;
  }) => void;
}

/**
 * 并发控制器类
 */
export class ConcurrencyController extends EventEmitter {
  constructor(config?: ConcurrencyControllerConfig);

  /** 添加任务 */
  add<T>(task: () => Promise<T>, options?: any): Promise<T>;

  /** 批量添加任务 */
  addAll<T>(tasks: Array<() => Promise<T>>): Promise<Array<T>>;

  /** 等待所有任务完成 */
  waitForAll(): Promise<void>;

  /** 清空队列 */
  clearQueue(): void;

  /** 获取统计信息 */
  getStats(): ConcurrencyStats;

  /** 重置统计信息 */
  resetStats(): void;

  /** 事件监听 */
  on<K extends keyof ConcurrencyControllerEvents>(
    event: K,
    listener: ConcurrencyControllerEvents[K]
  ): this;

  /** 一次性事件监听 */
  once<K extends keyof ConcurrencyControllerEvents>(
    event: K,
    listener: ConcurrencyControllerEvents[K]
  ): this;

  /** 移除事件监听 */
  off<K extends keyof ConcurrencyControllerEvents>(
    event: K,
    listener: ConcurrencyControllerEvents[K]
  ): this;
}

/**
 * 默认连接池实例
 */
export const defaultPool: ConnectionPool;

/**
 * 默认并发控制器实例
 */
export const defaultConcurrency: ConcurrencyController;

/**
 * 使用连接执行操作的快捷函数
 */
export function withConnection<T>(
  operation: (connection: IConnection) => Promise<T>,
  options?: any
): Promise<T>;

/**
 * 使用并发控制的快捷函数
 */
export function withConcurrency<T>(
  task: () => Promise<T>,
  options?: any
): Promise<T>;
