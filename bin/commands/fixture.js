import fixtureManager from '../../lib/utils/fixture.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList();
    case 'load':
      return handleLoad(params);
    case 'remove':
      return handleRemove(params);
    case 'search':
      return handleSearch(params);
    case 'create-set':
      return handleCreateSet(params);
    case 'load-set':
      return handleLoadSet(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /fixture add <name> <data-json> [type] [desc]' };
  }

  const [name, dataStr, type = 'data', ...descParts] = params;
  const description = descParts.join(' ') || '';

  let data;
  try {
    data = JSON.parse(dataStr);
  } catch (err) {
    return { success: false, message: 'data必须是有效的JSON' };
  }

  const fixture = fixtureManager.add(name, data, type, description);

  return {
    success: true,
    message: `✅ Fixture "${name}" 已创建`,
    data: fixture
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /fixture get <id>' };
  }

  const [id] = params;
  const fixture = fixtureManager.get(id);

  if (!fixture) {
    return { success: false, message: `❌ Fixture "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Fixture "${fixture.name}"`,
    data: fixture
  };
}

function handleList() {
  const fixtures = fixtureManager.getAll();

  if (fixtures.length === 0) {
    return { success: true, message: '📭 暂无Fixture', data: [] };
  }

  return {
    success: true,
    message: `📋 Fixture列表 (${fixtures.length}个)`,
    data: fixtures
  };
}

function handleLoad(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /fixture load <id>' };
  }

  const [id] = params;
  const fixture = fixtureManager.load(id);

  if (!fixture) {
    return { success: false, message: `❌ Fixture "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Fixture "${fixture.name}" 已加载`,
    data: fixture
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /fixture remove <id>' };
  }

  const [id] = params;
  const removed = fixtureManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ Fixture "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Fixture "${removed.name}" 已删除`,
    data: removed
  };
}

function handleSearch(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /fixture search <keyword>' };
  }

  const [keyword] = params;
  const fixtures = fixtureManager.search(keyword);

  if (fixtures.length === 0) {
    return { success: true, message: `📭 未找到匹配的Fixture`, data: [] };
  }

  return {
    success: true,
    message: `📋 搜索结果 (${fixtures.length}个)`,
    data: fixtures
  };
}

function handleCreateSet(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /fixture create-set <name> <fixture-ids-json>' };
  }

  const [name, idsStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let fixtureIds;
  try {
    fixtureIds = JSON.parse(idsStr);
  } catch (err) {
    return { success: false, message: 'fixtureIds必须是有效的JSON数组' };
  }

  const set = fixtureManager.createSet(name, fixtureIds, description);

  return {
    success: true,
    message: `✅ Fixture集 "${name}" 已创建`,
    data: set
  };
}

function handleLoadSet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /fixture load-set <set-id>' };
  }

  const [id] = params;
  const result = fixtureManager.loadSet(id);

  if (!result) {
    return { success: false, message: `❌ Fixture集 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Fixture集 "${result.set.name}" 已加载`,
    data: result
  };
}

function handleStats() {
  const stats = fixtureManager.getStats();

  return {
    success: true,
    message: '📊 Fixture统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🔧 /fixture - 测试Fixture管理

用法:
  /fixture add <name> <data> [type] [desc]   添加Fixture
  /fixture get <id>                            获取Fixture详情
  /fixture list                                列出所有Fixture
  /fixture load <id>                           加载Fixture
  /fixture remove <id>                         删除Fixture
  /fixture search <keyword>                    搜索Fixture
  /fixture create-set <name> <ids> [desc]      创建Fixture集
  /fixture load-set <set-id>                  加载Fixture集
  /fixture stats                               查看统计

类型: data, file, database, api`
  };
}

export { handle };
