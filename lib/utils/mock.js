/**
 * Mock数据管理器
 */

const fs = require('fs').promises;
const path = require('path');

class MockManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/mocks.json');
    this.mocks = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.mocks = JSON.parse(data);
    } catch (err) {
      this.mocks = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.mocks, null, 2));
  }

  add(name, type, data, description = '') {
    const mock = {
      id: Date.now().toString(),
      name,
      type, // 'response', 'error', 'stream', 'function'
      data,
      description,
      tags: [],
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    this.mocks.push(mock);
    this.save();
    return mock;
  }

  get(id) {
    return this.mocks.find(m => m.id === id);
  }

  getByName(name) {
    return this.mocks.find(m => m.name === name);
  }

  getAll() {
    return this.mocks;
  }

  getByType(type) {
    return this.mocks.filter(m => m.type === type);
  }

  getByTag(tag) {
    return this.mocks.filter(m => m.tags.includes(tag));
  }

  update(id, updates) {
    const index = this.mocks.findIndex(m => m.id === id);
    if (index !== -1) {
      this.mocks[index] = {
        ...this.mocks[index],
        ...updates
      };
      this.save();
      return this.mocks[index];
    }
    return null;
  }

  remove(id) {
    const index = this.mocks.findIndex(m => m.id === id);
    if (index !== -1) {
      const removed = this.mocks.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  use(id) {
    const mock = this.get(id);
    if (!mock) return null;

    mock.usageCount++;
    this.save();
    return mock;
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.mocks.filter(m =>
      m.name.toLowerCase().includes(lower) ||
      m.description.toLowerCase().includes(lower)
    );
  }

  generate(type, config = {}) {
    const generators = {
      user: () => ({
        id: Date.now().toString(),
        name: `User_${Math.floor(Math.random() * 1000)}`,
        email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        role: ['admin', 'user', 'guest'][Math.floor(Math.random() * 3)]
      }),
      response: () => ({
        status: 200,
        data: { success: true, message: 'OK' },
        timestamp: new Date().toISOString()
      }),
      error: () => ({
        status: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred'
        }
      })
    };

    const generator = generators[type] || (() => ({}));
    return generator();
  }

  getStats() {
    return {
      total: this.mocks.length,
      byType: {
        response: this.mocks.filter(m => m.type === 'response').length,
        error: this.mocks.filter(m => m.type === 'error').length,
        stream: this.mocks.filter(m => m.type === 'stream').length,
        function: this.mocks.filter(m => m.type === 'function').length
      },
      totalUsage: this.mocks.reduce((sum, m) => sum + m.usageCount, 0)
    };
  }
}

module.exports = MockManager;
