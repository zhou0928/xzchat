/**
 * 成就系统类型定义
 */

/**
 * 成就稀有度
 */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'secret';

/**
 * 成就类别
 */
export type AchievementCategory = 'usage' | 'commands' | 'sessions' | 'tutorials' | 'branches' | 'rag' | 'git' | 'tools' | 'custom';

/**
 * 成就条件类型
 */
export type AchievementCriteriaType = 'message_count' | 'command_count' | 'session_count' | 'tutorial_complete' | 'branch_count' | 'branch_merge' | 'rag_index' | 'git_commit' | 'streak' | 'custom';

/**
 * 成就检查结果
 */
export interface AchievementCheckResult {
  met: boolean;
  progress?: number;
}

/**
 * 成就条件
 */
export interface AchievementCriteria {
  type: AchievementCriteriaType;
  value?: number;
  commands?: string[];
  tutorials?: string[];
  check?: (event: AchievementEvent, achievement: IAchievement) => AchievementCheckResult;
}

/**
 * 成就元数据
 */
export interface AchievementMetadata {
  [key: string]: any;
}

/**
 * 成就显示信息
 */
export interface AchievementDisplayInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  points: number;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;
  maxProgress: number;
}

/**
 * 成就选项
 */
export interface AchievementOptions {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rarity?: AchievementRarity;
  category?: AchievementCategory;
  points?: number;
  hidden?: boolean;
  secret?: boolean;
  criteria?: AchievementCriteria;
  metadata?: AchievementMetadata;
}

/**
 * 成就事件
 */
export interface AchievementEvent {
  type: string;
  [key: string]: any;
  timestamp: number;
}

/**
 * 用户统计
 */
export interface UserStats {
  messageCount: number;
  commandCount: Map<string, number> | Record<string, number>;
  sessionCount: number;
  branchCount: number;
  branchMergeCount: number;
  ragIndexCount: number;
  gitCommitCount: number;
  completedTutorials: Set<string> | string[];
  lastActiveDate: string | null;
  streakDays: number;
  consecutiveDays: number;
}

/**
 * 格式化的统计信息
 */
export interface FormattedStats {
  stats: {
    messageCount: number;
    commandCount: Record<string, number>;
    sessionCount: number;
    branchCount: number;
    branchMergeCount: number;
    ragIndexCount: number;
    gitCommitCount: number;
    completedTutorials: string[];
    lastActiveDate: string | null;
    streakDays: number;
    consecutiveDays: number;
    totalPoints: number;
    unlockedCount: number;
    totalCount: number;
    percentage: number;
  };
  rarityCount: Record<AchievementRarity, number>;
  categoryCount: Record<AchievementCategory, number>;
}

/**
 * 成就列表选项
 */
export interface AchievementListOptions {
  category?: AchievementCategory | null;
  rarity?: AchievementRarity | null;
  unlockedOnly?: boolean;
  lockedOnly?: boolean;
  showHidden?: boolean;
  sortBy?: 'category' | 'rarity' | 'name' | 'progress';
}

/**
 * 成就引擎选项
 */
export interface AchievementEngineOptions {
  dataDir?: string;
  autoSave?: boolean;
  notifyOnUnlock?: boolean;
  saveInterval?: number;
}

/**
 * 成就数据
 */
export interface AchievementData {
  userStats: UserStats;
  achievements: Array<[string, AchievementState]>;
}

/**
 * 成就状态
 */
export interface AchievementState {
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;
}

/**
 * 成就导出数据
 */
export interface AchievementExport {
  stats: UserStats;
  achievements: AchievementDisplayInfo[];
  timestamp: number;
}

/**
 * 事件监听器函数
 */
export type AchievementEventListener = (event: AchievementEvent) => void;

/**
 * 成就类接口
 */
export interface IAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  points: number;
  hidden: boolean;
  secret: boolean;
  criteria: AchievementCriteria;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: number | null;
  metadata: AchievementMetadata;

  checkCriteria(event: AchievementEvent): boolean;
  unlock(): boolean;
  reset(): void;
  getDisplayInfo(): AchievementDisplayInfo;
}

/**
 * 成就引擎接口
 */
export interface IAchievementEngine {
  achievements: Map<string, IAchievement>;
  userStats: UserStats;
  options: AchievementEngineOptions;
  eventListeners: Map<string, AchievementEventListener[]>;
  saveTimer: NodeJS.Timeout | null;

  registerAchievement(achievement: IAchievement | AchievementOptions): IAchievement;
  registerAchievements(achievements: (IAchievement | AchievementOptions)[]): void;
  getAchievement(id: string): IAchievement | undefined;
  getAllAchievements(): IAchievement[];
  getAchievementsByCategory(category: AchievementCategory): IAchievement[];
  getAchievementsByRarity(rarity: AchievementRarity): IAchievement[];
  getUnlockedAchievements(): IAchievement[];
  getLockedAchievements(): IAchievement[];
  recordEvent(eventType: string, data?: Record<string, any>): AchievementEvent;
  updateStats(event: AchievementEvent): void;
  checkAchievements(event: AchievementEvent): IAchievement[];
  notifyUnlock(achievement: IAchievement): void;
  getUserStats(): UserStats & { totalPoints: number; unlockedCount: number; totalCount: number; percentage: number };
  calculateTotalPoints(): number;
  on(eventType: string, callback: AchievementEventListener): void;
  off(eventType: string, callback: AchievementEventListener): void;
  emitEvent(event: AchievementEvent): void;
  saveStats(): void;
  loadStats(): void;
  startAutoSave(): void;
  stopAutoSave(): void;
  formatAchievementList(options?: AchievementListOptions): AchievementDisplayInfo[];
  formatStats(): FormattedStats;
  resetAll(): void;
  export(): AchievementExport;
  destroy(): void;
}

/**
 * 命令: 快捷函数
 */
export declare function initializeAchievements(): IAchievementEngine;
export declare function recordMessage(engine: IAchievementEngine): void;
export declare function recordCommand(engine: IAchievementEngine, command: string): void;
export declare function recordSessionCreate(engine: IAchievementEngine): void;
export declare function recordBranchCreate(engine: IAchievementEngine): void;
export declare function recordBranchMerge(engine: IAchievementEngine): void;
export declare function recordRAGIndex(engine: IAchievementEngine, count?: number): void;
export declare function recordGitCommit(engine: IAchievementEngine): void;
export declare function recordTutorialComplete(engine: IAchievementEngine, tutorialId: string): void;
export declare function recordDailyActive(engine: IAchievementEngine): void;
export declare function showAchievements(engine: IAchievementEngine, options?: AchievementListOptions): void;
export declare function showStats(engine: IAchievementEngine): void;

/**
 * 导出的变量
 */
export declare let engine: IAchievementEngine;

/**
 * 导出的常量
 */
export const AchievementRarity: {
  readonly COMMON: 'common';
  readonly UNCOMMON: 'uncommon';
  readonly RARE: 'rare';
  readonly EPIC: 'epic';
  readonly LEGENDARY: 'legendary';
};

export const AchievementCategory: {
  readonly USAGE: 'usage';
  readonly COMMANDS: 'commands';
  readonly SESSIONS: 'sessions';
  readonly TUTORIALS: 'tutorials';
  readonly BRANCHES: 'branches';
  readonly RAG: 'rag';
  readonly GIT: 'git';
  readonly TOOLS: 'tools';
  readonly CUSTOM: 'custom';
};

/**
 * 成就创建函数
 */
export declare function createBasicAchievements(): AchievementOptions[];
export declare function createCommandAchievements(): AchievementOptions[];
export declare function createSessionAchievements(): AchievementOptions[];
export declare function createTutorialAchievements(): AchievementOptions[];
export declare function createBranchAchievements(): AchievementOptions[];
export declare function createRAGAchievements(): AchievementOptions[];
export declare function createGitAchievements(): AchievementOptions[];
export declare function createAdvancedAchievements(): AchievementOptions[];
export declare function createSecretAchievements(): AchievementOptions[];
export declare function createAchievementEngine(): IAchievementEngine;
