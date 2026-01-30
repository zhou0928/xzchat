
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { logger } from "./utils/logger.js";
import { validateConfig, formatValidationResult } from "./utils/config-validator.js";

export function findProjectRoot(startDir = process.cwd()) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

const PROVIDER_PRESETS = {
  claude: {
    baseUrl: "https://paid.tribiosapi.top/v1",
    model: "claude-sonnet-4-5-20250929"
  },
  newapi: {
    baseUrl: "https://paid.tribiosapi.top/v1",
    model: "claude-sonnet-4-5-20250929"
  },
  codex: {
    baseUrl: "https://paid.tribiosapi.top/v1",
    model: "gpt-5.2-codex"
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini"
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat"
  },
  moonshot: {
    baseUrl: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k"
  }
};

const DEFAULT_PROVIDER = "newapi";
const projectRoot = findProjectRoot();
const homeConfigFile = path.join(os.homedir(), ".newapi-chat-config.json");
const projectConfigFile = path.join(projectRoot, ".newapi-chat-config.json");
const projectAltConfigFile = path.join(projectRoot, "newapi-chat.config.json");
const ccSwitchDir = path.join(os.homedir(), ".cc-switch");
const ccSwitchDb = path.join(ccSwitchDir, "cc-switch.db");

let ccSwitchCache = null;
let ccSwitchCacheTime = 0;
const CC_SWITCH_CACHE_TTL = 5000;
let ccSwitchUnreachable = false;

export function getProviderDefaults(provider) {
  return PROVIDER_PRESETS[provider] || {};
}

export function getCcSwitchProviders() {
  if (ccSwitchUnreachable) return [];
  try {
    if (!fs.existsSync(ccSwitchDb)) return [];
  } catch (e) {
    ccSwitchUnreachable = true;
    return [];
  }
  
  try {
    const hasSqlite = execSync("command -v sqlite3", { encoding: "utf8" }).trim();
    if (!hasSqlite) return [];
    
    const query = [
      "SELECT p.id, p.name, p.app_type, p.settings_config, e.url",
      "FROM providers p",
      "LEFT JOIN provider_endpoints e",
      "ON e.provider_id = p.id AND e.app_type = p.app_type",
      "ORDER BY p.id DESC"
    ].join(" ");
    
    const output = execSync(`sqlite3 "${ccSwitchDb}" -json "${query.replace(/"/g, '""')}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    
    if (!output) return [];
    const rows = JSON.parse(output);
    return rows.map(parseCcSwitchRow).filter(item => item && item.baseUrl);
  } catch (e) {
    ccSwitchUnreachable = true;
    return [];
  }
}

function parseCcSwitchRow(row) {
    if (!row) return null;
    const { id, name, app_type: appType, settings_config: settingsConfigStr, url } = row;
    let baseUrl = url;
    let apiKey = "";
    let model = "";

    try {
      const settings = JSON.parse(settingsConfigStr || "{}");

      // 调试：输出完整的 settings
      logger.debug('CC Switch Settings:', JSON.stringify(settings, null, 2));

      // 1. 尝试从 TOML/Config 中提取 Base URL
      if (settings.config) {
          const match = settings.config.match(/base_url\s*=\s*"([^"]+)"/);
          if (match && match[1]) baseUrl = match[1];
      }

      // 2. 如果没有 Config，尝试从其他字段提取
      if (!baseUrl) {
        if (settings.env?.ANTHROPIC_BASE_URL) baseUrl = settings.env.ANTHROPIC_BASE_URL;
        else if (settings.options?.baseURL) baseUrl = settings.options.baseURL;
      }

      // 提取 Model - 尝试多种方式
      if (settings.config) {
          const modelMatch = settings.config.match(/model\s*=\s*"([^"]+)"/);
          if (modelMatch && modelMatch[1]) model = modelMatch[1];
      }

      // 尝试从其他字段提取模型
      if (!model) {
          // 优先从 env 中的特定模型字段提取
          if (settings.env?.ANTHROPIC_DEFAULT_SONNET_MODEL) model = settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL;
          else if (settings.env?.ANTHROPIC_DEFAULT_HAIKU_MODEL) model = settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
          else if (settings.env?.OPENAI_MODEL) model = settings.env.OPENAI_MODEL;
          else if (settings.env?.MODEL) model = settings.env.MODEL;
          else if (settings.options?.model) model = settings.options.model;
          else if (settings.config?.model) model = settings.config.model;
          // 尝试从 config 字符串的其他格式提取
          else if (settings.config) {
              const altMatch = settings.config.match(/["']model["']\s*:\s*["']([^"']+)["']/);
              if (altMatch && altMatch[1]) model = altMatch[1];
          }
      }

      // 提取 API Key
      if (settings.env?.ANTHROPIC_AUTH_TOKEN) apiKey = settings.env.ANTHROPIC_AUTH_TOKEN;
      else if (settings.auth?.OPENAI_API_KEY) apiKey = settings.auth.OPENAI_API_KEY;
      else if (settings.options?.apiKey) apiKey = settings.options.apiKey;

      // 调试：输出提取的值
      logger.debug('CC Switch Parsed Values:', {
          name,
          appType,
          baseUrl,
          model: model || '(empty)',
          apiKey: apiKey ? '(hidden)' : '(empty)'
      });

    } catch (e) {
      logger.error('解析 CC Switch 配置时出错:', e);
    }

    // 清理 Base URL
    if (baseUrl && baseUrl.endsWith("/chat/completions")) {
      baseUrl = baseUrl.replace(/\/chat\/completions$/, "");
    }

    if (baseUrl) baseUrl = baseUrl.trim();

    return { id, name, appType, baseUrl, apiKey, model };
}

export function loadCcSwitchActiveEndpoint(forceRefresh = false) {
  if (ccSwitchUnreachable) return null;
  const now = Date.now();

  // 如果强制刷新，跳过缓存
  if (!forceRefresh && ccSwitchCache && now - ccSwitchCacheTime < CC_SWITCH_CACHE_TTL) {
    return ccSwitchCache;
  }

  ccSwitchCache = null;
  ccSwitchCacheTime = now;

  try {
    if (!fs.existsSync(ccSwitchDb)) {
      return null;
    }
  } catch (e) {
    ccSwitchUnreachable = true;
    return null;
  }

  try {
    const hasSqlite = execSync("command -v sqlite3", { encoding: "utf8" }).trim();
    if (!hasSqlite) return null;
  } catch {
    ccSwitchUnreachable = true;
    return null;
  }

  try {
    const query = [
      "SELECT p.id, p.name, p.app_type, p.settings_config, e.url",
      "FROM providers p",
      "LEFT JOIN provider_endpoints e",
      "ON e.provider_id = p.id AND e.app_type = p.app_type",
      "LEFT JOIN proxy_config pc",
      "ON pc.app_type = p.app_type",
      "WHERE p.is_current = 1 AND pc.enabled = 1"
    ].join(" ");
    const output = execSync(`sqlite3 "${ccSwitchDb}" -json "${query.replace(/"/g, '""')}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (!output) {
      return null;
    }
    const rows = JSON.parse(output);
    if (!rows.length) return null;

    // 优先匹配 claude > codex > openai > 其他
    let target = rows.find(r => r.app_type === 'claude');
    if (!target) target = rows.find(r => r.app_type === 'codex');
    if (!target) target = rows.find(r => r.app_type === 'openai');
    if (!target) target = rows[0];

    ccSwitchCache = parseCcSwitchRow(target);
    ccSwitchCacheTime = Date.now();
    return ccSwitchCache;
  } catch {
    ccSwitchUnreachable = true;
    return null;
  }
}

export function clearCcSwitchCache() {
  ccSwitchCache = null;
  ccSwitchCacheTime = 0;
}

export function mapCcSwitchProvider(appType, name) {
  if (!appType && !name) return null;
  const id = (appType || name || "").toLowerCase();
  if (id.includes("claude")) return "claude";
  if (id.includes("codex")) return "codex";
  if (id.includes("openai") || id.includes("gpt")) return "openai";
  if (id.includes("deepseek")) return "deepseek";
  if (id.includes("moonshot")) return "moonshot";
  return null;
}

export function initConfigFile() {
  if (fs.existsSync(homeConfigFile)) return;

  const basePreset = getProviderDefaults(DEFAULT_PROVIDER);

  const defaultConfig = {
    apiKey: "",
    baseUrl: basePreset.baseUrl,
    model: basePreset.model,
    provider: DEFAULT_PROVIDER,
    profiles: {
      default: {
        apiKey: "",
        baseUrl: basePreset.baseUrl,
        model: basePreset.model
      }
    },
    currentProfile: "default",
    roles: {
      coder: "你是一个资深的全栈工程师，精通 Node.js, React, TypeScript。请编写高质量、可维护的代码。",
      writer: "你是一个专业的文案创作者，擅长清晰、有说服力的表达。",
      translator: "你是一个精通中英文的翻译专家，请提供信达雅的翻译结果。"
    }
  };

  fs.writeFileSync(homeConfigFile, JSON.stringify(defaultConfig, null, 2), "utf-8");
  logger.info(`✅ 已创建配置文件: ${homeConfigFile}`);
  logger.warn("⚠️  请务必编辑该文件，填入你的 apiKey (sk-...)，否则无法使用。");
}

export function initProjectConfigFile() {
  const targetFile = path.join(process.cwd(), ".newapi-chat-config.json");
  
  if (fs.existsSync(targetFile)) {
    logger.warn(`⚠️  配置文件已存在: ${targetFile}`);
    return;
  }

  const basePreset = getProviderDefaults(DEFAULT_PROVIDER);

  const defaultConfig = {
    apiKey: "",
    baseUrl: basePreset.baseUrl,
    model: basePreset.model,
    provider: DEFAULT_PROVIDER,
    profiles: {
      default: {
        apiKey: "",
        baseUrl: basePreset.baseUrl,
        model: basePreset.model
      }
    },
    currentProfile: "default",
    roles: {
      coder: "你是一个资深的全栈工程师，精通 Node.js, React, TypeScript。请编写高质量、可维护的代码。",
      writer: "你是一个专业的文案创作者，擅长清晰、有说服力的表达。",
      translator: "你是一个精通中英文的翻译专家，请提供信达雅的翻译结果。"
    }
  };

  fs.writeFileSync(targetFile, JSON.stringify(defaultConfig, null, 2), "utf-8");
  logger.info(`✅ 已在当前目录创建配置文件: ${targetFile}`);
  logger.info("📝 请编辑此文件填入你的 API Key。");
  
  logger.info("🔒 建议将 .newapi-chat-config.json 添加到 .gitignore 以防泄露。");
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/`/g, '').trim();
}

function sanitizeConfigObj(obj) {
  if (!obj) return obj;
  if (obj.apiKey) obj.apiKey = sanitizeString(obj.apiKey);
  if (obj.baseUrl) obj.baseUrl = sanitizeString(obj.baseUrl);
  if (obj.model) obj.model = sanitizeString(obj.model);
  if (obj.provider) obj.provider = sanitizeString(obj.provider);
  
  if (obj.profiles) {
    for (const key in obj.profiles) {
      sanitizeConfigObj(obj.profiles[key]);
    }
  }
  return obj;
}

function loadConfigFrom(file) {
  if (!fs.existsSync(file)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
    return sanitizeConfigObj(raw);
  } catch {
    return {};
  }
}

// 加载配置 (Home < Project)
export function loadConfig() {
  const home = loadConfigFrom(homeConfigFile);
  const hasProjectConfig = fs.existsSync(projectConfigFile);
  const hasAltConfig = fs.existsSync(projectAltConfigFile);
  
  if (hasProjectConfig) {
      console.log(`\n📂 [Config] 检测到项目级配置文件: ${projectConfigFile}`);
  } else if (hasAltConfig) {
      console.log(`\n📂 [Config] 检测到项目级配置文件: ${projectAltConfigFile}`);
  }

  const project =
    loadConfigFrom(projectConfigFile) ||
    loadConfigFrom(projectAltConfigFile);
  
  if ((hasProjectConfig || hasAltConfig) && !project.apiKey && !project.profiles) {
      console.log(`⚠️  [Config] 警告: 项目级配置文件似乎为空或格式不正确，可能会覆盖全局配置！`);
  }

  const config = { ...home, ...project };

  if (!config.profiles) {
    const provider = config.provider || DEFAULT_PROVIDER;
    const preset = getProviderDefaults(provider);

    config.profiles = {
      default: {
        apiKey: config.apiKey || "",
        baseUrl: config.baseUrl || preset.baseUrl || getProviderDefaults(DEFAULT_PROVIDER).baseUrl,
        model: config.model || preset.model || getProviderDefaults(DEFAULT_PROVIDER).model,
        systemPrompt: config.systemPrompt
      }
    };
    config.currentProfile = "default";
  }

  // 验证配置
  const validation = validateConfig(config);
  if (!validation.valid) {
    logger.warn("⚠️  配置验证未通过，可能导致运行异常:");
    logger.warn(formatValidationResult(validation));
  }

  return config;
}

export function getWriteConfigFile() {
  if (fs.existsSync(projectConfigFile)) return projectConfigFile;
  if (fs.existsSync(projectAltConfigFile)) return projectAltConfigFile;
  return homeConfigFile;
}

export function updateConfig(key, value) {
  const target = getWriteConfigFile();
  let current = loadConfigFrom(target);

  // 安全检查：如果是项目级配置，且正在写入 apiKey，给出警告或阻止
  if ((target === projectConfigFile || target === projectAltConfigFile) && key === "apiKey") {
      console.warn("⚠️  警告: 你正在将 API Key 写入项目级配置文件。这可能会被提交到版本控制系统！");
  }

  // 不写入空字符串或空值
  if (value !== null && value !== undefined && value !== "") {
      current[key] = value;
      fs.writeFileSync(target, JSON.stringify(current, null, 2), "utf-8");
  }
  return current;
}

export function setProfileValue(profileName, key, value) {
  const target = getWriteConfigFile();
  let current = loadConfigFrom(target);

  if (!current.profiles) current.profiles = {};
  if (!current.profiles[profileName]) current.profiles[profileName] = {};

  // 不写入空字符串或空值
  if (value !== null && value !== undefined && value !== "") {
      current.profiles[profileName][key] = value;
      fs.writeFileSync(target, JSON.stringify(current, null, 2), "utf-8");
  }
  return current;
}

export function setRole(name, prompt) {
  const target = getWriteConfigFile();
  let current = loadConfigFrom(target);
  
  if (!current.roles) current.roles = {};
  current.roles[name] = prompt;
  
  fs.writeFileSync(target, JSON.stringify(current, null, 2), "utf-8");
  return current;
}

export function getRoles(config) {
    return config.roles || {};
}

export function getActiveConfig(config) {
    const profileName = config.currentProfile || "default";
    const profile = config.profiles?.[profileName] || {};
    const ccEndpoint = loadCcSwitchActiveEndpoint();
    const ccBaseUrl = ccEndpoint?.baseUrl;
    const ccApiKey = ccEndpoint?.apiKey;
    const ccModel = ccEndpoint?.model;
    const ccProvider = mapCcSwitchProvider(ccEndpoint?.appType, ccEndpoint?.name);

    // 调试输出（始终输出，便于排查问题）
    logger.debug('CC Switch Endpoint:', {
        appType: ccEndpoint?.appType,
        name: ccEndpoint?.name,
        baseUrl: ccBaseUrl,
        model: ccModel
    });
    logger.debug('Profile:', {
        name: profileName,
        baseUrl: profile.baseUrl,
        model: profile.model
    });
    logger.debug('Config:', {
        baseUrl: config.baseUrl,
        model: config.model
    });

    const provider =
      process.env.NEWAPI_PROVIDER ||
      ccProvider ||
      config.provider ||
      DEFAULT_PROVIDER;

    const preset = getProviderDefaults(provider);
    const defaultPreset = getProviderDefaults(DEFAULT_PROVIDER);

    const envApiKey = process.env.NEWAPI_API_KEY || "";
    const envBaseUrl = process.env.NEWAPI_BASE_URL;
    const envModel = process.env.NEWAPI_MODEL;

    const profileBaseUrl = profile.baseUrl;
    let configBaseUrl = config.baseUrl;

    if (!profileBaseUrl && configBaseUrl && provider !== DEFAULT_PROVIDER) {
      if (configBaseUrl === defaultPreset.baseUrl) {
        configBaseUrl = undefined;
      }
    }

    const profileModel = profile.model;
    let configModel = config.model;

    if (!profileModel && configModel && provider !== DEFAULT_PROVIDER) {
      if (configModel === defaultPreset.model) {
        configModel = undefined;
      }
    }

    const apiKey =
      envApiKey ||
      ccApiKey ||
      profile.apiKey ||
      config.apiKey ||
      "";
    let baseUrl =
      envBaseUrl ||
      ccBaseUrl ||
      profileBaseUrl ||
      configBaseUrl ||
      preset.baseUrl ||
      defaultPreset.baseUrl;

    const model =
      envModel ||
      ccModel ||
      profileModel ||
      configModel ||
      preset.model ||
      defaultPreset.model;

    const systemPrompt =
      profile.systemPrompt ||
      config.systemPrompt ||
      process.env.NEWAPI_SYSTEM_PROMPT ||
      "";

    const result = {
        apiKey,
        baseUrl,
        model,
        systemPrompt,
        provider,
        providerName: ccEndpoint?.name // 添加原始名称
    };

    // 调试输出最终配置（始终输出）
    logger.debug('Active Config:', {
        provider: result.provider,
        providerName: result.providerName,
        baseUrl: result.baseUrl,
        model: result.model,
        source: ccBaseUrl ? 'CC Switch' : (profileBaseUrl ? 'Profile' : 'Config')
    });

    return result;
}
