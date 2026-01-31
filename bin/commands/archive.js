import archiveManager from '../../lib/utils/archive.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'create':
      return handleCreate(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList();
    case 'restore':
      return handleRestore(params);
    case 'verify':
      return handleVerify(params);
    case 'remove':
      return handleRemove(params);
    case 'cleanup':
      return handleCleanup(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

async function handleCreate(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /archive create <name> <json-data>' };
  }

  const [name, dataStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let data;
  try {
    data = JSON.parse(dataStr);
  } catch (err) {
    return { success: false, message: '无效的JSON数据' };
  }

  const archive = await archiveManager.create(name, data, { description });

  return {
    success: true,
    message: `✅ 归档 "${name}" 已创建`,
    data: archive
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /archive get <id>' };
  }

  const [id] = params;
  const archive = archiveManager.get(id);

  if (!archive) {
    return { success: false, message: `❌ 归档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 归档 "${archive.name}"`,
    data: archive
  };
}

function handleList() {
  const archives = archiveManager.getAll();

  if (archives.length === 0) {
    return { success: true, message: '📭 暂无归档', data: [] };
  }

  return {
    success: true,
    message: `📋 归档列表 (${archives.length}个)`,
    data: archives
  };
}

async function handleRestore(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /archive restore <id>' };
  }

  const [id] = params;
  const result = await archiveManager.restore(id);

  return {
    success: result.success,
    message: result.message,
    data: result.data
  };
}

async function handleVerify(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /archive verify <id>' };
  }

  const [id] = params;
  const result = await archiveManager.verify(id);

  return {
    success: result.success,
    message: result.message,
    data: result.data
  };
}

async function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /archive remove <id>' };
  }

  const [id] = params;
  const removed = await archiveManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 归档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 归档 "${removed.name}" 已删除`,
    data: removed
  };
}

async function handleCleanup(params) {
  const [daysStr] = params;
  const days = daysStr ? parseInt(daysStr) : 30;
  const deleted = await archiveManager.cleanup(days);

  return {
    success: true,
    message: `✅ 已清理 ${deleted} 个过期归档`
  };
}

function handleStats() {
  const stats = archiveManager.getStats();

  return {
    success: true,
    message: '📊 归档统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📦 /archive - 数据归档和备份

用法:
  /archive create <name> <json-data> [desc]    创建归档
  /archive get <id>                            获取归档详情
  /archive list                                列出所有归档
  /archive restore <id>                        恢复归档
  /archive verify <id>                         验证归档完整性
  /archive remove <id>                         删除归档
  /archive cleanup [days]                      清理过期归档
  /archive stats                               查看统计`
  };
}

export { handle };
