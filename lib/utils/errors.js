import { logger } from './logger.js';

export class XZChatError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
    super(message);
    this.name = 'XZChatError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Support error cause (ES2022)
    if (details.cause) {
      this.cause = details.cause;
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

export class ConfigError extends XZChatError {
  constructor(message, details = {}) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

export class APIError extends XZChatError {
  constructor(message, statusCode, details = {}) {
    super(message, 'API_ERROR', { statusCode, ...details });
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

export class FileSystemError extends XZChatError {
  constructor(message, details = {}) {
    super(message, 'FILE_SYSTEM_ERROR', details);
    this.name = 'FileSystemError';
  }
}

export class NetworkError extends XZChatError {
  constructor(message, details = {}) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends XZChatError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends XZChatError {
  constructor(message, details = {}) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export function handleError(error, context = {}) {
  // 如果是自定义错误，使用其方法
  if (error instanceof XZChatError) {
    logger.error(`${error.name}: ${error.message}`, {
      code: error.code,
      details: error.details,
      ...context
    });
    return error;
  }

  // 处理网络错误
  if (error.name === 'AbortError') {
    logger.info('请求被用户中断', context);
    return error;
  }

  // 处理 API 错误
  if (error.message?.includes('API Error')) {
    const match = error.message.match(/API Error \((\d+)\)/);
    const statusCode = match ? parseInt(match[1]) : 0;
    logger.error('API 请求失败', { statusCode, originalError: error.message, ...context });
    return new APIError(error.message, statusCode, { originalError: error.message });
  }

  // 处理文件系统错误
  if (error.code && ['ENOENT', 'EACCES', 'EPERM'].includes(error.code)) {
    logger.error('文件系统错误', { code: error.code, path: error.path, ...context });
    return new FileSystemError(error.message, { code: error.code, path: error.path });
  }

  // 处理其他错误
  logger.error('未处理的错误', { error: error.message, stack: error.stack, ...context });
  return error;
}

export function getErrorMessage(error) {
  if (error instanceof XZChatError) {
    return error.message;
  }

  if (error.code === 'ENOENT') {
    return '文件或目录不存在';
  }

  if (error.code === 'EACCES') {
    return '没有访问权限';
  }

  if (error.message?.includes('fetch failed')) {
    return '网络连接失败，请检查网络设置';
  }

  if (error.message?.includes('timeout')) {
    return '请求超时，请重试';
  }

  return error.message || '发生未知错误';
}

export function isRetryableError(error) {
  // 网络错误
  if (error.name === 'NetworkError') return true;
  if (error.code === 'ECONNREFUSED') return true;
  if (error.code === 'ETIMEDOUT') return true;

  // API 5xx 错误
  if (error instanceof APIError && error.statusCode >= 500) return true;

  // 408 Timeout
  if (error instanceof APIError && error.statusCode === 408) return true;

  // 429 Too Many Requests
  if (error instanceof APIError && error.statusCode === 429) return true;

  return false;
}

// Alias for compatibility with tests
export function isErrorRetryable(error) {
  return isRetryableError(error);
}

export function formatError(error, includeStack = false) {
  // Handle null/undefined
  if (!error) {
    return 'Unknown error';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle XZChatError
  if (error instanceof XZChatError) {
    let formatted = `[${error.name}] ${error.message}`;

    // Include cause if present
    if (error.cause) {
      formatted += ` | Caused by: ${error.cause.message || error.cause}`;
    }

    // Include metadata if present
    if (error.metadata) {
      formatted += ` | ${JSON.stringify(error.metadata)}`;
    }

    if (includeStack && error.stack) {
      formatted += `\n${error.stack}`;
    }
    return formatted;
  }

  // Handle regular Error
  if (error instanceof Error) {
    let formatted = error.message || 'Error';
    if (error.cause) {
      formatted += ` | Caused by: ${error.cause.message || error.cause}`;
    }
    if (includeStack && error.stack) {
      formatted += `\n${error.stack}`;
    }
    return formatted;
  }

  // Handle other types
  return String(error);
}
