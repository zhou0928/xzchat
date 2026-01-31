import exportManager from '../../lib/utils/export-advanced.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'to-json':
      return handleToFormat(params, 'json');
    case 'to-csv':
      return handleToFormat(params, 'csv');
    case 'to-xml':
      return handleToFormat(params, 'xml');
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

async function handleToFormat(params, format) {
  if (params.length === 0) {
    return { success: false, message: `用法: /export to-${format} <json-data>` };
  }

  const [dataStr] = params;
  let data;

  try {
    data = JSON.parse(dataStr);
  } catch (err) {
    return { success: false, message: '无效的JSON数据' };
  }

  const result = await exportManager.export(data, format, 'file');

  return {
    success: result.status === 'completed',
    message: result.status === 'completed'
      ? `✅ 已导出为${format.toUpperCase()}格式`
      : `❌ 导出失败`,
    data: result
  };
}

function handleList(params) {
  const [limitStr] = params;
  const limit = limitStr ? parseInt(limitStr) : 50;
  const exports = exportManager.getAll(limit);

  if (exports.length === 0) {
    return { success: true, message: '📭 暂无导出记录', data: [] };
  }

  return {
    success: true,
    message: `📋 导出记录 (${exports.length}条)`,
    data: exports
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /export-advanced get <id>' };
  }

  const [id] = params;
  const record = exportManager.get(id);

  if (!record) {
    return { success: false, message: `❌ 记录 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 导出记录`,
    data: record
  };
}

async function handleClear(params) {
  const [daysStr] = params;
  const days = daysStr ? parseInt(daysStr) : 30;
  const deleted = await exportManager.clearOld(days);

  return {
    success: true,
    message: `✅ 已清除 ${deleted} 条 ${days} 天前的记录`
  };
}

function handleStats() {
  const stats = exportManager.getStats();

  return {
    success: true,
    message: '📊 导出统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📤 /export-advanced - 高级导出

用法:
  /export-advanced to-json <json-data>      导出为JSON
  /export-advanced to-csv <json-data>       导出为CSV
  /export-advanced to-xml <json-data>       导出为XML
  /export-advanced list [limit]             列出导出记录
  /export-advanced get <id>                 获取记录详情
  /export-advanced clear [days]            清除旧记录
  /export-advanced stats                    查看统计

支持格式: json, csv, xml, yaml`
  };
}

export { handle };
