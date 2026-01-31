import schedulerManager from '../../lib/utils/scheduler.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList(params);
    case 'update':
      return handleUpdate(params);
    case 'remove':
      return handleRemove(params);
    case 'start':
      return handleStart(params);
    case 'stop':
      return handleStop(params);
    case 'run':
      return handleRunNow(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /scheduler add <name> <type> <config> [description]' };
  }

  const [name, type, configStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let config;
  try {
    config = JSON.parse(configStr);
  } catch (err) {
    config = { interval: parseInt(configStr), unit: 'minutes' };
  }

  const schedule = schedulerManager.add(name, type, config, description);

  return {
    success: true,
    message: `✅ 调度任务 "${name}" 已创建`,
    data: schedule
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /scheduler get <id>' };
  }

  const [id] = params;
  const schedule = schedulerManager.get(id);

  if (!schedule) {
    return { success: false, message: `❌ 调度任务 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 调度任务 "${schedule.name}"`,
    data: schedule
  };
}

function handleList(params) {
  const [status] = params;
  const schedules = status
    ? schedulerManager.getByStatus(status)
    : schedulerManager.getAll();

  if (schedules.length === 0) {
    return { success: true, message: '📭 暂无调度任务', data: [] };
  }

  return {
    success: true,
    message: `📋 调度任务列表 (${schedules.length}个)`,
    data: schedules
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /scheduler update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const schedule = schedulerManager.update(id, { [key]: value });

  if (!schedule) {
    return { success: false, message: `❌ 调度任务 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 调度任务 "${schedule.name}" 已更新`,
    data: schedule
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /scheduler remove <id>' };
  }

  const [id] = params;
  const removed = schedulerManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 调度任务 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 调度任务 "${removed.name}" 已删除`,
    data: removed
  };
}

async function handleStart(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /scheduler start <id>' };
  }

  const [id] = params;
  const result = await schedulerManager.start(id);

  return {
    success: result.success,
    message: result.success ? `✅ ${result.message}` : `❌ ${result.message}`
  };
}

async function handleStop(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /scheduler stop <id>' };
  }

  const [id] = params;
  const result = await schedulerManager.stop(id);

  return {
    success: result.success,
    message: result.success ? `✅ ${result.message}` : `❌ ${result.message}`
  };
}

async function handleRunNow(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /scheduler run <id>' };
  }

  const [id] = params;
  const result = await schedulerManager.runNow(id);

  return {
    success: result.success,
    message: result.success ? `✅ ${result.message}` : `❌ ${result.message}`,
    data: result.data
  };
}

function handleStats() {
  const stats = schedulerManager.getStats();

  return {
    success: true,
    message: '📊 调度统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `⏰ /scheduler - 定时任务调度

用法:
  /scheduler add <name> <type> <config> [description]  添加调度任务
  /scheduler get <id>                                 获取任务详情
  /scheduler list [status]                           列出所有任务
  /scheduler update <id> <key> <value>               更新任务
  /scheduler remove <id>                              删除任务
  /scheduler start <id>                               启动任务
  /scheduler stop <id>                                停止任务
  /scheduler run <id>                                 立即执行
  /scheduler stats                                    查看统计

类型: interval, cron, once
配置: {"interval": 5, "unit": "minutes"} 或 {"cron": "0 * * * *"} 或 {"at": "2024-01-01T00:00:00Z"}`
  };
}

module.exports = { handle };
