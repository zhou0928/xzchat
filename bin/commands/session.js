/**
 * /session 命令 - 管理会话
 */
export async function handleSession(input, currentSession, messages, saveHistory, loadHistory, updateConfig, setProfileValue, listSessions, clearHistory) {
  const parts = input.trim().split(/\s+/);
  const sub = parts[1];
  let name = parts[2];
  let config;

  if (!sub || sub === "list") {
    const sessions = listSessions();
    console.log("\n📂 可用会话:");
    if (!sessions.length) {
      console.log("1. default");
    } else {
      sessions.forEach((s, idx) => {
        const mark = s === currentSession ? "*" : " ";
        console.log(`${mark} ${idx + 1}. ${s}`);
      });
    }
    console.log("\n用法:");
    console.log("  /session new <name>      创建/切换到新会话");
    console.log("  /session switch <name>   切换会话");
    console.log("  /session delete <name>   删除会话");
    return true;
  }

  if (sub === "new" || sub === "switch" || sub === "use") {
    if (!name) {
      console.log("❌ 请指定会话名称");
      return true;
    }
    if (name === currentSession) {
      console.log(`⚠️  当前已经是会话 '${name}'`);
      return true;
    }

    // Save current
    saveHistory(messages, currentSession);

    // Switch
    config = (await import("../../lib/config.js")).loadConfig();
    updateConfig("currentSession", name);
    if (config.currentProfile) {
      setProfileValue(config.currentProfile, "currentSession", name);
    }

    // Load new
    const newMessages = loadHistory(name);
    console.log(`✅ 已切换到会话: ${name} (记录数: ${newMessages.length})`);
    return { newSession: name, newMessages };
  }

  if (sub === "delete" || sub === "rm") {
    if (!name) {
      console.log("❌ 请指定要删除的会话名称");
      return true;
    }
    if (name === "default") {
      console.log("❌ 不能删除默认会话 (可以使用 /clear 清空)");
      return true;
    }
    if (name === currentSession) {
      console.log("❌ 不能删除当前正在使用的会话，请先切换到其他会话");
      return true;
    }

    clearHistory(name);
    console.log(`✅ 会话 '${name}' 已清空`);
    return true;
  }

  console.log("未知子命令: " + sub);
  return true;
}

/**
 * /history 命令
 */
export async function handleHistory(messages, exportHistory) {
  exportHistory(messages);
  messages.slice(-5).forEach(m => console.log(`[${m.role}]: ${m.content.slice(0, 50)}...`));
  return true;
}

/**
 * /init 命令 - 初始化项目配置
 */
export async function handleInitCommand(initProjectConfigFile) {
  initProjectConfigFile();
  return true;
}
