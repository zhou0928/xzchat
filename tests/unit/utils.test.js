import { describe, it, expect } from 'vitest';
import { estimateTokens, calculateCost, sleep, chunkText } from '../lib/utils.js';

describe('Utils Module', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens for English text', () => {
      const tokens = estimateTokens('Hello world');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20); // Reasonable upper bound
    });

    it('should estimate tokens for Chinese text', () => {
      const tokens = estimateTokens('你好世界');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
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
      const short = estimateTokens('Hi');
      const long = estimateTokens('Hi '.repeat(100));
      expect(long).toBeGreaterThan(short);
    });

    it('should handle special characters', () => {
      const tokens = estimateTokens('Hello! @#$%^&*()');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle numbers', () => {
      const tokens = estimateTokens('1234567890');
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for GPT-3.5', () => {
      const cost = calculateCost('gpt-3.5-turbo', {
        input: 1000,
        output: 500
      });
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be reasonable
    });

    it('should calculate cost for GPT-4', () => {
      const cost = calculateCost('gpt-4', {
        input: 1000,
        output: 500
      });
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle zero tokens', () => {
      const cost = calculateCost('gpt-3.5-turbo', {
        input: 0,
        output: 0
      });
      expect(cost).toBe(0);
    });

    it('should handle only input tokens', () => {
      const cost = calculateCost('gpt-3.5-turbo', {
        input: 1000,
        output: 0
      });
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle only output tokens', () => {
      const cost = calculateCost('gpt-3.5-turbo', {
        input: 0,
        output: 500
      });
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle unknown model', () => {
      const cost = calculateCost('unknown-model', {
        input: 1000,
        output: 500
      });
      expect(cost).toBe(0); // Should return 0 for unknown model
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });

    it('should resolve after delay', async () => {
      await expect(sleep(50)).resolves.toBeUndefined();
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await sleep(0);
      const end = Date.now();
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('chunkText', () => {
    it('should split text into chunks', () => {
      const text = 'a'.repeat(100);
      const chunks = chunkText(text, 30);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should not split if text is shorter than chunk size', () => {
      const text = 'Hello';
      const chunks = chunkText(text, 100);
      expect(chunks.length).toBe(1);
    });

    it('should handle empty string', () => {
      const chunks = chunkText('', 100);
      expect(chunks).toEqual(['']);
    });

    it('should handle single chunk', () => {
      const text = 'Hello world';
      const chunks = chunkText(text, 100);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    it('should create chunks of appropriate size', () => {
      const text = 'a'.repeat(300);
      const chunks = chunkText(text, 100);
      
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(100);
      });
    });

    it('should handle unicode characters', () => {
      const text = '你好世界'.repeat(50);
      const chunks = chunkText(text, 50);
      
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('Utility Functions', () => {
    it('should have exported functions', () => {
      expect(typeof estimateTokens).toBe('function');
      expect(typeof calculateCost).toBe('function');
      expect(typeof sleep).toBe('function');
      expect(typeof chunkText).toBe('function');
    });
  });
});
