/**
 * 插件模板
 * 复制此文件并修改为你的插件
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    // 定义插件命令
    this.commands = {
      '/mycommand': {
        handler: this.handleCommand.bind(this),
        description: '命令描述',
        usage: '/mycommand <args>',
        category: 'general'
      }
    };

    // 定义插件钩子
    this.hooks = {
      // 在这里添加钩子
    };

    // 初始化插件状态
    this.state = {};
  }

  /**
   * 插件启用时调用
   */
  async onEnable(context) {
    this.context.logger.info('插件已启用');

    // 初始化插件
    await this.initialize();
  }

  /**
   * 插件禁用时调用
   */
  async onDisable(context) {
    this.context.logger.info('插件已禁用');

    // 清理资源
    await this.cleanup();
  }

  /**
   * 初始化插件
   */
  async initialize() {
    // 在这里执行初始化逻辑
    console.log('插件初始化...');
  }

  /**
   * 清理资源
   */
  async cleanup() {
    // 在这里清理资源（定时器、监听器等）
    console.log('清理资源...');
  }

  /**
   * 处理命令
   */
  async handleCommand(args) {
    try {
      // 在这里实现命令逻辑
      const result = await this.doSomething(args);

      return {
        success: true,
        message: `结果: ${result}`
      };
    } catch (error) {
      return {
        error: `执行失败: ${error.message}`
      };
    }
  }

  /**
   * 你的自定义方法
   */
  async doSomething(input) {
    // 实现你的逻辑
    return `处理: ${input}`;
  }

  /**
   * 发送通知（可选）
   */
  async notify(message) {
    // 通过 WebSocket 发送通知
    if (this.context.io) {
      this.context.io.emit('plugin:message', {
        type: 'info',
        content: message,
        plugin: this.metadata.name
      });
    }
  }
}
