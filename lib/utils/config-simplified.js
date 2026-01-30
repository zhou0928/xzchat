import { getProviderDefaults, DEFAULT_PROVIDER } from "../config.js";
import { loadCcSwitchActiveEndpoint, mapCcSwitchProvider } from "../config.js";

/**
 * 配置优先级管理器
 * 简化配置优先级逻辑，使用优先级链
 */
export class ConfigPriorityManager {
  constructor() {
    this.priorityChain = [
      'env',           // 环境变量 (最高优先级)
      'ccSwitch',      // CC Switch
      'profile',       // 当前 Profile
      'config',        // 配置文件
      'preset',        // 预设 (最低优先级)
    ];
  }

  /**
   * 按优先级获取值
   */
  getValueByPriority(sources, key, defaultValue) {
    for (const source of this.priorityChain) {
      const value = sources[source]?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return defaultValue;
  }

  /**
   * 获取活跃配置（简化版）
   */
  getActiveConfigSimplified(config) {
    const profileName = config.currentProfile || "default";
    const profile = config.profiles?.[profileName] || {};
    
    // CC Switch 数据
    const ccEndpoint = loadCcSwitchActiveEndpoint();
    
    // 环境变量
    const envVars = {
      apiKey: process.env.NEWAPI_API_KEY || "",
      baseUrl: process.env.NEWAPI_BASE_URL || "",
      model: process.env.NEWAPI_MODEL || "",
      provider: process.env.NEWAPI_PROVIDER || "",
      systemPrompt: process.env.NEWAPI_SYSTEM_PROMPT || ""
    };
    
    // CC Switch 数据
    const ccData = ccEndpoint ? {
      apiKey: ccEndpoint.apiKey || "",
      baseUrl: ccEndpoint.baseUrl || "",
      model: ccEndpoint.model || "",
      provider: mapCcSwitchProvider(ccEndpoint.appType, ccEndpoint.name) || ""
    } : {};
    
    // Profile 数据
    const profileData = {
      apiKey: profile.apiKey || "",
      baseUrl: profile.baseUrl || "",
      model: profile.model || "",
      systemPrompt: profile.systemPrompt || ""
    };
    
    // Config 数据
    const configData = {
      apiKey: config.apiKey || "",
      baseUrl: config.baseUrl || "",
      model: config.model || "",
      systemPrompt: config.systemPrompt || "",
      provider: config.provider || ""
    };
    
    // 确定 Provider
    const provider = this.getValueByPriority(
      { env: envVars, ccSwitch: ccData, config: configData },
      'provider',
      DEFAULT_PROVIDER
    );
    
    // 获取预设
    const preset = getProviderDefaults(provider);
    const defaultPreset = getProviderDefaults(DEFAULT_PROVIDER);
    
    // 获取最终配置
    const apiKey = this.getValueByPriority(
      { env: envVars, ccSwitch: ccData, profile: profileData, config: configData },
      'apiKey',
      ""
    );
    
    const baseUrl = this.getValueByPriority(
      { 
        env: envVars, 
        ccSwitch: ccData, 
        profile: profileData, 
        config: configData,
        preset: { baseUrl: preset.baseUrl || defaultPreset.baseUrl }
      },
      'baseUrl',
      ""
    );
    
    const model = this.getValueByPriority(
      { 
        env: envVars, 
        ccSwitch: ccData, 
        profile: profileData, 
        config: configData,
        preset: { model: preset.model || defaultPreset.model }
      },
      'model',
      ""
    );
    
    const systemPrompt = this.getValueByPriority(
      { 
        profile: profileData, 
        config: configData,
        env: envVars
      },
      'systemPrompt',
      ""
    );
    
    return {
      apiKey,
      baseUrl,
      model,
      systemPrompt,
      provider,
      providerName: ccEndpoint?.name
    };
  }

  /**
   * 获取配置来源说明
   */
  getConfigSource(config, key) {
    const sources = {
      env: {},
      ccSwitch: {},
      profile: {},
      config: {},
      preset: {}
    };
    
    // 填充各来源数据
    if (key === 'provider') {
      sources.env[key] = process.env.NEWAPI_PROVIDER;
      sources.config[key] = config.provider;
    } else if (key === 'apiKey') {
      sources.env[key] = process.env.NEWAPI_API_KEY;
      const ccEndpoint = loadCcSwitchActiveEndpoint();
      sources.ccSwitch[key] = ccEndpoint?.apiKey;
      const profileName = config.currentProfile || "default";
      sources.profile[key] = config.profiles?.[profileName]?.apiKey;
      sources.config[key] = config.apiKey;
    }
    
    // 返回第一个有值的来源
    for (const source of this.priorityChain) {
      if (sources[source]?.[key]) {
        return source;
      }
    }
    
    return 'default';
  }
}

/**
 * 创建全局优先级管理器实例
 */
export const configPriorityManager = new ConfigPriorityManager();
