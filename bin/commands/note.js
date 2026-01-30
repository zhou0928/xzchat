import noteManager from '../../lib/utils/note.js';

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
      case 'tag':
        return await handleTag(rest);
      case 'search':
        return await handleSearch(rest[0]);
      case 'categories':
        return await handleCategories();
      case 'tags':
        return await handleTags();
      case 'export':
        return await handleExport(rest[0]);
      case 'import':
        return await handleImport(rest[0]);
      case 'stats':
        return await handleStats();
      case 'md':
        return await handleMarkdown(rest[0]);
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

  const notes = await noteManager.list(filter);
  
  let output = '📝 笔记列表\n\n';
  
  if (notes.length === 0) {
    output += '暂无笔记。使用 /note add 创建新笔记。\n';
    return output;
  }

  notes.forEach(note => {
    output += `• ${note.id.substring(0, 12)}... - ${note.title}\n`;
    output += `  分类: ${note.category}\n`;
    output += `  标签: ${note.tags.join(', ') || '无'}\n`;
    output += `  创建: ${new Date(note.createdAt).toLocaleDateString('zh-CN')}\n\n`;
  });

  output += `\n共 ${notes.length} 条笔记`;
  return output.trim();
}

async function handleGet(id) {
  if (!id) {
    return '❌ 请指定笔记 ID\n用法: /note get <id>';
  }

  const note = await noteManager.get(id);
  
  let output = `📝 ${note.title}\n\n`;
  output += `ID: ${note.id}\n`;
  output += `分类: ${note.category}\n`;
  output += `标签: ${note.tags.join(', ') || '无'}\n`;
  output += `创建: ${new Date(note.createdAt).toLocaleString('zh-CN')}\n`;
  output += `更新: ${new Date(note.updatedAt).toLocaleString('zh-CN')}\n`;
  output += `存储: ${note.storage === 'file' ? '📁 文件' : '💾 内存'}\n\n`;
  output += '---\n\n';
  output += note.content;

  return output.trim();
}

async function handleAdd(args) {
  const title = args[0];
  const content = args[1];
  
  if (!title) {
    return '❌ 用法: /note add <标题> [内容] [--category 分类] [--tag 标签]';
  }

  const options = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      options.category = args[i + 1];
      i++;
    } else if (args[i] === '--tag' && args[i + 1]) {
      if (!options.tags) options.tags = [];
      options.tags.push(args[i + 1]);
      i++;
    } else if (args[i] === '--storage' && args[i + 1]) {
      options.storage = args[i + 1];
      i++;
    }
  }

  const note = await noteManager.add(title, content || '', options);
  
  return `✅ 笔记 "${title}" 创建成功！\n\nID: ${note.id.substring(0, 12)}...`;
}

async function handleRemove(id) {
  if (!id) {
    return '❌ 请指定笔记 ID\n用法: /note remove <id>';
  }

  await noteManager.remove(id);
  return `✅ 笔记已删除`;
}

async function handleUpdate(args) {
  const id = args[0];
  const field = args[1];
  const value = args.slice(2).join(' ');
  
  if (!id || !field) {
    return '❌ 用法: /note update <id> <field> <value>\n字段: title, content, category';
  }

  const updates = {};
  if (field === 'title') {
    updates.title = value;
  } else if (field === 'content') {
    updates.content = value;
  } else if (field === 'category') {
    updates.category = value;
  } else {
    return `❌ 不支持的字段: ${field}`;
  }

  const note = await noteManager.update(id, updates);
  return `✅ 笔记更新成功！`;
}

async function handleTag(args) {
  const id = args[0];
  const action = args[1];
  const tag = args[2];
  
  if (!id || !action || !tag) {
    return '❌ 用法: /note tag <id> add/remove <tag>';
  }

  if (action === 'add') {
    const note = await noteManager.addTag(id, tag);
    return `✅ 标签 "${tag}" 已添加`;
  } else if (action === 'remove') {
    const note = await noteManager.removeTag(id, tag);
    return `✅ 标签 "${tag}" 已移除`;
  } else {
    return `❌ 不支持的操作: ${action} (支持: add, remove)`;
  }
}

async function handleSearch(query) {
  if (!query) {
    return '❌ 请指定搜索关键词\n用法: /note search <关键词>';
  }

  const notes = await noteManager.search(query);
  
  let output = `🔍 搜索结果: "${query}"\n\n`;
  
  if (notes.length === 0) {
    output += '未找到匹配的笔记。\n';
    return output;
  }

  notes.forEach(note => {
    output += `• ${note.id.substring(0, 12)}... - ${note.title}\n`;
    output += `  ${note.content.substring(0, 100)}...\n\n`;
  });

  output += `\n共 ${notes.length} 条结果`;
  return output.trim();
}

async function handleCategories() {
  const categories = await noteManager.getCategories();
  
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
  const tags = await noteManager.getTags();
  
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

async function handleExport(format = 'json') {
  const content = await noteManager.export(format);
  return `📤 笔记导出 (${format})\n\n\`\`\`${format}\n${content}\n\`\`\``;
}

async function handleImport(filePath) {
  if (!filePath) {
    return '❌ 请指定文件路径\n用法: /note import <file.json>';
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const count = await noteManager.import(content);

  return `✅ 成功导入 ${count} 条笔记！`;
}

async function handleStats() {
  const stats = await noteManager.getStats();
  
  let output = '📊 笔记统计\n\n';
  output += `总数: ${stats.total}\n\n`;
  
  output += '按分类:\n';
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    output += `  • ${cat}: ${count}\n`;
  });
  
  output += '\n按标签:\n';
  Object.entries(stats.byTag).forEach(([tag, count]) => {
    output += `  • ${tag}: ${count}\n`;
  });
  
  output += '\n按存储:\n';
  Object.entries(stats.byStorage).forEach(([storage, count]) => {
    output += `  • ${storage === 'file' ? '文件' : '内存'}: ${count}\n`;
  });

  return output.trim();
}

async function handleMarkdown(id) {
  if (!id) {
    return '❌ 请指定笔记 ID\n用法: /note md <id>';
  }

  const note = await noteManager.get(id);
  return noteManager.toMarkdown(note);
}

function showHelp() {
  return `📝 笔记系统

用法:
  /note list [--category 分类] [--tag 标签]   列出笔记
  /note get <id>                              查看笔记
  /note add <标题> [内容] [选项]               创建笔记
    选项: --category 分类 --tag 标签 --storage 内存/文件
  /note remove <id>                            删除笔记
  /note update <id> <field> <value>           更新笔记
    字段: title, content, category
  /note tag <id> add/remove <tag>            管理标签
  /note search <关键词>                        搜索笔记
  /note categories                            查看分类
  /note tags                                  查看标签
  /note export [format]                       导出笔记 (json/markdown)
  /note import <file>                         导入笔记
  /note stats                                 统计信息
  /note md <id>                               导出为 Markdown

示例:
  /note add "我的想法" "这是重要内容" --category Ideas --tag important
  /note list --category Ideas
  /note search React
  /note update abc123 content "新内容"
  /note md abc123`;
}
