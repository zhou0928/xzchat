/**
 * 智能命令推荐引擎
 * 
 * 基于用户历史行为分析,智能推荐相关命令
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { logger } from './logger.js';
import { findProjectRoot } from '../config.js';

const projectRoot = findProjectRoot();
const baseDir = fs.existsSync(path.join(projectRoot, '.newapi-chat'))
  ? projectRoot
  : os.homedir();

const statsFile = path.join(baseDir, '.newapi-chat-stats.json');

// =============================================================================
// 统计数据结构
// =============================================================================

/**
 * 用户行为统计数据
 */
class UserStats {
  constructor() {
    this.commands = new Map(); // 命令使用次数
    this.contexts = new Map(); // 上下文关联
    this.patterns = new Map(); // 使用模式
    this.timestamp = Date.now();
  }
  
  /**
   * 记录命令使用
   */
  recordCommand(command, context = {}) {
    // 更新命令计数
    const count = this.commands.get(command) || 0;
    this.commands.set(command, count + 1);
    
    // 记录上下文
    if (context.sessionId) {
      const key = `${context.sessionId}:${command}`;
      this.contexts.set(key, (this.contexts.get(key) || 0) + 1);
    }
    
    // 记录时间模式
    const hour = new Date().getHours();
    const timeKey = `${hour}:${command}`;
    this.patterns.set(timeKey, (this.patterns.get(timeKey) || 0) + 1);
    
    this.timestamp = Date.now();
  }
  
  /**
   * 获取命令使用次数
   */
  getCommandCount(command) {
    return this.commands.get(command) || 0;
  }
  
  /**
   * 获取最常用的命令
   */
  getTopCommands(limit = 10) {
    const entries = Array.from(this.commands.entries())
      .sort((a, b) => b[1] - a[1]);
    return entries.slice(0, limit);
  }
  
  /**
   * 获取会话中的常用命令
   */
  getSessionTopCommands(sessionId, limit = 5) {
    const sessionCommands = [];
    
    for (const [key, count] of this.contexts.entries()) {
      const [sid, cmd] = key.split(':');
      if (sid === sessionId) {
        sessionCommands.push([cmd, count]);
      }
    }
    
    return sessionCommands
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
  
  /**
   * 获取当前时间段常用命令
   */
  getTimeBasedCommands(limit = 5) {
    const hour = new Date().getHours();
    const hourCommands = [];
    
    for (const [key, count] of this.patterns.entries()) {
      const [h, cmd] = key.split(':');
      if (parseInt(h) === hour) {
        hourCommands.push([cmd, count]);
      }
    }
    
    return hourCommands
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
  
  toJSON() {
    return {
      commands: Object.fromEntries(this.commands),
      contexts: Object.fromEntries(this.contexts),
      patterns: Object.fromEntries(this.patterns),
      timestamp: this.timestamp
    };
  }
  
  static fromJSON(data) {
    const stats = new UserStats();
    stats.commands = new Map(Object.entries(data.commands || {}));
    stats.contexts = new Map(Object.entries(data.contexts || {}));
    stats.patterns = new Map(Object.entries(data.patterns || {}));
    stats.timestamp = data.timestamp || Date.now();
    return stats;
  }
}

// =============================================================================
// 推荐引擎
// =============================================================================

/**
 * 命令推荐引擎
 */
export class RecommendationEngine {
  constructor(options = {}) {
    this.options = {
      maxRecommendations: options.maxRecommendations || 5,
      minConfidence: options.minConfidence || 0.3,
      sessionWeights: options.sessionWeights || {
        recent: 0.4,
        frequent: 0.3,
        contextual: 0.3
      }
    };
    
    this.stats = this.loadStats();
    this.commands = this.loadCommandRegistry();
  }
  
  /**
   * 加载统计数据
   */
  loadStats() {
    try {
      if (fs.existsSync(statsFile)) {
        const data = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
        return UserStats.fromJSON(data);
      }
    } catch (error) {
      logger.warn('加载统计数据失败', { error: error.message });
    }
    return new UserStats();
  }
  
  /**
   * 保存统计数据
   */
  saveStats() {
    try {
      fs.writeFileSync(statsFile, JSON.stringify(this.stats.toJSON(), null, 2));
    } catch (error) {
      logger.error('保存统计数据失败', { error: error.message });
    }
  }
  
  /**
   * 加载命令注册表
   */
  loadCommandRegistry() {
    return {
      // 基础命令
      '/help': { category: 'basic', description: '显示帮助信息' },
      '/version': { category: 'basic', description: '显示版本信息' },
      
      // 配置命令
      '/config': { category: 'config', description: '配置管理' },
      '/config init': { category: 'config', description: '初始化配置' },
      '/config set': { category: 'config', description: '设置配置项' },
      '/config show': { category: 'config', description: '显示配置' },
      '/config provider': { category: 'config', description: '设置 API Provider' },
      '/profile': { category: 'config', description: 'Profile 管理' },
      
      // 会话命令
      '/session': { category: 'session', description: '会话管理' },
      '/session list': { category: 'session', description: '列出到会话' },
      '/session create': { category: 'session', description: '创建新会话' },
      '/session switch': { category: 'session', description: '切换会话' },
      '/session delete': { category: 'session', description: '删除会话' },
      '/session search': { category: 'session', description: '搜索会话' },
      '/session clone': { category: 'session', description: '克隆会话' },
      
      // 分支命令
      '/branch': { category: 'branch', description: '分支管理' },
      '/branch create': { category: 'branch', description: '创建分支' },
      '/branch list': { category: 'branch', description: '列出分支' },
      '/branch switch': { category: 'branch', description: '切换分支' },
      '/branch merge': { category: 'branch', description: '合并分支' },
      '/branch tree': { category: 'branch', description: '显示分支树' },
      
      // 历史命令
      '/history': { category: 'history', description: '历史管理' },
      '/history clear': { category: 'history', description: '清除历史' },
      '/history export': { category: 'history', description: '导出历史' },
      '/history compress': { category: 'history', description: '压缩历史' },
      
      // Git 命令
      '/commit': { category: 'git', description: '生成提交信息' },
      '/review': { category: 'git', description: '代码审查' },
      '/git log': { category: 'git', description: '查看提交历史' },
      '/git diff': { category: 'git', description: '查看差异' },
      
      // RAG 命令
      '/rag': { category: 'rag', description: 'RAG 管理' },
      '/rag index': { category: 'rag', description: '索引代码库' },
      '/rag search': { category: 'rag', description: '搜索代码' },
      '/rag status': { category: 'rag', description: '查看索引状态' },
      
      // 文件命令
      '/load': { category: 'file', description: '加载文件' },
      '/scan': { category: 'file', description: '扫描项目' },
      '/save': { category: 'file', description: '保存对话' },
      
      // 工具命令
      '/tools': { category: 'tools', description: '工具管理' },
      '/tools list': { category: 'tools', description: '列出工具' },
      '/tools help': { category: 'tools', description: '工具帮助' },
      
      // 语音命令
      '/voice': { category: 'voice', description: '语音输入' },
      '/tts': { category: 'voice', description: '语音输出' },
      
      // 高级命令
      '/auto': { category: 'advanced', description: '智能体模式' },
      '/undo': { category: 'advanced', description: '撤销消息' },
      '/retry': { category: 'advanced', description: '重试消息' },
      '/continue': { category: 'advanced', description: '继续生成' },
      '/edit': { category: 'advanced', description: '编辑消息' }
    };
  }
  
  /**
   * 记录命令使用
   */
  record(command, context = {}) {
    this.stats.recordCommand(command, context);
    this.saveStats();
    
    logger.debug('命令已记录', { command, context });
  }
  
  /**
   * 获取推荐
   */
  getRecommendations(context = {}) {
    const recommendations = [];
    
    // 1. 基于会话历史的推荐
    if (context.sessionId) {
      const sessionCommands = this.stats.getSessionTopCommands(
        context.sessionId,
        this.options.maxRecommendations
      );
      
      sessionCommands.forEach(([cmd, count]) => {
        const confidence = Math.min(count / 10, 1.0);
        recommendations.push({
          command: cmd,
          description: this.commands[cmd]?.description || '',
          confidence,
          source: 'session'
        });
      });
    }
    
    // 2. 基于全局使用频率的推荐
    const topCommands = this.stats.getTopCommands(
      this.options.maxRecommendations
    );
    
    topCommands.forEach(([cmd, count]) => {
      // 避免重复
      if (!recommendations.find(r => r.command === cmd)) {
        const confidence = Math.min(count / 20, 1.0);
        recommendations.push({
          command: cmd,
          description: this.commands[cmd]?.description || '',
          confidence,
          source: 'global'
        });
      }
    });
    
    // 3. 基于时间的推荐
    const timeCommands = this.stats.getTimeBasedCommands(3);
    
    timeCommands.forEach(([cmd, count]) => {
      if (!recommendations.find(r => r.command === cmd)) {
        const confidence = Math.min(count / 5, 1.0);
        recommendations.push({
          command: cmd,
          description: this.commands[cmd]?.description || '',
          confidence,
          source: 'time'
        });
      }
    });
    
    // 4. 基于上下文的推荐
    const contextual = this.getContextualRecommendations(context);
    contextual.forEach(rec => {
      if (!recommendations.find(r => r.command === rec.command)) {
        recommendations.push(rec);
      }
    });
    
    // 5. 过滤和排序
    const filtered = recommendations
      .filter(r => r.confidence >= this.options.minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxRecommendations);
    
    logger.debug('生成推荐', {
      count: filtered.length,
      sources: filtered.map(r => r.source)
    });
    
    return filtered;
  }
  
  /**
   * 获取上下文相关的推荐
   */
  getContextualRecommendations(context) {
    const recommendations = [];
    
    // 根据最后一个命令推荐相关命令
    if (context.lastCommand) {
      const related = this.getRelatedCommands(context.lastCommand);
      related.forEach(cmd => {
        const count = this.stats.getCommandCount(cmd);
        const confidence = Math.min(count / 5, 0.8);
        
        if (confidence >= 0.3) {
          recommendations.push({
            command: cmd,
            description: this.commands[cmd]?.description || '',
            confidence,
            source: 'context'
          });
        }
      });
    }
    
    return recommendations;
  }
  
  /**
   * 获取相关命令
   */
  getRelatedCommands(command) {
    const relations = {
      '/config init': ['/config set', '/config show', '/profile'],
      '/commit': ['/git diff', '/review', '/git log'],
      '/rag index': ['/rag search', '/rag status', '/scan'],
      '/session create': ['/session switch', '/branch create'],
      '/branch create': ['/branch list', '/branch switch', '/branch merge'],
      '/review': ['/git diff', '/commit', '/load'],
      '/scan': ['/rag index', '/rag search', '/load'],
      '/load': ['/save', '/rag search', '/tools list'],
      '/undo': ['/retry', '/continue', '/edit'],
      '/auto': ['/tools list', '/rag search', '/scan']
    };
    
    return relations[command] || [];
  }
  
  /**
   * 搜索命令
   */
  searchCommands(query, limit = 10) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [cmd, info] of Object.entries(this.commands)) {
      // 搜索命令名称
      if (cmd.toLowerCase().includes(lowerQuery)) {
        const count = this.stats.getCommandCount(cmd);
        results.push({
          command: cmd,
          description: info.description,
          category: info.category,
          usage: count,
          relevance: 1.0
        });
        continue;
      }
      
      // 搜索描述
      if (info.description.toLowerCase().includes(lowerQuery)) {
        const count = this.stats.getCommandCount(cmd);
        results.push({
          command: cmd,
          description: info.description,
          category: info.category,
          usage: count,
          relevance: 0.8
        });
      }
    }
    
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }
  
  /**
   * 获取命令统计
   */
  getStats() {
    return {
      totalCommands: this.stats.commands.size,
      topCommands: this.stats.getTopCommands(10),
      timestamp: this.stats.timestamp
    };
  }
  
  /**
   * 清除统计数据
   */
  clearStats() {
    this.stats = new UserStats();
    this.saveStats();
    logger.info('统计数据已清除');
  }
}

// =============================================================================
// 默认实例
// =============================================================================

const defaultEngine = new RecommendationEngine();

// =============================================================================
// 快捷函数
// =============================================================================

/**
 * 记录命令使用
 */
export function recordCommand(command, context) {
  defaultEngine.record(command, context);
}

/**
 * 获取推荐
 */
export function getRecommendations(context) {
  return defaultEngine.getRecommendations(context);
}

/**
 * 搜索命令
 */
export function searchCommands(query, limit) {
  return defaultEngine.searchCommands(query, limit);
}

/**
 * 获取统计
 */
export function getRecommendationStats() {
  return defaultEngine.getStats();
}

export default RecommendationEngine;
