/**
 * 智能命令推荐系统使用示例
 * 
 * 本示例展示了智能命令推荐引擎的使用方法
 */

import { RecommendationEngine, recordCommand, getRecommendations, searchCommands } from '../lib/utils/recommendation-engine.js';
import { logger } from '../lib/utils/logger.js';

// =============================================================================
// 示例 1: 基础使用
// =============================================================================

async function example1_basicUsage() {
  console.log('\n=== 示例 1: 基础使用 ===\n');
  
  const engine = new RecommendationEngine();
  
  // 记录命令使用
  console.log('记录命令使用...');
  engine.record('/help', { sessionId: 'session-1' });
  engine.record('/config', { sessionId: 'session-1' });
  engine.record('/help', { sessionId: 'session-1' });
  engine.record('/rag', { sessionId: 'session-2' });
  engine.record('/commit', { sessionId: 'session-2' });
  
  // 获取推荐
  console.log('\n全局推荐:');
  const recommendations = engine.getRecommendations();
  recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command} - ${rec.description}`);
    console.log(`     置信度: ${(rec.confidence * 100).toFixed(0)}%`);
    console.log(`     来源: ${rec.source}`);
  });
  
  // 获取统计信息
  console.log('\n统计信息:');
  const stats = engine.getStats();
  console.log(`  总命令数: ${stats.totalCommands}`);
  console.log(`  常用命令:`);
  stats.topCommands.slice(0, 5).forEach(([cmd, count]) => {
    console.log(`    - ${cmd}: ${count} 次`);
  });
}

// =============================================================================
// 示例 2: 会话感知推荐
// =============================================================================

async function example2_sessionAwareRecommendations() {
  console.log('\n=== 示例 2: 会话感知推荐 ===\n');
  
  const engine = new RecommendationEngine();
  
  // 模拟不同会话的命令使用
  console.log('模拟不同会话...');
  
  // 开发会话
  engine.record('/config', { sessionId: 'dev-session' });
  engine.record('/rag index', { sessionId: 'dev-session' });
  engine.record('/scan', { sessionId: 'dev-session' });
  engine.record('/rag search', { sessionId: 'dev-session' });
  engine.record('/tools list', { sessionId: 'dev-session' });
  
  // Git 会话
  engine.record('/git diff', { sessionId: 'git-session' });
  engine.record('/commit', { sessionId: 'git-session' });
  engine.record('/review', { sessionId: 'git-session' });
  engine.record('/git log', { sessionId: 'git-session' });
  engine.record('/git diff', { sessionId: 'git-session' });
  
  // 获取开发会话的推荐
  console.log('\n开发会话推荐:');
  const devRecs = engine.getRecommendations({ sessionId: 'dev-session' });
  devRecs.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command} - ${(rec.confidence * 100).toFixed(0)}%`);
  });
  
  // 获取 Git 会话的推荐
  console.log('\nGit 会话推荐:');
  const gitRecs = engine.getRecommendations({ sessionId: 'git-session' });
  gitRecs.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command} - ${(rec.confidence * 100).toFixed(0)}%`);
  });
  
  // 获取会话常用命令
  console.log('\n开发会话常用命令:');
  const devTopCmds = engine.stats.getSessionTopCommands('dev-session', 5);
  devTopCmds.forEach(([cmd, count]) => {
    console.log(`  - ${cmd}: ${count} 次`);
  });
  
  console.log('\nGit 会话常用命令:');
  const gitTopCmds = engine.stats.getSessionTopCommands('git-session', 5);
  gitTopCmds.forEach(([cmd, count]) => {
    console.log(`  - ${cmd}: ${count} 次`);
  });
}

// =============================================================================
// 示例 3: 上下文相关推荐
// =============================================================================

async function example3_contextualRecommendations() {
  console.log('\n=== 示例 3: 上下文相关推荐 ===\n');
  
  const engine = new RecommendationEngine();
  
  // 模拟工作流
  console.log('模拟工作流...');
  
  // Git 工作流
  engine.record('/git diff');
  engine.record('/commit');
  engine.record('/review');
  
  // RAG 工作流
  engine.record('/rag index');
  engine.record('/scan');
  engine.record('/rag search');
  engine.record('/load');
  
  // 会话工作流
  engine.record('/session create');
  engine.record('/branch create');
  engine.record('/session list');
  
  // 基于最后一个命令的推荐
  console.log('\n在执行 /commit 后推荐:');
  const afterCommit = engine.getRecommendations({ lastCommand: '/commit' });
  afterCommit.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command} - ${rec.description}`);
  });
  
  console.log('\n在执行 /rag index 后推荐:');
  const afterRag = engine.getRecommendations({ lastCommand: '/rag index' });
  afterRag.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command} - ${rec.description}`);
  });
  
  console.log('\n在执行 /session create 后推荐:');
  const afterSession = engine.getRecommendations({ lastCommand: '/session create' });
  afterSession.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command} - ${rec.description}`);
  });
}

// =============================================================================
// 示例 4: 命令搜索
// =============================================================================

async function example4_commandSearch() {
  console.log('\n=== 示例 4: 命令搜索 ===\n');
  
  const engine = new RecommendationEngine();
  
  // 记录一些命令
  engine.record('/help');
  engine.record('/config');
  engine.record('/rag index');
  engine.record('/rag search');
  engine.record('/git diff');
  engine.record('/git log');
  
  // 搜索命令
  console.log('搜索 "help":');
  const helpResults = engine.searchCommands('help');
  helpResults.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.command}`);
    console.log(`     描述: ${result.description}`);
    console.log(`     类别: ${result.category}`);
    console.log(`     使用次数: ${result.usage}`);
    console.log(`     相关性: ${(result.relevance * 100).toFixed(0)}%`);
  });
  
  console.log('\n搜索 "rag":');
  const ragResults = engine.searchCommands('rag');
  ragResults.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.command} - ${result.description}`);
  });
  
  console.log('\n搜索 "git":');
  const gitResults = engine.searchCommands('git');
  gitResults.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.command} - ${result.description}`);
  });
  
  console.log('\n搜索 "config":');
  const configResults = engine.searchCommands('config');
  configResults.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.command} - ${result.description}`);
  });
}

// =============================================================================
// 示例 5: 时间感知推荐
// =============================================================================

async function example5_timeBasedRecommendations() {
  console.log('\n=== 示例 5: 时间感知推荐 ===\n');
  
  const engine = new RecommendationEngine();
  
  // 模拟不同时间段的命令使用
  console.log('模拟不同时间段的命令使用...');
  
  // 当前小时
  const currentHour = new Date().getHours();
  
  // 记录当前小时的命令
  engine.record('/help');
  engine.record('/config');
  engine.record('/rag');
  
  // 获取时间相关的推荐
  console.log('\n当前时间段常用命令:');
  const timeCmds = engine.stats.getTimeBasedCommands(5);
  
  if (timeCmds.length > 0) {
    timeCmds.forEach(([cmd, count]) => {
      console.log(`  - ${cmd}: ${count} 次`);
    });
  } else {
    console.log('  暂无时间相关数据');
  }
  
  console.log(`\n当前时间: ${currentHour}:00`);
}

// =============================================================================
// 示例 6: 快捷函数使用
// =============================================================================

async function example6_shortcutFunctions() {
  console.log('\n=== 示例 6: 快捷函数使用 ===\n');
  
  // 使用快捷函数记录命令
  console.log('使用快捷函数记录命令...');
  recordCommand('/help');
  recordCommand('/config');
  recordCommand('/help');
  
  // 使用快捷函数获取推荐
  console.log('\n快捷函数获取推荐:');
  const recommendations = getRecommendations();
  recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command} - ${rec.description}`);
  });
  
  // 使用快捷函数搜索命令
  console.log('\n快捷函数搜索命令:');
  const results = searchCommands('help');
  results.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.command} - ${result.description}`);
  });
}

// =============================================================================
// 示例 7: 完整工作流
// =============================================================================

async function example7_completeWorkflow() {
  console.log('\n=== 示例 7: 完整工作流 ===\n');
  
  const engine = new RecommendationEngine();
  const sessionId = 'workflow-session';
  
  console.log('模拟真实工作流...\n');
  
  // 阶段 1: 项目设置
  console.log('阶段 1: 项目设置');
  engine.record('/config init', { sessionId });
  engine.record('/config set', { sessionId });
  engine.record('/profile', { sessionId });
  await sleep(100);
  
  // 阶段 2: 代码理解
  console.log('阶段 2: 代码理解');
  engine.record('/scan', { sessionId });
  engine.record('/rag index', { sessionId });
  engine.record('/rag search', { sessionId });
  await sleep(100);
  
  // 阶段 3: 开发工作
  console.log('阶段 3: 开发工作');
  engine.record('/load', { sessionId });
  engine.record('/tools list', { sessionId });
  engine.record('/auto', { sessionId });
  await sleep(100);
  
  // 阶段 4: Git 操作
  console.log('阶段 4: Git 操作');
  engine.record('/git diff', { sessionId });
  engine.record('/review', { sessionId });
  engine.record('/commit', { sessionId });
  await sleep(100);
  
  // 获取每个阶段的推荐
  console.log('\n项目设置阶段推荐:');
  const setupRecs = engine.getRecommendations({ sessionId, lastCommand: '/config init' });
  setupRecs.slice(0, 3).forEach(rec => {
    console.log(`  - ${rec.command}`);
  });
  
  console.log('\n开发工作阶段推荐:');
  const devRecs = engine.getRecommendations({ sessionId, lastCommand: '/rag search' });
  devRecs.slice(0, 3).forEach(rec => {
    console.log(`  - ${rec.command}`);
  });
  
  console.log('\nGit 操作阶段推荐:');
  const gitRecs = engine.getRecommendations({ sessionId, lastCommand: '/git diff' });
  gitRecs.slice(0, 3).forEach(rec => {
    console.log(`  - ${rec.command}`);
  });
  
  // 显示会话统计
  console.log('\n会话常用命令:');
  const topCmds = engine.stats.getSessionTopCommands(sessionId, 10);
  topCmds.forEach(([cmd, count]) => {
    console.log(`  ${count}x ${cmd}`);
  });
}

// =============================================================================
// 示例 8: 个性化配置
// =============================================================================

async function example8_customConfiguration() {
  console.log('\n=== 示例 8: 个性化配置 ===\n');
  
  // 创建自定义配置的引擎
  const engine = new RecommendationEngine({
    maxRecommendations: 3,      // 只推荐 3 个
    minConfidence: 0.5,         // 只显示高置信度的
    sessionWeights: {
      recent: 0.5,              // 最近使用的权重更高
      frequent: 0.3,
      contextual: 0.2
    }
  });
  
  // 记录一些命令
  for (let i = 0; i < 5; i++) {
    engine.record('/help');
  }
  for (let i = 0; i < 3; i++) {
    engine.record('/config');
  }
  engine.record('/rag');
  
  // 获取推荐
  console.log('推荐 (限制 3 个, 最小置信度 50%):');
  const recommendations = engine.getRecommendations();
  
  recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.command}`);
    console.log(`     置信度: ${(rec.confidence * 100).toFixed(0)}%`);
  });
  
  console.log(`\n总推荐数: ${recommendations.length}`);
  console.log(`最大推荐数: ${engine.options.maxRecommendations}`);
  console.log(`最小置信度: ${engine.options.minConfidence}`);
}

// =============================================================================
// 辅助函数
// =============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// 主函数
// =============================================================================

async function main() {
  console.log('========================================');
  console.log('  智能命令推荐系统示例');
  console.log('========================================');
  
  try {
    await example1_basicUsage();
    await example2_sessionAwareRecommendations();
    await example3_contextualRecommendations();
    await example4_commandSearch();
    await example5_timeBasedRecommendations();
    await example6_shortcutFunctions();
    await example7_completeWorkflow();
    await example8_customConfiguration();
    
    console.log('\n========================================');
    console.log('  所有示例运行完成!');
    console.log('========================================\n');
  } catch (error) {
    logger.error('运行失败', { error: error.message });
    console.error('错误:', error);
  }
}

// 运行主函数
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
