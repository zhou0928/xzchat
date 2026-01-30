import { MigrationManager } from '../../lib/utils/migration.js';

const migrationManager = new MigrationManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'register':
        handleRegister(params[0], params[1], params.slice(2).join(' '));
        break;
      case 'execute':
        handleExecute(params[0]);
        break;
      case 'list':
        handleList(params[0]);
        break;
      case 'history':
        handleHistory();
        break;
      case 'status':
        handleStatus();
        break;
      case 'rollback':
        handleRollback(params[0]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`迁移操作失败: ${error.message}`);
  }
};

function handleRegister(name, version, description) {
  if (!name || !version) {
    console.error('错误: 请提供名称和版本');
    console.log('用法: /migration register <name> <version> [description]');
    return;
  }
  const result = migrationManager.registerMigration(name, version, description);
  console.log(`\n✅ 迁移已注册 (ID: ${result.migration.id})\n`);
}

function handleExecute(id) {
  if (!id) {
    console.error('错误: 请提供迁移ID');
    console.log('用法: /migration execute <id>');
    return;
  }
  const result = migrationManager.executeMigration(id);
  if (result.success) {
    console.log('\n✅ 迁移执行成功\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function handleList(status) {
  const migrations = migrationManager.listMigrations(status);
  if (migrations.length === 0) {
    console.log('\n暂无迁移记录\n');
    return;
  }
  console.log('\n📋 迁移列表:\n');
  migrations.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name} v${m.version}`);
    console.log(`     ID: ${m.id}`);
    console.log(`     状态: ${m.status}`);
    console.log(`     描述: ${m.description}`);
    console.log('');
  });
}

function handleHistory() {
  const history = migrationManager.getHistory();
  if (history.length === 0) {
    console.log('\n暂无执行历史\n');
    return;
  }
  console.log('\n📜 执行历史:\n');
  history.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.name} v${h.version}`);
    console.log(`     状态: ${h.status}`);
    console.log(`     执行时间: ${new Date(h.completedAt).toLocaleString('zh-CN')}`);
    console.log('');
  });
}

function handleStatus() {
  const status = migrationManager.getStatus();
  console.log('\n📊 迁移状态:\n');
  console.log(`  总计: ${status.total}`);
  console.log(`  待执行: ${status.pending}`);
  console.log(`  运行中: ${status.running}`);
  console.log(`  已完成: ${status.completed}`);
  console.log(`  失败: ${status.failed}`);
  console.log('');
}

function handleRollback(id) {
  if (!id) {
    console.error('错误: 请提供迁移ID');
    return;
  }
  const result = migrationManager.rollback(id);
  if (result.success) {
    console.log('\n✅ 迁移已回滚\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function showHelp() {
  console.log(`
🔄 数据迁移 - 帮助

管理数据迁移和版本升级。

子命令:
  /migration register <name> <ver> [desc]  注册迁移
  /migration execute <id>               执行迁移
  /migration list [status]               列出迁移
  /migration history                    执行历史
  /migration status                     迁移状态
  /migration rollback <id>              回滚迁移

状态: pending, running, completed, failed

示例:
  /migration register upgrade-db 1.0.0 升级数据库
  /migration execute 123
  /migration list completed
  /migration status

文档: /migration help
`);
}
