/**
 * 上下文感知帮助系统使用示例
 *
 * 展示如何使用上下文感知帮助系统根据用户状态提供智能帮助
 */

import {
  ContextualHelpEngine,
  ContextType,
  updateContext,
  getContextualHelp,
  printContextualHelp,
  getQuickHelp
} from '../lib/utils/contextual-help.js';

// 示例 1: 基础使用
console.log('\n=== 示例 1: 基础使用 ===\n');

const engine = new ContextualHelpEngine();

// 获取上下文帮助
const help1 = engine.getContextualHelp();
console.log('上下文帮助结果:');
console.log(JSON.stringify(help1, null, 2));

// 示例 2: 新用户场景
console.log('\n=== 示例 2: 新用户场景 ===\n');

const newUserEngine = new ContextualHelpEngine();

// 新用户首次使用
newUserEngine.updateContext({
  messageCount: 0
});

const newHelp = newUserEngine.getContextualHelp();
console.log('新用户帮助:');
console.log(newHelp.helps[0].title);
console.log(newHelp.helps[0].description);
console.log('\n建议:');
newHelp.helps[0].suggestions.forEach((s, idx) => {
  console.log(`  ${idx + 1}. ${s.action}: ${s.command}`);
});

// 示例 3: 错误恢复
console.log('\n=== 示例 3: 错误恢复 ===\n');

const errorEngine = new ContextualHelpEngine();

// 发生错误
const error = new Error('API Key is missing');
error.code = 'API_KEY_MISSING';

errorEngine.updateContext({
  error: error
});

const errorHelp = errorEngine.getContextualHelp();
console.log('错误恢复帮助:');
console.log(errorHelp.helps[0].title);
console.log(errorHelp.helps[0].description);
console.log('\n修复建议:');
errorHelp.helps[0].suggestions.slice(0, 3).forEach((s, idx) => {
  console.log(`  ${idx + 1}. ${s.action}`);
  console.log(`     ${s.description}`);
  if (s.command) {
    console.log(`     命令: ${s.command}`);
  }
});

// 示例 4: 配置帮助
console.log('\n=== 示例 4: 配置帮助 ===\n');

const configEngine = new ContextualHelpEngine();

// 用户正在配置
configEngine.updateContext({
  command: '/config show',
  contextType: ContextType.CONFIG
});

const configHelp = configEngine.getContextualHelp();
console.log('配置帮助:');
console.log(configHelp.helps[0].title);
console.log(configHelp.helps[0].description);
console.log('\n建议:');
configHelp.helps[0].suggestions.forEach((s, idx) => {
  console.log(`  ${idx + 1}. ${s.action}: ${s.command}`);
});

// 示例 5: 会话管理帮助
console.log('\n=== 示例 5: 会话管理帮助 ===\n');

const sessionEngine = new ContextualHelpEngine();

// 用户正在管理会话
sessionEngine.updateContext({
  command: '/session list',
  contextType: ContextType.SESSION
});

const sessionHelp = sessionEngine.getContextualHelp();
console.log('会话帮助:');
console.log(sessionHelp.helps[0].title);
console.log(sessionHelp.helps[0].description);
console.log('\n子命令:');
Object.entries(sessionHelp.helps[0].subcommands).forEach(([name, desc]) => {
  console.log(`  ${desc}`);
});

// 示例 6: 分支操作帮助
console.log('\n=== 示例 6: 分支操作帮助 ===\n');

const branchEngine = new ContextualHelpEngine();

// 用户正在使用分支功能
branchEngine.updateContext({
  command: '/branch create',
  contextType: ContextType.BRANCH
});

const branchHelp = branchEngine.getContextualHelp();
console.log('分支帮助:');
console.log(branchHelp.helps[0].title);
console.log(branchHelp.helps[0].description);
console.log('\n提示:');
branchHelp.helps[0].tips.forEach(tip => {
  console.log(`  ${tip}`);
});

// 示例 7: RAG 搜索帮助
console.log('\n=== 示例 7: RAG 搜索帮助 ===\n');

const ragEngine = new ContextualHelpEngine();

// 用户正在使用 RAG 功能
ragEngine.updateContext({
  command: '/search API',
  contextType: ContextType.RAG
});

const ragHelp = ragEngine.getContextualHelp();
console.log('RAG 帮助:');
console.log(ragHelp.helps[0].title);
console.log(ragHelp.helps[0].description);
console.log('\n建议:');
ragHelp.helps[0].suggestions.forEach((s, idx) => {
  console.log(`  ${idx + 1}. ${s.action}: ${s.command}`);
  console.log(`     ${s.description}`);
});

// 示例 8: Git 操作帮助
console.log('\n=== 示例 8: Git 操作帮助 ===\n');

const gitEngine = new ContextualHelpEngine();

// 用户正在使用 Git 功能
gitEngine.updateContext({
  command: '/commit',
  contextType: ContextType.GIT
});

const gitHelp = gitEngine.getContextualHelp();
console.log('Git 帮助:');
console.log(gitHelp.helps[0].title);
console.log(gitHelp.helps[0].description);
console.log('\n提示:');
gitHelp.helps[0].tips.forEach(tip => {
  console.log(`  ${tip}`);
});

// 示例 9: 使用快捷函数
console.log('\n=== 示例 9: 使用快捷函数 ===\n');

// 使用全局快捷函数
updateContext({
  command: '/session new',
  contextType: ContextType.SESSION
});

const globalHelp = getContextualHelp();
console.log('全局快捷函数结果:');
console.log(`上下文类型: ${globalHelp.context.contextType}`);
console.log(`用户等级: ${globalHelp.context.userLevel}`);
console.log(`帮助项数: ${globalHelp.helps.length}`);

// 获取简短帮助
const quickHelp = getQuickHelp();
console.log('\n简短帮助:');
console.log(quickHelp);

// 示例 10: 用户成长追踪
console.log('\n=== 示例 10: 用户成长追踪 ===\n');

const growthEngine = new ContextualHelpEngine();

// 新用户
console.log('阶段 1: 新用户');
growthEngine.updateContext({ messageCount: 0 });
let help = growthEngine.getContextualHelp();
console.log(`用户等级: ${help.context.userLevel}`);
console.log(`主要帮助: ${help.helps[0].title}`);

// 初级用户
console.log('\n阶段 2: 初级用户');
for (let i = 0; i < 15; i++) {
  growthEngine.updateContext({ command: `/command${i}` });
}
help = growthEngine.getContextualHelp();
console.log(`用户等级: ${help.context.userLevel}`);
console.log(`命令数: ${help.context.recentCommands.length}`);

// 中级用户
console.log('\n阶段 3: 中级用户');
for (let i = 15; i < 35; i++) {
  growthEngine.updateContext({ command: `/command${i}` });
}
help = growthEngine.getContextualHelp();
console.log(`用户等级: ${help.context.userLevel}`);

// 高级用户
console.log('\n阶段 4: 高级用户');
for (let i = 35; i < 60; i++) {
  growthEngine.updateContext({ command: `/command${i}` });
}
help = growthEngine.getContextualHelp();
console.log(`用户等级: ${help.context.userLevel}`);
console.log(`有高级功能建议: ${help.helps.some(h => h.type === 'advanced')}`);

// 示例 11: 上下文自动检测
console.log('\n=== 示例 11: 上下文自动检测 ===\n');

const autoEngine = new ContextualHelpEngine();

const commands = [
  '/session list',
  '/config show',
  '/branch create test',
  '/index ./src',
  '/commit',
  '/load README.md',
  '/help'
];

commands.forEach(cmd => {
  autoEngine.updateContext({ command: cmd });
  const contextType = autoEngine.context.contextType;
  const userLevel = autoEngine.context.userLevel;
  console.log(`命令: ${cmd.padEnd(20)} -> 上下文: ${contextType}, 等级: ${userLevel}`);
});

// 示例 12: 格式化输出
console.log('\n=== 示例 12: 格式化输出 ===\n');

const formatEngine = new ContextualHelpEngine();

formatEngine.updateContext({
  command: '/branch list',
  contextType: ContextType.BRANCH
});

const formattedHelp = formatEngine.getContextualHelp();
const output = formatEngine.formatHelpOutput(formattedHelp);

console.log('格式化的帮助输出:\n');
console.log(output);

// 示例 13: JSON 输出
console.log('\n=== 示例 13: JSON 输出 ===\n');

const jsonEngine = new ContextualHelpEngine();

jsonEngine.updateContext({
  command: '/session list',
  contextType: ContextType.SESSION
});

const jsonOutput = jsonEngine.toJSON();
console.log('JSON 格式的帮助:');
console.log(jsonOutput.substring(0, 500) + '...');

// 示例 14: 自定义配置
console.log('\n=== 示例 14: 自定义配置 ===\n');

const customEngine = new ContextualHelpEngine({
  maxSuggestions: 3,
  enableRecommendations: false,
  enableAutoFix: true
});

console.log('自定义配置:');
console.log(`  最大建议数: ${customEngine.options.maxSuggestions}`);
console.log(`  启用推荐: ${customEngine.options.enableRecommendations}`);
console.log(`  启用自动修复: ${customEngine.options.enableAutoFix}`);

customEngine.updateContext({
  command: '/config show',
  contextType: ContextType.CONFIG
});

const customHelp = customEngine.getContextualHelp();
console.log(`\n帮助项数: ${customHelp.helps.length}`);
console.log(`推荐数: ${customHelp.recommendations.length}`);

// 示例 15: 实际应用场景
console.log('\n=== 示例 15: 实际应用场景 ===\n');

class ChatApplication {
  constructor() {
    this.helpEngine = new ContextualHelpEngine({
      enableRecommendations: true,
      enableAutoFix: true
    });
  }

  async handleCommand(command) {
    try {
      // 更新上下文
      this.helpEngine.updateContext({ command });

      // 执行命令逻辑...
      console.log(`执行命令: ${command}`);

      // 增加消息计数
      const currentCount = this.helpEngine.context.messageCount;
      this.helpEngine.updateContext({ messageCount: currentCount + 1 });

    } catch (error) {
      // 记录错误
      this.helpEngine.updateContext({ error });

      // 显示错误修复建议
      this.showHelp();
    }
  }

  showHelp() {
    const help = this.helpEngine.getContextualHelp();
    const output = this.helpEngine.formatHelpOutput(help);
    console.log('\n' + output);
  }

  showQuickHelp() {
    const quickHelp = this.helpEngine.getQuickHelp();
    console.log('\n' + quickHelp);
  }
}

// 使用示例
const app = new ChatApplication();

console.log('场景 1: 新用户首次使用');
app.handleCommand('/help');

console.log('\n场景 2: 用户执行多个命令');
app.handleCommand('/config show');
app.handleCommand('/session list');
app.handleCommand('/branch create test');

console.log('\n场景 3: 发生错误');
try {
  throw new Error('Connection failed');
} catch (error) {
  app.handleCommand('模拟错误命令');
}

// 示例 16: 功能检测
console.log('\n=== 示例 16: 功能检测 ===\n');

const featureEngine = new ContextualHelpEngine();

// 用户使用了各种功能
const featureCommands = [
  '/index ./src',      // RAG
  '/commit',           // Git
  '/session list',      // Session
  '/branch create',    // Branch
  '/config show',      // Config
  '/tools list',       // Tools
];

featureCommands.forEach(cmd => {
  featureEngine.updateContext({ command: cmd });
});

const configuredFeatures = featureEngine.context.configuredFeatures;
console.log('检测到的已配置功能:');
configuredFeatures.forEach(feature => {
  console.log(`  ✅ ${feature}`);
});

// 获取基于配置功能的建议
featureEngine.updateContext({ messageCount: 10 });
const featureHelp = featureEngine.getContextualHelp();
console.log('\n基于配置功能的建议:');
featureHelp.helps.forEach(h => {
  if (h.suggestions) {
    h.suggestions.slice(0, 2).forEach(s => {
      console.log(`  • ${s.action}: ${s.command}`);
    });
  }
});

console.log('\n=== 所有示例完成 ===\n');
console.log('上下文感知帮助系统可以:');
console.log('✅ 根据用户状态提供个性化帮助');
console.log('✅ 自动检测上下文类型');
console.log('✅ 追踪用户成长和等级');
console.log('✅ 检测已配置的功能');
console.log('✅ 提供错误修复建议');
console.log('✅ 集成智能命令推荐');
console.log('✅ 支持多种输出格式');
console.log('✅ 可扩展的规则系统');
console.log('✅ 简短和详细两种帮助模式');
