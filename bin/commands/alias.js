import { AliasManager, BUILTIN_ALIASES } from '../../lib/utils/alias.js';

/**
 * 命令别名管理
 */
export async function handleAliasCommand(args, context) {
  const { rl, askQuestion } = context;

  const subCommand = args[0];
  const aliasManager = new AliasManager();

  if (!subCommand || subCommand === 'help' || subCommand === 'list') {
    // 显示所有别名
    console.log('\n📝 可用别名列表:\n');

    console.log('🔧 内置别名:');
    for (const [alias, command] of Object.entries(BUILTIN_ALIASES)) {
      const displayCommand = command.length > 50 ? command.substring(0, 50) + '...' : command;
      console.log(`  ${alias.padEnd(10)} → ${displayCommand}`);
    }

    const customAliases = aliasManager.list();
    if (customAliases.length > 0) {
      console.log('\n✏️ 自定义别名:');
      for (const [alias, command] of customAliases) {
        const displayCommand = command.length > 50 ? command.substring(0, 50) + '...' : command;
        console.log(`  ${alias.padEnd(10)} → ${displayCommand}`);
      }
    }

    console.log(`\n用法:`);
    console.log(`  /alias add <name> <command>   - 添加别名`);
    console.log(`  /alias remove <name>           - 删除别名`);
    console.log(`  /alias clear                    - 清空所有自定义别名`);
    console.log(`  /alias list                    - 列出所有别名 (当前命令)`);
    console.log(`\n💡 提示: 输入别名会自动替换为对应命令`);

    return true;
  }

  if (subCommand === 'add') {
    const name = args[1];
    const command = args.slice(2).join(' ');

    if (!name || !command) {
      console.log('❌ 用法: /alias add <name> <command>');
      console.log('   示例: /alias add cm /commit');
      return true;
    }

    // 检查是否与内置别名冲突
    if (name in BUILTIN_ALIASES) {
      console.log('⚠️ 警告: 覆盖内置别名');
    }

    aliasManager.add(name, command);
    console.log(`✅ 别名已添加: ${name} → ${command}`);
    return true;
  }

  if (subCommand === 'remove' || subCommand === 'rm' || subCommand === 'delete') {
    const name = args[1];

    if (!name) {
      console.log('❌ 用法: /alias remove <name>');
      return true;
    }

    if (name in BUILTIN_ALIASES) {
      console.log('❌ 无法删除内置别名');
      return true;
    }

    if (!aliasManager.has(name)) {
      console.log(`❌ 别名不存在: ${name}`);
      return true;
    }

    aliasManager.remove(name);
    console.log(`✅ 别名已删除: ${name}`);
    return true;
  }

  if (subCommand === 'clear') {
    const ans = await askQuestion('确定要清空所有自定义别名吗? (y/n) ');
    if (ans.trim().toLowerCase() === 'y') {
      aliasManager.clear();
      console.log('✅ 所有自定义别名已清空');
    } else {
      console.log('已取消');
    }
    return true;
  }

  console.log(`❌ 未知子命令: ${subCommand}`);
  console.log('使用 /alias help 查看帮助');
  return true;
}

/**
 * 解析别名
 */
export function parseAlias(input) {
  const aliasManager = new AliasManager();
  const words = input.trim().split(/\s+/);
  const alias = words[0];

  // 检查自定义别名
  if (aliasManager.has(alias)) {
    const command = aliasManager.get(alias);
    return command + ' ' + words.slice(1).join(' ');
  }

  // 检查内置别名
  if (alias in BUILTIN_ALIASES) {
    const command = BUILTIN_ALIASES[alias];
    return command + ' ' + words.slice(1).join(' ');
  }

  return input; // 不是别名，返回原输入
}

/**
 * 注册别名命令
 */
export const aliasCommands = [
  {
    name: 'alias',
    description: '管理命令别名',
    usage: '/alias [add|remove|clear|list] [args]',
    handler: handleAliasCommand
  }
];
