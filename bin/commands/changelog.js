import { ChangelogManager } from '../../lib/utils/changelog.js';

const changelogManager = new ChangelogManager();

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList();
    case 'update':
      return handleUpdate(params);
    case 'remove':
      return handleRemove(params);
    case 'format':
      return handleFormat();
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /changelog add <version> <type>' };
  }

  const [version, type, ...rest] = params;
  const changes = {
    added: [],
    changed: [],
    fixed: [],
    removed: []
  };

  // Parse changes from rest params
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--added' && rest[i + 1]) {
      changes.added.push(rest[++i]);
    } else if (rest[i] === '--changed' && rest[i + 1]) {
      changes.changed.push(rest[++i]);
    } else if (rest[i] === '--fixed' && rest[i + 1]) {
      changes.fixed.push(rest[++i]);
    } else if (rest[i] === '--removed' && rest[i + 1]) {
      changes.removed.push(rest[++i]);
    }
  }

  const entry = changelogManager.add(version, type, changes);

  return {
    success: true,
    message: `✅ 变更日志 "${version}" 已创建`,
    data: entry
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /changelog get <id>' };
  }

  const [id] = params;
  const entry = changelogManager.get(id);

  if (!entry) {
    return { success: false, message: `❌ 变更日志 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 变更日志 ${entry.version}`,
    data: entry
  };
}

function handleList() {
  const entries = changelogManager.getAll();

  if (entries.length === 0) {
    return { success: true, message: '📭 暂无变更日志', data: [] };
  }

  return {
    success: true,
    message: `📋 变更日志 (${entries.length}条)`,
    data: entries
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /changelog update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const entry = changelogManager.update(id, { [key]: value });

  if (!entry) {
    return { success: false, message: `❌ 变更日志 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 变更日志 "${entry.version}" 已更新`,
    data: entry
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /changelog remove <id>' };
  }

  const [id] = params;
  const removed = changelogManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 变更日志 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 变更日志 "${removed.version}" 已删除`,
    data: removed
  };
}

function handleFormat() {
  const md = changelogManager.formatMarkdown();

  return {
    success: true,
    message: `✅ Markdown格式已生成`,
    data: md
  };
}

function handleStats() {
  const stats = changelogManager.getStats();

  return {
    success: true,
    message: '📊 变更日志统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📝 /changelog - 变更日志管理

用法:
  /changelog add <version> <type> [--added x] [--changed y] [--fixed z]  添加变更
  /changelog get <id>                                                    获取变更详情
  /changelog list                                                        列出所有变更
  /changelog update <id> <key> <value>                                   更新变更
  /changelog remove <id>                                                 删除变更
  /changelog format                                                       导出Markdown
  /changelog stats                                                        查看统计

类型: major, minor, patch`
  };
}

module.exports = { handle };
