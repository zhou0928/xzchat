import webhookManager from '../../lib/utils/webhook.js';

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
    case 'trigger':
      return handleTrigger(params);
    case 'logs':
      return handleLogs(params);
    case 'clear':
      return handleClear(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /webhook add <url> <events> [description]' };
  }

  const [url, eventsStr, ...descParts] = params;
  const events = eventsStr.split(',');
  const description = descParts.join(' ') || '';

  const webhook = webhookManager.add(url, events, description);

  return {
    success: true,
    message: `✅ Webhook 已创建`,
    data: webhook
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /webhook get <id>' };
  }

  const [id] = params;
  const webhook = webhookManager.get(id);

  if (!webhook) {
    return { success: false, message: `❌ Webhook "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Webhook`,
    data: webhook
  };
}

function handleList(params) {
  const [event] = params;
  const webhooks = event
    ? webhookManager.getByEvent(event)
    : webhookManager.getAll();

  if (webhooks.length === 0) {
    return { success: true, message: '📭 暂无Webhook', data: [] };
  }

  return {
    success: true,
    message: `📋 Webhook列表 (${webhooks.length}个)`,
    data: webhooks
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /webhook update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const webhook = webhookManager.update(id, { [key]: value });

  if (!webhook) {
    return { success: false, message: `❌ Webhook "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Webhook 已更新`,
    data: webhook
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /webhook remove <id>' };
  }

  const [id] = params;
  const removed = webhookManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ Webhook "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Webhook 已删除`,
    data: removed
  };
}

async function handleTrigger(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /webhook trigger <event> [json-payload]' };
  }

  const [event, ...payloadParts] = params;
  const payloadStr = payloadParts.join(' ');
  const payload = payloadStr ? JSON.parse(payloadStr) : {};

  const results = await webhookManager.trigger(event, payload);

  return {
    success: true,
    message: `✅ 触发了 ${results.length} 个Webhook`,
    data: results
  };
}

function handleLogs(params) {
  const [webhookId, limitStr] = params;
  const limit = limitStr ? parseInt(limitStr) : 50;
  const logs = webhookManager.getLogs(webhookId || null, limit);

  if (logs.length === 0) {
    return { success: true, message: '📭 暂无日志', data: [] };
  }

  return {
    success: true,
    message: `📋 日志列表 (${logs.length}条)`,
    data: logs
  };
}

function handleClear(params) {
  const [webhookId] = params;
  webhookManager.clearLogs(webhookId || null);

  return {
    success: true,
    message: webhookId ? `✅ Webhook日志已清除` : `✅ 所有日志已清除`
  };
}

function handleStats() {
  const stats = webhookManager.getStats();

  return {
    success: true,
    message: '📊 Webhook统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🔧 /webhook - Webhook配置和事件管理

用法:
  /webhook add <url> <events> [description]    添加Webhook
  /webhook get <id>                             获取Webhook详情
  /webhook list [event]                         列出所有Webhook
  /webhook update <id> <key> <value>            更新Webhook
  /webhook remove <id>                          删除Webhook
  /webhook trigger <event> [json-payload]      手动触发事件
  /webhook logs [id] [limit]                    查看日志
  /webhook clear [id]                           清除日志
  /webhook stats                                查看统计

事件: create, update, delete, deploy, error等`
  };
}

module.exports = { handle };
