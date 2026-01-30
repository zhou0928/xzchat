/**
 * 上下文感知帮助系统类型定义
 */

/**
 * 上下文类型枚举
 */
export enum ContextType {
  IDLE = 'idle',                    // 空闲状态
  CHATTING = 'chatting',            // 正在对话
  EDITING = 'editing',              // 正在编辑
  ERROR = 'error',                  // 错误状态
  CONFIG = 'config',                // 配置中
  SESSION = 'session',              // 会话管理
  BRANCH = 'branch',                // 分支操作
  RAG = 'rag',                     // RAG 操作
  GIT = 'git',                     // Git 操作
  FILE = 'file',                   // 文件操作
  TOOL = 'tool',                   // 工具使用
  NEW_USER = 'new_user'            // 新用户
}

/**
 * 命令记录接口
 */
export interface CommandRecord {
  /** 命令字符串 */
  command: string;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 错误记录接口
 */
export interface ErrorRecord {
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code?: string;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 上下文状态类
 */
export class ContextState {
  /** 上下文类型 */
  contextType: ContextType;
  /** 之前的命令 */
  previousCommands: CommandRecord[];
  /** 最后的错误 */
  lastError: ErrorRecord | null;
  /** 会话 ID */
  sessionId: string | null;
  /** 消息数量 */
  messageCount: number;
  /** 已配置的功能 */
  configuredFeatures: Set<string>;
  /** 用户等级 */
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  /** 最后操作时间 */
  lastActionTime: string | null;

  /**
   * 更新上下文类型
   */
  setContextType(type: ContextType): void;

  /**
   * 记录命令
   */
  recordCommand(command: string): void;

  /**
   * 设置会话 ID
   */
  setSessionId(sessionId: string): void;

  /**
   * 设置消息数量
   */
  setMessageCount(count: number): void;

  /**
   * 记录错误
   */
  recordError(error: Error | ErrorRecord): void;

  /**
   * 更新用户等级
   */
  private updateUserLevel(): void;

  /**
   * 检测已配置的功能
   */
  private detectConfiguredFeatures(command: string): void;

  /**
   * 获取常用命令
   */
  getCommonCommands(): Array<{ command: string; count: number }>;

  /**
   * 获取上下文摘要
   */
  getSummary(): ContextSummary;
}

/**
 * 上下文摘要接口
 */
export interface ContextSummary {
  /** 上下文类型 */
  contextType: ContextType;
  /** 用户等级 */
  userLevel: string;
  /** 消息数量 */
  messageCount: number;
  /** 已配置的功能 */
  configuredFeatures: string[];
  /** 最近的命令 */
  recentCommands: string[];
  /** 是否有错误 */
  hasError: boolean;
  /** 距离上次操作的时间 (毫秒) */
  timeSinceLastAction: number | null;
}

/**
 * 帮助建议接口
 */
export interface HelpSuggestion {
  /** 操作名称 */
  action: string;
  /** 命令 */
  command?: string;
  /** 描述 */
  description?: string;
}

/**
 * 上下文帮助项接口
 */
export interface ContextualHelpItem {
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 类型 */
  type: string;
  /** 子命令 */
  subcommands?: Record<string, string>;
  /** 建议 */
  suggestions?: HelpSuggestion[];
  /** 提示 */
  tips?: string[];
  /** 当前配置 */
  currentConfig?: Record<string, any>;
  /** 错误信息 */
  error?: ErrorRecord;
}

/**
 * 帮助规则接口
 */
export interface HelpRule {
  /** 规则 ID */
  id: string;
  /** 上下文类型 */
  contextType: ContextType;
  /** 优先级 */
  priority: number;
  /** 匹配函数 */
  matcher: (context: ContextSummary) => boolean;
  /** 生成函数 */
  generator: (context: ContextSummary) => ContextualHelpItem;
}

/**
 * 上下文帮助结果接口
 */
export interface ContextualHelpResult {
  /** 上下文信息 */
  context: ContextSummary;
  /** 帮助项 */
  helps: ContextualHelpItem[];
  /** 推荐命令 */
  recommendations: Array<{
    command: string;
    description: string;
    confidence: number;
  }>;
}

/**
 * 上下文帮助引擎配置选项
 */
export interface ContextualHelpEngineOptions {
  /** 最大建议数量 */
  maxSuggestions?: number;
  /** 是否启用推荐 */
  enableRecommendations?: boolean;
  /** 是否启用自动修复 */
  enableAutoFix?: boolean;
}

/**
 * 上下文感知帮助引擎类
 */
export class ContextualHelpEngine {
  /** 配置选项 */
  options: ContextualHelpEngineOptions;
  /** 上下文状态 */
  context: ContextState;
  /** 帮助规则 */
  helpRules: Map<string, HelpRule>;

  /**
   * 构造函数
   */
  constructor(options?: ContextualHelpEngineOptions);

  /**
   * 初始化帮助规则
   */
  private initializeHelpRules(): void;

  /**
   * 注册帮助规则
   */
  registerHelpRule(rule: HelpRule): void;

  /**
   * 更新上下文
   */
  updateContext(updates: Partial<{
    contextType: ContextType;
    sessionId: string;
    messageCount: number;
    command: string;
    error: Error | ErrorRecord;
  }>): void;

  /**
   * 从命令检测上下文类型
   */
  private detectContextFromCommand(command: string): void;

  /**
   * 获取上下文帮助
   */
  getContextualHelp(): ContextualHelpResult;

  /**
   * 格式化帮助输出
   */
  formatHelpOutput(contextualHelp: ContextualHelpResult): string;

  /**
   * 获取简短帮助
   */
  getQuickHelp(): string;

  /**
   * 打印帮助
   */
  printHelp(): ContextualHelpResult;

  /**
   * 获取 JSON 格式
   */
  toJSON(): string;
}

/**
 * 更新上下文
 */
export function updateContext(updates: {
  contextType?: ContextType;
  sessionId?: string;
  messageCount?: number;
  command?: string;
  error?: Error | ErrorRecord;
}): void;

/**
 * 获取上下文帮助
 */
export function getContextualHelp(): ContextualHelpResult;

/**
 * 打印上下文帮助
 */
export function printContextualHelp(): ContextualHelpResult;

/**
 * 获取简短帮助
 */
export function getQuickHelp(): string;

/**
 * 默认引擎实例
 */
export const defaultEngine: ContextualHelpEngine;
