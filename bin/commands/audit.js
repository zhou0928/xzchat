const AuditManager = require('../../lib/utils/audit');

const auditManager = new AuditManager();

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList(params);
    case 'search':
      return handleSearch(params);
    case 'export':
      return handleExport(params);
    case 'clear':
      return handleClear(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /audit add <action> [details]' };
  }

  const [action, ...detailsParts] = params;
  const details = detailsParts.join(' ') || '';

  const log = auditManager.add(action, details);

  return {
    success: true,
    message: `✅ 审计日志已记录`,
    data: log
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /audit get <id>' };
  }

  const [id] = params;
  const log = auditManager.get(id);

  if (!log) {
    return { success: false, message: `❌ 日志 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 审计日志`,
    data: log
  };
}

function handleList(params) {
  const filters = parseFilters(params);
  const logs = auditManager.getAll(filters);

  if (logs.length === 0) {
    return { success: true, message: '📭 暂无日志', data: [] };
  }

  return {
    success: true,
    message: `📋 日志列表 (${logs.length}条)`,
    data: logs
  };
}

function parseFilters(params) {
  const filters = {};
  let i = 0;

  while (i < params.length) {
    const param = params[i];

    if (param === '--action' && i + 1 < params.length) {
      filters.action = params[++i];
    } else if (param === '--user' && i + 1 < params.length) {
      filters.userId = params[++i];
    } else if (param === '--level' && i + 1 < params.length) {
      filters.level = params[++i];
    } else if (param === '--success' && i + 1 < params.length) {
      filters.success = params[++i] === 'true';
    } else if (param === '--start' && i + 1 < params.length) {
      filters.startDate = params[++i];
    } else if (param === '--end' && i + 1 < params.length) {
      filters.endDate = params[++i];
    }

    i++;
  }

  return filters;
}

function handleSearch(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /audit search <keyword>' };
  }

  const [keyword] = params;
  const logs = auditManager.search(keyword);

  if (logs.length === 0) {
    return { success: true, message: `📭 未找到匹配的日志`, data: [] };
  }

  return {
    success: true,
    message: `📋 搜索结果 (${logs.length}条)`,
    data: logs
  };
}

function handleExport(params) {
  const [format, ...filterParams] = params;
  const filters = parseFilters(filterParams);

  try {
    const data = auditManager.export(format || 'json', filters);

    return {
      success: true,
      message: `✅ 导出成功 (${format}格式)`,
      data: data
    };
  } catch (err) {
    return {
      success: false,
      message: `❌ 导出失败: ${err.message}`
    };
  }
}

function handleClear(params) {
  const [daysStr] = params;
  const days = daysStr ? parseInt(daysStr) : null;

  if (days) {
    const deleted = auditManager.clearOlderThan(days);
    return {
      success: true,
      message: `✅ 已清除 ${deleted} 条 ${days} 天前的日志`
    };
  } else {
    auditManager.clearAll();
    return {
      success: true,
      message: `✅ 所有日志已清除`
    };
  }
}

function handleStats() {
  const stats = auditManager.getStats();

  return {
    success: true,
    message: '📊 审计统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📋 /audit - 审计日志管理

用法:
  /audit add <action> [details]                              添加日志
  /audit get <id>                                            获取日志详情
  /audit list [--action x] [--user y] [--level z]           列出日志
  /audit search <keyword>                                    搜索日志
  /audit export [json|csv] [--filters]                      导出日志
  /audit clear [days]                                        清除日志
  /audit stats                                               查看统计

过滤参数:
  --action <action>      按操作类型过滤
  --user <userId>        按用户过滤
  --level <level>        按级别过滤
  --success <true|false> 按成功状态过滤
  --start <date>         开始日期
  --end <date>           结束日期

级别: info, warning, error, critical`
  };
}

module.exports = { handle };
