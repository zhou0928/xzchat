/**
 * 发布说明管理器
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReleaseNotesManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/release-notes.json');
    this.releases = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.releases = JSON.parse(data);
    } catch (err) {
      this.releases = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.releases, null, 2));
  }

  add(version, title, content, type = 'stable', date = null) {
    const release = {
      id: Date.now().toString(),
      version,
      title,
      content,
      type, // 'alpha', 'beta', 'rc', 'stable'
      date: date || new Date().toISOString(),
      features: [],
      improvements: [],
      fixes: [],
      breakingChanges: [],
      knownIssues: [],
      author: 'system'
    };
    this.releases.push(release);
    this.save();
    return release;
  }

  get(id) {
    return this.releases.find(r => r.id === id);
  }

  getByVersion(version) {
    return this.releases.filter(r => r.version === version);
  }

  getAll() {
    return this.releases.reverse();
  }

  getLatest() {
    return this.releases[this.releases.length - 1];
  }

  getLatestStable() {
    return this.releases.filter(r => r.type === 'stable').pop();
  }

  update(id, updates) {
    const index = this.releases.findIndex(r => r.id === id);
    if (index !== -1) {
      this.releases[index] = {
        ...this.releases[index],
        ...updates
      };
      this.save();
      return this.releases[index];
    }
    return null;
  }

  remove(id) {
    const index = this.releases.findIndex(r => r.id === id);
    if (index !== -1) {
      const removed = this.releases.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  formatMarkdown(id = null) {
    const release = id ? this.get(id) : this.getLatest();
    if (!release) return '';

    let md = `# Release ${release.version}: ${release.title}\n\n`;
    md += `**Release Date**: ${new Date(release.date).toLocaleDateString()}\n`;
    md += `**Type**: ${release.type.toUpperCase()}\n\n`;

    if (release.content) {
      md += `## Overview\n\n${release.content}\n\n`;
    }

    if (release.features && release.features.length > 0) {
      md += `## Features\n\n`;
      release.features.forEach(f => md += `- ${f}\n`);
      md += '\n';
    }

    if (release.improvements && release.improvements.length > 0) {
      md += `## Improvements\n\n`;
      release.improvements.forEach(i => md += `- ${i}\n`);
      md += '\n';
    }

    if (release.fixes && release.fixes.length > 0) {
      md += `## Bug Fixes\n\n`;
      release.fixes.forEach(f => md += `- ${f}\n`);
      md += '\n';
    }

    if (release.breakingChanges && release.breakingChanges.length > 0) {
      md += `## Breaking Changes\n\n`;
      release.breakingChanges.forEach(b => md += `- ${b}\n`);
      md += '\n';
    }

    if (release.knownIssues && release.knownIssues.length > 0) {
      md += `## Known Issues\n\n`;
      release.knownIssues.forEach(k => md += `- ${k}\n`);
      md += '\n';
    }

    return md;
  }

  getStats() {
    return {
      total: this.releases.length,
      byType: {
        alpha: this.releases.filter(r => r.type === 'alpha').length,
        beta: this.releases.filter(r => r.type === 'beta').length,
        rc: this.releases.filter(r => r.type === 'rc').length,
        stable: this.releases.filter(r => r.type === 'stable').length
      }
    };
  }
}

export default ReleaseNotesManager;
