/**
 * 自动修复系统使用示例
 *
 * 展示如何使用自动修复建议系统检测错误并提供修复建议
 */

import {
  AutoFixEngine,
  analyzeAndSuggest,
  analyzeError,
  formatSuggestions
} from '../lib/utils/auto-fix.js';
import {
  ConfigError,
  APIError,
  FileSystemError,
  NetworkError,
  ValidationError
} from '../lib/utils/errors.js';

// 示例 1: 基础使用
console.log('\n=== 示例 1: 基础使用 ===\n');

const engine = new AutoFixEngine();

// 分析错误
const error1 = new ConfigError('API Key is missing', { code: 'API_KEY_MISSING' });
const analysis1 = engine.analyzeError(error1);

console.log('错误分析结果:');
console.log(JSON.stringify(analysis1, null, 2));

// 示例 2: 打印修复建议
console.log('\n=== 示例 2: 打印修复建议 ===\n');

const error2 = new APIError('Unauthorized', 401);
engine.printSuggestions(error2);

// 示例 3: 使用快捷函数
console.log('\n=== 示例 3: 使用快捷函数 ===\n');

const error3 = new NetworkError('Connection refused');
error3.code = 'ECONNREFUSED';

// 分析并打印建议
analyzeAndSuggest(error3);

// 示例 4: 处理不同类型的错误
console.log('\n=== 示例 4: 处理不同类型的错误 ===\n');

const errors = [
  new ConfigError('API Key is missing'),
  new APIError('Not found', 404),
  new APIError('Too many requests', 429),
  new APIError('Internal server error', 500),
  new FileSystemError('File not found', { code: 'ENOENT' }),
  new NetworkError('Connection failed'),
  new ValidationError('Invalid input')
];

errors.forEach((error, index) => {
  console.log(`\n--- 错误 ${index + 1}: ${error.message} ---`);
  const analysis = analyzeError(error);
  console.log(`检测到 ${analysis.detections.length} 个问题`);
  console.log(`生成 ${analysis.suggestions.length} 个建议`);
  if (analysis.detections.length > 0) {
    console.log(`主要问题: ${analysis.detections[0].message}`);
    console.log(`快速修复: ${analysis.suggestions[0]?.quickFix || '无'}`);
  }
});

// 示例 5: 自定义配置
console.log('\n=== 示例 5: 自定义配置 ===\n');

const customEngine = new AutoFixEngine({
  maxSuggestions: 3,
  autoFixEnabled: true
});

const error5 = new NetworkError('Connection failed');
const analysis5 = customEngine.analyzeError(error5);

console.log(`配置: 最大建议数 = ${customEngine.options.maxSuggestions}`);
console.log(`生成建议数: ${analysis5.suggestions.length}`);
console.log(`自动修复启用: ${customEngine.options.autoFixEnabled}`);

// 示例 6: 添加上下文信息
console.log('\n=== 示例 6: 添加上下文信息 ===\n');

const error6 = new APIError('Model not found', 404);
const context6 = {
  model: 'claude-3-opus-20240229',
  provider: 'anthropic',
  baseUrl: 'https://api.anthropic.com/v1'
};

const analysis6 = engine.analyzeError(error6, context6);
console.log('上下文信息:');
console.log(`  模型: ${context6.model}`);
console.log(`  提供商: ${context6.provider}`);
console.log(`  Base URL: ${context6.baseUrl}`);
console.log(`\n检测到的错误:`);
if (analysis6.detections.length > 0) {
  analysis6.detections.forEach(d => {
    console.log(`  - [${d.severity.toUpperCase()}] ${d.message}`);
  });
}

// 示例 7: JSON 格式输出
console.log('\n=== 示例 7: JSON 格式输出 ===\n');

const error7 = new ConfigError('Invalid configuration');
const json7 = engine.toJSON(error7);
console.log('JSON 格式的分析结果:');
console.log(json7);

// 示例 8: 自定义错误检测器
console.log('\n=== 示例 8: 自定义错误检测器 ===\n');

import { ErrorDetector } from '../lib/utils/auto-fix.js';

const customDetector = new ErrorDetector();

// 注册自定义规则
customDetector.registerRule({
  name: 'CUSTOM_TIMEOUT',
  priority: 60,
  matcher: (error) => {
    return error.message?.includes('timeout') && error.code === 'ETIMEDOUT';
  },
  analyzer: (error) => ({
    severity: 'medium',
    category: 'network',
    message: '请求超时',
    quickFix: '增加超时时间或检查网络连接'
  })
});

const error8 = new Error('Request timeout');
error8.code = 'ETIMEDOUT';

const detections8 = customDetector.detect(error8);
console.log(`自定义检测规则结果:`);
detections8.forEach(d => {
  console.log(`  规则: ${d.ruleName}`);
  console.log(`  严重程度: ${d.severity}`);
  console.log(`  消息: ${d.message}`);
  console.log(`  快速修复: ${d.quickFix}`);
});

// 示例 9: 自定义建议生成器
console.log('\n=== 示例 9: 自定义建议生成器 ===\n');

import { FixSuggestionGenerator } from '../lib/utils/auto-fix.js';

const customGenerator = new FixSuggestionGenerator();

// 注册自定义模板
customGenerator.registerTemplate('CUSTOM_ERROR', (error) => {
  return [
    {
      title: '自定义错误处理',
      description: '这是一个自定义的错误建议',
      priority: 80,
      actions: [
        {
          type: 'command',
          label: '运行诊断',
          command: 'diagnose --full'
        },
        {
          type: 'link',
          label: '查看文档',
          url: 'https://docs.example.com'
        }
      ],
      codeExample: `// 自定义错误处理
console.log('自定义错误:', error.message);

// 运行诊断
npx xiaozhou-chat diagnose --full`
    }
  ];
});

const suggestions9 = customGenerator.fixTemplates.get('CUSTOM_ERROR')(new Error('Custom'));
console.log('自定义建议:');
console.log(`  标题: ${suggestions9[0].title}`);
console.log(`  描述: ${suggestions9[0].description}`);
console.log(`  操作数量: ${suggestions9[0].actions.length}`);

// 示例 10: 处理真实场景
console.log('\n=== 示例 10: 处理真实场景 ===\n');

// 场景 1: 新用户首次使用
console.log('\n场景 1: 新用户首次使用 - 缺少 API Key');
const scenario1 = new ConfigError('API Key is missing', { code: 'API_KEY_MISSING' });
engine.printSuggestions(scenario1);

// 场景 2: 模型不可用
console.log('\n场景 2: 模型不可用');
const scenario2 = new APIError('Model not found', 404);
const scenario2Analysis = analyzeError(scenario2);
console.log('检测到的问题:', scenario2Analysis.detections.map(d => d.message).join(', '));

// 场景 3: 网络问题
console.log('\n场景 3: 网络问题');
const scenario3 = new NetworkError('Connection refused', { code: 'ECONNREFUSED' });
engine.printSuggestions(scenario3);

// 场景 4: 配额限制
console.log('\n场景 4: 配额限制');
const scenario4 = new APIError('Rate limit exceeded', 429);
const scenario4Analysis = analyzeError(scenario4);
console.log('建议的操作:', scenario4Analysis.suggestions[0]?.quickFix);

// 场景 5: 配置文件丢失
console.log('\n场景 5: 配置文件丢失');
const scenario5 = new FileSystemError('Config file not found', { code: 'ENOENT' });
engine.printSuggestions(scenario5);

// 示例 11: 错误恢复建议
console.log('\n=== 示例 11: 错误恢复建议 ===\n');

function suggestRecovery(analysis) {
  const recoveries = [];

  // 根据严重程度建议不同的恢复策略
  if (analysis.detections.some(d => d.severity === 'critical')) {
    recoveries.push({
      priority: 1,
      action: '立即修复',
      description: '关键错误需要立即处理'
    });
  }

  if (analysis.suggestions.some(s => s.actions?.some(a => a.type === 'retry'))) {
    recoveries.push({
      priority: 2,
      action: '重试操作',
      description: '可以自动重试失败的操作'
    });
  }

  if (analysis.suggestions.some(s => s.actions?.some(a => a.type === 'command'))) {
    recoveries.push({
      priority: 3,
      action: '运行修复命令',
      description: '执行建议的命令修复问题'
    });
  }

  return recoveries.sort((a, b) => a.priority - b.priority);
}

const error11 = new APIError('Internal server error', 500);
const analysis11 = engine.analyzeError(error11);
const recoveries11 = suggestRecovery(analysis11);

console.log('恢复建议:');
recoveries11.forEach(r => {
  console.log(`  ${r.priority}. ${r.action}: ${r.description}`);
});

// 示例 12: 错误统计
console.log('\n=== 示例 12: 错误统计 ===\n');

function collectErrors(errors) {
  const stats = {
    total: errors.length,
    byType: {},
    bySeverity: {},
    topErrors: {}
  };

  errors.forEach(error => {
    const analysis = engine.analyzeError(error);

    // 按类型统计
    const type = error.name;
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // 按严重程度统计
    analysis.detections.forEach(d => {
      stats.bySeverity[d.severity] = (stats.bySeverity[d.severity] || 0) + 1;
      if (!stats.topErrors[d.message]) {
        stats.topErrors[d.message] = 0;
      }
      stats.topErrors[d.message]++;
    });
  });

  return stats;
}

const sampleErrors = [
  new ConfigError('API Key missing'),
  new APIError('Unauthorized', 401),
  new APIError('Not found', 404),
  new APIError('Rate limit', 429),
  new NetworkError('Connection failed'),
  new FileSystemError('File not found', { code: 'ENOENT' }),
  new ConfigError('Invalid model'),
  new APIError('Server error', 500)
];

const stats = collectErrors(sampleErrors);
console.log('错误统计:');
console.log(`  总数: ${stats.total}`);
console.log(`  按类型:`);
Object.entries(stats.byType).forEach(([type, count]) => {
  console.log(`    ${type}: ${count}`);
});
console.log(`  按严重程度:`);
Object.entries(stats.bySeverity).forEach(([severity, count]) => {
  console.log(`    ${severity}: ${count}`);
});

// 示例 13: 集成到应用程序
console.log('\n=== 示例 13: 集成到应用程序 ===\n');

class Application {
  constructor() {
    this.autoFix = new AutoFixEngine({
      maxSuggestions: 3,
      autoFixEnabled: true
    });
    this.errorHistory = [];
  }

  async executeWithAutoFix(asyncFn) {
    try {
      return await asyncFn();
    } catch (error) {
      this.errorHistory.push({
        error,
        timestamp: new Date().toISOString(),
        analysis: this.autoFix.analyzeError(error)
      });

      console.log('\n操作失败，错误分析:');
      this.autoFix.printSuggestions(error);

      // 检查是否有自动修复方案
      const analysis = this.autoFix.analyzeError(error);
      if (analysis.hasAutoFix) {
        console.log('\n✨ 检测到自动修复方案，正在尝试...');
        // 这里可以执行自动修复逻辑
      }

      throw error;
    }
  }

  getErrorStats() {
    return collectErrors(this.errorHistory.map(e => e.error));
  }
}

// 使用示例
const app = new Application();

async function riskyOperation() {
  // 模拟一个会失败的操作
  throw new APIError('Unauthorized', 401);
}

// app.executeWithAutoFix(riskyOperation).catch(() => {
//   console.log('\n错误已记录到历史中');
// });

console.log('应用程序集成了自动修复系统，可以:');
console.log('1. 自动捕获错误');
console.log('2. 分析错误并提供建议');
console.log('3. 记录错误历史');
console.log('4. 生成错误统计');

// 示例 14: 错误分类器
console.log('\n=== 示例 14: 错误分类器 ===\n');

function classifyError(error) {
  const analysis = analyzeError(error);

  if (analysis.detections.length === 0) {
    return 'UNKNOWN';
  }

  const primaryDetection = analysis.detections[0];

  if (primaryDetection.severity === 'critical') {
    return 'CRITICAL_CONFIG';
  }

  if (primaryDetection.category === 'network') {
    return 'NETWORK_ISSUE';
  }

  if (primaryDetection.category === 'api') {
    return 'API_ISSUE';
  }

  if (primaryDetection.category === 'config') {
    return 'CONFIG_ISSUE';
  }

  if (primaryDetection.category === 'filesystem') {
    return 'FILESYSTEM_ISSUE';
  }

  return 'OTHER_ISSUE';
}

const testErrors = [
  new ConfigError('API Key missing'),
  new NetworkError('Connection failed'),
  new APIError('Rate limit', 429),
  new FileSystemError('File not found', { code: 'ENOENT' }),
  new Error('Unknown error')
];

console.log('错误分类结果:');
testErrors.forEach(error => {
  const classification = classifyError(error);
  console.log(`  ${error.message}: ${classification}`);
});

console.log('\n=== 所有示例完成 ===\n');
console.log('自动修复系统可以:');
console.log('✅ 检测各种常见错误');
console.log('✅ 生成详细的修复建议');
console.log('✅ 提供代码示例和命令');
console.log('✅ 支持自定义规则和模板');
console.log('✅ 集成到现有应用程序');
console.log('✅ 生成错误统计和分析报告');
