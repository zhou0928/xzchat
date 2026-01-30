/**
 * 在历史对话中搜索内容
 */
export async function handleFindCommand(args, context) {
  const { messages, rl } = context;

  if (args[0] === 'help' || args.length === 0) {
    console.log(`
🔍 /find - 在历史对话中搜索内容

用法:
  /find <keyword>
  /find --case-sensitive <keyword>
  /find --user <keyword>        (只搜索用户消息)
  /find --assistant <keyword>    (只搜索助手回复)

选项:
  --case-sensitive  区分大小写
  --user           只搜索用户消息
  --assistant      只搜索助手回复

示例:
  /find api
  /find --user 错误
  /find --assistant TypeScript
  /find --case-sensitive XZChat
`);
    return true;
  }

  // 解析参数
  let keyword = '';
  let caseSensitive = false;
  let filterRole = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--case-sensitive') {
      caseSensitive = true;
    } else if (arg === '--user') {
      filterRole = 'user';
    } else if (arg === '--assistant') {
      filterRole = 'assistant';
    } else if (!arg.startsWith('--')) {
      keyword = arg;
    }
  }

  if (!keyword) {
    console.log('❌ 请提供搜索关键词');
    return true;
  }

  // 搜索
  const results = [];
  const searchRegex = caseSensitive
    ? new RegExp(keyword, 'g')
    : new RegExp(keyword, 'gi');

  messages.forEach((msg, index) => {
    // 角色过滤
    if (filterRole && msg.role !== filterRole) {
      return;
    }

    // 内容搜索
    const content = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content);

    const matches = content.match(searchRegex);
    if (matches && matches.length > 0) {
      results.push({
        index,
        role: msg.role,
        content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        matchCount: matches.length
      });
    }
  });

  // 显示结果
  if (results.length === 0) {
    console.log(`\n❌ 未找到包含 "${keyword}" 的消息`);
    console.log(`💡 提示: 尝试使用更简短的关键词`);
  } else {
    console.log(`\n✅ 找到 ${results.length} 条匹配的消息:\n`);

    const roleEmoji = {
      user: '👤',
      assistant: '🤖',
      system: '⚙️'
    };

    results.forEach((result, i) => {
      console.log(`${i + 1}. ${roleEmoji[result.role] || '📋'} [#${result.index}] ${result.content.replace(/\n/g, ' ')}`);
      console.log(`   匹配次数: ${result.matchCount}\n`);
    });

    console.log(`💡 提示: 使用 /history 查看完整消息`);
  }

  return true;
}

/**
 * 注册查找命令
 */
export const findCommands = [
  {
    name: 'find',
    aliases: ['search', 'grep'],
    description: '在历史对话中搜索内容',
    usage: '/find [options] <keyword>',
    handler: handleFindCommand
  }
];
