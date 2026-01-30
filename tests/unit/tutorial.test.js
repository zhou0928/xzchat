/**
 * 交互式教程系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Tutorial,
  TutorialStep,
  TutorialEngine,
  StepStatus,
  StepType,
  createQuickStartTutorial,
  createSessionTutorial,
  createTutorialEngine,
  createTutorialStep,
  initializeTutorials
} from '../../lib/utils/tutorial.js';

describe('TutorialStep', () => {
  let step;

  beforeEach(() => {
    step = new TutorialStep({
      id: 'test-step-1',
      type: StepType.COMMAND,
      title: 'Test Step',
      description: 'A test step',
      content: 'Test content',
      expectedCommand: /test/,
      validation: (input) => {
        if (input.includes('test')) {
          return { success: true, message: 'Correct!' };
        }
        return { success: false, message: 'Incorrect' };
      },
      hints: ['Hint 1', 'Hint 2']
    });
  });

  it('should create a step with correct properties', () => {
    expect(step.id).toBe('test-step-1');
    expect(step.type).toBe(StepType.COMMAND);
    expect(step.title).toBe('Test Step');
    expect(step.description).toBe('A test step');
    expect(step.content).toBe('Test content');
    expect(step.hints).toEqual(['Hint 1', 'Hint 2']);
    expect(step.status).toBe(StepStatus.NOT_STARTED);
  });

  it('should start a step', () => {
    step.start();
    expect(step.status).toBe(StepStatus.IN_PROGRESS);
  });

  it('should complete a step', () => {
    step.complete();
    expect(step.status).toBe(StepStatus.COMPLETED);
  });

  it('should skip a step', () => {
    step.skip();
    expect(step.status).toBe(StepStatus.SKIPPED);
  });

  it('should validate correct input', () => {
    const result = step.validate('test input');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Correct!');
  });

  it('should validate incorrect input', () => {
    const result = step.validate('wrong input');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Incorrect');
  });

  it('should return hint for valid level', () => {
    const hint = step.getHint(0);
    expect(hint).toBe('Hint 1');
  });

  it('should return null for invalid hint level', () => {
    const hint = step.getHint(10);
    expect(hint).toBeNull();
  });

  it('should return hint count', () => {
    expect(step.getHintCount()).toBe(2);
  });

  it('should reset step status', () => {
    step.complete();
    step.reset();
    expect(step.status).toBe(StepStatus.NOT_STARTED);
    expect(step.metadata).toEqual({});
  });

  it('should handle validation without custom function', () => {
    const simpleStep = new TutorialStep({
      id: 'simple',
      type: StepType.INTRO,
      title: 'Simple',
      description: 'Simple step'
    });

    const result = simpleStep.validate('any input');
    expect(result.success).toBe(true);
  });

  it('should handle hints array', () => {
    const multiHintStep = new TutorialStep({
      id: 'multi-hint',
      type: StepType.COMMAND,
      title: 'Multi Hint',
      description: 'Multi hint step',
      hints: ['Hint 1', 'Hint 2', 'Hint 3']
    });

    expect(multiHintStep.getHint(0)).toBe('Hint 1');
    expect(multiHintStep.getHint(1)).toBe('Hint 2');
    expect(multiHintStep.getHint(2)).toBe('Hint 3');
    expect(multiHintStep.getHint(3)).toBeNull();
  });
});

describe('Tutorial', () => {
  let tutorial;

  beforeEach(() => {
    tutorial = new Tutorial({
      id: 'test-tutorial',
      name: 'Test Tutorial',
      description: 'A test tutorial',
      difficulty: 'beginner',
      duration: '5-10 minutes',
      category: 'getting-started',
      steps: [
        {
          id: 'step-1',
          type: StepType.INTRO,
          title: 'Step 1',
          description: 'First step'
        },
        {
          id: 'step-2',
          type: StepType.COMMAND,
          title: 'Step 2',
          description: 'Second step'
        }
      ]
    });
  });

  it('should create a tutorial with correct properties', () => {
    expect(tutorial.id).toBe('test-tutorial');
    expect(tutorial.name).toBe('Test Tutorial');
    expect(tutorial.description).toBe('A test tutorial');
    expect(tutorial.difficulty).toBe('beginner');
    expect(tutorial.duration).toBe('5-10 minutes');
    expect(tutorial.category).toBe('getting-started');
    expect(tutorial.steps.length).toBe(2);
    expect(tutorial.prerequisites).toEqual([]);
  });

  it('should add a step', () => {
    const stepCount = tutorial.steps.length;
    tutorial.addStep({
      id: 'step-3',
      type: StepType.ADVANCED,
      title: 'Step 3',
      description: 'Third step'
    });

    expect(tutorial.steps.length).toBe(stepCount + 1);
  });

  it('should auto-generate step id if not provided', () => {
    const initialCount = tutorial.steps.length;
    tutorial.addStep({
      type: StepType.INTRO,
      title: 'Auto ID',
      description: 'Auto generated id'
    });

    const lastStep = tutorial.steps[tutorial.steps.length - 1];
    expect(lastStep.id).toBe(`step-${initialCount + 1}`);
  });

  it('should get step by id', () => {
    const step = tutorial.getStep('step-1');
    expect(step).toBeDefined();
    expect(step.id).toBe('step-1');
  });

  it('should return undefined for non-existent step', () => {
    const step = tutorial.getStep('non-existent');
    expect(step).toBeUndefined();
  });

  it('should get all steps', () => {
    const steps = tutorial.getSteps();
    expect(steps.length).toBe(2);
    expect(steps[0].id).toBe('step-1');
    expect(steps[1].id).toBe('step-2');
  });

  it('should handle prerequisites', () => {
    const tutorialWithPrereqs = new Tutorial({
      id: 'with-prereqs',
      name: 'With Prerequisites',
      description: 'Tutorial with prerequisites',
      prerequisites: ['quick-start', 'session-management']
    });

    expect(tutorialWithPrereqs.prerequisites).toEqual(['quick-start', 'session-management']);
  });
});

describe('TutorialEngine', () => {
  let engine;
  let tutorial;

  beforeEach(() => {
    engine = new TutorialEngine({
      autoSave: false,
      showProgress: true,
      allowSkip: true,
      enableHints: true
    });

    tutorial = new Tutorial({
      id: 'test-tutorial',
      name: 'Test Tutorial',
      description: 'A test tutorial',
      steps: [
        {
          id: 'step-1',
          type: StepType.INTRO,
          title: 'Step 1',
          description: 'First step'
        },
        {
          id: 'step-2',
          type: StepType.COMMAND,
          title: 'Step 2',
          description: 'Second step',
          validation: (input) => {
            if (input === 'correct') {
              return { success: true };
            }
            return { success: false };
          }
        }
      ]
    });
  });

  it('should create an engine with default options', () => {
    const defaultEngine = new TutorialEngine();
    expect(defaultEngine.options.autoSave).toBe(true);
    expect(defaultEngine.options.showProgress).toBe(true);
    expect(defaultEngine.options.allowSkip).toBe(true);
    expect(defaultEngine.options.enableHints).toBe(true);
  });

  it('should register a tutorial', () => {
    engine.registerTutorial(tutorial);
    expect(engine.tutorials.has('test-tutorial')).toBe(true);
  });

  it('should get a registered tutorial', () => {
    engine.registerTutorial(tutorial);
    const retrieved = engine.getTutorial('test-tutorial');
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe('test-tutorial');
  });

  it('should return undefined for non-existent tutorial', () => {
    const retrieved = engine.getTutorial('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should list all tutorials', () => {
    engine.registerTutorial(tutorial);

    const list = engine.listTutorials();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('test-tutorial');
    expect(list[0].name).toBe('Test Tutorial');
    expect(list[0].steps).toBe(2);
  });

  it('should start a tutorial', () => {
    engine.registerTutorial(tutorial);
    const started = engine.startTutorial('test-tutorial');

    expect(engine.activeTutorial).toBe(tutorial);
    expect(started).toBe(tutorial);
    expect(tutorial.steps.every(s => s.status === StepStatus.NOT_STARTED)).toBe(true);
  });

  it('should throw error when starting non-existent tutorial', () => {
    expect(() => engine.startTutorial('non-existent')).toThrow('教程不存在');
  });

  it('should start the first step', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');

    const step = engine.startStep();
    expect(step).toBeDefined();
    expect(step.id).toBe('step-1');
    expect(step.status).toBe(StepStatus.IN_PROGRESS);
  });

  it('should return null if no step to start', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    tutorial.steps.forEach(s => s.complete());

    const step = engine.startStep();
    expect(step).toBeNull();
  });

  it('should throw error when starting step without active tutorial', () => {
    expect(() => engine.startStep()).toThrow('没有活动的教程');
  });

  it('should move to next step', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    const firstStep = engine.startStep();

    const nextStep = engine.nextStep();
    expect(nextStep).toBeDefined();
    expect(nextStep.id).toBe('step-2');
    expect(firstStep.status).toBe(StepStatus.IN_PROGRESS);
  });

  it('should return null when no more steps', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();
    tutorial.steps[1].complete();

    const nextStep = engine.nextStep();
    expect(nextStep).toBeNull();
  });

  it('should go to previous step', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();
    const currentStep = engine.nextStep();

    const prevStep = engine.prevStep();
    expect(prevStep).toBeDefined();
    expect(prevStep.id).toBe('step-1');
    expect(currentStep.status).toBe(StepStatus.IN_PROGRESS);
  });

  it('should return null for prevStep on first step', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();

    const prevStep = engine.prevStep();
    expect(prevStep).toBeNull();
  });

  it('should complete current step', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();

    const completed = engine.completeStep();
    expect(completed.status).toBe(StepStatus.COMPLETED);
  });

  it('should throw error when completing step without active step', () => {
    expect(() => engine.completeStep()).toThrow('没有活动的步骤');
  });

  it('should skip current step when allowed', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();

    const skipped = engine.skipStep();
    expect(skipped.status).toBe(StepStatus.SKIPPED);
  });

  it('should throw error when skipping not allowed', () => {
    const strictEngine = new TutorialEngine({ allowSkip: false });
    strictEngine.registerTutorial(tutorial);
    strictEngine.startTutorial('test-tutorial');
    strictEngine.startStep();

    expect(() => strictEngine.skipStep()).toThrow('不允许跳过步骤');
  });

  it('should handle correct input', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();
    engine.nextStep();

    const result = engine.handleInput('correct');
    expect(result.success).toBe(true);
    expect(result.message).toContain('✓');
    expect(tutorial.steps[1].status).toBe(StepStatus.COMPLETED);
  });

  it('should handle incorrect input', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();
    engine.nextStep();

    const result = engine.handleInput('wrong');
    expect(result.success).toBe(false);
    expect(result.message).toContain('✗');
  });

  it('should return error when handling input without active step', () => {
    const result = engine.handleInput('test');
    expect(result.success).toBe(false);
    expect(result.message).toBe('没有活动的步骤');
  });

  it('should get hint when enabled', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();

    const hint = engine.getHint();
    expect(hint).toBeDefined();
    expect(hint.level).toBe(1);
  });

  it('should return null when hints disabled', () => {
    const noHintEngine = new TutorialEngine({ enableHints: false });
    noHintEngine.registerTutorial(tutorial);
    noHintEngine.startTutorial('test-tutorial');
    noHintEngine.startStep();

    const hint = noHintEngine.getHint();
    expect(hint).toBeNull();
  });

  it('should get tutorial progress', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();

    const progress = engine.getProgress('test-tutorial');
    expect(progress).toBeDefined();
    expect(progress.total).toBe(2);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('should return null progress for non-existent tutorial', () => {
    const progress = engine.getProgress('non-existent');
    expect(progress).toBeNull();
  });

  it('should check if tutorial is completed', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    tutorial.steps.forEach(s => s.complete());

    expect(engine.isCompleted('test-tutorial')).toBe(true);
  });

  it('should not consider incomplete tutorial as completed', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');

    expect(engine.isCompleted('test-tutorial')).toBe(false);
  });

  it('should complete tutorial when all steps done', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    tutorial.steps.forEach(s => s.complete());

    const completed = engine.completeTutorial();
    expect(completed).toBe(true);
  });

  it('should not complete tutorial with incomplete steps', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');

    const completed = engine.completeTutorial();
    expect(completed).toBe(false);
  });

  it('should exit tutorial and return id', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');

    const id = engine.exitTutorial();
    expect(id).toBe('test-tutorial');
    expect(engine.activeTutorial).toBeNull();
    expect(engine.activeStep).toBeNull();
  });

  it('should resume tutorial with progress', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();
    engine.completeStep();
    engine.exitTutorial();

    const resumed = engine.resumeTutorial('test-tutorial');
    expect(resumed).toBe(tutorial);
    expect(engine.activeTutorial).toBe(tutorial);
  });

  it('should reset tutorial', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();
    engine.completeStep();

    const reset = engine.resetTutorial('test-tutorial');
    expect(reset.steps.every(s => s.status === StepStatus.NOT_STARTED)).toBe(true);
    expect(engine.userProgress.has('test-tutorial')).toBe(false);
  });

  it('should format tutorial info', () => {
    engine.registerTutorial(tutorial);
    engine.startTutorial('test-tutorial');
    engine.startStep();

    const info = engine.formatTutorialInfo('test-tutorial');
    expect(info).toBeDefined();
    expect(info.id).toBe('test-tutorial');
    expect(info.name).toBe('Test Tutorial');
    expect(info.isActive).toBe(true);
    expect(info.progress).toBeDefined();
  });
});

describe('Built-in Tutorials', () => {
  let engine;

  beforeEach(() => {
    engine = createTutorialEngine();
  });

  it('should create quick start tutorial', () => {
    const tutorial = createQuickStartTutorial();

    expect(tutorial.id).toBe('quick-start');
    expect(tutorial.name).toBe('快速入门');
    expect(tutorial.difficulty).toBe('beginner');
    expect(tutorial.category).toBe('getting-started');
    expect(tutorial.steps.length).toBeGreaterThan(0);
  });

  it('should create session tutorial', () => {
    const tutorial = createSessionTutorial();

    expect(tutorial.id).toBe('session-management');
    expect(tutorial.name).toBe('会话管理');
    expect(tutorial.difficulty).toBe('beginner');
    expect(tutorial.steps.length).toBeGreaterThan(0);
  });

  it('should have quick-start as prerequisite for session tutorial', () => {
    const tutorial = createSessionTutorial();
    expect(tutorial.prerequisites).toContain('quick-start');
  });

  it('should create branch tutorial', () => {
    const tutorial = createBranchTutorial();

    expect(tutorial.id).toBe('branch-management');
    expect(tutorial.name).toBe('对话分支');
    expect(tutorial.difficulty).toBe('intermediate');
    expect(tutorial.prerequisites).toContain('session-management');
  });

  it('should create RAG tutorial', () => {
    const tutorial = createRAGTutorial();

    expect(tutorial.id).toBe('rag-features');
    expect(tutorial.name).toBe('RAG 知识库');
    expect(tutorial.difficulty).toBe('intermediate');
    expect(tutorial.category).toBe('advanced');
  });

  it('should create config tutorial', () => {
    const tutorial = createConfigTutorial();

    expect(tutorial.id).toBe('config-and-customization');
    expect(tutorial.name).toBe('配置和自定义');
    expect(tutorial.difficulty).toBe('beginner');
    expect(tutorial.category).toBe('configuration');
  });

  it('should register all built-in tutorials', () => {
    const tutorials = engine.listTutorials();

    expect(tutorials.length).toBeGreaterThan(0);
    expect(tutorials.some(t => t.id === 'quick-start')).toBe(true);
    expect(tutorials.some(t => t.id === 'session-management')).toBe(true);
  });
});

describe('Tutorial Integration', () => {
  it('should complete a full tutorial flow', () => {
    const engine = createTutorialEngine();
    const tutorial = createQuickStartTutorial();

    // Start tutorial
    engine.startTutorial('quick-start');

    // Complete first step
    let step = engine.startStep();
    expect(step).toBeDefined();
    engine.completeStep();

    // Move through all steps
    while (step = engine.nextStep()) {
      expect(step.status).toBe(StepStatus.IN_PROGRESS);
      engine.completeStep();
    }

    // Check completion
    expect(engine.isCompleted('quick-start')).toBe(true);
    expect(engine.completeTutorial()).toBe(true);
  });

  it('should handle skip steps', () => {
    const engine = createTutorialEngine();
    engine.startTutorial('quick-start');

    engine.startStep();
    engine.skipStep();

    const progress = engine.getProgress('quick-start');
    expect(progress.skipped).toBe(1);
  });

  it('should handle hints with level tracking', () => {
    const engine = createTutorialEngine();
    engine.startTutorial('quick-start');

    const step = engine.startStep();

    // Get hints progressively
    const hint1 = engine.getHint();
    const hint2 = engine.getHint();
    const hint3 = engine.getHint();

    expect(hint1.level).toBe(1);
    expect(hint2.level).toBe(2);
    expect(hint3.level).toBe(3);
  });
});

describe('Tutorial Validation', () => {
  it('should validate command input with regex', () => {
    const step = new TutorialStep({
      id: 'command-step',
      type: StepType.COMMAND,
      title: 'Command Step',
      description: 'Validate commands',
      validation: (input) => {
        if (/^\/help$/i.test(input)) {
          return { success: true, message: 'Correct command!' };
        }
        return { success: false, message: 'Please use /help' };
      }
    });

    const result1 = step.validate('/help');
    expect(result1.success).toBe(true);

    const result2 = step.validate('/help extra');
    expect(result2.success).toBe(false);
  });

  it('should validate multiple choice answers', () => {
    const step = new TutorialStep({
      id: 'quiz-step',
      type: StepType.QUIZ,
      title: 'Quiz Step',
      description: 'Multiple choice',
      validation: (input) => {
        const validAnswers = ['a', 'A', '1', '选项A'];
        if (validAnswers.includes(input.trim())) {
          return { success: true, message: 'Correct!' };
        }
        return { success: false, message: 'Please choose option A' };
      }
    });

    expect(step.validate('A').success).toBe(true);
    expect(step.validate('a').success).toBe(true);
    expect(step.validate('1').success).toBe(true);
    expect(step.validate('选项A').success).toBe(true);
    expect(step.validate('B').success).toBe(false);
  });

  it('should validate empty input', () => {
    const step = new TutorialStep({
      id: 'input-step',
      type: StepType.INTERACTIVE,
      title: 'Input Step',
      description: 'Require input',
      validation: (input) => {
        if (input.trim().length === 0) {
          return { success: false, message: 'Please enter something' };
        }
        return { success: true };
      }
    });

    expect(step.validate('').success).toBe(false);
    expect(step.validate('   ').success).toBe(false);
    expect(step.validate('hello').success).toBe(true);
  });
});

describe('Tutorial Progress', () => {
  it('should track completed steps correctly', () => {
    const engine = createTutorialEngine();
    engine.startTutorial('quick-start');

    engine.startStep();
    engine.completeStep();

    const progress = engine.getProgress('quick-start');
    expect(progress.completed).toBe(1);
    expect(progress.remaining).toBeGreaterThan(0);
  });

  it('should calculate percentage correctly', () => {
    const engine = createTutorialEngine();
    engine.startTutorial('quick-start');

    engine.startStep();
    engine.completeStep();

    const progress = engine.getProgress('quick-start');
    expect(progress.percentage).toBeGreaterThan(0);
    expect(progress.percentage).toBeLessThan(100);
  });

  it('should handle completion threshold', () => {
    const engine = new TutorialEngine({ completionThreshold: 0.8 });
    const tutorial = new Tutorial({
      id: 'threshold-test',
      name: 'Threshold Test',
      description: 'Test threshold',
      steps: [
        { id: 's1', type: StepType.INTRO, title: 'S1', description: '1' },
        { id: 's2', type: StepType.INTRO, title: 'S2', description: '2' },
        { id: 's3', type: StepType.INTRO, title: 'S3', description: '3' },
        { id: 's4', type: StepType.INTRO, title: 'S4', description: '4' },
        { id: 's5', type: StepType.INTRO, title: 'S5', description: '5' }
      ]
    });

    engine.registerTutorial(tutorial);
    engine.startTutorial('threshold-test');

    // Complete 4 out of 5 steps (80%)
    for (let i = 0; i < 4; i++) {
      engine.startStep();
      engine.completeStep();
    }

    expect(engine.isCompleted('threshold-test')).toBe(true);
  });
});

describe('Tutorial Metadata', () => {
  it('should store and retrieve step metadata', () => {
    const step = new TutorialStep({
      id: 'metadata-step',
      type: StepType.COMMAND,
      title: 'Metadata Step',
      description: 'Test metadata',
      metadata: {
        customField: 'value',
        attempts: 0
      }
    });

    expect(step.metadata.customField).toBe('value');
    expect(step.metadata.attempts).toBe(0);

    step.metadata.attempts = 1;
    expect(step.metadata.attempts).toBe(1);
  });

  it('should reset metadata on step reset', () => {
    const step = new TutorialStep({
      id: 'reset-step',
      type: StepType.COMMAND,
      title: 'Reset Step',
      description: 'Test reset',
      metadata: {
        attempts: 5,
        hintLevel: 3
      }
    });

    step.metadata.attempts = 10;
    step.metadata.hintLevel = 5;
    step.reset();

    expect(step.metadata).toEqual({});
  });
});
