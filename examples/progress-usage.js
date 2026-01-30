/**
 * 进度条和流式输出优化系统使用示例
 */

import {
  ProgressBar,
  DownloadProgressBar,
  MultiStepProgressBar,
  StreamOutputController,
  StreamOptimizer,
  createProgressBar,
  createStreamController,
  createStreamOptimizer,
  ProgressBarStyles
} from '../lib/utils/progress.js';

// 示例1: 基本进度条
console.log('=== 示例1: 基本进度条 ===\n');

async function basicProgressBar() {
  const bar = new ProgressBar({
    total: 100,
    width: 30,
    label: 'Progress:',
    showPercentage: true
  });
  
  bar.start();
  
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await sleep(30);
  }
  
  bar.complete();
}

await basicProgressBar();

// 示例2: 不同样式
console.log('\n=== 示例2: 不同样式 ===\n');

async function differentStyles() {
  const styles = ['standard', 'dots', 'blocks', 'arrow', 'double', 'circles'];
  
  for (const style of styles) {
    console.log(`\n${style} style:`);
    const bar = new ProgressBar({
      total: 50,
      width: 20,
      style: style,
      showPercentage: true
    });
    
    bar.start();
    
    for (let i = 0; i <= 50; i++) {
      bar.update(i);
      await sleep(20);
    }
    
    bar.complete();
  }
}

await differentStyles();

// 示例3: 自定义颜色
console.log('\n=== 示例3: 自定义颜色 ===\n');

async function customColors() {
  const bar = new ProgressBar({
    total: 100,
    width: 30,
    label: 'Download:',
    barColor: '\x1b[32m',   // 绿色
    bgColor: '\x1b[90m',    // 灰色
    textColor: '\x1b[37m'   // 白色
  });
  
  bar.start();
  
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await sleep(20);
  }
  
  bar.complete();
}

await customColors();

// 示例4: 下载进度条
console.log('\n=== 示例4: 下载进度条 ===\n');

async function downloadProgress() {
  const bar = new DownloadProgressBar({
    total: 1024 * 1024, // 1MB
    width: 30,
    label: 'Downloading:',
    showPercentage: true,
    showETA: true
  });
  
  bar.start();
  
  let downloaded = 0;
  const chunkSize = 1024 * 50; // 50KB chunks
  
  while (downloaded < bar.total) {
    const increment = Math.min(chunkSize, bar.total - downloaded);
    downloaded += increment;
    bar.updateDownload(downloaded, bar.total);
    await sleep(50);
  }
  
  bar.complete();
}

await downloadProgress();

// 示例5: 多步骤进度
console.log('\n=== 示例5: 多步骤进度 ===\n');

async function multiStepProgress() {
  const steps = [
    { label: 'Initializing...', total: 100 },
    { label: 'Processing...', total: 200 },
    { label: 'Finalizing...', total: 100 }
  ];
  
  const bar = new MultiStepProgressBar(steps);
  
  // Step 1
  bar.startStep(0);
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await sleep(10);
  }
  bar.completeStep();
  
  // Step 2
  for (let i = 0; i <= 200; i++) {
    bar.update(i);
    await sleep(5);
  }
  bar.completeStep();
  
  // Step 3
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await sleep(10);
  }
  bar.complete();
  
  process.stdout.write('\n\x1b[J'); // 清屏
}

await multiStepProgress();

// 示例6: 流式输出控制器
console.log('\n=== 示例6: 流式输出控制器 ===\n');

async function streamOutputControl() {
  const controller = new StreamOutputController();
  
  // 模拟流式输出
  const text = 'This is a streaming output example. '.repeat(20);
  
  controller.add(text);
  await controller.waitIdle();
}

await streamOutputControl();

// 示例7: 带进度条的流式输出
console.log('\n=== 示例7: 带进度条的流式输出 ===\n');

async function streamWithProgress() {
  const controller = new StreamOutputController();
  
  // 显示进度条
  controller.showProgressBar({
    total: 100,
    label: 'Processing:',
    showPercentage: true
  });
  
  // 模拟处理
  for (let i = 0; i <= 100; i++) {
    controller.updateProgress(i);
    await sleep(20);
  }
  
  controller.completeProgress();
}

await streamWithProgress();

// 示例8: 智能流式优化
console.log('\n=== 示例8: 智能流式优化 ===\n');

async function streamOptimizer() {
  const optimizer = new StreamOptimizer({
    bufferSize: 50,
    flushInterval: 30,
    adaptiveMode: true
  });
  
  // 模拟快速流式输出
  const fastText = 'A'.repeat(500);
  optimizer.add(fastText);
  
  await sleep(100);
  
  // 模拟慢速流式输出
  const slowText = 'B'.repeat(100);
  optimizer.add(slowText);
  
  await optimizer.complete();
}

await streamOptimizer();

// 示例9: 使用快捷函数
console.log('\n=== 示例9: 使用快捷函数 ===\n');

async function shortcutFunctions() {
  // 创建进度条
  const bar = createProgressBar({
    total: 100,
    label: 'Shortcut:'
  });
  
  bar.start();
  
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await sleep(10);
  }
  
  bar.complete();
  
  // 创建流控制器
  const controller = createStreamController();
  controller.add('Using shortcut functions!');
  await controller.waitIdle();
  
  // 创建流优化器
  const optimizer = createStreamOptimizer();
  optimizer.add('Stream optimizer text');
  await optimizer.complete();
}

await shortcutFunctions();

// 示例10: 带ETA的进度条
console.log('\n=== 示例10: 带ETA的进度条 ===\n');

async function progressWithETA() {
  const bar = new ProgressBar({
    total: 200,
    width: 30,
    label: 'Loading:',
    showPercentage: true,
    showETA: true
  });
  
  bar.start();
  
  for (let i = 0; i <= 200; i++) {
    bar.update(i);
    await sleep(30); // 较慢以显示ETA
  }
  
  bar.complete();
}

await progressWithETA();

// 示例11: 增量更新
console.log('\n=== 示例11: 增量更新 ===\n');

async function incrementalUpdate() {
  const bar = new ProgressBar({
    total: 100,
    label: 'Increment:',
    showPercentage: true
  });
  
  bar.start();
  
  // 使用increment方法
  for (let i = 0; i < 100; i++) {
    bar.increment();
    await sleep(20);
  }
  
  bar.complete();
}

await incrementalUpdate();

// 示例12: 显示当前值
console.log('\n=== 示例12: 显示当前值 ===\n');

async function showCurrentValue() {
  const bar = new ProgressBar({
    total: 1000,
    width: 30,
    label: 'Items:',
    showValue: true,
    showPercentage: true
  });
  
  bar.start();
  
  for (let i = 0; i <= 1000; i += 50) {
    bar.update(i);
    await sleep(30);
  }
  
  bar.complete();
}

await showCurrentValue();

// 示例13: 自定义样式字符
console.log('\n=== 示例13: 自定义样式字符 ===\n');

async function customStyleChars() {
  // 创建自定义样式
  const customStyle = {
    complete: '▮',
    incomplete: '▯',
    length: 20
  };
  
  // 使用自定义样式创建进度条
  const bar = new ProgressBar({
    total: 100,
    width: 20,
    style: 'standard'
  });
  
  // 手动替换样式
  const style = ProgressBarStyles.standard;
  style.complete = customStyle.complete;
  style.incomplete = customStyle.incomplete;
  
  bar.start();
  
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await sleep(20);
  }
  
  bar.complete();
}

await customStyleChars();

// 示例14: 暂停和恢复
console.log('\n=== 示例14: 暂停和恢复 ===\n');

async function pauseAndResume() {
  const bar = new ProgressBar({
    total: 100,
    label: 'Pausable:',
    showPercentage: true
  });
  
  bar.start();
  
  // 进度到 50%
  for (let i = 0; i <= 50; i++) {
    bar.update(i);
    await sleep(20);
  }
  
  console.log('\nPaused for 1 second...');
  await sleep(1000);
  
  // 继续
  for (let i = 51; i <= 100; i++) {
    bar.update(i);
    await sleep(20);
  }
  
  bar.complete();
}

await pauseAndResume();

// 示例15: 嵌套进度条
console.log('\n=== 示例15: 嵌套进度条 ===\n');

async function nestedProgress() {
  const outerBar = new ProgressBar({
    total: 10,
    label: 'Outer:',
    showPercentage: true
  });
  
  outerBar.start();
  
  for (let i = 0; i <= 10; i++) {
    // 内部进度条
    const innerBar = new ProgressBar({
      total: 100,
      width: 20,
      label: `  Inner ${i}:`,
      showPercentage: true
    });
    
    innerBar.start();
    
    for (let j = 0; j <= 100; j++) {
      innerBar.update(j);
      await sleep(2);
    }
    
    innerBar.complete();
    
    outerBar.update(i);
  }
  
  outerBar.complete();
}

await nestedProgress();

// 辅助函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('\n=== 所有示例完成 ===');
