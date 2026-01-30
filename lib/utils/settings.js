import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'global-settings.json');

/**
 * 全局设置管理器
 * 管理应用的全局配置项
 */
export class SettingsManager {
  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  getDefaultSettings() {
    return {
      theme: 'dark',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      fontSize: 14,
      autoSave: true,
      autoSaveInterval: 300,
      notifications: true,
      sound: false,
      debug: false,
      logLevel: 'info',
      maxHistory: 1000,
      maxCache: 100,
      proxy: '',
      apiTimeout: 30000,
      retryCount: 3,
      streamMode: true,
      streamDelay: 100
    };
  }

  async loadSettings() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const saved = JSON.parse(data);
      this.settings = { ...this.getDefaultSettings(), ...saved };
    } catch (error) {
      await this.saveSettings();
    }
  }

  async saveSettings() {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
  }

  get(key) {
    return key ? this.settings[key] : this.settings;
  }

  set(key, value) {
    if (this.settings.hasOwnProperty(key)) {
      this.settings[key] = value;
      this.saveSettings();
      return { success: true };
    }
    return { success: false, error: '无效的设置项' };
  }

  reset(key) {
    const defaults = this.getDefaultSettings();
    if (key) {
      if (defaults.hasOwnProperty(key)) {
        this.settings[key] = defaults[key];
        this.saveSettings();
        return { success: true };
      }
    } else {
      this.settings = defaults;
      this.saveSettings();
      return { success: true };
    }
    return { success: false, error: '无效的设置项' };
  }

  list() {
    return Object.entries(this.settings).map(([key, value]) => ({ key, value }));
  }
}
