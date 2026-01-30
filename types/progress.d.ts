/**
 * 进度条和流式输出优化系统类型定义
 */

/**
 * 进度条样式配置
 */
export interface ProgressBarStyle {
  /** 完成字符 */
  complete: string;
  /** 未完成字符 */
  incomplete: string;
  /** 进度条长度 */
  length: number;
}

/**
 * 进度条选项
 */
export interface ProgressBarOptions {
  /** 总数 */
  total?: number;
  /** 当前进度 */
  current?: number;
  /** 进度条宽度 */
  width?: number;
  /** 样式名称 */
  style?: ProgressBarStyleName;
  /** 是否显示百分比 */
  showPercentage?: boolean;
  /** 是否显示当前值 */
  showValue?: boolean;
  /** 是否显示预计剩余时间 */
  showETA?: boolean;
  /** 标签文本 */
  label?: string;
  /** 进度条颜色 */
  barColor?: string;
  /** 背景颜色 */
  bgColor?: string;
  /** 文本颜色 */
  textColor?: string;
}

/**
 * 进度条样式名称
 */
export type ProgressBarStyleName = 
  | 'standard'
  | 'dots'
  | 'blocks'
  | 'arrow'
  | 'double'
  | 'circles';

/**
 * 速度配置阈值
 */
export interface SpeedConfigThreshold {
  /** 缓冲区大小阈值 */
  threshold: number;
  /** 输出字符数 */
  count: number;
  /** 延迟时间(ms) */
  delay: number;
}

/**
 * 速度配置
 */
export interface SpeedConfig {
  /** 缓冲区大小阈值配置 */
  bufferSizeThresholds: SpeedConfigThreshold[];
  /** 默认输出字符数 */
  defaultCount: number;
  /** 默认延迟时间(ms) */
  defaultDelay: number;
}

/**
 * 流式输出控制器选项
 */
export interface StreamOutputControllerOptions {
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 速度配置 */
  speedConfig?: SpeedConfig;
}

/**
 * 步骤配置
 */
export interface StepConfig {
  /** 步骤标签 */
  label: string;
  /** 步骤总数 */
  total?: number;
}

/**
 * 流式优化器选项
 */
export interface StreamOptimizerOptions {
  /** 缓冲区大小 */
  bufferSize?: number;
  /** 刷新间隔(ms) */
  flushInterval?: number;
  /** 是否启用自适应模式 */
  adaptiveMode?: boolean;
}

/**
 * ProgressBar 类 - 进度条
 */
export class ProgressBar {
  constructor(options?: ProgressBarOptions);
  
  /** 总数 */
  total: number;
  /** 当前进度 */
  current: number;
  /** 进度条宽度 */
  width: number;
  /** 样式 */
  style: ProgressBarStyleName;
  /** 是否激活 */
  isActive: boolean;
  
  /**
   * 开始进度条
   * @param total 总数(可选)
   */
  start(total?: number): void;
  
  /**
   * 更新进度
   * @param current 当前进度(可选)
   */
  update(current?: number): void;
  
  /**
   * 增加进度
   * @param amount 增加量
   */
  increment(amount?: number): void;
  
  /**
   * 完成进度条
   */
  complete(): void;
  
  /**
   * 停止进度条
   */
  stop(): void;
  
  /**
   * 渲染进度条
   */
  render(): void;
  
  /**
   * 格式化时间
   * @param ms 毫秒数
   * @returns 格式化后的时间字符串
   */
  formatTime(ms: number): string;
  
  /**
   * 重置进度条
   */
  reset(): void;
}

/**
 * DownloadProgressBar 类 - 下载进度条
 */
export class DownloadProgressBar extends ProgressBar {
  constructor(options?: ProgressBarOptions);
  
  /** 已下载字节数 */
  downloaded: number;
  /** 下载速度(字节/秒) */
  speed: number;
  
  /**
   * 更新下载进度
   * @param downloaded 已下载字节数
   * @param total 总字节数
   */
  updateDownload(downloaded: number, total?: number): void;
  
  /**
   * 格式化字节数
   * @param bytes 字节数
   * @returns 格式化后的字节数
   */
  formatBytes(bytes: number): string;
}

/**
 * MultiStepProgressBar 类 - 多步骤进度条
 */
export class MultiStepProgressBar {
  constructor(steps: StepConfig[], options?: ProgressBarOptions);
  
  /** 步骤配置 */
  steps: StepConfig[];
  /** 当前步骤索引 */
  currentStep: number;
  /** 进度条映射 */
  progressBars: Record<number, ProgressBar>;
  
  /**
   * 开始指定步骤
   * @param stepIndex 步骤索引
   */
  startStep(stepIndex: number): void;
  
  /**
   * 更新当前步骤
   * @param current 当前进度
   */
  update(current?: number): void;
  
  /**
   * 完成当前步骤
   */
  completeStep(): void;
  
  /**
   * 渲染所有步骤
   */
  render(): void;
  
  /**
   * 完成所有步骤
   */
  complete(): void;
}

/**
 * StreamOutputController 类 - 流式输出控制器
 */
export class StreamOutputController {
  constructor(options?: StreamOutputControllerOptions);
  
  /** 文本缓冲区 */
  buffer: string;
  /** 是否正在打印 */
  isPrinting: boolean;
  /** 速度配置 */
  speedConfig: SpeedConfig;
  /** 进度条 */
  progressBar: ProgressBar | null;
  
  /**
   * 添加文本到缓冲区
   * @param text 文本
   */
  add(text: string): void;
  
  /**
   * 开始输出
   */
  start(): void;
  
  /**
   * 停止输出
   */
  stop(): void;
  
  /**
   * 等待输出完成
   * @returns Promise
   */
  waitIdle(): Promise<void>;
  
  /**
   * 显示进度条
   * @param options 进度条选项
   */
  showProgressBar(options: ProgressBarOptions): void;
  
  /**
   * 更新进度条
   * @param current 当前进度
   */
  updateProgress(current?: number): void;
  
  /**
   * 隐藏进度条
   */
  hideProgressBar(): void;
  
  /**
   * 完成进度条
   */
  completeProgress(): void;
}

/**
 * StreamOptimizer 类 - 智能流式输出优化器
 */
export class StreamOptimizer {
  constructor(options?: StreamOptimizerOptions);
  
  /** 缓冲区大小 */
  bufferSize: number;
  /** 刷新间隔 */
  flushInterval: number;
  /** 是否启用自适应模式 */
  adaptiveMode: boolean;
  /** 当前吞吐量 */
  currentThroughput: number;
  /** 吞吐量历史 */
  throughputHistory: number[];
  /** 流式控制器 */
  controller: StreamOutputController;
  
  /**
   * 添加文本
   * @param text 文本
   */
  add(text: string): void;
  
  /**
   * 刷新缓冲区
   */
  flush(): void;
  
  /**
   * 获取自适应速度配置
   * @returns 速度配置
   */
  getAdaptiveSpeedConfig(): SpeedConfig;
  
  /**
   * 调整速度配置
   */
  adjustSpeedConfig(): void;
  
  /**
   * 获取平均吞吐量
   * @returns 平均吞吐量
   */
  getAverageThroughput(): number;
  
  /**
   * 完成输出
   * @returns Promise
   */
  complete(): Promise<void>;
  
  /**
   * 停止输出
   */
  stop(): void;
}

/**
 * 进度条样式集合
 */
export const ProgressBarStyles: Record<ProgressBarStyleName, ProgressBarStyle>;

/**
 * 快捷函数 - 创建进度条
 */
export function createProgressBar(options?: ProgressBarOptions): ProgressBar;

/**
 * 快捷函数 - 创建下载进度条
 */
export function createDownloadProgressBar(options?: ProgressBarOptions): DownloadProgressBar;

/**
 * 快捷函数 - 创建流式输出控制器
 */
export function createStreamController(options?: StreamOutputControllerOptions): StreamOutputController;

/**
 * 快捷函数 - 创建流式优化器
 */
export function createStreamOptimizer(options?: StreamOptimizerOptions): StreamOptimizer;
