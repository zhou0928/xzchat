import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../lib/utils/session-manager.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('SessionManager', () => {
  let manager;
  const tempDir = path.join(process.cwd(), '.sessions-test');

  beforeEach(() => {
    manager = new SessionManager(tempDir);
  });

  afterEach(async () => {
    // Clean up test sessions
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
    } catch (e) {
      // ignore
    }
  });

  describe('saveSession', () => {
    it('should save a session', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      expect(() => manager.saveSession(messages, 'test-session')).not.toThrow();
    });

    it('should create session file', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      manager.saveSession(messages, 'test-session');
      
      const filePath = path.join(tempDir, 'test-session.json');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should overwrite existing session', () => {
      const messages1 = [{ role: 'user', content: 'First' }];
      const messages2 = [{ role: 'user', content: 'Second' }];
      
      manager.saveSession(messages1, 'test-session');
      manager.saveSession(messages2, 'test-session');
      
      const loaded = manager.loadSession('test-session');
      expect(loaded[0].content).toBe('Second');
    });
  });

  describe('loadSession', () => {
    it('should load a saved session', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      manager.saveSession(messages, 'test-session');
      const loaded = manager.loadSession('test-session');
      
      expect(loaded).toEqual(messages);
    });

    it('should throw for non-existent session', () => {
      expect(() => manager.loadSession('non-existent')).toThrow();
    });

    it('should preserve message structure', () => {
      const messages = [
        { role: 'user', content: 'Test' },
        { role: 'assistant', content: 'Response', toolCalls: [] }
      ];
      
      manager.saveSession(messages, 'test-session');
      const loaded = manager.loadSession('test-session');
      
      expect(loaded[1].toolCalls).toBeDefined();
      expect(Array.isArray(loaded[1].toolCalls)).toBe(true);
    });
  });

  describe('listSessions', () => {
    it('should return empty array initially', () => {
      const sessions = manager.listSessions();
      expect(sessions).toEqual([]);
    });

    it('should list saved sessions', () => {
      manager.saveSession([{ role: 'user', content: 'Hello' }], 'session-1');
      manager.saveSession([{ role: 'user', content: 'Hi' }], 'session-2');
      
      const sessions = manager.listSessions();
      expect(sessions.length).toBe(2);
    });

    it('should include session metadata', () => {
      manager.saveSession([{ role: 'user', content: 'Hello' }], 'test-session');
      
      const sessions = manager.listSessions();
      expect(sessions[0]).toHaveProperty('id');
      expect(sessions[0]).toHaveProperty('messageCount');
      expect(sessions[0]).toHaveProperty('lastUpdated');
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', () => {
      manager.saveSession([{ role: 'user', content: 'Hello' }], 'test-session');
      manager.deleteSession('test-session');
      
      expect(() => manager.loadSession('test-session')).toThrow();
    });

    it('should throw for non-existent session', () => {
      expect(() => manager.deleteSession('non-existent')).toThrow();
    });

    it('should remove session from list', () => {
      manager.saveSession([{ role: 'user', content: 'Hello' }], 'test-session');
      manager.deleteSession('test-session');
      
      const sessions = manager.listSessions();
      expect(sessions.length).toBe(0);
    });
  });

  describe('exportSession', () => {
    it('should export session as JSON', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      manager.saveSession(messages, 'test-session');
      
      const exported = manager.exportSession('test-session', 'json');
      const parsed = JSON.parse(exported);
      
      expect(parsed).toEqual(messages);
    });

    it('should export session as Markdown', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];
      manager.saveSession(messages, 'test-session');
      
      const exported = manager.exportSession('test-session', 'markdown');
      
      expect(exported).toContain('User');
      expect(exported).toContain('Hello');
      expect(exported).toContain('Assistant');
      expect(exported).toContain('Hi!');
    });

    it('should throw for invalid format', () => {
      expect(() => manager.exportSession('test-session', 'invalid'))
        .toThrow();
    });
  });

  describe('searchSessions', () => {
    it('should return empty array for no matches', () => {
      manager.saveSession([{ role: 'user', content: 'Hello' }], 'test-session');
      
      const results = manager.searchSessions('nonexistent');
      expect(results).toEqual([]);
    });

    it('should search in message content', () => {
      manager.saveSession([
        { role: 'user', content: 'How to use React' },
        { role: 'assistant', content: 'React is a library' }
      ], 'test-session');
      
      const results = manager.searchSessions('React');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search across sessions', () => {
      manager.saveSession([{ role: 'user', content: 'Python tutorial' }], 'session-1');
      manager.saveSession([{ role: 'user', content: 'JavaScript guide' }], 'session-2');
      
      const pythonResults = manager.searchSessions('Python');
      const jsResults = manager.searchSessions('JavaScript');
      
      expect(pythonResults.length).toBe(1);
      expect(jsResults.length).toBe(1);
    });

    it('should be case insensitive', () => {
      manager.saveSession([{ role: 'user', content: 'HELLO' }], 'test-session');
      
      const results = manager.searchSessions('hello');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('cloneSession', () => {
    it('should clone a session', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      manager.saveSession(messages, 'source-session');
      
      manager.cloneSession('source-session', 'clone-session');
      
      const source = manager.loadSession('source-session');
      const clone = manager.loadSession('clone-session');
      
      expect(clone).toEqual(source);
    });

    it('should create independent clone', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      manager.saveSession(messages, 'source-session');
      
      manager.cloneSession('source-session', 'clone-session');
      
      // Modify clone
      const clone = manager.loadSession('clone-session');
      clone.push({ role: 'user', content: 'New message' });
      manager.saveSession(clone, 'clone-session');
      
      const source = manager.loadSession('source-session');
      expect(source.length).toBe(1);
    });

    it('should throw for non-existent source', () => {
      expect(() => manager.cloneSession('non-existent', 'clone'))
        .toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages array', () => {
      expect(() => manager.saveSession([], 'test-session')).not.toThrow();
      
      const loaded = manager.loadSession('test-session');
      expect(loaded).toEqual([]);
    });

    it('should handle session ID with special characters', () => {
      const sessionId = 'test-session-123_abc';
      const messages = [{ role: 'user', content: 'Hello' }];
      
      expect(() => manager.saveSession(messages, sessionId)).not.toThrow();
      expect(() => manager.loadSession(sessionId)).not.toThrow();
    });

    it('should handle large sessions', () => {
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        role: 'user',
        content: `Message ${i}`
      }));
      
      expect(() => manager.saveSession(messages, 'large-session')).not.toThrow();
      
      const loaded = manager.loadSession('large-session');
      expect(loaded.length).toBe(1000);
    });

    it('should handle messages with tool calls', () => {
      const messages = [
        {
          role: 'user',
          content: 'Hello',
          toolCalls: [
            {
              id: 'call_1',
              type: 'function',
              function: {
                name: 'test',
                arguments: '{}'
              }
            }
          ]
        }
      ];
      
      manager.saveSession(messages, 'test-session');
      const loaded = manager.loadSession('test-session');
      
      expect(loaded[0].toolCalls).toBeDefined();
      expect(loaded[0].toolCalls[0].function.name).toBe('test');
    });
  });
});
