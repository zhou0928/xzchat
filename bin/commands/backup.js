import backupManager from '../../lib/utils/backup.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'create':
        return await handleCreate(rest);
      case 'incremental':
        return await handleIncremental(rest[0]);
      case 'restore':
        return await handleRestore(rest);
      case 'list':
        return await handleList(rest);
      case 'delete':
        return await handleDelete(rest[0]);
      case 'export':
        return await handleExport(rest);
      case 'import':
        return await handleImport(rest);
      case 'clean':
        return await handleClean(rest[0]);
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleCreate(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--encrypt') {
      options.encrypt = true;
    } else if (args[i] === '--keep' && args[i + 1]) {
      options.keepDays = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--desc' && args[i + 1]) {
      options.description = args.slice(i + 1).join(' ');
      break;
    }
  }

  const backup = await backupManager.createBackup(options);
  
  let output = '✅ 备份创建成功！\n\n';
  output += `备份ID: ${backup.id}\n`;
  output += `时间: ${new Date(backup.timestamp).toLocaleString('zh-CN')}\n`;
  output += `类型: ${backup.type}\n`;
  output += `加密: ${backup.encrypted ? '是' : '否'}\n`;
  output += `大小: ${formatSize(backup.size)}`;
  
  return output;
}

async function handleIncremental(lastBackupId) {
  if (!lastBackupId) {
    return '❌ 请指定基础备份 ID\n用法: /backup incremental <backup-id>';
  }

  const backup = await backupManager.createIncrementalBackup(lastBackupId);
  
  let output = '✅ 增量备份创建成功！\n\n';
  output += `备份ID: ${backup.id}\n`;
  output += `时间: ${new Date(backup.timestamp).toLocaleString('zh-CN')}\n`;
  output += `基于: ${backup.basedOn}\n`;
  output += `大小: ${formatSize(backup.size)}`;
  
  return output;
}

async function handleRestore(args) {
  const backupId = args[0];
  if (!backupId) {
    return '❌ 请指定备份 ID\n用法: /backup restore <backup-id> [--preview] [--overwrite]';
  }

  const options = {
    preview: args.includes('--preview'),
    overwrite: args.includes('--overwrite')
  };

  const result = await backupManager.restoreBackup(backupId, options);
  
  let output = result.type === 'preview' ? '📋 备份预览\n\n' : '✅ 备份恢复成功！\n\n';
  output += `备份ID: ${backupId}\n`;
  output += `时间: ${new Date(result.timestamp).toLocaleString('zh-CN')}\n\n`;
  output += '恢复内容:\n';
  
  for (const [key, count] of Object.entries(result.summary)) {
    output += `  • ${key}: ${count} 条\n`;
  }
  
  return output;
}

async function handleList(args) {
  const filter = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      filter.type = args[i + 1];
      i++;
    } else if (args[i] === '--from' && args[i + 1]) {
      filter.from = args[i + 1];
      i++;
    } else if (args[i] === '--to' && args[i + 1]) {
      filter.to = args[i + 1];
      i++;
    }
  }

  const backups = await backupManager.listBackups(filter);
  
  let output = '📋 备份列表\n\n';
  
  if (backups.length === 0) {
    output += '暂无备份。\n';
    return output;
  }

  backups.forEach(b => {
    output += `• ${b.id.substring(0, 30)}...\n`;
    output += `  类型: ${b.type}\n`;
    output += `  时间: ${new Date(b.timestamp).toLocaleString('zh-CN')}\n`;
    output += `  大小: ${formatSize(b.size)}\n`;
    if (b.basedOn) {
      output += `  基于: ${b.basedOn.substring(0, 20)}...\n`;
    }
    if (b.encrypted) {
      output += `  🔐 已加密\n`;
    }
    output += '\n';
  });

  output += `\n共 ${backups.length} 个备份`;
  return output.trim();
}

async function handleDelete(backupId) {
  if (!backupId) {
    return '❌ 请指定备份 ID\n用法: /backup delete <backup-id>';
  }

  await backupManager.deleteBackup(backupId);
  return `✅ 备份已删除`;
}

async function handleExport(args) {
  const backupId = args[0];
  const targetPath = args[1];
  const format = args.includes('--gzip') ? 'gzip' : 'json';
  
  if (!backupId || !targetPath) {
    return '❌ 用法: /backup export <backup-id> <target-path> [--gzip]';
  }

  const result = await backupManager.exportBackup(backupId, targetPath, format);
  return `✅ 备份已导出到: ${result}`;
}

async function handleImport(args) {
  const sourcePath = args[0];
  
  if (!sourcePath) {
    return '❌ 请指定源文件路径\n用法: /backup import <source-path> [--encrypt] [--decrypt]';
  }

  const options = {
    encrypt: args.includes('--encrypt'),
    decrypt: args.includes('--decrypt')
  };

  const backup = await backupManager.importBackup(sourcePath, options);
  
  return `✅ 备份已导入\n备份ID: ${backup.id}`;
}

async function handleClean(days) {
  const daysToKeep = parseInt(days) || 30;
  await backupManager.cleanOldBackups(daysToKeep);
  
  return `✅ 已清理 ${daysToKeep} 天前的旧备份`;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showHelp() {
  return `💾 数据备份与恢复

用法:
  /backup create [--encrypt] [--keep N] [--desc 描述]      创建完整备份
  /backup incremental <backup-id>                        创建增量备份
  /backup restore <backup-id> [--preview] [--overwrite]  恢复备份
  /backup list [--type full/incremental] [--from YYYY-MM-DD] [--to YYYY-MM-DD]  列出备份
  /backup delete <backup-id>                             删除备份
  /backup export <backup-id> <path> [--gzip]             导出备份
  /backup import <path> [--encrypt] [--decrypt]          导入备份
  /backup clean [days]                                    清理旧备份

选项:
  • --encrypt      加密备份
  • --keep N       保留 N 天内的备份
  • --desc         备份描述
  • --preview      预览备份内容
  • --overwrite    覆盖现有数据
  • --gzip         使用 gzip 格式

示例:
  /backup create --encrypt --keep 30 --desc "日常备份"
  /backup incremental backup-xxx
  /backup restore backup-xxx --preview
  /backup restore backup-xxx --overwrite
  /backup list --type full
  /backup export backup-xxx ./backup.json.gz
  /backup clean 7`;
}
