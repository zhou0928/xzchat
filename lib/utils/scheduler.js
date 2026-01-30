/**
 * 任务调度管理器 - 定时任务和调度管理
 */

const fs = require('fs').promises;
const path = require('path');

class SchedulerManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/schedules.json');
    this.schedules = [];
    this.running = new Map();
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.schedules = JSON.parse(data);
    } catch (err) {
      this.schedules = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.schedules, null, 2));
  }

  add(name, type, config, description = '') {
    const schedule = {
      id: Date.now().toString(),
      name,
      type, // 'interval', 'cron', 'once'
      config, // { interval, unit } 或 { cron } 或 { at }
      description,
      command: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      nextRunAt: this._calculateNextRun(type, config),
      runCount: 0
    };
    this.schedules.push(schedule);
    this.save();
    return schedule;
  }

  get(id) {
    return this.schedules.find(s => s.id === id);
  }

  getAll() {
    return this.schedules;
  }

  getByStatus(status) {
    return this.schedules.filter(s => s.status === status);
  }

  update(id, updates) {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      this.schedules[index] = {
        ...this.schedules[index],
        ...updates,
        nextRunAt: updates.config ? this._calculateNextRun(updates.type, updates.config) : this.schedules[index].nextRunAt
      };
      this.save();
      return this.schedules[index];
    }
    return null;
  }

  remove(id) {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      const removed = this.schedules.splice(index, 1)[0];
      if (this.running.has(id)) {
        clearTimeout(this.running.get(id));
        this.running.delete(id);
      }
      this.save();
      return removed;
    }
    return null;
  }

  async start(id) {
    const schedule = this.get(id);
    if (!schedule) return { success: false, message: '调度任务不存在' };

    if (schedule.status !== 'active') {
      return { success: false, message: '调度任务未激活' };
    }

    if (this.running.has(id)) {
      return { success: false, message: '调度任务已在运行' };
    }

    await this._scheduleTask(schedule);
    return { success: true, message: '调度任务已启动' };
  }

  async stop(id) {
    if (!this.running.has(id)) {
      return { success: false, message: '调度任务未在运行' };
    }

    clearTimeout(this.running.get(id));
    this.running.delete(id);
    return { success: true, message: '调度任务已停止' };
  }

  async runNow(id) {
    const schedule = this.get(id);
    if (!schedule) return { success: false, message: '调度任务不存在' };

    // 模拟执行
    await new Promise(resolve => setTimeout(resolve, 100));
    schedule.lastRunAt = new Date().toISOString();
    schedule.runCount++;

    this.save();

    return {
      success: true,
      message: `调度任务 "${schedule.name}" 已执行`,
      data: schedule
    };
  }

  async _scheduleTask(schedule) {
    const now = new Date();
    const nextRun = new Date(schedule.nextRunAt);
    const delay = nextRun - now;

    if (delay <= 0) {
      // 立即执行
      await this.runNow(schedule.id);
      return;
    }

    const timeout = setTimeout(async () => {
      await this.runNow(schedule.id);

      // 重新调度
      if (schedule.status === 'active' && schedule.type !== 'once') {
        await this._scheduleTask(schedule);
      } else {
        this.running.delete(schedule.id);
      }
    }, delay);

    this.running.set(schedule.id, timeout);
  }

  _calculateNextRun(type, config) {
    const now = new Date();

    switch (type) {
      case 'interval':
        const interval = config.interval || 1;
        const unit = config.unit || 'minutes';
        const multiplier = {
          seconds: 1000,
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000
        }[unit] || 60 * 1000;
        return new Date(now.getTime() + interval * multiplier).toISOString();

      case 'cron':
        // 简化处理，实际应使用cron表达式解析
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      case 'once':
        return config.at || now.toISOString();

      default:
        return now.toISOString();
    }
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.schedules.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower)
    );
  }

  getStats() {
    const now = new Date();
    return {
      total: this.schedules.length,
      active: this.schedules.filter(s => s.status === 'active').length,
      running: this.running.size,
      byType: {
        interval: this.schedules.filter(s => s.type === 'interval').length,
        cron: this.schedules.filter(s => s.type === 'cron').length,
        once: this.schedules.filter(s => s.type === 'once').length
      },
      totalRuns: this.schedules.reduce((sum, s) => sum + s.runCount, 0),
      dueSoon: this.schedules.filter(s => {
        const nextRun = new Date(s.nextRunAt);
        return s.status === 'active' && nextRun - now < 5 * 60 * 1000;
      }).length
    };
  }
}

module.exports = SchedulerManager;
