/**
 * 配置验证模块
 * 提供配置文件的Schema验证和错误报告
 */

import { logger } from './logger.js';

/**
 * Schema规则定义
 */
export const CONFIG_SCHEMA = {
  // API配置
  apiKey: {
    type: 'string',
    required: false,
    pattern: /^sk-[a-zA-Z0-9_-]+$/,
    message: 'API Key 格式不正确，应为 sk- 开头的字符串'
  },
  baseUrl: {
    type: 'string',
    required: false,
    pattern: /^https?:\/\/.+/,
    message: 'Base URL 格式不正确，应为有效的HTTP(S) URL'
  },
  model: {
    type: 'string',
    required: false,
    minLength: 1,
    message: 'Model 不能为空'
  },
  provider: {
    type: 'string',
    required: false,
    enum: ['openai', 'claude', 'deepseek', 'moonshot', 'codex', 'newapi'],
    message: 'Provider 必须是 openai, claude, deepseek, moonshot, codex 或 newapi 之一'
  },
  currentProfile: {
    type: 'string',
    required: false,
    message: 'Profile 名称必须是字符串'
  },

  // 可选参数
  temperature: {
    type: 'number',
    required: false,
    min: 0,
    max: 2,
    message: 'Temperature 必须在 0-2 之间'
  },
  maxTokens: {
    type: 'number',
    required: false,
    min: 1,
    max: 128000,
    message: 'Max Tokens 必须在 1-128000 之间'
  },
  systemPrompt: {
    type: 'string',
    required: false,
    message: 'System Prompt 必须是字符串'
  },
  embeddingModel: {
    type: 'string',
    required: false,
    message: 'Embedding Model 必须是字符串'
  },

  // 嵌套对象
  profiles: {
    type: 'object',
    required: false,
    validate: (value) => {
      if (typeof value !== 'object' || value === null) {
        return false;
      }
      // 检查每个profile
      for (const [name, profile] of Object.entries(value)) {
        if (typeof profile !== 'object' || profile === null) {
          return false;
        }
        // profile必须包含基本字段
        if (!profile.apiKey && !profile.baseUrl && !profile.model) {
          return false;
        }
      }
      return true;
    },
    message: 'Profiles 格式不正确'
  },

  roles: {
    type: 'object',
    required: false,
    validate: (value) => {
      if (typeof value !== 'object' || value === null) {
        return false;
      }
      // 检查每个role
      for (const [name, prompt] of Object.entries(value)) {
        if (typeof prompt !== 'string' || prompt.length === 0) {
          return false;
        }
      }
      return true;
    },
    message: 'Roles 格式不正确，每个role必须有非空的prompt'
  },

  // 布尔值
  showThinking: {
    type: 'boolean',
    required: false,
    message: 'showThinking 必须是布尔值'
  }
};

/**
 * Profile配置Schema
 */
export const PROFILE_SCHEMA = {
  apiKey: {
    type: 'string',
    required: false,
    pattern: /^sk-[a-zA-Z0-9_-]+$/,
    message: 'API Key 格式不正确'
  },
  baseUrl: {
    type: 'string',
    required: false,
    pattern: /^https?:\/\/.+/,
    message: 'Base URL 格式不正确'
  },
  model: {
    type: 'string',
    required: false,
    minLength: 1,
    message: 'Model 不能为空'
  },
  systemPrompt: {
    type: 'string',
    required: false,
    message: 'System Prompt 必须是字符串'
  },
  temperature: {
    type: 'number',
    required: false,
    min: 0,
    max: 2,
    message: 'Temperature 必须在 0-2 之间'
  },
  maxTokens: {
    type: 'number',
    required: false,
    min: 1,
    max: 128000,
    message: 'Max Tokens 必须在 1-128000 之间'
  }
};

/**
 * 验证单个字段
 */
function validateField(key, value, rule) {
  const errors = [];
  const warnings = [];

  // 检查必填字段
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${key}: 必填字段缺失`);
    return { errors, warnings };
  }

  // 如果值不存在且非必填，跳过验证
  if (value === undefined || value === null) {
    return { errors, warnings };
  }

  // 类型检查
  if (rule.type && typeof value !== rule.type) {
    errors.push(`${key}: ${rule.message || `类型错误，期望 ${rule.type}，实际是 ${typeof value}`}`);
    return { errors, warnings };
  }

  // 字符串长度检查
  if (rule.type === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${key}: 长度不能少于 ${rule.minLength}`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${key}: 长度不能超过 ${rule.maxLength}`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${key}: ${rule.message || '格式不正确'}`);
    }
  }

  // 数字范围检查
  if (rule.type === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${key}: 不能小于 ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${key}: 不能大于 ${rule.max}`);
    }
  }

  // 枚举值检查
  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${key}: 必须是 ${rule.enum.join(', ')} 之一`);
  }

  // 自定义验证函数
  if (rule.validate && !rule.validate(value)) {
    errors.push(`${key}: ${rule.message || '验证失败'}`);
  }

  return { errors, warnings };
}

/**
 * 验证配置对象
 */
export function validateConfig(config, schema = CONFIG_SCHEMA) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  // 检查是否是对象
  if (typeof config !== 'object' || config === null) {
    result.valid = false;
    result.errors.push('配置必须是对象');
    return result;
  }

  // 验证每个字段
  for (const [key, rule] of Object.entries(schema)) {
    const { errors, warnings } = validateField(key, config[key], rule);
    result.errors.push(...errors);
    result.warnings.push(...warnings);
  }

  // 检查profiles
  if (config.profiles && typeof config.profiles === 'object') {
    for (const [profileName, profile] of Object.entries(config.profiles)) {
      if (typeof profile === 'object' && profile !== null) {
        const profileValidation = validateConfig(profile, PROFILE_SCHEMA);
        result.errors.push(
          ...profileValidation.errors.map(err => `profiles.${profileName}.${err}`)
        );
        result.warnings.push(
          ...profileValidation.warnings.map(warn => `profiles.${profileName}.${warn}`)
        );
      }
    }

    // 检查currentProfile是否存在
    if (config.currentProfile && !config.profiles[config.currentProfile]) {
      result.errors.push(`currentProfile "${config.currentProfile}" 在 profiles 中不存在`);
    }
  }

  // 检查是否至少有一个有效配置
  const hasApiKey = config.apiKey || (config.profiles && Object.values(config.profiles).some(p => p.apiKey));
  const hasBaseUrl = config.baseUrl || (config.profiles && Object.values(config.profiles).some(p => p.baseUrl));
  const hasModel = config.model || (config.profiles && Object.values(config.profiles).some(p => p.model));

  if (!hasApiKey && !hasBaseUrl && !hasModel) {
    result.warnings.push('配置缺少必要的 API Key、Base URL 或 Model，可能无法使用');
  }

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * 格式化验证结果
 */
export function formatValidationResult(result) {
  const lines = [];

  if (result.valid) {
    lines.push('✅ 配置验证通过');
  } else {
    lines.push('❌ 配置验证失败');
  }

  if (result.errors.length > 0) {
    lines.push('\n错误:');
    result.errors.forEach((error, index) => {
      lines.push(`  ${index + 1}. ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('\n警告:');
    result.warnings.forEach((warning, index) => {
      lines.push(`  ${index + 1}. ${warning}`);
    });
  }

  return lines.join('\n');
}

/**
 * 自动修复配置（尽可能修复常见问题）
 */
export function autoFixConfig(config) {
  const fixed = { ...config };
  const fixes = [];

  // 自动设置默认值
  if (!fixed.currentProfile && fixed.profiles) {
    const profileNames = Object.keys(fixed.profiles);
    if (profileNames.length > 0) {
      fixed.currentProfile = profileNames[0];
      fixes.push(`设置 currentProfile 为 "${profileNames[0]}"`);
    }
  }

  // 确保profiles对象存在
  if (!fixed.profiles || typeof fixed.profiles !== 'object') {
    fixed.profiles = {};
    fixes.push('创建空的 profiles 对象');
  }

  // 从顶层配置迁移到default profile
  const defaultProfile = fixed.profiles.default || {};
  let profileModified = false;

  if (fixed.apiKey && !defaultProfile.apiKey) {
    defaultProfile.apiKey = fixed.apiKey;
    profileModified = true;
  }

  if (fixed.baseUrl && !defaultProfile.baseUrl) {
    defaultProfile.baseUrl = fixed.baseUrl;
    profileModified = true;
  }

  if (fixed.model && !defaultProfile.model) {
    defaultProfile.model = fixed.model;
    profileModified = true;
  }

  if (profileModified) {
    fixed.profiles.default = defaultProfile;
    fixes.push('迁移顶层配置到 default profile');
  }

  // 移除空值
  const cleanProfiles = {};
  for (const [name, profile] of Object.entries(fixed.profiles)) {
    const cleanProfile = {};
    for (const [key, value] of Object.entries(profile)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanProfile[key] = value;
      }
    }
    if (Object.keys(cleanProfile).length > 0) {
      cleanProfiles[name] = cleanProfile;
    }
  }
  fixed.profiles = cleanProfiles;

  // 验证修复后的配置
  const validation = validateConfig(fixed);

  return {
    fixed,
    fixes,
    validation
  };
}

/**
 * 获取配置建议
 */
export function getConfigSuggestions(config) {
  const suggestions = [];

  // 检查API Key
  if (!config.apiKey && (!config.profiles || !Object.values(config.profiles).some(p => p.apiKey))) {
    suggestions.push('建议: 添加 API Key 到配置文件');
  }

  // 检查Base URL
  if (!config.baseUrl && (!config.profiles || !Object.values(config.profiles).some(p => p.baseUrl))) {
    suggestions.push('建议: 添加 Base URL 到配置文件');
  }

  // 检查Model
  if (!config.model && (!config.profiles || !Object.values(config.profiles).some(p => p.model))) {
    suggestions.push('建议: 设置默认 Model');
  }

  // 建议使用profiles管理多个配置
  if (config.apiKey && !config.profiles) {
    suggestions.push('建议: 使用 profiles 管理多个配置');
  }

  // 建议添加system prompt
  if (!config.systemPrompt && (!config.roles || Object.keys(config.roles).length === 0)) {
    suggestions.push('建议: 添加 system prompt 或自定义 roles');
  }

  return suggestions;
}

/**
 * 导出配置验证函数
 */
export default {
  validateConfig,
  formatValidationResult,
  autoFixConfig,
  getConfigSuggestions,
  CONFIG_SCHEMA,
  PROFILE_SCHEMA
};
