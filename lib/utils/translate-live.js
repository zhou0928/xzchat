import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class TranslateLiveManager {
  constructor() {
    this.configPath = path.join(os.homedir(), '.xzchat-translate-live.json');
    this.enabled = false;
    this.targetLanguage = 'zh-CN';
    this.sourceLanguage = 'auto';
    this.history = [];
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(data);
      this.enabled = config.enabled || false;
      this.targetLanguage = config.targetLanguage || 'zh-CN';
      this.sourceLanguage = config.sourceLanguage || 'auto';
      this.history = config.history || [];
    } catch (error) {
      if (error.code === 'ENOENT') await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify({
      enabled: this.enabled,
      targetLanguage: this.targetLanguage,
      sourceLanguage: this.sourceLanguage,
      history: this.history
    }, null, 2), 'utf-8');
  }

  async enable(targetLanguage = 'zh-CN', sourceLanguage = 'auto') {
    await this.load();
    this.enabled = true;
    this.targetLanguage = targetLanguage;
    this.sourceLanguage = sourceLanguage;
    await this.save();
  }

  async disable() {
    await this.load();
    this.enabled = false;
    await this.save();
  }

  async toggle() {
    await this.load();
    this.enabled = !this.enabled;
    await this.save();
    return this.enabled;
  }

  async setTargetLanguage(lang) {
    await this.load();
    this.targetLanguage = lang;
    await this.save();
  }

  async addToHistory(original, translated) {
    await this.load();
    this.history.push({
      original,
      translated,
      timestamp: new Date().toISOString()
    });
    if (this.history.length > 100) this.history = this.history.slice(-100);
    await this.save();
  }

  async getHistory(limit = 10) {
    await this.load();
    return this.history.slice(-limit).reverse();
  }

  async clearHistory() {
    await this.load();
    this.history = [];
    await this.save();
  }

  getLanguageName(code) {
    const languages = {
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어',
      'fr': 'Français',
      'de': 'Deutsch',
      'es': 'Español',
      'ru': 'Русский',
      'auto': '自动检测'
    };
    return languages[code] || code;
  }

  formatHistory(history) {
    if (history.length === 0) return '暂无翻译历史';
    let output = '';
    history.forEach((item, i) => {
      const time = new Date(item.timestamp).toLocaleString('zh-CN');
      output += `${i + 1}. ${time}\n`;
      output += `   原文: ${item.original.substring(0, 50)}...\n`;
      output += `   译文: ${item.translated.substring(0, 50)}...\n\n`;
    });
    return output.trim();
  }
}

const translateLiveManager = new TranslateLiveManager();
export default translateLiveManager;
export { TranslateLiveManager };
