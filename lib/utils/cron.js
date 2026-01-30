import fs from 'fs/promises';
import path from 'path';

/**
 * 定时任务管理器（类似 Linux crontab）
 */
class CronManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-cron.json');
    this.tasks = {};
    this.activeJobs = new Map();
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.tasks = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.tasks = {};
        await this.save();
      } else {
        throw new Error(`加载定时任务配置失败: ${error.message}`);
      }
    }
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify(this.tasks, null, 2));
  }

  async list() {
    await this.load();
    return Object.entries(this.tasks).map(([key, task]) => ({
      id: key,
      name: task.name,
      expression: task.expression,
      command: task.command,
      enabled: task.enabled,
      nextRun: task.enabled ? this.getNextRun(task.expression) : null
    }));
  }

  async get(id) {
    await this.load();
    return this.tasks[id] || null;
  }

  async add(id, name, expression, command, description = '') {
    await this.load();
    if (this.tasks[id]) {
      throw new Error(`任务 "${id}" 已存在`);
    }

    if (!this.validateExpression(expression)) {
      throw new Error(`无效的 cron 表达式: ${expression}`);
    }

    this.tasks[id] = {
      name,
      expression,
      command,
      description,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: this.getNextRun(expression)
    };

    await this.save();
    return this.tasks[id];
  }

  async remove(id) {
    await this.load();
    if (!this.tasks[id]) {
      throw new Error(`任务 "${id}" 不存在`);
    }

    // 停止任务
    if (this.activeJobs.has(id)) {
      const job = this.activeJobs.get(id);
      if (job.interval) {
        clearInterval(job.interval);
      }
      this.activeJobs.delete(id);
    }

    delete this.tasks[id];
    await this.save();
    return true;
  }

  async update(id, updates) {
    await this.load();
    if (!this.tasks[id]) {
      throw new Error(`任务 "${id}" 不存在`);
    }

    if (updates.expression) {
      if (!this.validateExpression(updates.expression)) {
        throw new Error(`无效的 cron 表达式: ${updates.expression}`);
      }
      this.tasks[id].expression = updates.expression;
      this.tasks[id].nextRun = this.getNextRun(updates.expression);
    }

    if (updates.name !== undefined) {
      this.tasks[id].name = updates.name;
    }

    if (updates.command !== undefined) {
      this.tasks[id].command = updates.command;
    }

    if (updates.description !== undefined) {
      this.tasks[id].description = updates.description;
    }

    if (updates.enabled !== undefined) {
      this.tasks[id].enabled = updates.enabled;
    }

    this.tasks[id].updatedAt = new Date().toISOString();

    await this.save();
    return this.tasks[id];
  }

  async enable(id) {
    return this.update(id, { enabled: true });
  }

  async disable(id) {
    return this.update(id, { enabled: false });
  }

  /**
   * 解析 cron 表达式
   * 格式: * * * * *
   * 分 时 日 月 周
   */
  validateExpression(expr) {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) {
      return false;
    }

    const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];

    return parts.every((part, index) => {
      if (part === '*') return true;
      if (part.includes('/')) {
        const [base, step] = part.split('/');
        return !isNaN(parseInt(step));
      }
      if (part.includes(',')) {
        return part.split(',').every(v => {
          const num = parseInt(v);
          return !isNaN(num) && num >= ranges[index][0] && num <= ranges[index][1];
        });
      }
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        return !isNaN(start) && !isNaN(end) && start >= ranges[index][0] && end <= ranges[index][1];
      }
      const num = parseInt(part);
      return !isNaN(num) && num >= ranges[index][0] && num <= ranges[index][1];
    });
  }

  /**
   * 计算下次运行时间
   */
  getNextRun(expr) {
    const now = new Date();
    const parts = expr.trim().split(/\s+/);

    // 简化实现：计算大致的下次运行时间
    // 实际生产环境建议使用 node-cron 库
    
    const minute = parts[0];
    const hour = parts[1];

    let next = new Date(now);

    if (minute !== '*') {
      const min = parseInt(minute);
      next.setMinutes(min);
      next.setSeconds(0);
    }

    if (hour !== '*') {
      const hr = parseInt(hour);
      next.setHours(hr);
    } else if (minute !== '*') {
      next.setHours(next.getHours() + 1);
    }

    if (next <= now) {
      // 如果计算的时间已过，加一小时或一天
      if (hour !== '*') {
        next.setDate(next.getDate() + 1);
      } else {
        next.setHours(next.getHours() + 1);
      }
    }

    return next.toISOString();
  }

  /**
   * 启动定时任务调度器
   */
  async startScheduler() {
    await this.load();

    for (const [id, task] of Object.entries(this.tasks)) {
      if (task.enabled) {
        this.scheduleTask(id, task);
      }
    }
  }

  scheduleTask(id, task) {
    // 计算运行间隔（秒）
    const interval = this.calculateInterval(task.expression);
    
    const intervalMs = interval * 1000;
    
    const intervalObj = setInterval(() => {
      this.runTask(id, task);
    }, intervalMs);

    this.activeJobs.set(id, {
      task,
      interval: intervalObj,
      intervalMs
    });
  }

  calculateInterval(expr) {
    const parts = expr.trim().split(/\s+/);
    
    // 简化实现：返回最小间隔
    if (parts[0] === '*') {
      if (parts[1] === '*') {
        return 60; // 每分钟
      }
      return 3600; // 每小时
    }
    return 3600; // 默认每小时
  }

  async runTask(id, task) {
    try {
      // 更新最后运行时间
      task.lastRun = new Date().toISOString();
      task.nextRun = this.getNextRun(task.expression);
      await this.save();

      // 记录执行日志
      this.logExecution(id, task);

      // 这里应该是实际执行命令的逻辑
      // 由于这是 CLI 工具，实际执行可能需要集成到主程序
      console.log(`[CRON] 执行任务: ${task.name} (${id})`);
      console.log(`[CRON] 命令: ${task.command}`);

    } catch (error) {
      console.error(`[CRON] 任务执行失败: ${id}`, error);
      task.lastError = error.message;
      await this.save();
    }
  }

  logExecution(id, task) {
    const logEntry = {
      taskId: id,
      taskName: task.name,
      command: task.command,
      executedAt: new Date().toISOString(),
      status: 'success'
    };

    // 实际实现应该写入日志文件
    console.log(JSON.stringify(logEntry));
  }

  async getExecutionLogs(id = null, limit = 100) {
    // 实际实现应该从日志文件读取
    return [];
  }

  /**
   * 解析友好的时间表达式
   */
  parseFriendlyExpression(expr) {
    const map = {
      '@yearly': '0 0 1 1 *',
      '@annually': '0 0 1 1 *',
      '@monthly': '0 0 1 * *',
      '@weekly': '0 0 * * 0',
      '@daily': '0 0 * * *',
      '@midnight': '0 0 * * *',
      '@hourly': '0 * * * *',
      '@minutely': '* * * * *'
    };

    return map[expr.toLowerCase()] || expr;
  }

  /**
   * 获取预设模板
   */
  getPresets() {
    return {
      'daily-backup': {
        name: '每日备份',
        expression: '0 2 * * *',
        description: '每天凌晨 2 点执行'
      },
      'weekly-report': {
        name: '每周报告',
        expression: '0 9 * * 1',
        description: '每周一上午 9 点执行'
      },
      'hourly-sync': {
        name: '每小时同步',
        expression: '0 * * * *',
        description: '每小时执行一次'
      },
      'cleanup': {
        name: '每日清理',
        expression: '0 3 * * *',
        description: '每天凌晨 3 点执行'
      },
      'reminder': {
        name: '每15分钟提醒',
        expression: '*/15 * * * *',
        description: '每 15 分钟执行一次'
      }
    };
  }

  async export(format = 'json') {
    await this.load();
    if (format === 'json') {
      return JSON.stringify(this.tasks, null, 2);
    }
    if (format === 'crontab') {
      let crontab = '# xzChat 定时任务\n';
      for (const [id, task] of Object.entries(this.tasks)) {
        crontab += `# ${task.name} - ${task.description}\n`;
        crontab += `${task.expression} ${task.command} # ${id}\n`;
      }
      return crontab;
    }
    throw new Error(`不支持的导出格式: ${format}`);
  }

  async import(content, format = 'json') {
    let tasks;
    if (format === 'json') {
      tasks = JSON.parse(content);
    } else {
      throw new Error(`不支持的导入格式: ${format}`);
    }

    await this.load();
    let count = 0;
    for (const [id, task] of Object.entries(tasks)) {
      if (!this.tasks[id]) {
        this.tasks[id] = {
          ...task,
          createdAt: new Date().toISOString(),
          lastRun: null,
          nextRun: this.getNextRun(task.expression)
        };
        count++;
      }
    }

    await this.save();
    return count;
  }

  async stopAll() {
    for (const [id, job] of this.activeJobs.entries()) {
      if (job.interval) {
        clearInterval(job.interval);
      }
    }
    this.activeJobs.clear();
  }

  getActiveJobs() {
    return Array.from(this.activeJobs.entries()).map(([id, job]) => ({
      id,
      name: job.task.name,
      interval: `${job.intervalMs / 1000}s`
    }));
  }
}

export default new CronManager();
