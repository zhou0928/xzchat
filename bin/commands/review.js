import reviewManager from '../../lib/utils/review.js';

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
    case 'approve':
      return handleApprove(params);
    case 'reject':
      return handleReject(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /review add <title> <file> [reviewer]' };
  }

  const [title, file, ...rest] = params;
  let reviewer = 'system';
  let description = '';

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--reviewer' && rest[i + 1]) {
      reviewer = rest[++i];
    } else if (rest[i] === '--description' && rest[i + 1]) {
      description = rest[++i];
    }
  }

  const review = reviewManager.add(title, file, reviewer, description);

  return {
    success: true,
    message: `✅ 代码评审 "${title}" 已创建`,
    data: review
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /review get <id>' };
  }

  const [id] = params;
  const review = reviewManager.get(id);

  if (!review) {
    return { success: false, message: `❌ 代码评审 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 代码评审 "${review.title}"`,
    data: review
  };
}

function handleList(params) {
  const [status] = params;
  const reviews = status
    ? reviewManager.getByStatus(status)
    : reviewManager.getAll();

  if (reviews.length === 0) {
    return { success: true, message: '📭 暂无代码评审', data: [] };
  }

  return {
    success: true,
    message: `📋 代码评审列表 (${reviews.length}个)`,
    data: reviews
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /review update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const review = reviewManager.update(id, { [key]: value });

  if (!review) {
    return { success: false, message: `❌ 代码评审 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 代码评审 "${review.title}" 已更新`,
    data: review
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /review remove <id>' };
  }

  const [id] = params;
  const removed = reviewManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 代码评审 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 代码评审 "${removed.title}" 已删除`,
    data: removed
  };
}

function handleApprove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /review approve <id> [comment]' };
  }

  const [id, ...commentParts] = params;
  const comment = commentParts.join(' ') || '';

  const review = reviewManager.approve(id, comment);

  if (!review) {
    return { success: false, message: `❌ 代码评审 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 代码评审 "${review.title}" 已通过`,
    data: review
  };
}

function handleReject(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /review reject <id> [reason]' };
  }

  const [id, ...reasonParts] = params;
  const reason = reasonParts.join(' ') || '';

  const review = reviewManager.reject(id, reason);

  if (!review) {
    return { success: false, message: `❌ 代码评审 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 代码评审 "${review.title}" 已拒绝`,
    data: review
  };
}

function handleStats() {
  const stats = reviewManager.getStats();

  return {
    success: true,
    message: '📊 代码评审统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `👀 /review - 代码评审管理

用法:
  /review add <title> <file> [--reviewer x] [--description y]    创建评审
  /review get <id>                                                获取评审详情
  /review list [status]                                           列出所有评审
  /review update <id> <key> <value>                               更新评审
  /review remove <id>                                             删除评审
  /review approve <id> [comment]                                  通过评审
  /review reject <id> [reason]                                    拒绝评审
  /review stats                                                    查看统计

状态: pending, approved, rejected`
  };
}

module.exports = { handle };
