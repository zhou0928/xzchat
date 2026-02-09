/**
 * @fileoverview 审计日志模块 - 记录敏感操作
 * @description 提供完整的审计日志功能，记录所有敏感操作
 * @author xzChat Development Team
 * @version 1.0.0
 * @since 2024-01-28
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { logger } from './logger.js';

// 审计日志级别
const AuditLevel = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// 操作类型
const OperationType = {
  // API Key操作
  API_KEY_CREATE: 'API_KEY_CREATE',
  API_KEY_READ: 'API_KEY_READ',
  API_KEY_UPDATE: 'API_KEY_UPDATE',
  API_KEY_DELETE: 'API_KEY_DELETE',
  API_KEY_EXPORT: 'API_KEY_EXPORT',

  // 会话操作
  SESSION_CREATE: 'SESSION_CREATE',
  SESSION_READ: 'SESSION_READ',
  SESSION_UPDATE: 'SESSION_UPDATE',
  SESSION_DELETE: 'SESSION_DELETE',
  SESSION_SWITCH: 'SESSION_SWITCH',

  // 分支操作
  BRANCH_CREATE: 'BRANCH_CREATE',
  BRANCH_READ: 'BRANCH_READ',
  BRANCH_DELETE: 'BRANCH_DELETE',
  BRANCH_MERGE: 'BRANCH_MERGE',

  // 配置操作
  CONFIG_READ: 'CONFIG_READ',
  CONFIG_UPDATE: 'CONFIG_UPDATE',
  CONFIG_RESET: 'CONFIG_RESET',

  // RAG操作
  RAG_INDEX_ADD: 'RAG_INDEX_ADD',
  RAG_INDEX_REMOVE: 'RAG_INDEX_REMOVE',
  RAG_INDEX_CLEAR: 'RAG_INDEX_CLEAR',

  // 安全操作
  SECURITY_LOGIN: 'SECURITY_LOGIN',
  SECURITY_LOGOUT: 'SECURITY_LOGOUT',
  SECURITY_PASSWORD_CHANGE: 'SECURITY_PASSWORD_CHANGE',
  SECURITY_BACKUP: 'SECURITY_BACKUP',
  SECURITY_RESTORE: 'SECURITY_RESTORE',

  // 系统操作
  SYSTEM_START: 'SYSTEM_START',
  SYSTEM_STOP: 'SYSTEM_STOP',
  SYSTEM_ERROR: 'SYSTEM_ERROR',

  // 自定义操作
  CUSTOM: 'CUSTOM'
};

// 错误消息
const ERROR_MESSAGES = {
  INVALID_INPUT: '无效的输入参数',
  WRITE_FAILED: '写入审计日志失败',
  READ_FAILED: '读取审计日志失败',
  ARCHIVE_FAILED: '归档审计日志失败',
  EXPORT_FAILED: '导出审计日志失败',
  IMPORT_FAILED: '导入审计日志失败',
  PARSE_FAILED: '解析审计日志失败',
  FILE_NOT_FOUND: '审计日志文件不存在',
  PERMISSION_DENIED: '权限被拒绝'
};

/**
 * 审计日志项类
 */
class AuditLogEntry {
  /**
   * 创建审计日志项
   * @param {Object} options - 选项
   * @param {string} options.id - 日志ID
   * @param {string} options.operation - 操作类型
   * @param {string} options.level - 日志级别
   * @param {string} options.message - 日志消息
   * @param {Object} options.context - 上下文信息
   * @param {string} options.userId - 用户ID
   * @param {string} options.sessionId - 会话ID
   * @param {string} options.ipAddress - IP地址
   * @param {string} options.userAgent - 用户代理
   * @param {boolean} options.success - 是否成功
   * @param {string} options.errorMessage - 错误消息
   * @param {Date} options.timestamp - 时间戳
   */
  constructor(options = {}) {
    this.id = options.id || this._generateId();
    this.operation = options.operation || OperationType.CUSTOM;
    this.level = options.level || AuditLevel.INFO;
    this.message = options.message || '';
    this.context = options.context || {};
    this.userId = options.userId || null;
    this.sessionId = options.sessionId || null;
    this.ipAddress = options.ipAddress || null;
    this.userAgent = options.userAgent || null;
    this.success = options.success !== undefined ? options.success : true;
    this.errorMessage = options.errorMessage || null;
    this.timestamp = options.timestamp || new Date();
  }

  /**
   * 生成唯一ID
   * @returns {string} ID
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 转换为JSON
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      operation: this.operation,
      level: this.level,
      message: this.message,
      context: this._sanitizeContext(this.context),
      userId: this.userId,
      sessionId: this.sessionId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      success: this.success,
      errorMessage: this.errorMessage,
      timestamp: this.timestamp.toISOString()
    };
  }

  /**
   * 清理敏感信息
   * @param {Object} context - 上下文
   * @returns {Object} 清理后的上下文
   * @private
   */
  _sanitizeContext(context) {
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * 从JSON创建
   * @param {Object} json - JSON对象
   * @returns {AuditLogEntry} 审计日志项
   */
  static fromJSON(json) {
    return new AuditLogEntry({
      id: json.id,
      operation: json.operation,
      level: json.level,
      message: json.message,
      context: json.context,
      userId: json.userId,
      sessionId: json.sessionId,
      ipAddress: json.ipAddress,
      userAgent: json.userAgent,
      success: json.success,
      errorMessage: json.errorMessage,
      timestamp: new Date(json.timestamp)
    });
  }
}

/**
 * 审计日志引擎类
 */
class AuditLogEngine {
  /**
   * 创建审计日志引擎
   * @param {Object} options - 选项
   * @param {string} options.logDir - 日志目录
   * @param {boolean} options.enableFile - 是否启用文件日志
   * @param {number} options.maxFileSize - 最大文件大小 (MB)
   * @param {number} options.maxFileCount - 最大文件数量
   * @param {number} options.retentionDays - 保留天数
   * @param {boolean} options.sanitize - 是否清理敏感信息
   */
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(os.homedir(), '.newapi-chat-logs', 'audit');
    this.enableFile = options.enableFile !== false;
    this.maxFileSize = (options.maxFileSize || 10) * 1024 * 1024; // 转换为字节
    this.maxFileCount = options.maxFileCount || 30;
    this.retentionDays = options.retentionDays || 90;
    this.sanitize = options.sanitize !== false;

    // 确保日志目录存在
    this._ensureLogDir();

    // 清理过期日志
    this._cleanupOldLogs();
  }

  /**
   * 确保日志目录存在
   * @private
   */
  _ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 获取日志文件路径
   * @returns {string} 日志文件路径
   * @private
   */
  _getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `audit-${date}.log`);
  }

  /**
   * 获取归档日志文件路径
   * @param {Date} date - 日期
   * @returns {string} 归档文件路径
   * @private
   */
  _getArchiveFilePath(date) {
    const dateStr = date.toISOString().split('T')[0];
    return path.join(this.logDir, `archive`, `audit-${dateStr}.log`);
  }

  /**
   * 清理过期日志
   * @private
   */
  _cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge && file.endsWith('.log')) {
          fs.unlinkSync(filePath);
          logger.debug(`删除过期审计日志: ${file}`);
        }
      }
    } catch (error) {
      logger.error('清理过期日志失败', error);
    }
  }

  /**
   * 检查文件大小
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否超过大小限制
   * @private
   */
  _isFileTooLarge(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size > this.maxFileSize;
    } catch (error) {
      return false;
    }
  }

  /**
   * 记录审计日志
   * @param {string} operation - 操作类型
   * @param {string} message - 日志消息
   * @param {Object} options - 选项
   * @returns {AuditLogEntry} 审计日志项
   */
  log(operation, message, options = {}) {
    const entry = new AuditLogEntry({
      operation,
      level: options.level || AuditLevel.INFO,
      message,
      context: options.context || {},
      userId: options.userId,
      sessionId: options.sessionId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success !== undefined ? options.success : true,
      errorMessage: options.errorMessage
    });

    if (this.enableFile) {
      this._writeToFile(entry);
    }

    return entry;
  }

  /**
   * 写入文件
   * @param {AuditLogEntry} entry - 审计日志项
   * @private
   */
  _writeToFile(entry) {
    try {
      const logFile = this._getLogFilePath();

      // 检查文件大小，如果过大则归档
      if (fs.existsSync(logFile) && this._isFileTooLarge(logFile)) {
        this._archiveLogFile();
      }

      const json = entry.toJSON();
      const logLine = JSON.stringify(json) + '\n';
      fs.appendFileSync(logFile, logLine, 'utf-8');

      logger.debug(`审计日志已记录: ${entry.operation}`);
    } catch (error) {
      logger.error('写入审计日志失败', error);
    }
  }

  /**
   * 归档日志文件
   * @private
   */
  _archiveLogFile() {
    try {
      const logFile = this._getLogFilePath();
      const archiveDir = path.join(this.logDir, 'archive');

      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const archiveFile = this._getArchiveFilePath(new Date());
      fs.renameSync(logFile, archiveFile);

      logger.debug(`审计日志已归档: ${archiveFile}`);
    } catch (error) {
      logger.error('归档审计日志失败', error);
    }
  }

  /**
   * 读取日志文件
   * @param {string} filePath - 文件路径
   * @returns {Array<AuditLogEntry>} 审计日志项数组
   * @private
   */
  _readLogFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      const entries = [];

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            entries.push(AuditLogEntry.fromJSON(json));
          } catch (error) {
            logger.error('解析审计日志行失败', { line });
          }
        }
      }

      return entries;
    } catch (error) {
      logger.error('读取审计日志文件失败', error);
      return [];
    }
  }

  /**
   * 查询审计日志
   * @param {Object} filters - 过滤条件
   * @returns {Array<AuditLogEntry>} 审计日志项数组
   */
  query(filters = {}) {
    const allEntries = this.getAllLogs();

    return allEntries.filter(entry => {
      // 按操作类型过滤
      if (filters.operation && entry.operation !== filters.operation) {
        return false;
      }

      // 按级别过滤
      if (filters.level && entry.level !== filters.level) {
        return false;
      }

      // 按用户ID过滤
      if (filters.userId && entry.userId !== filters.userId) {
        return false;
      }

      // 按会话ID过滤
      if (filters.sessionId && entry.sessionId !== filters.sessionId) {
        return false;
      }

      // 按成功状态过滤
      if (filters.success !== undefined && entry.success !== filters.success) {
        return false;
      }

      // 按时间范围过滤
      if (filters.startDate && entry.timestamp < filters.startDate) {
        return false;
      }

      if (filters.endDate && entry.timestamp > filters.endDate) {
        return false;
      }

      // 按关键词过滤
      if (filters.keyword && !entry.message.includes(filters.keyword)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 获取所有日志
   * @returns {Array<AuditLogEntry>} 审计日志项数组
   */
  getAllLogs() {
    const entries = [];

    // 读取主日志文件
    const mainLogFile = this._getLogFilePath();
    entries.push(...this._readLogFile(mainLogFile));

    // 读取归档日志文件
    const archiveDir = path.join(this.logDir, 'archive');
    if (fs.existsSync(archiveDir)) {
      const archiveFiles = fs.readdirSync(archiveDir)
        .filter(file => file.endsWith('.log'))
        .sort();

      for (const file of archiveFiles) {
        const filePath = path.join(archiveDir, file);
        entries.push(...this._readLogFile(filePath));
      }
    }

    // 按时间排序 (最新的在前)
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取最近的日志
   * @param {number} limit - 数量限制
   * @returns {Array<AuditLogEntry>} 审计日志项数组
   */
  getRecentLogs(limit = 100) {
    const allLogs = this.getAllLogs();
    return allLogs.slice(0, limit);
  }

  /**
   * 按操作类型统计
   * @returns {Object} 统计结果
   */
  getStatistics() {
    const allLogs = this.getAllLogs();
    const stats = {
      total: allLogs.length,
      byOperation: {},
      byLevel: {},
      bySuccess: { true: 0, false: 0 },
      byDate: {}
    };

    for (const log of allLogs) {
      // 按操作类型统计
      stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;

      // 按级别统计
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // 按成功状态统计
      stats.bySuccess[log.success] = (stats.bySuccess[log.success] || 0) + 1;

      // 按日期统计
      const date = log.timestamp.toISOString().split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    }

    return stats;
  }

  /**
   * 导出日志
   * @param {string} filePath - 文件路径
   * @param {Object} filters - 过滤条件
   * @returns {boolean} 是否成功
   */
  export(filePath, filters = {}) {
    try {
      const entries = this.query(filters);
      const data = JSON.stringify(entries.map(e => e.toJSON()), null, 2);
      fs.writeFileSync(filePath, data, 'utf-8');
      logger.debug(`审计日志已导出到: ${filePath}`);
      return true;
    } catch (error) {
      logger.error('导出审计日志失败', error);
      return false;
    }
  }

  /**
   * 导入日志
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否成功
   */
  import(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      for (const item of data) {
        const entry = AuditLogEntry.fromJSON(item);
        this._writeToFile(entry);
      }

      logger.debug(`审计日志已导入: ${filePath}`);
      return true;
    } catch (error) {
      logger.error('导入审计日志失败', error);
      return false;
    }
  }

  /**
   * 清空所有日志
   * @returns {boolean} 是否成功
   */
  clear() {
    try {
      const files = fs.readdirSync(this.logDir);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true });
        } else if (file.endsWith('.log')) {
          fs.unlinkSync(filePath);
        }
      }

      logger.debug('所有审计日志已清空');
      return true;
    } catch (error) {
      logger.error('清空审计日志失败', error);
      return false;
    }
  }
}

// 全局审计日志引擎实例
let globalAuditLogger = null;

/**
 * 创建审计日志引擎
 * @param {Object} options - 选项
 * @returns {AuditLogEngine} 审计日志引擎
 */
export function createAuditLogger(options = {}) {
  if (Object.keys(options).length > 0) {
    // 如果提供了自定义选项，创建新实例
    globalAuditLogger = new AuditLogEngine(options);
  } else if (!globalAuditLogger) {
    // 否则使用默认选项创建
    globalAuditLogger = new AuditLogEngine();
  }
  return globalAuditLogger;
}

/**
 * 获取全局审计日志引擎
 * @returns {AuditLogEngine} 审计日志引擎
 */
export function getAuditLogger() {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogEngine();
  }
  return globalAuditLogger;
}

/**
 * 快捷记录函数
 * @param {string} operation - 操作类型
 * @param {string} message - 日志消息
 * @param {Object} options - 选项
 * @returns {AuditLogEntry} 审计日志项
 */
export function auditLog(operation, message, options = {}) {
  const logger = getAuditLogger();
  return logger.log(operation, message, options);
}

/**
 * 格式化审计日志项
 * @param {AuditLogEntry} entry - 审计日志项
 * @returns {string} 格式化的字符串
 */
export function formatAuditEntry(entry) {
  const status = entry.success ? '✅' : '❌';
  const levelIcon = {
    [AuditLevel.INFO]: 'ℹ️',
    [AuditLevel.WARNING]: '⚠️',
    [AuditLevel.ERROR]: '❌',
    [AuditLevel.CRITICAL]: '🔴'
  }[entry.level] || '📝';

  let output = `\n${levelIcon} ${entry.timestamp.toISOString()}\n`;
  output += `${status} ${entry.message}\n`;
  output += `   操作: ${entry.operation}\n`;
  output += `   级别: ${entry.level}\n`;

  if (entry.userId) {
    output += `   用户: ${entry.userId}\n`;
  }

  if (entry.sessionId) {
    output += `   会话: ${entry.sessionId}\n`;
  }

  if (entry.ipAddress) {
    output += `   IP: ${entry.ipAddress}\n`;
  }

  if (!entry.success && entry.errorMessage) {
    output += `   错误: ${entry.errorMessage}\n`;
  }

  if (Object.keys(entry.context).length > 0) {
    output += `   上下文: ${JSON.stringify(entry.context)}\n`;
  }

  return output;
}

/**
 * 格式化审计日志列表
 * @param {Array<AuditLogEntry>} entries - 审计日志项数组
 * @returns {string} 格式化的字符串
 */
export function formatAuditLogList(entries) {
  if (entries.length === 0) {
    return '  暂无审计日志\n';
  }

  let output = '\n';
  entries.forEach((entry, index) => {
    const status = entry.success ? '✅' : '❌';
    const time = entry.timestamp.toLocaleString();
    output += `  ${index + 1}. ${status} ${time} - ${entry.message}\n`;
    output += `     操作: ${entry.operation}\n\n`;
  });

  return output;
}

/**
 * 格式化统计信息
 * @param {Object} stats - 统计信息
 * @returns {string} 格式化的字符串
 */
export function formatAuditStatistics(stats) {
  let output = '\n📊 审计日志统计\n';
  output += '='.repeat(50) + '\n';
  output += `总日志数: ${stats.total}\n\n`;

  output += '按操作类型:\n';
  const sortedByOperation = Object.entries(stats.byOperation)
    .sort((a, b) => b[1] - a[1]);
  for (const [op, count] of sortedByOperation) {
    output += `  ${op}: ${count}\n`;
  }

  output += '\n按日志级别:\n';
  for (const [level, count] of Object.entries(stats.byLevel)) {
    output += `  ${level}: ${count}\n`;
  }

  output += '\n按成功状态:\n';
  output += `  成功: ${stats.bySuccess.true}\n`;
  output += `  失败: ${stats.bySuccess.false}\n`;

  output += '\n按日期 (最近7天):\n';
  const sortedByDate = Object.entries(stats.byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);
  for (const [date, count] of sortedByDate) {
    output += `  ${date}: ${count}\n`;
  }

  return output;
}

// 导出类和常量
export {
  AuditLogEngine,
  AuditLogEntry,
  AuditLevel,
  OperationType,
  ERROR_MESSAGES
};
