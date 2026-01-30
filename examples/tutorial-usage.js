/**
 * 交互式教程系统使用示例
 *
 * 本文件展示如何使用 xzChat 的交互式教程系统
 */

import {
  Tutorial,
  TutorialStep,
  TutorialEngine,
  StepType,
  StepStatus,
  createQuickStartTutorial,
  createSessionTutorial,
  createBranchTutorial,
  createRAGTutorial,
  createConfigTutorial,
  createTutorialEngine,
  initializeTutorials,
  startQuickStartTutorial,
  formatTutorialOutput
} from '../lib/utils/tutorial.js';

// ============================================
// 示例 1: 基础教程引擎使用
// ============================================
function example1_basicEngine() {
  console.log('\n=== 示例 1: 基础教程引擎使用 ===\n');

  // 创建教程引擎
  const engine = createTutorialEngine();

  // 列出所有可用教程
  console.log('可用教程:');
  const tutorials = engine.listTutorials();
  tutorials.forEach(t => {
    console.log(`  - ${t.name} (${t.difficulty})`);
    console.log(`    ${t.description}`);
    console.log(`    ${t.steps} 个步骤`);
    console.log();
  });
}

// ============================================
// 示例 2: 开始和完成教程
// ============================================
async function example2_completeTutorial() {
  console.log('\n=== 示例 2: 开始和完成教程 ===\n');

  const engine = createTutorialEngine();

  // 开始快速入门教程
  engine.startTutorial('quick-start');
  console.log('教程已启动!\n');

  // 执行所有步骤
  let step = engine.startStep();
  while (step) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`步骤: ${step.title}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(step.content);

    // 模拟用户输入 (在实际应用中,这会来自 readline)
    if (step.type === StepType.COMMAND) {
      console.log('\n[模拟用户输入: 正确答案]');
      const result = engine.handleInput('test');
      console.log(result.message);
    } else {
      console.log('\n[用户按 Enter 继续]');
      engine.completeStep();
    }

    // 显示进度
    const progress = engine.getProgress('quick-start');
    console.log(`\n进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`);

    step = engine.nextStep();
  }

  // 完成教程
  engine.completeTutorial();
  console.log('\n🎉 教程已完成!');
}

// ============================================
// 示例 3: 创建自定义教程
// ============================================
function example3_customTutorial() {
  console.log('\n=== 示例 3: 创建自定义教程 ===\n');

  // 创建自定义教程
  const customTutorial = new Tutorial({
    id: 'my-custom-tutorial',
    name: '自定义教程',
    description: '这是一个自定义教程示例',
    difficulty: 'beginner',
    duration: '10-15 分钟',
    category: 'features',
    prerequisites: ['quick-start'],
    steps: [
      {
        type: StepType.INTRO,
        title: '欢迎',
        description: '欢迎来到自定义教程',
        content: '这是一个自定义教程的开始。\n\n按 Enter 继续...'
      },
      {
        type: StepType.COMMAND,
        title: '执行命令',
        description: '学习执行命令',
        content: '执行以下命令:\n\n/help\n\n输入命令:',
        validation: (input) => {
          if (/^\/help$/i.test(input)) {
            return { success: true, message: '✓ 正确! 帮助命令已执行' };
          }
          return { success: false, message: '✗ 请输入 /help' };
        },
        hints: [
          '输入 /help 命令',
          '确保没有多余的空格',
          '按 Enter 执行命令'
        ]
      },
      {
        type: StepType.QUIZ,
        title: '知识测验',
        description: '测试你的知识',
        content: '哪个命令用于列出所有会话?\n\nA. /list\nB. /session list\nC. /show sessions\n\n输入你的答案:',
        validation: (input) => {
          const answer = input.trim().toUpperCase();
          if (answer === 'B' || answer === '/SESSION LIST') {
            return { success: true, message: '✓ 正确!' };
          }
          return { success: false, message: '✗ 不正确,请再试试' };
        },
        hints: [
          '回顾会话管理教程',
          '答案以 / 开头',
          '包含 session 和 list'
        ]
      },
      {
        type: StepType.PRACTICE,
        title: '实践练习',
        description: '实践所学内容',
        content: '创建一个新会话:\n\n/session new test\n\n输入命令:',
        validation: (input) => {
          if (/^\/session\s+new/i.test(input)) {
            return { success: true, message: '✓ 会话已创建!' };
          }
          return { success: false, message: '✗ 请使用 /session new 命令' };
        }
      }
    ]
  });

  // 注册到引擎
  const engine = createTutorialEngine();
  engine.registerTutorial(customTutorial);

  // 显示教程信息
  console.log(`教程名称: ${customTutorial.name}`);
  console.log(`教程描述: ${customTutorial.description}`);
  console.log(`难度: ${customTutorial.difficulty}`);
  console.log(`步骤数: ${customTutorial.steps.length}`);
  console.log(`先决条件: ${customTutorial.prerequisites.join(', ')}`);

  // 开始教程
  engine.startTutorial('my-custom-tutorial');
  console.log('\n自定义教程已启动!');

  return engine;
}

// ============================================
// 示例 4: 使用提示系统
// ============================================
function example4_hints() {
  console.log('\n=== 示例 4: 使用提示系统 ===\n');

  const engine = createTutorialEngine();
  engine.startTutorial('quick-start');

  // 启动步骤
  const step = engine.startStep();
  console.log(`当前步骤: ${step.title}`);
  console.log(`可用的提示数: ${step.getHintCount()}`);

  // 获取第一个提示
  const hint1 = engine.getHint();
  console.log(`\n提示 1 (级别 ${hint1.level}/${hint1.total}):`);
  console.log(`  ${hint1.hint}`);

  // 获取第二个提示
  const hint2 = engine.getHint();
  console.log(`\n提示 2 (级别 ${hint2.level}/${hint2.total}):`);
  console.log(`  ${hint2.hint}`);

  // 获取第三个提示
  const hint3 = engine.getHint();
  if (hint3) {
    console.log(`\n提示 3 (级别 ${hint3.level}/${hint3.total}):`);
    console.log(`  ${hint3.hint}`);
  } else {
    console.log('\n没有更多提示了');
  }
}

// ============================================
// 示例 5: 教程进度管理
// ============================================
function example5_progress() {
  console.log('\n=== 示例 5: 教程进度管理 ===\n');

  const engine = createTutorialEngine();

  // 开始教程
  engine.startTutorial('quick-start');

  // 完成一些步骤
  engine.startStep();
  engine.completeStep();
  engine.nextStep();
  engine.completeStep();

  // 查看进度
  const progress = engine.getProgress('quick-start');
  console.log(`总步骤数: ${progress.total}`);
  console.log(`已完成: ${progress.completed}`);
  console.log(`已跳过: ${progress.skipped}`);
  console.log(`剩余: ${progress.remaining}`);
  console.log(`完成百分比: ${progress.percentage}%`);
  console.log(`当前步骤: ${progress.currentStep}`);

  // 检查是否完成
  console.log(`\n教程完成状态: ${engine.isCompleted('quick-start') ? '✓ 已完成' : '✗ 未完成'}`);
}

// ============================================
// 示例 6: 保存和恢复进度
// ============================================
function example6_saveAndResume() {
  console.log('\n=== 示例 6: 保存和恢复进度 ===\n');

  const engine = createTutorialEngine();

  // 开始教程并完成一些步骤
  engine.startTutorial('quick-start');
  engine.startStep();
  engine.completeStep();
  engine.nextStep();

  console.log('教程已进行了一半...');

  // 退出教程 (会自动保存进度)
  const tutorialId = engine.exitTutorial();
  console.log(`已退出教程: ${tutorialId}`);

  // 恢复教程
  console.log('\n恢复教程...');
  engine.resumeTutorial('quick-start');

  const info = engine.formatTutorialInfo('quick-start');
  console.log(`教程状态: ${info.progress.completed}/${info.progress.total} 完成`);

  // 继续完成剩余步骤
  let step = engine.activeStep;
  while (step) {
    console.log(`\n继续步骤: ${step.title}`);
    engine.completeStep();
    step = engine.nextStep();
  }

  console.log('\n✓ 教程已从上次位置继续并完成!');
}

// ============================================
// 示例 7: 跳过步骤
// ============================================
function example7_skipSteps() {
  console.log('\n=== 示例 7: 跳过步骤 ===\n');

  const engine = createTutorialEngine({
    allowSkip: true  // 允许跳过
  });

  engine.startTutorial('quick-start');

  // 启动第一个步骤
  engine.startStep();
  console.log('步骤 1: 介绍');
  console.log('已完成介绍步骤');

  // 启动第二个步骤
  engine.nextStep();
  console.log('\n步骤 2: 命令练习');
  console.log('跳过此步骤...');

  // 跳过当前步骤
  engine.skipStep();

  // 查看进度
  const progress = engine.getProgress('quick-start');
  console.log(`\n已跳过: ${progress.skipped} 个步骤`);

  // 继续下一步
  const step = engine.nextStep();
  if (step) {
    console.log(`\n继续到步骤: ${step.title}`);
  }
}

// ============================================
// 示例 8: 教程验证
// ============================================
function example8_validation() {
  console.log('\n=== 示例 8: 教程验证 ===\n');

  // 创建带有自定义验证的步骤
  const step = new TutorialStep({
    id: 'validation-step',
    type: StepType.COMMAND,
    title: '命令验证',
    description: '验证用户输入的命令',
    content: '输入命令: /session list',
    validation: (input) => {
      // 验证命令格式
      if (!input.startsWith('/')) {
        return {
          success: false,
          message: '命令必须以 / 开头',
          hints: ['所有命令都以 / 开头']
        };
      }

      // 验证具体命令
      if (!/^\/session\s+list$/i.test(input)) {
        return {
          success: false,
          message: '请使用 /session list 命令'
        };
      }

      return {
        success: true,
        message: '✓ 正确! 命令已执行'
      };
    }
  });

  // 测试不同的输入
  const inputs = [
    'session list',
    '/session',
    '/session list extra',
    '/session list',
    '/SESSION LIST'
  ];

  console.log('测试输入验证:\n');
  inputs.forEach(input => {
    console.log(`输入: "${input}"`);
    const result = step.validate(input);
    console.log(`结果: ${result.message}`);
    console.log(`成功: ${result.success ? '✓' : '✗'}`);
    console.log();
  });
}

// ============================================
// 示例 9: 格式化教程输出
// ============================================
function example9_formatting() {
  console.log('\n=== 示例 9: 格式化教程输出 ===\n');

  const engine = createTutorialEngine();
  engine.startTutorial('quick-start');

  const tutorial = engine.getTutorial('quick-start');
  const step = engine.startStep();

  // 使用格式化函数
  const formatted = formatTutorialOutput(tutorial, step, true);
  console.log(formatted);
}

// ============================================
// 示例 10: 多教程管理
// ============================================
function example10_multipleTutorials() {
  console.log('\n=== 示例 10: 多教程管理 ===\n');

  const engine = createTutorialEngine();

  // 按难度分组
  const tutorials = engine.listTutorials();
  const beginner = tutorials.filter(t => t.difficulty === 'beginner');
  const intermediate = tutorials.filter(t => t.difficulty === 'intermediate');
  const advanced = tutorials.filter(t => t.difficulty === 'advanced');

  console.log('初级教程:');
  beginner.forEach(t => {
    console.log(`  - ${t.name}: ${t.steps} 步骤`);
  });

  console.log('\n中级教程:');
  intermediate.forEach(t => {
    console.log(`  - ${t.name}: ${t.steps} 步骤`);
  });

  console.log('\n高级教程:');
  advanced.forEach(t => {
    console.log(`  - ${t.name}: ${t.steps} 步骤`);
  });

  // 按类别分组
  console.log('\n按类别:');
  const categories = {};
  tutorials.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = [];
    }
    categories[t.category].push(t);
  });

  Object.entries(categories).forEach(([category, items]) => {
    console.log(`\n${category}:`);
    items.forEach(t => {
      console.log(`  - ${t.name}`);
    });
  });
}

// ============================================
// 示例 11: 教程统计
// ============================================
function example11_statistics() {
  console.log('\n=== 示例 11: 教程统计 ===\n');

  const engine = createTutorialEngine();

  // 获取所有教程
  const tutorials = engine.listTutorials();

  let totalSteps = 0;
  let averageDuration = 0;

  tutorials.forEach(t => {
    totalSteps += t.steps;
    // 提取持续时间 (假设格式为 "X-Y 分钟")
    const match = t.duration.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      averageDuration += (min + max) / 2;
    }
  });

  averageDuration = averageDuration / tutorials.length;

  console.log('教程统计:');
  console.log(`  总教程数: ${tutorials.length}`);
  console.log(`  总步骤数: ${totalSteps}`);
  console.log(`  平均步骤数: ${Math.round(totalSteps / tutorials.length)}`);
  console.log(`  平均时长: ${Math.round(averageDuration)} 分钟`);

  // 按难度统计
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  console.log('\n按难度分布:');
  difficulties.forEach(diff => {
    const count = tutorials.filter(t => t.difficulty === diff).length;
    console.log(`  ${diff}: ${count} 个`);
  });

  // 按类别统计
  const categories = {};
  tutorials.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = 0;
    }
    categories[t.category]++;
  });

  console.log('\n按类别分布:');
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} 个`);
  });
}

// ============================================
// 示例 12: 集成到应用程序
// ============================================
class TutorialIntegration {
  constructor() {
    this.engine = createTutorialEngine();
    this.currentTutorial = null;
  }

  /**
   * 检查是否是新用户
   */
  isNewUser() {
    // 检查用户是否完成过任何教程
    const tutorials = this.engine.listTutorials();
    return tutorials.every(t => {
      const progress = this.engine.getProgress(t.id);
      return !progress || progress.completed === 0;
    });
  }

  /**
   * 欢迎新用户
   */
  welcomeNewUser() {
    if (this.isNewUser()) {
      console.log('\n🎉 欢迎使用 xzChat!');
      console.log('检测到你是新用户,是否要开始快速入门教程?');
      console.log('输入 /tutorial quick-start 开始学习\n');
    }
  }

  /**
   * 处理教程命令
   */
  handleTutorialCommand(command) {
    const parts = command.split(' ');
    const action = parts[1];

    switch (action) {
      case 'list':
        this.listTutorials();
        break;
      case 'start':
        this.startTutorial(parts[2]);
        break;
      case 'resume':
        this.resumeTutorial(parts[2]);
        break;
      case 'progress':
        this.showProgress(parts[2]);
        break;
      default:
        console.log('教程命令:');
        console.log('  /tutorial list - 列出所有教程');
        console.log('  /tutorial start <id> - 开始教程');
        console.log('  /tutorial resume <id> - 恢复教程');
        console.log('  /tutorial progress <id> - 查看进度');
    }
  }

  /**
   * 列出教程
   */
  listTutorials() {
    console.log('\n可用教程:\n');
    const tutorials = this.engine.listTutorials();
    tutorials.forEach(t => {
      const progress = this.engine.getProgress(t.id);
      const status = progress && progress.completed > 0
        ? `[${progress.completed}/${progress.total}]`
        : '[未开始]';

      console.log(`  ${status} ${t.name} (${t.difficulty})`);
      console.log(`    ${t.description}`);
      console.log(`    ID: ${t.id}\n`);
    });
  }

  /**
   * 开始教程
   */
  startTutorial(tutorialId) {
    if (!tutorialId) {
      console.log('请指定教程 ID');
      console.log('使用 /tutorial list 查看所有教程');
      return;
    }

    try {
      this.engine.startTutorial(tutorialId);
      this.currentTutorial = tutorialId;
      this.showCurrentStep();
    } catch (error) {
      console.log(`错误: ${error.message}`);
    }
  }

  /**
   * 恢复教程
   */
  resumeTutorial(tutorialId) {
    try {
      this.engine.resumeTutorial(tutorialId);
      this.currentTutorial = tutorialId;
      this.showCurrentStep();
      console.log('教程已从上次位置继续!\n');
    } catch (error) {
      console.log(`错误: ${error.message}`);
    }
  }

  /**
   * 显示进度
   */
  showProgress(tutorialId) {
    if (!tutorialId) {
      const info = this.engine.formatTutorialInfo(this.currentTutorial);
      if (info) {
        this.printProgress(info);
      }
      return;
    }

    const info = this.engine.formatTutorialInfo(tutorialId);
    if (info) {
      this.printProgress(info);
    } else {
      console.log('教程不存在');
    }
  }

  /**
   * 打印进度
   */
  printProgress(info) {
    const p = info.progress;
    const bar = '■'.repeat(p.completed) + '□'.repeat(p.remaining);

    console.log(`\n${info.name}`);
    console.log(`${'─'.repeat(40)}`);
    console.log(`进度: ${bar} ${p.percentage}%`);
    console.log(`已完成: ${p.completed}/${p.total}`);
    console.log(`已跳过: ${p.skipped}\n`);
  }

  /**
   * 显示当前步骤
   */
  showCurrentStep() {
    const step = this.engine.startStep() || this.engine.activeStep;

    if (step) {
      const tutorial = this.engine.getTutorial(this.currentTutorial);
      console.log(formatTutorialOutput(tutorial, step, true));
    }
  }

  /**
   * 处理用户输入
   */
  handleInput(input) {
    if (!this.currentTutorial) {
      return false;
    }

    const result = this.engine.handleInput(input);
    console.log(result.message);

    if (result.success && result.nextStep) {
      setTimeout(() => {
        console.log('\n继续下一步...\n');
        this.showCurrentStep();
      }, 1000);
    } else if (result.success) {
      console.log('\n🎉 教程已完成!');
      this.currentTutorial = null;
    }

    return true;
  }

  /**
   * 获取提示
   */
  getHint() {
    if (!this.currentTutorial) {
      console.log('没有活动的教程');
      return;
    }

    const hint = this.engine.getHint();
    if (hint) {
      console.log(`\n💡 提示 (${hint.level}/${hint.total}):`);
      console.log(`  ${hint.hint}\n`);
    } else {
      console.log('\n没有更多提示了\n');
    }
  }
}

// 使用示例
function example12_integration() {
  console.log('\n=== 示例 12: 应用程序集成 ===\n');

  const app = new TutorialIntegration();

  // 检查新用户
  app.welcomeNewUser();

  // 列出教程
  console.log('\n列出所有教程:');
  app.handleTutorialCommand('/tutorial list');

  // 开始教程
  console.log('\n开始快速入门教程:');
  app.handleTutorialCommand('/tutorial start quick-start');
}

// ============================================
// 运行所有示例
// ============================================
async function runAllExamples() {
  try {
    example1_basicEngine();
    await example2_completeTutorial();
    example3_customTutorial();
    example4_hints();
    example5_progress();
    example6_saveAndResume();
    example7_skipSteps();
    example8_validation();
    example9_formatting();
    example10_multipleTutorials();
    example11_statistics();
    example12_integration();

    console.log('\n✓ 所有示例执行完成!\n');
  } catch (error) {
    console.error('示例执行错误:', error);
  }
}

// 导出示例函数
export {
  example1_basicEngine,
  example2_completeTutorial,
  example3_customTutorial,
  example4_hints,
  example5_progress,
  example6_saveAndResume,
  example7_skipSteps,
  example8_validation,
  example9_formatting,
  example10_multipleTutorials,
  example11_statistics,
  example12_integration,
  TutorialIntegration,
  runAllExamples
};

// 如果直接运行此文件,执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
