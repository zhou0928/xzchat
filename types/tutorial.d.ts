/**
 * 交互式教程系统类型定义
 */

/**
 * 教程步骤状态
 */
export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/**
 * 教程步骤类型
 */
export type StepType = 'intro' | 'config' | 'command' | 'interactive' | 'practice' | 'quiz' | 'advanced';

/**
 * 教程难度等级
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * 教程类别
 */
export type TutorialCategory = 'getting-started' | 'features' | 'advanced' | 'configuration' | 'integrations' | 'troubleshooting';

/**
 * 步骤验证结果
 */
export interface ValidationResult {
  success: boolean;
  message?: string;
  hints?: string[];
}

/**
 * 步骤验证函数
 */
export type StepValidationFunction = (input: string, metadata?: Record<string, any>) => ValidationResult;

/**
 * 提示信息
 */
export interface HintInfo {
  hint: string;
  level: number;
  total: number;
}

/**
 * 教程步骤选项
 */
export interface TutorialStepOptions {
  id?: string;
  type: StepType;
  title: string;
  description: string;
  content?: string;
  expectedCommand?: RegExp | string;
  validation?: StepValidationFunction;
  hints?: string[];
  metadata?: Record<string, any>;
}

/**
 * 教程步骤
 */
export interface ITutorialStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  content: string;
  expectedCommand: RegExp | string | null;
  validation: StepValidationFunction | null;
  hints: string[];
  status: StepStatus;
  metadata: Record<string, any>;

  start(): void;
  complete(): void;
  skip(): void;
  validate(input: string): ValidationResult;
  getHint(level?: number): string | null;
  getHintCount(): number;
  reset(): void;
}

/**
 * 教程引擎选项
 */
export interface TutorialEngineOptions {
  autoSave?: boolean;
  showProgress?: boolean;
  allowSkip?: boolean;
  enableHints?: boolean;
  hintPenalty?: number;
  maxHintLevel?: number;
  completionThreshold?: number;
}

/**
 * 教程步骤进度
 */
export interface StepProgress {
  id: string;
  status: StepStatus;
}

/**
 * 教程进度
 */
export interface TutorialProgress {
  tutorialId: string;
  steps: StepProgress[];
  activeStep: string | null;
  timestamp: number;
}

/**
 * 教程进度信息
 */
export interface ProgressInfo {
  total: number;
  completed: number;
  skipped: number;
  remaining: number;
  percentage: number;
  currentStep: string | null;
}

/**
 * 教程信息
 */
export interface TutorialInfo {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  duration: string;
  category: TutorialCategory;
  steps: number;
  progress: ProgressInfo | null;
  isActive: boolean;
}

/**
 * 教程步骤选项
 */
export interface TutorialStepCreateOptions {
  id?: string;
  type: StepType;
  title: string;
  description: string;
  content?: string;
  expectedCommand?: RegExp | string;
  validation?: StepValidationFunction;
  hints?: string[];
}

/**
 * 教程选项
 */
export interface TutorialOptions {
  id: string;
  name: string;
  description: string;
  difficulty?: DifficultyLevel;
  duration?: string;
  category?: TutorialCategory;
  prerequisites?: string[];
  steps?: TutorialStepCreateOptions[];
  metadata?: Record<string, any>;
}

/**
 * 教程
 */
export interface ITutorial {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  duration: string;
  category: TutorialCategory;
  prerequisites: string[];
  steps: ITutorialStep[];
  metadata: Record<string, any>;

  addStep(options: TutorialStepCreateOptions): ITutorialStep;
  getStep(stepId: string): ITutorialStep | undefined;
  getSteps(): ITutorialStep[];
}

/**
 * 教程引擎
 */
export interface ITutorialEngine {
  options: TutorialEngineOptions;
  activeTutorial: ITutorial | null;
  activeStep: ITutorialStep | null;
  userProgress: Map<string, TutorialProgress>;

  registerTutorial(tutorial: ITutorial): void;
  getTutorial(id: string): ITutorial | undefined;
  listTutorials(): TutorialInfo[];
  startTutorial(tutorialId: string): ITutorial;
  startStep(): ITutorialStep | null;
  nextStep(): ITutorialStep | null;
  prevStep(): ITutorialStep | null;
  completeStep(): ITutorialStep;
  skipStep(): ITutorialStep;
  handleInput(input: string): { success: boolean; message: string; nextStep?: ITutorialStep | null };
  getHint(): HintInfo | null;
  getProgress(tutorialId: string): ProgressInfo | null;
  isCompleted(tutorialId: string): boolean;
  completeTutorial(): boolean;
  exitTutorial(): string | null;
  saveProgress(): void;
  loadProgress(): void;
  resumeTutorial(tutorialId: string): ITutorial;
  resetTutorial(tutorialId: string): ITutorial;
  formatTutorialInfo(tutorialId: string): TutorialInfo | null;
}

/**
 * 教程处理结果
 */
export interface TutorialHandleResult {
  success: boolean;
  message: string;
  nextStep?: ITutorialStep | null;
}

/**
 * 教程输出选项
 */
export interface TutorialOutputOptions {
  showProgress?: boolean;
  showHints?: boolean;
  showCommands?: boolean;
  format?: 'text' | 'json' | 'markdown';
}

/**
 * 教程统计
 */
export interface TutorialStats {
  totalTutorials: number;
  completedTutorials: number;
  inProgressTutorials: number;
  totalSteps: number;
  completedSteps: number;
  averageCompletionTime: number;
  totalHintsUsed: number;
}

/**
 * 用户教程历史
 */
export interface UserTutorialHistory {
  userId?: string;
  tutorials: {
    tutorialId: string;
    startedAt: number;
    completedAt?: number;
    timeSpent: number;
    hintsUsed: number;
    stepsSkipped: number;
  }[];
}

/**
 * 教程推荐
 */
export interface TutorialRecommendation {
  tutorial: TutorialInfo;
  reason: string;
  priority: number;
}

/**
 * 教程配置
 */
export interface TutorialConfig {
  enabled: boolean;
  autoStartForNewUsers: boolean;
  requiredTutorials: string[];
  showTutorialPrompts: boolean;
  promptFrequency: 'always' | 'once' | 'daily' | 'weekly';
}

/**
 * 教程成就
 */
export interface TutorialAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  criteria: {
    type: 'complete_tutorials' | 'complete_steps' | 'use_hints' | 'fast_completion';
    value: number;
    tutorialIds?: string[];
  };
}

/**
 * 步骤元数据
 */
export interface StepMetadata {
  hintLevel?: number;
  timeSpent?: number;
  attempts?: number;
  hintsUsed?: number;
  startTime?: number;
  completedAt?: number;
  [key: string]: any;
}

/**
 * 教程事件
 */
export interface TutorialEvent {
  type: 'started' | 'step_started' | 'step_completed' | 'step_skipped' | 'completed' | 'exited' | 'resumed' | 'reset';
  tutorialId: string;
  stepId?: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * 教程事件监听器
 */
export type TutorialEventListener = (event: TutorialEvent) => void;

/**
 * 命令: 快捷函数
 */
export declare function initializeTutorials(): ITutorialEngine;
export declare function startQuickStartTutorial(): ITutorialEngine;
export declare function formatTutorialOutput(tutorial: ITutorial, step: ITutorialStep, showProgress?: boolean): string;

/**
 * 导出的变量
 */
export declare let engine: ITutorialEngine;

/**
 * 导出的常量
 */
export const StepStatus: {
  readonly NOT_STARTED: 'not_started';
  readonly IN_PROGRESS: 'in_progress';
  readonly COMPLETED: 'completed';
  readonly SKIPPED: 'skipped';
};

export const StepType: {
  readonly INTRO: 'intro';
  readonly CONFIG: 'config';
  readonly COMMAND: 'command';
  readonly INTERACTIVE: 'interactive';
  readonly PRACTICE: 'practice';
  readonly QUIZ: 'quiz';
  readonly ADVANCED: 'advanced';
};

/**
 * 教程创建函数
 */
export declare function createQuickStartTutorial(): ITutorial;
export declare function createSessionTutorial(): ITutorial;
export declare function createBranchTutorial(): ITutorial;
export declare function createRAGTutorial(): ITutorial;
export declare function createConfigTutorial(): ITutorial;
export declare function createTutorialEngine(): ITutorialEngine;
