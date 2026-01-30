/**
 * 配置验证模块使用示例
 */

import {
  validateConfig,
  formatValidationResult,
  autoFixConfig,
  getConfigSuggestions
} from '../lib/utils/config-validator.js';

// ============================================================================
// 示例 1: 基本验证
// ============================================================================

function example1() {
  console.log('示例 1: 基本配置验证\n');

  const validConfig = {
    apiKey: 'sk-test123',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
    currentProfile: 'default',
    profiles: {
      default: {
        apiKey: 'sk-test123',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4'
      }
    }
  };

  const result = validateConfig(validConfig);
  console.log(formatValidationResult(result));
  console.log('\n');
}

// ============================================================================
// 示例 2: 错误配置检测
// ============================================================================

function example2() {
  console.log('示例 2: 检测配置错误\n');

  const invalidConfig = {
    apiKey: 'invalid-key',  // 不符合 sk- 前缀
    baseUrl: 'not-a-url',    // 不是有效的URL
    temperature: 3.5,        // 超过最大值 2
    provider: 'invalid',      // 不在枚举值中
    currentProfile: 'non-existent',  // profile不存在
    profiles: {
      default: {
        model: ''  // 空字符串
      }
    }
  };

  const result = validateConfig(invalidConfig);
  console.log(formatValidationResult(result));
  console.log('\n');
}

// ============================================================================
// 示例 3: 自动修复配置
// ============================================================================

function example3() {
  console.log('示例 3: 自动修复配置\n');

  const brokenConfig = {
    apiKey: 'sk-test123',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    // 缺少 currentProfile
    profiles: {
      default: {},
      // 顶层配置没有迁移到 profile
    },
    // 包含空值
    systemPrompt: null
  };

  console.log('原始配置:');
  console.log(JSON.stringify(brokenConfig, null, 2));
  console.log('\n');

  const { fixed, fixes, validation } = autoFixConfig(brokenConfig);

  console.log('自动修复建议:');
  fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log('\n');

  console.log('修复后的配置:');
  console.log(JSON.stringify(fixed, null, 2));
  console.log('\n');

  console.log('修复后验证:');
  console.log(formatValidationResult(validation));
  console.log('\n');
}

// ============================================================================
// 示例 4: 获取配置建议
// ============================================================================

function example4() {
  console.log('示例 4: 获取配置建议\n');

  const minimalConfig = {
    baseUrl: 'https://api.openai.com/v1'
    // 缺少 apiKey, model, profiles 等
  };

  const suggestions = getConfigSuggestions(minimalConfig);

  console.log('当前配置:');
  console.log(JSON.stringify(minimalConfig, null, 2));
  console.log('\n');

  console.log('改进建议:');
  suggestions.forEach((suggestion, index) => {
    console.log(`  ${index + 1}. ${suggestion}`);
  });
  console.log('\n');
}

// ============================================================================
// 示例 5: 完整的配置验证流程
// ============================================================================

async function example5() {
  console.log('示例 5: 完整的配置验证流程\n');

  const userConfig = {
    // 用户输入的配置
    provider: 'openai',
    apiKey: 'sk-abc123',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  };

  // 步骤 1: 验证配置
  console.log('步骤 1: 验证配置');
  const validation = validateConfig(userConfig);
  console.log(formatValidationResult(validation));
  console.log();

  // 步骤 2: 如果有错误，尝试自动修复
  if (!validation.valid) {
    console.log('步骤 2: 尝试自动修复');
    const { fixed, fixes } = autoFixConfig(userConfig);
    console.log(`修复了 ${fixes.length} 个问题`);
    console.log();

    // 重新验证
    const newValidation = validateConfig(fixed);
    console.log('修复后验证:');
    console.log(formatValidationResult(newValidation));
    console.log();
  }

  // 步骤 3: 获取改进建议
  console.log('步骤 3: 获取改进建议');
  const suggestions = getConfigSuggestions(userConfig);
  if (suggestions.length > 0) {
    suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  } else {
    console.log('  配置已经很完善，没有建议');
  }
  console.log();
}

// ============================================================================
// 示例 6: 验证多Profile配置
// ============================================================================

function example6() {
  console.log('示例 6: 验证多Profile配置\n');

  const multiProfileConfig = {
    currentProfile: 'work',
    profiles: {
      default: {
        apiKey: 'sk-default',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo'
      },
      work: {
        apiKey: 'sk-work',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.5
      },
      personal: {
        apiKey: 'sk-personal',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-opus',
        systemPrompt: '你是一个友好的助手'
      }
    }
  };

  const result = validateConfig(multiProfileConfig);
  console.log(formatValidationResult(result));
  console.log('\n');
}

// ============================================================================
// 示例 7: 处理真实场景
// ============================================================================

function example7() {
  console.log('示例 7: 处理真实场景 - 新用户配置\n');

  const newUserConfig = {
    // 新用户可能只提供了基本的API Key
    apiKey: 'sk-newuser123'
  };

  console.log('新用户的配置:');
  console.log(JSON.stringify(newUserConfig, null, 2));
  console.log('\n');

  // 验证
  const validation = validateConfig(newUserConfig);
  console.log('验证结果:');
  console.log(formatValidationResult(validation));
  console.log('\n');

  // 获取建议
  console.log('建议:');
  const suggestions = getConfigSuggestions(newUserConfig);
  suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log('\n');

  // 自动修复
  console.log('自动修复:');
  const { fixed, fixes } = autoFixConfig(newUserConfig);
  console.log(`应用了 ${fixes.length} 个修复:`);
  fixes.forEach(f => console.log(`  - ${f}`));
  console.log('\n修复后的配置:');
  console.log(JSON.stringify(fixed, null, 2));
  console.log('\n');
}

// ============================================================================
// 运行所有示例
// ============================================================================

function runAllExamples() {
  console.log('========================================');
  console.log('配置验证模块使用示例');
  console.log('========================================\n');

  example1();
  example2();
  example3();
  example4();
  example5();
  example6();
  example7();

  console.log('========================================');
  console.log('所有示例运行完成');
  console.log('========================================');
}

// 导出示例函数
export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  runAllExamples
};

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
