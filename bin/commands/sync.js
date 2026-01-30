import syncManager from '../../lib/utils/sync.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'add':
        return await handleAdd(rest);
      case 'remove':
      case 'rm':
        return await handleRemove(rest);
      case 'list':
      case 'ls':
        return await handleList();
      case 'sync':
        return await handleSync(rest);
      case 'status':
        return await handleStatus(rest);
      case 'start':
        return await handleStartAutoSync(rest);
      case 'stop':
        return await handleStopAutoSync(rest);
      case 'conflicts':
        return await handleConflicts(rest);
      case 'resolve':
        return await handleResolve(rest);
      case 'backup':
        return await handleBackup(rest);
      case 'history':
        return await handleHistory(rest);
      case 'validate':
        return await handleValidate(rest);
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleAdd(args) {
  const [name, provider, repository, ...options] = args;
  
  if (!name || !provider) {
    return '❌ 用法: /sync add <name> <provider> [repository] [options]\n' +
           'provider: github, gitee, custom';
  }

  const opts = {
    repository: repository || '',
    branch: 'main',
    autoSync: false,
    syncInterval: 3600,
    skipValidation: false
  };

  // 解析选项
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (opt === '--token' && options[i + 1]) {
      opts.token = options[++i];
    } else if (opt === '--branch' && options[i + 1]) {
      opts.branch = options[++i];
    } else if (opt === '--auto') {
      opts.autoSync = true;
    } else if (opt === '--interval' && options[i + 1]) {
      opts.syncInterval = parseInt(options[++i]);
    } else if (opt === '--skip-validation') {
      opts.skipValidation = true;
    }
  }

  console.log(`📦 正在添加同步配置 "${name}"...`);
  const result = await syncManager.add(name, provider, opts);
  
  return `✅ 同步配置已添加\n\n` +
         `名称: ${result.name}\n` +
         `提供商: ${result.provider}\n` +
         `仓库: ${result.repository}\n` +
         `分支: ${result.branch}\n` +
         `自动同步: ${result.autoSync ? '是' : '否'}\n` +
         `同步间隔: ${result.syncInterval}秒`;
}

async function handleRemove(args) {
  const [name] = args;
  
  if (!name) {
    return '❌ 用法: /sync remove <name>';
  }

  await syncManager.remove(name);
  return `✅ 同步配置 "${name}" 已删除`;
}

async function handleList() {
  const configs = await syncManager.list();
  
  if (configs.length === 0) {
    return '📋 暂无同步配置';
  }

  let output = `📋 同步配置列表 (${configs.length})\n\n`;
  
  configs.forEach((config, index) => {
    output += `${index + 1}. ${config.name}\n`;
    output += `   提供商: ${config.provider}\n`;
    output += `   仓库: ${config.repository}\n`;
    output += `   分支: ${config.branch}\n`;
    output += `   状态: ${config.lastStatus === 'success' ? '✅' : '⚠️'}\n`;
    output += `   最后同步: ${config.lastSync || '从未'}\n`;
    output += `   自动同步: ${config.autoSync ? '✅ 是' : '❌ 否'}\n\n`;
  });

  return output;
}

async function handleSync(args) {
  const [name, ...options] = args;
  
  if (!name) {
    return '❌ 用法: /sync sync <name> [options]';
  }

  const opts = {
    force: options.includes('--force') || options.includes('-f'),
    dryRun: options.includes('--dry-run')
  };

  console.log(`🔄 正在同步 "${name}"...`);
  const result = await syncManager.sync(name, opts);
  
  if (result.status === 'success') {
    let output = `✅ 同步成功\n\n`;
    output += `名称: ${result.name}\n`;
    output += `提供商: ${result.provider}\n`;
    output += `同步时间: ${result.syncedAt}\n`;
    output += `耗时: ${result.duration}ms\n`;
    
    if (result.changes && result.changes.length > 0) {
      output += `\n变更文件: ${result.changes.length} 个\n`;
      result.changes.slice(0, 5).forEach(change => {
        output += `  - ${change.substring(0, 50)}\n`;
      });
      if (result.changes.length > 5) {
        output += `  ... 还有 ${result.changes.length - 5} 个\n`;
      }
    }
    
    return output;
  } else {
    return `❌ 同步失败\n\n${result.error}`;
  }
}

async function handleStatus(args) {
  const [name] = args;
  
  if (!name) {
    return '❌ 用法: /sync status <name>';
  }

  const status = syncManager.getStatus(name);
  
  let output = `📊 同步状态\n\n`;
  output += `名称: ${status.name}\n`;
  output += `提供商: ${status.provider}\n`;
  output += `自动同步: ${status.autoSync ? '✅ 是' : '❌ 否'}\n`;
  output += `当前同步: ${status.isSyncing ? '⏳ 进行中' : '⏸️ 未运行'}\n`;
  output += `最后同步: ${status.lastSync || '从未'}\n`;
  output += `最后状态: ${status.lastStatus}\n`;
  output += `同步次数: ${status.syncCount}`;
  
  return output;
}

async function handleStartAutoSync(args) {
  const [name] = args;
  
  if (!name) {
    return '❌ 用法: /sync start <name>';
  }

  const config = await syncManager.get(name);
  config.autoSync = true;
  await syncManager.save();
  
  syncManager.startAutoSync(name);
  
  return `✅ 已启动 "${name}" 的自动同步`;
}

async function handleStopAutoSync(args) {
  const [name] = args;
  
  if (!name) {
    return '❌ 用法: /sync stop <name>';
  }

  const config = await syncManager.get(name);
  config.autoSync = false;
  await syncManager.save();
  
  syncManager.stopAutoSync(name);
  
  return `⏸️ 已停止 "${name}" 的自动同步`;
}

async function handleConflicts(args) {
  const [name] = args;
  
  if (!name) {
    return '❌ 用法: /sync conflicts <name>';
  }

  const result = await syncManager.detectConflicts(name);
  
  if (!result.hasConflicts) {
    return `✅ "${name}" 没有检测到冲突`;
  }
  
  let output = `⚠️ 检测到冲突\n\n`;
  output += `冲突文件 (${result.files.length}):\n`;
  result.files.forEach(file => {
    output += `  - ${file}\n`;
  });
  
  return output;
}

async function handleResolve(args) {
  const [name, strategy] = args;
  
  if (!name || !strategy) {
    return '❌ 用法: /sync resolve <name> <strategy>\n' +
           'strategies: local, remote';
  }

  if (!['local', 'remote'].includes(strategy)) {
    return '❌ 策略必须是 local 或 remote';
  }

  console.log(`🔧 正在解决冲突 (策略: ${strategy})...`);
  const result = await syncManager.resolveConflicts(name, strategy);
  
  if (result.status === 'success') {
    return `✅ 冲突已解决 (使用 ${strategy} 版本)`;
  } else {
    return `❌ 解决失败: ${result.error}`;
  }
}

async function handleBackup(args) {
  const [name] = args;
  
  if (!name) {
    return '❌ 用法: /sync backup <name>';
  }

  const result = await syncManager.backup(name);
  
  return `✅ 备份完成\n\n` +
         `同步配置: ${name}\n` +
         `备份路径: ${result.backupPath}\n` +
         `时间戳: ${result.timestamp}`;
}

async function handleHistory(args) {
  const [name, limitStr] = args;
  const limit = limitStr ? parseInt(limitStr) : 20;
  
  if (!name) {
    return '❌ 用法: /sync history <name> [limit]';
  }

  const history = await syncManager.getHistory(name, limit);
  
  if (history.length === 0) {
    return `📜 "${name}" 暂无同步历史`;
  }
  
  let output = `📜 同步历史 (${name})\n\n`;
  history.forEach((h, index) => {
    output += `${index + 1}. ${h.syncTime}\n`;
    output += `   状态: ${h.status}\n`;
    output += `   提交: ${h.commit?.substring(0, 8) || 'N/A'}\n\n`;
  });
  
  return output;
}

async function handleValidate(args) {
  const [provider, repository, token] = args;
  
  if (!provider || !repository) {
    return '❌ 用法: /sync validate <provider> <repository> [token]';
  }

  console.log(`🔍 正在验证仓库连接...`);
  const result = await syncManager.validateRepository(provider, repository, token);
  
  if (result.valid) {
    return `✅ ${result.message}`;
  } else {
    return `❌ ${result.message}`;
  }
}

function showHelp() {
  return `🔄 配置同步 (完整版)

支持的提供商:
  - GitHub  (github)
  - Gitee   (gitee)
  - 自定义 Git 仓库 (custom)

用法:
  /sync add <name> <provider> [repository] [options]      添加同步配置
  /sync remove <name>                                     删除配置
  /sync list                                               列出所有配置
  /sync sync <name> [options]                              执行同步
  /sync status <name>                                      查看状态
  /sync start <name>                                       启动自动同步
  /sync stop <name>                                        停止自动同步
  /sync conflicts <name>                                   检测冲突
  /sync resolve <name> <strategy>                          解决冲突
  /sync backup <name>                                      备份配置
  /sync history <name> [limit]                             同步历史
  /sync validate <provider> <repository> [token]            验证仓库

选项:
  --token <token>              访问令牌
  --branch <branch>            分支 (默认: main)
  --auto                       启用自动同步
  --interval <seconds>          同步间隔 (默认: 3600)
  --force, -f                  强制同步
  --dry-run                    预览同步 (不执行)

冲突解决策略:
  local    - 使用本地版本
  remote   - 使用远程版本

示例:
  /sync add my-config github username/repo --token ghp_...
  /sync add my-config gitee username/repo --auto --interval 1800
  /sync sync my-config
  /sync sync my-config --force
  /sync status my-config
  /sync start my-config
  /sync conflicts my-config
  /sync resolve my-config remote
  /sync validate github username/repo`;
}
