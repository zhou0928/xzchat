import importManager from '../../lib/utils/import.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'from-file':
      return handleFromFile(params);
    case 'from-json':
      return handleFromJSON(params);
    case 'list':
      return handleList(params);
    case 'get':
      return handleGet(params);
    case 'clear':
      return handleClear(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

async function handleFromFile(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /import from-file <filepath> <format>' };
  }

  const [filepath, format] = params;
  const result = await importManager.importFromFile(filepath, format);

  return {
    success: result.success !== false,
    message: result.success !== false
      ? `✅ 已从文件导入 (${result.stats.imported} 条记录)`
      : `❌ ${result.message}`,
    data: result
  };
}

async function handleFromJSON(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /import from-json <json-string> [source]' };
  }

  const [jsonStr, source = 'clipboard'] = params;
  let data;

  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    return { success: false, message: '无效的JSON格式' };
  }

  const result = await importManager.import(source, 'json', data);

  return {
    success: true,
    message: `✅ 已导入 ${result.stats.imported} 条记录`,
    data: result
  };
}

function handleList(params) {
  const [limitStr] = params;
  const limit = limitStr ? parseInt(limitStr) : 50;
  const imports = importManager.getAll(limit);

  if (imports.length === 0) {
    return { success: true, message: '📭 暂无导入记录', data: [] };
  }

  return {
    success: true,
    message: `📋 导入记录 (${imports.length}条)`,
    data: imports
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /import get <id>' };
  }

  const [id] = params;
  const record = importManager.get(id);

  if (!record) {
    return { success: false, message: `❌ 记录 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 导入记录`,
    data: record
  };
}

async function handleClear(params) {
  const [daysStr] = params;
  const days = daysStr ? parseInt(daysStr) : 30;
  const deleted = await importManager.clearOld(days);

  return {
    success: true,
    message: `✅ 已清除 ${deleted} 条 ${days} 天前的记录`
  };
}

function handleStats() {
  const stats = importManager.getStats();

  return {
    success: true,
    message: '📊 导入统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📥 /import - 数据导入

用法:
  /import from-file <filepath> <format>    从文件导入
  /import from-json <json-string> [src]    从JSON导入
  /import list [limit]                       列出导入记录
  /import get <id>                           获取记录详情
  /import clear [days]                       清除旧记录
  /import stats                              查看统计

支持格式: json, csv, xml, yaml`
  };
}

export { handle };
