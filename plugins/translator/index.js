/**
 * 翻译插件
 * 支持多种语言互译
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class TranslatorPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.commands = {
      '/translate': {
        handler: this.handleTranslate.bind(this),
        description: '翻译文本',
        usage: '/translate <from>:<to> <text>',
        category: 'utility'
      },
      '/languages': {
        handler: this.handleLanguages.bind(this),
        description: '列出支持的语言',
        usage: '/languages',
        category: 'utility'
      }
    };
  }

  async onEnable(context) {
    this.context.logger.info('翻译插件已启用');
  }

  async onDisable(context) {
    this.context.logger.info('翻译插件已禁用');
  }

  /**
   * 处理翻译命令
   */
  async handleTranslate(args) {
    const match = args.match(/^(\w+):(\w+)\s+(.+)$/);
    if (!match) {
      return {
        error: '格式错误，使用: /translate <from>:<to> <text>\n例如: /translate en:zh Hello World'
      };
    }

    const [, from, to, text] = match;

    try {
      const result = await this.translate(text, from, to);
      return {
        success: true,
        message: `🌐 翻译结果:\n\n${result}`
      };
    } catch (error) {
      return {
        error: `翻译失败: ${error.message}`
      };
    }
  }

  /**
   * 处理语言列表命令
   */
  async handleLanguages() {
    const languages = this.getSupportedLanguages();
    const message = `📚 支持的语言:\n\n` +
      Object.entries(languages)
        .map(([code, name]) => `  ${code.padEnd(5)} - ${name}`)
        .join('\n');

    return {
      success: true,
      message
    };
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return {
      'zh': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'ru': '俄语',
      'pt': '葡萄牙语',
      'it': '意大利语',
      'ar': '阿拉伯语',
      'hi': '印地语'
    };
  }

  /**
   * 执行翻译（使用免费 API）
   */
  async translate(text, from, to) {
    // 使用 MyMemory Translation API（免费）
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }

    // 如果 API 失败，返回模拟结果
    return `[模拟翻译] ${text}\n(从 ${from} 翻译到 ${to})`;
  }
}
