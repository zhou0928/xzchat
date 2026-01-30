/**
 * 分支管理器
 * 支持会话分支功能，允许在不同路径探索问题
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRANCHES_DIR = path.join(path.dirname(__dirname), '.branches');
const BRANCH_INDEX_FILE = path.join(BRANCHES_DIR, 'index.json');

/**
 * 确保分支目录存在
 */
function ensureBranchesDir() {
  if (!fs.existsSync(BRANCHES_DIR)) {
    fs.mkdirSync(BRANCHES_DIR, { recursive: true });
    logger.debug('创建分支目录', BRANCHES_DIR);
  }
}

/**
 * 获取分支索引
 */
function getBranchIndex() {
  ensureBranchesDir();
  if (!fs.existsSync(BRANCH_INDEX_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(BRANCH_INDEX_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    logger.error('读取分支索引失败', e.message);
    return {};
  }
}

/**
 * 保存分支索引
 */
function saveBranchIndex(index) {
  ensureBranchesDir();
  fs.writeFileSync(BRANCH_INDEX_FILE, JSON.stringify(index, null, 2));
  logger.debug('保存分支索引');
}

/**
 * 生成分支ID
 */
function generateBranchId() {
  return `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从消息创建分支点
 */
export function createBranchPoint(sessionId, messageIndex, description) {
  const branchId = generateBranchId();
  const index = getBranchIndex();

  index[branchId] = {
    id: branchId,
    sessionId,
    messageIndex,
    description,
    createdAt: new Date().toISOString(),
    children: []
  };

  // 如果是从已有分支创建，更新父分支
  if (sessionId.startsWith('branch_')) {
    const parentBranch = index[sessionId];
    if (parentBranch) {
      if (!parentBranch.children.includes(branchId)) {
        parentBranch.children.push(branchId);
      }
    }
  }

  saveBranchIndex(index);
  logger.info('创建分支点', { branchId, sessionId, messageIndex });
  return branchId;
}

/**
 * 保存分支消息
 */
export function saveBranchMessages(branchId, messages) {
  ensureBranchesDir();
  const branchFile = path.join(BRANCHES_DIR, `${branchId}.json`);
  fs.writeFileSync(branchFile, JSON.stringify(messages, null, 2));
  logger.debug('保存分支消息', { branchId, count: messages.length });
}

/**
 * 加载分支消息
 */
export function loadBranchMessages(branchId) {
  ensureBranchesDir();
  const branchFile = path.join(BRANCHES_DIR, `${branchId}.json`);
  
  if (!fs.existsSync(branchFile)) {
    throw new Error(`分支不存在: ${branchId}`);
  }

  try {
    const content = fs.readFileSync(branchFile, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    logger.error('加载分支消息失败', e.message);
    throw new Error(`加载分支失败: ${e.message}`);
  }
}

/**
 * 获取分支信息
 */
export function getBranchInfo(branchId) {
  const index = getBranchIndex();
  return index[branchId] || null;
}

/**
 * 列出所有分支
 */
export function listBranches(sessionId = null) {
  const index = getBranchIndex();
  const branches = [];

  for (const [id, info] of Object.entries(index)) {
    if (!sessionId || info.sessionId === sessionId) {
      branches.push({
        id,
        description: info.description,
        createdAt: info.createdAt,
        messageIndex: info.messageIndex,
        children: info.children,
        sessionId: info.sessionId
      });
    }
  }

  return branches.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * 删除分支
 */
export function deleteBranch(branchId) {
  ensureBranchesDir();
  const index = getBranchIndex();

  if (!index[branchId]) {
    throw new Error(`分支不存在: ${branchId}`);
  }

  // 删除分支文件
  const branchFile = path.join(BRANCHES_DIR, `${branchId}.json`);
  if (fs.existsSync(branchFile)) {
    fs.unlinkSync(branchFile);
  }

  // 从父分支中移除
  const branchInfo = index[branchId];
  if (branchInfo.sessionId.startsWith('branch_') && index[branchInfo.sessionId]) {
    const parent = index[branchInfo.sessionId];
    parent.children = parent.children.filter(id => id !== branchId);
  }

  // 递归删除子分支
  if (branchInfo.children && branchInfo.children.length > 0) {
    for (const childId of branchInfo.children) {
      try {
        deleteBranch(childId);
      } catch (e) {
        logger.warn('删除子分支失败', { childId, error: e.message });
      }
    }
  }

  delete index[branchId];
  saveBranchIndex(index);
  logger.info('删除分支', branchId);
}

/**
 * 比较两个分支的差异
 */
export function compareBranches(branchId1, branchId2) {
  const messages1 = loadBranchMessages(branchId1);
  const messages2 = loadBranchMessages(branchId2);

  const info1 = getBranchInfo(branchId1);
  const info2 = getBranchInfo(branchId2);

  // 找出第一个不同的消息索引
  const minLength = Math.min(messages1.length, messages2.length);
  let diffIndex = -1;

  for (let i = 0; i < minLength; i++) {
    const msg1 = messages1[i];
    const msg2 = messages2[i];

    if (msg1.role !== msg2.role || msg1.content !== msg2.content) {
      diffIndex = i;
      break;
    }
  }

  // 如果前面的都相同，但长度不同
  if (diffIndex === -1 && messages1.length !== messages2.length) {
    diffIndex = minLength;
  }

  return {
    branch1: {
      id: branchId1,
      description: info1?.description || '未知',
      messageCount: messages1.length
    },
    branch2: {
      id: branchId2,
      description: info2?.description || '未知',
      messageCount: messages2.length
    },
    diffIndex,
    messages1Diff: diffIndex >= 0 ? messages1.slice(diffIndex) : [],
    messages2Diff: diffIndex >= 0 ? messages2.slice(diffIndex) : [],
    identical: diffIndex === -1 && messages1.length === messages2.length
  };
}

/**
 * 合并分支（简单合并，选择一个分支作为主分支）
 */
export function mergeBranches(sourceBranchId, targetBranchId, mode = 'replace') {
  const sourceMessages = loadBranchMessages(sourceBranchId);
  const targetMessages = loadBranchMessages(targetBranchId);

  let mergedMessages;

  if (mode === 'replace') {
    // 直接替换为目标分支
    mergedMessages = sourceMessages;
  } else if (mode === 'append') {
    // 追加源分支的新消息
    const minLength = Math.min(sourceMessages.length, targetMessages.length);
    let appendIndex = sourceMessages.length;
    
    // 找出分歧点
    for (let i = 0; i < minLength; i++) {
      if (JSON.stringify(sourceMessages[i]) !== JSON.stringify(targetMessages[i])) {
        appendIndex = i;
        break;
      }
    }

    mergedMessages = targetMessages.slice(0, appendIndex).concat(sourceMessages.slice(appendIndex));
  } else if (mode === 'interactive') {
    // 交互式合并（返回信息，让用户选择）
    const comparison = compareBranches(sourceBranchId, targetBranchId);
    return {
      mode: 'interactive',
      comparison,
      sourceMessages,
      targetMessages
    };
  }

  // 保存合并结果到目标分支
  saveBranchMessages(targetBranchId, mergedMessages);
  
  logger.info('合并分支', { source: sourceBranchId, target: targetBranchId, mode });
  
  return {
    mode,
    mergedMessageCount: mergedMessages.length
  };
}

/**
 * 导出分支树（可视化分支结构）
 */
export function exportBranchTree(sessionId = null) {
  const index = getBranchIndex();
  const roots = [];

  function buildTree(branchId, depth = 0) {
    const info = index[branchId];
    if (!info) return null;

    const node = {
      id: branchId,
      description: info.description,
      createdAt: info.createdAt,
      messageIndex: info.messageIndex,
      depth,
      children: []
    };

    if (info.children && info.children.length > 0) {
      for (const childId of info.children) {
        const childNode = buildTree(childId, depth + 1);
        if (childNode) {
          node.children.push(childNode);
        }
      }
    }

    return node;
  }

  // 找到根分支（没有父分支的分支）
  for (const [id, info] of Object.entries(index)) {
    if (!sessionId || info.sessionId === sessionId) {
      const parentId = info.sessionId;
      
      // 检查是否是根分支
      if (!parentId.startsWith('branch_') || !index[parentId]) {
        const tree = buildTree(id);
        if (tree) {
          roots.push(tree);
        }
      }
    }
  }

  return roots;
}

/**
 * 格式化分支树为可读文本
 */
export function formatBranchTree(roots, maxDepth = 10) {
  let output = [];
  output.push('🌳 分支树结构：');
  output.push('');

  function formatNode(node, prefix = '', isLast = true) {
    const connector = isLast ? '└── ' : '├── ';
    const branchShortId = node.id.length > 12 ? node.id.substring(0, 9) + '...' : node.id;
    const date = new Date(node.createdAt).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    output.push(`${prefix}${connector}${branchShortId} - ${node.description} [${date}]`);

    if (node.children && node.children.length > 0 && node.depth < maxDepth) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      node.children.forEach((child, index) => {
        formatNode(child, newPrefix, index === node.children.length - 1);
      });
    }
  }

  roots.forEach((root, index) => {
    formatNode(root, '', index === roots.length - 1);
    output.push('');
  });

  return output.join('\n');
}

/**
 * 清理孤立的分支（没有父分支引用的分支）
 */
export function cleanupOrphanedBranches() {
  const index = getBranchIndex();
  const orphaned = [];

  for (const [id, info] of Object.entries(index)) {
    if (info.sessionId && info.sessionId.startsWith('branch_')) {
      if (!index[info.sessionId]) {
        orphaned.push(id);
      }
    }
  }

  if (orphaned.length === 0) {
    return { cleaned: 0, branches: [] };
  }

  // 删除孤立分支
  for (const branchId of orphaned) {
    try {
      deleteBranch(branchId);
    } catch (e) {
      logger.warn('清理孤立分支失败', { branchId, error: e.message });
    }
  }

  logger.info('清理孤立分支', { count: orphaned.length });
  return { cleaned: orphaned.length, branches: orphaned };
}
