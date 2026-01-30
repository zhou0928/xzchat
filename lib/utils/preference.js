import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const PREFERENCE_FILE = path.join(DATA_DIR, 'user-preferences.json');

/**
 * 用户偏好管理器
 * 管理用户个人偏好设置
 */
export class PreferenceManager {
  constructor() {
    this.preferences = {};
    this.loadPreferences();
  }

  async loadPreferences() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(PREFERENCE_FILE, 'utf-8');
      this.preferences = JSON.parse(data);
    } catch (error) {
      this.preferences = this.getDefaultPreferences();
      await this.savePreferences();
    }
  }

  async savePreferences() {
    await fs.writeFile(PREFERENCE_FILE, JSON.stringify(this.preferences, null, 2), 'utf-8');
  }

  getDefaultPreferences() {
    return {
      recentCommands: [],
      recentFiles: [],
      bookmarkedSessions: [],
      favoritePrompts: [],
      aliasMappings: {},
      customThemes: {},
      snippets: [],
      shortcuts: {},
      workspaces: []
    };
  }

  get(key) {
    return key ? this.preferences[key] : this.preferences;
  }

  set(key, value) {
    this.preferences[key] = value;
    this.savePreferences();
    return { success: true };
  }

  addRecentCommand(cmd) {
    const recent = this.preferences.recentCommands || [];
    const index = recent.indexOf(cmd);
    if (index > -1) recent.splice(index, 1);
    recent.unshift(cmd);
    if (recent.length > 20) recent.pop();
    this.preferences.recentCommands = recent;
    this.savePreferences();
    return { success: true };
  }

  getRecentCommands() {
    return this.preferences.recentCommands || [];
  }

  addFavoritePrompt(name, prompt) {
    const favorites = this.preferences.favoritePrompts || [];
    if (!favorites.some(f => f.name === name)) {
      favorites.push({ name, prompt, createdAt: new Date().toISOString() });
      this.preferences.favoritePrompts = favorites;
      this.savePreferences();
    }
    return { success: true };
  }

  getFavoritePrompts() {
    return this.preferences.favoritePrompts || [];
  }

  addSnippet(name, code, language) {
    const snippets = this.preferences.snippets || [];
    if (!snippets.some(s => s.name === name)) {
      snippets.push({ name, code, language, createdAt: new Date().toISOString() });
      this.preferences.snippets = snippets;
      this.savePreferences();
    }
    return { success: true };
  }

  getSnippets() {
    return this.preferences.snippets || [];
  }
}
