/**
 * 主题定制管理器 - 高级主题和UI定制
 */

const fs = require('fs').promises;
const path = require('path');

class ThemeCustomManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/themes-custom.json');
    this.themes = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.themes = JSON.parse(data);
    } catch (err) {
      this.themes = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.themes, null, 2));
  }

  add(name, colors, fonts, description = '') {
    const theme = {
      id: Date.now().toString(),
      name,
      colors, // { primary, secondary, background, text, accent, etc. }
      fonts, // { family, sizes: { small, medium, large, title, heading } }
      description,
      isDark: colors.background ? colors.background.startsWith('#0') || colors.background.startsWith('#1') : false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    this.themes.push(theme);
    this.save();
    return theme;
  }

  get(id) {
    return this.themes.find(t => t.id === id);
  }

  getAll() {
    return this.themes;
  }

  getByName(name) {
    return this.themes.find(t => t.name === name);
  }

  update(id, updates) {
    const index = this.themes.findIndex(t => t.id === id);
    if (index !== -1) {
      this.themes[index] = {
        ...this.themes[index],
        ...updates
      };
      this.save();
      return this.themes[index];
    }
    return null;
  }

  remove(id) {
    const index = this.themes.findIndex(t => t.id === id);
    if (index !== -1) {
      const removed = this.themes.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  duplicate(id, newName) {
    const original = this.get(id);
    if (!original) return null;

    const duplicate = this.add(
      newName || `${original.name} (copy)`,
      { ...original.colors },
      { ...original.fonts },
      original.description
    );

    return duplicate;
  }

  use(id) {
    const theme = this.get(id);
    if (!theme) return null;

    theme.usageCount++;
    this.save();
    return theme;
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.themes.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower)
    );
  }

  getStats() {
    return {
      total: this.themes.length,
      dark: this.themes.filter(t => t.isDark).length,
      light: this.themes.filter(t => !t.isDark).length,
      totalUsage: this.themes.reduce((sum, t) => sum + t.usageCount, 0),
      mostUsed: this.themes.sort((a, b) => b.usageCount - a.usageCount)[0]
    };
  }

  import(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const theme = this.add(data.name, data.colors, data.fonts, data.description);
      return { success: true, message: '主题导入成功', data: theme };
    } catch (err) {
      return { success: false, message: '主题导入失败: ' + err.message };
    }
  }

  export(id) {
    const theme = this.get(id);
    if (!theme) {
      return { success: false, message: '主题不存在' };
    }

    return {
      success: true,
      message: '主题导出成功',
      data: JSON.stringify(theme, null, 2)
    };
  }
}

module.exports = ThemeCustomManager;
