/**
 * 命令补全系统使用示例
 * 演示如何在项目中集成和使用Tab自动补全
 */

import readline from 'node:readline';
import { createCompleter, completeCommand, formatCompletionSuggestions } from '../lib/utils/completer.js';

// ============================================================================
// 示例 1: 基本命令补全
// ============================================================================

async function example1() {
  console.log('示例 1: 基本命令补全\n');

  const inputs = [
    '/s',        // 补全为 /session
    '/h',        // 补全为 /help
    '/l',        // 补全为 /load
    '/b',        // 补全为 /branch
    '/g'         // 补全为 /git
  ];

  for (const input of inputs) {
    const matches = await completeCommand(input);
    console.log(`输入: "${input}"`);
    console.log(`匹配: ${matches.join(', ')}`);
    console.log();
  }
}

// ============================================================================
// 示例 2: 子命令补全
// ============================================================================

async function example2() {
  console.log('示例 2: 子命令补全\n');

  const inputs = [
    '/session u',        // 补全为 use
    '/session l',        // 补全为 list
    '/branch cr',        // 补全为 create
    '/config va',        // 补全为 validate
    '/role se'           // 补全为 set
  ];

  for (const input of inputs) {
    const matches = await completeCommand(input);
    console.log(`输入: "${input}"`);
    console.log(`匹配: ${matches.join(', ')}`);
    console.log();
  }
}

// ============================================================================
// 示例 3: 选项补全
// ============================================================================

async function example3() {
  console.log('示例 3: 选项补全\n');

  const inputs = [
    '/load --',
    '/index --',
    '/rag --',
    '/search --',
    '/stats --'
  ];

  for (const input of inputs) {
    const matches = await completeCommand(input);
    console.log(`输入: "${input}"`);
    console.log(`匹配: ${matches.join(', ')}`);
    console.log();
  }
}

// ============================================================================
// 示例 4: 使用 readline 集成补全
// ============================================================================

function example4() {
  console.log('示例 4: 在 readline 中集成补全\n');
  console.log('启动交互式REPL（输入 /exit 退出）...\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: createCompleter()
  });

  rl.question('xzchat> ', async (answer) => {
    console.log(`你输入了: ${answer}`);

    // 处理命令
    if (answer === '/exit' || answer === '/quit' || answer === '/q') {
      console.log('退出...');
      rl.close();
      return;
    }

    // 显示补全建议
    if (answer.startsWith('/')) {
      const matches = await completeCommand(answer);
      if (matches.length > 0) {
        console.log(`建议: ${matches.slice(0, 3).join(', ')}`);
      }
    }

    rl.close();
  });
}

// ============================================================================
// 示例 5: 格式化补全建议
// ============================================================================

async function example5() {
  console.log('示例 5: 格式化补全建议\n');

  // 命令补全
  let matches = await completeCommand('/s');
  console.log('命令补全建议:');
  console.log(formatCompletionSuggestions(matches));
  console.log();

  // 子命令补全
  matches = await completeCommand('/session ');
  console.log('子命令补全建议:');
  console.log(formatCompletionSuggestions(matches));
  console.log();

  // 选项补全
  matches = await completeCommand('/load --');
  console.log('选项补全建议:');
  console.log(formatCompletionSuggestions(matches));
  console.log();
}

// ============================================================================
// 示例 6: 智能补全场景
// ============================================================================

async function example6() {
  console.log('示例 6: 智能补全场景\n');

  const scenarios = [
    {
      description: '用户想加载文件',
      input: '/load',
      expectation: '应该显示文件路径提示'
    },
    {
      description: '用户想切换会话',
      input: '/session use',
      expectation: '应该显示可用会话'
    },
    {
      description: '用户想切换分支',
      input: '/branch switch',
      expectation: '应该显示可用分支'
    },
    {
      description: '用户想使用特定role',
      input: '/role use',
      expectation: '应该显示可用role'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`场景: ${scenario.description}`);
    console.log(`输入: ${scenario.input}`);
    console.log(`期望: ${scenario.expectation}`);

    const matches = await completeCommand(scenario.input);
    console.log(`匹配: ${matches.join(', ')}`);
    console.log();
  }
}

// ============================================================================
// 示例 7: 自定义补全逻辑
// ============================================================================

async function example7() {
  console.log('示例 7: 自定义补全逻辑\n');

  // 自定义补全器：只显示常用命令
  const commonCommands = ['/help', '/session', '/load', '/exit'];

  async function customCompleter(line) {
    if (!line.startsWith('/')) return [];

    const matches = commonCommands.filter(cmd =>
      cmd.startsWith(line) && cmd !== line
    );

    return matches;
  }

  const inputs = ['/h', '/s', '/x'];
  for (const input of inputs) {
    const matches = await customCompleter(input);
    console.log(`自定义补全 "${input}": ${matches.join(', ')}`);
  }
  console.log();
}

// ============================================================================
// 示例 8: 处理补全错误
// ============================================================================

async function example8() {
  console.log('示例 8: 处理补全错误\n');

  const edgeCases = [
    '',
    '   ',
    'not-a-command',
    '/invalid-command',
    '/command invalid-subcommand',
    '/command --invalid-option'
  ];

  for (const input of edgeCases) {
    try {
      const matches = await completeCommand(input);
      console.log(`输入: "${input}"`);
      console.log(`结果: ${matches.length > 0 ? matches.join(', ') : '(无匹配)'}`);
    } catch (error) {
      console.log(`输入: "${input}"`);
      console.log(`错误: ${error.message}`);
    }
    console.log();
  }
}

// ============================================================================
// 示例 9: 性能测试
// ============================================================================

async function example9() {
  console.log('示例 9: 补全性能测试\n');

  const iterations = 1000;
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    await completeCommand('/s');
    await completeCommand('/session u');
    await completeCommand('/load --');
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`执行 ${iterations} 次补全操作`);
  console.log(`总耗时: ${duration}ms`);
  console.log(`平均耗时: ${(duration / iterations).toFixed(2)}ms`);
  console.log(`吞吐量: ${(iterations / duration * 1000).toFixed(0)} 次/秒`);
  console.log();
}

// ============================================================================
// 示例 10: 完整的REPL实现
// ============================================================================

function createInteractiveREPL() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: createCompleter(),
    prompt: 'xzchat> '
  });

  console.log('========================================');
  console.log('xzChat 交互式REPL（带Tab补全）');
  console.log('========================================');
  console.log('提示: 按 Tab 键可以补全命令');
  console.log('输入 /help 查看帮助');
  console.log('输入 /exit 退出\n');

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    // 退出命令
    if (trimmed === '/exit' || trimmed === '/quit' || trimmed === '/q') {
      console.log('再见！');
      rl.close();
      return;
    }

    // 帮助命令
    if (trimmed === '/help' || trimmed === '/h') {
      console.log('可用命令:');
      console.log('  /session  - 会话管理');
      console.log('  /branch   - 分支管理');
      console.log('  /load     - 加载文件');
      console.log('  /git      - Git 操作');
      console.log('  /exit     - 退出');
      rl.prompt();
      return;
    }

    // 处理命令
    console.log(`执行命令: ${trimmed}`);

    // 如果是不完整的命令，显示补全建议
    const matches = await completeCommand(trimmed);
    if (matches.length > 0) {
      console.log(`补全建议: ${matches.slice(0, 5).join(', ')}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nREPL 已关闭');
    process.exit(0);
  });

  return rl;
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function runAllExamples() {
  console.log('========================================');
  console.log('命令补全系统使用示例');
  console.log('========================================\n');

  await example1();
  await example2();
  await example3();
  // example4() - 需要交互式输入
  await example5();
  await example6();
  await example7();
  await example8();
  await example9();

  console.log('========================================');
  console.log('示例 1-9 运行完成');
  console.log('运行示例 10 启动交互式REPL');
  console.log('========================================\n');
}

// 导出示例函数
export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
  createInteractiveREPL,
  runAllExamples
};

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.includes('--interactive') || args.includes('-i')) {
    createInteractiveREPL();
  } else {
    runAllExamples();
  }
}
