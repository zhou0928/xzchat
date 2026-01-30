/**
 * 交互式配置向导
 * 帮助新用户快速配置 xzChat
 */

import { getProviderDefaults } from '../config.js';
import { logger } from './logger.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.newapi-chat');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * 提供商选项
 */
const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'claude', name: 'Claude', models: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'] },
  { id: 'ollama', name: 'Ollama', models: ['llama3', 'mistral', 'codellama'] },
  { id: 'custom', name: '自定义', models: [] }
];

/**
 * 提供商默认配置
 */
const PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    requiresApiKey: true
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    requiresApiKey: true
  },
  claude: {
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3.5-sonnet',
    requiresApiKey: true
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    defaultModel: 'llama3',
    requiresApiKey: false
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
    requiresApiKey: true
  }
};

/**
 * 创建交互式配置向导
 */
export class ConfigWizard {
  constructor(askQuestion) {
    this.askQuestion = askQuestion;
    this.config = {};
  }

  /**
   * 运行向导
   */
  async run() {
    console.log(`
╔════════════════════════════════════════╗
║      🧙 欢迎使用 xzChat 配置向导！      ║
║                                            ║
║  让我们快速配置你的 AI 助手体验      ║
╚════════════════════════════════════════╝
`);

    try {
      await this.selectProvider();
      await this.enterApiKey();
      await this.enterBaseUrl();
      await this.selectModel();
      await this.configureAdvancedOptions();
      await this.saveConfig();
      await this.showSummary();
    } catch (error) {
      console.error(`\n❌ 配置过程中出错: ${error.message}`);
      console.log('💡 你可以稍后使用 /config 命令手动修改配置');
      throw error;
    }
  }

  /**
   * 选择提供商
   */
  async selectProvider() {
    console.log('\n📡 步骤 1/5: 选择 API 提供商\n');

    for (let i = 0; i < PROVIDERS.length; i++) {
      const provider = PROVIDERS[i];
      console.log(`  [${i + 1}] ${provider.name}`);
    }

    const answer = await this.askQuestion('\n请选择提供商 (1-5): ');

    const choice = parseInt(answer.trim(), 10);
    if (choice < 1 || choice > 5) {
      console.log('⚠️  无效选择，使用默认: OpenAI');
      this.config.provider = 'openai';
    } else {
      this.config.provider = PROVIDERS[choice - 1].id;
    }

    const provider = PROVIDERS.find(p => p.id === this.config.provider);
    console.log(`✅ 已选择: ${provider.name}\n`);
  }

  /**
   * 输入 API Key
   */
  async enterApiKey() {
    const providerConfig = PROVIDER_CONFIGS[this.config.provider];

    if (!providerConfig.requiresApiKey) {
      console.log('📡 步骤 2/5: 跳过 API Key (本地模式无需密钥)\n');
      this.config.apiKey = '';
      return;
    }

    console.log('📡 步骤 2/5: 输入 API Key\n');
    console.log('💡 提示: 你的 API Key 将保存在本地配置文件中');

    const apiKey = await this.askQuestion('API Key: ');

    if (!apiKey || apiKey.trim() === '') {
      console.log('⚠️  未输入 API Key，你可以稍后使用 /config 设置');
      this.config.apiKey = '';
    } else {
      this.config.apiKey = apiKey.trim();
      // 显示掩码版本
      const masked = this.config.apiKey.slice(0, 8) + '...' +
        this.config.apiKey.slice(-4);
      console.log(`✅ API Key: ${masked}\n`);
    }
  }

  /**
   * 输入 Base URL
   */
  async enterBaseUrl() {
    const defaults = getProviderDefaults(this.config.provider);

    if (defaults.baseUrl) {
      console.log('📡 步骤 3/5: Base URL 配置');
      console.log(`默认 Base URL: ${defaults.baseUrl}`);

      const useDefault = await this.askQuestion('使用默认 URL? (Y/n): ');

      if (useDefault.toLowerCase().startsWith('y') || useDefault === '') {
        this.config.baseUrl = defaults.baseUrl;
        console.log(`✅ 使用默认: ${defaults.baseUrl}\n`);
        return;
      }
    }

    console.log('📡 步骤 3/5: 自定义 Base URL');
    const baseUrl = await this.askQuestion('Base URL: ');

    if (!baseUrl || baseUrl.trim() === '') {
      console.log('⚠️  Base URL 为空，将使用默认值');
      this.config.baseUrl = defaults.baseUrl || '';
    } else {
      this.config.baseUrl = baseUrl.trim();
      console.log(`✅ Base URL: ${this.config.baseUrl}\n`);
    }
  }

  /**
   * 选择模型
   */
  async selectModel() {
    console.log('📡 步骤 4/5: 选择模型\n');

    const provider = PROVIDERS.find(p => p.id === this.config.provider);
    const defaults = getProviderDefaults(this.config.provider);

    if (provider.models.length > 0) {
      console.log('可用模型:');
      provider.models.forEach((model, index) => {
        const isDefault = model === defaults.model ? ' (默认)' : '';
        console.log(`  [${index + 1}] ${model}${isDefault}`);
      });

      const answer = await this.askQuestion('\n请选择模型 (直接回车使用默认): ');
      const choice = parseInt(answer.trim(), 10);

      if (isNaN(choice) || choice < 1 || choice > provider.models.length) {
        console.log(`✅ 使用默认模型: ${defaults.model}`);
        this.config.model = defaults.model;
      } else {
        this.config.model = provider.models[choice - 1];
        console.log(`✅ 已选择: ${this.config.model}`);
      }
    } else {
      const defaultModel = defaults.model || 'gpt-3.5-turbo';
      const answer = await this.askQuestion(`模型名称 (默认: ${defaultModel}): `);

      if (!answer || answer.trim() === '') {
        this.config.model = defaultModel;
      } else {
        this.config.model = answer.trim();
      }
      console.log(`✅ 模型: ${this.config.model}`);
    }

    console.log('');
  }

  /**
   * 配置高级选项
   */
  async configureAdvancedOptions() {
    console.log('📡 步骤 5/5: 高级选项 (可选)\n');

    // 温度
    const temperature = await this.askQuestion('Temperature (0-2, 默认 0.7): ');
    if (temperature && !isNaN(parseFloat(temperature))) {
      const temp = Math.min(2, Math.max(0, parseFloat(temperature)));
      this.config.temperature = temp;
      console.log(`✅ Temperature: ${temp}`);
    } else {
      this.config.temperature = 0.7;
      console.log('✅ Temperature: 0.7 (默认)');
    }

    // 最大 token
    const maxTokens = await this.askQuestion('Max Tokens (默认 2000): ');
    if (maxTokens && !isNaN(parseInt(maxTokens))) {
      this.config.maxTokens = parseInt(maxTokens);
      console.log(`✅ Max Tokens: ${this.config.maxTokens}`);
    } else {
      this.config.maxTokens = 2000;
      console.log('✅ Max Tokens: 2000 (默认)');
    }

    // 流式输出
    const stream = await this.askQuestion('启用流式输出? (Y/n): ');
    this.config.stream = !stream.toLowerCase().startsWith('n');
    console.log(`✅ 流式输出: ${this.config.stream ? '启用' : '禁用'}\n`);
  }

  /**
   * 保存配置
   */
  async saveConfig() {
    console.log('💾 保存配置...\n');

    // 确保配置目录存在
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // 读取现有配置
    let existingConfig = {};
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
        existingConfig = JSON.parse(content);
      } catch (error) {
        logger.warn('读取现有配置失败', { error: error.message });
      }
    }

    // 合并配置
    const newConfig = {
      ...existingConfig,
      ...this.config
    };

    // 添加默认配置环境
    if (!newConfig.profiles) {
      newConfig.profiles = {
        default: {
          provider: this.config.provider,
          baseUrl: this.config.baseUrl,
          apiKey: this.config.apiKey,
          model: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          stream: this.config.stream
        }
      };
      newConfig.currentProfile = 'default';
    }

    // 保存配置
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
    logger.info('配置已保存', { path: CONFIG_FILE });
  }

  /**
   * 显示配置摘要
   */
  async showSummary() {
    console.log(`
╔═══════════════════════════════════════════╗
║              ✅ 配置完成！                    ║
╚═══════════════════════════════════════════╝

📋 配置摘要:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
提供商:     ${this.config.provider}
Base URL:   ${this.config.baseUrl}
模型:       ${this.config.model}
Temperature: ${this.config.temperature}
Max Tokens: ${this.config.maxTokens}
流式输出:   ${this.config.stream ? '启用' : '禁用'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 你现在可以开始使用 xzChat 了！

💡 下一步:
   • 输入你的问题开始对话
   • 使用 /help 查看所有命令
   • 使用 /config 修改任何设置
   • 使用 /session 管理多个会话

📚 文档:
   • 查看项目 README.md 了解更多功能
   • 访问 https://github.com/xz-chat/xz-chat 获取帮助
`);
  }
}

/**
 * 创建配置向导实例并运行
 */
export async function runConfigWizard(askQuestion) {
  const wizard = new ConfigWizard(askQuestion);
  await wizard.run();
}
