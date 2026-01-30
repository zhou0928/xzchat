import { SettingsManager } from '../../lib/utils/settings.js';

const settingsManager = new SettingsManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'get':
        handleGet(params[0]);
        break;
      case 'set':
        handleSet(params[0], params[1]);
        break;
      case 'list':
        handleList();
        break;
      case 'reset':
        handleReset(params[0]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`设置操作失败: ${error.message}`);
  }
};

function handleGet(key) {
  if (key) {
    const value = settingsManager.get(key);
    console.log(`\n${key}: ${value}\n`);
  } else {
    const all = settingsManager.get();
    console.log('\n📋 全局设置:\n');
    Object.entries(all).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });
    console.log('');
  }
}

function handleSet(key, value) {
  if (!key || value === undefined) {
    console.error('错误: 请提供键和值');
    console.log('用法: /settings set <key> <value>');
    return;
  }
  const result = settingsManager.set(key, value);
  if (result.success) {
    console.log('\n✅ 设置已更新\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function handleList() {
  const list = settingsManager.list();
  console.log('\n📋 设置列表:\n');
  list.forEach(({ key, value }) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('');
}

function handleReset(key) {
  const result = settingsManager.reset(key);
  if (result.success) {
    console.log(`\n✅ ${key ? key : '所有'}设置已重置\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function showHelp() {
  console.log(`
⚙️  全局设置 - 帮助

管理应用的全局配置。

子命令:
  /settings get [key]              获取设置
  /settings set <key> <value>     设置值
  /settings list                  列出所有设置
  /settings reset [key]           重置设置

常用设置:
  theme - 主题 (dark/light)
  language - 语言 (zh-CN/en-US)
  autoSave - 自动保存 (true/false)
  notifications - 通知 (true/false)
  debug - 调试模式 (true/false)

示例:
  /settings get theme
  /settings set theme light
  /settings list
  /settings reset theme

文档: /settings help
`);
}
