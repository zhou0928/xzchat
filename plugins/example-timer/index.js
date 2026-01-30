/**
 * 示例插件: 计时器
 * 演示如何创建一个简单的 xzChat 插件
 */

import { BasePlugin, PluginHooks } from '../../lib/plugins/plugin-system.js';

export default class TimerPlugin extends BasePlugin {
  timers = new Map();

  constructor(metadata, context) {
    super(metadata, context);
    this.commands = {
      '/timer': {
        handler: this.handleTimerCommand.bind(this),
        description: '创建一个计时器',
        usage: '/timer <seconds> [message]',
        category: 'utility',
      },
      '/timers': {
        handler: this.handleListTimers.bind(this),
        description: '列出所有活动计时器',
        usage: '/timers',
        category: 'utility',
      },
    };
  }

  async onEnable(context) {
    this.context.logger.info('Timer plugin enabled');
  }

  async onDisable(context) {
    // 清理所有计时器
    for (const [id, timer] of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    // 注意: context 可能为 undefined，因为这是在 unload 时调用的
    if (this.context && this.context.logger) {
      this.context.logger.info('Timer plugin disabled');
    }
  }

  async handleTimerCommand(args) {
    const [secondsStr, ...messageParts] = args.split(/\s+/);
    const seconds = parseInt(secondsStr);
    const message = messageParts.join(' ') || '计时器完成!';

    if (isNaN(seconds) || seconds <= 0) {
      return { error: '请输入有效的秒数' };
    }

    const timerId = Date.now();
    
    const timer = setTimeout(async () => {
      this.timers.delete(timerId);
      // 注意: 在测试环境中 context.emit 可能不存在
      const msg = `⏰ ${message}`;
      try {
        if (typeof this.context.emit === 'function') {
          await this.context.emit('message:send', {
            type: 'system',
            content: msg,
          });
        } else if (this.context && this.context.logger) {
          this.context.logger.info(msg);
        }
      } catch (err) {
        // 忽略所有错误，避免影响其他功能
      }
    }, seconds * 1000);

    this.timers.set(timerId, timer);

    return {
      success: true,
      message: `计时器已设置: ${seconds}秒后提示 "${message}"`,
    };
  }

  async handleListTimers(args) {
    if (this.timers.size === 0) {
      return { message: '当前没有活动计时器' };
    }

    const timers = Array.from(this.timers.entries()).map(([id, _]) => ({
      id,
      createdAt: new Date(id).toISOString(),
    }));

    return {
      success: true,
      message: `活动计时器 (${this.timers.size}个):`,
      timers,
    };
  }
}
