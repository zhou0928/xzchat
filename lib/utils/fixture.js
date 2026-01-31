/**
 * 测试fixture管理器
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FixtureManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/fixtures.json');
    this.fixtures = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.fixtures = JSON.parse(data);
    } catch (err) {
      this.fixtures = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.fixtures, null, 2));
  }

  add(name, data, type = 'data', description = '') {
    const fixture = {
      id: Date.now().toString(),
      name,
      type, // 'data', 'file', 'database', 'api'
      data,
      description,
      tags: [],
      dependencies: [],
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    this.fixtures.push(fixture);
    this.save();
    return fixture;
  }

  get(id) {
    return this.fixtures.find(f => f.id === id);
  }

  getByName(name) {
    return this.fixtures.find(f => f.name === name);
  }

  getAll() {
    return this.fixtures;
  }

  getByType(type) {
    return this.fixtures.filter(f => f.type === type);
  }

  getByTag(tag) {
    return this.fixtures.filter(f => f.tags.includes(tag));
  }

  update(id, updates) {
    const index = this.fixtures.findIndex(f => f.id === id);
    if (index !== -1) {
      this.fixtures[index] = {
        ...this.fixtures[index],
        ...updates
      };
      this.save();
      return this.fixtures[index];
    }
    return null;
  }

  remove(id) {
    const index = this.fixtures.findIndex(f => f.id === id);
    if (index !== -1) {
      const removed = this.fixtures.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  load(id) {
    const fixture = this.get(id);
    if (!fixture) return null;

    fixture.usageCount++;
    this.save();
    return fixture;
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.fixtures.filter(f =>
      f.name.toLowerCase().includes(lower) ||
      f.description.toLowerCase().includes(lower)
    );
  }

  createSet(name, fixtureIds, description = '') {
    const set = {
      id: Date.now().toString(),
      name,
      description,
      type: 'set',
      fixtureIds,
      createdAt: new Date().toISOString()
    };

    this.fixtures.push(set);
    this.save();
    return set;
  }

  loadSet(id) {
    const set = this.get(id);
    if (!set || set.type !== 'set') return null;

    const fixtures = set.fixtureIds.map(fid => this.get(fid)).filter(f => f);
    return {
      set,
      fixtures
    };
  }

  getStats() {
    return {
      total: this.fixtures.length,
      byType: {
        data: this.fixtures.filter(f => f.type === 'data').length,
        file: this.fixtures.filter(f => f.type === 'file').length,
        database: this.fixtures.filter(f => f.type === 'database').length,
        api: this.fixtures.filter(f => f.type === 'api').length,
        set: this.fixtures.filter(f => f.type === 'set').length
      },
      totalUsage: this.fixtures.reduce((sum, f) => sum + f.usageCount, 0)
    };
  }
}

export default FixtureManager;
