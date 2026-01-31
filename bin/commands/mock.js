import { MockManager } from '../../lib/utils/mock.js';

const mockManager = new MockManager();

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList();
    case 'generate':
      return handleGenerate(params);
    case 'use':
      return handleUse(params);
    case 'remove':
      return handleRemove(params);
    case 'search':
      return handleSearch(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /mock add <name> <type> <data-json>' };
  }

  const [name, type, dataStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let data;
  try {
    data = JSON.parse(dataStr);
  } catch (err) {
    return { success: false, message: 'data必须是有效的JSON' };
  }

  const mock = mockManager.add(name, type, data, description);

  return {
    success: true,
    message: `✅ Mock "${name}" 已创建`,
    data: mock
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /mock get <id>' };
  }

  const [id] = params;
  const mock = mockManager.get(id);

  if (!mock) {
    return { success: false, message: `❌ Mock "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Mock "${mock.name}"`,
    data: mock
  };
}

function handleList() {
  const mocks = mockManager.getAll();

  if (mocks.length === 0) {
    return { success: true, message: '📭 暂无Mock数据', data: [] };
  }

  return {
    success: true,
    message: `📋 Mock列表 (${mocks.length}个)`,
    data: mocks
  };
}

function handleGenerate(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /mock generate <type> [config-json]' };
  }

  const [type, configStr] = params;

  let config = {};
  if (configStr) {
    try {
      config = JSON.parse(configStr);
    } catch (err) {
      return { success: false, message: 'config必须是有效的JSON' };
    }
  }

  const data = mockManager.generate(type, config);

  return {
    success: true,
    message: `✅ 已生成${type}类型的Mock数据`,
    data
  };
}

function handleUse(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /mock use <id>' };
  }

  const [id] = params;
  const mock = mockManager.use(id);

  if (!mock) {
    return { success: false, message: `❌ Mock "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Mock "${mock.name}" 已使用`,
    data: mock
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /mock remove <id>' };
  }

  const [id] = params;
  const removed = mockManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ Mock "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ Mock "${removed.name}" 已删除`,
    data: removed
  };
}

function handleSearch(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /mock search <keyword>' };
  }

  const [keyword] = params;
  const mocks = mockManager.search(keyword);

  if (mocks.length === 0) {
    return { success: true, message: `📭 未找到匹配的Mock`, data: [] };
  }

  return {
    success: true,
    message: `📋 搜索结果 (${mocks.length}个)`,
    data: mocks
  };
}

function handleStats() {
  const stats = mockManager.getStats();

  return {
    success: true,
    message: '📊 Mock统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🎭 /mock - Mock数据管理

用法:
  /mock add <name> <type> <data> [desc]     添加Mock
  /mock get <id>                            获取Mock详情
  /mock list                                列出所有Mock
  /mock generate <type> [config]           生成Mock数据
  /mock use <id>                            使用Mock
  /mock remove <id>                         删除Mock
  /mock search <keyword>                    搜索Mock
  /mock stats                               查看统计

类型: response, error, stream, function`
  };
}

module.exports = { handle };
