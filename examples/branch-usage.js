/**
 * 分支系统使用示例
 * 
 * 本文件展示如何在主程序中集成和使用分支系统
 */

import {
  createBranchPoint,
  saveBranchMessages,
  loadBranchMessages,
  deleteBranch,
  compareBranches,
  mergeBranches
} from './lib/utils/branch-manager.js';

// ===================== 示例 1: 创建分支 =====================

/**
 * 用户想要探索不同的实现方案时，可以创建分支
 */
async function createBranchExample(sessionId, messages) {
  // 假设当前消息数为 10，用户想从第 5 条消息后创建分支探索
  const branchPointIndex = 5;
  const description = '尝试使用 TypeScript 重构';
  
  // 创建分支
  const branchId = createBranchPoint(sessionId, branchPointIndex, description);
  
  // 保存当前消息到分支
  saveBranchMessages(branchId, messages.slice(0, branchPointIndex + 1));
  
  console.log(`✅ 分支已创建: ${branchId}`);
  console.log(`描述: ${description}`);
  
  // 现在可以在这个分支上继续对话
  return branchId;
}

// ===================== 示例 2: 切换分支 =====================

/**
 * 切换到不同的分支继续对话
 */
async function switchBranchExample(branchId) {
  // 加载分支消息
  const branchMessages = loadBranchMessages(branchId);
  
  // 用这些消息替换当前会话的消息
  currentSession.messages = branchMessages;
  currentSession.branchId = branchId;
  
  console.log(`✅ 已切换到分支: ${branchId}`);
  console.log(`当前消息数: ${branchMessages.length}`);
  
  // 继续对话...
}

// ===================== 示例 3: 比较分支 =====================

/**
 * 比较两个不同分支的差异
 */
async function compareBranchesExample(branchId1, branchId2) {
  const comparison = compareBranches(branchId1, branchId2);
  
  if (comparison.identical) {
    console.log('✅ 两个分支完全相同');
  } else {
    console.log(`⚠️  从第 ${comparison.diffIndex + 1} 条消息开始不同`);
    console.log(`分支 1 的不同消息数: ${comparison.messages1Diff.length}`);
    console.log(`分支 2 的不同消息数: ${comparison.messages2Diff.length}`);
    
    // 显示差异详情
    if (comparison.messages1Diff.length > 0) {
      console.log('\n分支 1 的消息:');
      comparison.messages1Diff.forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
      });
    }
  }
}

// ===================== 示例 4: 合并分支 =====================

/**
 * 合并实验分支回主分支
 */
async function mergeBranchesExample(experimentBranchId, mainBranchId) {
  // 使用 append 模式合并
  const result = mergeBranches(experimentBranchId, mainBranchId, 'append');
  
  console.log(`✅ 合并完成`);
  console.log(`源分支: ${experimentBranchId}`);
  console.log(`目标分支: ${mainBranchId}`);
  console.log(`合并后消息数: ${result.mergedMessageCount}`);
  
  // 现在主分支包含了实验分支的新消息
}

// ===================== 示例 5: 在 CLI 中集成 =====================

/**
 * 在 CLI 主程序中集成分支系统
 * 
 * 以下是如何在 bin/cli.js 中集成分支功能的示例
 */
class SessionWithBranches {
  constructor(sessionId, rl) {
    this.sessionId = sessionId;
    this.rl = rl;
    this.messages = [];
    this.branchId = null;
    this.currentBranchPoint = -1;
  }

  /**
   * 从当前消息创建分支
   */
  createBranch(description) {
    if (this.messages.length === 0) {
      throw new Error('当前会话没有消息，无法创建分支');
    }

    const branchId = createBranchPoint(
      this.sessionId,
      this.messages.length - 1,
      description
    );
    
    saveBranchMessages(branchId, [...this.messages]);
    
    this.branchId = branchId;
    this.currentBranchPoint = this.messages.length - 1;
    
    return branchId;
  }

  /**
   * 切换到指定分支
   */
  async switchToBranch(branchId) {
    const branchMessages = loadBranchMessages(branchId);
    
    this.messages = branchMessages;
    this.branchId = branchId;
    this.currentBranchPoint = branchMessages.length - 1;
    
    console.log(`✅ 已切换到分支: ${branchId}`);
    console.log(`当前消息数: ${this.messages.length}`);
    
    // 显示最近的消息
    const recentMessages = this.messages.slice(-3);
    console.log('\n最近的消息:');
    recentMessages.forEach(msg => {
      const preview = msg.content.substring(0, 50).replace(/\n/g, ' ');
      console.log(`  [${msg.role}] ${preview}...`);
    });
  }

  /**
   * 保存当前会话到分支
   */
  saveToBranch() {
    if (!this.branchId) {
      throw new Error('当前不在分支中');
    }
    
    saveBranchMessages(this.branchId, [...this.messages]);
    console.log(`✅ 已保存到分支: ${this.branchId}`);
  }

  /**
   * 比较两个分支
   */
  compareWith(otherBranchId) {
    if (!this.branchId) {
      throw new Error('当前不在分支中');
    }
    
    return compareBranches(this.branchId, otherBranchId);
  }

  /**
   * 合并另一个分支到当前分支
   */
  mergeFrom(otherBranchId) {
    if (!this.branchId) {
      throw new Error('当前不在分支中');
    }
    
    const result = mergeBranches(otherBranchId, this.branchId, 'append');
    
    // 重新加载合并后的消息
    this.messages = loadBranchMessages(this.branchId);
    this.currentBranchPoint = this.messages.length - 1;
    
    console.log(`✅ 合并完成，当前消息数: ${this.messages.length}`);
    
    return result;
  }
}

// ===================== 示例 6: 分支工作流 =====================

/**
 * 完整的分支工作流示例
 */
async function branchWorkflowExample() {
  const session = new SessionWithBranches('main-session', rl);
  
  // 1. 正常对话...
  session.messages.push({ role: 'user', content: '帮我实现一个用户登录功能' });
  session.messages.push({ role: 'assistant', content: '好的，我来帮你实现...' });
  session.messages.push({ role: 'user', content: '使用 JWT token 认证' });
  
  console.log('\n📍 状态: 主分支，消息数:', session.messages.length);
  
  // 2. 创建实验分支 A - 尝试不同的认证方式
  const branchA = session.createBranch('实验 A: 使用 OAuth 2.0');
  console.log('\n🌿 创建分支 A:', branchA);
  
  // 在分支 A 中继续对话
  session.messages.push({ role: 'user', content: '实现 OAuth 2.0 认证' });
  session.messages.push({ role: 'assistant', content: '好的，OAuth 2.0 流程如下...' });
  session.saveToBranch();
  console.log('\n📍 状态: 分支 A，消息数:', session.messages.length);
  
  // 3. 创建实验分支 B - 从主分支创建另一个探索
  const mainSession = new SessionWithBranches('main-session', rl);
  mainSession.messages = session.messages.slice(0, 3); // 回到主分支状态
  
  const branchB = mainSession.createBranch('实验 B: 使用 Session Cookie');
  console.log('\n🌿 创建分支 B:', branchB);
  
  // 在分支 B 中继续对话
  mainSession.messages.push({ role: 'user', content: '实现 Session Cookie 认证' });
  mainSession.messages.push({ role: 'assistant', content: '好的，Session Cookie 方案...' });
  mainSession.saveToBranch();
  console.log('\n📍 状态: 分支 B，消息数:', mainSession.messages.length);
  
  // 4. 比较两个分支
  console.log('\n🔍 比较分支 A 和 B:');
  const comparison = compareBranches(branchA, branchB);
  console.log(`从第 ${comparison.diffIndex + 1} 条消息开始不同`);
  console.log(`分支 A 消息数: ${comparison.branch1.messageCount}`);
  console.log(`分支 B 消息数: ${comparison.branch2.messageCount}`);
  
  // 5. 切换回分支 A
  await session.switchToBranch(branchA);
  console.log('\n📍 状态: 切换回分支 A');
  
  // 6. 删除不需要的分支
  // deleteBranch(branchB);
  // console.log('\n🗑️  删除分支 B');
}

// ===================== 集成到 CLI 的建议 =====================

/**
 * 在 bin/cli.js 中添加分支命令处理
 */
/*
// 在 handleSlashCommand 函数中添加：

case '/branch':
  const branchResult = await handleBranchCommand(args.slice(1), currentSessionId, messages);
  console.log(branchResult);
  break;

case '/branch-create':
  const branchDesc = args.slice(1).join(' ') || '新分支';
  const newBranchId = createBranchPoint(currentSessionId, messages.length - 1, branchDesc);
  saveBranchMessages(newBranchId, [...messages]);
  console.log(`✅ 分支已创建: ${newBranchId}`);
  currentBranchId = newBranchId;
  break;

case '/branch-switch':
  const targetBranchId = args[1];
  if (!targetBranchId) {
    console.log('❌ 请指定分支 ID');
    break;
  }
  const branchMessages = loadBranchMessages(targetBranchId);
  messages = branchMessages;
  currentBranchId = targetBranchId;
  console.log(`✅ 已切换到分支: ${targetBranchId}`);
  break;

case '/branch-save':
  if (!currentBranchId) {
    console.log('❌ 当前不在分支中');
    break;
  }
  saveBranchMessages(currentBranchId, [...messages]);
  console.log(`✅ 已保存到分支: ${currentBranchId}`);
  break;

case '/branch-list':
  const branches = listBranches(currentSessionId);
  console.log(branches);
  break;
*/

export {
  createBranchExample,
  switchBranchExample,
  compareBranchesExample,
  mergeBranchesExample,
  SessionWithBranches,
  branchWorkflowExample
};
