import { sanitizeSensitiveInfo, createSecureError } from "./security.js";

/**
 * 错误上下文收集器
 */
class ErrorContext {
  constructor() {
    this.context = {
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  generateRequestId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  add(key, value) {
    this.context[key] = sanitizeSensitiveInfo(String(value));
    return this;
  }

  addFromError(error) {
    if (error.code) this.add('errorCode', error.code);
    if (error.status) this.add('httpStatus', error.status);
    if (error.message) this.add('errorMessage', error.message);
    return this;
  }

  build() {
    return { ...this.context };
  }
}

/**
 * 统一错误处理器
 */
class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logToConsole: true,
      logToFile: false,
      showErrorDetails: options.showErrorDetails !== false,
      ...options
    };
  }

  /**
   * 处理错误
   */
  handle(error, context = {}) {
    const errorContext = new ErrorContext();

    // 添加上下文信息
    Object.entries(context).forEach(([key, value]) => {
      errorContext.add(key, value);
    });

    // 添加错误信息
    errorContext.addFromError(error);

    const fullContext = errorContext.build();

    // 构造用户友好的错误消息
    const userMessage = this.buildUserMessage(error);
    const debugMessage = this.buildDebugMessage(error, fullContext);

    // 记录日志
    if (this.options.logToConsole) {
      console.error(`\n❌ ${userMessage}`);
      if (this.options.showErrorDetails) {
        console.error(`📍 Request ID: ${fullContext.requestId}`);
        console.error(`📅 Time: ${fullContext.timestamp}`);
        if (debugMessage) {
          console.error(`🔍 Details: ${debugMessage}`);
        }
      }
    }

    // 创建安全错误对象
    return createSecureError(userMessage, error);
  }

  /**
   * 构建用户友好的错误消息
   */
  buildUserMessage(error) {
    // 网络错误
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return '网络连接失败，请检查网络连接或 API 地址是否正确';
    }

    // API 错误
    if (error.status) {
      const statusMessages = {
        400: '请求参数错误',
        401: 'API Key 无效或已过期',
        403: '没有访问权限',
        404: 'API 端点不存在',
        429: '请求频率过高，请稍后重试',
        500: '服务器内部错误',
        502: '网关错误',
        503: '服务暂时不可用'
      };
      return statusMessages[error.status] || `API 请求失败 (${error.status})`;
    }

    // 文件系统错误
    if (error.code === 'ENOENT') {
      return '文件或目录不存在';
    }
    if (error.code === 'EACCES') {
      return '没有访问权限';
    }
    if (error.code === 'EMFILE') {
      return '打开的文件过多，请关闭一些文件';
    }

    // 使用原始错误消息（已脱敏）
    return sanitizeSensitiveInfo(error.message || '发生未知错误');
  }

  /**
   * 构建调试消息
   */
  buildDebugMessage(error, context) {
    const parts = [];

    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5);
      parts.push(stackLines.join('\n'));
    }

    if (context.command) {
      parts.push(`Command: ${context.command}`);
    }

    if (context.filePath) {
      parts.push(`File: ${context.filePath}`);
    }

    return parts.length > 0 ? parts.join('\n') : '';
  }

  /**
   * 包装异步函数，自动处理错误
   */
  wrap(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        throw this.handle(error, context);
      }
    };
  }
}

/**
 * 创建默认错误处理器实例
 */
export const defaultErrorHandler = new ErrorHandler();

/**
 * 快捷函数
 */
export function handleError(error, context = {}) {
  return defaultErrorHandler.handle(error, context);
}

export function wrapAsync(fn, context = {}) {
  return defaultErrorHandler.wrap(fn, context);
}

export { ErrorContext, ErrorHandler };
