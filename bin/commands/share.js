import shareManager from '../../lib/utils/share.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'list':
        return await handleList(rest);
      case 'get':
        return await handleGet(rest[0]);
      case 'session':
        return await handleShareSession(rest);
      case 'branch':
        return await handleShareBranch(rest);
      case 'bookmark':
        return await handleShareBookmark(rest);
      case 'note':
        return await handleShareNote(rest);
      case 'unshare':
        return await handleUnshare(rest[0]);
      case 'update':
        return await handleUpdate(rest);
      case 'comment':
        return await handleComment(rest);
      case 'access':
        return await handleAccess(rest);
      case 'search':
        return await handleSearch(rest[0]);
      case 'popular':
        return await handlePopular(rest[0]);
      case 'link':
        return await handleExportLink(rest[0]);
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
    if (args[i] === '--type' && args[i + 1]) {
      filter.type = args[i + 1];
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      filter.category = args[i + 1];
      i++;
    }
  }

  const items = await shareManager.list(filter);
  
  let output = '🔗 分享列表\n\n';
  
  if (items.length === 0) {
    output += '暂无分享项。\n';
    return output;
  }

  items.forEach(item => {
    const publicIcon = item.isPublic ? '🌐' : '🔒';
    output += `${publicIcon} ${item.id.substring(0, 20)}...\n`;
    output += `  标题: ${item.title}\n`;
    output += `  类型: ${item.type}\n`;
    output += `  访问: ${item.accessCount} 次\n`;
    output += `  评论: ${item.comments.length} 条\n\n`;
  });

  output += `\n共 ${items.length} 个分享项`;
  return output.trim();
}

async function handleGet(id) {
  if (!id) {
    return '❌ 请指定分享 ID\n用法: /share get <id>';
  }

  const item = await shareManager.get(id);
  
  if (!item) {
    return `❌ 分享项 "${id}" 不存在`;
  }

  let output = `🔗 分享: ${item.title}\n\n`;
  output += `ID: ${item.id}\n`;
  output += `类型: ${item.type}\n`;
  output += `可见: ${item.isPublic ? '公开' : '私密'}\n`;
  output += `权限: ${item.permissions.join(', ') || '无'}\n`;
  output += `分类: ${item.category}\n`;
  output += `标签: ${item.tags.join(', ') || '无'}\n`;
  output += `描述: ${item.description || '无'}\n`;
  output += `访问: ${item.accessCount} 次\n`;
  output += `评论: ${item.comments.length} 条\n`;
  output += `创建: ${new Date(item.createdAt).toLocaleString('zh-CN')}\n`;
  output += `更新: ${new Date(item.updatedAt).toLocaleString('zh-CN')}`;

  if (item.comments.length > 0) {
    output += '\n\n评论:\n';
    item.comments.forEach(c => {
      output += `  • ${c.content.substring(0, 50)}...\n`;
      output += `    ${new Date(c.createdAt).toLocaleString('zh-CN')}\n`;
    });
  }

  return output;
}

async function handleShareSession(args) {
  const sessionId = args[0];
  const options = {
    title: args[1] || '',
    description: '',
    tags: [],
    isPublic: args.includes('--public'),
    password: null
  };

  if (!sessionId) {
    return '❌ 用法: /share session <sessionId> [标题] [--public] [--password 密码]';
  }

  const item = await shareManager.shareSession(sessionId, options);
  return `✅ 会话分享成功！\n分享ID: ${item.id}`;
}

async function handleShareBranch(args) {
  const branchId = args[0];
  const options = {
    title: args[1] || '',
    isPublic: args.includes('--public')
  };

  if (!branchId) {
    return '❌ 用法: /share branch <branchId> [标题] [--public]';
  }

  const item = await shareManager.shareBranch(branchId, options);
  return `✅ 分支分享成功！\n分享ID: ${item.id}`;
}

async function handleShareBookmark(args) {
  const bookmarkId = args[0];
  const options = {
    title: args[1] || '',
    isPublic: args.includes('--public')
  };

  if (!bookmarkId) {
    return '❌ 用法: /share bookmark <bookmarkId> [标题] [--public]';
  }

  const item = await shareManager.shareBookmark(bookmarkId, options);
  return `✅ 书签分享成功！\n分享ID: ${item.id}`;
}

async function handleShareNote(args) {
  const noteId = args[0];
  const options = {
    title: args[1] || '',
    isPublic: args.includes('--public')
  };

  if (!noteId) {
    return '❌ 用法: /share note <noteId> [标题] [--public]';
  }

  const item = await shareManager.shareNote(noteId, options);
  return `✅ 笔记分享成功！\n分享ID: ${item.id}`;
}

async function handleUnshare(id) {
  if (!id) {
    return '❌ 请指定分享 ID\n用法: /share unshare <id>';
  }

  await shareManager.unshare(id);
  return `✅ 分享已取消`;
}

async function handleUpdate(args) {
  const [id, field, ...values] = args;
  
  if (!id || !field) {
    return '❌ 用法: /share update <id> <field> <value>\n字段: title, description, public, password';
  }

  const updates = {};
  if (field === 'title') {
    updates.title = values.join(' ');
  } else if (field === 'description') {
    updates.description = values.join(' ');
  } else if (field === 'public') {
    updates.isPublic = values[0] === 'true';
  } else if (field === 'password') {
    updates.password = values[0];
  } else {
    return `❌ 不支持的字段: ${field}`;
  }

  const item = await shareManager.update(id, updates);
  return `✅ 分享更新成功！`;
}

async function handleComment(args) {
  const [id, action, ...commentArgs] = args;
  
  if (!id || !action) {
    return '❌ 用法: /share comment <id> add/delete [内容/commentId]';
  }

  if (action === 'add') {
    const comment = commentArgs.join(' ');
    const item = await shareManager.addComment(id, comment);
    return `✅ 评论已添加`;
  } else if (action === 'delete') {
    const commentId = commentArgs[0];
    await shareManager.deleteComment(id, commentId);
    return `✅ 评论已删除`;
  } else {
    return `❌ 不支持的操作: ${action}`;
  }
}

async function handleAccess(args) {
  const [id, password] = args;
  
  if (!id) {
    return '❌ 用法: /share access <id> [password]';
  }

  const item = await shareManager.access(id, password);
  return `✅ 访问成功\n标题: ${item.title}\n类型: ${item.type}`;
}

async function handleSearch(query) {
  if (!query) {
    return '❌ 请指定搜索关键词\n用法: /share search <关键词>';
  }

  const items = await shareManager.search(query);
  
  let output = `🔍 搜索结果: "${query}"\n\n`;
  
  if (items.length === 0) {
    output += '未找到匹配项。\n';
    return output;
  }

  items.forEach(item => {
    output += `• ${item.title} (${item.type})\n`;
    output += `  ${item.description || '无描述'}\n\n`;
  });

  output += `\n共 ${items.length} 个结果`;
  return output.trim();
}

async function handlePopular(limit) {
  const items = await shareManager.getPopular(parseInt(limit) || 10);
  
  let output = '🔥 热门分享\n\n';
  
  if (items.length === 0) {
    output += '暂无热门分享。\n';
    return output;
  }

  items.forEach((item, i) => {
    output += `${i + 1}. ${item.title}\n`;
    output += `   访问: ${item.accessCount} 次 | 类型: ${item.type}\n\n`;
  });

  return output.trim();
}

async function handleExportLink(id) {
  if (!id) {
    return '❌ 请指定分享 ID\n用法: /share link <id>';
  }

  const link = await shareManager.exportLink(id);
  return `🔗 分享链接:\n\n${link}`;
}

function showHelp() {
  return `🔗 团队协作

用法:
  /share list [--type 类型] [--category 分类]  列出分享
  /share get <id>                          查看分享详情
  /share session <sessionId> [标题]       分享会话
    选项: --public --password 密码
  /share branch <branchId> [标题]         分享分支
  /share bookmark <bookmarkId> [标题]     分享书签
  /share note <noteId> [标题]             分享笔记
  /share unshare <id>                     取消分享
  /share update <id> <field> <value>     更新分享
    字段: title, description, public, password
  /share comment <id> add/delete         管理评论
  /share access <id> [password]          访问分享
  /share search <关键词>                  搜索分享
  /share popular [limit]                  热门分享
  /share link <id>                        导出分享链接

权限:
  • read   - 只读
  • comment - 可评论
  • write  - 可编辑

示例:
  /share session abc123 "项目讨论" --public
  /share branch def456 "新功能分支"
  /share update abc123 public true
  /share comment abc123 add "很有用！"
  /share popular 5`;
}
