/**
 * 统计看板系统类型定义
 */

/**
 * 图表类型
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'list' | 'progress';

/**
 * 时间范围
 */
export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * 消息记录
 */
export interface MessageRecord {
  timestamp: number;
  role?: string;
  content?: string;
  model?: string;
  tokens?: number;
  cost?: number;
  [key: string]: any;
}

/**
 * 命令记录
 */
export interface CommandRecord {
  timestamp: number;
  command: string;
  args?: string[];
  success?: boolean;
  duration?: number;
  [key: string]: any;
}

/**
 * 会话记录
 */
export interface SessionRecord {
  timestamp: number;
  sessionId: string;
  sessionName: string;
  action: 'create' | 'switch' | 'delete';
  [key: string]: any;
}

/**
 * 成就记录
 */
export interface AchievementRecord {
  timestamp: number;
  achievementId: string;
  achievementName: string;
  rarity: string;
  points: number;
  [key: string]: any;
}

/**
 * 统计摘要
 */
export interface StatisticsSummary {
  totalMessages: number;
  totalCommands: number;
  totalSessions: number;
  totalAchievements: number;
  activeDays: number;
  uniqueCommands: number;
}

/**
 * 概览统计
 */
export interface OverviewStats {
  timeRange: TimeRange;
  summary: {
    messages: number;
    commands: number;
    sessions: number;
    achievements: number;
  };
  dailyActivity: Record<string, number>;
  hourlyActivity: Record<number, number>;
  commandUsage: Record<string, number>;
}

/**
 * 成就统计
 */
export interface AchievementStats {
  total: number;
  unlocked: number;
  locked: number;
  percentage: number;
  totalPoints: number;
  byRarity: Record<string, number>;
  byCategory: Record<string, number>;
  recent: AchievementRecord[];
}

/**
 * 统计数据导出
 */
export interface StatisticsExport {
  overview: OverviewStats;
  achievements: AchievementStats | null;
  timestamp: number;
}

/**
 * 统计看板选项
 */
export interface StatisticsDashboardOptions {
  dataDir?: string;
  autoSave?: boolean;
  saveInterval?: number;
  achievementEngine?: any;
}

/**
 * 图表选项
 */
export interface ChartOptions {
  title?: string;
  width?: number;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

/**
 * 每日活动数据
 */
export interface DailyActivityData {
  date: string;
  count: number;
}

/**
 * 每小时活动数据
 */
export interface HourlyActivityData {
  hour: number;
  count: number;
}

/**
 * 命令使用数据
 */
export interface CommandUsageData {
  command: string;
  count: number;
  percentage: number;
}

/**
 * 统计数据
 */
export interface IStatisticsData {
  messages: MessageRecord[];
  commands: CommandRecord[];
  sessions: SessionRecord[];
  achievements: AchievementRecord[];
  dailyActivity: Map<string, number>;
  hourlyActivity: Map<number, number>;
  commandUsage: Map<string, number>;
  modelUsage: Map<string, number>;

  addMessage(data: Partial<MessageRecord>): void;
  addCommand(data: Partial<CommandRecord>): void;
  addSession(data: Partial<SessionRecord>): void;
  addAchievement(data: Partial<AchievementRecord>): void;
  updateDailyActivity(timestamp: number): void;
  updateHourlyActivity(timestamp: number): void;
  updateCommandUsage(command: string): void;
  filterByTimeRange(range: TimeRange): {
    messages: MessageRecord[];
    commands: CommandRecord[];
    sessions: SessionRecord[];
    achievements: AchievementRecord[];
  };
  getSummary(): StatisticsSummary;
}

/**
 * 统计看板
 */
export interface IStatisticsDashboard {
  stats: IStatisticsData;
  achievementEngine: any;
  options: StatisticsDashboardOptions;
  saveTimer: NodeJS.Timeout | null;

  recordMessage(data: Partial<MessageRecord>): void;
  recordCommand(data: Partial<CommandRecord>): void;
  recordSession(data: Partial<SessionRecord>): void;
  recordAchievement(data: Partial<AchievementRecord>): void;
  getOverview(timeRange?: TimeRange): OverviewStats;
  getDailyActivity(filtered?: any): Record<string, number>;
  getHourlyActivity(filtered?: any): Record<number, number>;
  getCommandUsage(filtered?: any): Record<string, number>;
  getAchievementStats(): AchievementStats | null;
  getAchievementsByRarity(achievements: any[]): Record<string, number>;
  getAchievementsByCategory(achievements: any[]): Record<string, number>;
  formatOverview(timeRange?: TimeRange): string;
  formatChart(type: ChartType, data: any, options?: ChartOptions): string;
  formatBarChart(data: any, width: number): string;
  formatLineChart(data: any, width: number): string;
  formatPieChart(data: any, width: number): string;
  formatProgressChart(data: any, width: number): string;
  saveStats(): void;
  loadStats(): void;
  startAutoSave(): void;
  stopAutoSave(): void;
  export(): StatisticsExport;
  destroy(): void;
}

/**
 * 命令: 快捷函数
 */
export declare function createStatisticsDashboard(options?: StatisticsDashboardOptions): IStatisticsDashboard;
export declare function showDashboard(dashboard: IStatisticsDashboard, timeRange?: TimeRange): void;
export declare function showCommandChart(dashboard: IStatisticsDashboard, timeRange?: TimeRange): void;
export declare function showDailyActivityChart(dashboard: IStatisticsDashboard, timeRange?: TimeRange): void;
export declare function showAchievementProgress(dashboard: IStatisticsDashboard): void;

/**
 * 导出的常量
 */
export const ChartType: {
  readonly BAR: 'bar';
  readonly LINE: 'line';
  readonly PIE: 'pie';
  readonly TABLE: 'table';
  readonly LIST: 'list';
  readonly PROGRESS: 'progress';
};

export const TimeRange: {
  readonly TODAY: 'today';
  readonly WEEK: 'week';
  readonly MONTH: 'month';
  readonly QUARTER: 'quarter';
  readonly YEAR: 'year';
  readonly ALL: 'all';
};
