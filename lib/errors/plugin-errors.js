/**
 * 插件错误类型定义
 * 统一的错误处理机制
 */

/**
 * 基础插件错误
 */
export class PluginError extends Error {
  constructor(message, code = 'PLUGIN_ERROR', details = {}) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
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

/**
 * 插件未找到错误
 */
export class PluginNotFoundError extends PluginError {
  constructor(pluginId) {
    super(
      `Plugin not found: ${pluginId}`,
      'PLUGIN_NOT_FOUND',
      { pluginId }
    );
    this.name = 'PluginNotFoundError';
    this.pluginId = pluginId;
  }
}

/**
 * 插件加载错误
 */
export class PluginLoadError extends PluginError {
  constructor(pluginId, reason) {
    super(
      `Failed to load plugin: ${pluginId} - ${reason}`,
      'PLUGIN_LOAD_ERROR',
      { pluginId, reason }
    );
    this.name = 'PluginLoadError';
    this.pluginId = pluginId;
  }
}

/**
 * 插件已加载错误
 */
export class PluginAlreadyLoadedError extends PluginError {
  constructor(pluginId) {
    super(
      `Plugin already loaded: ${pluginId}`,
      'PLUGIN_ALREADY_LOADED',
      { pluginId }
    );
    this.name = 'PluginAlreadyLoadedError';
    this.pluginId = pluginId;
  }
}

/**
 * 依赖错误
 */
export class DependencyError extends PluginError {
  constructor(pluginId, missingDeps, unsatisfiedDeps, customMessage) {
    const messages = [];
    if (customMessage) {
      messages.push(customMessage);
    } else {
      if (missingDeps.length > 0) {
        messages.push(`missing dependencies: ${missingDeps.join(', ')}`);
      }
      if (unsatisfiedDeps.length > 0) {
        messages.push(`unsatisfied dependencies: ${unsatisfiedDeps.map(d => `${d.dependency} (${d.required})`).join(', ')}`);
      }
    }

    super(
      messages.length > 0 ? `Plugin ${pluginId} has dependency issues: ${messages.join(', ')}` : `Plugin ${pluginId} has dependency issues`,
      'DEPENDENCY_ERROR',
      { pluginId, missingDeps, unsatisfiedDeps }
    );
    this.name = 'DependencyError';
    this.pluginId = pluginId;
    this.missing = missingDeps;
    this.unsatisfied = unsatisfiedDeps;
  }
}

/**
 * 循环依赖错误
 */
export class CircularDependencyError extends PluginError {
  constructor(cycle) {
    super(
      `Circular dependency detected: ${cycle.join(' -> ')}`,
      'CIRCULAR_DEPENDENCY',
      { cycle }
    );
    this.name = 'CircularDependencyError';
  }
}

/**
 * 版本错误
 */
export class VersionError extends PluginError {
  constructor(pluginId, required, current) {
    super(
      `Plugin ${pluginId} version ${current} does not meet requirement ${required}`,
      'VERSION_MISMATCH',
      { pluginId, required, current }
    );
    this.name = 'VersionError';
  }
}

/**
 * 命令执行错误
 */
export class CommandExecutionError extends PluginError {
  constructor(pluginId, command, reason) {
    super(
      `Failed to execute command ${command} in plugin ${pluginId}: ${reason}`,
      'COMMAND_EXECUTION_ERROR',
      { pluginId, command, reason }
    );
    this.name = 'CommandExecutionError';
  }
}

/**
 * 命令未找到错误
 */
export class CommandNotFoundError extends PluginError {
  constructor(command) {
    super(
      `Command not found: ${command}`,
      'COMMAND_NOT_FOUND',
      { command }
    );
    this.name = 'CommandNotFoundError';
  }
}

/**
 * 配置错误
 */
export class ConfigurationError extends PluginError {
  constructor(pluginId, field, reason) {
    super(
      `Configuration error in plugin ${pluginId}: ${field} - ${reason}`,
      'CONFIGURATION_ERROR',
      { pluginId, field, reason }
    );
    this.name = 'ConfigurationError';
  }
}

/**
 * 权限错误
 */
export class PermissionDeniedError extends PluginError {
  constructor(pluginId, permission, resource) {
    super(
      `Plugin ${pluginId} does not have permission ${permission} to access ${resource}`,
      'PERMISSION_DENIED',
      { pluginId, permission, resource }
    );
    this.name = 'PermissionDeniedError';
  }
}

/**
 * 插件状态错误
 */
export class PluginStateError extends PluginError {
  constructor(pluginId, currentStatus, expectedStatus) {
    super(
      `Plugin ${pluginId} is in ${currentStatus} state, expected ${expectedStatus}`,
      'INVALID_PLUGIN_STATE',
      { pluginId, currentStatus, expectedStatus }
    );
    this.name = 'PluginStateError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends PluginError {
  constructor(pluginId, url, reason) {
    super(
      `Network error in plugin ${pluginId}: Failed to fetch ${url} - ${reason}`,
      'NETWORK_ERROR',
      { pluginId, url, reason }
    );
    this.name = 'NetworkError';
  }
}

/**
 * 文件操作错误
 */
export class FileOperationError extends PluginError {
  constructor(pluginId, operation, filepath, reason) {
    super(
      `File operation error in plugin ${pluginId}: ${operation} on ${filepath} - ${reason}`,
      'FILE_OPERATION_ERROR',
      { pluginId, operation, filepath, reason }
    );
    this.name = 'FileOperationError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends PluginError {
  constructor(pluginId, field, value, reason) {
    super(
      `Validation error in plugin ${pluginId}: ${field} is invalid - ${reason}`,
      'VALIDATION_ERROR',
      { pluginId, field, value, reason }
    );
    this.name = 'ValidationError';
  }
}

/**
 * 插件验证错误 (新版)
 */
export class PluginValidationError extends PluginError {
  constructor(pluginId, validationErrors) {
    const errorMsg = validationErrors.map(e => e.message || String(e)).join('; ');
    super(
      `Plugin ${pluginId} validation failed: ${errorMsg}`,
      'PLUGIN_VALIDATION_ERROR',
      { pluginId, validationErrors }
    );
    this.name = 'PluginValidationError';
    this.pluginId = pluginId;
    this.validationErrors = validationErrors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

/**
 * 插件版本错误 (新版)
 */
export class PluginVersionError extends PluginError {
  constructor(pluginId, expectedVersion, actualVersion) {
    super(
      `Plugin ${pluginId} version mismatch: expected ${expectedVersion}, got ${actualVersion}`,
      'PLUGIN_VERSION_ERROR',
      { pluginId, expectedVersion, actualVersion }
    );
    this.name = 'PluginVersionError';
    this.pluginId = pluginId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      expectedVersion: this.expectedVersion,
      actualVersion: this.actualVersion
    };
  }
}

/**
 * 插件启用错误
 */
export class PluginEnableError extends PluginError {
  constructor(pluginId, reason) {
    super(
      `Failed to enable plugin ${pluginId}: ${reason}`,
      'PLUGIN_ENABLE_ERROR',
      { pluginId, reason }
    );
    this.name = 'PluginEnableError';
    this.pluginId = pluginId;
  }
}

/**
 * 插件禁用错误
 */
export class PluginDisableError extends PluginError {
  constructor(pluginId, reason) {
    super(
      `Failed to disable plugin ${pluginId}: ${reason}`,
      'PLUGIN_DISABLE_ERROR',
      { pluginId, reason }
    );
    this.name = 'PluginDisableError';
    this.pluginId = pluginId;
  }
}

/**
 * 插件钩子错误
 */
export class PluginHookError extends PluginError {
  constructor(pluginId, hookName, reason) {
    super(
      `Plugin hook error in ${pluginId} (${hookName}): ${reason}`,
      'PLUGIN_HOOK_ERROR',
      { pluginId, hookName, reason }
    );
    this.name = 'PluginHookError';
    this.pluginId = pluginId;
    this.hookName = hookName;
  }
}

/**
 * 插件命令错误
 */
export class PluginCommandError extends PluginError {
  constructor(pluginId, commandName, reason) {
    super(
      `Plugin command error in ${pluginId} (${commandName}): ${reason}`,
      'PLUGIN_COMMAND_ERROR',
      { pluginId, commandName, reason }
    );
    this.name = 'PluginCommandError';
    this.pluginId = pluginId;
    this.commandName = commandName;
  }
}

/**
 * 插件超时错误
 */
export class PluginTimeoutError extends PluginError {
  constructor(pluginId, timeout) {
    super(
      `Plugin ${pluginId} operation timed out after ${timeout}ms`,
      'PLUGIN_TIMEOUT',
      { pluginId, timeout }
    );
    this.name = 'PluginTimeoutError';
    this.pluginId = pluginId;
    this.timeout = timeout;
  }
}

/**
 * 插件安全错误
 */
export class PluginSecurityError extends PluginError {
  constructor(pluginId, reason) {
    super(
      `Plugin security violation in ${pluginId}: ${reason}`,
      'PLUGIN_SECURITY_ERROR',
      { pluginId, reason }
    );
    this.name = 'PluginSecurityError';
    this.pluginId = pluginId;
  }
}

/**
 * 插件权限错误
 */
export class PluginPermissionError extends PluginError {
  constructor(pluginId, permission) {
    super(
      `Plugin ${pluginId} lacks permission: ${permission}`,
      'PLUGIN_PERMISSION_ERROR',
      { pluginId, permission }
    );
    this.name = 'PluginPermissionError';
    this.pluginId = pluginId;
    this.permission = permission;
  }
}

/**
 * 插件配置错误
 */
export class PluginConfigurationError extends PluginError {
  constructor(pluginId, reason) {
    super(
      `Plugin configuration error in ${pluginId}: ${reason}`,
      'PLUGIN_CONFIGURATION_ERROR',
      { pluginId, reason }
    );
    this.name = 'PluginConfigurationError';
    this.pluginId = pluginId;
  }
}

/**
 * 错误代码映射
 */
export const ErrorCodes = {
  // 通用错误 (1xxx)
  PLUGIN_ERROR: 1000,
  PLUGIN_NOT_FOUND: 1001,
  PLUGIN_LOAD_ERROR: 1002,
  PLUGIN_ALREADY_LOADED: 1003,
  INVALID_PLUGIN_STATE: 1004,

  // 依赖错误 (2xxx)
  DEPENDENCY_ERROR: 2000,
  CIRCULAR_DEPENDENCY: 2001,
  VERSION_MISMATCH: 2002,

  // 命令错误 (3xxx)
  COMMAND_EXECUTION_ERROR: 3000,
  COMMAND_NOT_FOUND: 3001,

  // 配置错误 (4xxx)
  CONFIGURATION_ERROR: 4000,
  VALIDATION_ERROR: 4001,

  // 权限错误 (5xxx)
  PERMISSION_DENIED: 5000,

  // I/O 错误 (6xxx)
  NETWORK_ERROR: 6000,
  FILE_OPERATION_ERROR: 6001
};

/**
 * 错误工具函数
 */
export class ErrorHandler {
  /**
   * 创建错误响应
   */
  static createErrorResponse(error) {
    if (error instanceof PluginError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred'
      }
    };
  }

  /**
   * 检查错误类型
   */
  static isErrorType(error, errorClass) {
    return error instanceof errorClass;
  }

  /**
   * 获取错误代码
   */
  static getErrorCode(error) {
    if (error instanceof PluginError) {
      return ErrorCodes[error.code] || 1000;
    }
    return 1000;
  }

  /**
   * 格式化错误信息
   */
  static formatError(error) {
    if (error instanceof PluginError) {
      return `[${error.code}] ${error.message}`;
    }
    return `[UNKNOWN_ERROR] ${error.message || 'Unknown error'}`;
  }
}
