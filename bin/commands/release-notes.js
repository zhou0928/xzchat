const ReleaseNotesManager = require('../../lib/utils/release-notes');

const releaseNotesManager = new ReleaseNotesManager();

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
      return handleFormat(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /release-notes add <version> <title>' };
  }

  const [version, title, ...rest] = params;
  let content = '';
  let type = 'stable';

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--content' && rest[i + 1]) {
      content = rest[++i];
    } else if (rest[i] === '--type' && rest[i + 1]) {
      type = rest[++i];
    }
  }

  const release = releaseNotesManager.add(version, title, content, type);

  return {
    success: true,
    message: `✅ 发布说明 "${version}" 已创建`,
    data: release
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /release-notes get <id>' };
  }

  const [id] = params;
  const release = releaseNotesManager.get(id);

  if (!release) {
    return { success: false, message: `❌ 发布说明 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 发布说明 ${release.version}`,
    data: release
  };
}

function handleList() {
  const releases = releaseNotesManager.getAll();

  if (releases.length === 0) {
    return { success: true, message: '📭 暂无发布说明', data: [] };
  }

  return {
    success: true,
    message: `📋 发布说明 (${releases.length}条)`,
    data: releases
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /release-notes update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const release = releaseNotesManager.update(id, { [key]: value });

  if (!release) {
    return { success: false, message: `❌ 发布说明 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 发布说明 "${release.version}" 已更新`,
    data: release
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /release-notes remove <id>' };
  }

  const [id] = params;
  const removed = releaseNotesManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 发布说明 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 发布说明 "${removed.version}" 已删除`,
    data: removed
  };
}

function handleFormat(params) {
  const [id] = params;
  const md = releaseNotesManager.formatMarkdown(id);

  if (!md) {
    return { success: false, message: '📭 暂无发布说明可格式化' };
  }

  return {
    success: true,
    message: `✅ Markdown格式已生成`,
    data: md
  };
}

function handleStats() {
  const stats = releaseNotesManager.getStats();

  return {
    success: true,
    message: '📊 发布说明统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📋 /release-notes - 发布说明管理

用法:
  /release-notes add <version> <title> [--content x] [--type y]    添加发布说明
  /release-notes get <id>                                          获取发布详情
  /release-notes list                                              列出所有发布
  /release-notes update <id> <key> <value>                         更新发布
  /release-notes remove <id>                                       删除发布
  /release-notes format [id]                                       导出Markdown
  /release-notes stats                                             查看统计

类型: alpha, beta, rc, stable`
  };
}

module.exports = { handle };
