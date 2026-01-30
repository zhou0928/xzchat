/**
 * 插件系统 TypeScript 类型定义
 */

/**
 * 插件状态枚举
 */
export enum PluginStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error'
}

/**
 * 插件元数据接口
 */
export interface IPluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  main: string;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  keywords: string[];
  category: string;
  [key: string]: any;
}

/**
 * 插件接口
 */
export interface IPlugin {
  metadata: IPluginMetadata;
  path: string;
  instance?: any;
  status: PluginStatus;
  hooks: Map<string, Function>;
  commands: Map<string, ICommand>;
  middlewares: Array<Function>;
  context?: any;
  error?: Error;
  enabledAt?: Date;

  load(context: any): Promise<boolean>;
  enable(): Promise<boolean>;
  disable(): Promise<boolean>;
  unload(): Promise<boolean>;
  registerHook(event: string, handler: Function): void;
  registerCommand(name: string, command: ICommand): void;
  registerMiddleware(middleware: Function): void;
  getInfo(): IPluginInfo;
}

/**
 * 插件命令接口
 */
export interface ICommand {
  handler: Function;
  description: string;
  usage: string;
  category: string;
  examples?: string[];
  permissions?: string[];
}

/**
 * 插件信息接口
 */
export interface IPluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  status: PluginStatus;
  enabledAt?: Date;
  error?: string;
}

/**
 * 插件管理器配置接口
 */
export interface IPluginManagerOptions {
  pluginPaths?: string[];
  context?: Record<string, any>;
  autoLoad?: boolean;
  enableValidation?: boolean;
  enablePerformanceMonitoring?: boolean;
}

/**
 * 插件管理器接口
 */
export interface IPluginManager {
  plugins: Map<string, IPlugin>;
  pluginPaths: string[];
  context: Record<string, any>;
  hooks: Map<string, Function>;
  autoLoad: boolean;
  loadOrder: string[];
  enableValidation: boolean;
  enablePerformanceMonitoring: boolean;

  addPluginPath(pluginPath: string): void;
  scanPlugins(): Promise<Array<{ metadata: IPluginMetadata; path: string }>>;
  loadAll(): Promise<number>;
  loadPlugin(name: string, pluginPath: string, metadata: IPluginMetadata): Promise<IPlugin>;
  enablePlugin(name: string): Promise<boolean>;
  disablePlugin(name: string): Promise<boolean>;
  unloadPlugin(name: string): Promise<boolean>;
  reloadPlugin(name: string): Promise<boolean>;
  getPlugin(name: string): IPlugin | undefined;
  getAllPlugins(): IPlugin[];
  getEnabledPlugins(): IPlugin[];
  registerHook(event: string, handler: Function): void;
  unregisterHook(event: string, handler: Function): void;
  triggerHook(event: string, ...args: any[]): Promise<any[]>;
}

/**
 * 依赖检查结果接口
 */
export interface IDependencyCheckResult {
  satisfied: boolean;
  missing: string[];
  unsatisfied: Array<{
    dependency: string;
    required: string;
    installed: string;
  }>;
}

/**
 * 依赖管理器接口
 */
export interface IPluginDependencyManager {
  buildDependencyGraph(plugins: IPlugin[]): void;
  checkCircularDependencies(): { hasCycle: boolean; cycle?: string[] };
  resolveLoadOrder(): string[];
  checkDependencies(pluginId: string): IDependencyCheckResult;
  installDependencies(pluginId: string): Promise<any[]>;
  canSafelyUnload(pluginId: string): { canUnload: boolean; dependents: string[] };
  getDependencyReport(): IDependencyReport;
}

/**
 * 依赖报告接口
 */
export interface IDependencyReport {
  totalPlugins: number;
  pluginsWithDependencies: number;
  hasCycles: boolean;
  cycleInfo: string[] | null;
  loadOrder: string[];
  dependenciesSummary: Record<string, string[]>;
}

/**
 * 插件市场插件信息接口
 */
export interface IMarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  publishedAt: string;
  changelog: Record<string, string>;
  package: any;
  downloadUrl: string;
}

/**
 * 插件市场接口
 */
export interface IPluginMarketplace {
  registry: Map<string, IMarketplacePlugin>;
  loadLocalRegistry(): Promise<void>;
  saveLocalRegistry(): Promise<void>;
  updateRegistry(): Promise<{ success: boolean; message?: string; error?: string }>;
  searchPlugins(query: string): IMarketplacePlugin[];
  getPluginDetails(pluginId: string): IMarketplacePlugin | undefined;
  installPlugin(pluginId: string): Promise<{ success: boolean; message?: string; error?: string }>;
  checkUpdates(): Array<{
    id: string;
    name: string;
    currentVersion: string;
    newVersion: string;
    description: string;
  }>;
  getCategories(): Map<string, IMarketplacePlugin[]>;
  getPopularPlugins(limit?: number): IMarketplacePlugin[];
  getLatestPlugins(limit?: number): IMarketplacePlugin[];
  getTopRatedPlugins(limit?: number): IMarketplacePlugin[];
  submitRating(pluginId: string, rating: number, review: string): Promise<{ success: boolean; message?: string }>;
  getStatistics(): {
    totalPlugins: number;
    totalCategories: number;
    totalDownloads: number;
    averageRating: string;
  };
}

/**
 * 版本备份接口
 */
export interface IVersionBackup {
  id: string;
  pluginId: string;
  version: string;
  timestamp: string;
  checksum: string;
  path: string;
}

/**
 * 版本管理器接口
 */
export interface IPluginVersionManager {
  backups: Map<string, IVersionBackup[]>;
  createBackup(pluginId: string): Promise<IVersionBackup | null>;
  restoreVersion(pluginId: string, backupId: string): Promise<boolean>;
  restoreFromBackup(pluginId: string): Promise<boolean>;
  verifyIntegrity(pluginId: string): Promise<{ valid: boolean; checksum?: string; error?: string }>;
  checkCompatibility(pluginMetadata: IPluginMetadata, systemVersion: string): boolean;
  getVersionHistory(pluginId: string): IVersionBackup[];
  clearBackups(pluginId: string): Promise<void>;
  rollback(pluginId: string, targetVersion: string): Promise<boolean>;
}

/**
 * 性能指标接口
 */
export interface IPerformanceMetrics {
  pluginId: string;
  operations: Record<string, {
    count: number;
    totalDuration: number;
    minDuration: number;
    maxDuration: number;
    avgDuration: number;
  }>;
  errors: number;
  totalDuration: number;
  operationCount: number;
  lastUpdated: string;
  [key: string]: any;
}

/**
 * 日志条目接口
 */
export interface ILogEntry {
  id: string;
  pluginId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
  operation?: string;
  error?: string;
  stack?: string;
  [key: string]: any;
}

/**
 * 性能报告接口
 */
export interface IPerformanceReport {
  totalPlugins: number;
  totalOperations: number;
  totalErrors: number;
  totalDuration: number;
  topPluginsByOperations: IPerformanceMetrics[];
  topPluginsByErrors: IPerformanceMetrics[];
  topPluginsByDuration: IPerformanceMetrics[];
  slowOperations: Array<{
    pluginId: string;
    operation: string;
    avgDuration: number;
    maxDuration: number;
  }>;
}

/**
 * 性能监控器接口
 */
export interface IPluginPerformanceMonitor {
  metrics: Map<string, IPerformanceMetrics>;
  logs: ILogEntry[];
  maxLogSize: number;

  initialize(): Promise<void>;
  recordMetric(pluginId: string, operation: string, duration: number, metadata?: Record<string, any>): void;
  recordError(pluginId: string, operation: string, error: Error): void;
  addLog(pluginId: string, level: string, data: Record<string, any>): void;
  getMetrics(pluginId: string): IPerformanceMetrics | undefined;
  getAllMetrics(): IPerformanceMetrics[];
  getLogs(pluginId?: string, level?: string | null, limit?: number): ILogEntry[];
  clearLogs(pluginId?: string, beforeDate?: string): void;
  resetMetrics(pluginId?: string): void;
  getPerformanceReport(): IPerformanceReport;
  exportReport(format: 'json' | 'text'): Promise<string>;
  monitor(pluginId: string, operation: string, fn: Function): Promise<any>;
  monitorAsync(pluginId: string, operation: string, fn: Function): Promise<any>;
}

/**
 * 验证结果接口
 */
export interface IValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

/**
 * 验证器接口
 */
export interface IPluginValidator {
  validate(plugin: { metadata: IPluginMetadata; path: string; code?: string }): IValidationResult;
  validateMetadata(metadata: IPluginMetadata): IValidationResult;
  validateFileStructure(plugin: { path: string; metadata: IPluginMetadata }): IValidationResult;
  validateDependencies(metadata: IPluginMetadata): IValidationResult;
  validateCodeQuality(code?: string): IValidationResult;
  validateSecurity(code?: string): IValidationResult;
  validatePerformance(code?: string): IValidationResult;
  calculateScore(results: IValidationResult[]): number;
  generateReport(plugin: any, validation: IValidationResult): string;
}

/**
 * 插件错误基类
 */
export abstract class PluginError extends Error {
  abstract code: string;
  abstract name: string;
  pluginId: string;
  details?: string;

  constructor(pluginId: string, details?: string) {
    super(details || `Plugin error: ${pluginId}`);
    this.pluginId = pluginId;
    this.details = details;
    this.name = this.constructor.name;
  }

  toJSON(): {
    name: string;
    code: string;
    pluginId: string;
    details?: string;
  };
}

/**
 * 依赖错误接口
 */
export interface IDependencyErrorOptions {
  pluginId: string;
  missing: string[];
  unsatisfied: Array<{
    dependency: string;
    required: string;
    installed: string;
  }>;
  message?: string;
}
