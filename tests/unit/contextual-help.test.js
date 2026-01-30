/**
 * 上下文感知帮助系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContextualHelpEngine,
  ContextType,
  ContextState,
  updateContext,
  getContextualHelp,
  getQuickHelp
} from '../../lib/utils/contextual-help.js';

describe('ContextState', () => {
  let context;

  beforeEach(() => {
    context = new ContextState();
  });

  describe('构造函数', () => {
    it('应该初始化为空闲状态', () => {
      expect(context.contextType).toBe(ContextType.IDLE);
      expect(context.userLevel).toBe('intermediate');
      expect(context.messageCount).toBe(0);
    });

    it('应该初始化空的命令历史', () => {
      expect(context.previousCommands).toEqual([]);
    });

    it('应该初始化空的配置功能集', () => {
      expect(context.configuredFeatures.size).toBe(0);
    });
  });

  describe('上下文类型设置', () => {
    it('应该设置上下文类型', () => {
      context.setContextType(ContextType.CHATTING);
      expect(context.contextType).toBe(ContextType.CHATTING);
    });

    it('应该记录最后操作时间', () => {
      const before = Date.now();
      context.setContextType(ContextType.CHATTING);
      expect(context.lastActionTime).toBeDefined();

      const timeDiff = new Date(context.lastActionTime).getTime() - before;
      expect(timeDiff).toBeGreaterThanOrEqual(0);
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('命令记录', () => {
    it('应该记录命令', () => {
      context.recordCommand('/help');
      expect(context.previousCommands).toHaveLength(1);
      expect(context.previousCommands[0].command).toBe('/help');
    });

    it('应该记录多个命令', () => {
      context.recordCommand('/help');
      context.recordCommand('/config');
      context.recordCommand('/session list');
      expect(context.previousCommands).toHaveLength(3);
    });

    it('应该只保留最近 50 条命令', () => {
      for (let i = 0; i < 60; i++) {
        context.recordCommand(`/command${i}`);
      }
      expect(context.previousCommands.length).toBeLessThanOrEqual(50);
    });

    it('应该更新用户等级', () => {
      context.recordCommand('/help');
      expect(context.userLevel).toBe('beginner');

      for (let i = 0; i < 20; i++) {
        context.recordCommand(`/command${i}`);
      }
      expect(context.userLevel).toBe('intermediate');
    });

    it('应该检测配置的功能', () => {
      context.recordCommand('/index');
      expect(context.configuredFeatures.has('rag')).toBe(true);

      context.recordCommand('/commit');
      expect(context.configuredFeatures.has('git')).toBe(true);

      context.recordCommand('/session list');
      expect(context.configuredFeatures.has('session')).toBe(true);
    });
  });

  describe('会话管理', () => {
    it('应该设置会话 ID', () => {
      context.setSessionId('session-123');
      expect(context.sessionId).toBe('session-123');
    });

    it('应该设置消息数量', () => {
      context.setMessageCount(10);
      expect(context.messageCount).toBe(10);
    });
  });

  describe('错误记录', () => {
    it('应该记录错误', () => {
      const error = new Error('Test error');
      context.recordError(error);
      expect(context.lastError).toBeDefined();
      expect(context.lastError.message).toBe('Test error');
    });

    it('应该记录错误代码', () => {
      const error = new Error('Test error');
      error.code = 'TEST_CODE';
      context.recordError(error);
      expect(context.lastError.code).toBe('TEST_CODE');
    });
  });

  describe('常用命令', () => {
    it('应该返回空数组如果没有命令', () => {
      const common = context.getCommonCommands();
      expect(common).toEqual([]);
    });

    it('应该返回最常用的命令', () => {
      context.recordCommand('/help');
      context.recordCommand('/config');
      context.recordCommand('/help');
      context.recordCommand('/help');

      const common = context.getCommonCommands();
      expect(common.length).toBeGreaterThan(0);
      expect(common[0].command).toBe('/help');
      expect(common[0].count).toBe(3);
    });

    it('应该只返回前 5 个常用命令', () => {
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j <= i; j++) {
          context.recordCommand(`/command${i}`);
        }
      }

      const common = context.getCommonCommands();
      expect(common.length).toBeLessThanOrEqual(5);
    });
  });

  describe('上下文摘要', () => {
    it('应该返回完整的摘要', () => {
      context.setContextType(ContextType.CHATTING);
      context.setSessionId('session-1');
      context.setMessageCount(5);
      context.recordCommand('/help');

      const summary = context.getSummary();

      expect(summary.contextType).toBe(ContextType.CHATTING);
      expect(summary.messageCount).toBe(5);
      expect(summary.recentCommands).toContain('/help');
      expect(summary.hasError).toBe(false);
    });

    it('应该包含时间差', () => {
      context.setContextType(ContextType.CHATTING);
      const summary = context.getSummary();
      expect(summary.timeSinceLastAction).toBeGreaterThanOrEqual(0);
      expect(summary.timeSinceLastAction).toBeLessThan(1000);
    });
  });
});

describe('ContextualHelpEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ContextualHelpEngine();
  });

  describe('构造函数', () => {
    it('应该使用默认配置', () => {
      const defaultEngine = new ContextualHelpEngine();
      expect(defaultEngine.options.maxSuggestions).toBe(5);
      expect(defaultEngine.options.enableRecommendations).toBe(true);
      expect(defaultEngine.options.enableAutoFix).toBe(true);
    });

    it('应该接受自定义配置', () => {
      const customEngine = new ContextualHelpEngine({
        maxSuggestions: 10,
        enableRecommendations: false
      });
      expect(customEngine.options.maxSuggestions).toBe(10);
      expect(customEngine.options.enableRecommendations).toBe(false);
    });

    it('应该初始化帮助规则', () => {
      expect(engine.helpRules.size).toBeGreaterThan(0);
    });
  });

  describe('上下文更新', () => {
    it('应该更新上下文类型', () => {
      engine.updateContext({ contextType: ContextType.CHATTING });
      expect(engine.context.contextType).toBe(ContextType.CHATTING);
    });

    it('应该记录命令并自动检测上下文', () => {
      engine.updateContext({ command: '/session list' });
      expect(engine.context.contextType).toBe(ContextType.SESSION);
      expect(engine.context.previousCommands).toHaveLength(1);
    });

    it('应该设置会话 ID', () => {
      engine.updateContext({ sessionId: 'session-1' });
      expect(engine.context.sessionId).toBe('session-1');
    });

    it('应该设置消息数量', () => {
      engine.updateContext({ messageCount: 10 });
      expect(engine.context.messageCount).toBe(10);
    });

    it('应该记录错误并切换到错误状态', () => {
      const error = new Error('Test error');
      engine.updateContext({ error });
      expect(engine.context.contextType).toBe(ContextType.ERROR);
      expect(engine.context.lastError).toBeDefined();
    });
  });

  describe('上下文检测', () => {
    it('应该从命令检测会话上下文', () => {
      engine.updateContext({ command: '/session list' });
      expect(engine.context.contextType).toBe(ContextType.SESSION);
    });

    it('应该从命令检测分支上下文', () => {
      engine.updateContext({ command: '/branch create' });
      expect(engine.context.contextType).toBe(ContextType.BRANCH);
    });

    it('应该从命令检测配置上下文', () => {
      engine.updateContext({ command: '/config show' });
      expect(engine.context.contextType).toBe(ContextType.CONFIG);
    });

    it('应该从命令检测 RAG 上下文', () => {
      engine.updateContext({ command: '/index' });
      expect(engine.context.contextType).toBe(ContextType.RAG);
    });

    it('应该从命令检测 Git 上下文', () => {
      engine.updateContext({ command: '/commit' });
      expect(engine.context.contextType).toBe(ContextType.GIT);
    });

    it('应该从命令检测文件上下文', () => {
      engine.updateContext({ command: '/load' });
      expect(engine.context.contextType).toBe(ContextType.FILE);
    });

    it('应该将普通命令检测为对话状态', () => {
      engine.updateContext({ command: '/help' });
      expect(engine.context.contextType).toBe(ContextType.CHATTING);
    });
  });

  describe('上下文帮助生成', () => {
    it('应该为新用户生成欢迎帮助', () => {
      engine.updateContext({ messageCount: 0 });
      const help = engine.getContextualHelp();
      expect(help.helps.length).toBeGreaterThan(0);
      expect(help.helps[0].title).toContain('欢迎');
    });

    it('应该为错误状态生成修复帮助', () => {
      const error = new Error('API Key missing');
      engine.updateContext({ error });
      const help = engine.getContextualHelp();
      expect(help.helps.length).toBeGreaterThan(0);
      expect(help.helps[0].type).toBe('error_fix');
    });

    it('应该为配置状态生成配置帮助', () => {
      engine.updateContext({ contextType: ContextType.CONFIG });
      const help = engine.getContextualHelp();
      expect(help.helps.length).toBeGreaterThan(0);
      expect(help.helps[0].type).toBe('config');
    });

    it('应该为会话状态生成会话帮助', () => {
      engine.updateContext({ contextType: ContextType.SESSION });
      const help = engine.getContextualHelp();
      expect(help.helps.length).toBeGreaterThan(0);
      expect(help.helps[0].type).toBe('session');
    });

    it('应该为分支状态生成分支帮助', () => {
      engine.updateContext({ contextType: ContextType.BRANCH });
      const help = engine.getContextualHelp();
      expect(help.helps.length).toBeGreaterThan(0);
      expect(help.helps[0].type).toBe('branch');
    });
  });

  describe('格式化输出', () => {
    it('应该格式化帮助输出', () => {
      engine.updateContext({ contextType: ContextType.SESSION });
      const help = engine.getContextualHelp();
      const output = engine.formatHelpOutput(help);

      expect(typeof output).toBe('string');
      expect(output).toContain('=');
    });

    it('应该包含标题和描述', () => {
      engine.updateContext({ contextType: ContextType.SESSION });
      const help = engine.getContextualHelp();
      const output = engine.formatHelpOutput(help);

      expect(output).toContain('会话');
    });

    it('应该显示建议', () => {
      engine.updateContext({ contextType: ContextType.SESSION });
      const help = engine.getContextualHelp();
      const output = engine.formatHelpOutput(help);

      expect(output).toContain('建议');
    });
  });

  describe('简短帮助', () => {
    it('应该返回简短帮助', () => {
      engine.updateContext({ contextType: ContextType.SESSION });
      const quickHelp = engine.getQuickHelp();

      expect(typeof quickHelp).toBe('string');
      expect(quickHelp.length).toBeGreaterThan(0);
    });

    it('应该只显示主要建议', () => {
      engine.updateContext({ contextType: ContextType.SESSION });
      const quickHelp = engine.getQuickHelp();

      const lines = quickHelp.split('\n');
      expect(lines.length).toBeLessThan(10);
    });
  });

  describe('JSON 输出', () => {
    it('应该生成 JSON 格式', () => {
      const json = engine.toJSON();
      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.context).toBeDefined();
      expect(parsed.helps).toBeDefined();
      expect(parsed.recommendations).toBeDefined();
    });
  });
});

describe('快捷函数', () => {
  beforeEach(() => {
    // 清除单例状态
    vi.clearAllMocks();
  });

  describe('updateContext', () => {
    it('应该更新默认引擎的上下文', () => {
      updateContext({ contextType: ContextType.CHATTING });
      const help = getContextualHelp();
      expect(help.context.contextType).toBe(ContextType.CHATTING);
    });
  });

  describe('getContextualHelp', () => {
    it('应该返回上下文帮助', () => {
      const help = getContextualHelp();
      expect(help).toBeDefined();
      expect(help.context).toBeDefined();
      expect(help.helps).toBeDefined();
    });
  });

  describe('getQuickHelp', () => {
    it('应该返回简短帮助', () => {
      const quickHelp = getQuickHelp();
      expect(typeof quickHelp).toBe('string');
      expect(quickHelp.length).toBeGreaterThan(0);
    });
  });
});

describe('集成测试', () => {
  let engine;

  beforeEach(() => {
    engine = new ContextualHelpEngine();
  });

  it('应该处理完整的用户流程', () => {
    // 新用户
    engine.updateContext({ messageCount: 0 });
    let help = engine.getContextualHelp();
    expect(help.context.userLevel).toBe('beginner');
    expect(help.helps[0].title).toContain('欢迎');

    // 使用一些命令
    for (let i = 0; i < 15; i++) {
      engine.updateContext({ command: `/command${i}` });
    }
    help = engine.getContextualHelp();
    expect(help.context.userLevel).toBe('intermediate');

    // 出现错误
    const error = new Error('Connection failed');
    engine.updateContext({ error });
    help = engine.getContextualHelp();
    expect(help.context.hasError).toBe(true);
    expect(help.helps[0].type).toBe('error_fix');
  });

  it('应该根据上下文提供不同的帮助', () => {
    // 配置上下文
    engine.updateContext({ command: '/config' });
    let help = engine.getContextualHelp();
    expect(help.helps[0].type).toBe('config');

    // Git 上下文
    engine.updateContext({ command: '/commit' });
    help = engine.getContextualHelp();
    expect(help.helps[0].type).toBe('git');

    // 文件上下文
    engine.updateContext({ command: '/load' });
    help = engine.getContextualHelp();
    expect(help.helps[0].type).toBe('file');
  });

  it('应该为不同用户等级提供不同的建议', () => {
    // 新用户
    engine = new ContextualHelpEngine();
    engine.updateContext({ messageCount: 0 });
    let help = engine.getContextualHelp();
    expect(help.context.userLevel).toBe('beginner');

    // 高级用户
    engine = new ContextualHelpEngine();
    for (let i = 0; i < 60; i++) {
      engine.updateContext({ command: `/command${i}` });
    }
    help = engine.getContextualHelp();
    expect(help.context.userLevel).toBe('advanced');
  });
});
