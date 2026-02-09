/**
 * 成就系统
 * 记录和管理用户成就,提供游戏化的学习体验
 */

import { logger } from './logger.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * 成就稀有度
 */
export const AchievementRarity = {
  COMMON: 'common',       // 普通
  UNCOMMON: 'uncommon',   // 不常见
  RARE: 'rare',          // 稀有
  EPIC: 'epic',          // 史诗
  LEGENDARY: 'legendary' // 传说
};

/**
 * 成就类别
 */
export const AchievementCategory = {
  USAGE: 'usage',           // 使用类成就
  COMMANDS: 'commands',     // 命令类成就
  SESSIONS: 'sessions',     // 会话类成就
  TUTORIALS: 'tutorials',   // 教程类成就
  BRANCHES: 'branches',     // 分支类成就
  RAG: 'rag',              // RAG 类成就
  GIT: 'git',              // Git 类成就
  TOOLS: 'tools',          // 工具类成就
  CUSTOM: 'custom'          // 自定义成就
};

/**
 * 成就类
 */
export class Achievement {
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.description = options.description;
    this.icon = options.icon || '🏆';
    this.rarity = options.rarity || AchievementRarity.COMMON;
    this.category = options.category || AchievementCategory.CUSTOM;
    this.points = options.points || 10;
    this.hidden = options.hidden || false;
    this.secret = options.secret || false;
    this.criteria = options.criteria || {};
    this.progress = 0;
    this.maxProgress = 100;
    this.unlocked = false;
    this.unlockedAt = null;
    this.metadata = options.metadata || {};
  }

  /**
   * 检查是否达成条件
   */
  checkCriteria(event) {
    if (this.unlocked) {
      return false;
    }

    const criteria = this.criteria;
    let met = false;
    let progress = 0;

    switch (criteria.type) {
      case 'message_count':
        progress = Math.min(event.count || 0, criteria.value);
        met = progress >= criteria.value;
        break;

      case 'command_count':
        if (criteria.commands && !criteria.commands.includes(event.command)) {
          return false;
        }
        progress = Math.min(event.count || 0, criteria.value);
        met = progress >= criteria.value;
        break;

      case 'session_count':
        progress = Math.min(event.count || 0, criteria.value);
        met = progress >= criteria.value;
        break;

      case 'tutorial_complete':
        met = criteria.tutorials.includes(event.tutorialId);
        progress = met ? 100 : 0;
        break;

      case 'branch_count':
        progress = Math.min(event.count || 0, criteria.value);
        met = progress >= criteria.value;
        break;

      case 'branch_merge':
        progress = Math.min(event.count || 0, criteria.value);
        met = progress >= criteria.value;
        break;

      case 'rag_index':
        progress = Math.min(event.count || 0, criteria.value);
        met = progress >= criteria.value;
        break;

      case 'git_commit':
        progress = Math.min(event.count || 0, criteria.value);
        met = progress >= criteria.value;
        break;

      case 'streak':
        met = (event.count || 0) >= criteria.value;
        progress = event.count || 0;
        break;

      case 'custom':
        if (criteria.check) {
          const result = criteria.check(event, this);
          met = result.met;
          progress = result.progress || 0;
        }
        break;

      default:
        return false;
    }

    // 更新进度
    if (criteria.value) {
      this.progress = Math.round((progress / criteria.value) * 100);
    } else {
      this.progress = met ? 100 : 0;
    }

    this.maxProgress = 100;
    return met;
  }

  /**
   * 解锁成就
   */
  unlock() {
    if (this.unlocked) {
      return false;
    }

    this.unlocked = true;
    this.unlockedAt = Date.now();
    this.progress = 100;

    logger.info('成就已解锁', {
      id: this.id,
      name: this.name,
      rarity: this.rarity
    });

    return true;
  }

  /**
   * 重置成就
   */
  reset() {
    this.progress = 0;
    this.unlocked = false;
    this.unlockedAt = null;
  }

  /**
   * 获取显示信息
   */
  getDisplayInfo() {
    return {
      id: this.id,
      name: this.secret && !this.unlocked ? '???' : this.name,
      description: this.secret && !this.unlocked ? '???' : this.description,
      icon: this.secret && !this.unlocked ? '❓' : this.icon,
      rarity: this.secret && !this.unlocked ? 'secret' : this.rarity,
      category: this.category,
      points: this.points,
      hidden: (this.secret || this.hidden) && !this.unlocked,
      unlocked: this.unlocked,
      unlockedAt: this.unlockedAt,
      progress: this.progress,
      maxProgress: this.maxProgress
    };
  }
}

/**
 * 成就系统引擎
 */
export class AchievementEngine {
  constructor(options = {}) {
    this.achievements = new Map();
    this.userStats = {
      messageCount: 0,
      commandCount: new Map(),
      sessionCount: 0,
      branchCount: 0,
      branchMergeCount: 0,
      ragIndexCount: 0,
      gitCommitCount: 0,
      completedTutorials: new Set(),
      lastActiveDate: null,
      streakDays: 0,
      consecutiveDays: 0
    };

    this.options = {
      dataDir: options.dataDir || path.join(os.homedir(), '.newapi-chat'),
      autoSave: options.autoSave ?? true,
      notifyOnUnlock: options.notifyOnUnlock ?? true,
      saveInterval: options.saveInterval || 30000
    };

    this.eventListeners = new Map();
    this.saveTimer = null;

    this.loadStats();
    this.startAutoSave();
  }

  /**
   * 注册成就
   */
  registerAchievement(achievement) {
    if (!(achievement instanceof Achievement)) {
      achievement = new Achievement(achievement);
    }

    this.achievements.set(achievement.id, achievement);
    logger.debug('成就已注册', { id: achievement.id });

    return achievement;
  }

  /**
   * 批量注册成就
   */
  registerAchievements(achievements) {
    achievements.forEach(achievement => {
      this.registerAchievement(achievement);
    });
  }

  /**
   * 获取成就
   */
  getAchievement(id) {
    return this.achievements.get(id);
  }

  /**
   * 获取所有成就
   */
  getAllAchievements() {
    return Array.from(this.achievements.values());
  }

  /**
   * 按类别获取成就
   */
  getAchievementsByCategory(category) {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  /**
   * 按稀有度获取成就
   */
  getAchievementsByRarity(rarity) {
    return this.getAllAchievements().filter(a => a.rarity === rarity);
  }

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements() {
    return this.getAllAchievements().filter(a => a.unlocked);
  }

  /**
   * 获取未解锁的成就
   */
  getLockedAchievements() {
    return this.getAllAchievements().filter(a => !a.unlocked);
  }

  /**
   * 记录事件
   */
  recordEvent(eventType, data = {}) {
    const event = {
      type: eventType,
      ...data,
      timestamp: Date.now()
    };

    // 更新统计
    this.updateStats(event);

    // 检查成就
    this.checkAchievements(event);

    // 触发事件监听器
    this.emitEvent(event);

    logger.debug('事件已记录', { type: eventType });

    return event;
  }

  /**
   * 更新统计
   */
  updateStats(event) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    switch (event.type) {
      case 'message':
        this.userStats.messageCount++;
        break;

      case 'command':
        this.userStats.commandCount.set(
          event.command,
          (this.userStats.commandCount.get(event.command) || 0) + 1
        );
        break;

      case 'session_create':
        this.userStats.sessionCount++;
        break;

      case 'branch_create':
        this.userStats.branchCount++;
        break;

      case 'branch_merge':
        this.userStats.branchMergeCount++;
        break;

      case 'rag_index':
        this.userStats.ragIndexCount++;
        break;

      case 'git_commit':
        this.userStats.gitCommitCount++;
        break;

      case 'tutorial_complete':
        this.userStats.completedTutorials.add(event.tutorialId);
        break;

      case 'daily_active':
        if (this.userStats.lastActiveDate) {
          if (this.userStats.lastActiveDate === yesterday) {
            this.userStats.consecutiveDays++;
            this.userStats.streakDays = Math.max(
              this.userStats.streakDays,
              this.userStats.consecutiveDays
            );
          } else if (this.userStats.lastActiveDate !== today) {
            this.userStats.consecutiveDays = 1;
          }
        } else {
          this.userStats.consecutiveDays = 1;
        }
        this.userStats.lastActiveDate = today;
        break;
    }
  }

  /**
   * 检查成就
   */
  checkAchievements(event) {
    const unlockedAchievements = [];

    this.achievements.forEach((achievement) => {
      if (achievement.checkCriteria(event)) {
        if (achievement.unlock()) {
          unlockedAchievements.push(achievement);

          if (this.options.notifyOnUnlock) {
            this.notifyUnlock(achievement);
          }
        }
      }
    });

    return unlockedAchievements;
  }

  /**
   * 解锁通知
   */
  notifyUnlock(achievement) {
    const rarityEmojis = {
      common: '⚪',
      uncommon: '🟢',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡',
      secret: '❓'
    };

    const emoji = rarityEmojis[achievement.rarity] || '⚪';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${emoji} 成就解锁!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`${achievement.icon} ${achievement.name}`);
    console.log(achievement.description);
    console.log(`稀有度: ${achievement.rarity.toUpperCase()}`);
    console.log(`积分: +${achievement.points}`);
    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * 获取用户统计
   */
  getUserStats() {
    return {
      ...this.userStats,
      commandCount: Object.fromEntries(this.userStats.commandCount),
      completedTutorials: Array.from(this.userStats.completedTutorials),
      totalPoints: this.calculateTotalPoints(),
      unlockedCount: this.getUnlockedAchievements().length,
      totalCount: this.achievements.size,
      percentage: this.achievements.size > 0
        ? Math.round((this.getUnlockedAchievements().length / this.achievements.size) * 100)
        : 0
    };
  }

  /**
   * 计算总积分
   */
  calculateTotalPoints() {
    return this.getUnlockedAchievements().reduce((sum, a) => sum + a.points, 0);
  }

  /**
   * 添加事件监听器
   */
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  /**
   * 移除事件监听器
   */
  off(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      return;
    }
    const listeners = this.eventListeners.get(eventType);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  emitEvent(event) {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('事件监听器错误', { event: event.type, error: error.message });
      }
    });

    // 触发全局事件监听器
    const globalListeners = this.eventListeners.get('*') || [];
    globalListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('全局事件监听器错误', { error: error.message });
      }
    });
  }

  /**
   * 保存统计
   */
  saveStats() {
    try {
      // 确保数据目录存在
      if (!fs.existsSync(this.options.dataDir)) {
        fs.mkdirSync(this.options.dataDir, { recursive: true });
      }

      const data = {
        userStats: {
          ...this.userStats,
          commandCount: Object.fromEntries(this.userStats.commandCount),
          completedTutorials: Array.from(this.userStats.completedTutorials)
        },
        achievements: Array.from(this.achievements.entries()).map(([id, a]) => [
          id,
          {
            unlocked: a.unlocked,
            unlockedAt: a.unlockedAt,
            progress: a.progress
          }
        ])
      };

      const filePath = path.join(this.options.dataDir, 'achievements.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      logger.debug('成就数据已保存');
    } catch (error) {
      logger.error('保存成就数据失败', { error: error.message });
    }
  }

  /**
   * 加载统计
   */
  loadStats() {
    try {
      const filePath = path.join(this.options.dataDir, 'achievements.json');
      if (!fs.existsSync(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // 恢复用户统计
      if (data.userStats) {
        this.userStats = {
          ...this.userStats,
          ...data.userStats,
          commandCount: new Map(Object.entries(data.userStats.commandCount || {})),
          completedTutorials: new Set(data.userStats.completedTutorials || [])
        };
      }

      // 恢复成就状态
      if (data.achievements) {
        data.achievements.forEach(([id, state]) => {
          const achievement = this.achievements.get(id);
          if (achievement) {
            achievement.unlocked = state.unlocked;
            achievement.unlockedAt = state.unlockedAt;
            achievement.progress = state.progress;
          }
        });
      }

      logger.debug('成就数据已加载');
    } catch (error) {
      logger.error('加载成就数据失败', { error: error.message });
    }
  }

  /**
   * 启动自动保存
   */
  startAutoSave() {
    if (!this.options.autoSave) {
      return;
    }

    this.stopAutoSave();
    this.saveTimer = setInterval(() => {
      this.saveStats();
    }, this.options.saveInterval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * 格式化成就列表
   */
  formatAchievementList(options = {}) {
    const {
      category = null,
      rarity = null,
      unlockedOnly = false,
      lockedOnly = false,
      showHidden = false,
      sortBy = 'category' // 'category', 'rarity', 'name', 'progress'
    } = options;

    let achievements = this.getAllAchievements();

    // 过滤
    if (category) {
      achievements = achievements.filter(a => a.category === category);
    }
    if (rarity) {
      achievements = achievements.filter(a => a.rarity === rarity);
    }
    if (unlockedOnly) {
      achievements = achievements.filter(a => a.unlocked);
    }
    if (lockedOnly) {
      achievements = achievements.filter(a => !a.unlocked);
    }
    if (!showHidden) {
      achievements = achievements.filter(a => !a.hidden);
    }

    // 排序
    achievements.sort((a, b) => {
      switch (sortBy) {
        case 'category':
          return a.category.localeCompare(b.category);
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

    return achievements.map(a => a.getDisplayInfo());
  }

  /**
   * 格式化统计信息
   */
  formatStats() {
    const stats = this.getUserStats();
    const unlocked = this.getUnlockedAchievements();
    const locked = this.getLockedAchievements();

    const rarityCount = {};
    Object.values(AchievementRarity).forEach(r => {
      rarityCount[r] = unlocked.filter(a => a.rarity === r).length;
    });

    return {
      stats,
      rarityCount,
      categoryCount: {
        usage: unlocked.filter(a => a.category === AchievementCategory.USAGE).length,
        commands: unlocked.filter(a => a.category === AchievementCategory.COMMANDS).length,
        sessions: unlocked.filter(a => a.category === AchievementCategory.SESSIONS).length,
        tutorials: unlocked.filter(a => a.category === AchievementCategory.TUTORIALS).length,
        branches: unlocked.filter(a => a.category === AchievementCategory.BRANCHES).length,
        rag: unlocked.filter(a => a.category === AchievementCategory.RAG).length,
        git: unlocked.filter(a => a.category === AchievementCategory.GIT).length,
        tools: unlocked.filter(a => a.category === AchievementCategory.TOOLS).length
      }
    };
  }

  /**
   * 重置所有成就
   */
  resetAll() {
    this.achievements.forEach(a => a.reset());
    this.userStats = {
      messageCount: 0,
      commandCount: new Map(),
      sessionCount: 0,
      branchCount: 0,
      branchMergeCount: 0,
      ragIndexCount: 0,
      gitCommitCount: 0,
      completedTutorials: new Set(),
      lastActiveDate: null,
      streakDays: 0,
      consecutiveDays: 0
    };

    logger.info('所有成就已重置');
    this.saveStats();
  }

  /**
   * 导出成就
   */
  export() {
    return {
      stats: this.getUserStats(),
      achievements: this.getAllAchievements().map(a => a.getDisplayInfo()),
      timestamp: Date.now()
    };
  }

  /**
   * 销毁
   */
  destroy() {
    this.stopAutoSave();
    this.saveStats();
  }
}

/**
 * 内置成就
 */

// 1. 初级成就 - 使用类
export function createBasicAchievements() {
  return [
    {
      id: 'first_message',
      name: '第一次对话',
      description: '发送第一条消息',
      icon: '💬',
      rarity: AchievementRarity.COMMON,
      category: AchievementCategory.USAGE,
      points: 10,
      criteria: {
        type: 'message_count',
        value: 1
      }
    },
    {
      id: 'talkative',
      name: '健谈',
      description: '发送 100 条消息',
      icon: '🗣️',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.USAGE,
      points: 25,
      criteria: {
        type: 'message_count',
        value: 100
      }
    },
    {
      id: 'chatterbox',
      name: '话痨',
      description: '发送 1000 条消息',
      icon: '📢',
      rarity: AchievementRarity.RARE,
      category: AchievementCategory.USAGE,
      points: 50,
      criteria: {
        type: 'message_count',
        value: 1000
      }
    },
    {
      id: 'daily_user',
      name: '每日用户',
      description: '连续 7 天使用',
      icon: '📅',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.USAGE,
      points: 30,
      criteria: {
        type: 'streak',
        value: 7
      }
    },
    {
      id: 'dedicated_user',
      name: '忠实用户',
      description: '连续 30 天使用',
      icon: '⭐',
      rarity: AchievementRarity.RARE,
      category: AchievementCategory.USAGE,
      points: 75,
      criteria: {
        type: 'streak',
        value: 30
      }
    }
  ];
}

// 2. 命令类成就
export function createCommandAchievements() {
  return [
    {
      id: 'command_master',
      name: '命令大师',
      description: '使用 50 次命令',
      icon: '⌨️',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.COMMANDS,
      points: 30,
      criteria: {
        type: 'command_count',
        value: 50
      }
    },
    {
      id: 'session_pro',
      name: '会话专家',
      description: '使用 20 次 /session 命令',
      icon: '📁',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.COMMANDS,
      points: 35,
      criteria: {
        type: 'command_count',
        value: 20,
        commands: ['session']
      }
    },
    {
      id: 'branch_master',
      name: '分支大师',
      description: '使用 20 次 /branch 命令',
      icon: '🌳',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.COMMANDS,
      points: 35,
      criteria: {
        type: 'command_count',
        value: 20,
        commands: ['branch']
      }
    },
    {
      id: 'rag_explorer',
      name: 'RAG 探索者',
      description: '使用 20 次 /index 或 /search 命令',
      icon: '🔍',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.COMMANDS,
      points: 35,
      criteria: {
        type: 'command_count',
        value: 20,
        commands: ['index', 'search']
      }
    }
  ];
}

// 3. 会话类成就
export function createSessionAchievements() {
  return [
    {
      id: 'multi_session',
      name: '多会话用户',
      description: '创建 5 个会话',
      icon: '📋',
      rarity: AchievementRarity.COMMON,
      category: AchievementCategory.SESSIONS,
      points: 20,
      criteria: {
        type: 'session_count',
        value: 5
      }
    },
    {
      id: 'session_collector',
      name: '会话收藏家',
      description: '创建 20 个会话',
      icon: '📚',
      rarity: AchievementRarity.RARE,
      category: AchievementCategory.SESSIONS,
      points: 50,
      criteria: {
        type: 'session_count',
        value: 20
      }
    }
  ];
}

// 4. 教程类成就
export function createTutorialAchievements() {
  return [
    {
      id: 'quick_start',
      name: '快速入门',
      description: '完成快速入门教程',
      icon: '🚀',
      rarity: AchievementRarity.COMMON,
      category: AchievementCategory.TUTORIALS,
      points: 25,
      criteria: {
        type: 'tutorial_complete',
        tutorials: ['quick-start']
      }
    },
    {
      id: 'session_master',
      name: '会话大师',
      description: '完成会话管理教程',
      icon: '📁',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.TUTORIALS,
      points: 35,
      criteria: {
        type: 'tutorial_complete',
        tutorials: ['session-management']
      }
    },
    {
      id: 'branch_pro',
      name: '分支专家',
      description: '完成对话分支教程',
      icon: '🌳',
      rarity: AchievementRarity.RARE,
      category: AchievementCategory.TUTORIALS,
      points: 45,
      criteria: {
        type: 'tutorial_complete',
        tutorials: ['branch-management']
      }
    },
    {
      id: 'rag_master',
      name: 'RAG 大师',
      description: '完成 RAG 知识库教程',
      icon: '🔍',
      rarity: AchievementRarity.RARE,
      category: AchievementCategory.TUTORIALS,
      points: 50,
      criteria: {
        type: 'tutorial_complete',
        tutorials: ['rag-features']
      }
    },
    {
      id: 'all_learner',
      name: '全能学习者',
      description: '完成所有教程',
      icon: '🎓',
      rarity: AchievementRarity.EPIC,
      category: AchievementCategory.TUTORIALS,
      points: 100,
      criteria: {
        type: 'tutorial_complete',
        tutorials: ['quick-start', 'session-management', 'branch-management', 'rag-features', 'config-and-customization']
      }
    }
  ];
}

// 5. 分支类成就
export function createBranchAchievements() {
  return [
    {
      id: 'branch_newbie',
      name: '分支新手',
      description: '创建第一个对话分支',
      icon: '🌱',
      rarity: AchievementRarity.COMMON,
      category: AchievementCategory.BRANCHES,
      points: 15,
      criteria: {
        type: 'branch_count',
        value: 1
      }
    },
    {
      id: 'branch_expert',
      name: '分支专家',
      description: '创建 10 个对话分支',
      icon: '🌿',
      rarity: AchievementRarity.RARE,
      category: AchievementCategory.BRANCHES,
      points: 40,
      criteria: {
        type: 'branch_count',
        value: 10
      }
    },
    {
      id: 'branch_merger',
      name: '分支合并者',
      description: '合并 5 个分支',
      icon: '🔀',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.BRANCHES,
      points: 30,
      criteria: {
        type: 'branch_merge',
        value: 5
      }
    }
  ];
}

// 6. RAG 类成就
export function createRAGAchievements() {
  return [
    {
      id: 'knowledge_builder',
      name: '知识构建者',
      description: '索引 10 个文档',
      icon: '📖',
      rarity: AchievementRarity.COMMON,
      category: AchievementCategory.RAG,
      points: 20,
      criteria: {
        type: 'rag_index',
        value: 10
      }
    },
    {
      id: 'knowledge_master',
      name: '知识大师',
      description: '索引 100 个文档',
      icon: '📚',
      rarity: AchievementRarity.RARE,
      category: AchievementCategory.RAG,
      points: 50,
      criteria: {
        type: 'rag_index',
        value: 100
      }
    },
    {
      id: 'search_expert',
      name: '搜索专家',
      description: '执行 50 次知识库搜索',
      icon: '🔎',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.RAG,
      points: 30,
      criteria: {
        type: 'command_count',
        value: 50,
        commands: ['search']
      }
    }
  ];
}

// 7. Git 类成就
export function createGitAchievements() {
  return [
    {
      id: 'git_starter',
      name: 'Git 入门',
      description: '提交第一个 Git 消息',
      icon: '📝',
      rarity: AchievementRarity.COMMON,
      category: AchievementCategory.GIT,
      points: 15,
      criteria: {
        type: 'git_commit',
        value: 1
      }
    },
    {
      id: 'git_committer',
      name: 'Git 提交者',
      description: '提交 10 个 Git 消息',
      icon: '✅',
      rarity: AchievementRarity.UNCOMMON,
      category: AchievementCategory.GIT,
      points: 35,
      criteria: {
        type: 'git_commit',
        value: 10
      }
    }
  ];
}

// 8. 高级成就 (传说级)
export function createAdvancedAchievements() {
  return [
    {
      id: 'message_legend',
      name: '对话传奇',
      description: '发送 10000 条消息',
      icon: '👑',
      rarity: AchievementRarity.LEGENDARY,
      category: AchievementCategory.USAGE,
      points: 200,
      criteria: {
        type: 'message_count',
        value: 10000
      }
    },
    {
      id: 'master_user',
      name: '全能大师',
      description: '解锁 50 个成就',
      icon: '🏆',
      rarity: AchievementRarity.LEGENDARY,
      category: AchievementCategory.USAGE,
      points: 300,
      criteria: {
        type: 'custom',
        check: (event, achievement) => {
          const unlocked = achievement.engine?.getUnlockedAchievements().length || 0;
          return {
            met: unlocked >= 50,
            progress: Math.min(unlocked, 50)
          };
        }
      }
    },
    {
      id: 'century_master',
      name: '世纪大师',
      description: '连续 100 天使用',
      icon: '💎',
      rarity: AchievementRarity.LEGENDARY,
      category: AchievementCategory.USAGE,
      points: 250,
      criteria: {
        type: 'streak',
        value: 100
      }
    }
  ];
}

// 9. 秘密成就
export function createSecretAchievements() {
  return [
    {
      id: 'secret_1',
      name: '🎯 隐藏的秘密',
      description: '发现了一个隐藏功能',
      icon: '🎁',
      rarity: AchievementRarity.LEGENDARY,
      category: AchievementCategory.CUSTOM,
      points: 100,
      secret: true,
      hidden: true,
      criteria: {
        type: 'custom',
        check: (event) => ({
          met: event.type === 'secret_discovered',
          progress: 100
        })
      }
    }
  ];
}

/**
 * 创建成就引擎并注册所有内置成就
 * @deprecated 使用 getGlobalAchievementEngine() 替代
 */
export function createAchievementEngine() {
  const engine = new AchievementEngine();

  // 注册所有内置成就
  engine.registerAchievements(createBasicAchievements());
  engine.registerAchievements(createCommandAchievements());
  engine.registerAchievements(createSessionAchievements());
  engine.registerAchievements(createTutorialAchievements());
  engine.registerAchievements(createBranchAchievements());
  engine.registerAchievements(createRAGAchievements());
  engine.registerAchievements(createGitAchievements());
  engine.registerAchievements(createAdvancedAchievements());
  engine.registerAchievements(createSecretAchievements());

  return engine;
}

/**
 * 为引擎注册所有内置成就
 */
function registerAllBuiltInAchievements(engine) {
  engine.registerAchievements(createBasicAchievements());
  engine.registerAchievements(createCommandAchievements());
  engine.registerAchievements(createSessionAchievements());
  engine.registerAchievements(createTutorialAchievements());
  engine.registerAchievements(createBranchAchievements());
  engine.registerAchievements(createRAGAchievements());
  engine.registerAchievements(createGitAchievements());
  engine.registerAchievements(createAdvancedAchievements());
  engine.registerAchievements(createSecretAchievements());
  return engine;
}

/**
 * 快捷函数
 */

/**
 * 初始化成就系统
 */
export function initializeAchievements() {
  return createAchievementEngine();
}

/**
 * 记录消息事件
 */
export function recordMessage(engine) {
  engine.recordEvent('message', {});
}

/**
 * 记录命令事件
 */
export function recordCommand(engine, command) {
  engine.recordEvent('command', { command });
}

/**
 * 记录会话创建事件
 */
export function recordSessionCreate(engine) {
  engine.recordEvent('session_create', {});
}

/**
 * 记录分支创建事件
 */
export function recordBranchCreate(engine) {
  engine.recordEvent('branch_create', {});
}

/**
 * 记录分支合并事件
 */
export function recordBranchMerge(engine) {
  engine.recordEvent('branch_merge', {});
}

/**
 * 记录 RAG 索引事件
 */
export function recordRAGIndex(engine, count = 1) {
  engine.recordEvent('rag_index', { count });
}

/**
 * 记录 Git 提交事件
 */
export function recordGitCommit(engine) {
  engine.recordEvent('git_commit', {});
}

/**
 * 记录教程完成事件
 */
export function recordTutorialComplete(engine, tutorialId) {
  engine.recordEvent('tutorial_complete', { tutorialId });
}

/**
 * 记录每日活跃事件
 */
export function recordDailyActive(engine) {
  engine.recordEvent('daily_active', {});
}

/**
 * 显示成就列表
 */
export function showAchievements(engine, options = {}) {
  const achievements = engine.formatAchievementList(options);

  if (achievements.length === 0) {
    console.log('没有符合条件的成就');
    return;
  }

  const rarityEmojis = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟡',
    secret: '❓'
  };

  console.log('\n' + '='.repeat(60));
  console.log('🏆 成就列表');
  console.log('='.repeat(60) + '\n');

  achievements.forEach((a, index) => {
    const status = a.unlocked ? '✓' : '✗';
    const emoji = rarityEmojis[a.rarity] || '⚪';
    const progress = a.unlocked ? '100%' : `${a.progress}%`;

    console.log(`${index + 1}. ${status} ${a.icon} ${a.name} ${emoji}`);
    console.log(`   ${a.description}`);
    console.log(`   ${a.category.toUpperCase()} | ${a.rarity.toUpperCase()} | +${a.points} 积分`);

    if (!a.unlocked) {
      console.log(`   进度: ${progress}`);
    }

    console.log();
  });

  console.log('='.repeat(60) + '\n');
}

/**
 * 显示统计信息
 */
export function showStats(engine) {
  const stats = engine.formatStats();

  console.log('\n' + '='.repeat(60));
  console.log('📊 使用统计');
  console.log('='.repeat(60) + '\n');

  console.log('基本信息:');
  console.log(`  消息数: ${stats.stats.messageCount}`);
  console.log(`  会话数: ${stats.stats.sessionCount}`);
  console.log(`  总积分: ${stats.stats.totalPoints}`);
  console.log(`  连续天数: ${stats.stats.streakDays} 天`);
  console.log();

  console.log('成就进度:');
  console.log(`  已解锁: ${stats.stats.unlockedCount}/${stats.stats.totalCount} (${stats.stats.percentage}%)`);
  console.log();

  console.log('按稀有度:');
  Object.entries(stats.rarityCount).forEach(([rarity, count]) => {
    console.log(`  ${rarity}: ${count}`);
  });
  console.log();

  console.log('按类别:');
  Object.entries(stats.categoryCount).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

// 单例模式 - 确保只有一个全局引擎实例
let _globalEngineInstance = null;
let _globalEngineInitialized = false;

export function getGlobalAchievementEngine(options = {}) {
  if (!_globalEngineInstance) {
    _globalEngineInstance = new AchievementEngine(options);
    // 注册所有内置成就
    registerAllBuiltInAchievements(_globalEngineInstance);
    _globalEngineInitialized = true;
  }
  return _globalEngineInstance;
}

export function resetGlobalAchievementEngine() {
  if (_globalEngineInstance) {
    _globalEngineInstance.stopAutoSave();
    _globalEngineInstance = null;
    _globalEngineInitialized = false;
  }
}

export function getAchievementEngine(autoSave = true) {
  if (autoSave) {
    return getGlobalAchievementEngine({ autoSave: true });
  }
  // 对于非自动保存的实例，仍然使用临时实例（用于命令和测试）
  const engine = new AchievementEngine({ autoSave: false });
  if (!_globalEngineInitialized) {
    registerAllBuiltInAchievements(engine);
  }
  return engine;
}
