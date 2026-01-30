import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * 定时提醒管理器
 */
class RemindManager {
  constructor() {
    this.remindersPath = path.join(os.homedir(), '.xzchat-reminders.json');
    this.reminders = [];
    this.timers = new Map();
    this.checkInterval = null;
  }

  /**
   * 加载提醒列表
   */
  async load() {
    try {
      const data = await fs.readFile(this.remindersPath, 'utf-8');
      this.reminders = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.reminders = [];
        await this.save();
      }
    }
  }

  /**
   * 保存提醒列表
   */
  async save() {
    await fs.writeFile(
      this.remindersPath,
      JSON.stringify(this.reminders, null, 2),
      'utf-8'
    );
  }

  /**
   * 添加提醒
   */
  async add(message, time, options = {}) {
    await this.load();

    const reminder = {
      id: Date.now().toString(),
      message,
      time,
      type: options.type || 'once', // once, interval
      interval: options.interval || null,
      command: options.command || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      triggeredAt: null
    };

    this.reminders.push(reminder);
    await this.save();
    await this.scheduleReminder(reminder);

    return reminder;
  }

  /**
   * 删除提醒
   */
  async remove(id) {
    await this.load();
    const index = this.reminders.findIndex(r => r.id === id);

    if (index !== -1) {
      const reminder = this.reminders[index];

      // 清除定时器
      if (this.timers.has(id)) {
        clearTimeout(this.timers.get(id));
        this.timers.delete(id);
      }

      this.reminders.splice(index, 1);
      await this.save();
      return reminder;
    }

    return null;
  }

  /**
   * 安排提醒
   */
  async scheduleReminder(reminder) {
    const now = new Date();
    const targetTime = new Date(reminder.time);

    if (targetTime <= now) {
      // 时间已过，立即触发
      await this.triggerReminder(reminder);
      return;
    }

    const delay = targetTime.getTime() - now.getTime();

    // 设置定时器
    const timer = setTimeout(async () => {
      await this.triggerReminder(reminder);

      // 如果是间隔提醒，继续安排下一次
      if (reminder.type === 'interval' && reminder.interval) {
        const nextTime = new Date();
        nextTime.setMilliseconds(nextTime.getMilliseconds() + reminder.interval);
        reminder.time = nextTime.toISOString();
        await this.save();
        await this.scheduleReminder(reminder);
      }
    }, delay);

    this.timers.set(reminder.id, timer);
  }

  /**
   * 触发提醒
   */
  async triggerReminder(reminder) {
    reminder.status = 'triggered';
    reminder.triggeredAt = new Date().toISOString();
    await this.save();

    // 显示提醒
    console.log(`\n⏰ ${new Date().toLocaleString('zh-CN')}`);
    console.log(`📌 提醒: ${reminder.message}\n`);

    // 执行关联命令
    if (reminder.command) {
      console.log(`🔧 执行命令: ${reminder.command}`);
      // 这里可以集成命令执行逻辑
    }
  }

  /**
   * 列出所有提醒
   */
  async list() {
    await this.load();
    return [...this.reminders];
  }

  /**
   * 获取待触发的提醒
   */
  async getPending() {
    await this.load();
    return this.reminders.filter(r => r.status === 'pending');
  }

  /**
   * 清除已触发的提醒
   */
  async clearTriggered() {
    await this.load();
    const count = this.reminders.filter(r => r.status === 'triggered').length;
    this.reminders = this.reminders.filter(r => r.status !== 'triggered');
    await this.save();
    return count;
  }

  /**
   * 清空所有提醒
   */
  async clear() {
    // 清除所有定时器
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    this.reminders = [];
    await this.save();
  }

  /**
   * 解析时间表达式
   */
  parseTimeExpression(expr) {
    const now = new Date();

    // 相对时间
    const relativeMatch = expr.match(/^(\d+)(m|h|d|w)$/);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2];
      const targetTime = new Date();

      switch (unit) {
        case 'm':
          targetTime.setMinutes(now.getMinutes() + value);
          break;
        case 'h':
          targetTime.setHours(now.getHours() + value);
          break;
        case 'd':
          targetTime.setDate(now.getDate() + value);
          break;
        case 'w':
          targetTime.setDate(now.getDate() + (value * 7));
          break;
      }

      return targetTime.toISOString();
    }

    // 具体时间 HH:MM
    const timeMatch = expr.match(/^(\d{2}):(\d{2})$/);
    if (timeMatch) {
      const [hours, minutes] = timeMatch.slice(1);
      const targetTime = new Date();
      targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // 如果时间已过，设置为明天
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      return targetTime.toISOString();
    }

    // ISO 格式
    if (!isNaN(Date.parse(expr))) {
      return expr;
    }

    return null;
  }

  /**
   * 格式化提醒列表
   */
  formatList(reminders) {
    if (reminders.length === 0) {
      return '暂无提醒';
    }

    let output = '';
    reminders.forEach(reminder => {
      const statusIcon = reminder.status === 'triggered' ? '✅' : '⏰';
      const time = new Date(reminder.time).toLocaleString('zh-CN');
      const triggeredAt = reminder.triggeredAt
        ? `\n   触发于: ${new Date(reminder.triggeredAt).toLocaleString('zh-CN')}`
        : '';
      const command = reminder.command ? `\n   命令: ${reminder.command}` : '';
      const interval = reminder.interval ? ` (间隔: ${this.formatInterval(reminder.interval)})` : '';

      output += `${statusIcon} ${reminder.message}\n`;
      output += `   ID: ${reminder.id} | 时间: ${time}${interval}${triggeredAt}${command}\n`;
    });

    return output.trim();
  }

  /**
   * 格式化间隔时间
   */
  formatInterval(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天`;
    if (hours > 0) return `${hours}小时`;
    return `${minutes}分钟`;
  }

  /**
   * 启动检查循环
   */
  startCheck(interval = 60000) {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(async () => {
      await this.checkReminders();
    }, interval);
  }

  /**
   * 停止检查循环
   */
  stopCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 检查提醒
   */
  async checkReminders() {
    const now = new Date();
    const pending = await this.getPending();

    for (const reminder of pending) {
      const targetTime = new Date(reminder.time);
      if (targetTime <= now) {
        await this.triggerReminder(reminder);
      }
    }
  }
}

// 创建单例实例
const remindManager = new RemindManager();

// 启动检查循环
remindManager.startCheck();

export default remindManager;
export { RemindManager };
