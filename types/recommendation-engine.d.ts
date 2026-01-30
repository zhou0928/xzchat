/**
 * 智能命令推荐引擎 TypeScript 类型定义
 */

/**
 * 用户上下文信息
 */
export interface UserContext {
  /** 会话 ID */
  sessionId?: string;
  /** 最后一个命令 */
  lastCommand?: string;
  /** 当前目录 */
  currentDir?: string;
  /** Git 仓库根目录 */
  gitRoot?: string;
  /** 额外的上下文信息 */
  [key: string]: any;
}

/**
 * 推荐结果
 */
export interface Recommendation {
  /** 推荐的命令 */
  command: string;
  /** 命令描述 */
  description: string;
  /** 置信度 (0-1) */
  confidence: number;
  /** 推荐来源 */
  source: 'session' | 'global' | 'time' | 'context';
}

/**
 * 命令信息
 */
export interface CommandInfo {
  /** 命令类别 */
  category: string;
  /** 命令描述 */
  description: string;
}

/**
 * 命令搜索结果
 */
export interface SearchResult {
  /** 命令名称 */
  command: string;
  /** 命令描述 */
  description: string;
  /** 命令类别 */
  category: string;
  /** 使用次数 */
  usage: number;
  /** 相关性分数 */
  relevance: number;
}

/**
 * 推荐引擎配置选项
 */
export interface RecommendationEngineOptions {
  /** 最大推荐数量 */
  maxRecommendations?: number;
  /** 最小置信度阈值 */
  minConfidence?: number;
  /** 会话权重配置 */
  sessionWeights?: {
    /** 最近使用权重 */
    recent?: number;
    /** 频繁使用权重 */
    frequent?: number;
    /** 上下文关联权重 */
    contextual?: number;
  };
}

/**
 * 用户统计数据
 */
export interface UserStatsData {
  /** 命令使用次数映射 */
  commands: Record<string, number>;
  /** 上下文关联映射 */
  contexts: Record<string, number>;
  /** 使用模式映射 */
  patterns: Record<string, number>;
  /** 最后更新时间戳 */
  timestamp: number;
}

/**
 * 推荐引擎统计信息
 */
export interface RecommendationStats {
  /** 总命令数 */
  totalCommands: number;
  /** 常用命令列表 */
  topCommands: [string, number][];
  /** 最后更新时间 */
  timestamp: number;
}

/**
 * 推荐引擎类
 */
export class RecommendationEngine {
  constructor(options?: RecommendationEngineOptions);
  
  /**
   * 记录命令使用
   */
  record(command: string, context?: UserContext): void;
  
  /**
   * 获取推荐
   */
  getRecommendations(context?: UserContext): Recommendation[];
  
  /**
   * 搜索命令
   */
  searchCommands(query: string, limit?: number): SearchResult[];
  
  /**
   * 获取统计信息
   */
  getStats(): RecommendationStats;
  
  /**
   * 清除统计数据
   */
  clearStats(): void;
}

/**
 * 记录命令使用
 */
export function recordCommand(command: string, context?: UserContext): void;

/**
 * 获取推荐
 */
export function getRecommendations(context?: UserContext): Recommendation[];

/**
 * 搜索命令
 */
export function searchCommands(query: string, limit?: number): SearchResult[];

/**
 * 获取推荐统计
 */
export function getRecommendationStats(): RecommendationStats;

export default RecommendationEngine;
