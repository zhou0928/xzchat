/**
 * Webhook管理器 - Webhook配置和事件管理
 */

const fs = require('fs').promises;
const path = require('path');

class WebhookManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/webhooks.json');
    this.webhooks = [];
    this.logs = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.webhooks = parsed.webhooks || [];
      this.logs = parsed.logs || [];
    } catch (err) {
      this.webhooks = [];
      this.logs = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify({ webhooks: this.webhooks, logs: this.logs }, null, 2));
  }

  add(url, events, description = '', headers = {}) {
    const webhook = {
      id: Date.now().toString(),
      url,
      events: Array.isArray(events) ? events : [events],
      description,
      headers,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0
    };
    this.webhooks.push(webhook);
    this.save();
    return webhook;
  }

  get(id) {
    return this.webhooks.find(w => w.id === id);
  }

  getAll() {
    return this.webhooks;
  }

  getByEvent(event) {
    return this.webhooks.filter(w => w.events.includes(event));
  }

  update(id, updates) {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index !== -1) {
      this.webhooks[index] = {
        ...this.webhooks[index],
        ...updates
      };
      this.save();
      return this.webhooks[index];
    }
    return null;
  }

  remove(id) {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index !== -1) {
      const removed = this.webhooks.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  async trigger(event, payload = {}) {
    const webhooks = this.getByEvent(event).filter(w => w.status === 'active');
    const results = [];

    for (const webhook of webhooks) {
      const result = await this._sendWebhook(webhook, event, payload);
      results.push(result);

      webhook.lastTriggered = new Date().toISOString();
      webhook.triggerCount++;
    }

    this.save();
    return results;
  }

  async _sendWebhook(webhook, event, payload) {
    const log = {
      id: Date.now().toString(),
      webhookId: webhook.id,
      webhookUrl: webhook.url,
      event,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
      responseTime: null,
      error: null
    };

    try {
      // 模拟发送
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
      const responseTime = Date.now() - startTime;

      log.status = 'success';
      log.responseTime = responseTime;
    } catch (err) {
      log.status = 'failed';
      log.error = err.message;
    }

    this.logs.push(log);
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    this.save();

    return log;
  }

  getLogs(webhookId = null, limit = 50) {
    let logs = webhookId
      ? this.logs.filter(l => l.webhookId === webhookId)
      : this.logs;
    return logs.slice(-limit).reverse();
  }

  clearLogs(webhookId = null) {
    if (webhookId) {
      this.logs = this.logs.filter(l => l.webhookId !== webhookId);
    } else {
      this.logs = [];
    }
    this.save();
  }

  getStats() {
    return {
      total: this.webhooks.length,
      active: this.webhooks.filter(w => w.status === 'active').length,
      totalTriggers: this.webhooks.reduce((sum, w) => sum + w.triggerCount, 0),
      logsCount: this.logs.length,
      successRate: this.logs.length > 0
        ? (this.logs.filter(l => l.status === 'success').length / this.logs.length * 100).toFixed(2)
        : 0
    };
  }
}

module.exports = WebhookManager;
