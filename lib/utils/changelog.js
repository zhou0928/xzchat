/**
 * 变更日志管理器
 */

const fs = require('fs').promises;
const path = require('path');

class ChangelogManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/changelogs.json');
    this.entries = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.entries = JSON.parse(data);
    } catch (err) {
      this.entries = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.entries, null, 2));
  }

  add(version, type, changes, date = null) {
    const entry = {
      id: Date.now().toString(),
      version,
      type, // 'major', 'minor', 'patch'
      changes, // { added: [], changed: [], fixed: [], removed: [] }
      date: date || new Date().toISOString(),
      author: 'system'
    };
    this.entries.push(entry);
    this.save();
    return entry;
  }

  get(id) {
    return this.entries.find(e => e.id === id);
  }

  getByVersion(version) {
    return this.entries.filter(e => e.version === version);
  }

  getAll() {
    return this.entries.reverse();
  }

  getLatest() {
    return this.entries[this.entries.length - 1];
  }

  update(id, updates) {
    const index = this.entries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entries[index] = {
        ...this.entries[index],
        ...updates
      };
      this.save();
      return this.entries[index];
    }
    return null;
  }

  remove(id) {
    const index = this.entries.findIndex(e => e.id === id);
    if (index !== -1) {
      const removed = this.entries.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  formatMarkdown() {
    let md = '# Changelog\n\n';

    this.entries.slice().reverse().forEach(entry => {
      md += `## ${entry.version} (${new Date(entry.date).toLocaleDateString()})\n\n`;

      if (entry.changes.added && entry.changes.added.length > 0) {
        md += '### Added\n';
        entry.changes.added.forEach(change => {
          md += `- ${change}\n`;
        });
        md += '\n';
      }

      if (entry.changes.changed && entry.changes.changed.length > 0) {
        md += '### Changed\n';
        entry.changes.changed.forEach(change => {
          md += `- ${change}\n`;
        });
        md += '\n';
      }

      if (entry.changes.fixed && entry.changes.fixed.length > 0) {
        md += '### Fixed\n';
        entry.changes.fixed.forEach(change => {
          md += `- ${change}\n`;
        });
        md += '\n';
      }

      if (entry.changes.removed && entry.changes.removed.length > 0) {
        md += '### Removed\n';
        entry.changes.removed.forEach(change => {
          md += `- ${change}\n`;
        });
        md += '\n';
      }
    });

    return md;
  }

  getStats() {
    return {
      total: this.entries.length,
      byType: {
        major: this.entries.filter(e => e.type === 'major').length,
        minor: this.entries.filter(e => e.type === 'minor').length,
        patch: this.entries.filter(e => e.type === 'patch').length
      },
      totalChanges: this.entries.reduce((sum, e) => {
        return sum +
          (e.changes.added?.length || 0) +
          (e.changes.changed?.length || 0) +
          (e.changes.fixed?.length || 0) +
          (e.changes.removed?.length || 0);
      }, 0)
    };
  }
}

module.exports = ChangelogManager;
