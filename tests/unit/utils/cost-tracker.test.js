import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CostTracker, getCostTracker, resetCostTracker, estimateTokens, estimateMessagesTokens } from '../lib/utils/cost-tracker.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('Cost Tracker Module', () => {
  let tracker;
  const tempDir = path.join(process.cwd(), '.cost-stats-test');

  beforeEach(() => {
    // 使用临时目录
    vi.spyOn(CostTracker.prototype, 'ensureStatsDir').mockImplementation(function() {
      this.statsDir = tempDir;
    });
    
    tracker = new CostTracker('test-session');
  });

  afterEach(async () => {
    resetCostTracker();
    // 清理临时文件
    try {
      await fs.unlink(path.join(tempDir, 'usage.json'));
    } catch (e) {
      // ignore
    }
    try {
      await fs.rmdir(tempDir);
    } catch (e) {
      // ignore
    }
  });

  describe('CostTracker', () => {
    describe('addUsage', () => {
      it('should add usage to current session', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        const usage = tracker.getCurrentUsage();
        
        expect(usage.input).toBe(1000);
        expect(usage.output).toBe(500);
      });

      it('should add usage to session history', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        const sessions = tracker.getAllSessions();
        
        expect(sessions.length).toBeGreaterThan(0);
        expect(sessions[0].sessionId).toBe('test-session');
      });

      it('should calculate cost correctly for GPT-3.5', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        const cost = tracker.getCurrentCost('gpt-3.5-turbo');
        
        // GPT-3.5-turbo: input $0.0015/1K, output $0.002/1K
        // 1000 * 0.0015 / 1000 + 500 * 0.002 / 1000 = 0.0015 + 0.001 = 0.0025
        expect(cost).toBeCloseTo(0.0025, 6);
      });

      it('should handle multiple requests', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        tracker.addUsage(2000, 1000, 'gpt-3.5-turbo');
        
        const usage = tracker.getCurrentUsage();
        expect(usage.input).toBe(3000);
        expect(usage.output).toBe(1500);
      });
    });

    describe('getCurrentCost', () => {
      it('should return 0 for no usage', () => {
        const cost = tracker.getCurrentCost('gpt-3.5-turbo');
        expect(cost).toBe(0);
      });

      it('should calculate cost for different models', () => {
        tracker.addUsage(1000, 500, 'gpt-4');
        const cost = tracker.getCurrentCost('gpt-4');
        
        expect(cost).toBeGreaterThan(0);
      });
    });

    describe('getCurrentUsage', () => {
      it('should return usage object', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        const usage = tracker.getCurrentUsage();
        
        expect(usage).toHaveProperty('input');
        expect(usage).toHaveProperty('output');
        expect(usage.input).toBe(1000);
        expect(usage.output).toBe(500);
      });

      it('should return copy of usage', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        const usage1 = tracker.getCurrentUsage();
        const usage2 = tracker.getCurrentUsage();
        
        expect(usage1).not.toBe(usage2);
      });
    });

    describe('resetCurrent', () => {
      it('should reset current usage', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        tracker.resetCurrent();
        
        const usage = tracker.getCurrentUsage();
        expect(usage.input).toBe(0);
        expect(usage.output).toBe(0);
      });
    });

    describe('getAllSessions', () => {
      it('should return empty array initially', () => {
        const sessions = tracker.getAllSessions();
        expect(sessions).toEqual([]);
      });

      it('should return all sessions', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo', 'session-1');
        tracker.addUsage(2000, 1000, 'gpt-4', 'session-2');
        
        const sessions = tracker.getAllSessions();
        expect(sessions.length).toBe(2);
      });

      it('should sort by last seen', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo', 'session-1');
        tracker.addUsage(2000, 1000, 'gpt-4', 'session-2');
        
        const sessions = tracker.getAllSessions();
        expect(sessions[0].sessionId).toBe('session-2');
      });
    });

    describe('calculateTotal', () => {
      it('should return zero for no usage', () => {
        const total = tracker.calculateTotal();
        expect(total.cost).toBe(0);
        expect(total.usage.input).toBe(0);
        expect(total.usage.output).toBe(0);
      });

      it('should calculate total across all sessions', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        tracker.addUsage(2000, 1000, 'gpt-4');
        
        const total = tracker.calculateTotal();
        expect(total.cost).toBeGreaterThan(0);
        expect(total.usage.input).toBe(3000);
        expect(total.usage.output).toBe(1500);
      });

      it('should count sessions', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo', 'session-1');
        tracker.addUsage(2000, 1000, 'gpt-4', 'session-2');
        
        const total = tracker.calculateTotal();
        expect(total.sessions).toBe(2);
      });
    });

    describe('getDailyStats', () => {
      it('should return empty array initially', () => {
        const stats = tracker.getDailyStats();
        expect(stats).toEqual([]);
      });

      it('should group by date', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        
        const stats = tracker.getDailyStats();
        expect(stats.length).toBe(1);
        expect(stats[0]).toHaveProperty('date');
        expect(stats[0]).toHaveProperty('cost');
      });
    });

    describe('getModelStats', () => {
      it('should return empty array initially', () => {
        const stats = tracker.getModelStats();
        expect(stats).toEqual([]);
      });

      it('should group by model', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        tracker.addUsage(2000, 1000, 'gpt-4');
        
        const stats = tracker.getModelStats();
        expect(stats.length).toBe(2);
        expect(stats[0].model).toBe('gpt-4'); // Should be sorted by cost
        expect(stats[1].model).toBe('gpt-3.5-turbo');
      });
    });

    describe('exportToCSV', () => {
      it('should export to CSV file', async () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        
        const filepath = await tracker.exportToCSV('test-export.csv');
        const content = await fs.readFile(filepath, 'utf-8');
        
        expect(content).toContain('Session ID');
        expect(content).toContain('test-session');
        
        // Clean up
        await fs.unlink(filepath);
      });
    });

    describe('printCurrentStats', () => {
      it('should print stats without throwing', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        expect(() => tracker.printCurrentStats('gpt-3.5-turbo')).not.toThrow();
      });
    });

    describe('printAllStats', () => {
      it('should print all stats without throwing', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        expect(() => tracker.printAllStats()).not.toThrow();
      });
    });

    describe('clearAll', () => {
      it('should clear all stats', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo');
        tracker.clearAll();
        
        const total = tracker.calculateTotal();
        expect(total.cost).toBe(0);
        expect(total.sessions).toBe(0);
      });
    });

    describe('deleteSession', () => {
      it('should delete a session', () => {
        tracker.addUsage(1000, 500, 'gpt-3.5-turbo', 'session-1');
        const deleted = tracker.deleteSession('session-1');
        
        expect(deleted).toBe(true);
        const sessions = tracker.getAllSessions();
        expect(sessions.length).toBe(0);
      });

      it('should return false for non-existent session', () => {
        const deleted = tracker.deleteSession('non-existent');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for English text', () => {
      const tokens = estimateTokens('Hello world');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should estimate tokens for Chinese text', () => {
      const tokens = estimateTokens('你好世界');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should estimate tokens for mixed text', () => {
      const tokens = estimateTokens('Hello 你好 world 世界');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle empty string', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });

    it('should scale with text length', () => {
      const short = estimateTokens('Hello');
      const long = estimateTokens('Hello '.repeat(100));
      expect(long).toBeGreaterThan(short);
    });
  });

  describe('estimateMessagesTokens', () => {
    it('should estimate tokens for messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      const tokens = estimateMessagesTokens(messages);
      expect(tokens).toBeGreaterThan(0);
    });

    it('should add fixed overhead per message', () => {
      const messages = [
        { role: 'user', content: 'Hello' }
      ];
      
      const tokens = estimateMessagesTokens(messages);
      expect(tokens).toBeGreaterThan(estimateTokens('Hello'));
    });

    it('should handle empty messages array', () => {
      const tokens = estimateMessagesTokens([]);
      expect(tokens).toBe(0);
    });

    it('should handle messages without content', () => {
      const messages = [
        { role: 'user' },
        { role: 'assistant' }
      ];
      
      const tokens = estimateMessagesTokens(messages);
      expect(tokens).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCostTracker', () => {
    it('should return singleton instance', () => {
      const tracker1 = getCostTracker();
      const tracker2 = getCostTracker();
      expect(tracker1).toBe(tracker2);
    });

    it('should update session ID', () => {
      const tracker = getCostTracker('session-1');
      expect(tracker.sessionId).toBe('session-1');
      
      const tracker2 = getCostTracker('session-2');
      expect(tracker2.sessionId).toBe('session-2');
    });
  });

  describe('resetCostTracker', () => {
    it('should reset the tracker', () => {
      const tracker1 = getCostTracker('session-1');
      resetCostTracker();
      
      const tracker2 = getCostTracker('session-2');
      expect(tracker1).not.toBe(tracker2);
    });
  });
});
