/**
 * 自动修复建议系统
 * 检测常见错误并提供修复建议
 */

import { logger } from './logger.js';
import {
  ConfigError,
  APIError,
  FileSystemError,
  NetworkError,
  ValidationError
} from './errors.js';

/**
 * 错误检测器接口
 */
export class ErrorDetector {
  constructor() {
    this.detectionRules = [];
  }

  /**
   * 注册检测规则
   * @param {Object} rule - 检测规则
   * @param {string} rule.name - 规则名称
   * @param {Function} rule.matcher - 错误匹配函数
   * @param {Function} rule.analyzer - 错误分析函数
   * @param {number} rule.priority - 优先级 (0-100, 越高越优先)
   */
  registerRule(rule) {
    this.detectionRules.push({
      ...rule,
      priority: rule.priority || 50
    });
    // 按优先级排序
    this.detectionRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 检测错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   * @returns {Array} 匹配的检测结果
   */
  detect(error, context = {}) {
    const results = [];
    for (const rule of this.detectionRules) {
      if (rule.matcher(error, context)) {
        const analysis = rule.analyzer(error, context);
        results.push({
          ruleName: rule.name,
          priority: rule.priority,
          ...analysis
        });
      }
    }
    return results;
  }
}

/**
 * 修复建议生成器
 */
export class FixSuggestionGenerator {
  constructor() {
    this.fixTemplates = new Map();
  }

  /**
   * 注册修复模板
   * @param {string} errorType - 错误类型
   * @param {Function} generator - 修复建议生成函数
   */
  registerTemplate(errorType, generator) {
    this.fixTemplates.set(errorType, generator);
  }

  /**
   * 生成修复建议
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   * @returns {Array} 修复建议列表
   */
  generateSuggestions(error, context = {}) {
    const suggestions = [];

    // 根据错误类型生成建议
    if (error instanceof ConfigError) {
      const configSuggestions = this.generateConfigSuggestions(error, context);
      suggestions.push(...configSuggestions);
    } else if (error instanceof APIError) {
      const apiSuggestions = this.generateAPISuggestions(error, context);
      suggestions.push(...apiSuggestions);
    } else if (error instanceof FileSystemError) {
      const fsSuggestions = this.generateFileSystemSuggestions(error, context);
      suggestions.push(...fsSuggestions);
    } else if (error instanceof NetworkError) {
      const networkSuggestions = this.generateNetworkSuggestions(error, context);
      suggestions.push(...networkSuggestions);
    } else if (error instanceof ValidationError) {
      const validationSuggestions = this.generateValidationSuggestions(error, context);
      suggestions.push(...validationSuggestions);
    }

    // 通用错误建议
    const generalSuggestions = this.generateGeneralSuggestions(error, context);
    suggestions.push(...generalSuggestions);

    // 按优先级排序
    return suggestions.sort((a, b) => (b.priority || 50) - (a.priority || 50));
  }

  /**
   * 配置错误建议
   */
  generateConfigSuggestions(error, context) {
    const suggestions = [];
    const msg = error.message.toLowerCase();

    if (msg.includes('api key') || msg.includes('apikey') || error.code === 'API_KEY_MISSING') {
      suggestions.push({
        title: '缺少 API Key',
        description: '请配置您的 API Key 以访问服务',
        priority: 100,
        actions: [
          {
            type: 'command',
            label: '设置 API Key',
            command: 'config --set apiKey=YOUR_API_KEY'
          },
          {
            type: 'command',
            label: '使用配置向导',
            command: 'config init'
          }
        ],
        codeExample: `// 配置 API Key
npx xiaozhou-chat config --set apiKey=sk-xxx

// 或者使用配置向导
npx xiaozhou-chat config init`
      });
    }

    if (msg.includes('model') || msg.includes('模型')) {
      suggestions.push({
        title: '模型配置错误',
        description: '请检查模型名称是否正确',
        priority: 90,
        actions: [
          {
            type: 'command',
            label: '切换模型',
            command: 'config --model=gpt-4o-mini'
          },
          {
            type: 'command',
            label: '查看可用模型',
            command: 'tools --list'
          }
        ],
        codeExample: `// 切换到 GPT-4o-mini
npx xiaozhou-chat config --model=gpt-4o-mini

// 切换到 Claude
npx xiaozhou-chat config --model=claude-3-sonnet-20240229`
      });
    }

    if (msg.includes('base url') || msg.includes('endpoint')) {
      suggestions.push({
        title: 'API 端点配置错误',
        description: '请检查 base URL 配置',
        priority: 85,
        actions: [
          {
            type: 'command',
            label: '设置 Base URL',
            command: 'config --baseUrl=https://api.openai.com/v1'
          }
        ],
        codeExample: `// 设置 OpenAI API
npx xiaozhou-chat config --baseUrl=https://api.openai.com/v1

// 设置 DeepSeek API
npx xiaozhou-chat config --baseUrl=https://api.deepseek.com/v1`
      });
    }

    if (msg.includes('config') || msg.includes('配置文件')) {
      suggestions.push({
        title: '配置文件问题',
        description: '检查配置文件是否存在或格式是否正确',
        priority: 80,
        actions: [
          {
            type: 'command',
            label: '检查配置',
            command: 'config --show'
          },
          {
            type: 'command',
            label: '重置配置',
            command: 'config --reset'
          }
        ],
        codeExample: `// 查看当前配置
npx xiaozhou-chat config --show

// 重置配置
npx xiaozhou-chat config --reset`
      });
    }

    return suggestions;
  }

  /**
   * API 错误建议
   */
  generateAPISuggestions(error, context) {
    const suggestions = [];

    // 401 Unauthorized
    if (error.statusCode === 401) {
      suggestions.push({
        title: '认证失败 (401)',
        description: 'API Key 无效或已过期',
        priority: 100,
        actions: [
          {
            type: 'command',
            label: '更新 API Key',
            command: 'config --set apiKey=YOUR_NEW_API_KEY'
          }
        ],
        codeExample: `// 更新 API Key
npx xiaozhou-chat config --set apiKey=sk-xxx-new-key`
      });
    }

    // 403 Forbidden
    if (error.statusCode === 403) {
      suggestions.push({
        title: '访问被拒绝 (403)',
        description: '没有访问权限，检查 API Key 权限',
        priority: 95,
        actions: [
          {
            type: 'link',
            label: '查看 API 文档',
            url: 'https://platform.openai.com/docs/api-reference/authentication'
          }
        ],
        codeExample: `// 检查 API Key 权限
// 1. 登录到您的 API 提供商
// 2. 检查 API Key 的访问权限
// 3. 确保有足够的配额`
      });
    }

    // 404 Not Found
    if (error.statusCode === 404) {
      suggestions.push({
        title: '资源不存在 (404)',
        description: 'API 端点或模型不存在',
        priority: 90,
        actions: [
          {
            type: 'command',
            label: '检查 Base URL',
            command: 'config --show'
          },
          {
            type: 'command',
            label: '切换模型',
            command: 'config --model=gpt-4o-mini'
          }
        ],
        codeExample: `// 检查 Base URL 和模型
npx xiaozhou-chat config --show

// 尝试使用其他模型
npx xiaozhou-chat config --model=gpt-4o-mini`
      });
    }

    // 429 Rate Limit
    if (error.statusCode === 429) {
      suggestions.push({
        title: '请求过于频繁 (429)',
        description: '已达到速率限制，请稍后重试',
        priority: 85,
        actions: [
          {
            type: 'wait',
            label: '等待 30 秒后重试',
            waitTime: 30000
          }
        ],
        codeExample: `// 请求被限流，请等待
// 建议等待时间: 30秒 - 1分钟

// 或者使用命令自动重试
// (重试功能会自动处理 429 错误)`
      });
    }

    // 500 Internal Server Error
    if (error.statusCode >= 500) {
      suggestions.push({
        title: '服务器错误 (5xx)',
        description: 'API 服务暂时不可用',
        priority: 80,
        actions: [
          {
            type: 'retry',
            label: '自动重试',
            maxRetries: 3
          },
          {
            type: 'link',
            label: '检查服务状态',
            url: 'https://status.openai.com/'
          }
        ],
        codeExample: `// 服务器错误，可以自动重试
// 重试已启用，系统会自动尝试最多 3 次

// 手动重试
// 按回车键重新发送请求`
      });
    }

    // 400 Bad Request
    if (error.statusCode === 400) {
      suggestions.push({
        title: '请求参数错误 (400)',
        description: '请检查请求参数是否正确',
        priority: 90,
        actions: [
          {
            type: 'command',
            label: '检查配置',
            command: 'config --show'
          },
          {
            type: 'command',
            label: '切换模型',
            command: 'config --model=gpt-4o-mini'
          }
        ],
        codeExample: `// 常见的 400 错误原因:
// 1. 模型名称错误
//    npx xiaozhou-chat config --model=gpt-4o-mini
//
// 2. 参数格式错误
//    检查 max_tokens, temperature 等参数
//
// 3. 消息格式错误
//    检查消息的 role 字段 (user/assistant/system)`
      });
    }

    return suggestions;
  }

  /**
   * 文件系统错误建议
   */
  generateFileSystemSuggestions(error, context) {
    const suggestions = [];

    if (error.code === 'ENOENT') {
      suggestions.push({
        title: '文件或目录不存在',
        description: '请检查文件路径是否正确',
        priority: 90,
        actions: [
          {
            type: 'command',
            label: '创建配置文件',
            command: 'config init'
          }
        ],
        codeExample: `// 文件不存在，请检查路径
// 或者创建配置文件
npx xiaozhou-chat config init`
      });
    }

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      suggestions.push({
        title: '没有访问权限',
        description: '请检查文件权限或使用 sudo',
        priority: 85,
        actions: [
          {
            type: 'command',
            label: '检查权限',
            command: 'ls -la'
          }
        ],
        codeExample: `// 检查文件权限
ls -la ~/.newapi-chat-config.json

// 修复权限 (如果需要)
chmod 644 ~/.newapi-chat-config.json`
      });
    }

    if (error.code === 'ENOSPC') {
      suggestions.push({
        title: '磁盘空间不足',
        description: '请清理磁盘空间',
        priority: 80,
        actions: [
          {
            type: 'command',
            label: '清理缓存',
            command: 'cache clear'
          }
        ],
        codeExample: `// 清理缓存
npx xiaozhou-chat cache clear

// 或者手动清理
rm -rf ~/.newapi-chat/cache/*`
      });
    }

    return suggestions;
  }

  /**
   * 网络错误建议
   */
  generateNetworkSuggestions(error, context) {
    const suggestions = [];

    suggestions.push({
      title: '网络连接失败',
      description: '请检查网络连接或代理设置',
      priority: 90,
      actions: [
        {
          type: 'command',
          label: '检查网络',
          command: 'ping api.openai.com'
        }
      ],
      codeExample: `// 检查网络连接
ping api.openai.com

// 如果使用代理，检查代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY

// 临时禁用代理
unset HTTP_PROXY
unset HTTPS_PROXY`
    });

    if (error.message?.includes('timeout')) {
      suggestions.push({
        title: '请求超时',
        description: '网络响应过慢，请检查连接',
        priority: 85,
        actions: [
          {
            type: 'config',
            label: '增加超时时间',
            key: 'timeout',
            value: 60000
          }
        ],
        codeExample: `// 增加超时时间
npx xiaozhou-chat config --timeout=60000`
      });
    }

    if (error.code === 'ECONNREFUSED') {
      suggestions.push({
        title: '连接被拒绝',
        description: '目标服务器不可达',
        priority: 90,
        actions: [
          {
            type: 'command',
            label: '检查服务',
            command: 'curl https://api.openai.com/v1/models'
          }
        ],
        codeExample: `// 测试 API 连接
curl https://api.openai.com/v1/models

// 检查防火墙设置
// 检查 VPN 连接`
      });
    }

    return suggestions;
  }

  /**
   * 验证错误建议
   */
  generateValidationSuggestions(error, context) {
    const suggestions = [];

    suggestions.push({
      title: '输入验证失败',
      description: '请检查输入参数格式',
      priority: 90,
      actions: [
        {
          type: 'help',
          label: '查看帮助',
          command: 'help'
        }
      ],
      codeExample: `// 检查输入格式
// 1. 确保所有必需参数都已提供
// 2. 检查参数类型是否正确
// 3. 验证参数值范围

// 查看命令帮助
npx xiaozhou-chat help`
    });

    return suggestions;
  }

  /**
   * 通用错误建议
   */
  generateGeneralSuggestions(error, context) {
    const suggestions = [];

    // 查看日志
    suggestions.push({
      title: '查看详细日志',
      description: '获取更多调试信息',
      priority: 70,
      actions: [
        {
          type: 'command',
          label: '查看日志',
          command: 'log show'
        }
      ],
      codeExample: `// 查看日志
npx xiaozhou-chat log show

// 启用调试日志
DEBUG=xzchat:* npx xiaozhou-chat`
    });

    // 获取帮助
    suggestions.push({
      title: '获取帮助',
      description: '查看相关文档和帮助信息',
      priority: 60,
      actions: [
        {
          type: 'command',
          label: '查看帮助',
          command: 'help'
        },
        {
          type: 'link',
          label: '查看文档',
          url: 'https://github.com/xiaozhou/xzchat'
        }
      ],
      codeExample: `// 查看帮助
npx xiaozhou-chat help

// 查看特定命令帮助
npx xiaozhou-chat help config`
    });

    return suggestions;
  }
}

/**
 * 自动修复引擎
 */
export class AutoFixEngine {
  constructor(options = {}) {
    this.options = {
      maxSuggestions: options.maxSuggestions || 5,
      autoFixEnabled: options.autoFixEnabled || false,
      ...options
    };

    this.detector = new ErrorDetector();
    this.generator = new FixSuggestionGenerator();

    this.initializeRules();
  }

  /**
   * 初始化检测规则
   */
  initializeRules() {
    // API Key 错误
    this.detector.registerRule({
      name: 'API_KEY_MISSING',
      priority: 100,
      matcher: (error) => {
        return error instanceof ConfigError &&
          (error.message.toLowerCase().includes('api key') ||
           error.code === 'API_KEY_MISSING');
      },
      analyzer: (error) => ({
        severity: 'critical',
        category: 'config',
        message: '缺少或无效的 API Key',
        quickFix: '运行 `config init` 配置 API Key'
      })
    });

    // 模型错误
    this.detector.registerRule({
      name: 'MODEL_NOT_FOUND',
      priority: 95,
      matcher: (error) => {
        return error instanceof APIError && error.statusCode === 404 ||
          (error instanceof ConfigError && error.message.toLowerCase().includes('model'));
      },
      analyzer: (error) => ({
        severity: 'high',
        category: 'config',
        message: '模型不存在或不可用',
        quickFix: '运行 `config --model=gpt-4o-mini` 切换模型'
      })
    });

    // 网络错误
    this.detector.registerRule({
      name: 'NETWORK_ERROR',
      priority: 80,
      matcher: (error) => {
        return error instanceof NetworkError ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.message?.includes('fetch failed');
      },
      analyzer: (error) => ({
        severity: 'medium',
        category: 'network',
        message: '网络连接失败',
        quickFix: '检查网络连接或代理设置'
      })
    });

    // 速率限制
    this.detector.registerRule({
      name: 'RATE_LIMIT',
      priority: 75,
      matcher: (error) => {
        return error instanceof APIError && error.statusCode === 429;
      },
      analyzer: (error) => ({
        severity: 'medium',
        category: 'api',
        message: '请求过于频繁，已达到速率限制',
        quickFix: '等待 30 秒后重试'
      })
    });

    // 认证错误
    this.detector.registerRule({
      name: 'AUTH_ERROR',
      priority: 95,
      matcher: (error) => {
        return error instanceof APIError && error.statusCode === 401;
      },
      analyzer: (error) => ({
        severity: 'critical',
        category: 'auth',
        message: 'API Key 无效或已过期',
        quickFix: '运行 `config --set apiKey=YOUR_NEW_KEY` 更新 API Key'
      })
    });

    // 文件不存在
    this.detector.registerRule({
      name: 'FILE_NOT_FOUND',
      priority: 70,
      matcher: (error) => {
        return error instanceof FileSystemError && error.code === 'ENOENT';
      },
      analyzer: (error) => ({
        severity: 'low',
        category: 'filesystem',
        message: '文件或目录不存在',
        quickFix: '运行 `config init` 创建配置文件'
      })
    });
  }

  /**
   * 分析错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   * @returns {Object} 分析结果
   */
  analyzeError(error, context = {}) {
    logger.debug('开始分析错误', { error: error.message, context });

    // 检测错误
    const detections = this.detector.detect(error, context);

    // 生成修复建议
    const suggestions = this.generator.generateSuggestions(error, context);

    // 限制建议数量
    const filteredSuggestions = suggestions.slice(0, this.options.maxSuggestions);

    return {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      },
      detections,
      suggestions: filteredSuggestions,
      hasAutoFix: this.hasAutoFix(filteredSuggestions),
      summary: this.generateSummary(error, detections, filteredSuggestions)
    };
  }

  /**
   * 检查是否有自动修复方案
   */
  hasAutoFix(suggestions) {
    return suggestions.some(s => s.actions && s.actions.some(a => a.type === 'auto'));
  }

  /**
   * 生成错误摘要
   */
  generateSummary(error, detections, suggestions) {
    if (detections.length === 0) {
      return `错误: ${error.message}`;
    }

    const detection = detections[0];
    const suggestion = suggestions[0];

    return `${detection.message}\n快速修复: ${suggestion.quickFix || '查看详细建议'}`;
  }

  /**
   * 格式化输出
   * @param {Object} analysis - 分析结果
   * @returns {string} 格式化的文本
   */
  formatOutput(analysis) {
    const lines = [];

    lines.push('\n' + '='.repeat(60));
    lines.push('🔧 自动修复建议');
    lines.push('='.repeat(60));

    // 错误信息
    lines.push('\n❌ 错误信息:');
    lines.push(`   类型: ${analysis.error.name}`);
    lines.push(`   消息: ${analysis.error.message}`);
    if (analysis.error.code) {
      lines.push(`   代码: ${analysis.error.code}`);
    }
    if (analysis.error.statusCode) {
      lines.push(`   状态码: ${analysis.error.statusCode}`);
    }

    // 检测结果
    if (analysis.detections.length > 0) {
      lines.push('\n🔍 检测结果:');
      analysis.detections.forEach(d => {
        lines.push(`   [${d.severity?.toUpperCase() || 'INFO'}] ${d.message}`);
      });
    }

    // 修复建议
    if (analysis.suggestions.length > 0) {
      lines.push('\n💡 修复建议:');
      analysis.suggestions.forEach((s, index) => {
        lines.push(`\n   ${index + 1}. ${s.title}`);
        lines.push(`      ${s.description}`);
        if (s.quickFix) {
          lines.push(`      快速修复: ${s.quickFix}`);
        }
        if (s.actions && s.actions.length > 0) {
          lines.push('      建议操作:');
          s.actions.forEach(action => {
            const actionLabel = this.formatAction(action);
            lines.push(`        - ${actionLabel}`);
          });
        }
        if (s.codeExample) {
          lines.push('\n      示例代码:');
          s.codeExample.split('\n').forEach(line => {
            lines.push(`        ${line}`);
          });
        }
      });
    }

    // 摘要
    if (analysis.summary) {
      lines.push('\n' + '-'.repeat(60));
      lines.push('📝 摘要:');
      lines.push(`   ${analysis.summary}`);
    }

    lines.push('='.repeat(60) + '\n');

    return lines.join('\n');
  }

  /**
   * 格式化操作
   */
  formatAction(action) {
    switch (action.type) {
      case 'command':
        return `命令: ${action.label} (\`${action.command}\`)`;
      case 'link':
        return `链接: ${action.label} (${action.url})`;
      case 'wait':
        return `等待: ${action.label} (${action.waitTime / 1000}秒)`;
      case 'retry':
        return `重试: ${action.label} (最多 ${action.maxRetries} 次)`;
      case 'config':
        return `配置: ${action.label} (${action.key}=${action.value})`;
      case 'help':
        return `帮助: ${action.label}`;
      case 'auto':
        return `✨ 自动修复: ${action.label}`;
      default:
        return `${action.label}`;
    }
  }

  /**
   * 打印修复建议
   */
  printSuggestions(error, context = {}) {
    const analysis = this.analyzeError(error, context);
    const output = this.formatOutput(analysis);
    console.log(output);

    // 记录到日志
    logger.info('生成自动修复建议', {
      error: error.message,
      suggestionsCount: analysis.suggestions.length
    });

    return analysis;
  }

  /**
   * 获取 JSON 格式的分析结果
   */
  toJSON(error, context = {}) {
    const analysis = this.analyzeError(error, context);
    return JSON.stringify(analysis, null, 2);
  }
}

// 创建单例实例
const defaultEngine = new AutoFixEngine();

/**
 * 快捷函数: 分析错误并打印建议
 */
export function analyzeAndSuggest(error, context = {}) {
  return defaultEngine.printSuggestions(error, context);
}

/**
 * 快捷函数: 仅分析错误
 */
export function analyzeError(error, context = {}) {
  return defaultEngine.analyzeError(error, context);
}

/**
 * 快捷函数: 格式化输出
 */
export function formatSuggestions(analysis) {
  return defaultEngine.formatOutput(analysis);
}

export default AutoFixEngine;
