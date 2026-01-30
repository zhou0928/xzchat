import cronManager from '../../lib/utils/cron.js';

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
      case 'presets':
        return await handlePresets();
      case 'logs':
        return await handleLogs(rest[0]);
      case 'export':
        return await handleExport(rest[0]);
      case 'import':
        return await handleImport(rest[0]);
      case 'active':
        return await handleActive();
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleList() {
  const tasks = await cronManager.list();
  
  let output = '⏰ 定时任务列表\n\n';
  
  if (tasks.length === 0) {
    output += '暂无定时任务。使用 /cron add 创建新任务。\n';
    return output;
  }

  tasks.forEach(task => {
    const statusIcon = task.enabled ? '✅' : '⏸️';
    output += `${statusIcon} ${task.id}\n`;
    output += `  名称: ${task.name}\n`;
    output += `  表达式: ${task.expression}\n`;
    output += `  命令: ${task.command}\n`;
    if (task.nextRun) {
      output += `  下次运行: ${new Date(task.nextRun).toLocaleString('zh-CN')}\n`;
    }
    output += '\n';
  });

  return output.trim();
}

async function handleGet(id) {
  if (!id) {
    return '❌ 请指定任务 ID\n用法: /cron get <id>';
  }

  const task = await cronManager.get(id);
  
  if (!task) {
    return `❌ 任务 "${id}" 不存在`;
  }

  let output = `⏰ 定时任务: ${task.name}\n\n`;
  output += `ID: ${task.id}\n`;
  output += `描述: ${task.description || '无'}\n`;
  output += `表达式: ${task.expression}\n`;
  output += `命令: ${task.command}\n`;
  output += `状态: ${task.enabled ? '✅ 启用' : '⏸️ 禁用'}\n`;
  output += `创建: ${new Date(task.createdAt).toLocaleString('zh-CN')}\n`;
  output += `上次运行: ${task.lastRun ? new Date(task.lastRun).toLocaleString('zh-CN') : '从未'}\n`;
  output += `下次运行: ${task.nextRun ? new Date(task.nextRun).toLocaleString('zh-CN') : '未安排'}`;

  if (task.lastError) {
    output += `\n\n❌ 上次错误: ${task.lastError}`;
  }

  return output;
}

async function handleAdd(args) {
  const id = args[0];
  const name = args[1];
  const expression = args[2];
  const command = args[3];
  const description = args.slice(4).join(' ');
  
  if (!id || !name || !expression || !command) {
    return `❌ 用法: /cron add <id> <名称> <表达式> <命令> [描述]
示例: /cron add backup "每日备份" "0 2 * * *" "/backup run"
别名: @daily, @hourly, @weekly`;
  }

  const expr = cronManager.parseFriendlyExpression(expression);
  const task = await cronManager.add(id, name, expr, command, description);
  
  return `✅ 定时任务 "${name}" 创建成功！\n\n` +
         `表达式: ${task.expression}\n` +
         `下次运行: ${new Date(task.nextRun).toLocaleString('zh-CN')}`;
}

async function handleRemove(id) {
  if (!id) {
    return '❌ 请指定任务 ID\n用法: /cron remove <id>';
  }

  await cronManager.remove(id);
  return `✅ 定时任务已删除`;
}

async function handleUpdate(args) {
  const [id, field, ...values] = args;
  
  if (!id || !field) {
    return '❌ 用法: /cron update <id> <field> <value>\n字段: name, expression, command, description';
  }

  const updates = {};
  if (field === 'name') {
    updates.name = values.join(' ');
  } else if (field === 'expression') {
    updates.expression = cronManager.parseFriendlyExpression(values.join(' '));
  } else if (field === 'command') {
    updates.command = values.join(' ');
  } else if (field === 'description') {
    updates.description = values.join(' ');
  } else {
    return `❌ 不支持的字段: ${field}`;
  }

  const task = await cronManager.update(id, updates);
  return `✅ 定时任务更新成功！`;
}

async function handleEnable(id) {
  if (!id) {
    return '❌ 请指定任务 ID\n用法: /cron enable <id>';
  }

  const task = await cronManager.enable(id);
  return `✅ 定时任务已启用\n下次运行: ${new Date(task.nextRun).toLocaleString('zh-CN')}`;
}

async function handleDisable(id) {
  if (!id) {
    return '❌ 请指定任务 ID\n用法: /cron disable <id>';
  }

  await cronManager.disable(id);
  return `✅ 定时任务已禁用`;
}

async function handlePresets() {
  const presets = cronManager.getPresets();
  
  let output = '📋 预设模板\n\n';
  
  Object.entries(presets).forEach(([id, preset]) => {
    output += `• ${id}\n`;
    output += `  名称: ${preset.name}\n`;
    output += `  表达式: ${preset.expression}\n`;
    output += `  描述: ${preset.description}\n\n`;
  });

  output += '\n使用示例: /cron add backup "每日备份" "0 2 * * *" "/backup run"';
  return output.trim();
}

async function handleLogs(id) {
  const logs = await cronManager.getExecutionLogs(id);
  
  let output = id ? `📋 任务日志: ${id}\n\n` : '📋 所有日志\n\n';
  
  if (logs.length === 0) {
    output += '暂无日志记录。\n';
    return output;
  }

  logs.forEach(log => {
    const icon = log.status === 'success' ? '✅' : '❌';
    output += `${icon} ${log.taskName}\n`;
    output += `  时间: ${new Date(log.executedAt).toLocaleString('zh-CN')}\n`;
    output += `  命令: ${log.command}\n`;
    if (log.error) {
      output += `  错误: ${log.error}\n`;
    }
    output += '\n';
  });

  return output.trim();
}

async function handleExport(format = 'json') {
  const content = await cronManager.export(format);
  return `📤 定时任务导出 (${format})\n\n\`\`\`${format}\n${content}\n\`\`\``;
}

async function handleImport(filePath) {
  if (!filePath) {
    return '❌ 请指定文件路径\n用法: /cron import <file.json>';
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const count = await cronManager.import(content);

  return `✅ 成功导入 ${count} 个定时任务！`;
}

async function handleActive() {
  const jobs = cronManager.getActiveJobs();
  
  let output = '🏃 活跃任务\n\n';
  
  if (jobs.length === 0) {
    output += '暂无活跃任务。\n';
    return output;
  }

  jobs.forEach(job => {
    output += `• ${job.id}\n`;
    output += `  名称: ${job.name}\n`;
    output += `  间隔: ${job.interval}\n\n`;
  });

  return output.trim();
}

function showHelp() {
  return `⏰ 定时任务管理 (类似 Linux crontab)

用法:
  /cron list                    列出所有任务
  /cron get <id>                查看任务详情
  /cron add <id> <名称> <表达式> <命令> [描述]  创建任务
  /cron remove <id>             删除任务
  /cron update <id> <field>     更新任务
    字段: name, expression, command, description
  /cron enable <id>             启用任务
  /cron disable <id>            禁用任务
  /cron presets                 查看预设模板
  /cron logs [id]               查看执行日志
  /cron export [format]         导出任务 (json/crontab)
  /cron import <file>           导入任务
  /cron active                  查看活跃任务

Cron 表达式格式: * * * * *
  分 时 日 月 周
  * 表示任意
  */n 表示每 n 单位
  1-5 表示范围
  1,3,5 表示列表

预设别名:
  @yearly    - 每年 (0 0 1 1 *)
  @monthly   - 每月 (0 0 1 * *)
  @weekly    - 每周 (0 0 * * 0)
  @daily     - 每天 (0 0 * * *)
  @hourly    - 每小时 (0 * * * *)
  @minutely  - 每分钟 (* * * * *)

示例:
  /cron add daily-report "每日报告" "0 9 * * *" "/workflow run daily-report"
  /cron add backup "备份" "@daily" "/backup run"
  /cron add cleanup "清理" "0 3 * * *" "/cleanup"
  /cron enable daily-report`;
}
