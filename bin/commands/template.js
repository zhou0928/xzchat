import templateManager from '../../lib/utils/template.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'list':
        return await handleList(rest);
      case 'get':
        return await handleGet(rest[0]);
      case 'add':
        return await handleAdd(rest);
      case 'remove':
        return await handleRemove(rest[0]);
      case 'update':
        return await handleUpdate(rest);
      case 'use':
        return await handleUse(rest);
      case 'preview':
        return await handlePreview(rest);
      case 'categories':
        return await handleCategories();
      case 'tags':
        return await handleTags();
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

async function handleList(args) {
  const filter = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      filter.category = args[i + 1];
      i++;
    } else if (args[i] === '--tag' && args[i + 1]) {
      filter.tag = args[i + 1];
      i++;
    }
  }

  const templates = await templateManager.list(filter);
  
  let output = '📄 模板列表\n\n';
  
  if (templates.length === 0) {
    output += '暂无模板。使用 /template add 创建新模板。\n';
    return output;
  }

  templates.forEach(tpl => {
    output += `• ${tpl.id} - ${tpl.name}\n`;
    output += `  分类: ${tpl.category}\n`;
    output += `  描述: ${tpl.description}\n`;
    output += `  标签: ${tpl.tags.join(', ') || '无'}\n`;
    output += `  变量: ${tpl.variables.join(', ') || '无'}\n\n`;
  });

  output += `\n共 ${templates.length} 个模板`;
  return output.trim();
}

async function handleGet(id) {
  if (!id) {
    return '❌ 请指定模板 ID\n用法: /template get <id>';
  }

  const template = await templateManager.get(id);
  
  if (!template) {
    return `❌ 模板 "${id}" 不存在`;
  }

  let output = `📄 模板: ${template.name}\n\n`;
  output += `ID: ${id}\n`;
  output += `分类: ${template.category}\n`;
  output += `描述: ${template.description}\n`;
  output += `标签: ${template.tags.join(', ') || '无'}\n`;
  output += `变量: ${template.variables.join(', ') || '无'}\n`;
  output += `创建: ${new Date(template.createdAt).toLocaleString('zh-CN')}\n\n`;
  output += '---\n\n';
  output += '提示词:\n';
  output += '```' + '\n' + template.prompt + '\n' + '```';

  return output.trim();
}

async function handleAdd(args) {
  const id = args[0];
  const name = args[1];
  const category = args[2];
  const prompt = args[3];
  
  if (!id || !name || !category || !prompt) {
    return `❌ 用法: /template add <id> <名称> <分类> <提示词> [--var 变量名] [--tag 标签]`;
  }

  const options = {};
  options.variables = [];
  options.tags = [];
  
  for (let i = 4; i < args.length; i++) {
    if (args[i] === '--var' && args[i + 1]) {
      options.variables.push(args[i + 1]);
      i++;
    } else if (args[i] === '--tag' && args[i + 1]) {
      options.tags.push(args[i + 1]);
      i++;
    }
  }

  const template = await templateManager.add(id, name, category, prompt, options.variables, '', options.tags);
  
  return `✅ 模板 "${name}" 创建成功！\n\nID: ${id}\n变量: ${template.variables.join(', ') || '无'}`;
}

async function handleRemove(id) {
  if (!id) {
    return '❌ 请指定模板 ID\n用法: /template remove <id>';
  }

  await templateManager.remove(id);
  return `✅ 模板已删除`;
}

async function handleUpdate(args) {
  const [id, field, ...values] = args;
  
  if (!id || !field) {
    return '❌ 用法: /template update <id> <field> <value>\n字段: name, category, prompt, var, tag';
  }

  const updates = {};
  
  if (field === 'name') {
    updates.name = values.join(' ');
  } else if (field === 'category') {
    updates.category = values.join(' ');
  } else if (field === 'prompt') {
    updates.prompt = values.join(' ');
  } else if (field === 'var') {
    // 添加或移除变量
    const action = values[0];
    const varName = values[1];
    const template = await templateManager.get(id);
    
    if (action === 'add' && varName) {
      updates.variables = [...template.variables, varName];
    } else if (action === 'remove' && varName) {
      updates.variables = template.variables.filter(v => v !== varName);
    }
  } else if (field === 'tag') {
    const action = values[0];
    const tagName = values[1];
    const template = await templateManager.get(id);
    
    if (action === 'add' && tagName) {
      updates.tags = [...template.tags, tagName];
    } else if (action === 'remove' && tagName) {
      updates.tags = template.tags.filter(t => t !== tagName);
    }
  } else {
    return `❌ 不支持的字段: ${field}`;
  }

  const template = await templateManager.update(id, updates);
  return `✅ 模板更新成功！`;
}

async function handleUse(args) {
  const id = args[0];
  const values = {};
  
  if (!id) {
    return '❌ 请指定模板 ID\n用法: /template use <id> [变量名=值 ...]';
  }

  // 解析变量值
  for (let i = 1; i < args.length; i++) {
    const [key, ...vals] = args[i].split('=');
    if (key) {
      values[key] = vals.join('=');
    }
  }

  const result = await templateManager.use(id, values);
  
  let output = `📄 使用模板: ${result.templateName}\n\n`;
  output += '提示词:\n\n';
  output += result.prompt;
  
  return output.trim();
}

async function handlePreview(args) {
  const id = args[0];
  const values = {};
  
  if (!id) {
    return '❌ 请指定模板 ID\n用法: /template preview <id> [变量名=值 ...]';
  }

  // 解析变量值
  for (let i = 1; i < args.length; i++) {
    const [key, ...vals] = args[i].split('=');
    if (key) {
      values[key] = vals.join('=');
    }
  }

  return await templateManager.preview(id, values);
}

async function handleCategories() {
  const categories = await templateManager.getCategories();
  
  let output = '📂 分类列表\n\n';
  
  if (categories.length === 0) {
    output += '暂无分类。\n';
    return output;
  }

  categories.forEach(cat => {
    output += `• ${cat}\n`;
  });

  return output.trim();
}

async function handleTags() {
  const tags = await templateManager.getTags();
  
  let output = '🏷️  标签列表\n\n';
  
  if (tags.length === 0) {
    output += '暂无标签。\n';
    return output;
  }

  tags.forEach(tag => {
    output += `• ${tag}\n`;
  });

  return output.trim();
}

async function handleSearch(query) {
  if (!query) {
    return '❌ 请指定搜索关键词\n用法: /template search <关键词>';
  }

  const templates = await templateManager.search(query);
  
  let output = `🔍 搜索结果: "${query}"\n\n`;
  
  if (templates.length === 0) {
    output += '未找到匹配的模板。\n';
    return output;
  }

  templates.forEach(tpl => {
    output += `• ${tpl.id} - ${tpl.name}\n`;
    output += `  ${tpl.description}\n\n`;
  });

  output += `\n共 ${templates.length} 个结果`;
  return output.trim();
}

async function handleExport(id, format) {
  format = format || 'json';
  const content = await templateManager.export(id, format);
  return `📤 模板导出 (${format})\n\n\`\`\`${format}\n${content}\n\`\`\``;
}

async function handleImport(filePath) {
  if (!filePath) {
    return '❌ 请指定文件路径\n用法: /template import <file.json>';
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const count = await templateManager.import(content);

  return `✅ 成功导入 ${count} 个模板！`;
}

async function handleValidate(id) {
  if (!id) {
    return '❌ 请指定模板 ID\n用法: /template validate <id>';
  }

  const result = await templateManager.validate(id);

  let output = `🔍 验证模板: ${id}\n\n`;
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
  const stats = await templateManager.getStats();
  
  let output = '📊 模板统计\n\n';
  output += `总数: ${stats.total}\n`;
  output += `总变量数: ${stats.totalVariables}\n\n`;
  
  output += '按分类:\n';
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    output += `  • ${cat}: ${count}\n`;
  });
  
  output += '\n按标签:\n';
  Object.entries(stats.byTag).forEach(([tag, count]) => {
    output += `  • ${tag}: ${count}\n`;
  });

  return output.trim();
}

function showHelp() {
  return `📄 模板系统

用法:
  /template list [--category 分类] [--tag 标签]  列出模板
  /template get <id>                          查看模板
  /template add <id> <名称> <分类> <提示词>   创建模板
    选项: --var 变量名 --tag 标签
  /template remove <id>                       删除模板
  /template update <id> <field> <value>       更新模板
    字段: name, category, prompt, var, tag
  /template use <id> [变量名=值 ...]          使用模板
  /template preview <id> [变量名=值 ...]      预览模板
  /template categories                        查看分类
  /template tags                              查看标签
  /template search <关键词>                   搜索模板
  /template export [id] [format]              导出模板 (json/markdown)
  /template import <file>                     导入模板
  /template validate <id>                     验证模板
  /template stats                             统计信息

模板变量格式: {{变量名}}

示例:
  /template use code-review code="console.log('hello')"
  /template add my-tmpl MyTmpl Code "请解释: {{code}}" --var code
  /template update my-tmpl tag review
  /template search review`;
}
