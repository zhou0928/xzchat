import { PreferenceManager } from '../../lib/utils/preference.js';

const preferenceManager = new PreferenceManager();

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
      case 'recent':
        handleRecent();
        break;
      case 'favorite':
        handleFavorite(params[0], params.slice(1).join(' '));
        break;
      case 'snippets':
        handleSnippets();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`偏好操作失败: ${error.message}`);
  }
};

function handleGet(key) {
  const value = preferenceManager.get(key);
  console.log(`\n${key}: ${JSON.stringify(value, null, 2)}\n`);
}

function handleSet(key, value) {
  preferenceManager.set(key, JSON.parse(value));
  console.log('\n✅ 偏好已更新\n');
}

function handleRecent() {
  const recent = preferenceManager.getRecentCommands();
  console.log('\n📝 最近命令:\n');
  recent.forEach((cmd, i) => {
    console.log(`  ${i + 1}. ${cmd}`);
  });
  console.log('');
}

function handleFavorite(name, prompt) {
  if (!name || !prompt) {
    console.error('错误: 请提供名称和提示');
    console.log('用法: /preference favorite <name> <prompt>');
    return;
  }
  preferenceManager.addFavoritePrompt(name, prompt);
  console.log('\n✅ 已添加到收藏\n');
}

function handleSnippets() {
  const snippets = preferenceManager.getSnippets();
  if (snippets.length === 0) {
    console.log('\n暂无代码片段\n');
    return;
  }
  console.log('\n📦 代码片段:\n');
  snippets.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} (${s.language})`);
    console.log(`     ${s.code.substring(0, 50)}...`);
  });
  console.log('');
}

function showHelp() {
  console.log(`
❤️  用户偏好 - 帮助

管理个人偏好设置。

子命令:
  /preference get <key>               获取偏好
  /preference set <key> <value>      设置偏好
  /preference recent                  最近命令
  /preference favorite <name> <prompt>  收藏提示
  /preference snippets                代码片段

示例:
  /preference recent
  /preference favorite code-review "请审查这段代码"
  /preference snippets

文档: /preference help
`);
}
