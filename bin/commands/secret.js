import { SecretManager } from '../../lib/utils/secret.js';

const secretManager = new SecretManager();

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
    case 'rotate':
      return handleRotate(params);
    case 'search':
      return handleSearch(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 3) {
    return { success: false, message: '用法: /secret add <name> <value> <type> [description]' };
  }

  const [name, value, type, ...descParts] = params;
  const description = descParts.join(' ') || '';

  const secret = secretManager.add(name, value, type, description);

  return {
    success: true,
    message: `✅ 密钥 "${name}" 已安全存储`,
    data: secret
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /secret get <id> 或 /secret get name:<name>' };
  }

  const [param] = params;
  let secret;

  if (param.startsWith('name:')) {
    secret = secretManager.getByName(param.substring(5));
  } else {
    secret = secretManager.get(param);
  }

  if (!secret) {
    return { success: false, message: `❌ 密钥不存在` };
  }

  return {
    success: true,
    message: `✅ 密钥 "${secret.name}"`,
    data: secret
  };
}

function handleList(params) {
  const [environment] = params;
  const secrets = environment
    ? secretManager.getByEnvironment(environment)
    : secretManager.getAll();

  if (secrets.length === 0) {
    return { success: true, message: '📭 暂无密钥', data: [] };
  }

  return {
    success: true,
    message: `📋 密钥列表 (${secrets.length}个)`,
    data: secrets
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /secret update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const secret = secretManager.update(id, { [key]: value });

  if (!secret) {
    return { success: false, message: `❌ 密钥 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 密钥 "${secret.name}" 已更新`,
    data: secret
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /secret remove <id>' };
  }

  const [id] = params;
  const removed = secretManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 密钥 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 密钥 "${removed.name}" 已删除`,
    data: removed
  };
}

async function handleRotate(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /secret rotate <id>' };
  }

  const [id] = params;
  const updated = await secretManager.rotate(id);

  if (!updated) {
    return { success: false, message: `❌ 密钥 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 密钥 "${updated.name}" 已轮换`,
    data: updated
  };
}

function handleSearch(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /secret search <keyword>' };
  }

  const [keyword] = params;
  const secrets = secretManager.search(keyword);

  if (secrets.length === 0) {
    return { success: true, message: `📭 未找到匹配的密钥`, data: [] };
  }

  return {
    success: true,
    message: `📋 搜索结果 (${secrets.length}个)`,
    data: secrets
  };
}

function handleStats() {
  const stats = secretManager.getStats();

  return {
    success: true,
    message: '📊 密钥统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🔐 /secret - 安全密钥管理

用法:
  /secret add <name> <value> <type> [description]    添加密钥
  /secret get <id> 或 name:<name>                  获取密钥值
  /secret list [environment]                        列出所有密钥
  /secret update <id> <key> <value>                更新密钥
  /secret remove <id>                               删除密钥
  /secret rotate <id>                               轮换密钥
  /secret search <keyword>                          搜索密钥
  /secret stats                                     查看统计

类型: api_key, token, password, certificate
环境: development, staging, production`
  };
}

module.exports = { handle };
