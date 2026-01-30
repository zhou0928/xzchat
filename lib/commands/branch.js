/**
 * 分支命令处理
 * /branch - 管理会话分支
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
} from '../utils/branch-manager.js';
import { logger } from '../utils/logger.js';
import { 
  showCommandHelp, 
  showSuccess, 
  showError, 
  formatList,
  formatTable,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../utils/messages.js';



/**
 * 列出所有分支
 */
async function listBranchesCommand(sessionId) {
  try {
    const branches = listBranches(sessionId);

    if (!branches || branches.length === 0) {
      console.log('\n📂 当前没有分支');
      console.log('💡 使用 /branch create <描述> 创建第一个分支\n');
      return;
    }

    console.log('\n🌳 分支列表:\n');

    // 准备表格数据
    const headers = ['ID', '描述', '消息数', '创建时间', '状态'];
    const rows = branches.map(b => [
      b.id.substring(0, 12) + '...',
      b.description || '-',
      b.messageCount || 0,
      new Date(b.createdAt).toLocaleString('zh-CN'),
      b.isActive ? '✅ 当前' : ''
    ]);

    const table = formatTable(headers, rows);
    console.log(table.full);

    console.log('\n💡 提示:');
    console.log('  • 使用 /branch switch <id> 切换分支');
    console.log('  • 使用 /branch compare <id1> <id2> 比较分支');
    console.log('  • 使用 /branch tree 查看分支树结构\n');

  } catch (error) {
    logger.error('列出分支失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 创建分支
 */
async function createBranchCommand(args, sessionId, currentMessages) {
  const description = args[0] || '未命名分支';

  if (currentMessages.length === 0) {
    console.log('⚠️  当前会话为空，无法创建分支');
    console.log('💡 请先发送一些消息，然后再创建分支\n');
    return;
  }

  try {
    const branchId = createBranchPoint(sessionId, currentMessages.length - 1, description);
    saveBranchMessages(branchId, currentMessages);
    
    showSuccess('BRANCH_CREATED', { id: branchId });
    console.log(`📝 描述: ${description}`);
    console.log(`💾 消息数: ${currentMessages.length}`);
    console.log(`\n💡 使用 /branch list 查看所有分支\n`);

    logger.info('分支已创建', { branchId, description });

  } catch (error) {
    logger.error('创建分支失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 切换分支
 */
async function switchBranchCommand(args) {
  const branchId = args[0];

  if (!branchId) {
    console.log('❌ 请指定要切换的分支 ID');
    console.log('用法: /branch switch <branch-id>');
    console.log('示例: /branch switch branch_xxx\n');
    return;
  }

  try {
    const branchInfo = getBranchInfo(branchId);

    if (!branchInfo) {
      showError('BRANCH_NOT_FOUND', { id: branchId });
      console.log('💡 使用 /branch list 查看可用分支\n');
      return;
    }

    const messages = loadBranchMessages(branchId);
    
    showSuccess('BRANCH_SWITCHED', { id: branchId });
    console.log(`📝 描述: ${branchInfo.description || '-'}`);
    console.log(`💾 消息数: ${messages?.length || 0}\n`);

    // 返回消息以便主程序切换
    return messages;

  } catch (error) {
    logger.error('切换分支失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 删除分支
 */
async function deleteBranchCommand(args) {
  const branchId = args[0];

  if (!branchId) {
    console.log('❌ 请指定要删除的分支 ID');
    console.log('用法: /branch delete <branch-id>');
    console.log('示例: /branch delete branch_xxx\n');
    return;
  }

  try {
    const branchInfo = getBranchInfo(branchId);

    if (!branchInfo) {
      showError('BRANCH_NOT_FOUND', { id: branchId });
      return;
    }

    if (branchInfo.isActive) {
      showError('BRANCH_DELETE_CURRENT');
      console.log('💡 请先切换到其他分支\n');
      return;
    }

    const success = deleteBranch(branchId);

    if (success) {
      showSuccess('BRANCH_DELETED', { id: branchId });
      logger.info('分支已删除', { branchId });
    } else {
      showError('OPERATION_FAILED');
    }

  } catch (error) {
    logger.error('删除分支失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 比较分支
 */
async function compareBranchesCommand(args) {
  const branchId1 = args[0];
  const branchId2 = args[1];

  if (!branchId1 || !branchId2) {
    console.log('❌ 请指定两个分支 ID');
    console.log('用法: /branch compare <branch-id1> <branch-id2>');
    console.log('示例: /branch compare branch_1 branch_2\n');
    return;
  }

  try {
    const comparison = compareBranches(branchId1, branchId2);

    console.log('\n📊 分支比较:\n');
    console.log(`分支 1: ${comparison.branch1.description || branchId1}`);
    console.log(`分支 2: ${comparison.branch2.description || branchId2}`);
    console.log(`消息差异: ${comparison.messageDifference}`);
    console.log(`相似度: ${(comparison.similarity * 100).toFixed(2)}%\n`);

    if (comparison.differences.length > 0) {
      console.log('差异详情:');
      comparison.differences.forEach((diff, idx) => {
        console.log(`\n[${idx + 1}] 消息 ${diff.messageIndex}:`);
        console.log(`    类型: ${diff.type}`);
        console.log(`    分支1: ${diff.branch1Content?.substring(0, 50) || '(空)'}...`);
        console.log(`    分支2: ${diff.branch2Content?.substring(0, 50) || '(空)'}...`);
      });
      console.log();
    }

  } catch (error) {
    logger.error('比较分支失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 合并分支
 */
async function mergeBranchesCommand(args) {
  const sourceBranch = args[0];
  const targetBranch = args[1];
  const mode = args[2] || 'replace';

  if (!sourceBranch || !targetBranch) {
    console.log('❌ 请指定源分支和目标分支');
    console.log('用法: /branch merge <source> <target> [mode]');
    console.log('模式:');
    console.log('  replace - 替换目标分支（默认）');
    console.log('  append  - 追加到目标分支');
    console.log('  interactive - 交互式合并\n');
    return;
  }

  try {
    const result = mergeBranches(sourceBranch, targetBranch, mode);

    if (result.success) {
      showSuccess('BRANCH_MERGED', { src: sourceBranch, dst: targetBranch });
      console.log(`📝 模式: ${mode}`);
      console.log(`💾 合并消息数: ${result.mergedCount}\n`);
    } else {
      showError('OPERATION_FAILED', { reason: result.error });
    }

  } catch (error) {
    logger.error('合并分支失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 显示分支树
 */
async function showBranchTreeCommand(sessionId) {
  try {
    const tree = exportBranchTree(sessionId);
    const formatted = formatBranchTree(tree);

    console.log('\n🌳 分支树结构:\n');
    console.log(formatted);
    console.log('\n💡 提示:');
    console.log('  • 使用 /branch switch <id> 切换分支');
    console.log('  • 使用 /branch compare <id1> <id2> 比较分支\n');

  } catch (error) {
    logger.error('显示分支树失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 清理孤立分支
 */
async function cleanupBranchesCommand() {
  try {
    const cleaned = cleanupOrphanedBranches();

    if (cleaned.length === 0) {
      console.log('\n✅ 没有发现孤立分支\n');
    } else {
      console.log(`\n🧹 已清理 ${cleaned.length} 个孤立分支:\n`);
      cleaned.forEach((id, idx) => {
        console.log(`  [${idx + 1}] ${id}`);
      });
      console.log('\n✅ 清理完成\n');
    }

    logger.info('清理孤立分支', { count: cleaned.length });

  } catch (error) {
    logger.error('清理分支失败', { error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 处理 /branch 命令
 */
export async function handleBranchCommand(args, sessionId, currentMessages) {
  const action = args[0];

  if (!action || ['help', '-h', '--help'].includes(action)) {
    return showBranchHelp();
  }

  try {
    switch (action) {
      case 'list':
      case 'ls':
        return await listBranchesCommand(sessionId);
      
      case 'create':
      case 'new':
        return await createBranchCommand(args.slice(1), sessionId, currentMessages);
      
      case 'switch':
      case 'use':
        return await switchBranchCommand(args.slice(1));
      
      case 'delete':
      case 'remove':
      case 'rm':
        return await deleteBranchCommand(args.slice(1));
      
      case 'compare':
      case 'diff':
        return await compareBranchesCommand(args.slice(1));
      
      case 'merge':
        return await mergeBranchesCommand(args.slice(1));
      
      case 'tree':
        return await showBranchTreeCommand(sessionId);
      
      case 'cleanup':
        return await cleanupBranchesCommand();
      
      default:
        console.log(`\n❌ 未知子命令: ${action}`);
        console.log(`💡 使用 "/branch help" 查看帮助\n`);
    }
  } catch (error) {
    logger.error('处理分支命令失败', { action, error: error.message });
    showError('OPERATION_FAILED', { reason: error.message });
  }
}

/**
 * 显示分支帮助信息
 */
function showBranchHelp() {
  return `
🌳 分支系统帮助

分支系统允许你在会话的不同路径中探索问题，创建实验性的对话分支。

用法：
  /branch <action> [options]

操作：
  /branch list              列出所有分支
  /branch create <desc>      从当前消息创建新分支
  /branch switch <id>        切换到指定分支
  /branch delete <id>        删除指定分支
  /branch compare <id1> <id2> 比较两个分支
  /branch merge <src> <dst>  合并分支（src -> dst）
  /branch tree               显示分支树结构
  /branch cleanup            清理孤立分支

示例：
  /branch create 尝试新的实现方式
  /branch list
  /branch switch branch_xxx
  /branch compare branch_xxx branch_yyy
  /branch merge branch_xxx branch_yyy
  /branch tree

说明：
  - 创建分支后，可以在不同方向上探索问题
  - 每个分支都保留自己的对话历史
  - 可以随时切换回之前的分支
  - 支持分支比较和合并功能
`;
}
