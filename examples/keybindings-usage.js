/**
 * 快捷键使用示例
 * 演示如何在 CLI 应用中使用快捷键功能
 */

import readline from 'node:readline';
import { createKeyBindingManager, setupRawMode, restoreRawMode } from '../lib/utils/keybindings.js';

// 示例1: 基本使用
async function example1_basic() {
  console.log('\n=== 示例1: 基本快捷键 ===\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'demo> ',
  });

  let abortController = null;

  const manager = createKeyBindingManager({
    rl,
    abortController: () => abortController,
    onClear: () => console.log('🧹 屏幕已清空'),
    onExit: () => {
      console.log('\n👋 再见!');
      rl.close();
      process.exit(0);
    },
    onInterrupt: () => console.log('⚡ 操作已中断'),
  });

  // 显示快捷键帮助
  manager.showKeyBindings();

  rl.prompt();

  rl.on('line', (input) => {
    console.log(`输入: ${input}`);
    rl.prompt();
  });

  process.stdin.on('keypress', (str, key) => {
    manager.handleKey(str, key);
  });
}

// 示例2: 自定义快捷键
async function example2_custom() {
  console.log('\n=== 示例2: 自定义快捷键 ===\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'custom> ',
  });

  const manager = createKeyBindingManager({ rl });

  // 注册自定义快捷键处理
  manager.register('showStats', (key) => {
    console.log('\n📊 统计信息:');
    console.log('- 内存使用:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
    console.log('- 运行时间:', process.uptime(), '秒\n');
    rl.prompt();
  });

  manager.register('toggleDebug', (key) => {
    console.log('\n🔧 调试模式已切换\n');
    rl.prompt();
  });

  manager.register('saveSession', (key) => {
    console.log('\n💾 会话已保存\n');
    rl.prompt();
  });

  // 显示帮助
  console.log('自定义快捷键:');
  console.log('  Ctrl+S: 保存会话');
  console.log('  Ctrl+T: 切换调试');
  console.log('  Ctrl+I: 显示统计');
  console.log('');

  rl.prompt();

  rl.on('line', (input) => {
    console.log(`处理: ${input}`);
    rl.prompt();
  });

  process.stdin.on('keypress', (str, key) => {
    // 处理自定义快捷键
    if (key.ctrl && key.name === 's') {
      manager.handleKey(str, key);
    } else if (key.ctrl && key.name === 't') {
      manager.handleKey(str, key);
    } else if (key.ctrl && key.name === 'i') {
      manager.handleKey(str, key);
    }
  });
}

// 示例3: 异步操作与中断
async function example3_async() {
  console.log('\n=== 示例3: 异步操作与中断 ===\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'async> ',
  });

  let abortController = null;

  const manager = createKeyBindingManager({
    rl,
    abortController: () => abortController,
    onInterrupt: () => console.log('⚡ 异步操作已中断'),
  });

  console.log('提示: 按 Ctrl+C 中断正在运行的异步操作\n');

  rl.prompt();

  rl.on('line', async (input) => {
    if (input === 'long') {
      abortController = new AbortController();
      console.log('⏳ 开始长时间任务 (按 Ctrl+C 中断)...');

      try {
        for (let i = 0; i < 10; i++) {
          if (abortController.signal.aborted) {
            throw new Error('Operation aborted');
          }
          console.log(`  进度: ${(i + 1) * 10}%`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('✅ 任务完成!\n');
      } catch (error) {
        console.log('❌ 任务被中断\n');
      } finally {
        abortController = null;
      }
    } else {
      console.log(`echo: ${input}`);
    }
    rl.prompt();
  });

  process.stdin.on('keypress', (str, key) => {
    manager.handleKey(str, key);
  });
}

// 示例4: 快捷键状态追踪
async function example4_state() {
  console.log('\n=== 示例4: 快捷键状态追踪 ===\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'state> ',
  });

  const manager = createKeyBindingManager({ rl });

  // 追踪按键统计
  const keyStats = new Map();

  // 包装原始处理方法以记录统计
  const originalHandleKey = manager.handleKey.bind(manager);
  manager.handleKey = function(str, key) {
    if (key && key.name) {
      const keyName = detectKeyBinding(str, key);
      keyStats.set(keyName, (keyStats.get(keyName) || 0) + 1);
    }
    return originalHandleKey(str, key);
  };

  // 注册显示统计的快捷键
  manager.register('showStats', () => {
    console.log('\n📊 按键统计:');
    for (const [key, count] of keyStats) {
      console.log(`  ${key}: ${count} 次`);
    }
    console.log('');
    rl.prompt();
  });

  console.log('提示: 按 Ctrl+Q 查看按键统计\n');

  rl.prompt();

  rl.on('line', (input) => {
    console.log(`处理: ${input}`);
    rl.prompt();
  });

  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'q') {
      manager.handleKey(str, key);
    }
  });
}

// 导出示例
export {
  example1_basic,
  example2_custom,
  example3_async,
  example4_state,
};

// 如果直接运行,显示菜单
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('快捷键使用示例');
  console.log('运行特定示例:');
  console.log('  node examples/keybindings-usage.js 1');
  console.log('  node examples/keybindings-usage.js 2');
  console.log('  node examples/keybindings-usage.js 3');
  console.log('  node examples/keybindings-usage.js 4');
  console.log('');

  const example = process.argv[2];
  switch (example) {
    case '1': await example1_basic(); break;
    case '2': await example2_custom(); break;
    case '3': await example3_async(); break;
    case '4': await example4_state(); break;
    default:
      console.log('请指定示例编号 (1-4)');
  }
}
