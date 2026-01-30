/**
 * /models 命令 - 列出可用模型
 */
export async function handleModels(loadConfig, getActiveConfig, fetchModels, askQuestion) {
  try {
    console.log("🔍 正在获取可用模型列表...");
    // 强制刷新配置，确保使用 CC Switch 最新的 BaseURL 和 Key
    let config = loadConfig();
    let activeConfig = getActiveConfig(config);
    console.log(`(使用 Provider: ${activeConfig.providerName || activeConfig.provider}, Base URL: ${activeConfig.baseUrl})`);

    const models = await fetchModels(activeConfig);
    if (Array.isArray(models)) {
      const flat = [];
      models.slice(0, 50).forEach((m, idx) => {
        if (typeof m === "string") {
          flat.push(m);
          console.log(`${idx + 1}. ${m}`);
        } else {
          const name = m.id || m.name || "";
          const desc = m.description || "";
          flat.push(name);
          console.log(desc ? `${idx + 1}. ${name} : ${desc}` : `${idx + 1}. ${name}`);
        }
      });
      if (models.length > 50) {
        console.log(`... 共 ${models.length} 个模型，仅显示前 50 个`);
      }
      const ans = await askQuestion("\n输入序号切换模型，或直接回车跳过: ");
      const n = parseInt(ans.trim(), 10);
      if (!Number.isNaN(n) && n >= 1 && n <= flat.length) {
        const chosen = flat[n - 1];
        const { updateConfig, setProfileValue } = await import("../../lib/config.js");
        updateConfig("model", chosen);
        config = loadConfig();
        if (config.currentProfile) {
          setProfileValue(config.currentProfile, "model", chosen);
        }
        config = loadConfig();
        activeConfig = getActiveConfig(config);
        console.log(`✅ 已切换模型为: ${chosen}`);
        return { activeConfig };
      }
    } else {
      console.log(JSON.stringify(models, null, 2));
    }
  } catch (e) {
    console.error("❌ 获取模型列表失败:", e.message);
  }
  return true;
}

/**
 * /role 或 /角色 命令 - 管理角色预设
 */
export async function handleRole(input, loadConfig, setRole) {
  const parts = input.split(/\s+/);
  const sub = parts[1];
  let config = loadConfig();
  const { getRoles, updateConfig, setProfileValue, getActiveConfig } = await import("../../lib/config.js");
  const roles = getRoles(config);

  if (!sub || sub === "list") {
    console.log("\n🎭 可用角色预设:");
    if (Object.keys(roles).length === 0) {
      console.log("  (暂无角色)");
    } else {
      Object.keys(roles).forEach(key => {
        console.log(`- ${key}: ${roles[key].slice(0, 60)}...`);
      });
    }
    console.log("\n用法:");
    console.log("  /role <name>               切换到指定角色");
    console.log("  /role set <name> <prompt>  新增/更新角色");
    return true;
  }

  if (sub === "set") {
    const name = parts[2];
    const prompt = parts.slice(3).join(" ");
    if (!name || !prompt) {
      console.log("用法: /role set <name> <prompt>");
      return true;
    }
    setRole(name, prompt);
    console.log(`✅ 角色 '${name}' 已保存`);
    return true;
  }

  // Use role
  const roleName = sub;
  if (roles[roleName]) {
    updateConfig("systemPrompt", roles[roleName]);
    config = loadConfig();
    if (config.currentProfile) {
      setProfileValue(config.currentProfile, "systemPrompt", roles[roleName]);
    }
    // Refresh
    config = loadConfig();
    const activeConfig = getActiveConfig(config);
    console.log(`✅ 已切换到角色: ${roleName}`);
    console.log(`(Prompt: ${roles[roleName].slice(0, 60)}...)`);
    return { activeConfig };
  } else {
    console.log(`❌ 角色 '${roleName}' 不存在`);
    return true;
  }
}

/**
 * /think 命令 - 控制思考过程显示
 */
export async function handleThink(input, loadConfig, updateConfig, setProfileValue, getActiveConfig) {
  const parts = input.split(/\s+/);
  const sub = parts[1];
  let config = loadConfig();

  if (!sub) {
    // Toggle
    const next = !config.showThinking;
    updateConfig("showThinking", next);
    config = loadConfig();
    if (config.currentProfile) {
      setProfileValue(config.currentProfile, "showThinking", next);
    }
    console.log(`✅ 思考过程显示已${next ? "开启" : "关闭"}`);
  } else if (sub === "on" || sub === "true") {
    updateConfig("showThinking", true);
    config = loadConfig();
    if (config.currentProfile) {
      setProfileValue(config.currentProfile, "showThinking", true);
    }
    console.log("✅ 思考过程显示已开启");
  } else if (sub === "off" || sub === "false") {
    updateConfig("showThinking", false);
    config = loadConfig();
    if (config.currentProfile) {
      setProfileValue(config.currentProfile, "showThinking", false);
    }
    console.log("✅ 思考过程显示已关闭");
  } else {
    console.log("用法: /think [on|off]");
  }

  const activeConfig = getActiveConfig(config);
  return { activeConfig };
}
