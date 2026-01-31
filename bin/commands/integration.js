import integrationManager from '../../lib/utils/integration.js';

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
    case 'test':
      return handleTest(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

async function handleAdd(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /integration add <name> <type> [description]' };
  }

  const [name, type, ...descParts] = params;
  const description = descParts.join(' ') || '';

  const integration = integrationManager.add(name, type, {}, description);

  return {
    success: true,
    message: `✅ 集成 "${name}" 已创建`,
    data: integration
  };
}

async function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /integration get <id>' };
  }

  const [id] = params;
  const integration = integrationManager.get(id);

  if (!integration) {
    return { success: false, message: `❌ 集成 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 集成 "${integration.name}"`,
    data: integration
  };
}

function handleList(params) {
  const [type] = params;
  const integrations = type
    ? integrationManager.getByType(type)
    : integrationManager.getAll();

  if (integrations.length === 0) {
    return { success: true, message: '📭 暂无集成', data: [] };
  }

  return {
    success: true,
    message: `📋 集成列表 (${integrations.length}个)`,
    data: integrations
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /integration update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const integration = integrationManager.update(id, { [key]: value });

  if (!integration) {
    return { success: false, message: `❌ 集成 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 集成 "${integration.name}" 已更新`,
    data: integration
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /integration remove <id>' };
  }

  const [id] = params;
  const removed = integrationManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 集成 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 集成 "${removed.name}" 已删除`,
    data: removed
  };
}

async function handleTest(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /integration test <id>' };
  }

  const [id] = params;
  const result = await integrationManager.test(id);

  return {
    success: result.success,
    message: result.success ? `✅ ${result.message}` : `❌ ${result.message}`,
    data: result
  };
}

function handleStats() {
  const stats = integrationManager.getStats();

  return {
    success: true,
    message: '📊 集成统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🔧 /integration - 第三方服务集成

用法:
  /integration add <name> <type> [description]  添加集成
  /integration get <id>                        获取集成详情
  /integration list [type]                      列出所有集成
  /integration update <id> <key> <value>        更新集成
  /integration remove <id>                      删除集成
  /integration test <id>                        测试连接
  /integration stats                            查看统计

类型: api, webhook, oauth, custom`
  };
}

export { handle };
