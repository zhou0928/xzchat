import watchManager from '../../lib/utils/watch.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'list':
        return await handleList();
      case 'get':
        return await handleGet(rest[0]);
      case 'add':
        return await handleAdd(rest);
      case 'remove':
        return await handleRemove(rest[0]);
      case 'update':
        return await handleUpdate(rest);
      case 'enable':
        return await handleEnable(rest[0]);
      case 'disable':
        return await handleDisable(rest[0]);
      case 'active':
        return await handleActive();
      case 'diff':
        return await handleDiff(rest[0], rest[1]);
      case 'logs':
        return await handleLogs(rest[0]);
      case 'export':
        return await handleExport();
      case 'import':
        return await handleImport(rest[0]);
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleList() {
  const watches = await watchManager.list();
  
  let output = '👁️  文件监控列表\n\n';
  
  if (watches.length === 0) {
    output += '暂无监控。使用 /watch add 创建新监控。\n';
    return output;
  }

  watches.forEach(w => {
    const statusIcon = w.enabled ? '✅' : '⏸️';
    output += `${statusIcon} ${w.id}\n`;
    output += `  路径: ${w.targetPath}\n`;
    output += `  命令: ${w.command}\n`;
    output += `  事件: ${w.eventType}\n`;
    output += `  触发次数: ${w.triggerCount}\n`;
    if (w.lastTriggered) {
      output += `  上次触发: ${new Date(w.lastTriggered).toLocaleString('zh-CN')}\n`;
    }
    output += '\n';
  });

  return output.trim();
}

async function handleGet(id) {
  if (!id) {
    return '❌ 请指定监控 ID\n用法: /watch get <id>';
  }

  const watch = await watchManager.get(id);
  
  if (!watch) {
    return `❌ 监控 "${id}" 不存在`;
  }

  let output = `👁️  文件监控: ${watch.id}\n\n`;
  output += `路径: ${watch.targetPath}\n`;
  output += `命令: ${watch.command}\n`;
  output += `事件类型: ${watch.eventType}\n`;
  output += `状态: ${watch.enabled ? '✅ 启用' : '⏸️ 禁用'}\n`;
  output += `防抖延迟: ${watch.debounceMs}ms\n`;
  output += `触发次数: ${watch.triggerCount}\n`;
  output += `创建: ${new Date(watch.createdAt).toLocaleString('zh-CN')}\n`;
  if (watch.lastTriggered) {
    output += `上次触发: ${new Date(watch.lastTriggered).toLocaleString('zh-CN')}\n`;
  }

  return output;
}

async function handleAdd(args) {
  const id = args[0];
  const targetPath = args[1];
  const command = args[2];
  
  if (!id || !targetPath || !command) {
    return `❌ 用法: /watch add <id> <路径> <命令> [--event 类型] [--delay 毫秒]`;
  }

  const options = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i] === '--event' && args[i + 1]) {
      options.eventType = args[i + 1];
      i++;
    } else if (args[i] === '--delay' && args[i + 1]) {
      options.debounceMs = parseInt(args[i + 1]);
      i++;
    }
  }

  const watch = await watchManager.add(id, targetPath, command, options);
  
  return `✅ 监控 "${id}" 创建成功！\n\n` +
         `路径: ${watch.targetPath}\n` +
         `命令: ${watch.command}\n` +
         `事件: ${watch.eventType}\n` +
         `状态: ${watch.enabled ? '已启动' : '已暂停'}`;
}

async function handleRemove(id) {
  if (!id) {
    return '❌ 请指定监控 ID\n用法: /watch remove <id>';
  }

  await watchManager.remove(id);
  return `✅ 监控已删除`;
}

async function handleUpdate(args) {
  const [id, field, ...values] = args;
  
  if (!id || !field) {
    return '❌ 用法: /watch update <id> <field> <value>\n字段: command, event, delay';
  }

  const updates = {};
  if (field === 'command') {
    updates.command = values.join(' ');
  } else if (field === 'event') {
    updates.eventType = values[0];
  } else if (field === 'delay') {
    updates.debounceMs = parseInt(values[0]);
  } else {
    return `❌ 不支持的字段: ${field}`;
  }

  const watch = await watchManager.update(id, updates);
  return `✅ 监控更新成功！`;
}

async function handleEnable(id) {
  if (!id) {
    return '❌ 请指定监控 ID\n用法: /watch enable <id>';
  }

  const watch = await watchManager.enable(id);
  return `✅ 监控已启用`;
}

async function handleDisable(id) {
  if (!id) {
    return '❌ 请指定监控 ID\n用法: /watch disable <id>';
  }

  await watchManager.disable(id);
  return `✅ 监控已禁用`;
}

async function handleActive() {
  const active = watchManager.getActiveWatches();
  
  let output = '🏃 活跃监控\n\n';
  
  if (active.length === 0) {
    output += '暂无活跃监控。\n';
    return output;
  }

  active.forEach(w => {
    output += `• ${w.id}\n`;
    output += `  路径: ${w.targetPath}\n`;
    output += `  命令: ${w.command}\n`;
    output += `  触发次数: ${w.triggerCount}\n\n`;
  });

  return output.trim();
}

async function handleDiff(file1, file2) {
  if (!file1 || !file2) {
    return '❌ 用法: /watch diff <文件1> <文件2>';
  }

  const diff = await watchManager.diff(file1, file2);
  
  let output = `📊 文件对比: ${file1} vs ${file2}\n\n`;
  
  diff.forEach(d => {
    if (d.type === 'equal') {
      output += `  ${d.line}: ${d.content}\n`;
    } else if (d.type === 'add') {
      output += `+ ${d.line}: ${d.content}\n`;
    } else if (d.type === 'remove') {
      output += `- ${d.line}: ${d.content}\n`;
    } else if (d.type === 'change') {
      output += `- ${d.line}: ${d.old}\n`;
      output += `+ ${d.line}: ${d.new}\n`;
    }
  });

  return output.trim();
}

async function handleLogs(id) {
  if (!id) {
    return '❌ 请指定监控 ID\n用法: /watch logs <id>';
  }

  const logs = await watchManager.getLogs(id);
  
  let output = `📋 监控日志: ${logs.id}\n\n`;
  output += `状态: ${logs.enabled ? '✅ 启用' : '⏸️ 禁用'}\n`;
  output += `触发次数: ${logs.triggerCount}\n`;
  output += `创建: ${new Date(logs.createdAt).toLocaleString('zh-CN')}\n`;
  if (logs.lastTriggered) {
    output += `上次触发: ${new Date(logs.lastTriggered).toLocaleString('zh-CN')}\n`;
  }

  return output;
}

async function handleExport() {
  const content = await watchManager.exportConfig();
  return `📤 监控配置导出\n\n\`\`\`json\n${content}\n\`\`\``;
}

async function handleImport(filePath) {
  if (!filePath) {
    return '❌ 请指定文件路径\n用法: /watch import <file.json>';
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const count = await watchManager.importConfig(content);

  return `✅ 成功导入 ${count} 个监控配置！`;
}

function showHelp() {
  return `👁️  文件监控

用法:
  /watch list                    列出所有监控
  /watch get <id>                查看监控详情
  /watch add <id> <路径> <命令>  创建监控
    选项: --event all/change/rename/unlink --delay 毫秒
  /watch remove <id>             删除监控
  /watch update <id> <field>     更新监控
    字段: command, event, delay
  /watch enable <id>             启用监控
  /watch disable <id>            禁用监控
  /watch active                  查看活跃监控
  /watch diff <文件1> <文件2>    文件差异对比
  /watch logs <id>               查看监控日志
  /watch export                  导出配置
  /watch import <file>           导入配置

变量:
  • {{path}}  - 监控路径
  • {{file}}  - 变化的文件
  • {{event}} - 事件类型
  • {{timestamp}} - 时间戳

示例:
  /watch add config-watch .env "/env reload" --event change
  /watch add test-watch src "/test run" --delay 2000
  /watch enable config-watch
  /watch diff old.txt new.txt
  /watch logs config-watch`;
}
