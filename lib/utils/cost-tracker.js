/**
 * API 成本追踪器
 * 追踪 Token 使用量和计算成本
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

const STATS_DIR = path.join(path.dirname(__dirname), '.cost-stats');
const STATS_FILE = path.join(STATS_DIR, 'usage.json');

// 模型价格（每1K Token 的价格，美元）
// 来源：https://openai.com/pricing
const MODEL_PRICES = {
  // GPT-4
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-32k': { input: 0.06, output: 0.12 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-2024-04-09': { input: 0.01, output: 0.03 },
  'gpt-4-1106-preview': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  
  // GPT-3.5
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
  'gpt-3.5-turbo-1106': { input: 0.001, output: 0.002 },
  'gpt-3.5-turbo-0125': { input: 0.0015, output: 0.002 },
  
  // Claude
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'claude-3.5-sonnet-20240620': { input: 0.003, output: 0.015 },
  
  // DeepSeek
  'deepseek-chat': { input: 0.000001, output: 0.000002 },
  'deepseek-coder': { input: 0.000001, output: 0.000002 },
};

/**
 * 成本追踪器类
 */
class CostTracker {
  constructor(sessionId = null) {
    this.sessionId = sessionId;
    this.currentUsage = { input: 0, output: 0 };
    this.sessionUsage = new Map();
    this.ensureStatsDir();
    this.loadStats();
  }

  /**
   * 确保统计目录存在
   */
  ensureStatsDir() {
    if (!fs.existsSync(STATS_DIR)) {
      fs.mkdirSync(STATS_DIR, { recursive: true });
      logger.debug('创建成本统计目录', STATS_DIR);
    }
  }

  /**
   * 加载历史统计
   */
  loadStats() {
    try {
      if (fs.existsSync(STATS_FILE)) {
        const content = fs.readFileSync(STATS_FILE, 'utf-8');
        const data = JSON.parse(content);
        
        // 恢复会话统计
        if (data.sessions) {
          this.sessionUsage = new Map(Object.entries(data.sessions));
        }
        
        logger.debug('加载成本统计成功', { sessions: this.sessionUsage.size });
      }
    } catch (e) {
      logger.error('加载成本统计失败', e);
    }
  }

  /**
   * 保存统计到文件
   */
  saveStats() {
    try {
      const sessions = Object.fromEntries(this.sessionUsage);
      const data = {
        lastUpdated: new Date().toISOString(),
        sessions,
        total: this.calculateTotal()
      };
      
      fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
      logger.debug('保存成本统计成功');
    } catch (e) {
      logger.error('保存成本统计失败', e);
    }
  }

  /**
   * 添加使用量
   */
  addUsage(inputTokens, outputTokens, model = 'gpt-3.5-turbo') {
    this.currentUsage.input += inputTokens;
    this.currentUsage.output += outputTokens;
    
    // 如果有会话ID，记录会话使用
    if (this.sessionId) {
      if (!this.sessionUsage.has(this.sessionId)) {
        this.sessionUsage.set(this.sessionId, {
          model,
          usage: { input: 0, output: 0 },
          cost: 0,
          requests: 0,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
      }
      
      const sessionData = this.sessionUsage.get(this.sessionId);
      sessionData.usage.input += inputTokens;
      sessionData.usage.output += outputTokens;
      sessionData.cost = this.calculateCost(model, sessionData.usage);
      sessionData.requests++;
      sessionData.lastSeen = new Date().toISOString();
      
      if (!sessionData.model) {
        sessionData.model = model;
      }
    }
    
    // 自动保存
    this.saveStats();
    
    logger.debug('记录 Token 使用', {
      sessionId: this.sessionId,
      model,
      input: inputTokens,
      output: outputTokens
    });
  }

  /**
   * 计算成本
   */
  calculateCost(model, usage) {
    const prices = MODEL_PRICES[model];
    if (!prices) {
      logger.warn('未知模型价格', { model });
      return 0;
    }
    
    const inputCost = (usage.input / 1000) * prices.input;
    const outputCost = (usage.output / 1000) * prices.output;
    
    return parseFloat((inputCost + outputCost).toFixed(6));
  }

  /**
   * 获取当前会话成本
   */
  getCurrentCost(model = 'gpt-3.5-turbo') {
    return this.calculateCost(model, this.currentUsage);
  }

  /**
   * 获取当前会话使用量
   */
  getCurrentUsage() {
    return { ...this.currentUsage };
  }

  /**
   * 重置当前会话统计
   */
  resetCurrent() {
    this.currentUsage = { input: 0, output: 0 };
    logger.debug('重置当前会话统计');
  }

  /**
   * 获取所有会话统计
   */
  getAllSessions() {
    const sessions = [];
    
    for (const [, data] of this.sessionUsage.entries()) {
      sessions.push({
        sessionId: id,
        model: data.model,
        usage: { ...data.usage },
        cost: data.cost,
        requests: data.requests,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen
      });
    }
    
    // 按最后使用时间排序
    return sessions.sort((a, b) => 
      new Date(b.lastSeen) - new Date(a.lastSeen)
    );
  }

  /**
   * 获取总成本
   */
  calculateTotal() {
    let totalCost = 0;
    let totalInput = 0;
    let totalOutput = 0;
    let totalRequests = 0;
    
    for (const data of this.sessionUsage.values()) {
      totalCost += data.cost;
      totalInput += data.usage.input;
      totalOutput += data.usage.output;
      totalRequests += data.requests;
    }
    
    return {
      cost: parseFloat(totalCost.toFixed(6)),
      usage: { input: totalInput, output: totalOutput },
      requests: totalRequests,
      sessions: this.sessionUsage.size
    };
  }

  /**
   * 按日期分组统计
   */
  getDailyStats() {
    const daily = new Map();
    
    for (const [, data] of this.sessionUsage.entries()) {
      const date = data.lastSeen.split('T')[0];
      
      if (!daily.has(date)) {
        daily.set(date, {
          date,
          cost: 0,
          usage: { input: 0, output: 0 },
          requests: 0,
          sessions: 0
        });
      }
      
      const dayData = daily.get(date);
      dayData.cost += data.cost;
      dayData.usage.input += data.usage.input;
      dayData.usage.output += data.usage.output;
      dayData.requests += data.requests;
      dayData.sessions++;
    }
    
    return Array.from(daily.values())
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * 按模型分组统计
   */
  getModelStats() {
    const modelStats = new Map();
    
    for (const [, data] of this.sessionUsage.entries()) {
      const model = data.model || 'unknown';
      
      if (!modelStats.has(model)) {
        modelStats.set(model, {
          model,
          cost: 0,
          usage: { input: 0, output: 0 },
          requests: 0,
          sessions: 0
        });
      }
      
      const modelData = modelStats.get(model);
      modelData.cost += data.cost;
      modelData.usage.input += data.usage.input;
      modelData.usage.output += data.usage.output;
      modelData.requests += data.requests;
      modelData.sessions++;
    }
    
    return Array.from(modelStats.values())
      .sort((a, b) => b.cost - a.cost);
  }

  /**
   * 导出统计为 CSV
   */
  exportToCSV(filename = 'cost-export.csv') {
    const sessions = this.getAllSessions();
    
    const header = 'Session ID,Model,Input Tokens,Output Tokens,Total Tokens,Cost ($),Requests,First Seen,Last Seen\n';
    const rows = sessions.map(s => 
      `${s.sessionId},${s.model},${s.usage.input},${s.usage.output},` +
      `${s.usage.input + s.usage.output},${s.cost},${s.requests},${s.firstSeen},${s.lastSeen}`
    ).join('\n');
    
    const csv = header + rows;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, csv);
    logger.info('导出成本统计 CSV', { filepath, sessions: sessions.length });
    
    return filepath;
  }

  /**
   * 打印当前统计
   */
  printCurrentStats(model = 'gpt-3.5-turbo') {
    const usage = this.getCurrentUsage();
    const cost = this.getCurrentCost(model);
    const totalTokens = usage.input + usage.output;
    
    console.log('\n📊 当前会话 Token 使用：');
    console.log(`   输入: ${usage.input.toLocaleString()} tokens`);
    console.log(`   输出: ${usage.output.toLocaleString()} tokens`);
    console.log(`   总计: ${totalTokens.toLocaleString()} tokens`);
    console.log(`   预估成本: $${cost.toFixed(6)}`);
  }

  /**
   * 打印所有统计
   */
  printAllStats() {
    const total = this.calculateTotal();
    const daily = this.getDailyStats();
    const models = this.getModelStats();
    
    console.log('\n💰 成本统计总览：\n');
    console.log(`   总成本: $${total.cost.toFixed(6)}`);
    console.log(`   总 Tokens: ${(total.usage.input + total.usage.output).toLocaleString()}`);
    console.log(`   请求次数: ${total.requests}`);
    console.log(`   会话数: ${total.sessions}`);
    
    if (daily.length > 0) {
      console.log('\n📅 每日统计（最近7天）：');
      daily.slice(0, 7).forEach(day => {
        console.log(`   ${day.date}: $${day.cost.toFixed(6)} (${day.requests} 请求)`);
      });
    }
    
    if (models.length > 0) {
      console.log('\n🤖 按模型统计：');
      models.slice(0, 5).forEach(m => {
        const totalTokens = m.usage.input + m.usage.output;
        console.log(`   ${m.model}: $${m.cost.toFixed(6)} (${totalTokens.toLocaleString()} tokens, ${m.sessions} 会话)`);
      });
    }
  }

  /**
   * 清空所有统计
   */
  clearAll() {
    this.sessionUsage.clear();
    this.currentUsage = { input: 0, output: 0 };
    this.saveStats();
    logger.info('清空所有成本统计');
  }

  /**
   * 删除指定会话的统计
   */
  deleteSession(sessionId) {
    if (this.sessionUsage.delete(sessionId)) {
      this.saveStats();
      logger.info('删除会话统计', { sessionId });
      return true;
    }
    return false;
  }
}

/**
 * 单例实例
 */
let trackerInstance = null;

/**
 * 获取成本追踪器实例
 */
export function getCostTracker(sessionId = null) {
  if (!trackerInstance) {
    trackerInstance = new CostTracker(sessionId);
  } else if (sessionId) {
    trackerInstance.sessionId = sessionId;
  }
  return trackerInstance;
}

/**
 * 重置追踪器实例
 */
export function resetCostTracker() {
  if (trackerInstance) {
    trackerInstance.saveStats();
    trackerInstance = null;
  }
}

/**
 * 估算 Token 数量（简单的字符数估算）
 * 更精确的估算可以使用 gpt-tokenizer 库
 */
export function estimateTokens(text) {
  // 粗略估算：1 token ≈ 4 个英文字符，或 ≈ 2 个中文字符
  let tokens = 0;
  
  // 统计中文字符
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  tokens += chineseChars * 0.5; // 中文约 0.5 token/字
  
  // 统计英文字符
  const englishChars = text.length - chineseChars;
  tokens += englishChars * 0.25; // 英文约 0.25 token/字符
  
  return Math.ceil(tokens);
}

/**
 * 批量估算消息的 Token
 */
export function estimateMessagesTokens(messages) {
  let inputTokens = 0;
  
  for (const msg of messages) {
    inputTokens += estimateTokens(msg.content || '');
    // 添加一些固定开销用于角色标记等
    inputTokens += 4;
  }
  
  return inputTokens;
}

export { CostTracker, MODEL_PRICES };
