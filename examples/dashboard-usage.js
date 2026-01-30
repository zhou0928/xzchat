/**
 * 统计看板系统使用示例
 *
 * 本文件展示如何使用 xzChat 的统计看板系统
 */

import {
  StatisticsDashboard,
  ChartType,
  TimeRange,
  createStatisticsDashboard,
  showDashboard,
  showCommandChart,
  showDailyActivityChart,
  showAchievementProgress
} from '../lib/utils/dashboard.js';

// ============================================
// 示例 1: 基础使用
// ============================================
function example1_basicUsage() {
  console.log('\n=== 示例 1: 基础使用 ===\n');

  // 创建统计看板
  const dashboard = createStatisticsDashboard({
    autoSave: false
  });

  // 记录一些数据
  dashboard.recordMessage({ role: 'user', content: 'Hello' });
  dashboard.recordMessage({ role: 'assistant', content: 'Hi there!' });
  dashboard.recordCommand({ command: 'session', args: ['list'] });
  dashboard.recordCommand({ command: 'help' });
  dashboard.recordSession({ sessionId: '1', sessionName: 'test', action: 'create' });

  // 显示概览
  showDashboard(dashboard);
}

// ============================================
// 示例 2: 记录消息
// ============================================
function example2_recordMessages() {
  console.log('\n=== 示例 2: 记录消息 ===\n');

  const dashboard = createStatisticsDashboard({ autoSave: false });

  // 记录用户消息
  dashboard.recordMessage({
    role: 'user',
    content: '什么是人工智能?',
    model: 'gpt-4',
    tokens: 100,
    cost: 0.002
  });

  // 记录助手回复
  dashboard.recordMessage({
    role: 'assistant',
    content: '人工智能是计算机科学的一个分支...',
    model: 'gpt-4',
    tokens: 500,
    cost: 0.01
  });

  // 查看统计
  const overview = dashboard.getOverview();
  console.log(`总消息数: ${overview.summary.messages}`);
}

// ============================================
// 示例 3: 记录命令
// ============================================
function example3_recordCommands() {
  console.log('\n=== 示例 3: 记录命令 ===\n');

  const dashboard = createStatisticsDashboard({ autoSave: false });

  // 记录各种命令
  dashboard.recordCommand({ command: 'session', args: ['list'] });
  dashboard.recordCommand({ command: 'session', args: ['new', 'work'] });
  dashboard.recordCommand({ command: 'help' });
  dashboard.recordCommand({ command: 'branch', args: ['list'] });
  dashboard.recordCommand({ command: 'branch', args: ['create', '测试'] });

  // 显示命令使用图表
  showCommandChart(dashboard);
}

// ============================================
// 示例 4: 时间范围过滤
// ============================================
function example4_timeRange() {
  console.log('\n=== 示例 4: 时间范围过滤 ===\n');

  const dashboard = createStatisticsDashboard({ autoSave: false });

  // 模拟不同时间的记录
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  dashboard.recordMessage({});
  dashboard.stats.messages[0].timestamp = oneMonthAgo;

  dashboard.recordMessage({});
  dashboard.stats.messages[1].timestamp = oneWeekAgo;

  dashboard.recordMessage({});
  dashboard.stats.messages[2].timestamp = now;

  // 查看不同时间范围的统计
  console.log('\n全部时间:');
  const all = dashboard.getOverview(TimeRange.ALL);
  console.log(`消息数: ${all.summary.messages}`);

  console.log('\n最近一周:');
  const week = dashboard.getOverview(TimeRange.WEEK);
  console.log(`消息数: ${week.summary.messages}`);

  console.log('\n今天:');
  const today = dashboard.getOverview(TimeRange.TODAY);
  console.log(`消息数: ${today.summary.messages}`);
}

// ============================================
// 示例 5: 每日活动
// ============================================
function example5_dailyActivity() {
  console.log('\n=== 示例 5: 每日活动 ===\n');

  const dashboard = createStatisticsDashboard({ autoSave: false });

  // 模拟多天的活动
  const now = Date.now();
  for (let i = 0; i < 30; i++) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const messages = Math.floor(Math.random() * 20) + 5;

    for (let j = 0; j < messages; j++) {
      dashboard.recordMessage({});
      dashboard.stats.messages[dashboard.stats.messages.length - 1].timestamp = timestamp;
    }
  }

  // 显示每日活动图表
  showDailyActivityChart(dashboard);
}

// ============================================
// 示例 6: 每小时活动
// ============================================
function example6_hourlyActivity() {
  console.log('\n=== 示例 6: 每小时活动 ===\n');

  const dashboard = createStatisticsDashboard({ autoSave: false });

  // 模拟一天中不同时间的活动
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let hour = 0; hour < 24; hour++) {
    const count = Math.floor(Math.random() * 10) + 1;

    for (let i = 0; i < count; i++) {
      dashboard.recordMessage({});
      const timestamp = now.getTime() + hour * 60 * 60 * 1000 + i * 1000;
      dashboard.stats.messages[dashboard.stats.messages.length - 1].timestamp = timestamp;
    }
  }

  // 获取每小时活动
  const activity = dashboard.getHourlyActivity();

  console.log('\n每小时活动统计:');
  Object.entries(activity).forEach(([hour, count]) => {
    const bar = '█'.repeat(Math.min(count, 20));
    console.log(`  ${hour.padStart(2, '0')}:00 ${bar} ${count}`);
  });
}

// ============================================
// 示例 7: 自定义图表
// ============================================
function example7_customCharts() {
  console.log('\n=== 示例 7: 自定义图表 ===\n');

  const dashboard = createStatisticsDashboard({ autoSave: false });

  // 柱状图
  console.log('\n柱状图:');
  const barData = { '周一': 20, '周二': 35, '周三': 30, '周四': 25, '周五': 40 };
  const barChart = dashboard.formatChart(ChartType.BAR, barData, {
    title: '每周消息数',
    width: 50
  });
  console.log(barChart);

  // 饼图
  console.log('饼图:');
  const pieData = { '命令A': 30, '命令B': 50, '命令C': 20 };
  const pieChart = dashboard.formatChart(ChartType.PIE, pieData, {
    title: '命令使用分布',
    width: 50
  });
  console.log(pieChart);

  // 进度条
  console.log('进度条:');
  const progressData = { '任务A': 75, '任务B': 50, '任务C': 100, '任务D': 25 };
  const progressChart = dashboard.formatChart(ChartType.PROGRESS, progressData, {
    title: '任务进度',
    width: 50
  });
  console.log(progressChart);
}

// ============================================
// 示例 8: 集成成就系统
// ============================================
function example8_achievementIntegration() {
  console.log('\n=== 示例 8: 集成成就系统 ===\n');

  // 模拟成就引擎
  const mockAchievementEngine = {
    getAllAchievements: () => [
      { id: 'a1', name: '测试1', rarity: 'common', category: 'usage', points: 10 },
      { id: 'a2', name: '测试2', rarity: 'rare', category: 'commands', points: 50 }
    ],
    getUnlockedAchievements: () => [
      { id: 'a1', name: '测试1', rarity: 'common', category: 'usage', points: 10 }
    ],
    getLockedAchievements: () => [
      { id: 'a2', name: '测试2', rarity: 'rare', category: 'commands', points: 50 }
    ],
    calculateTotalPoints: () => 10
  };

  const dashboard = createStatisticsDashboard({
    autoSave: false,
    achievementEngine: mockAchievementEngine
  });

  // 显示完整概览 (包含成就)
  showDashboard(dashboard);

  // 显示成就进度
  showAchievementProgress(dashboard);
}

// ============================================
// 示例 9: 导出统计
// ============================================
function example9_export() {
  console.log('\n=== 示例 9: 导出统计 ===\n');

  const dashboard = createStatisticsDashboard({ autoSave: false });

  dashboard.recordMessage({});
  dashboard.recordCommand({ command: 'session' });
  dashboard.recordSession({ sessionId: '1', sessionName: 'test', action: 'create' });

  // 导出数据
  const exported = dashboard.export();

  console.log('\n导出数据:');
  console.log(`  概览: ${JSON.stringify(exported.overview.summary)}`);
  console.log(`  时间戳: ${new Date(exported.timestamp).toISOString()}`);

  console.log('\n数据可以保存到文件或发送到服务器');
}

// ============================================
// 示例 10: 集成到应用程序
// ============================================
class ChatApplicationWithStats {
  constructor() {
    this.dashboard = createStatisticsDashboard();
  }

  onSendMessage(message) {
    // 记录消息
    this.dashboard.recordMessage({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });
  }

  onAssistantReply(reply) {
    // 记录回复
    this.dashboard.recordMessage({
      role: 'assistant',
      content: reply,
      timestamp: Date.now()
    });
  }

  onCommand(command, args) {
    // 记录命令
    this.dashboard.recordCommand({
      command,
      args,
      timestamp: Date.now()
    });
  }

  onSessionAction(action, sessionId, sessionName) {
    // 记录会话操作
    this.dashboard.recordSession({
      action,
      sessionId,
      sessionName,
      timestamp: Date.now()
    });
  }

  onAchievementUnlock(achievement) {
    // 记录成就
    this.dashboard.recordAchievement({
      achievementId: achievement.id,
      achievementName: achievement.name,
      rarity: achievement.rarity,
      points: achievement.points,
      timestamp: Date.now()
    });
  }

  showStatistics() {
    // 显示统计
    showDashboard(this.dashboard);
  }

  exportStatistics() {
    // 导出统计
    return this.dashboard.export();
  }

  destroy() {
    // 销毁看板
    this.dashboard.destroy();
  }
}

// 使用示例
function example10_integration() {
  console.log('\n=== 示例 10: 应用程序集成 ===\n');

  const app = new ChatApplicationWithStats();

  // 模拟用户活动
  app.onSendMessage('你好');
  app.onAssistantReply('你好!有什么我可以帮助你的吗?');
  app.onCommand('session', ['list']);
  app.onSessionAction('create', '1', '工作');

  // 显示统计
  app.showStatistics();
}

// ============================================
// 运行所有示例
// ============================================
function runAllExamples() {
  try {
    example1_basicUsage();
    example2_recordMessages();
    example3_recordCommands();
    example4_timeRange();
    example5_dailyActivity();
    example6_hourlyActivity();
    example7_customCharts();
    example8_achievementIntegration();
    example9_export();
    example10_integration();

    console.log('\n✓ 所有示例执行完成!\n');
  } catch (error) {
    console.error('示例执行错误:', error);
  }
}

// 导出示例函数
export {
  example1_basicUsage,
  example2_recordMessages,
  example3_recordCommands,
  example4_timeRange,
  example5_dailyActivity,
  example6_hourlyActivity,
  example7_customCharts,
  example8_achievementIntegration,
  example9_export,
  example10_integration,
  ChatApplicationWithStats,
  runAllExamples
};

// 如果直接运行此文件,执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
