const LayoutManager = require('../../lib/utils/layout');

const layoutManager = new LayoutManager();

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
    case 'set':
      return handleSetActive(params);
    case 'get-active':
      return handleGetActive();
    case 'add-component':
      return handleAddComponent(params);
    case 'remove-component':
      return handleRemoveComponent(params);
    case 'move-component':
      return handleMoveComponent(params);
    case 'resize-component':
      return handleResizeComponent(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /layout add <name> <components-json> [description]' };
  }

  const [name, componentsStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let components;
  try {
    components = componentsStr ? JSON.parse(componentsStr) : [];
  } catch (err) {
    return { success: false, message: 'components必须是有效的JSON数组' };
  }

  const layout = layoutManager.add(name, components, description);

  return {
    success: true,
    message: `✅ 布局 "${name}" 已创建`,
    data: layout
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /layout get <id>' };
  }

  const [id] = params;
  const layout = layoutManager.get(id);

  if (!layout) {
    return { success: false, message: `❌ 布局 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 布局 "${layout.name}"`,
    data: layout
  };
}

function handleList() {
  const layouts = layoutManager.getAll();

  if (layouts.length === 0) {
    return { success: true, message: '📭 暂无布局', data: [] };
  }

  return {
    success: true,
    message: `📋 布局列表 (${layouts.length}个)`,
    data: layouts
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /layout update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const layout = layoutManager.update(id, { [key]: value });

  if (!layout) {
    return { success: false, message: `❌ 布局 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 布局 "${layout.name}" 已更新`,
    data: layout
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /layout remove <id>' };
  }

  const [id] = params;
  const removed = layoutManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 布局 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 布局 "${removed.name}" 已删除`,
    data: removed
  };
}

function handleSetActive(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /layout set <id>' };
  }

  const [id] = params;
  const layout = layoutManager.setActive(id);

  if (!layout) {
    return { success: false, message: `❌ 布局 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 已激活布局 "${layout.name}"`,
    data: layout
  };
}

function handleGetActive() {
  const layout = layoutManager.getActive();

  if (!layout) {
    return { success: false, message: '📭 暂无激活的布局' };
  }

  return {
    success: true,
    message: `✅ 当前布局 "${layout.name}"`,
    data: layout
  };
}

function handleAddComponent(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /layout add-component <layout-id> <component-json>' };
  }

  const [layoutId, componentStr] = params;

  let component;
  try {
    component = JSON.parse(componentStr);
  } catch (err) {
    return { success: false, message: 'component必须是有效的JSON' };
  }

  const layout = layoutManager.addComponent(layoutId, component);

  if (!layout) {
    return { success: false, message: `❌ 布局 "${layoutId}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 组件已添加到布局 "${layout.name}"`,
    data: layout
  };
}

function handleRemoveComponent(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /layout remove-component <layout-id> <component-id>' };
  }

  const [layoutId, componentId] = params;
  const layout = layoutManager.removeComponent(layoutId, componentId);

  if (!layout) {
    return { success: false, message: `❌ 布局 "${layoutId}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 组件已从布局 "${layout.name}" 移除`,
    data: layout
  };
}

function handleMoveComponent(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /layout move-component <layout-id> <component-id> <position-json>' };
  }

  const [layoutId, componentId, positionStr] = params;

  let position;
  try {
    position = JSON.parse(positionStr);
  } catch (err) {
    return { success: false, message: 'position必须是有效的JSON' };
  }

  const layout = layoutManager.moveComponent(layoutId, componentId, position);

  if (!layout) {
    return { success: false, message: `❌ 布局 "${layoutId}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 组件已移动`,
    data: layout
  };
}

function handleResizeComponent(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /layout resize-component <layout-id> <component-id> <size-json>' };
  }

  const [layoutId, componentId, sizeStr] = params;

  let size;
  try {
    size = JSON.parse(sizeStr);
  } catch (err) {
    return { success: false, message: 'size必须是有效的JSON' };
  }

  const layout = layoutManager.resizeComponent(layoutId, componentId, size);

  if (!layout) {
    return { success: false, message: `❌ 布局 "${layoutId}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 组件大小已调整`,
    data: layout
  };
}

function handleStats() {
  const stats = layoutManager.getStats();

  return {
    success: true,
    message: '📊 布局统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📐 /layout - 界面布局管理

用法:
  /layout add <name> <components> [desc]              添加布局
  /layout get <id>                                     获取布局详情
  /layout list                                         列出所有布局
  /layout update <id> <key> <value>                    更新布局
  /layout remove <id>                                   删除布局
  /layout set <id>                                      激活布局
  /layout get-active                                    获取当前布局
  /layout add-component <id> <component>               添加组件
  /layout remove-component <id> <comp-id>              移除组件
  /layout move-component <id> <comp-id> <pos>          移动组件
  /layout resize-component <id> <comp-id> <size>      调整组件
  /layout stats                                         查看统计

components格式: [{"id":"c1","type":"panel","position":{...}}]`
  };
}

module.exports = { handle };
