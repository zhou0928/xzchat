/**
 * 智能命令推荐引擎单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RecommendationEngine, recordCommand, getRecommendations, searchCommands } from '../../lib/utils/recommendation-engine.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('RecommendationEngine', () => {
  let engine;
  let statsFile;
  
  beforeEach(() => {
    // 创建临时统计文件路径
    statsFile = path.join(os.tmpdir(), `.test-recommendation-stats-${Date.now()}.json`);
    
    // 创建引擎实例
    engine = new RecommendationEngine({
      maxRecommendations: 5,
      minConfidence: 0.3,
      statsFile
    });
  });
  
  afterEach(() => {
    // 清理临时文件
    if (fs.existsSync(statsFile)) {
      fs.unlinkSync(statsFile);
    }
  });
  
  describe('构造函数', () => {
    it('应该创建推荐引擎实例', () => {
      expect(engine).toBeDefined();
      expect(engine.options.maxRecommendations).toBe(5);
      expect(engine.options.minConfidence).toBe(0.3);
    });
    
    it('应该使用默认配置', () => {
      const defaultEngine = new RecommendationEngine();
      expect(defaultEngine.options.maxRecommendations).toBe(5);
      expect(defaultEngine.options.minConfidence).toBe(0.3);
    });
  });
  
  describe('recordCommand', () => {
    it('应该记录命令使用', () => {
      engine.record('/help', { sessionId: 'test-session' });
      
      const stats = engine.getStats();
      expect(stats.totalCommands).toBeGreaterThan(0);
    });
    
    it('应该记录多个命令', () => {
      engine.record('/help');
      engine.record('/config');
      engine.record('/help');
      
      const stats = engine.getStats();
      expect(stats.totalCommands).toBeGreaterThanOrEqual(2);
    });
    
    it('应该正确计算命令使用次数', () => {
      engine.record('/help');
      engine.record('/help');
      engine.record('/help');
      
      expect(engine.stats.getCommandCount('/help')).toBe(3);
    });
    
    it('应该记录会话上下文', () => {
      engine.record('/help', { sessionId: 'session-1' });
      engine.record('/config', { sessionId: 'session-1' });
      engine.record('/rag', { sessionId: 'session-2' });
      
      const session1Cmds = engine.stats.getSessionTopCommands('session-1', 10);
      expect(session1Cmds).toContainEqual(['/help', 1]);
      expect(session1Cmds).toContainEqual(['/config', 1]);
    });
    
    it('应该记录时间模式', () => {
      const hour = new Date().getHours();
      engine.record('/help');
      engine.record('/config');
      
      const timeCmds = engine.stats.getTimeBasedCommands(10);
      const hasCurrentHour = timeCmds.some(([cmd]) => cmd === '/help' || cmd === '/config');
      expect(hasCurrentHour).toBe(true);
    });
  });
  
  describe('getRecommendations', () => {
    it('应该返回空数组（没有历史记录）', () => {
      const recommendations = engine.getRecommendations();
      expect(recommendations).toEqual([]);
    });
    
    it('应该基于使用频率推荐', () => {
      engine.record('/help');
      engine.record('/help');
      engine.record('/config');
      
      const recommendations = engine.getRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].command).toBe('/help'); // 使用最多
    });
    
    it('应该包含命令描述', () => {
      engine.record('/help');
      
      const recommendations = engine.getRecommendations();
      expect(recommendations[0].description).toBeDefined();
      expect(recommendations[0].description.length).toBeGreaterThan(0);
    });
    
    it('应该包含置信度分数', () => {
      engine.record('/help');
      engine.record('/help');
      engine.record('/help');
      
      const recommendations = engine.getRecommendations();
      expect(recommendations[0].confidence).toBeDefined();
      expect(recommendations[0].confidence).toBeGreaterThan(0);
      expect(recommendations[0].confidence).toBeLessThanOrEqual(1);
    });
    
    it('应该包含推荐来源', () => {
      engine.record('/help', { sessionId: 'test-session' });
      
      const recommendations = engine.getRecommendations({ sessionId: 'test-session' });
      expect(recommendations[0].source).toBe('session');
    });
    
    it('应该限制推荐数量', () => {
      for (let i = 0; i < 10; i++) {
        engine.record(`/cmd${i}`);
      }
      
      const recommendations = engine.getRecommendations();
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
    
    it('应该过滤低置信度推荐', () => {
      engine.record('/help');
      
      const highConfidenceEngine = new RecommendationEngine({
        minConfidence: 0.8,
        statsFile
      });
      highConfidenceEngine.record('/help');
      
      const recommendations = highConfidenceEngine.getRecommendations();
      expect(recommendations.every(r => r.confidence >= 0.8)).toBe(true);
    });
    
    it('应该基于上下文推荐', () => {
      engine.record('/commit');
      engine.record('/git diff');
      engine.record('/review');
      
      const recommendations = engine.getRecommendations({
        lastCommand: '/commit'
      });
      
      // 应该包含相关命令
      const hasRelated = recommendations.some(r => 
        r.command === '/git diff' || r.command === '/review'
      );
      expect(hasRelated).toBe(true);
    });
  });
  
  describe('searchCommands', () => {
    it('应该搜索命令名称', () => {
      const results = engine.searchCommands('help');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].command).toBe('/help');
    });
    
    it('应该搜索命令描述', () => {
      const results = engine.searchCommands('help');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].description.toLowerCase()).toContain('帮助');
    });
    
    it('应该返回搜索结果的相关性分数', () => {
      const results = engine.searchCommands('help');
      expect(results[0].relevance).toBeDefined();
      expect(results[0].relevance).toBeGreaterThan(0);
      expect(results[0].relevance).toBeLessThanOrEqual(1);
    });
    
    it('应该返回命令类别', () => {
      const results = engine.searchCommands('help');
      expect(results[0].category).toBeDefined();
    });
    
    it('应该限制搜索结果数量', () => {
      const results = engine.searchCommands('', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
    
    it('应该按相关性排序结果', () => {
      const results = engine.searchCommands('help');
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevance).toBeGreaterThanOrEqual(results[i].relevance);
      }
    });
    
    it('应该返回使用次数', () => {
      engine.record('/help');
      engine.record('/help');
      
      const results = engine.searchCommands('help');
      expect(results[0].usage).toBe(2);
    });
  });
  
  describe('getStats', () => {
    it('应该返回统计信息', () => {
      engine.record('/help');
      engine.record('/config');
      
      const stats = engine.getStats();
      expect(stats.totalCommands).toBeGreaterThan(0);
      expect(stats.topCommands).toBeDefined();
      expect(stats.timestamp).toBeDefined();
    });
    
    it('应该返回常用命令列表', () => {
      engine.record('/help');
      engine.record('/help');
      engine.record('/config');
      
      const stats = engine.getStats();
      expect(stats.topCommands.length).toBeGreaterThan(0);
      expect(stats.topCommands[0][0]).toBe('/help');
      expect(stats.topCommands[0][1]).toBe(2);
    });
  });
  
  describe('clearStats', () => {
    it('应该清除所有统计数据', () => {
      engine.record('/help');
      engine.record('/config');
      
      expect(engine.getStats().totalCommands).toBeGreaterThan(0);
      
      engine.clearStats();
      
      expect(engine.getStats().totalCommands).toBe(0);
    });
  });
  
  describe('getRelatedCommands', () => {
    it('应该返回相关命令', () => {
      const related = engine.getRelatedCommands('/commit');
      expect(related).toContain('/git diff');
      expect(related).toContain('/review');
      expect(related).toContain('/git log');
    });
    
    it('应该对未知命令返回空数组', () => {
      const related = engine.getRelatedCommands('/unknown');
      expect(related).toEqual([]);
    });
  });
});

describe('快捷函数', () => {
  beforeEach(() => {
    // 重置默认引擎
    const { defaultEngine } = require('../../lib/utils/recommendation-engine.js');
    defaultEngine.clearStats();
  });
  
  describe('recordCommand', () => {
    it('应该记录命令', () => {
      recordCommand('/help');
      
      const stats = getRecommendationStats();
      expect(stats.totalCommands).toBeGreaterThan(0);
    });
  });
  
  describe('getRecommendations', () => {
    it('应该返回推荐', () => {
      recordCommand('/help');
      
      const recommendations = getRecommendations();
      expect(recommendations).toBeDefined();
    });
  });
  
  describe('searchCommands', () => {
    it('应该搜索命令', () => {
      const results = searchCommands('help');
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

describe('边界情况', () => {
  let engine;
  
  beforeEach(() => {
    engine = new RecommendationEngine();
  });
  
  it('应该处理空字符串搜索', () => {
    const results = engine.searchCommands('');
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });
  
  it('应该处理未找到的命令', () => {
    const results = engine.searchCommands('nonexistent-command-xyz');
    expect(results).toEqual([]);
  });
  
  it('应该处理空上下文', () => {
    const recommendations = engine.getRecommendations({});
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
  });
  
  it('应该处理非常大的推荐数量', () => {
    const bigEngine = new RecommendationEngine({ maxRecommendations: 100 });
    for (let i = 0; i < 50; i++) {
      bigEngine.record(`/cmd${i}`);
    }
    
    const recommendations = bigEngine.getRecommendations();
    expect(recommendations.length).toBeLessThanOrEqual(100);
  });
  
  it('应该处理极高的置信度阈值', () => {
    const highEngine = new RecommendationEngine({ minConfidence: 0.99 });
    highEngine.record('/help');
    
    const recommendations = highEngine.getRecommendations();
    expect(recommendations.length).toBe(0); // 置信度不够高
  });
  
  it('应该处理重复的命令记录', () => {
    for (let i = 0; i < 100; i++) {
      engine.record('/help');
    }
    
    expect(engine.stats.getCommandCount('/help')).toBe(100);
  });
  
  it('应该处理特殊字符的命令', () => {
    engine.record('/help --verbose');
    engine.record('/config --key=value');
    
    const results = engine.searchCommands('help --verbose');
    expect(results.length).toBeGreaterThan(0);
  });
});
