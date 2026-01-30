# 进度条和流式输出优化系统文档

## 概述

xzChat 内置了完整的进度条和流式输出优化系统,提供了多种进度条样式、智能流式输出控制、自适应速度调节等功能,大大提升了用户体验。

## 特性

- ✅ **6种进度条样式** - Standard, Dots, Blocks, Arrow, Double, Circles
- ✅ **下载进度条** - 支持下载速度显示
- ✅ **多步骤进度** - 管理多个相关步骤的进度
- ✅ **流式输出控制** - 智能的文本输出控制
- ✅ **自适应优化** - 根据吞吐量自动调整输出速度
- ✅ **自定义样式** - 支持自定义颜色和字符
- ✅ **ETA计算** - 预计剩余时间显示
- ✅ **类型安全** - 完整的 TypeScript 类型定义

## 快速开始

### 1. 基本进度条

```javascript
import { ProgressBar } from './lib/utils/progress.js';

const bar = new ProgressBar({
  total: 100,
  width: 30,
  label: 'Progress:',
  showPercentage: true
});

bar.start();

for (let i = 0; i <= 100; i++) {
  bar.update(i);
  await sleep(10);
}

bar.complete();
```

### 2. 不同样式

```javascript
const bar = new ProgressBar({
  total: 100,
  style: 'dots' // 'standard', 'dots', 'blocks', 'arrow', 'double', 'circles'
});
```

### 3. 流式输出

```javascript
import { StreamOutputController } from './lib/utils/progress.js';

const controller = new StreamOutputController();

controller.add('Streaming text...');
await controller.waitIdle();
```

## API 参考

### ProgressBar 类

#### 构造函数

```javascript
new ProgressBar(options)
```

**参数:**
- `options` (Object) - 配置选项
  - `total` (number) - 总数,默认100
  - `current` (number) - 当前进度,默认0
  - `width` (number) - 进度条宽度,默认40
  - `style` (string) - 样式名称,默认'standard'
  - `showPercentage` (boolean) - 是否显示百分比,默认true
  - `showValue` (boolean) - 是否显示当前值,默认false
  - `showETA` (boolean) - 是否显示预计剩余时间,默认false
  - `label` (string) - 标签文本
  - `barColor` (string) - 进度条颜色
  - `bgColor` (string) - 背景颜色
  - `textColor` (string) - 文本颜色

#### start(total)

开始进度条。

```javascript
bar.start();
bar.start(200); // 设置总数并开始
```

#### update(current)

更新进度。

```javascript
bar.update(50);
```

#### increment(amount)

增加进度。

```javascript
bar.increment();     // 增加1
bar.increment(10);    // 增加10
```

#### complete()

完成进度条。

```javascript
bar.complete();
```

#### stop()

停止进度条。

```javascript
bar.stop();
```

### DownloadProgressBar 类

下载进度条,支持速度显示。

```javascript
import { DownloadProgressBar } from './lib/utils/progress.js';

const bar = new DownloadProgressBar({
  total: 1024 * 1024, // 1MB
  label: 'Download:',
  showETA: true
});

bar.start();

let downloaded = 0;
while (downloaded < bar.total) {
  const chunk = 1024 * 50; // 50KB
  downloaded += chunk;
  bar.updateDownload(downloaded, bar.total);
  await sleep(50);
}

bar.complete();
```

#### updateDownload(downloaded, total)

更新下载进度。

**参数:**
- `downloaded` (number) - 已下载字节数
- `total` (number) - 总字节数(可选)

```javascript
bar.updateDownload(1024 * 500, 1024 * 1024);
```

### MultiStepProgressBar 类

多步骤进度条,管理多个相关步骤。

```javascript
import { MultiStepProgressBar } from './lib/utils/progress.js';

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
```

### StreamOutputController 类

流式输出控制器。

```javascript
import { StreamOutputController } from './lib/utils/progress.js';

const controller = new StreamOutputController();

// 添加文本
controller.add('Hello World!');
await controller.waitIdle();

// 显示进度条
controller.showProgressBar({ total: 100 });
for (let i = 0; i <= 100; i++) {
  controller.updateProgress(i);
  await sleep(10);
}
controller.completeProgress();
```

#### add(text)

添加文本到缓冲区。

```javascript
controller.add('Text to stream');
```

#### showProgressBar(options)

显示进度条。

```javascript
controller.showProgressBar({
  total: 100,
  label: 'Processing:'
});
```

#### updateProgress(current)

更新进度条。

```javascript
controller.updateProgress(50);
```

#### hideProgressBar()

隐藏进度条。

```javascript
controller.hideProgressBar();
```

### StreamOptimizer 类

智能流式输出优化器,自动调整输出速度。

```javascript
import { StreamOptimizer } from './lib/utils/progress.js';

const optimizer = new StreamOptimizer({
  bufferSize: 50,
  flushInterval: 30,
  adaptiveMode: true
});

optimizer.add('Streaming text');
await optimizer.complete();
```

## 进度条样式

### Standard (标准)

默认样式,使用方块字符。

```
████████████░░░░░░░░░░░ 50%
```

### Dots (点状)

使用圆点字符。

```
●●●●●●●●●●○○○○○○○○○○ 50%
```

### Blocks (块状)

使用不同密度的方块。

```
▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒ 50%
```

### Arrow (箭头)

使用箭头字符。

```
>>>>>>>>>>---------- 50%
```

### Double (双线)

使用双线字符。

```
════════════════════ 50%
```

### Circles (圆圈)

使用实心和空心圆。

```
⬤⬤⬤⬤⬤◯◯◯◯◯ 50%
```

## 颜色自定义

使用ANSI颜色代码自定义颜色:

```javascript
const bar = new ProgressBar({
  barColor: '\x1b[32m',   // 绿色
  bgColor: '\x1b[90m',    // 灰色
  textColor: '\x1b[37m'   // 白色
});
```

### 常用ANSI颜色

```javascript
const Colors = {
  reset: '\x1b[0m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m'
};
```

## 快捷函数

### createProgressBar(options)

创建进度条。

```javascript
const bar = createProgressBar({ total: 100 });
```

### createStreamController(options)

创建流式输出控制器。

```javascript
const controller = createStreamController();
```

### createStreamOptimizer(options)

创建流式优化器。

```javascript
const optimizer = createStreamOptimizer();
```

## 高级用法

### 1. 自定义样式字符

```javascript
import { ProgressBarStyles } from './lib/utils/progress.js';

// 修改现有样式
ProgressBarStyles.standard.complete = '▮';
ProgressBarStyles.standard.incomplete = '▯';

// 创建进度条
const bar = new ProgressBar({ style: 'standard' });
```

### 2. 暂停和恢复

```javascript
bar.start();

// 进度到50%
for (let i = 0; i <= 50; i++) {
  bar.update(i);
  await sleep(10);
}

// 暂停
console.log('Paused...');
await sleep(1000);

// 继续
for (let i = 51; i <= 100; i++) {
  bar.update(i);
  await sleep(10);
}

bar.complete();
```

### 3. 嵌套进度条

```javascript
const outerBar = new ProgressBar({ total: 10 });

outerBar.start();

for (let i = 0; i <= 10; i++) {
  const innerBar = new ProgressBar({ total: 100 });
  innerBar.start();
  
  for (let j = 0; j <= 100; j++) {
    innerBar.update(j);
    await sleep(2);
  }
  
  innerBar.complete();
  outerBar.update(i);
}

outerBar.complete();
```

### 4. 自适应速度配置

```javascript
const optimizer = new StreamOptimizer({
  adaptiveMode: true,
  bufferSize: 100,
  flushInterval: 50
});

// 优化器会自动根据吞吐量调整输出速度
optimizer.add('Text');
```

## 最佳实践

### 1. 使用适当的样式

根据场景选择合适的样式:
- 下载任务: 使用 `blocks` 或 `dots`
- 处理任务: 使用 `standard` 或 `arrow`
- 精确显示: 使用 `double` 或 `circles`

### 2. 显示有意义的标签

```javascript
// 推荐
const bar = new ProgressBar({
  label: 'Downloading file.zip:'
});

// 不推荐
const bar = new ProgressBar({
  label: 'Progress:'
});
```

### 3. 合理设置总数

```javascript
// 推荐
const bar = new ProgressBar({ total: fileCount });

// 不推荐
const bar = new ProgressBar({ total: 100 }); // 即使实际不是100
```

### 4. 适当的更新频率

```javascript
// 推荐 - 节流更新
if (i % 5 === 0) {
  bar.update(i);
}

// 不推荐 - 太频繁
for (let i = 0; i <= 100; i++) {
  bar.update(i); // 每次都更新
}
```

### 5. 总是完成进度条

```javascript
try {
  // 执行任务
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await doWork();
  }
  bar.complete();
} catch (error) {
  bar.stop();
  throw error;
}
```

## 性能考虑

### 1. 动态速度控制

流式输出控制器会根据缓冲区大小自动调整输出速度:

- 缓冲区 > 200: 快速输出(50字符/次, 1ms延迟)
- 缓冲区 > 50: 中速输出(10字符/次, 2ms延迟)
- 缓冲区 > 20: 慢速输出(5字符/次, 3ms延迟)
- 缓冲区 <= 20: 极慢输出(1字符/次, 4ms延迟)

### 2. 自适应优化

流式优化器会跟踪吞吐量并自动调整:

- 高吞吐量(>20 chars/ms): 快速模式
- 中等吞吐量(10-20 chars/ms): 标准模式
- 低吞吐量(<10 chars/ms): 慢速模式

### 3. 更新频率限制

进度条有内置的更新频率限制(50ms),避免过度渲染。

## 故障排除

### 问题: 进度条不更新

**原因:** 更新频率太高被节流

**解决:** 确保调用 `update()` 或等待足够时间

```javascript
for (let i = 0; i <= 100; i++) {
  bar.update(i);
  await sleep(100); // 确保间隔足够
}
```

### 问题: 流式输出卡住

**原因:** 缓冲区未刷新

**解决:** 调用 `complete()` 或手动刷新

```javascript
await optimizer.complete();
```

### 问题: ETA不准确

**原因:** 处理速度不稳定

**解决:** 确保处理速度相对稳定

## 集成示例

### 在文件操作中使用

```javascript
import { ProgressBar } from './lib/utils/progress.js';
import fs from 'node:fs';

async function processFiles(files) {
  const bar = new ProgressBar({
    total: files.length,
    label: 'Processing files:'
  });
  
  bar.start();
  
  for (const file of files) {
    await processFile(file);
    bar.increment();
  }
  
  bar.complete();
}
```

### 在API请求中使用

```javascript
import { DownloadProgressBar } from './lib/utils/progress.js';
import fetch from 'node-fetch';

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  const totalSize = parseInt(response.headers.get('content-length'));
  
  const bar = new DownloadProgressBar({
    total: totalSize,
    label: 'Downloading:'
  });
  
  bar.start();
  
  let downloaded = 0;
  const fileStream = fs.createWriteStream(outputPath);
  
  for await (const chunk of response.body) {
    fileStream.write(chunk);
    downloaded += chunk.length;
    bar.updateDownload(downloaded, totalSize);
  }
  
  bar.complete();
}
```

### 在异步任务中使用

```javascript
import { MultiStepProgressBar } from './lib/utils/progress.js';

async function buildProject() {
  const steps = [
    { label: 'Installing dependencies...', total: 100 },
    { label: 'Building...', total: 200 },
    { label: 'Testing...', total: 100 }
  ];
  
  const bar = new MultiStepProgressBar(steps);
  
  // Step 1: Install
  bar.startStep(0);
  await installDependencies();
  bar.completeStep();
  
  // Step 2: Build
  await buildProject();
  bar.completeStep();
  
  // Step 3: Test
  await runTests();
  bar.complete();
}
```

## 示例

完整示例请参考: `examples/progress-usage.js`

```bash
node examples/progress-usage.js
```

## 相关文档

- [主题系统文档](THEMES.md)
- [国际化文档](I18N.md)
- [快捷键文档](KEYBINDINGS.md)
