/**
 * 输入验证模块
 * 提供各种输入验证和清理功能
 */

import { ValidationError } from './errors.js';
import { logger } from './logger.js';

/**
 * 验证文件路径
 */
export async function validateFilePath(filePath, options = {}) {
  const {
    allowRelative = true,
    mustExist = false,
    checkWriteable = false,
    allowedExtensions = null,
    maxSize = null // 最大文件大小（字节）
  } = options;

  // 基本检查
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('文件路径不能为空');
  }

  if (filePath.trim() !== filePath) {
    throw new ValidationError('文件路径不能包含前后空格');
  }

  // 路径格式检查
  if (filePath.includes('\n') || filePath.includes('\r')) {
    throw new ValidationError('文件路径不能包含换行符');
  }

  // 检查路径遍历攻击
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    throw new ValidationError('文件路径不能包含 ".." 路径遍历');
  }

  // 检查绝对路径（如果不允许）
  if (!allowRelative && (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath))) {
    throw new ValidationError('不允许使用绝对路径');
  }

  // 检查扩展名
  if (allowedExtensions && allowedExtensions.length > 0) {
    const ext = filePath.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new ValidationError(`不支持的文件扩展名: .${ext}。允许的扩展名: ${allowedExtensions.join(', ')}`);
    }
  }

  // 如果需要检查文件是否存在
  if (mustExist) {
    const fs = await import('node:fs');
    if (!fs.existsSync(filePath)) {
      throw new ValidationError(`文件不存在: ${filePath}`);
    }

    // 检查文件大小
    if (maxSize) {
      const stats = fs.statSync(filePath);
      if (stats.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        throw new ValidationError(`文件过大: ${fileSizeMB}MB（最大允许: ${maxSizeMB}MB）`);
      }
    }

    // 检查是否可写
    if (checkWriteable) {
      try {
        fs.accessSync(filePath, fs.constants.W_OK);
      } catch (e) {
        throw new ValidationError(`文件不可写: ${filePath}`);
      }
    }
  }

  logger.debug('文件路径验证通过', { filePath, options });
  return filePath;
}

/**
 * 验证模型名称
 */
export function validateModelName(modelName) {
  if (!modelName || typeof modelName !== 'string') {
    throw new ValidationError('模型名称不能为空');
  }

  const trimmed = modelName.trim();
  if (trimmed !== modelName) {
    throw new ValidationError('模型名称不能包含前后空格');
  }

  // 常见模型名称格式
  const validPatterns = [
    /^gpt-[34][a-z0-9-]*$/,
    /^gpt-3\.5-[a-z0-9-]*$/,
    /^gpt-4[a-z0-9-]*$/,
    /^claude-[a-z0-9-]+$/,
    /^deepseek-[a-z-]+$/
  ];

  const isValid = validPatterns.some(pattern => pattern.test(trimmed));
  if (!isValid) {
    logger.warn('模型名称格式可能不正确', { modelName: trimmed });
  }

  return trimmed;
}

/**
 * 验证 API Key
 */
export function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API Key 不能为空');
  }

  const trimmed = apiKey.trim();
  if (trimmed !== apiKey) {
    throw new ValidationError('API Key 不能包含前后空格');
  }

  if (trimmed.length < 10) {
    throw new ValidationError('API Key 长度太短');
  }

  // 常见 API Key 格式
  const openaiPattern = /^sk-[a-zA-Z0-9]{48}$/;
  const anthropicPattern = /^sk-ant-[a-zA-Z0-9_-]{95}$/;

  if (!openaiPattern.test(trimmed) && !anthropicPattern.test(trimmed)) {
    logger.warn('API Key 格式可能不正确', { prefix: trimmed.substring(0, 8) });
  }

  return trimmed;
}

/**
 * 验证 URL
 */
export function validateUrl(url, options = {}) {
  const {
    requiredProtocol = ['https:', 'http:'],
    allowLocalhost = false
  } = options;

  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL 不能为空');
  }

  const trimmed = url.trim();
  if (trimmed !== url) {
    throw new ValidationError('URL 不能包含前后空格');
  }

  try {
    const urlObj = new URL(trimmed);

    // 检查协议
    if (!requiredProtocol.includes(urlObj.protocol)) {
      throw new ValidationError(`URL 协议必须是: ${requiredProtocol.join(' 或 ')}`);
    }

    // 检查本地主机
    if (!allowLocalhost && (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      throw new ValidationError('URL 不能使用 localhost');
    }

    return trimmed;
  } catch (e) {
    if (e instanceof ValidationError) {
      throw e;
    }
    throw new ValidationError(`无效的 URL: ${url}`);
  }
}

/**
 * 验证分支 ID
 */
export function validateBranchId(branchId) {
  if (!branchId || typeof branchId !== 'string') {
    throw new ValidationError('分支 ID 不能为空');
  }

  const trimmed = branchId.trim();
  if (trimmed !== branchId) {
    throw new ValidationError('分支 ID 不能包含前后空格');
  }

  // 分支 ID 格式：branch_<timestamp>_<random>
  const branchPattern = /^branch_[0-9]+_[a-z0-9]+$/;
  if (!branchPattern.test(trimmed)) {
    throw new ValidationError(`分支 ID 格式不正确: ${trimmed}`);
  }

  return trimmed;
}

/**
 * 验证会话 ID
 */
export function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('会话 ID 不能为空');
  }

  const trimmed = sessionId.trim();
  if (trimmed !== sessionId) {
    throw new ValidationError('会话 ID 不能包含前后空格');
  }

  // 会话 ID 格式检查（宽松）
  if (trimmed.length < 1 || trimmed.length > 255) {
    throw new ValidationError('会话 ID 长度必须在 1-255 之间');
  }

  if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed)) {
    throw new ValidationError('会话 ID 包含非法字符');
  }

  return trimmed;
}

/**
 * 验证用户输入文本
 */
export function validateUserInput(text, options = {}) {
  const {
    maxLength = 100000, // 最大 100K 字符
    minLength = 1,
    allowEmpty = false
  } = options;

  if (!text || typeof text !== 'string') {
    if (allowEmpty) {
      return '';
    }
    throw new ValidationError('输入文本不能为空');
  }

  if (text.length < minLength) {
    throw new ValidationError(`输入文本长度不能少于 ${minLength} 个字符`);
  }

  if (text.length > maxLength) {
    throw new ValidationError(`输入文本长度不能超过 ${maxLength} 个字符`);
  }

  // 检查可能的恶意字符
  const dangerousPatterns = [
    /\x00/g, // 空字符
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      throw new ValidationError('输入文本包含非法字符');
    }
  }

  return text;
}

/**
 * 验证命令参数
 */
export function validateCommandArgs(args, schema) {
  const result = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = args[key];

    // 检查必填参数
    if (rule.required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`缺少必填参数: ${key}`);
    }

    // 检查参数类型
    if (value !== undefined && rule.type) {
      const expectedType = rule.type.name.toLowerCase();
      const actualType = typeof value;

      if (actualType !== expectedType) {
        throw new ValidationError(`参数 ${key} 类型错误: 期望 ${expectedType}，实际 ${actualType}`);
      }
    }

    // 检查枚举值
    if (value !== undefined && rule.enum && !rule.enum.includes(value)) {
      throw new ValidationError(`参数 ${key} 值无效: ${value}。允许的值: ${rule.enum.join(', ')}`);
    }

    // 检查数值范围
    if (value !== undefined && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        throw new ValidationError(`参数 ${key} 值过小: 最小值 ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        throw new ValidationError(`参数 ${key} 值过大: 最大值 ${rule.max}`);
      }
    }

    // 应用默认值
    if (value === undefined && rule.default !== undefined) {
      result[key] = rule.default;
    } else if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * 清理用户输入
 */
export function sanitizeInput(text, options = {}) {
  const {
    trim = true,
    removeMultipleSpaces = true,
    removeSpecialChars = false
  } = options;

  let result = text;

  if (trim) {
    result = result.trim();
  }

  if (removeMultipleSpaces) {
    result = result.replace(/\s+/g, ' ');
  }

  if (removeSpecialChars) {
    // 保留基本标点
    result = result.replace(/[^\w\s\u4e00-\u9fa5.,!?;:()[\]{}"'-]/g, '');
  }

  return result;
}

/**
 * 验证 JSON 字符串
 */
export function validateJson(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new ValidationError('JSON 字符串不能为空');
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw new ValidationError(`无效的 JSON: ${e.message}`);
  }
}

/**
 * 验证整数
 */
export function validateInteger(value, options = {}) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;

  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new ValidationError(`无效的整数: ${value}`);
  }

  if (num < min || num > max) {
    throw new ValidationError(`整数超出范围: ${num}（必须在 ${min} 和 ${max} 之间）`);
  }

  return num;
}

/**
 * 验证端口
 */
export function validatePort(port) {
  const num = validateInteger(port, { min: 1, max: 65535 });
  return num;
}

/**
 * 验证邮箱
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('邮箱不能为空');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`无效的邮箱地址: ${email}`);
  }

  return email.toLowerCase();
}

export default {
  validateFilePath,
  validateModelName,
  validateApiKey,
  validateUrl,
  validateBranchId,
  validateSessionId,
  validateUserInput,
  validateCommandArgs,
  sanitizeInput,
  validateJson,
  validateInteger,
  validatePort,
  validateEmail
};
