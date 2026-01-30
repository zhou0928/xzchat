
import {
  initConfigFile,
  loadConfig,
  updateConfig,
  getActiveConfig,
  setProfileValue,
  getProviderDefaults
} from "../config.js";
import { logger } from "../utils/logger.js";

export async function handleConfigCommand(args) {
  // 重新加载配置以确保最新
  initConfigFile();
  let config = loadConfig();
  let changed = false;
  const profileName = config.currentProfile || "default";

  if (args.key || args.k) {
    const val = args.key || args.k;
    updateConfig("apiKey", val);
    setProfileValue(profileName, "apiKey", val);
    logger.info(`✅ API Key 已更新`);
    changed = true;
  }

  if (args.url || args.u) {
    const val = args.url || args.u;
    updateConfig("baseUrl", val);
    setProfileValue(profileName, "baseUrl", val);
    logger.info(`✅ Base URL 已更新为: ${val}`);
    changed = true;
  }

  if (args.model || args.m) {
    const val = args.model || args.m;
    updateConfig("model", val);
    setProfileValue(profileName, "model", val);
    logger.info(`✅ Model 已更新为: ${val}`);
    changed = true;
  }

  if (args.provider) {
    const val = args.provider;
    updateConfig("provider", val);
    const preset = getProviderDefaults(val);
    if (preset.baseUrl) {
      updateConfig("baseUrl", preset.baseUrl);
      setProfileValue(profileName, "baseUrl", preset.baseUrl);
      logger.info(`✅ Provider '${val}' 已设置默认 Base URL: ${preset.baseUrl}`);
    }
    if (preset.model) {
      updateConfig("model", preset.model);
      setProfileValue(profileName, "model", preset.model);
      logger.info(`✅ Provider '${val}' 已设置默认模型: ${preset.model}`);
    }
    if (!preset.baseUrl && !preset.model) {
      logger.info(`✅ Provider 已更新为: ${val}`);
    }
    changed = true;
  }

  if (!changed) {
    console.log("当前生效配置 (Active Profile):");
    console.log(JSON.stringify(getActiveConfig(config), null, 2));
    console.log("\n使用方法:");
    console.log("  npx xiaozhou-chat config --key=sk-xxxx");
    console.log("  npx xiaozhou-chat config --url=https://api.example.com/v1");
    console.log("  npx xiaozhou-chat config --model=gpt-4");
    console.log("  npx xiaozhou-chat config --profile=default  # 切换配置环境");
    console.log("  npx xiaozhou-chat config --provider=newapi  # 切换 API Provider");
  }

  process.exit(0);
}
