import { SessionManager } from '../utils/session-manager.js';
import { updateConfig } from '../config.js';
import { 
  showCommandHelp, 
  showSuccess, 
  showError, 
  showInfo,
  formatList,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../utils/messages.js';

export async function handleSessionCommand(input, config, messages, setMessages, rl) {
  const parts = input.trim().split(/\s+/);
  const command = parts[0];
  const sub = parts[1];
  let name = parts[2];

  const sessionManager = new SessionManager();
  const currentSession = config.currentSession || 'default';

  // 显示帮助
  if (sub === 'help' || sub === '-h' || sub === '--help') {
    showCommandHelp('session');
    return;
  }

  // 列出会话
  if (!sub || sub === 'list') {
    const sessions = sessionManager.listSessions();
    console.log('\n📂 可用会话:');

    if (!sessions.length) {
      console.log('  (暂无会话，使用 /session new <name> 创建)');
    } else {
      sessions.forEach((s, idx) => {
        const mark = s === currentSession ? '*' : ' ';
        console.log(`${mark} [${idx + 1}] ${s}`);
      });
    }

    console.log('\n💡 提示:');
    console.log('  • 使用数字索引快速切换会话');
    console.log('  • 默认会话不可删除');
    console.log('  • 使用 /session help 查看详细帮助');

    console.log('\n快捷命令:');
    console.log('  /session use <name|index>  - 切换会话');
    console.log('  /session new <name>        - 创建新会话');
    console.log('  /session delete <name>      - 删除会话');
    console.log('  /session search <keyword>  - 搜索会话内容');

    return;
  }

  // 搜索会话
  if (sub === 'search') {
    const keyword = parts.slice(2).join(' ');

    if (!keyword) {
      showError('MISSING_ARGUMENT', { arg: 'keyword' });
      console.log('用法: /session search <关键词>');
      return;
    }

    console.log(`\n🔍 搜索关键词: "${keyword}"`);
    const results = sessionManager.searchSessions(keyword);

    if (results.length === 0) {
      console.log('  未找到匹配内容');
    } else {
      console.log(`\n找到 ${results.length} 条结果:\n`);
      results.forEach((r, idx) => {
        console.log(`[${idx + 1}] 会话: ${r.session}`);
        console.log(`    角色: ${r.role}`);
        console.log(`    预览: ${r.preview}...\n`);
      });
    }

    return;
  }

  // 克隆会话
  if (sub === 'clone') {
    const source = parts[2];
    const target = parts[3];

    if (!source || !target) {
      console.log('用法: /session clone <源会话> <目标会话>');
      console.log('示例: /session clone session-1 session-2');
      return;
    }

    try {
      sessionManager.cloneSession(source, target);
      showSuccess('SESSION_CLONED', { src: source, tgt: target });
    } catch (e) {
      showError('OPERATION_FAILED', { reason: e.message });
    }
    return;
  }

  // 删除会话
  if (sub === 'delete' || sub === 'rm') {
    if (!name) {
      console.log('❌ 请指定要删除的会话名称');
      console.log('用法: /session delete <name>');
      console.log('示例: /session delete old-session');
      return;
    }

    if (name === 'default') {
      showError('SESSION_DELETE_DEFAULT');
      console.log('💡 提示: 使用 /clear 清空默认会话内容');
      return;
    }

    if (name === currentSession) {
      showError('SESSION_DELETE_CURRENT');
      console.log('💡 提示: 请先切换到其他会话');
      return;
    }

    const sessions = sessionManager.listSessions();
    if (!sessions.includes(name)) {
      showError('SESSION_NOT_FOUND', { name });
      return;
    }

    const ans = await rl.question(`⚠️  确认删除会话 "${name}"? (y/n) `);

    if (ans.trim().toLowerCase() === 'y') {
      const success = sessionManager.deleteSession(name);

      if (success) {
        showSuccess('SESSION_DELETED', { name });
      } else {
        showError('OPERATION_FAILED');
      }
    } else {
      console.log('🚫 已取消');
    }

    return;
  }

  // 切换/创建会话
  if (sub === 'use' || sub === 'new') {
    if (!name) {
      console.log('❌ 请指定会话名称');
      console.log('用法:');
      console.log('  /session use <name|index>  - 切换到指定会话');
      console.log('  /session new <name>        - 创建并切换到新会话');
      return;
    }

    // 支持索引切换
    let targetSession = name;
    if (sub === 'use' && /^\d+$/.test(name)) {
      const sessions = sessionManager.listSessions();
      const idx = parseInt(name, 10) - 1;

      if (idx >= 0 && idx < sessions.length) {
        targetSession = sessions[idx];
      } else {
        showError('SESSION_INVALID_INDEX');
        console.log(`💡 有效范围: 1 - ${sessions.length}`);
        return;
      }
    }

    // 保存当前会话
    sessionManager.saveSession(messages, currentSession);

    // 切换会话
    let newMessages;
    if (sub === 'new') {
      // 新会话
      newMessages = [];
      sessionManager.saveSession([], targetSession);
      console.log(`✅ 已创建新会话: ${targetSession}`);
    } else {
      // 切换到已有会话
      newMessages = sessionManager.loadSession(targetSession);
      if (newMessages === null) {
        // 会话不存在，自动创建
        newMessages = [];
        sessionManager.saveSession([], targetSession);
        console.log(`ℹ️  会话不存在，已创建: ${targetSession}`);
      }
    }

    // 更新配置
    updateConfig('currentSession', targetSession);
    setMessages(newMessages);

    showSuccess('SESSION_SWITCHED', { 
      name: targetSession, 
      count: newMessages.length 
    });

    return;
  }

  console.log('❌ 未知子命令');
  console.log(`💡 使用 "/${command} help" 查看帮助`);
}
