/**
 * 统计看板系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StatisticsData,
  StatisticsDashboard,
  ChartType,
  TimeRange,
  createStatisticsDashboard,
  showDashboard,
  showCommandChart,
  showDailyActivityChart
} from '../../lib/utils/dashboard.js';

describe('StatisticsData', () => {
  let stats;

  beforeEach(() => {
    stats = new StatisticsData();
  });

  it('should create empty statistics data', () => {
    expect(stats.messages).toEqual([]);
    expect(stats.commands).toEqual([]);
    expect(stats.sessions).toEqual([]);
    expect(stats.achievements).toEqual([]);
    expect(stats.dailyActivity).toBeInstanceOf(Map);
    expect(stats.hourlyActivity).toBeInstanceOf(Map);
    expect(stats.commandUsage).toBeInstanceOf(Map);
  });

  it('should add message record', () => {
    stats.addMessage({ role: 'user', content: 'Hello' });

    expect(stats.messages.length).toBe(1);
    expect(stats.messages[0].role).toBe('user');
    expect(stats.messages[0].content).toBe('Hello');
    expect(stats.messages[0].timestamp).toBeDefined();
  });

  it('should add command record', () => {
    stats.addCommand({ command: 'session', args: ['list'] });

    expect(stats.commands.length).toBe(1);
    expect(stats.commands[0].command).toBe('session');
  });

  it('should add session record', () => {
    stats.addSession({ sessionId: '1', sessionName: 'default', action: 'create' });

    expect(stats.sessions.length).toBe(1);
    expect(stats.sessions[0].sessionId).toBe('1');
  });

  it('should add achievement record', () => {
    stats.addAchievement({ achievementId: 'test', achievementName: 'Test', rarity: 'common', points: 10 });

    expect(stats.achievements.length).toBe(1);
    expect(stats.achievements[0].achievementId).toBe('test');
  });

  it('should update daily activity', () => {
    const timestamp = Date.now();
    stats.updateDailyActivity(timestamp);

    const date = new Date(timestamp).toDateString();
    expect(stats.dailyActivity.get(date)).toBe(1);
  });

  it('should update hourly activity', () => {
    const now = new Date();
    const timestamp = now.getTime();
    stats.updateHourlyActivity(timestamp);

    const hour = now.getHours();
    expect(stats.hourlyActivity.get(hour)).toBe(1);
  });

  it('should update command usage', () => {
    stats.updateCommandUsage('session');
    stats.updateCommandUsage('session');
    stats.updateCommandUsage('help');

    expect(stats.commandUsage.get('session')).toBe(2);
    expect(stats.commandUsage.get('help')).toBe(1);
  });

  it('should filter by time range', () => {
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;

    stats.addMessage({});
    stats.messages[0].timestamp = yesterday;
    stats.addMessage({});
    stats.messages[1].timestamp = now;

    const filtered = stats.filterByTimeRange(TimeRange.TODAY);
    expect(filtered.messages.length).toBe(1);
    expect(filtered.messages[0].timestamp).toBe(now);
  });

  it('should get summary', () => {
    stats.addMessage({});
    stats.addMessage({});
    stats.addCommand({ command: 'session' });
    stats.addCommand({ command: 'help' });
    stats.addSession({ sessionId: '1', sessionName: 'test', action: 'create' });
    stats.addAchievement({ achievementId: 'test', achievementName: 'Test', rarity: 'common', points: 10 });

    const summary = stats.getSummary();
    expect(summary.totalMessages).toBe(2);
    expect(summary.totalCommands).toBe(2);
    expect(summary.totalSessions).toBe(1);
    expect(summary.totalAchievements).toBe(1);
    expect(summary.activeDays).toBeGreaterThan(0);
    expect(summary.uniqueCommands).toBe(2);
  });
});

describe('StatisticsDashboard', () => {
  let dashboard;

  beforeEach(() => {
    dashboard = new StatisticsDashboard({
      autoSave: false
    });
  });

  it('should create dashboard with default options', () => {
    const defaultDashboard = new StatisticsDashboard();
    expect(defaultDashboard.options.autoSave).toBe(true);
  });

  it('should record message', () => {
    dashboard.recordMessage({ role: 'user', content: 'Hello' });

    expect(dashboard.stats.messages.length).toBe(1);
  });

  it('should record command', () => {
    dashboard.recordCommand({ command: 'session' });

    expect(dashboard.stats.commands.length).toBe(1);
  });

  it('should record session', () => {
    dashboard.recordSession({ sessionId: '1', sessionName: 'test', action: 'create' });

    expect(dashboard.stats.sessions.length).toBe(1);
  });

  it('should record achievement', () => {
    dashboard.recordAchievement({ achievementId: 'test', achievementName: 'Test', rarity: 'common', points: 10 });

    expect(dashboard.stats.achievements.length).toBe(1);
  });

  it('should get overview', () => {
    dashboard.recordMessage({});
    dashboard.recordCommand({ command: 'session' });

    const overview = dashboard.getOverview();

    expect(overview.timeRange).toBe(TimeRange.ALL);
    expect(overview.summary.messages).toBe(1);
    expect(overview.summary.commands).toBe(1);
    expect(overview.dailyActivity).toBeDefined();
    expect(overview.hourlyActivity).toBeDefined();
    expect(overview.commandUsage).toBeDefined();
  });

  it('should get overview with time range', () => {
    dashboard.recordMessage({});
    const now = Date.now();
    dashboard.stats.messages[0].timestamp = now;

    const overview = dashboard.getOverview(TimeRange.TODAY);
    expect(overview.timeRange).toBe(TimeRange.TODAY);
    expect(overview.summary.messages).toBe(1);
  });

  it('should get daily activity', () => {
    const activity = dashboard.getDailyActivity();

    expect(activity).toBeDefined();
    expect(typeof activity).toBe('object');
  });

  it('should get hourly activity', () => {
    const activity = dashboard.getHourlyActivity();

    expect(activity).toBeDefined();
    expect(activity[0]).toBeDefined();
    expect(activity[23]).toBeDefined();
  });

  it('should get command usage', () => {
    dashboard.recordCommand({ command: 'session' });
    dashboard.recordCommand({ command: 'session' });
    dashboard.recordCommand({ command: 'help' });

    const usage = dashboard.getCommandUsage();
    expect(usage.session).toBe(2);
    expect(usage.help).toBe(1);
  });

  it('should format overview', () => {
    dashboard.recordMessage({});
    dashboard.recordCommand({ command: 'session' });

    const formatted = dashboard.formatOverview();

    expect(typeof formatted).toBe('string');
    expect(formatted).toContain('统计看板');
    expect(formatted).toContain('基本统计');
  });

  it('should format bar chart', () => {
    const data = { 'A': 10, 'B': 20, 'C': 15 };
    const chart = dashboard.formatChart(ChartType.BAR, data);

    expect(typeof chart).toBe('string');
    expect(chart).toContain('A');
    expect(chart).toContain('B');
    expect(chart).toContain('C');
  });

  it('should format pie chart', () => {
    const data = { 'A': 30, 'B': 70 };
    const chart = dashboard.formatChart(ChartType.PIE, data, { title: '测试饼图' });

    expect(typeof chart).toBe('string');
    expect(chart).toContain('A');
    expect(chart).toContain('B');
    expect(chart).toContain('70%');
    expect(chart).toContain('30%');
  });

  it('should format progress chart', () => {
    const data = { '任务A': 75, '任务B': 50, '任务C': 100 };
    const chart = dashboard.formatChart(ChartType.PROGRESS, data);

    expect(typeof chart).toBe('string');
    expect(chart).toContain('任务A');
    expect(chart).toContain('75%');
    expect(chart).toContain('█');
  });

  it('should export statistics', () => {
    dashboard.recordMessage({});
    dashboard.recordCommand({ command: 'session' });

    const exported = dashboard.export();

    expect(exported.overview).toBeDefined();
    expect(exported.timestamp).toBeDefined();
  });
});

describe('Quick Functions', () => {
  it('should create dashboard', () => {
    const dashboard = createStatisticsDashboard({ autoSave: false });

    expect(dashboard).toBeInstanceOf(StatisticsDashboard);
  });

  it('should show dashboard', () => {
    const dashboard = new StatisticsDashboard({ autoSave: false });
    const consoleSpy = vi.spyOn(console, 'log');

    showDashboard(dashboard);

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should show command chart', () => {
    const dashboard = new StatisticsDashboard({ autoSave: false });
    dashboard.recordCommand({ command: 'session' });
    const consoleSpy = vi.spyOn(console, 'log');

    showCommandChart(dashboard);

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should show daily activity chart', () => {
    const dashboard = new StatisticsDashboard({ autoSave: false });
    const consoleSpy = vi.spyOn(console, 'log');

    showDailyActivityChart(dashboard);

    expect(consoleSpy).toHaveBeenCalled();
  });
});
