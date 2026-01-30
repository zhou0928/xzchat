/**
 * Token 和成本追踪命令
 * /token - 管理 Token 统计和成本追踪
 */

import { getCostTracker, estimateMessagesTokens, MODEL_PRICES } from '../utils/cost-tracker.js';
import { logger } from '../utils/logger.js';

/**
 * 处理 /token 命令
 */
export async function handleTokenCommand(args, messages, currentModel = 'gpt-3.5-turbo') {
  const action = args[0];

  if (!action || ['help', '-h', '--help'].includes(action)) {
    return showTokenHelp();
  }

  try {
    switch (action) {
      case 'current':
      case 'now':
        return showCurrentStats(messages, currentModel);
      
      case 'history':
        return showHistoryStats();
      
      case 'daily':
        return showDailyStats();
      
      case 'model':
        return showModelStats();
      
      case 'export':
        return exportStats(args[1]);
      
      case 'reset':
        return resetStats(args[1]);
      
      case 'all':
        return showAllStats(messages, currentModel);
      
      case 'clear':
        return clearStats();
      
      default:
        return `❌ 未知操作: ${action}\n\n${showTokenHelp()}`;
    }
  } catch (e) {
    logger.error('Token 命令执行失败', e);
    return `❌ 执行失败: ${e.message}`;
  }
}

/**
 * 显示帮助信息
 */
function showTokenHelp() {
  return `
💰 Token 和成本追踪

追踪 Token 使用量和 API 成本。

用法：
  /token <action> [options]

操作：
  /token current          查看当前会话统计
  /token history          查看所有历史会话统计
  /token daily            查看每日统计
  /token model            查看按模型分组统计
  /token export [文件名]  导出统计为 CSV
  /token reset [会话ID]   重置指定会话统计（不指定则重置当前）
  /token all              显示所有统计
  /token clear            清空所有统计

示例：
  /token current
  /token history
  /token daily
  /token export my-stats.csv
  /token reset

支持的模型价格（每1K Token）：
${Object.entries(MODEL_PRICES).slice(0, 5).map(([k, v]) => 
  `  ${k}: $${v.input.toFixed(4)} (in) / $${v.output.toFixed(4)} (out)`
).join('\n')}
  ... 更多模型请查看完整价格表

注意：
  - 成本基于模型官方价格估算
  - 实际费用可能与 API 账单略有差异
  - Token 估算是基于字符数的近似值
`;
}

/**
 * 显示当前会话统计
 */
function showCurrentStats(messages, model) {
  const tracker = getCostTracker();
  const estimated = estimateMessagesTokens(messages);
  const cost = calculateEstimatedCost(estimated, model);
  
  let output = '📊 当前会话统计：\n\n';
  output += `消息数: ${messages.length}\n`;
  output += `输入 Token: ${estimated.toLocaleString()} (估算)\n`;
  output += `当前模型: ${model}\n`;
  output += `预估成本: $${cost.toFixed(6)}\n`;
  output += `参考价格: $${MODEL_PRICES[model]?.input.toFixed(4)} (in) / $${MODEL_PRICES[model]?.output.toFixed(4)} (out) / 1K tokens\n`;
  
  // 获取实际使用的统计（如果有）
  const actualUsage = tracker.getCurrentUsage();
  if (actualUsage.input > 0 || actualUsage.output > 0) {
    output += '\n实际使用（API 返回）：\n';
    output += `  输入: ${actualUsage.input.toLocaleString()} tokens\n`;
    output += `  输出: ${actualUsage.output.toLocaleString()} tokens\n`;
    output += `  总计: ${(actualUsage.input + actualUsage.output).toLocaleString()} tokens\n`;
    output += `  实际成本: $${tracker.getCurrentCost(model).toFixed(6)}\n`;
  }
  
  return output;
}

/**
 * 显示历史统计
 */
function showHistoryStats() {
  const tracker = getCostTracker();
  const sessions = tracker.getAllSessions();
  
  if (sessions.length === 0) {
    return '📭 暂无历史统计\n\n使用 /token current 查看当前会话';
  }
  
  let output = `📋 历史会话统计 (${sessions.length} 个会话)：\n\n`;
  
  sessions.slice(0, 10).forEach((s, i) => {
    const shortId = s.sessionId.length > 15 ? s.sessionId.substring(0, 12) + '...' : s.sessionId;
    const totalTokens = s.usage.input + s.usage.output;
    const date = new Date(s.lastSeen).toLocaleDateString('zh-CN');
    
    output += `${i + 1}. ${shortId}\n`;
    output += `   模型: ${s.model}\n`;
    output += `   Tokens: ${totalTokens.toLocaleString()} (in: ${s.usage.input.toLocaleString()}, out: ${s.usage.output.toLocaleString()})\n`;
    output += `   成本: $${s.cost.toFixed(6)}\n`;
    output += `   请求: ${s.requests} 次\n`;
    output += `   日期: ${date}\n\n`;
  });
  
  if (sessions.length > 10) {
    output += `... 还有 ${sessions.length - 10} 个会话\n`;
  }
  
  // 总计
  const total = tracker.calculateTotal();
  output += `\n总计:\n`;
  output += `  总成本: $${total.cost.toFixed(6)}\n`;
  output += `  总 Tokens: ${(total.usage.input + total.usage.output).toLocaleString()}\n`;
  output += `  总请求: ${total.requests} 次\n`;
  
  return output.trim();
}

/**
 * 显示每日统计
 */
function showDailyStats() {
  const tracker = getCostTracker();
  const daily = tracker.getDailyStats();
  
  if (daily.length === 0) {
    return '📭 暂无每日统计';
  }
  
  let output = '📅 每日统计（最近30天）：\n\n';
  output += '日期          | 成本($)    | Tokens    | 请求次数 | 会话数\n';
  output += '--------------|------------|-----------|----------|--------\n';
  
  daily.slice(0, 30).forEach(day => {
    const totalTokens = day.usage.input + day.usage.output;
    const cost = day.cost.toFixed(6).padStart(10);
    const tokens = totalTokens.toLocaleString().padStart(9);
    const requests = day.requests.toString().padStart(8);
    const sessions = day.sessions.toString().padStart(6);
    output += `${day.date} | ${cost} | ${tokens} | ${requests} | ${sessions}\n`;
  });
  
  return output.trim();
}

/**
 * 显示模型统计
 */
function showModelStats() {
  const tracker = getCostTracker();
  const models = tracker.getModelStats();
  
  if (models.length === 0) {
    return '📭 暂无模型统计';
  }
  
  let output = '🤖 按模型统计：\n\n';
  output += '模型             | 成本($)    | Tokens    | 请求次数 | 会话数\n';
  output += '-----------------|------------|-----------|----------|--------\n';
  
  models.forEach(m => {
    const totalTokens = m.usage.input + m.usage.output;
    const model = m.model.padEnd(15);
    const cost = m.cost.toFixed(6).padStart(10);
    const tokens = totalTokens.toLocaleString().padStart(9);
    const requests = m.requests.toString().padStart(8);
    const sessions = m.sessions.toString().padStart(6);
    output += `${model} | ${cost} | ${tokens} | ${requests} | ${sessions}\n`;
  });
  
  return output.trim();
}

/**
 * 导出统计
 */
function exportStats(filename) {
  const tracker = getCostTracker();
  const exportFile = filename || `cost-export-${Date.now()}.csv`;
  
  try {
    const filepath = tracker.exportToCSV(exportFile);
    return `✅ 统计已导出到: ${filepath}`;
  } catch (e) {
    throw new Error(`导出失败: ${e.message}`);
  }
}

/**
 * 重置统计
 */
function resetStats(sessionId) {
  const tracker = getCostTracker();
  
  if (sessionId) {
    // 删除指定会话
    const deleted = tracker.deleteSession(sessionId);
    if (deleted) {
      return `✅ 已删除会话统计: ${sessionId}`;
    } else {
      return `❌ 会话不存在: ${sessionId}`;
    }
  } else {
    // 重置当前会话
    tracker.resetCurrent();
    return '✅ 已重置当前会话统计';
  }
}

/**
 * 显示所有统计
 */
function showAllStats(messages, model) {
  const tracker = getCostTracker();
  
  let output = showCurrentStats(messages, model);
  output += '\n\n';
  output += showHistoryStats();
  
  return output;
}

/**
 * 清空所有统计
 */
function clearStats() {
  const tracker = getCostTracker();
  tracker.clearAll();
  return '✅ 已清空所有统计';
}

/**
 * 计算预估成本
 */
function calculateEstimatedCost(inputTokens, model) {
  const prices = MODEL_PRICES[model];
  if (!prices) {
    return 0;
  }
  
  // 假设输出是输入的 30%
  const outputTokens = Math.ceil(inputTokens * 0.3);
  
  const inputCost = (inputTokens / 1000) * prices.input;
  const outputCost = (outputTokens / 1000) * prices.output;
  
  return parseFloat((inputCost + outputCost).toFixed(6));
}
