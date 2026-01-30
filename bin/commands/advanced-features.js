/**
 * 高级功能命令处理器
 * 包含分支管理、成本追踪、成就系统、安全存储、审计日志、自动修复、统计看板
 */

import {
  createBranchPoint,
  saveBranchMessages,
  loadBranchMessages,
  getBranchInfo,
  listBranches,
  deleteBranch,
  compareBranches,
  mergeBranches,
  exportBranchTree,
  formatBranchTree,
  cleanupOrphanedBranches
} from '../../lib/utils/branch-manager.js';
import { CostTracker, MODEL_PRICES } from '../../lib/utils/cost-tracker.js';
import { AchievementEngine, getAchievementEngine, AchievementRarity, AchievementCategory } from '../../lib/utils/achievement.js';
import { SecureStoreEngine } from '../../lib/utils/secure-store.js';
import { AuditLogEngine } from '../../lib/utils/audit-log.js';
import { AutoFixEngine } from '../../lib/utils/auto-fix.js';
import { StatisticsDashboard, TimeRange } from '../../lib/utils/dashboard.js';

/**
 * 分支管理命令
 * /branch [list|create <name>|switch <name>|merge <name>|delete <name>|tree|diff <name1> <name2>|cleanup]
 */
export async function handleBranch(input, context) {
  const args = input.trim().split(/\s+/);
  const command = args[1] || 'list';

  try {
    switch (command) {
      case 'list': {
        const branches = listBranches();
        if (branches.length === 0) {
          console.log('📋 暂无分支');
        } else {
          console.log('📋 分支列表:');
          for (const branch of branches) {
            const branchShortId = branch.id.length > 20 ? branch.id.substring(0, 17) + '...' : branch.id;
            console.log(`   ${branchShortId} - ${branch.description || '无描述'}`);
            console.log(`     会话ID: ${branch.sessionId}`);
            console.log(`     消息索引: ${branch.messageIndex}`);
            console.log(`     创建时间: ${new Date(branch.createdAt).toLocaleString()}`);
            if (branch.children && branch.children.length > 0) {
              console.log(`     子分支: ${branch.children.length} 个`);
            }
            console.log('');
          }
        }
        break;
      }

      case 'create': {
        const sessionId = context.currentSession?.id || 'default';
        const messageIndex = context.messages ? context.messages.length - 1 : 0;
        const description = args.slice(2).join(' ') || '新分支';
        const branchId = createBranchPoint(sessionId, messageIndex, description);
        if (context.messages) {
          saveBranchMessages(branchId, context.messages);
        }
        const branchShortId = branchId.length > 20 ? branchId.substring(0, 17) + '...' : branchId;
        console.log(`✅ 创建分支: ${branchShortId}`);
        console.log(`   描述: ${description}`);
        break;
      }

      case 'switch': {
        const branchId = args[2];
        if (!branchId) {
          console.log('❌ 请指定要切换的分支ID');
          console.log('用法: /branch switch <branchId>');
          return;
        }
        const messages = loadBranchMessages(branchId);
        if (messages && context.currentSession) {
          context.messages = messages;
          const branchShortId = branchId.length > 20 ? branchId.substring(0, 17) + '...' : branchId;
          console.log(`✅ 切换到分支: ${branchShortId}`);
          console.log(`   当前会话已加载该分支的消息`);
        } else {
          console.log(`❌ 分支不存在: ${branchId}`);
        }
        break;
      }

      case 'merge': {
        const sourceId = args[2];
        const targetId = args[3];
        if (!sourceId || !targetId) {
          console.log('❌ 请指定源分支和目标分支');
          console.log('用法: /branch merge <sourceBranchId> <targetBranchId> [mode]');
          console.log('  mode: replace (替换), append (追加), interactive (交互式)');
          return;
        }
        const mode = args[4] || 'replace';
        const result = mergeBranches(sourceId, targetId, mode);
        if (result && result.mode !== 'interactive') {
          console.log(`✅ 合并分支: ${sourceId} -> ${targetId}`);
          console.log(`   模式: ${result.mode}`);
          console.log(`   合并后消息数: ${result.mergedMessageCount}`);
        } else {
          console.log(`❌ 合并失败`);
        }
        break;
      }

      case 'delete': {
        const branchId = args[2];
        if (!branchId) {
          console.log('❌ 请指定要删除的分支ID');
          console.log('用法: /branch delete <branchId>');
          return;
        }
        deleteBranch(branchId);
        const branchShortId = branchId.length > 20 ? branchId.substring(0, 17) + '...' : branchId;
        console.log(`✅ 删除分支: ${branchShortId}`);
        break;
      }

      case 'tree': {
        const sessionId = context.currentSession?.id || null;
        const roots = exportBranchTree(sessionId);
        if (roots.length === 0) {
          console.log('🌳 暂无分支树');
        } else {
          console.log(formatBranchTree(roots));
        }
        break;
      }

      case 'diff': {
        const branchId1 = args[2];
        const branchId2 = args[3];
        if (!branchId1 || !branchId2) {
          console.log('❌ 请指定两个分支ID');
          console.log('用法: /branch diff <branchId1> <branchId2>');
          return;
        }
        const diff = compareBranches(branchId1, branchId2);
        if (diff) {
          console.log('📊 分支比较:');
          console.log(`   分支1: ${diff.branch1.description} (${diff.branch1.messageCount}条消息)`);
          console.log(`   分支2: ${diff.branch2.description} (${diff.branch2.messageCount}条消息)`);
          console.log(`   分歧点: ${diff.diffIndex}`);
          if (diff.identical) {
            console.log('   状态: 完全相同');
          }
        } else {
          console.log(`❌ 比较失败`);
        }
        break;
      }

      case 'cleanup': {
        const result = cleanupOrphanedBranches();
        if (result.cleaned === 0) {
          console.log('✅ 没有发现孤立分支');
        } else {
          console.log(`✅ 清理了 ${result.cleaned} 个孤立分支`);
        }
        break;
      }

      default:
        console.log('📋 分支管理命令:');
        console.log('  /branch list                  - 列出所有分支');
        console.log('  /branch create <desc>         - 创建新分支');
        console.log('  /branch switch <id>          - 切换到指定分支');
        console.log('  /branch merge <src> <dst>     - 合并分支');
        console.log('  /branch delete <id>           - 删除指定分支');
        console.log('  /branch tree                 - 显示分支树结构');
        console.log('  /branch diff <id1> <id2>     - 对比分支差异');
        console.log('  /branch cleanup              - 清理孤立分支');
    }
  } catch (error) {
    console.error('❌ 分支管理错误:', error.message);
  }
}

/**
 * 成本追踪命令
 * /cost [summary|today|week|month|clear|models]
 */
export async function handleCost(input) {
  const args = input.trim().split(/\s+/);
  const command = args[1] || 'summary';

  try {
    const tracker = new CostTracker();

    switch (command) {
      case 'summary': {
        const summary = tracker.getSummary();
        console.log('💰 API 成本统计:');
        console.log(`   总成本: $${summary.totalCost.toFixed(6)}`);
        console.log(`   总 Token: ${summary.totalTokens.toLocaleString()}`);
        console.log(`   总请求数: ${summary.totalRequests}`);
        console.log(`   会话数: ${summary.sessionCount}`);
        if (summary.topModels && summary.topModels.length > 0) {
          console.log(`   热门模型:`);
          for (const model of summary.topModels.slice(0, 3)) {
            console.log(`     - ${model.model}: ${model.requests} 次`);
          }
        }
        break;
      }

      case 'today': {
        const today = tracker.getByDate(new Date());
        console.log('📅 今日成本:');
        console.log(`   成本: $${today.cost.toFixed(6)}`);
        console.log(`   Token: ${today.tokens.toLocaleString()}`);
        console.log(`   请求: ${today.requests}`);
        break;
      }

      case 'week': {
        const week = tracker.getByDateRange(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date()
        );
        console.log('📅 本周成本:');
        console.log(`   成本: $${week.cost.toFixed(6)}`);
        console.log(`   Token: ${week.tokens.toLocaleString()}`);
        console.log(`   请求: ${week.requests}`);
        break;
      }

      case 'month': {
        const month = tracker.getByDateRange(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        );
        console.log('📅 本月成本:');
        console.log(`   成本: $${month.cost.toFixed(6)}`);
        console.log(`   Token: ${month.tokens.toLocaleString()}`);
        console.log(`   请求: ${month.requests}`);
        break;
      }

      case 'models': {
        const byModel = tracker.getByModel();
        console.log('🤖 按模型统计:');
        for (const [model, data] of Object.entries(byModel)) {
          console.log(`   ${model}:`);
          console.log(`     成本: $${data.cost.toFixed(6)}`);
          console.log(`     Token: ${data.tokens.toLocaleString()}`);
          console.log(`     请求: ${data.requests}`);
        }
        break;
      }

      case 'clear': {
        tracker.clear();
        console.log('✅ 成本统计数据已清除');
        break;
      }

      default:
        console.log('💰 成本追踪命令:');
        console.log('  /cost summary    - 总体成本统计');
        console.log('  /cost today      - 今日成本');
        console.log('  /cost week       - 本周成本');
        console.log('  /cost month      - 本月成本');
        console.log('  /cost models     - 按模型统计');
        console.log('  /cost clear      - 清除统计数据');
    }
  } catch (error) {
    console.error('❌ 成本追踪错误:', error.message);
  }
}

/**
 * 成就系统命令
 * /achievement [list|show <id>|unlock <id>|progress|reset]
 */
export async function handleAchievement(input) {
  const args = input.trim().split(/\s+/);
  const command = args[1] || 'list';

  try {
    const engine = getAchievementEngine(false);

    switch (command) {
      case 'list': {
        const achievements = engine.listAchievements();
        const unlocked = achievements.filter(a => a.unlocked);
        console.log(`🏆 成就系统 (${unlocked.length}/${achievements.length}):`);
        console.log(`   总积分: ${engine.getTotalPoints()}`);
        console.log('');
        for (const achievement of achievements) {
          const status = achievement.unlocked ? '✅' : '🔒';
          const icon = achievement.icon || '🏆';
          console.log(`${status} ${icon} ${achievement.name}`);
          if (achievement.unlocked) {
            console.log(`     ${achievement.description}`);
          } else {
            console.log(`     ${achievement.description || '???'} (未解锁)`);
          }
        }
        break;
      }

      case 'show': {
        const id = args[2];
        if (!id) {
          console.log('❌ 请指定成就ID');
          console.log('用法: /achievement show <id>');
          return;
        }
        const achievement = engine.getAchievement(id);
        if (achievement) {
          console.log(`🏆 ${achievement.name}`);
          console.log(`   描述: ${achievement.description}`);
          console.log(`   类别: ${achievement.category}`);
          console.log(`   稀有度: ${achievement.rarity}`);
          console.log(`   积分: ${achievement.points}`);
          console.log(`   状态: ${achievement.unlocked ? '已解锁' : '未解锁'}`);
          if (achievement.unlocked) {
            console.log(`   解锁时间: ${new Date(achievement.unlockedAt).toLocaleString()}`);
          }
          if (achievement.progress) {
            console.log(`   进度: ${achievement.progress.current}/${achievement.progress.target}`);
          }
        } else {
          console.log(`❌ 成就不存在: ${id}`);
        }
        break;
      }

      case 'unlock': {
        const id = args[2];
        if (!id) {
          console.log('❌ 请指定成就ID');
          console.log('用法: /achievement unlock <id>');
          return;
        }
        const result = engine.unlock(id);
        if (result) {
          console.log(`🎉 解锁成就: ${result.name}! (+${result.points}分)`);
        } else {
          console.log(`❌ 解锁失败: ${id}`);
        }
        break;
      }

      case 'progress': {
        const stats = engine.getStats();
        console.log('📊 成就统计:');
        console.log(`   总成就数: ${stats.total}`);
        console.log(`   已解锁: ${stats.unlocked}`);
        console.log(`   解锁率: ${((stats.unlocked / stats.total) * 100).toFixed(1)}%`);
        console.log(`   总积分: ${stats.points}`);
        console.log(`   最新解锁: ${stats.lastUnlocked ? new Date(stats.lastUnlocked).toLocaleString() : '无'}`);
        break;
      }

      case 'reset': {
        const confirmed = args[2] === 'confirm';
        if (!confirmed) {
          console.log('⚠️  重置将清除所有成就数据');
          console.log('用法: /achievement reset confirm');
          return;
        }
        engine.reset();
        console.log('✅ 成就数据已重置');
        break;
      }

      default:
        console.log('🏆 成就系统命令:');
        console.log('  /achievement list           - 列出所有成就');
        console.log('  /achievement show <id>       - 显示成就详情');
        console.log('  /achievement unlock <id>     - 解锁成就 (测试用)');
        console.log('  /achievement progress        - 显示成就统计');
        console.log('  /achievement reset           - 重置成就数据');
    }
  } catch (error) {
    console.error('❌ 成就系统错误:', error.message);
  }
}

/**
 * 安全存储命令
 * /secure-store [list|get <key>|set <key>|delete <key>|export|import]
 */
export async function handleSecureStore(input, context) {
  const args = input.trim().split(/\s+/);
  const command = args[1] || 'list';

  try {
    const secureStore = new SecureStoreEngine();

    switch (command) {
      case 'list': {
        const keys = secureStore.listKeys();
        if (keys.length === 0) {
          console.log('🔐 安全存储为空');
        } else {
          console.log(`🔐 安全存储 (${keys.length}项):`);
          for (const key of keys) {
            console.log(`   - ${key}`);
          }
        }
        break;
      }

      case 'get': {
        const key = args[2];
        if (!key) {
          console.log('❌ 请指定密钥名称');
          console.log('用法: /secure-store get <key>');
          return;
        }
        const value = secureStore.get(key);
        if (value !== null) {
          console.log(`🔑 ${key}: ${value}`);
        } else {
          console.log(`❌ 密钥不存在: ${key}`);
        }
        break;
      }

      case 'set': {
        const key = args[2];
        const value = args.slice(3).join(' ');
        if (!key || !value) {
          console.log('❌ 请指定密钥和值');
          console.log('用法: /secure-store set <key> <value>');
          return;
        }
        const success = secureStore.set(key, value);
        if (success) {
          console.log(`✅ 已保存: ${key}`);
        } else {
          console.log(`❌ 保存失败: ${key}`);
        }
        break;
      }

      case 'delete': {
        const key = args[2];
        if (!key) {
          console.log('❌ 请指定密钥名称');
          console.log('用法: /secure-store delete <key>');
          return;
        }
        const success = secureStore.delete(key);
        if (success) {
          console.log(`✅ 已删除: ${key}`);
        } else {
          console.log(`❌ 删除失败: ${key}`);
        }
        break;
      }

      case 'export': {
        const exported = secureStore.export();
        console.log('📤 导出数据 (JSON):');
        console.log(JSON.stringify(exported, null, 2));
        break;
      }

      case 'import': {
        const data = args.slice(2).join(' ');
        if (!data) {
          console.log('❌ 请提供导入数据');
          console.log('用法: /secure-store import <json>');
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const success = secureStore.import(parsed);
          if (success) {
            console.log('✅ 导入成功');
          } else {
            console.log('❌ 导入失败');
          }
        } catch (e) {
          console.log('❌ 无效的 JSON 数据');
        }
        break;
      }

      default:
        console.log('🔐 安全存储命令:');
        console.log('  /secure-store list           - 列出所有密钥');
        console.log('  /secure-store get <key>       - 获取密钥值');
        console.log('  /secure-store set <key> <value> - 保存密钥');
        console.log('  /secure-store delete <key>    - 删除密钥');
        console.log('  /secure-store export         - 导出数据');
        console.log('  /secure-store import <json>   - 导入数据');
    }
  } catch (error) {
    console.error('❌ 安全存储错误:', error.message);
  }
}

/**
 * 审计日志命令
 * /audit-log [list|search <keyword>|stats|export|clear]
 */
export async function handleAuditLog(input) {
  const args = input.trim().split(/\s+/);
  const command = args[1] || 'list';

  try {
    const auditLog = new AuditLogEngine();

    switch (command) {
      case 'list': {
        const limit = parseInt(args[2]) || 20;
        const logs = auditLog.query({ limit });
        console.log(`📋 审计日志 (最近 ${limit} 条):`);
        for (const log of logs) {
          const time = new Date(log.timestamp).toLocaleString();
          const icon = log.success ? '✅' : '❌';
          console.log(`${icon} [${time}] ${log.operationType} - ${log.message}`);
        }
        break;
      }

      case 'search': {
        const keyword = args.slice(2).join(' ');
        if (!keyword) {
          console.log('❌ 请指定搜索关键词');
          console.log('用法: /audit-log search <keyword>');
          return;
        }
        const logs = auditLog.query({ keyword });
        console.log(`🔍 搜索结果 (${logs.length} 条):`);
        for (const log of logs) {
          const time = new Date(log.timestamp).toLocaleString();
          console.log(`[${time}] ${log.operationType} - ${log.message}`);
        }
        break;
      }

      case 'stats': {
        const stats = auditLog.getStats();
        console.log('📊 审计日志统计:');
        console.log(`   总日志数: ${stats.totalLogs}`);
        console.log(`   成功: ${stats.successCount}`);
        console.log(`   失败: ${stats.failureCount}`);
        console.log(`   按级别:`);
        for (const [level, count] of Object.entries(stats.byLevel)) {
          console.log(`     ${level}: ${count}`);
        }
        console.log(`   按操作类型:`);
        for (const [type, count] of Object.entries(stats.byOperation).slice(0, 5)) {
          console.log(`     ${type}: ${count}`);
        }
        break;
      }

      case 'export': {
        const logs = auditLog.query({});
        const exportData = {
          exportTime: new Date().toISOString(),
          totalLogs: logs.length,
          logs: logs
        };
        console.log('📤 导出审计日志 (JSON):');
        console.log(JSON.stringify(exportData, null, 2));
        break;
      }

      case 'clear': {
        const confirmed = args[2] === 'confirm';
        if (!confirmed) {
          console.log('⚠️  清除将删除所有审计日志');
          console.log('用法: /audit-log clear confirm');
          return;
        }
        auditLog.clear();
        console.log('✅ 审计日志已清除');
        break;
      }

      default:
        console.log('📋 审计日志命令:');
        console.log('  /audit-log list [limit]     - 列出日志');
        console.log('  /audit-log search <keyword>  - 搜索日志');
        console.log('  /audit-log stats             - 统计信息');
        console.log('  /audit-log export            - 导出日志');
        console.log('  /audit-log clear             - 清除日志');
    }
  } catch (error) {
    console.error('❌ 审计日志错误:', error.message);
  }
}

/**
 * 自动修复命令
 * /auto-fix [check|fix <type>|list-rules]
 */
export async function handleAutoFix(input, context) {
  const args = input.trim().split(/\s+/);
  const command = args[1] || 'check';

  try {
    const autoFix = new AutoFixEngine();

    switch (command) {
      case 'check': {
        const issues = [];
        // 检查 messages 中的错误
        if (context.messages && context.messages.length > 0) {
          for (const msg of context.messages) {
            if (msg.role === 'assistant' && msg.content) {
              const detected = autoFix.detect(new Error(msg.content), { fromAI: true });
              issues.push(...detected);
            }
          }
        }

        if (issues.length === 0) {
          console.log('✅ 未检测到问题');
        } else {
          console.log(`⚠️  检测到 ${issues.length} 个问题:`);
          for (const issue of issues) {
            console.log(`   - ${issue.title}: ${issue.description}`);
            console.log(`     修复建议: ${issue.suggestion}`);
          }
        }
        break;
      }

      case 'fix': {
        const type = args[2];
        if (!type) {
          console.log('❌ 请指定修复类型');
          console.log('用法: /auto-fix fix <type>');
          return;
        }
        const fixed = autoFix.fixType(type, context);
        if (fixed) {
          console.log(`✅ 已修复: ${type}`);
        } else {
          console.log(`❌ 修复失败: ${type}`);
        }
        break;
      }

      case 'list-rules': {
        const rules = autoFix.listRules();
        console.log('📋 可用修复规则:');
        for (const rule of rules) {
          console.log(`   - ${rule.name}: ${rule.description}`);
          console.log(`     优先级: ${rule.priority}`);
        }
        break;
      }

      default:
        console.log('🔧 自动修复命令:');
        console.log('  /auto-fix check          - 检测问题');
        console.log('  /auto-fix fix <type>    - 修复指定类型问题');
        console.log('  /auto-fix list-rules     - 列出修复规则');
    }
  } catch (error) {
    console.error('❌ 自动修复错误:', error.message);
  }
}

/**
 * 统计看板命令
 * /dashboard [messages|commands|sessions|achievements|usage]
 */
export async function handleDashboard(input) {
  const args = input.trim().split(/\s+/);
  const command = args[1] || 'messages';
  const timeRange = args[2] || 'all';

  try {
    const dashboard = new StatisticsDashboard();

    switch (command) {
      case 'messages': {
        const stats = dashboard.getMessageStats(timeRange);
        console.log('💬 消息统计:');
        console.log(`   总数: ${stats.total}`);
        console.log(`   用户消息: ${stats.userMessages}`);
        console.log(`   助手消息: ${stats.assistantMessages}`);
        console.log(`   平均长度: ${stats.avgLength.toFixed(0)} 字符`);
        break;
      }

      case 'commands': {
        const stats = dashboard.getCommandStats(timeRange);
        console.log('⌨️  命令统计:');
        console.log(`   总执行: ${stats.total}`);
        console.log(`   最常用命令:`);
        for (const [cmd, count] of Object.entries(stats.topCommands).slice(0, 5)) {
          console.log(`     ${cmd}: ${count} 次`);
        }
        break;
      }

      case 'sessions': {
        const stats = dashboard.getSessionStats(timeRange);
        console.log('📁 会话统计:');
        console.log(`   总会话: ${stats.total}`);
        console.log(`   活跃会话: ${stats.active}`);
        console.log(`   平均消息数: ${stats.avgMessages.toFixed(1)}`);
        break;
      }

      case 'achievements': {
        const stats = dashboard.getAchievementStats();
        console.log('🏆 成就统计:');
        console.log(`   总成就: ${stats.total}`);
        console.log(`   已解锁: ${stats.unlocked}`);
        console.log(`   解锁率: ${((stats.unlocked / stats.total) * 100).toFixed(1)}%`);
        console.log(`   总积分: ${stats.totalPoints}`);
        break;
      }

      case 'usage': {
        const stats = dashboard.getUsageStats(timeRange);
        console.log('📊 使用统计:');
        console.log(`   活动天数: ${stats.activeDays}`);
        console.log(`   活跃时段:`);
        for (const [hour, count] of Object.entries(stats.peakHours).slice(0, 3)) {
          console.log(`     ${hour}:00 - ${count} 次`);
        }
        break;
      }

      default:
        console.log('📊 统计看板命令:');
        console.log('  /dashboard messages [range]  - 消息统计');
        console.log('  /dashboard commands [range]  - 命令统计');
        console.log('  /dashboard sessions [range]  - 会话统计');
        console.log('  /dashboard achievements      - 成就统计');
        console.log('  /dashboard usage [range]     - 使用统计');
        console.log('');
        console.log('  时间范围: today, week, month, all');
    }
  } catch (error) {
    console.error('❌ 统计看板错误:', error.message);
  }
}
