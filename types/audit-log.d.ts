/**
 * 审计日志模块类型定义
 * @description 为 audit-log.js 提供完整的 TypeScript 类型支持
 */

/**
 * 审计日志级别
 */
export const AuditLevel: {
  INFO: string;
  WARNING: string;
  ERROR: string;
  CRITICAL: string;
};

/**
 * 操作类型
 */
export const OperationType: {
  API_KEY_CREATE: string;
  API_KEY_READ: string;
  API_KEY_UPDATE: string;
  API_KEY_DELETE: string;
  API_KEY_EXPORT: string;
  SESSION_CREATE: string;
  SESSION_READ: string;
  SESSION_UPDATE: string;
  SESSION_DELETE: string;
  SESSION_SWITCH: string;
  BRANCH_CREATE: string;
  BRANCH_READ: string;
  BRANCH_DELETE: string;
  BRANCH_MERGE: string;
  CONFIG_READ: string;
  CONFIG_UPDATE: string;
  CONFIG_RESET: string;
  RAG_INDEX_ADD: string;
  RAG_INDEX_REMOVE: string;
  RAG_INDEX_CLEAR: string;
  SECURITY_LOGIN: string;
  SECURITY_LOGOUT: string;
  SECURITY_PASSWORD_CHANGE: string;
  SECURITY_BACKUP: string;
  SECURITY_RESTORE: string;
  SYSTEM_START: string;
  SYSTEM_STOP: string;
  SYSTEM_ERROR: string;
  CUSTOM: string;
};

/**
 * 审计日志项接口
 */
export interface AuditLogEntry {
  id: string;
  operation: string;
  level: string;
  message: string;
  context: Record<string, any>;
  userId: string | null;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  timestamp: Date;
}

/**
 * 审计日志项配置选项
 */
export interface AuditLogEntryOptions {
  id?: string;
  operation?: string;
  level?: string;
  message?: string;
  context?: Record<string, any>;
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
  timestamp?: Date;
}

/**
 * 审计日志引擎配置选项
 */
export interface AuditLogOptions {
  logDir?: string;
  enableFile?: boolean;
  maxFileSize?: number;
  maxFileCount?: number;
  retentionDays?: number;
  sanitize?: boolean;
}

/**
 * 审计日志查询过滤器
 */
export interface AuditLogFilters {
  operation?: string;
  level?: string;
  userId?: string;
  sessionId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
}

/**
 * 审计日志统计信息
 */
export interface AuditLogStatistics {
  total: number;
  byOperation: Record<string, number>;
  byLevel: Record<string, number>;
  bySuccess: Record<boolean, number>;
  byDate: Record<string, number>;
}

/**
 * 审计日志记录选项
 */
export interface AuditLogOptions {
  level?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * 审计日志项类
 */
export declare class AuditLogEntry {
  id: string;
  operation: string;
  level: string;
  message: string;
  context: Record<string, any>;
  userId: string | null;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  timestamp: Date;

  /**
   * 创建审计日志项
   * @param options - 选项
   */
  constructor(options?: AuditLogEntryOptions);

  /**
   * 转换为JSON
   * @returns JSON对象
   */
  toJSON(): {
    id: string;
    operation: string;
    level: string;
    message: string;
    context: Record<string, any>;
    userId: string | null;
    sessionId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    errorMessage: string | null;
    timestamp: string;
  };

  /**
   * 从JSON创建
   * @param json - JSON对象
   * @returns 审计日志项
   */
  static fromJSON(json: {
    id: string;
    operation: string;
    level: string;
    message: string;
    context: Record<string, any>;
    userId: string | null;
    sessionId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    errorMessage: string | null;
    timestamp: string;
  }): AuditLogEntry;
}

/**
 * 审计日志引擎类
 */
export declare class AuditLogEngine {
  logDir: string;
  enableFile: boolean;
  maxFileSize: number;
  maxFileCount: number;
  retentionDays: number;
  sanitize: boolean;

  /**
   * 创建审计日志引擎
   * @param options - 选项
   */
  constructor(options?: AuditLogOptions);

  /**
   * 记录审计日志
   * @param operation - 操作类型
   * @param message - 日志消息
   * @param options - 选项
   * @returns 审计日志项
   */
  log(
    operation: string,
    message: string,
    options?: AuditLogOptions
  ): AuditLogEntry;

  /**
   * 查询审计日志
   * @param filters - 过滤条件
   * @returns 审计日志项数组
   */
  query(filters?: AuditLogFilters): AuditLogEntry[];

  /**
   * 获取所有日志
   * @returns 审计日志项数组
   */
  getAllLogs(): AuditLogEntry[];

  /**
   * 获取最近的日志
   * @param limit - 数量限制
   * @returns 审计日志项数组
   */
  getRecentLogs(limit?: number): AuditLogEntry[];

  /**
   * 按操作类型统计
   * @returns 统计结果
   */
  getStatistics(): AuditLogStatistics;

  /**
   * 导出日志
   * @param filePath - 文件路径
   * @param filters - 过滤条件
   * @returns 是否成功
   */
  export(filePath: string, filters?: AuditLogFilters): boolean;

  /**
   * 导入日志
   * @param filePath - 文件路径
   * @returns 是否成功
   */
  import(filePath: string): boolean;

  /**
   * 清空所有日志
   * @returns 是否成功
   */
  clear(): boolean;
}

/**
 * 创建审计日志引擎
 * @param options - 选项
 * @returns 审计日志引擎
 */
export declare function createAuditLogger(options?: AuditLogOptions): AuditLogEngine;

/**
 * 获取全局审计日志引擎
 * @returns 审计日志引擎
 */
export declare function getAuditLogger(): AuditLogEngine;

/**
 * 快捷记录函数
 * @param operation - 操作类型
 * @param message - 日志消息
 * @param options - 选项
 * @returns 审计日志项
 */
export declare function auditLog(
  operation: string,
  message: string,
  options?: AuditLogOptions
): AuditLogEntry;

/**
 * 格式化审计日志项
 * @param entry - 审计日志项
 * @returns 格式化的字符串
 */
export declare function formatAuditEntry(entry: AuditLogEntry): string;

/**
 * 格式化审计日志列表
 * @param entries - 审计日志项数组
 * @returns 格式化的字符串
 */
export declare function formatAuditLogList(entries: AuditLogEntry[]): string;

/**
 * 格式化统计信息
 * @param stats - 统计信息
 * @returns 格式化的字符串
 */
export declare function formatAuditStatistics(stats: AuditLogStatistics): string;

/**
 * 错误消息常量
 */
export declare const ERROR_MESSAGES: {
  INVALID_INPUT: string;
  WRITE_FAILED: string;
  READ_FAILED: string;
  ARCHIVE_FAILED: string;
  EXPORT_FAILED: string;
  IMPORT_FAILED: string;
  PARSE_FAILED: string;
  FILE_NOT_FOUND: string;
  PERMISSION_DENIED: string;
};
