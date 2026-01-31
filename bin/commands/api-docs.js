import { ApiDocsManager } from '../../lib/utils/api-docs.js';

const apiDocsManager = new ApiDocsManager();

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
    case 'search':
      return handleSearch(params);
    case 'export':
      return handleExport();
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 3) {
    return { success: false, message: '用法: /api-docs add <name> <method> <path> [description]' };
  }

  const [name, method, apiPath, ...descParts] = params;
  const description = descParts.join(' ') || '';

  const api = apiDocsManager.add(name, method, apiPath, description);

  return {
    success: true,
    message: `✅ API文档 "${name}" 已创建`,
    data: api
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /api-docs get <id>' };
  }

  const [id] = params;
  const api = apiDocsManager.get(id);

  if (!api) {
    return { success: false, message: `❌ API文档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ API文档 "${api.name}"`,
    data: api
  };
}

function handleList(params) {
  const [method] = params;
  const apis = method
    ? apiDocsManager.getByMethod(method)
    : apiDocsManager.getAll();

  if (apis.length === 0) {
    return { success: true, message: '📭 暂无API文档', data: [] };
  }

  return {
    success: true,
    message: `📋 API文档列表 (${apis.length}个)`,
    data: apis
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /api-docs update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const api = apiDocsManager.update(id, { [key]: value });

  if (!api) {
    return { success: false, message: `❌ API文档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ API文档 "${api.name}" 已更新`,
    data: api
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /api-docs remove <id>' };
  }

  const [id] = params;
  const removed = apiDocsManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ API文档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ API文档 "${removed.name}" 已删除`,
    data: removed
  };
}

function handleSearch(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /api-docs search <keyword>' };
  }

  const [keyword] = params;
  const apis = apiDocsManager.search(keyword);

  if (apis.length === 0) {
    return { success: true, message: `📭 未找到匹配的API文档`, data: [] };
  }

  return {
    success: true,
    message: `📋 搜索结果 (${apis.length}个)`,
    data: apis
  };
}

function handleExport() {
  const openapi = apiDocsManager.exportOpenAPI();

  return {
    success: true,
    message: `✅ OpenAPI文档已导出`,
    data: openapi
  };
}

function handleStats() {
  const stats = apiDocsManager.getStats();

  return {
    success: true,
    message: '📊 API文档统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📖 /api-docs - API文档管理

用法:
  /api-docs add <name> <method> <path> [desc]    添加API文档
  /api-docs get <id>                            获取API详情
  /api-docs list [method]                        列出所有API
  /api-docs update <id> <key> <value>            更新API文档
  /api-docs remove <id>                         删除API文档
  /api-docs search <keyword>                    搜索API
  /api-docs export                               导出OpenAPI
  /api-docs stats                                查看统计

方法: GET, POST, PUT, DELETE, PATCH等`
  };
}

module.exports = { handle };
