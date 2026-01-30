import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class StatsManager {
  constructor() {
    this.statsPath = path.join(os.homedir(), '.xzchat-stats.json');
    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      startTime: new Date().toISOString(),
      sessions: [],
      models: {}
    };
  }

  async load() {
    try {
      const data = await fs.readFile(this.statsPath, 'utf-8');
      this.stats = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.statsPath, JSON.stringify(this.stats, null, 2), 'utf-8');
  }

  async recordRequest(model, tokens, cost, responseTime) {
    await this.load();
    this.stats.totalRequests++;
    this.stats.totalTokens += tokens;
    this.stats.totalCost += cost;

    if (!this.stats.models[model]) {
      this.stats.models[model] = { requests: 0, tokens: 0, cost: 0, avgResponseTime: 0 };
    }
    const m = this.stats.models[model];
    m.requests++;
    m.tokens += tokens;
    m.cost += cost;
    m.avgResponseTime = ((m.avgResponseTime * (m.requests - 1)) + responseTime) / m.requests;

    await this.save();
  }

  async recordSession(name) {
    await this.load();
    this.stats.sessions.push({
      name,
      startTime: new Date().toISOString(),
      messages: 0
    });
    await this.save();
  }

  async getStats() {
    await this.load();
    const uptime = Math.floor((Date.now() - new Date(this.stats.startTime)) / 1000 / 60);
    return {
      ...this.stats,
      uptimeMinutes: uptime,
      avgTokensPerRequest: this.stats.totalRequests > 0 ? Math.floor(this.stats.totalTokens / this.stats.totalRequests) : 0,
      avgCostPerRequest: this.stats.totalRequests > 0 ? (this.stats.totalCost / this.stats.totalRequests).toFixed(4) : 0
    };
  }

  async reset() {
    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      startTime: new Date().toISOString(),
      sessions: [],
      models: {}
    };
    await this.save();
  }

  formatStats(stats) {
    return `
📊 使用统计

⏱️ 运行时间: ${stats.uptimeMinutes} 分钟
💬 总请求: ${stats.totalRequests}
🔤 总 Token: ${stats.totalTokens.toLocaleString()}
💰 总成本: $${stats.totalCost.toFixed(4)}

📈 平均值:
   • 每请求: ${stats.avgTokensPerRequest} tokens
   • 每请求: $${stats.avgCostPerRequest}

🤖 模型使用:
${Object.entries(stats.models).map(([model, m]) =>
  `   • ${model}: ${m.requests} 次, ${m.tokens} tokens, $${m.cost.toFixed(4)}, ${m.avgResponseTime.toFixed(2)}ms avg`
).join('\n')}
`.trim();
  }
}

const statsManager = new StatsManager();
export default statsManager;
export { StatsManager };
