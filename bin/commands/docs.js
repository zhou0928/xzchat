import docsManager from '../../lib/utils/docs.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList(params);
    case 'view':
      return handleView(params);
    case 'update':
      return handleUpdate(params);
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
    return { success: false, message: '用法: /docs add <title> <content> [category] [tags]' };
  }

  const [title, ...contentParts] = params;
  let category = 'general';
  let tags = [];

  // Parse category and tags from params
  const contentMatch = contentParts.join(' ').match(/^"(.+)"\s*(\w*)?\s*(.*)?$/);
  if (contentMatch) {
    const content = contentMatch[1];
    if (contentMatch[2]) category = contentMatch[2];
    if (contentMatch[3]) tags = contentMatch[3].split(',').map(t => t.trim());

    const doc = docsManager.add(title, content, category, tags);

    return {
      success: true,
      message: `✅ 文档 "${title}" 已创建`,
      data: doc
    };
  }

  return { success: false, message: '格式错误，使用: /docs add <title> "<content>" [category] [tag1,tag2]' };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /docs get <id>' };
  }

  const [id] = params;
  const doc = docsManager.get(id);

  if (!doc) {
    return { success: false, message: `❌ 文档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 文档 "${doc.title}"`,
    data: doc
  };
}

function handleList(params) {
  const [category] = params;
  const docs = category
    ? docsManager.getByCategory(category)
    : docsManager.getAll();

  if (docs.length === 0) {
    return { success: true, message: '📭 暂无文档', data: [] };
  }

  return {
    success: true,
    message: `📋 文档列表 (${docs.length}个)`,
    data: docs
  };
}

function handleView(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /docs view <id>' };
  }

  const [id] = params;
  const doc = docsManager.view(id);

  if (!doc) {
    return { success: false, message: `❌ 文档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 文档 "${doc.title}" (查看次数: ${doc.viewCount})`,
    data: doc
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /docs update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const doc = docsManager.update(id, { [key]: value });

  if (!doc) {
    return { success: false, message: `❌ 文档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 文档 "${doc.title}" 已更新`,
    data: doc
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /docs remove <id>' };
  }

  const [id] = params;
  const removed = docsManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 文档 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 文档 "${removed.title}" 已删除`,
    data: removed
  };
}

function handleSearch(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /docs search <keyword>' };
  }

  const [keyword] = params;
  const docs = docsManager.search(keyword);

  if (docs.length === 0) {
    return { success: true, message: `📭 未找到匹配的文档`, data: [] };
  }

  return {
    success: true,
    message: `📋 搜索结果 (${docs.length}个)`,
    data: docs
  };
}

function handleStats() {
  const stats = docsManager.getStats();

  return {
    success: true,
    message: '📊 文档统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📚 /docs - 文档管理

用法:
  /docs add <title> "<content>" [category] [tags]    添加文档
  /docs get <id>                                      获取文档详情
  /docs list [category]                               列出所有文档
  /docs view <id>                                     查看文档
  /docs update <id> <key> <value>                    更新文档
  /docs remove <id>                                   删除文档
  /docs search <keyword>                              搜索文档
  /docs stats                                         查看统计

分类: general, api, tutorial, guide, reference`
  };
}

module.exports = { handle };
