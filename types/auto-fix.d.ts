/**
 * 自动修复系统类型定义
 */

import { XZChatError, ConfigError, APIError, FileSystemError, NetworkError, ValidationError } from '../lib/utils/errors.js';

/**
 * 检测规则接口
 */
export interface DetectionRule {
  /** 规则名称 */
  name: string;
  /** 错误匹配函数 */
  matcher: (error: Error, context: Record<string, any>) => boolean;
  /** 错误分析函数 */
  analyzer: (error: Error, context: Record<string, any>) => DetectionResult;
  /** 优先级 (0-100, 越高越优先) */
  priority: number;
}

/**
 * 检测结果接口
 */
export interface DetectionResult {
  /** 严重程度 */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  /** 错误类别 */
  category: string;
  /** 错误消息 */
  message: string;
  /** 快速修复建议 */
  quickFix?: string;
  [key: string]: any;
}

/**
 * 修复操作接口
 */
export interface FixAction {
  /** 操作类型 */
  type: 'command' | 'link' | 'wait' | 'retry' | 'config' | 'help' | 'auto';
  /** 操作标签 */
  label: string;
  /** 命令 (type=command) */
  command?: string;
  /** URL (type=link) */
  url?: string;
  /** 等待时间 (type=wait) */
  waitTime?: number;
  /** 最大重试次数 (type=retry) */
  maxRetries?: number;
  /** 配置键 (type=config) */
  key?: string;
  /** 配置值 (type=config) */
  value?: any;
}

/**
 * 修复建议接口
 */
export interface FixSuggestion {
  /** 建议标题 */
  title: string;
  /** 建议描述 */
  description: string;
  /** 优先级 */
  priority?: number;
  /** 快速修复命令 */
  quickFix?: string;
  /** 操作列表 */
  actions?: FixAction[];
  /** 代码示例 */
  codeExample?: string;
  [key: string]: any;
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  /** 错误名称 */
  name: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code?: string;
  /** HTTP 状态码 */
  statusCode?: number;
}

/**
 * 错误分析结果接口
 */
export interface ErrorAnalysis {
  /** 错误信息 */
  error: ErrorInfo;
  /** 检测结果列表 */
  detections: DetectionResult[];
  /** 修复建议列表 */
  suggestions: FixSuggestion[];
  /** 是否有自动修复方案 */
  hasAutoFix: boolean;
  /** 摘要 */
  summary: string;
}

/**
 * 自动修复引擎配置选项
 */
export interface AutoFixEngineOptions {
  /** 最大建议数量 */
  maxSuggestions?: number;
  /** 是否启用自动修复 */
  autoFixEnabled?: boolean;
  [key: string]: any;
}

/**
 * 错误检测器类
 */
export class ErrorDetector {
  /** 检测规则列表 */
  detectionRules: DetectionRule[];

  /**
   * 注册检测规则
   */
  registerRule(rule: DetectionRule): void;

  /**
   * 检测错误
   */
  detect(error: Error, context?: Record<string, any>): DetectionResult[];
}

/**
 * 修复建议生成器类
 */
export class FixSuggestionGenerator {
  /** 修复模板映射 */
  fixTemplates: Map<string, Function>;

  /**
   * 注册修复模板
   */
  registerTemplate(errorType: string, generator: Function): void;

  /**
   * 生成修复建议
   */
  generateSuggestions(error: Error, context?: Record<string, any>): FixSuggestion[];

  /**
   * 生成配置错误建议
   */
  private generateConfigSuggestions(error: ConfigError, context: Record<string, any>): FixSuggestion[];

  /**
   * 生成 API 错误建议
   */
  private generateAPISuggestions(error: APIError, context: Record<string, any>): FixSuggestion[];

  /**
   * 生成文件系统错误建议
   */
  private generateFileSystemSuggestions(error: FileSystemError, context: Record<string, any>): FixSuggestion[];

  /**
   * 生成网络错误建议
   */
  private generateNetworkSuggestions(error: NetworkError, context: Record<string, any>): FixSuggestion[];

  /**
   * 生成验证错误建议
   */
  private generateValidationSuggestions(error: ValidationError, context: Record<string, any>): FixSuggestion[];

  /**
   * 生成通用错误建议
   */
  private generateGeneralSuggestions(error: Error, context: Record<string, any>): FixSuggestion[];
}

/**
 * 自动修复引擎类
 */
export class AutoFixEngine {
  /** 配置选项 */
  options: AutoFixEngineOptions;
  /** 错误检测器 */
  detector: ErrorDetector;
  /** 修复建议生成器 */
  generator: FixSuggestionGenerator;

  /**
   * 构造函数
   */
  constructor(options?: AutoFixEngineOptions);

  /**
   * 初始化检测规则
   */
  private initializeRules(): void;

  /**
   * 分析错误
   */
  analyzeError(error: Error, context?: Record<string, any>): ErrorAnalysis;

  /**
   * 检查是否有自动修复方案
   */
  private hasAutoFix(suggestions: FixSuggestion[]): boolean;

  /**
   * 生成错误摘要
   */
  private generateSummary(
    error: Error,
    detections: DetectionResult[],
    suggestions: FixSuggestion[]
  ): string;

  /**
   * 格式化输出
   */
  formatOutput(analysis: ErrorAnalysis): string;

  /**
   * 格式化操作
   */
  private formatAction(action: FixAction): string;

  /**
   * 打印修复建议
   */
  printSuggestions(error: Error, context?: Record<string, any>): ErrorAnalysis;

  /**
   * 获取 JSON 格式的分析结果
   */
  toJSON(error: Error, context?: Record<string, any>): string;
}

/**
 * 快捷函数: 分析错误并打印建议
 */
export function analyzeAndSuggest(error: Error, context?: Record<string, any>): ErrorAnalysis;

/**
 * 快捷函数: 仅分析错误
 */
export function analyzeError(error: Error, context?: Record<string, any>): ErrorAnalysis;

/**
 * 快捷函数: 格式化输出
 */
export function formatSuggestions(analysis: ErrorAnalysis): string;

/**
 * 默认引擎实例
 */
export const defaultEngine: AutoFixEngine;
