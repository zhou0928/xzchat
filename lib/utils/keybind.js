import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class KeybindManager {
  constructor() {
    this.keybindsPath = path.join(os.homedir(), '.xzchat-keybinds.json');
    this.keybinds = {
      'Ctrl+C': { command: '/copy', description: '复制最后回复' },
      'Ctrl+L': { command: '/clear', description: '清屏' },
      'Ctrl+P': { command: '/history', description: '查看历史' },
      'Ctrl+N': { command: '/session new', description: '新会话' }
    };
  }

  async load() {
    try {
      const data = await fs.readFile(this.keybindsPath, 'utf-8');
      this.keybinds = { ...this.keybinds, ...JSON.parse(data) };
    } catch (error) {
      if (error.code === 'ENOENT') await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.keybindsPath, JSON.stringify(this.keybinds, null, 2), 'utf-8');
  }

  async add(key, command, description = '') {
    await this.load();
    this.keybinds[key] = { command, description };
    await this.save();
  }

  async remove(key) {
    await this.load();
    if (this.keybinds[key] && ['Ctrl+C', 'Ctrl+L', 'Ctrl+P', 'Ctrl+N'].includes(key)) {
      throw new Error('不能删除默认快捷键');
    }
    if (this.keybinds[key]) {
      delete this.keybinds[key];
      await this.save();
      return true;
    }
    return false;
  }

  async get(key) {
    await this.load();
    return this.keybinds[key];
  }

  async list() {
    await this.load();
    return Object.entries(this.keybinds).map(([key, binding]) => ({
      key,
      ...binding
    }));
  }

  async update(key, updates) {
    await this.load();
    if (this.keybinds[key]) {
      this.keybinds[key] = { ...this.keybinds[key], ...updates };
      await this.save();
      return this.keybinds[key];
    }
    return null;
  }

  formatList(keybinds) {
    if (keybinds.length === 0) return '暂无快捷键';
    let output = '';
    keybinds.forEach(kb => {
      output += `${kb.key.padEnd(12)} → ${kb.command}`;
      if (kb.description) output += ` (${kb.description})`;
      output += '\n';
    });
    return output.trim();
  }
}

const keybindManager = new KeybindManager();
export default keybindManager;
export { KeybindManager };
