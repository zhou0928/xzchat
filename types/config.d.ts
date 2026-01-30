/**
 * Config Module Type Definitions
 * 配置模块类型定义
 */

export interface ProfileConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Config {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
  profiles: Record<string, ProfileConfig>;
  currentProfile: string;
  roles?: Record<string, string>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  embeddingModel?: string;
  showThinking?: boolean;
}

export interface ProviderPreset {
  baseUrl: string;
  model: string;
}

export interface CcSwitchProvider {
  id: string;
  name: string;
  appType: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export interface ConfigLoadOptions {
  useEnv?: boolean;
  useCcSwitch?: boolean;
}

export function findProjectRoot(startDir?: string): string;

export function getProviderDefaults(provider: string): ProviderPreset;

export function getCcSwitchProviders(): CcSwitchProvider[];

export function loadCcSwitchActiveEndpoint(): CcSwitchProvider | null;

export function initConfigFile(): void;

export function initProjectConfigFile(): void;

export function loadConfig(options?: ConfigLoadOptions): Config;

export function getWriteConfigFile(): string;

export function updateConfig(key: string, value: any): Config;

export function setProfileValue(profileName: string, key: string, value: any): Config;

export function setRole(name: string, prompt: string): Config;

export function getRoles(config: Config): Record<string, string>;

export function getActiveConfig(config: Config): {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  provider: string;
  providerName?: string;
};
