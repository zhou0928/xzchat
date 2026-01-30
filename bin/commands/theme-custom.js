const ThemeCustomManager = require('../../lib/utils/theme-custom');

const themeCustomManager = new ThemeCustomManager();

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList();
    case 'update':
      return handleUpdate(params);
    case 'remove':
      return handleRemove(params);
    case 'use':
      return handleUse(params);
    case 'duplicate':
      return handleDuplicate(params);
    case 'import':
      return handleImport(params);
    case 'export':
      return handleExport(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /theme-custom add <name> <colors-json> <fonts-json> [description]' };
  }

  const [name, colorsStr, fontsStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let colors, fonts;
  try {
    colors = JSON.parse(colorsStr);
    fonts = fontsStr ? JSON.parse(fontsStr) : { family: 'system-ui', sizes: {} };
  } catch (err) {
    return { success: false, message: 'colors和fonts必须是有效的JSON' };
  }

  const theme = themeCustomManager.add(name, colors, fonts, description);

  return {
    success: true,
    message: `✅ 主题 "${name}" 已创建`,
    data: theme
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /theme-custom get <id>' };
  }

  const [id] = params;
  const theme = themeCustomManager.get(id);

  if (!theme) {
    return { success: false, message: `❌ 主题 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 主题 "${theme.name}"`,
    data: theme
  };
}

function handleList() {
  const themes = themeCustomManager.getAll();

  if (themes.length === 0) {
    return { success: true, message: '📭 暂无自定义主题', data: [] };
  }

  return {
    success: true,
    message: `📋 主题列表 (${themes.length}个)`,
    data: themes
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /theme-custom update <id> <key> <json-value>' };
  }

  const [id, key, ...valueParts] = params;
  const valueStr = valueParts.join(' ');

  let value;
  try {
    value = JSON.parse(valueStr);
  } catch (err) {
    value = valueStr;
  }

  const theme = themeCustomManager.update(id, { [key]: value });

  if (!theme) {
    return { success: false, message: `❌ 主题 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 主题 "${theme.name}" 已更新`,
    data: theme
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /theme-custom remove <id>' };
  }

  const [id] = params;
  const removed = themeCustomManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 主题 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 主题 "${removed.name}" 已删除`,
    data: removed
  };
}

function handleUse(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /theme-custom use <id>' };
  }

  const [id] = params;
  const theme = themeCustomManager.use(id);

  if (!theme) {
    return { success: false, message: `❌ 主题 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 已应用主题 "${theme.name}"`,
    data: theme
  };
}

function handleDuplicate(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /theme-custom duplicate <id> [new-name]' };
  }

  const [id, newName] = params;
  const duplicate = themeCustomManager.duplicate(id, newName);

  if (!duplicate) {
    return { success: false, message: `❌ 原主题 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 主题已复制为 "${duplicate.name}"`,
    data: duplicate
  };
}

function handleImport(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /theme-custom import <json-string>' };
  }

  const [jsonStr] = params;
  const result = themeCustomManager.import(jsonStr);

  return {
    success: result.success,
    message: result.message,
    data: result.data
  };
}

function handleExport(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /theme-custom export <id>' };
  }

  const [id] = params;
  const result = themeCustomManager.export(id);

  return {
    success: result.success,
    message: result.message,
    data: result.data
  };
}

function handleStats() {
  const stats = themeCustomManager.getStats();

  return {
    success: true,
    message: '📊 主题统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🎨 /theme-custom - 高级主题定制

用法:
  /theme-custom add <name> <colors> <fonts> [desc]    添加主题
  /theme-custom get <id>                               获取主题详情
  /theme-custom list                                   列出所有主题
  /theme-custom update <id> <key> <value>               更新主题
  /theme-custom remove <id>                             删除主题
  /theme-custom use <id>                                应用主题
  /theme-custom duplicate <id> [new-name]              复制主题
  /theme-custom import <json>                           导入主题
  /theme-custom export <id>                             导出主题
  /theme-custom stats                                   查看统计

colors格式: {"primary":"#007bff","background":"#ffffff"}
fonts格式: {"family":"Arial","sizes":{"small":"12px"}}`
  };
}

module.exports = { handle };
