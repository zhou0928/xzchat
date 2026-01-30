/**
 * 成就系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Achievement,
  AchievementEngine,
  AchievementRarity,
  AchievementCategory,
  createAchievementEngine,
  createBasicAchievements,
  createCommandAchievements,
  createTutorialAchievements,
  recordMessage,
  recordCommand,
  recordSessionCreate,
  recordBranchCreate,
  showAchievements,
  showStats
} from '../../lib/utils/achievement.js';

describe('Achievement', () => {
  let achievement;

  beforeEach(() => {
    achievement = new Achievement({
      id: 'test-achievement',
      name: 'Test Achievement',
      description: 'A test achievement',
      icon: '🏆',
      rarity: AchievementRarity.COMMON,
      category: AchievementCategory.USAGE,
      points: 10,
      criteria: {
        type: 'message_count',
        value: 5
      }
    });
  });

  it('should create an achievement with correct properties', () => {
    expect(achievement.id).toBe('test-achievement');
    expect(achievement.name).toBe('Test Achievement');
    expect(achievement.description).toBe('A test achievement');
    expect(achievement.icon).toBe('🏆');
    expect(achievement.rarity).toBe('common');
    expect(achievement.category).toBe('usage');
    expect(achievement.points).toBe(10);
    expect(achievement.unlocked).toBe(false);
  });

  it('should check criteria for message_count', () => {
    const event1 = { type: 'message', count: 3 };
    const result1 = achievement.checkCriteria(event1);
    expect(result1).toBe(false);
    expect(achievement.progress).toBe(60);

    const event2 = { type: 'message', count: 5 };
    const result2 = achievement.checkCriteria(event2);
    expect(result2).toBe(true);
    expect(achievement.progress).toBe(100);
  });

  it('should check criteria for command_count', () => {
    achievement.criteria = {
      type: 'command_count',
      value: 10,
      commands: ['session']
    };

    const event1 = { type: 'command', command: 'help', count: 5 };
    const result1 = achievement.checkCriteria(event1);
    expect(result1).toBe(false);

    const event2 = { type: 'command', command: 'session', count: 10 };
    const result2 = achievement.checkCriteria(event2);
    expect(result2).toBe(true);
  });

  it('should check criteria for tutorial_complete', () => {
    achievement.criteria = {
      type: 'tutorial_complete',
      tutorials: ['quick-start']
    };

    const event1 = { type: 'tutorial_complete', tutorialId: 'session-management' };
    const result1 = achievement.checkCriteria(event1);
    expect(result1).toBe(false);

    const event2 = { type: 'tutorial_complete', tutorialId: 'quick-start' };
    const result2 = achievement.checkCriteria(event2);
    expect(result2).toBe(true);
  });

  it('should unlock achievement', () => {
    achievement.criteria = { type: 'message_count', value: 1 };
    achievement.checkCriteria({ type: 'message', count: 1 });

    const unlocked = achievement.unlock();
    expect(unlocked).toBe(true);
    expect(achievement.unlocked).toBe(true);
    expect(achievement.unlockedAt).toBeDefined();
  });

  it('should not unlock twice', () => {
    achievement.criteria = { type: 'message_count', value: 1 };
    achievement.checkCriteria({ type: 'message', count: 1 });
    achievement.unlock();

    const unlocked2 = achievement.unlock();
    expect(unlocked2).toBe(false);
  });

  it('should reset achievement', () => {
    achievement.criteria = { type: 'message_count', value: 1 };
    achievement.checkCriteria({ type: 'message', count: 1 });
    achievement.unlock();

    achievement.reset();
    expect(achievement.progress).toBe(0);
    expect(achievement.unlocked).toBe(false);
    expect(achievement.unlockedAt).toBeNull();
  });

  it('should get display info', () => {
    const info = achievement.getDisplayInfo();
    expect(info.id).toBe('test-achievement');
    expect(info.name).toBe('Test Achievement');
    expect(info.description).toBe('A test achievement');
    expect(info.icon).toBe('🏆');
    expect(info.rarity).toBe('common');
    expect(info.category).toBe('usage');
    expect(info.points).toBe(10);
    expect(info.unlocked).toBe(false);
  });

  it('should hide secret achievements', () => {
    achievement.secret = true;
    achievement.unlocked = false;

    const info = achievement.getDisplayInfo();
    expect(info.name).toBe('???');
    expect(info.description).toBe('???');
    expect(info.icon).toBe('❓');
    expect(info.hidden).toBe(true);
  });

  it('should show secret achievements when unlocked', () => {
    achievement.secret = true;
    achievement.unlock();

    const info = achievement.getDisplayInfo();
    expect(info.name).toBe('Test Achievement');
    expect(info.description).toBe('A test achievement');
    expect(info.icon).toBe('🏆');
    expect(info.hidden).toBe(false);
  });
});

describe('AchievementEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AchievementEngine({
      autoSave: false,
      notifyOnUnlock: false
    });
  });

  it('should create an engine with default options', () => {
    const defaultEngine = new AchievementEngine();
    expect(defaultEngine.options.autoSave).toBe(true);
    expect(defaultEngine.options.notifyOnUnlock).toBe(true);
  });

  it('should register an achievement', () => {
    const achievement = new Achievement({
      id: 'test',
      name: 'Test',
      description: 'Test achievement'
    });

    engine.registerAchievement(achievement);
    expect(engine.achievements.has('test')).toBe(true);
  });

  it('should register achievement from options', () => {
    engine.registerAchievement({
      id: 'test',
      name: 'Test',
      description: 'Test achievement'
    });

    const achievement = engine.getAchievement('test');
    expect(achievement).toBeDefined();
    expect(achievement.id).toBe('test');
  });

  it('should register multiple achievements', () => {
    const achievements = [
      { id: 'a1', name: 'A1', description: 'A1' },
      { id: 'a2', name: 'A2', description: 'A2' },
      { id: 'a3', name: 'A3', description: 'A3' }
    ];

    engine.registerAchievements(achievements);
    expect(engine.achievements.size).toBe(3);
  });

  it('should get achievement by id', () => {
    engine.registerAchievement({
      id: 'test',
      name: 'Test',
      description: 'Test achievement'
    });

    const achievement = engine.getAchievement('test');
    expect(achievement).toBeDefined();
  });

  it('should return undefined for non-existent achievement', () => {
    const achievement = engine.getAchievement('non-existent');
    expect(achievement).toBeUndefined();
  });

  it('should get all achievements', () => {
    engine.registerAchievements([
      { id: 'a1', name: 'A1', description: 'A1' },
      { id: 'a2', name: 'A2', description: 'A2' }
    ]);

    const achievements = engine.getAllAchievements();
    expect(achievements.length).toBe(2);
  });

  it('should get achievements by category', () => {
    engine.registerAchievements([
      { id: 'a1', name: 'A1', description: 'A1', category: AchievementCategory.USAGE },
      { id: 'a2', name: 'A2', description: 'A2', category: AchievementCategory.COMMANDS },
      { id: 'a3', name: 'A3', description: 'A3', category: AchievementCategory.USAGE }
    ]);

    const usage = engine.getAchievementsByCategory(AchievementCategory.USAGE);
    expect(usage.length).toBe(2);
  });

  it('should get achievements by rarity', () => {
    engine.registerAchievements([
      { id: 'a1', name: 'A1', description: 'A1', rarity: AchievementRarity.COMMON },
      { id: 'a2', name: 'A2', description: 'A2', rarity: AchievementRarity.RARE },
      { id: 'a3', name: 'A3', description: 'A3', rarity: AchievementRarity.COMMON }
    ]);

    const common = engine.getAchievementsByRarity(AchievementRarity.COMMON);
    expect(common.length).toBe(2);
  });

  it('should get unlocked achievements', () => {
    engine.registerAchievements([
      {
        id: 'a1',
        name: 'A1',
        description: 'A1',
        criteria: { type: 'message_count', value: 1 }
      },
      {
        id: 'a2',
        name: 'A2',
        description: 'A2',
        criteria: { type: 'message_count', value: 1 }
      }
    ]);

    const a1 = engine.getAchievement('a1');
    a1.unlock();

    const unlocked = engine.getUnlockedAchievements();
    expect(unlocked.length).toBe(1);
    expect(unlocked[0].id).toBe('a1');
  });

  it('should get locked achievements', () => {
    engine.registerAchievements([
      {
        id: 'a1',
        name: 'A1',
        description: 'A1',
        criteria: { type: 'message_count', value: 1 }
      },
      {
        id: 'a2',
        name: 'A2',
        description: 'A2',
        criteria: { type: 'message_count', value: 1 }
      }
    ]);

    const a1 = engine.getAchievement('a1');
    a1.unlock();

    const locked = engine.getLockedAchievements();
    expect(locked.length).toBe(1);
    expect(locked[0].id).toBe('a2');
  });

  it('should record event', () => {
    engine.registerAchievement({
      id: 'test',
      name: 'Test',
      description: 'Test achievement',
      criteria: { type: 'message_count', value: 1 }
    });

    const event = engine.recordEvent('message', {});
    expect(event.type).toBe('message');
    expect(event.timestamp).toBeDefined();
    expect(engine.userStats.messageCount).toBe(1);
  });

  it('should update stats on message event', () => {
    engine.recordEvent('message', {});
    engine.recordEvent('message', {});
    engine.recordEvent('message', {});

    expect(engine.userStats.messageCount).toBe(3);
  });

  it('should update stats on command event', () => {
    engine.recordEvent('command', { command: 'session' });
    engine.recordEvent('command', { command: 'session' });
    engine.recordEvent('command', { command: 'help' });

    expect(engine.userStats.commandCount.get('session')).toBe(2);
    expect(engine.userStats.commandCount.get('help')).toBe(1);
  });

  it('should update stats on session_create event', () => {
    engine.recordEvent('session_create', {});
    engine.recordEvent('session_create', {});

    expect(engine.userStats.sessionCount).toBe(2);
  });

  it('should update stats on tutorial_complete event', () => {
    engine.recordEvent('tutorial_complete', { tutorialId: 'quick-start' });
    engine.recordEvent('tutorial_complete', { tutorialId: 'session-management' });

    expect(engine.userStats.completedTutorials.has('quick-start')).toBe(true);
    expect(engine.userStats.completedTutorials.has('session-management')).toBe(true);
  });

  it('should check achievements on event', () => {
    engine.registerAchievement({
      id: 'test',
      name: 'Test',
      description: 'Test achievement',
      criteria: { type: 'message_count', value: 5 }
    });

    engine.recordEvent('message', { count: 5 });

    const achievement = engine.getAchievement('test');
    expect(achievement.unlocked).toBe(true);
  });

  it('should add event listener', () => {
    const callback = vi.fn();
    engine.on('message', callback);

    engine.recordEvent('message', {});

    expect(callback).toHaveBeenCalled();
  });

  it('should remove event listener', () => {
    const callback = vi.fn();
    engine.on('message', callback);
    engine.off('message', callback);

    engine.recordEvent('message', {});

    expect(callback).not.toHaveBeenCalled();
  });

  it('should trigger global event listeners', () => {
    const callback = vi.fn();
    engine.on('*', callback);

    engine.recordEvent('message', {});
    engine.recordEvent('command', { command: 'help' });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should calculate total points', () => {
    engine.registerAchievements([
      { id: 'a1', name: 'A1', description: 'A1', points: 10 },
      { id: 'a2', name: 'A2', description: 'A2', points: 20 },
      { id: 'a3', name: 'A3', description: 'A3', points: 30 }
    ]);

    const a1 = engine.getAchievement('a1');
    const a2 = engine.getAchievement('a2');
    a1.unlock();
    a2.unlock();

    const points = engine.calculateTotalPoints();
    expect(points).toBe(30);
  });

  it('should get user stats', () => {
    engine.recordEvent('message', {});
    engine.recordEvent('message', {});

    const stats = engine.getUserStats();
    expect(stats.messageCount).toBe(2);
    expect(stats.totalPoints).toBeDefined();
    expect(stats.unlockedCount).toBeDefined();
  });

  it('should format achievement list', () => {
    engine.registerAchievements([
      {
        id: 'a1',
        name: 'A1',
        description: 'A1',
        category: AchievementCategory.USAGE,
        rarity: AchievementRarity.COMMON
      },
      {
        id: 'a2',
        name: 'A2',
        description: 'A2',
        category: AchievementCategory.COMMANDS,
        rarity: AchievementRarity.RARE
      }
    ]);

    const list = engine.formatAchievementList({ category: AchievementCategory.USAGE });
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('a1');
  });

  it('should format stats', () => {
    engine.registerAchievements([
      { id: 'a1', name: 'A1', description: 'A1', points: 10, category: AchievementCategory.USAGE }
    ]);

    engine.recordEvent('message', {});
    engine.getAchievement('a1').unlock();

    const stats = engine.formatStats();
    expect(stats.stats).toBeDefined();
    expect(stats.rarityCount).toBeDefined();
    expect(stats.categoryCount).toBeDefined();
  });

  it('should reset all achievements', () => {
    engine.registerAchievement({
      id: 'test',
      name: 'Test',
      description: 'Test achievement',
      criteria: { type: 'message_count', value: 1 }
    });

    engine.recordEvent('message', { count: 1 });
    engine.resetAll();

    expect(engine.userStats.messageCount).toBe(0);
    expect(engine.getAchievement('test').unlocked).toBe(false);
  });

  it('should export achievements', () => {
    engine.registerAchievements([
      { id: 'a1', name: 'A1', description: 'A1', points: 10 }
    ]);

    const exported = engine.export();
    expect(exported.stats).toBeDefined();
    expect(exported.achievements).toBeDefined();
    expect(exported.timestamp).toBeDefined();
  });
});

describe('Built-in Achievements', () => {
  it('should create basic achievements', () => {
    const achievements = createBasicAchievements();
    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0].category).toBe(AchievementCategory.USAGE);
  });

  it('should create command achievements', () => {
    const achievements = createCommandAchievements();
    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0].category).toBe(AchievementCategory.COMMANDS);
  });

  it('should create tutorial achievements', () => {
    const achievements = createTutorialAchievements();
    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0].category).toBe(AchievementCategory.TUTORIALS);
  });

  it('should create achievement engine with all built-in achievements', () => {
    const engine = createAchievementEngine();
    expect(engine.achievements.size).toBeGreaterThan(0);

    const byCategory = engine.getAchievementsByCategory(AchievementCategory.USAGE);
    expect(byCategory.length).toBeGreaterThan(0);

    const byRarity = engine.getAchievementsByRarity(AchievementRarity.COMMON);
    expect(byRarity.length).toBeGreaterThan(0);
  });
});

describe('Quick Functions', () => {
  it('should record message', () => {
    const engine = new AchievementEngine({ autoSave: false });
    recordMessage(engine);
    expect(engine.userStats.messageCount).toBe(1);
  });

  it('should record command', () => {
    const engine = new AchievementEngine({ autoSave: false });
    recordCommand(engine, 'session');
    expect(engine.userStats.commandCount.get('session')).toBe(1);
  });

  it('should record session create', () => {
    const engine = new AchievementEngine({ autoSave: false });
    recordSessionCreate(engine);
    expect(engine.userStats.sessionCount).toBe(1);
  });

  it('should record branch create', () => {
    const engine = new AchievementEngine({ autoSave: false });
    recordBranchCreate(engine);
    expect(engine.userStats.branchCount).toBe(1);
  });
});
