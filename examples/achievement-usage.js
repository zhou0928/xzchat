/**
 * 成就系统使用示例
 *
 * 本文件展示如何使用 xzChat 的成就系统
 */

import {
  Achievement,
  AchievementEngine,
  AchievementRarity,
  AchievementCategory,
  createAchievementEngine,
  createBasicAchievements,
  recordMessage,
  recordCommand,
  recordSessionCreate,
  recordBranchCreate,
  recordTutorialComplete,
  recordDailyActive,
  showAchievements,
  showStats
} from '../lib/utils/achievement.js';

// ============================================
// 示例 1: 基础使用
// ============================================
function example1_basicUsage() {
  console.log('\n=== 示例 1: 基础使用 ===\n');

  // 创建成就引擎
  const engine = createAchievementEngine();

  // 记录一些事件
  recordMessage(engine);
  recordMessage(engine);
  recordMessage(engine);

  recordCommand(engine, 'session');
  recordCommand(engine, 'help');

  // 查看统计
  showStats(engine);

  // 查看成就
  showAchievements(engine);
}

// ============================================
// 示例 2: 创建自定义成就
// ============================================
function example2_customAchievement() {
  console.log('\n=== 示例 2: 创建自定义成就 ===\n');

  const engine = new AchievementEngine({ autoSave: false });

  // 创建自定义成就
  const customAchievement = new Achievement({
    id: 'custom_1',
    name: '自定义成就',
    description: '这是一个自定义成就示例',
    icon: '🎯',
    rarity: AchievementRarity.RARE,
    category: AchievementCategory.CUSTOM,
    points: 50,
    criteria: {
      type: 'message_count',
      value: 10
    }
  });

  engine.registerAchievement(customAchievement);

  // 发送 10 条消息来解锁
  for (let i = 0; i < 10; i++) {
    recordMessage(engine);
  }

  // 检查成就状态
  const achievement = engine.getAchievement('custom_1');
  console.log(`\n成就状态: ${achievement.unlocked ? '✓ 已解锁' : '✗ 未解锁'}`);
  console.log(`进度: ${achievement.progress}%`);
}

// ============================================
// 示例 3: 事件监听
// ============================================
function example3_eventListeners() {
  console.log('\n=== 示例 3: 事件监听 ===\n');

  const engine = createAchievementEngine();

  // 监听消息事件
  engine.on('message', (event) => {
    console.log(`消息事件触发: 消息数 = ${engine.userStats.messageCount}`);
  });

  // 监听成就解锁
  engine.on('achievement_unlock', (event) => {
    console.log(`成就解锁: ${event.achievement.name}`);
  });

  // 监听所有事件
  engine.on('*', (event) => {
    console.log(`事件类型: ${event.type}`);
  });

  // 记录一些事件
  recordMessage(engine);
  recordCommand(engine, 'session');
}

// ============================================
// 示例 4: 过滤和排序成就
// ============================================
function example4_filterAndSort() {
  console.log('\n=== 示例 4: 过滤和排序成就 ===\n');

  const engine = createAchievementEngine();

  // 解锁一些成就
  const achievement1 = engine.getAchievement('first_message');
  achievement1?.unlock();

  const achievement2 = engine.getAchievement('talkative');
  achievement2?.unlock();

  // 按类别过滤
  const usageAchievements = engine.formatAchievementList({
    category: AchievementCategory.USAGE
  });
  console.log(`\n使用类成就: ${usageAchievements.length} 个`);

  // 按稀有度过滤
  const rareAchievements = engine.formatAchievementList({
    rarity: AchievementRarity.RARE
  });
  console.log(`稀有成就: ${rareAchievements.length} 个`);

  // 只显示未解锁的
  const lockedAchievements = engine.formatAchievementList({
    lockedOnly: true
  });
  console.log(`未解锁成就: ${lockedAchievements.length} 个`);

  // 按进度排序
  const byProgress = engine.formatAchievementList({
    sortBy: 'progress'
  });
  console.log(`\n按进度排序:`);
  byProgress.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.name} (${a.progress}%)`);
  });
}

// ============================================
// 示例 5: 按类别查看成就
// ============================================
function example5_byCategory() {
  console.log('\n=== 示例 5: 按类别查看成就 ===\n');

  const engine = createAchievementEngine();

  const categories = [
    AchievementCategory.USAGE,
    AchievementCategory.COMMANDS,
    AchievementCategory.SESSIONS,
    AchievementCategory.TUTORIALS,
    AchievementCategory.BRANCHES,
    AchievementCategory.RAG,
    AchievementCategory.GIT
  ];

  categories.forEach(category => {
    const achievements = engine.getAchievementsByCategory(category);
    console.log(`\n${category.toUpperCase()}: ${achievements.length} 个成就`);
    achievements.slice(0, 3).forEach(a => {
      console.log(`  - ${a.name} (${a.rarity})`);
    });
  });
}

// ============================================
// 示例 6: 按稀有度查看成就
// ============================================
function example6_byRarity() {
  console.log('\n=== 示例 6: 按稀有度查看成就 ===\n');

  const engine = createAchievementEngine();

  const rarities = [
    AchievementRarity.COMMON,
    AchievementRarity.UNCOMMON,
    AchievementRarity.RARE,
    AchievementRarity.EPIC,
    AchievementRarity.LEGENDARY
  ];

  rarities.forEach(rarity => {
    const achievements = engine.getAchievementsByRarity(rarity);
    console.log(`\n${rarity.toUpperCase()}: ${achievements.length} 个成就`);
    achievements.slice(0, 3).forEach(a => {
      console.log(`  - ${a.name} (+${a.points} 积分)`);
    });
  });
}

// ============================================
// 示例 7: 完整的用户会话
// ============================================
function example7_userSession() {
  console.log('\n=== 示例 7: 完整的用户会话 ===\n');

  const engine = createAchievementEngine();

  console.log('用户开始使用应用...\n');

  // 用户发送第一条消息
  console.log('发送第一条消息...');
  recordMessage(engine);

  // 用户使用命令
  console.log('使用会话命令...');
  recordCommand(engine, 'session list');
  recordCommand(engine, 'session new work');

  // 用户创建会话
  console.log('创建新会话...');
  recordSessionCreate(engine);

  // 用户继续对话
  console.log('继续对话...');
  for (let i = 0; i < 5; i++) {
    recordMessage(engine);
  }

  // 用户活跃
  console.log('记录每日活跃...');
  recordDailyActive(engine);

  // 查看结果
  console.log('\n--- 会话结束 ---\n');
  showStats(engine);
}

// ============================================
// 示例 8: 教程成就
// ============================================
function example8_tutorialAchievements() {
  console.log('\n=== 示例 8: 教程成就 ===\n');

  const engine = createAchievementEngine();

  console.log('完成教程...\n');

  // 完成快速入门教程
  console.log('完成快速入门教程...');
  recordTutorialComplete(engine, 'quick-start');

  // 检查成就
  const achievement = engine.getAchievement('quick_start');
  if (achievement && achievement.unlocked) {
    console.log(`✓ 成就已解锁: ${achievement.name}`);
    console.log(`  +${achievement.points} 积分`);
  }

  // 完成更多教程
  console.log('\n完成会话管理教程...');
  recordTutorialComplete(engine, 'session-management');

  console.log('完成对话分支教程...');
  recordTutorialComplete(engine, 'branch-management');

  // 查看教程类成就
  const tutorialAchievements = engine.getAchievementsByCategory(AchievementCategory.TUTORIALS);
  console.log(`\n教程成就: ${tutorialAchievements.length} 个`);
  tutorialAchievements.forEach(a => {
    const status = a.unlocked ? '✓' : '✗';
    console.log(`  ${status} ${a.name}`);
  });
}

// ============================================
// 示例 9: 分支成就
// ============================================
function example9_branchAchievements() {
  console.log('\n=== 示例 9: 分支成就 ===\n');

  const engine = createAchievementEngine();

  console.log('使用分支功能...\n');

  // 创建分支
  console.log('创建分支...');
  for (let i = 0; i < 5; i++) {
    recordBranchCreate(engine);
  }

  // 合并分支
  engine.recordEvent('branch_merge', {});
  engine.recordEvent('branch_merge', {});
  engine.recordEvent('branch_merge', {});

  // 查看分支成就
  const branchAchievements = engine.getAchievementsByCategory(AchievementCategory.BRANCHES);
  console.log(`\n分支成就:`);
  branchAchievements.forEach(a => {
    const status = a.unlocked ? '✓' : '✗';
    console.log(`  ${status} ${a.icon} ${a.name}`);
    console.log(`     ${a.description}`);
    if (!a.unlocked) {
      console.log(`     进度: ${a.progress}%`);
    }
  });
}

// ============================================
// 示例 10: 导出和导入数据
// ============================================
function example10_exportImport() {
  console.log('\n=== 示例 10: 导出和导入数据 ===\n');

  const engine = createAchievementEngine();

  // 记录一些事件
  recordMessage(engine);
  recordMessage(engine);
  recordCommand(engine, 'session');

  // 导出数据
  const exported = engine.export();

  console.log('导出数据:');
  console.log(`  消息数: ${exported.stats.messageCount}`);
  console.log(`  总积分: ${exported.stats.totalPoints}`);
  console.log(`  成就数: ${exported.achievements.length}`);
  console.log(`  时间戳: ${new Date(exported.timestamp).toISOString()}`);

  // 在实际应用中,可以将此数据保存到文件或发送到服务器
  console.log('\n数据已导出,可以保存或分享');
}

// ============================================
// 示例 11: 成就进度追踪
// ============================================
function example11_progressTracking() {
  console.log('\n=== 示例 11: 成就进度追踪 ===\n');

  const engine = createAchievementEngine();

  // 记录一些消息
  for (let i = 0; i < 50; i++) {
    recordMessage(engine);
  }

  // 查看有进度的成就
  const achievements = engine.formatAchievementList();
  const inProgress = achievements.filter(a => !a.unlocked && a.progress > 0);

  console.log('进行中的成就:\n');
  inProgress.slice(0, 5).forEach((a, i) => {
    const bar = '█'.repeat(Math.floor(a.progress / 10)) + '░'.repeat(10 - Math.floor(a.progress / 10));
    console.log(`${i + 1}. ${a.name}`);
    console.log(`   ${bar} ${a.progress}%`);
    console.log(`   ${a.description}\n`);
  });
}

// ============================================
// 示例 12: 集成到应用程序
// ============================================
class ChatApplication {
  constructor() {
    this.achievementEngine = createAchievementEngine();
    this.setupAchievementListeners();
  }

  setupAchievementListeners() {
    // 监听成就解锁
    this.achievementEngine.on('achievement_unlock', (event) => {
      this.onAchievementUnlock(event);
    });

    // 监听每日活跃
    this.achievementEngine.on('daily_active', () => {
      this.onDailyActive();
    });
  }

  onAchievementUnlock(event) {
    console.log(`\n🎉 恭喜! 成就解锁: ${event.achievement.name}`);
    console.log(`${event.achievement.description}`);
    console.log(`+${event.achievement.points} 积分\n`);
  }

  onDailyActive() {
    const streak = this.achievementEngine.userStats.consecutiveDays;
    if (streak > 1) {
      console.log(`🔥 连续使用 ${streak} 天!`);
    }
  }

  onSendMessage(message) {
    recordMessage(this.achievementEngine);
    console.log(`消息已发送 (总计: ${this.achievementEngine.userStats.messageCount})`);
  }

  onCommand(command) {
    recordCommand(this.achievementEngine, command);
  }

  onCreateSession() {
    recordSessionCreate(this.achievementEngine);
  }

  onCompleteTutorial(tutorialId) {
    recordTutorialComplete(this.achievementEngine, tutorialId);
  }

  showAchievements() {
    showAchievements(this.achievementEngine);
  }

  showStats() {
    showStats(this.achievementEngine);
  }
}

// 使用示例
function example12_integration() {
  console.log('\n=== 示例 12: 应用程序集成 ===\n');

  const app = new ChatApplication();

  console.log('模拟用户操作...\n');

  // 用户发送消息
  app.onSendMessage('你好');
  app.onSendMessage('如何使用会话功能?');

  // 用户使用命令
  app.onCommand('session list');

  // 用户创建会话
  app.onCreateSession();

  // 完成教程
  console.log('完成教程...');
  app.onCompleteTutorial('quick-start');

  // 显示统计
  console.log('\n--- 用户统计 ---');
  app.showStats();
}

// ============================================
// 运行所有示例
// ============================================
function runAllExamples() {
  try {
    example1_basicUsage();
    example2_customAchievement();
    example3_eventListeners();
    example4_filterAndSort();
    example5_byCategory();
    example6_byRarity();
    example7_userSession();
    example8_tutorialAchievements();
    example9_branchAchievements();
    example10_exportImport();
    example11_progressTracking();
    example12_integration();

    console.log('\n✓ 所有示例执行完成!\n');
  } catch (error) {
    console.error('示例执行错误:', error);
  }
}

// 导出示例函数
export {
  example1_basicUsage,
  example2_customAchievement,
  example3_eventListeners,
  example4_filterAndSort,
  example5_byCategory,
  example6_byRarity,
  example7_userSession,
  example8_tutorialAchievements,
  example9_branchAchievements,
  example10_exportImport,
  example11_progressTracking,
  example12_integration,
  ChatApplication,
  runAllExamples
};

// 如果直接运行此文件,执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
