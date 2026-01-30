import macroManager from '../../lib/utils/macro.js';

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
      case 'run':
        return await handleRun(rest);
      case 'search':
        return await handleSearch(rest[0]);
      case 'export':
        return await handleExport(rest[0], rest[1]);
      case 'import':
        return await handleImport(rest[0]);
      case 'validate':
        return await handleValidate(rest[0]);
      case 'stats':
        return await handleStats();
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleList() {
  const macros = await macroManager.list();
  
  let output = '🔧 宏列表\n\n';
  
  if (macros.length === 0) {
    output += '暂无宏。使用 /macro add 创建新宏。\n';
    return output;
  }

  macros.forEach(m => {
    output += `• ${m.name}\n`;
    output += `  描述: ${m.description}\n`;
    output += `  命令数: ${m.commands.length}\n`;
    output += `  参数: ${m.parameters.map(p => p.name).join(', ') || '无'}\n`;
    output += `  使用: ${m.usageCount} 次\n\n`;
  });

  output += `\n共 ${macros.length} 个宏`;
  return output.trim();
}

async function handleGet(name) {
  if (!name) {
    return '❌ 请指定宏名称\n用法: /macro get <name>';
  }

  const macro = await macroManager.get(name);
  
  if (!macro) {
    return `❌ 宏 "${name}" 不存在`;
  }

  let output = `🔧 宏: ${macro.name}\n\n`;
  output += `描述: ${macro.description}\n`;
  output += `使用: ${macro.usageCount} 次\n`;
  output += `创建: ${new Date(macro.createdAt).toLocaleString('zh-CN')}\n`;
  output += `更新: ${new Date(macro.updatedAt).toLocaleString('zh-CN')}\n\n`;
  
  output += '参数:\n';
  if (macro.parameters.length === 0) {
    output += '  无\n';
  } else {
    macro.parameters.forEach(p => {
      output += `  • ${p.name}: ${p.description || '无描述'}`;
      if (p.default !== undefined) {
        output += ` (默认: ${p.default})`;
      }
      output += '\n';
    });
  }
  
  output += '\n命令:\n';
  macro.commands.forEach((cmd, i) => {
    output += `  ${i + 1}. ${cmd}\n`;
  });

  return output.trim();
}

async function handleAdd(args) {
  const name = args[0];
  const description = args[1];
  
  if (!name) {
    return `❌ 用法: /macro add <名称> <描述> [--command "命令"] [--param 名称:描述]`;
  }

  const commands = [];
  const parameters = [];
  
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--command' && args[i + 1]) {
      commands.push(args[i + 1]);
      i++;
    } else if (args[i] === '--param' && args[i + 1]) {
      const [paramName, ...descParts] = args[i + 1].split(':');
      parameters.push({
        name: paramName,
        description: descParts.join(':')
      });
      i++;
    }
  }

  if (commands.length === 0) {
    return '❌ 至少需要一个命令';
  }

  const macro = await macroManager.add(name, description, commands, parameters);
  
  return `✅ 宏 "${name}" 创建成功！\n\n` +
         `命令: ${commands.length} 个\n` +
         `参数: ${parameters.length} 个\n\n` +
         `使用: /macro run ${name} [param1=value1 ...]`;
}

async function handleRemove(name) {
  if (!name) {
    return '❌ 请指定宏名称\n用法: /macro remove <name>';
  }

  await macroManager.remove(name);
  return `✅ 宏已删除`;
}

async function handleUpdate(args) {
  const [name, field, ...values] = args;
  
  if (!name || !field) {
    return '❌ 用法: /macro update <name> <field> <value>\n字段: description, command, param';
  }

  const updates = {};
  if (field === 'description') {
    updates.description = values.join(' ');
  } else if (field === 'command') {
    const action = values[0];
    const commandValue = values[1];
    const macro = await macroManager.get(name);
    
    if (action === 'add' && commandValue) {
      updates.commands = [...macro.commands, commandValue];
    } else if (action === 'remove' && commandValue) {
      updates.commands = macro.commands.filter(c => c !== commandValue);
    } else if (action === 'set' && commandValue) {
      updates.commands = [commandValue];
    }
  } else if (field === 'param') {
    const action = values[0];
    const paramValue = values[1];
    const macro = await macroManager.get(name);
    
    if (action === 'add' && paramValue) {
      const [paramName, ...descParts] = paramValue.split(':');
      updates.parameters = [...macro.parameters, { name: paramName, description: descParts.join(':') }];
    } else if (action === 'remove' && paramValue) {
      updates.parameters = macro.parameters.filter(p => p.name !== paramValue);
    }
  } else {
    return `❌ 不支持的字段: ${field}`;
  }

  const macro = await macroManager.update(name, updates);
  return `✅ 宏更新成功！`;
}

async function handleRun(args) {
  const name = args[0];
  if (!name) {
    return '❌ 请指定宏名称\n用法: /macro run <name> [param1=value1 ...]';
  }

  const params = {};
  for (let i = 1; i < args.length; i++) {
    const [key, ...values] = args[i].split('=');
    if (key) {
      params[key] = values.join('=');
    }
  }

  const result = await macroManager.execute(name, params);
  
  let output = `🚀 执行宏: ${result.name}\n\n`;
  output += '命令:\n';
  result.commands.forEach((cmd, i) => {
    output += `  ${i + 1}. ${cmd}\n`;
  });
  
  output += '\n提示: 需要手动执行这些命令';
  return output;
}

async function handleSearch(query) {
  if (!query) {
    return '❌ 请指定搜索关键词\n用法: /macro search <关键词>';
  }

  const macros = await macroManager.search(query);
  
  let output = `🔍 搜索结果: "${query}"\n\n`;
  
  if (macros.length === 0) {
    output += '未找到匹配的宏。\n';
    return output;
  }

  macros.forEach(m => {
    output += `• ${m.name}\n`;
    output += `  ${m.description}\n\n`;
  });

  output += `\n共 ${macros.length} 个结果`;
  return output.trim();
}

async function handleExport(name, format) {
  format = format || 'json';
  const content = await macroManager.export(name, format);
  
  return `📤 宏导出 (${format})\n\n\`\`\`${format}\n${content}\n\`\`\``;
}

async function handleImport(filePath) {
  if (!filePath) {
    return '❌ 请指定文件路径\n用法: /macro import <file.json>';
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const count = await macroManager.import(content);

  return `✅ 成功导入 ${count} 个宏！`;
}

async function handleValidate(name) {
  if (!name) {
    return '❌ 请指定宏名称\n用法: /macro validate <name>';
  }

  const result = await macroManager.validate(name);

  let output = `🔍 验证宏: ${name}\n\n`;
  output += `状态: ${result.valid ? '✅ 通过' : '❌ 失败'}\n\n`;

  if (result.errors.length > 0) {
    output += '错误:\n';
    result.errors.forEach(err => {
      output += `  ❌ ${err}\n`;
    });
    output += '\n';
  }

  if (result.warnings.length > 0) {
    output += '警告:\n';
    result.warnings.forEach(warn => {
      output += `  ⚠️  ${warn}\n`;
    });
  }

  return output.trim();
}

async function handleStats() {
  const stats = await macroManager.getStats();
  
  let output = '📊 宏统计\n\n';
  output += `总数: ${stats.total}\n`;
  output += `总使用: ${stats.totalUsage} 次\n\n`;
  
  if (stats.mostUsed.length > 0) {
    output += '最常用:\n';
    stats.mostUsed.forEach((m, i) => {
      output += `  ${i + 1}. ${m.name}: ${m.usageCount} 次\n`;
    });
  }

  return output.trim();
}

function showHelp() {
  return `🔧 命令别名（宏）

用法:
  /macro list                      列出所有宏
  /macro get <name>                查看宏详情
  /macro add <名称> <描述>         创建宏
    选项: --command "命令" --param 名称:描述
  /macro remove <name>             删除宏
  /macro update <name> <field>     更新宏
    字段: description, command, param
  /macro run <name> [参数=值]      执行宏
  /macro search <关键词>           搜索宏
  /macro export [name] [format]    导出宏 (json/text)
  /macro import <file>             导入宏
  /macro validate <name>           验证宏
  /macro stats                     统计信息

参数格式:
  • ${paramName}  - 在命令中使用
  • --param 名称:描述 - 定义参数

示例:
  /macro add review "代码审查" --command "/git diff --cached" --command "/review"
  /macro run review
  /macro update review command add "/commit"
  /macro export review`;
}
