
import notificationManager from '../../lib/utils/notification.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'send':
      return handleSend(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList(params);
    case 'mark-read':
      return handleMarkRead(params);
    case 'mark-all-read':
      return handleMarkAllRead();
    case 'remove':
      return handleRemove(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleSend(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /notification send <type> <title> <content>' };
  }

  const [type, title, ...contentParts] = params;
  const content = contentParts.join(' ') || '';

  const notification = notificationManager.add(type, title, content);

  return {
    success: true,
    message: `✅ 通知已发送`,
    data: notification
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /notification get <id>' };
  }

  const [id] = params;
  const notification = notificationManager.get(id);

  if (!notification) {
    return { success: false, message: `❌ 通知 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 通知 "${notification.title}"`,
    data: notification
  };
}

function handleList(params) {
  const [readStr] = params;
  const read = readStr ? readStr === 'read' : null;

  let notifications = notificationManager.getAll();

  if (read !== null) {
    notifications = notifications.filter(n => n.isRead === read);
  }

  if (notifications.length === 0) {
    return { success: true, message: '📭 暂无通知', data: [] };
  }

  return {
    success: true,
    message: `📋 通知列表 (${notifications.length}条)`,
    data: notifications
  };
}

function handleMarkRead(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /notification mark-read <id>' };
  }

  const [id] = params;
  const notification = notificationManager.markAsRead(id);

  if (!notification) {
    return { success: false, message: `❌ 通知 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 通知 "${notification.title}" 已标记为已读`,
    data: notification
  };
}

function handleMarkAllRead() {
  const count = notificationManager.markAllAsRead();

  return {
    success: true,
    message: `✅ 已标记 ${count} 条通知为已读`
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /notification remove <id>' };
  }

  const [id] = params;
  const removed = notificationManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 通知 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 通知 "${removed.title}" 已删除`,
    data: removed
  };
}

function handleStats() {
  const stats = notificationManager.getStats();

  return {
    success: true,
    message: '📊 通知统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🔔 /notification - 通知管理

用法:
  /notification send <type> <title> <content>    发送通知
  /notification get <id>                         获取通知详情
  /notification list [read|unread]               列出所有通知
  /notification mark-read <id>                  标记为已读
  /notification mark-all-read                    全部标记为已读
  /notification remove <id>                     删除通知
  /notification stats                           查看统计

类型: info, warning, error, success`
  };
}

module.exports = { handle };
