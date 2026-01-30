/**
 * 交互式配置向导
 * /config init 命令实现
 */

import readline from 'node:readline';
import { initConfigFile, updateConfig, setProfileValue, getProviderDefaults } from '../config.js';
import { validateConfig, autoFixConfig, formatValidationResult, getConfigSuggestions } from '../utils/config-validator.js';
import { logger } from '../utils/logger.js';

// API 提供商预设
const PROVIDER_PRESETS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'claude', name: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-sonnet' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'moonshot', name: 'Moonshot (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { id: 'newapi', name: 'NewAPI (Tribios)', baseUrl: 'https://paid.tribiosapi.top/v1', model: 'claude-sonnet-4-5-20250929' },
  { id: 'custom', name: '自定义', baseUrl: '', model: '' }
];

// 模型推荐
const MODEL_RECOMMENDATIONS = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (最新)', description: '最强大的模型，支持多模态' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '快速且经济' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '平衡性能和速度' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '经济实惠' }
  ],
  claude: [
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: '最强大的模型' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: '平衡性能' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: '快速且经济' }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '通用聊天模型' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', description: '代码生成优化' }
  ],
  moonshot: [
    { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', description: '8K 上下文' },
    { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', description: '32K 上下文' },
    { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', description: '128K 上下文' }
  ],
  newapi: [
    { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: '最新 Claude 模型' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'GPT-4o 模型' }
  ]
};

/**
 * 创建 readline 接口
 */
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 提问并获取用户输入
 */
function question(rl, prompt, defaultValue = '') {
  return new Promise((resolve) => {
    const fullPrompt = defaultValue ? `${prompt} [${defaultValue}]: ` : `${prompt}: `;
    rl.question(fullPrompt, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * 显示欢迎信息
 */
function showWelcome() {
  console.log(`
╔════════════════════════════════════════╗
║   xzChat 交互式配置向导                 ║
║   让配置变得简单而直观                  ║
╚════════════════════════════════════════╝
`);
}

/**
 * 选择 API 提供商
 */
async function selectProvider(rl) {
  console.log('\n请选择 API 提供商:\n');

  PROVIDER_PRESETS.forEach((preset, index) => {
    console.log(`  [${index + 1}] ${preset.name}`);
    if (preset.baseUrl) {
      console.log(`      ${preset.baseUrl}`);
    }
  });

  console.log();
  const answer = await question(rl, '选择 (1-6)', '1');
  const index = parseInt(answer) - 1;

  if (index >= 0 && index < PROVIDER_PRESETS.length) {
    return PROVIDER_PRESETS[index];
  }

  console.log('无效选择，使用默认 (OpenAI)');
  return PROVIDER_PRESETS[0];
}

/**
 * 输入 API Key
 */
async function inputApiKey(rl, provider) {
  console.log(`\n配置 ${provider.name}`);
  console.log(`API Endpoint: ${provider.baseUrl || '（自定义）'}`);

  const apiKey = await question(rl, '请输入 API Key');

  if (!apiKey && !provider.custom) {
    console.log('\n⚠️  警告: 未提供 API Key，某些功能可能无法使用');
    const proceed = await question(rl, '是否继续? (y/n)', 'n');
    if (proceed.toLowerCase() !== 'y') {
      return null;
    }
  }

  return apiKey;
}

/**
 * 选择模型
 */
async function selectModel(rl, providerId) {
  const models = MODEL_RECOMMENDATIONS[providerId] || MODEL_RECOMMENDATIONS.openai;

  console.log('\n请选择默认模型:\n');

  models.forEach((model, index) => {
    console.log(`  [${index + 1}] ${model.name}`);
    console.log(`      ${model.description}`);
  });

  console.log(`  [${models.length + 1}] 自定义模型`);

  console.log();
  const answer = await question(rl, '选择', '1');
  const index = parseInt(answer) - 1;

  if (index >= 0 && index < models.length) {
    return models[index].id;
  }

  if (index === models.length) {
    return await question(rl, '请输入模型名称');
  }

  return models[0].id;
}

/**
 * 自定义 Base URL
 */
async function customBaseUrl(rl) {
  console.log('\n自定义 Base URL');
  console.log('示例:');
  console.log('  - https://api.openai.com/v1');
  console.log('  - https://api.anthropic.com/v1');
  console.log('  - https://your-custom-endpoint.com/v1');

  return await question(rl, '请输入 Base URL');
}

/**
 * 配置 Profile
 */
async function configureProfile(rl, provider) {
  const profile = {
    apiKey: '',
    baseUrl: provider.baseUrl || '',
    model: provider.model || ''
  };

  // 自定义提供商
  if (provider.id === 'custom') {
    profile.baseUrl = await customBaseUrl(rl);
  }

  // API Key
  profile.apiKey = await inputApiKey(rl, provider);

  // 如果输入了 API Key，继续配置模型
  if (profile.apiKey) {
    profile.model = await selectModel(rl, provider.id === 'custom' ? 'openai' : provider.id);
  }

  return profile;
}

/**
 * 添加额外的 Profile
 */
async function addAdditionalProfiles(rl) {
  const profiles = {};
  let addMore = true;

  while (addMore) {
    console.log('\n添加额外的 Profile (可选)');
    console.log('Profile 可以用于管理不同的配置（如工作、个人等）');

    const name = await question(rl, 'Profile 名称 (留空跳过)');
    if (!name.trim()) {
      break;
    }

    if (profiles[name]) {
      console.log('Profile 名称已存在，请使用其他名称');
      continue;
    }

    const provider = await selectProvider(rl);
    profiles[name] = await configureProfile(rl, provider);

    const more = await question(rl, '继续添加 Profile? (y/n)', 'n');
    addMore = more.toLowerCase() === 'y';
  }

  return profiles;
}

/**
 * 配置 Roles
 */
async function configureRoles(rl) {
  console.log('\n配置自定义 Roles (可选)');
  console.log('Role 是预定义的系统提示词，可以快速切换不同的 AI 角色');

  const roles = {};
  let addMore = true;

  while (addMore) {
    const name = await question(rl, 'Role 名称 (留空跳过)', '');
    if (!name.trim()) {
      break;
    }

    if (roles[name]) {
      console.log('Role 已存在，请使用其他名称');
      continue;
    }

    const prompt = await question(rl, `${name} 的系统提示词`);
    if (prompt.trim()) {
      roles[name] = prompt;
    }

    const more = await question(rl, '继续添加 Role? (y/n)', 'n');
    addMore = more.toLowerCase() === 'y';
  }

  return roles;
}

/**
 * 高级配置
 */
async function advancedConfig(rl) {
  console.log('\n高级配置 (可选)');

  const advanced = {};

  const temperature = await question(rl, 'Temperature (0-2, 默认 0.7)', '0.7');
  const temp = parseFloat(temperature);
  if (!isNaN(temp) && temp >= 0 && temp <= 2) {
    advanced.temperature = temp;
  }

  const maxTokens = await question(rl, 'Max Tokens (默认 2000)', '2000');
  const tokens = parseInt(maxTokens);
  if (!isNaN(tokens) && tokens > 0) {
    advanced.maxTokens = tokens;
  }

  const systemPrompt = await question(rl, '系统提示词 (留空跳过)', '');
  if (systemPrompt.trim()) {
    advanced.systemPrompt = systemPrompt;
  }

  const showThinking = await question(rl, '显示思考过程? (y/n)', 'n');
  if (showThinking.toLowerCase() === 'y') {
    advanced.showThinking = true;
  }

  return advanced;
}

/**
 * 验证配置
 */
async function validateAndShow(config) {
  console.log('\n验证配置...\n');

  const validation = validateConfig(config);
  console.log(formatValidationResult(validation));

  if (!validation.valid) {
    console.log('\n尝试自动修复...');
    const { fixed, fixes } = autoFixConfig(config);
    console.log(`应用了 ${fixes.length} 个修复:`);
    fixes.forEach(fix => console.log(`  - ${fix}`));

    const newValidation = validateConfig(fixed);
    if (newValidation.valid) {
      console.log('\n✅ 修复成功！');
      return fixed;
    }
  }

  return config;
}

/**
 * 显示配置摘要
 */
function showSummary(config) {
  console.log('\n' + '═'.repeat(50));
  console.log('配置摘要');
  console.log('═'.repeat(50) + '\n');

  console.log('API 提供商:', config.provider || '默认');
  console.log('Base URL:', config.baseUrl);
  console.log('Model:', config.model);

  if (config.apiKey) {
    const masked = config.apiKey.slice(0, 7) + '...' + config.apiKey.slice(-4);
    console.log('API Key:', masked);
  }

  if (config.profiles) {
    const profileNames = Object.keys(config.profiles);
    if (profileNames.length > 0) {
      console.log('Profiles:', profileNames.join(', '));
    }
  }

  if (config.roles) {
    const roleNames = Object.keys(config.roles);
    if (roleNames.length > 0) {
      console.log('Roles:', roleNames.join(', '));
    }
  }

  console.log();
}

/**
 * 主函数 - 启动配置向导
 */
export async function runConfigWizard(options = {}) {
  const rl = createRL();

  try {
    showWelcome();

    // 步骤 1: 选择提供商
    const provider = await selectProvider(rl);

    // 步骤 2: 配置 profile
    const profile = await configureProfile(rl, provider);

    // 步骤 3: 添加额外的 profiles
    const additionalProfiles = await addAdditionalProfiles(rl);

    // 步骤 4: 配置 roles
    const roles = await configureRoles(rl);

    // 步骤 5: 高级配置
    const advanced = await advancedConfig(rl);

    // 合并配置
    const config = {
      provider: provider.id,
      ...profile,
      profiles: {
        default: profile,
        ...additionalProfiles
      },
      currentProfile: 'default',
      ...advanced
    };

    if (Object.keys(roles).length > 0) {
      config.roles = roles;
    }

    // 步骤 6: 验证配置
    const validatedConfig = await validateAndShow(config);

    // 步骤 7: 显示摘要
    showSummary(validatedConfig);

    // 步骤 8: 确认并保存
    console.log('\n' + '═'.repeat(50));
    const confirm = await question(rl, '保存此配置? (y/n)', 'y');

    if (confirm.toLowerCase() === 'y') {
      // 确保配置文件存在
      initConfigFile();

      // 保存配置
      Object.entries(validatedConfig).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          updateConfig(key, value);
        }
      });

      console.log('\n✅ 配置已保存！');
      console.log('\n你现在可以开始使用 xzChat 了。');

      const suggestions = getConfigSuggestions(validatedConfig);
      if (suggestions.length > 0) {
        console.log('\n💡 改进建议:');
        suggestions.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s}`);
        });
      }

    } else {
      console.log('\n配置未保存。如需重新配置，请运行 /config init');
    }

  } catch (error) {
    logger.error('配置向导出错', { error: error.message });
    console.error('\n❌ 配置过程中出错:', error.message);
  } finally {
    rl.close();
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runConfigWizard();
}

export default { runConfigWizard };
