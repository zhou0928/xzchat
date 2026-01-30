/**
 * 统计看板系统
 * 提供可视化的使用统计和分析功能
 */

import { logger } from './logger.js';
import { AchievementEngine } from './achievement.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * 图表类型
 */
export const ChartType = {
  BAR: 'bar',           // 柱状图
  LINE: 'line',         // 折线图
  PIE: 'pie',           // 饼图
  TABLE: 'table',       // 表格
  LIST: 'list',         // 列表
  PROGRESS: 'progress'  // 进度条
};

/**
 * 时间范围
 */
export const TimeRange = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  ALL: 'all'
};

/**
 * 统计数据
 */
export class StatisticsData {
  constructor() {
    this.messages = [];
    this.commands = [];
    this.sessions = [];
    this.achievements = [];
    this.dailyActivity = new Map();
    this.hourlyActivity = new Map();
    this.commandUsage = new Map();
    this.modelUsage = new Map();
  }

  /**
   * 添加消息记录
   */
  addMessage(data) {
    const record = {
      timestamp: Date.now(),
      ...data
    };
    this.messages.push(record);
    this.updateDailyActivity(record.timestamp);
    this.updateHourlyActivity(record.timestamp);
  }

  /**
   * 添加命令记录
   */
  addCommand(data) {
    const record = {
      timestamp: Date.now(),
      ...data
    };
    this.commands.push(record);
    this.updateCommandUsage(data.command);
  }

  /**
   * 添加会话记录
   */
  addSession(data) {
    const record = {
      timestamp: Date.now(),
      ...data
    };
    this.sessions.push(record);
  }

  /**
   * 添加成就记录
   */
  addAchievement(data) {
    const record = {
      timestamp: Date.now(),
      ...data
    };
    this.achievements.push(record);
  }

  /**
   * 更新每日活动
   */
  updateDailyActivity(timestamp) {
    const date = new Date(timestamp).toDateString();
    const count = this.dailyActivity.get(date) || 0;
    this.dailyActivity.set(date, count + 1);
  }

  /**
   * 更新每小时活动
   */
  updateHourlyActivity(timestamp) {
    const hour = new Date(timestamp).getHours();
    const count = this.hourlyActivity.get(hour) || 0;
    this.hourlyActivity.set(hour, count + 1);
  }

  /**
   * 更新命令使用
   */
  updateCommandUsage(command) {
    const count = this.commandUsage.get(command) || 0;
    this.commandUsage.set(command, count + 1);
  }

  /**
   * 按时间范围过滤
   */
  filterByTimeRange(range) {
    const now = Date.now();
    let startTime;

    switch (range) {
      case TimeRange.TODAY:
        startTime = new Date().setHours(0, 0, 0, 0);
        break;
      case TimeRange.WEEK:
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case TimeRange.MONTH:
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case TimeRange.QUARTER:
        startTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case TimeRange.YEAR:
        startTime = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case TimeRange.ALL:
      default:
        startTime = 0;
    }

    return {
      messages: this.messages.filter(m => m.timestamp >= startTime),
      commands: this.commands.filter(c => c.timestamp >= startTime),
      sessions: this.sessions.filter(s => s.timestamp >= startTime),
      achievements: this.achievements.filter(a => a.timestamp >= startTime)
    };
  }

  /**
   * 获取统计摘要
   */
  getSummary() {
    return {
      totalMessages: this.messages.length,
      totalCommands: this.commands.length,
      totalSessions: this.sessions.length,
      totalAchievements: this.achievements.length,
      activeDays: this.dailyActivity.size,
      uniqueCommands: this.commandUsage.size
    };
  }
}

/**
 * 统计看板
 */
export class StatisticsDashboard {
  constructor(options = {}) {
    this.stats = new StatisticsData();
    this.achievementEngine = options.achievementEngine || null;
    this.options = {
      dataDir: options.dataDir || path.join(os.homedir(), '.newapi-chat'),
      autoSave: options.autoSave ?? true,
      saveInterval: options.saveInterval || 60000
    };

    this.saveTimer = null;
    this.loadStats();
    this.startAutoSave();
  }

  /**
   * 记录消息
   */
  recordMessage(data) {
    this.stats.addMessage(data);
    logger.debug('消息已记录', data);
  }

  /**
   * 记录命令
   */
  recordCommand(data) {
    this.stats.addCommand(data);
    logger.debug('命令已记录', data);
  }

  /**
   * 记录会话
   */
  recordSession(data) {
    this.stats.addSession(data);
    logger.debug('会话已记录', data);
  }

  /**
   * 记录成就
   */
  recordAchievement(data) {
    this.stats.addAchievement(data);
    logger.debug('成就已记录', data);
  }

  /**
   * 获取概览统计
   */
  getOverview(timeRange = TimeRange.ALL) {
    const filtered = this.stats.filterByTimeRange(timeRange);

    return {
      timeRange,
      summary: {
        messages: filtered.messages.length,
        commands: filtered.commands.length,
        sessions: filtered.sessions.length,
        achievements: filtered.achievements.length
      },
      dailyActivity: this.getDailyActivity(filtered),
      hourlyActivity: this.getHourlyActivity(filtered),
      commandUsage: this.getCommandUsage(filtered)
    };
  }

  /**
   * 获取每日活动
   */
  getDailyActivity(filtered = null) {
    const data = filtered || this.stats;
    const activity = {};

    // 获取最近 30 天的数据
    const days = 30;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      activity[dateStr] = data.dailyActivity.get(dateStr) || 0;
    }

    return activity;
  }

  /**
   * 获取每小时活动
   */
  getHourlyActivity(filtered = null) {
    const data = filtered || this.stats;
    const activity = {};

    for (let i = 0; i < 24; i++) {
      activity[i] = data.hourlyActivity.get(i) || 0;
    }

    return activity;
  }

  /**
   * 获取命令使用
   */
  getCommandUsage(filtered = null) {
    const data = filtered || this.stats;
    const usage = {};

    data.commandUsage.forEach((count, command) => {
      usage[command] = count;
    });

    return usage;
  }

  /**
   * 获取成就统计
   */
  getAchievementStats() {
    if (!this.achievementEngine) {
      return null;
    }

    const all = this.achievementEngine.getAllAchievements();
    const unlocked = this.achievementEngine.getUnlockedAchievements();
    const locked = this.achievementEngine.getLockedAchievements();

    return {
      total: all.length,
      unlocked: unlocked.length,
      locked: locked.length,
      percentage: Math.round((unlocked.length / all.length) * 100),
      totalPoints: this.achievementEngine.calculateTotalPoints(),
      byRarity: this.getAchievementsByRarity(unlocked),
      byCategory: this.getAchievementsByCategory(unlocked),
      recent: this.stats.achievements.slice(-10).reverse()
    };
  }

  /**
   * 按稀有度获取成就
   */
  getAchievementsByRarity(achievements) {
    const byRarity = {};
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

    rarities.forEach(rarity => {
      byRarity[rarity] = achievements.filter(a => a.rarity === rarity).length;
    });

    return byRarity;
  }

  /**
   * 按类别获取成就
   */
  getAchievementsByCategory(achievements) {
    const byCategory = {};
    const categories = ['usage', 'commands', 'sessions', 'tutorials', 'branches', 'rag', 'git', 'tools'];

    categories.forEach(category => {
      byCategory[category] = achievements.filter(a => a.category === category).length;
    });

    return byCategory;
  }

  /**
   * 格式化概览
   */
  formatOverview(timeRange = TimeRange.ALL) {
    const overview = this.getOverview(timeRange);
    const achievementStats = this.getAchievementStats();

    let output = '';

    output += '\n' + '='.repeat(70);
    output += '\n📊 统计看板';
    output += '\n' + '='.repeat(70) + '\n';

    // 基本统计
    output += '\n📈 基本统计\n';
    output += '─'.repeat(70) + '\n';
    output += `  消息数: ${overview.summary.messages}\n`;
    output += `  命令数: ${overview.summary.commands}\n`;
    output += `  会话数: ${overview.summary.sessions}\n`;
    output += `  成就数: ${overview.summary.achievements}\n`;
    output += `  活跃天数: ${this.stats.dailyActivity.size}\n`;

    // 每日活动
    output += '\n📅 每日活动 (最近 30 天)\n';
    output += '─'.repeat(70) + '\n';

    const dailyData = overview.dailyActivity;
    const dates = Object.keys(dailyData).slice(-14); // 显示最近 14 天

    dates.forEach(date => {
      const count = dailyData[date];
      const bar = '█'.repeat(Math.min(Math.ceil(count / 5), 20));
      const shortDate = date.slice(5); // 去掉星期几
      output += `  ${shortDate}: ${bar} ${count}\n`;
    });

    // 每小时活动
    output += '\n⏰ 每小时活动\n';
    output += '─'.repeat(70) + '\n';

    const hourlyData = overview.hourlyActivity;
    for (let i = 0; i < 24; i += 3) {
      const hours = Array.from({ length: 3 }, (_, j) => i + j);
      const total = hours.reduce((sum, h) => sum + (hourlyData[h] || 0), 0);
      const bar = '█'.repeat(Math.min(Math.ceil(total / 10), 20));
      const range = `${String(i).padStart(2, '0')}:00-${String(i + 2).padStart(2, '0')}:59`;
      output += `  ${range}: ${bar} ${total}\n`;
    }

    // 命令使用
    output += '\n⌨️ 命令使用排行\n';
    output += '─'.repeat(70) + '\n';

    const commandData = overview.commandUsage;
    const sortedCommands = Object.entries(commandData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    sortedCommands.forEach(([command, count], index) => {
      const bar = '█'.repeat(Math.min(Math.ceil(count / 5), 30));
      output += `  ${index + 1}. /${command.padEnd(15)} ${bar} ${count}\n`;
    });

    // 成就统计
    if (achievementStats) {
      output += '\n🏆 成就统计\n';
      output += '─'.repeat(70) + '\n';
      output += `  总进度: ${achievementStats.unlocked}/${achievementStats.total} (${achievementStats.percentage}%)\n`;
      output += `  总积分: ${achievementStats.totalPoints}\n`;

      // 稀有度分布
      output += '\n  按稀有度:\n';
      Object.entries(achievementStats.byRarity).forEach(([rarity, count]) => {
        const emoji = {
          common: '⚪',
          uncommon: '🟢',
          rare: '🔵',
          epic: '🟣',
          legendary: '🟡'
        }[rarity] || '⚪';
        output += `    ${emoji} ${rarity}: ${count}\n`;
      });

      // 类别分布
      output += '\n  按类别:\n';
      Object.entries(achievementStats.byCategory).forEach(([category, count]) => {
        output += `    ${category}: ${count}\n`;
      });
    }

    output += '\n' + '='.repeat(70) + '\n';

    return output;
  }

  /**
   * 格式化图表
   */
  formatChart(type, data, options = {}) {
    const { title = '', width = 60 } = options;

    let output = '';

    if (title) {
      output += `\n${title}\n`;
      output += '─'.repeat(width) + '\n';
    }

    switch (type) {
      case ChartType.BAR:
        output += this.formatBarChart(data, width);
        break;
      case ChartType.LINE:
        output += this.formatLineChart(data, width);
        break;
      case ChartType.PIE:
        output += this.formatPieChart(data, width);
        break;
      case ChartType.PROGRESS:
        output += this.formatProgressChart(data, width);
        break;
      default:
        output += '不支持的图表类型\n';
    }

    return output;
  }

  /**
   * 格式化柱状图
   */
  formatBarChart(data, width = 60) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return '无数据\n';
    }

    const maxValue = Math.max(...entries.map(([, value]) => value));
    const barWidth = width - 20;

    let output = '';
    entries.forEach(([label, value]) => {
      const bar = '█'.repeat(Math.round((value / maxValue) * barWidth));
      const paddedLabel = label.padEnd(15);
      output += `  ${paddedLabel} ${bar} ${value}\n`;
    });

    return output;
  }

  /**
   * 格式化折线图
   */
  formatLineChart(data, width = 60) {
    const values = Object.values(data);
    if (values.length === 0) {
      return '无数据\n';
    }

    const maxValue = Math.max(...values);
    const chartHeight = 10;
    const chartWidth = width - 10;

    let output = '';

    // 从上到下绘制
    for (let h = chartHeight; h >= 0; h--) {
      const threshold = (h / chartHeight) * maxValue;
      let line = '  ';

      // 标签
      if (h === chartHeight) {
        line += String(Math.round(maxValue)).padStart(3);
      } else if (h === 0) {
        line += '   0';
      } else {
        line += '   │';
      }

      // 数据点
      values.slice(-chartWidth).forEach((value, i) => {
        if (value >= threshold) {
          line += '█';
        } else {
          line += ' ';
        }
      });

      output += line + '\n';
    }

    // X 轴标签
    output += '      ';
    output += '─'.repeat(Math.min(values.length, chartWidth)) + '\n';

    return output;
  }

  /**
   * 格式化饼图
   */
  formatPieChart(data, width = 60) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return '无数据\n';
    }

    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (total === 0) {
      return '总值为 0\n';
    }

    const sortedEntries = entries.sort(([, a], [, b]) => b - a);
    let currentAngle = 0;

    let output = '';
    sortedEntries.forEach(([label, value]) => {
      const percentage = Math.round((value / total) * 100);
      const barLength = Math.round((percentage / 100) * (width - 25));
      const bar = '█'.repeat(barLength);

      output += `  ${label.padEnd(12)} ${bar} ${percentage}% (${value})\n`;
    });

    return output;
  }

  /**
   * 格式化进度条
   */
  formatProgressChart(data, width = 60) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return '无数据\n';
    }

    let output = '';
    entries.forEach(([label, value]) => {
      const bar = '█'.repeat(Math.min(Math.round(value / 100), width - 20));
      const empty = '░'.repeat(Math.max(0, (width - 20) - Math.round(value / 100)));
      output += `  ${label.padEnd(20)} [${bar}${empty}] ${value}%\n`;
    });

    return output;
  }

  /**
   * 保存统计
   */
  saveStats() {
    try {
      const data = {
        messages: this.stats.messages,
        commands: this.stats.commands,
        sessions: this.stats.sessions,
        achievements: this.stats.achievements,
        dailyActivity: Object.fromEntries(this.stats.dailyActivity),
        hourlyActivity: Object.fromEntries(this.stats.hourlyActivity),
        commandUsage: Object.fromEntries(this.stats.commandUsage),
        modelUsage: Object.fromEntries(this.stats.modelUsage)
      };

      const filePath = path.join(this.options.dataDir, 'statistics.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      logger.debug('统计数据已保存');
    } catch (error) {
      logger.error('保存统计数据失败', { error: error.message });
    }
  }

  /**
   * 加载统计
   */
  loadStats() {
    try {
      const filePath = path.join(this.options.dataDir, 'statistics.json');
      if (!fs.existsSync(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (data.messages) this.stats.messages = data.messages;
      if (data.commands) this.stats.commands = data.commands;
      if (data.sessions) this.stats.sessions = data.sessions;
      if (data.achievements) this.stats.achievements = data.achievements;
      if (data.dailyActivity) {
        this.stats.dailyActivity = new Map(Object.entries(data.dailyActivity));
      }
      if (data.hourlyActivity) {
        this.stats.hourlyActivity = new Map(Object.entries(data.hourlyActivity));
      }
      if (data.commandUsage) {
        this.stats.commandUsage = new Map(Object.entries(data.commandUsage));
      }
      if (data.modelUsage) {
        this.stats.modelUsage = new Map(Object.entries(data.modelUsage));
      }

      logger.debug('统计数据已加载');
    } catch (error) {
      logger.error('加载统计数据失败', { error: error.message });
    }
  }

  /**
   * 启动自动保存
   */
  startAutoSave() {
    if (!this.options.autoSave) {
      return;
    }

    this.stopAutoSave();
    this.saveTimer = setInterval(() => {
      this.saveStats();
    }, this.options.saveInterval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * 导出统计
   */
  export() {
    return {
      overview: this.getOverview(),
      achievements: this.getAchievementStats(),
      timestamp: Date.now()
    };
  }

  /**
   * 销毁
   */
  destroy() {
    this.stopAutoSave();
    this.saveStats();
  }
}

/**
 * 创建统计看板
 */
export function createStatisticsDashboard(options) {
  return new StatisticsDashboard(options);
}

/**
 * 快捷函数
 */

/**
 * 显示统计概览
 */
export function showDashboard(dashboard, timeRange = TimeRange.ALL) {
  console.log(dashboard.formatOverview(timeRange));
}

/**
 * 显示命令使用图表
 */
export function showCommandChart(dashboard, timeRange = TimeRange.ALL) {
  const overview = dashboard.getOverview(timeRange);
  const chart = dashboard.formatChart(
    ChartType.BAR,
    overview.commandUsage,
    { title: '命令使用统计', width: 60 }
  );
  console.log(chart);
}

/**
 * 显示每日活动图表
 */
export function showDailyActivityChart(dashboard, timeRange = TimeRange.ALL) {
  const overview = dashboard.getOverview(timeRange);
  const chart = dashboard.formatChart(
    ChartType.BAR,
    overview.dailyActivity,
    { title: '每日活动统计', width: 60 }
  );
  console.log(chart);
}

/**
 * 显示成就进度
 */
export function showAchievementProgress(dashboard) {
  const stats = dashboard.getAchievementStats();
  if (!stats) {
    console.log('成就系统未启用');
    return;
  }

  const progress = {
    '已解锁': stats.percentage,
    '未解锁': 100 - stats.percentage
  };

  const chart = dashboard.formatChart(
    ChartType.PIE,
    progress,
    { title: '成就完成度', width: 60 }
  );
  console.log(chart);
}
