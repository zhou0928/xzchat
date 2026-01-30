/**
 * 集成管理器 - 第三方服务集成管理
 */

const fs = require('fs').promises;
const path = require('path');

class IntegrationManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/integrations.json');
    this.integrations = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.integrations = JSON.parse(data);
    } catch (err) {
      this.integrations = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.integrations, null, 2));
  }

  add(name, type, config, description = '') {
    const integration = {
      id: Date.now().toString(),
      name,
      type, // 'api', 'webhook', 'oauth', 'custom'
      config,
      description,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.integrations.push(integration);
    this.save();
    return integration;
  }

  get(id) {
    return this.integrations.find(i => i.id === id);
  }

  getAll() {
    return this.integrations;
  }

  getByType(type) {
    return this.integrations.filter(i => i.type === type);
  }

  update(id, updates) {
    const index = this.integrations.findIndex(i => i.id === id);
    if (index !== -1) {
      this.integrations[index] = {
        ...this.integrations[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.integrations[index];
    }
    return null;
  }

  remove(id) {
    const index = this.integrations.findIndex(i => i.id === id);
    if (index !== -1) {
      const removed = this.integrations.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.integrations.filter(i =>
      i.name.toLowerCase().includes(lower) ||
      i.description.toLowerCase().includes(lower) ||
      i.type.toLowerCase().includes(lower)
    );
  }

  getStats() {
    return {
      total: this.integrations.length,
      active: this.integrations.filter(i => i.status === 'active').length,
      byType: {
        api: this.integrations.filter(i => i.type === 'api').length,
        webhook: this.integrations.filter(i => i.type === 'webhook').length,
        oauth: this.integrations.filter(i => i.type === 'oauth').length,
        custom: this.integrations.filter(i => i.type === 'custom').length
      }
    };
  }

  async test(id) {
    const integration = this.get(id);
    if (!integration) return { success: false, message: '集成不存在' };

    // 模拟测试
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: '连接测试成功',
      responseTime: Math.floor(Math.random() * 100) + 50
    };
  }
}

module.exports = IntegrationManager;
