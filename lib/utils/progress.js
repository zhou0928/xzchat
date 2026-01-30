/**
 * 进度条和流式输出优化系统
 * 提供多种进度条样式、流式输出控制等功能
 */

import process from 'node:process';

/**
 * 进度条样式
 */
export const ProgressBarStyles = {
  /**
   * 标准样式
   */
  standard: {
    complete: '█',
    incomplete: '░',
    length: 20
  },
  
  /**
   * 点状样式
   */
  dots: {
    complete: '●',
    incomplete: '○',
    length: 20
  },
  
  /**
   * 块状样式
   */
  blocks: {
    complete: '▓',
    incomplete: '▒',
    length: 20
  },
  
  /**
   * 箭头样式
   */
  arrow: {
    complete: '>',
    incomplete: '-',
    length: 20
  },
  
  /**
   * 双线样式
   */
  double: {
    complete: '═',
    incomplete: '─',
    length: 20
  },
  
  /**
   * 圆点样式
   */
  circles: {
    complete: '⬤',
    incomplete: '◯',
    length: 15
  }
};

/**
 * 进度条类
 */
export class ProgressBar {
  constructor(options = {}) {
    this.total = options.total || 100;
    this.current = options.current || 0;
    this.width = options.width || 40;
    this.style = options.style || 'standard';
    this.showPercentage = options.showPercentage !== false;
    this.showValue = options.showValue || false;
    this.showETA = options.showETA || false;
    this.label = options.label || '';
    this.barColor = options.barColor || '\x1b[32m';
    this.bgColor = options.bgColor || '\x1b[90m';
    this.textColor = options.textColor || '\x1b[37m';
    this.resetColor = '\x1b[0m';
    
    this.startTime = null;
    this.lastUpdate = null;
    this.isActive = false;
    this.renderTimer = null;
    
    // 隐藏光标
    this.hideCursor();
  }
  
  /**
   * 开始进度条
   */
  start(total) {
    if (total !== undefined) {
      this.total = total;
    }
    this.current = 0;
    this.startTime = Date.now();
    this.lastUpdate = Date.now();
    this.isActive = true;
    this.render();
  }
  
  /**
   * 更新进度
   */
  update(current) {
    if (current !== undefined) {
      this.current = current;
    }
    
    // 限制更新频率
    const now = Date.now();
    if (now - this.lastUpdate < 50) {
      return;
    }
    
    this.lastUpdate = now;
    
    if (this.isActive) {
      this.render();
    }
  }
  
  /**
   * 增加进度
   */
  increment(amount = 1) {
    this.current += amount;
    if (this.current > this.total) {
      this.current = this.total;
    }
    this.update();
  }
  
  /**
   * 完成进度条
   */
  complete() {
    this.current = this.total;
    this.render();
    this.stop();
    process.stdout.write('\n');
  }
  
  /**
   * 停止进度条
   */
  stop() {
    this.isActive = false;
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
    this.showCursor();
  }
  
  /**
   * 渲染进度条
   */
  render() {
    const style = ProgressBarStyles[this.style] || ProgressBarStyles.standard;
    const percentage = this.current / this.total;
    const completed = Math.floor(percentage * this.width);
    const remaining = this.width - completed;
    
    const completeChar = style.complete;
    const incompleteChar = style.incomplete;
    
    const bar = 
      this.barColor + completeChar.repeat(completed) + 
      this.bgColor + incompleteChar.repeat(remaining) + 
      this.resetColor;
    
    let output = '\r';
    
    // 标签
    if (this.label) {
      output += `${this.textColor}${this.label} ${this.resetColor}`;
    }
    
    // 进度条
    output += bar;
    
    // 百分比
    if (this.showPercentage) {
      const pct = Math.round(percentage * 100);
      output += ` ${this.textColor}${pct}%${this.resetColor}`;
    }
    
    // 当前值/总数
    if (this.showValue) {
      output += ` ${this.textColor}${this.current}/${this.total}${this.resetColor}`;
    }
    
    // 预计剩余时间
    if (this.showETA && this.startTime && this.current > 0) {
      const elapsed = Date.now() - this.startTime;
      const eta = Math.round(elapsed / this.current * (this.total - this.current));
      output += ` ${this.textColor}ETA: ${this.formatTime(eta)}${this.resetColor}`;
    }
    
    process.stdout.write(output);
  }
  
  /**
   * 格式化时间
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * 隐藏光标
   */
  hideCursor() {
    process.stdout.write('\x1b[?25l');
  }
  
  /**
   * 显示光标
   */
  showCursor() {
    process.stdout.write('\x1b[?25h');
  }
  
  /**
   * 重置进度条
   */
  reset() {
    this.current = 0;
    this.startTime = null;
    this.lastUpdate = null;
  }
}

/**
 * 下载进度条类
 */
export class DownloadProgressBar extends ProgressBar {
  constructor(options = {}) {
    super({
      ...options,
      showPercentage: true,
      showValue: false,
      showETA: true
    });
    this.downloaded = 0;
    this.speed = 0;
    this.lastDownloadTime = Date.now();
    this.lastDownloaded = 0;
  }
  
  /**
   * 更新下载进度
   */
  updateDownload(downloaded, total) {
    this.downloaded = downloaded;
    this.current = downloaded;
    if (total !== undefined) {
      this.total = total;
    }
    
    // 计算下载速度
    const now = Date.now();
    const elapsed = (now - this.lastDownloadTime) / 1000;
    if (elapsed > 0.5) {
      const diff = downloaded - this.lastDownloaded;
      this.speed = diff / elapsed;
      this.lastDownloadTime = now;
      this.lastDownloaded = downloaded;
    }
    
    this.render();
  }
  
  /**
   * 渲染进度条
   */
  render() {
    super.render();
    
    // 显示下载速度
    if (this.speed > 0 && this.isActive) {
      const speedStr = this.formatBytes(this.speed);
      const speedOutput = ` ${this.textColor}${speedStr}/s${this.resetColor}`;
      process.stdout.write(speedOutput);
    }
  }
  
  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    
    return `${size.toFixed(2)} ${units[unit]}`;
  }
}

/**
 * 多步骤进度条类
 */
export class MultiStepProgressBar {
  constructor(steps, options = {}) {
    this.steps = steps;
    this.currentStep = 0;
    this.options = options;
    this.progressBars = {};
    
    // 为每个步骤创建进度条
    steps.forEach((step, index) => {
      this.progressBars[index] = new ProgressBar({
        ...options,
        label: step.label,
        total: step.total || 100
      });
    });
  }
  
  /**
   * 开始指定步骤
   */
  startStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      throw new Error(`Invalid step index: ${stepIndex}`);
    }
    
    this.currentStep = stepIndex;
    this.progressBars[stepIndex].start();
    this.render();
  }
  
  /**
   * 更新当前步骤
   */
  update(current) {
    this.progressBars[this.currentStep].update(current);
    this.render();
  }
  
  /**
   * 完成当前步骤
   */
  completeStep() {
    this.progressBars[this.currentStep].complete();
    
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.progressBars[this.currentStep].start();
      this.render();
    }
  }
  
  /**
   * 渲染所有步骤
   */
  render() {
    let output = '\x1b[2J\x1b[H'; // 清屏并移动到顶部
    
    this.steps.forEach((step, index) => {
      const isCurrent = index === this.currentStep;
      const isCompleted = index < this.currentStep;
      const isPending = index > this.currentStep;
      
      let status = isCompleted ? '✓' : (isCurrent ? '→' : ' ');
      let color = isCompleted ? '\x1b[32m' : (isCurrent ? '\x1b[36m' : '\x1b[90m');
      let reset = '\x1b[0m';
      
      output += `${color}${status} ${step.label}${reset}\n`;
      
      if (isCurrent || isCompleted) {
        const bar = this.progressBars[index];
        const percentage = Math.round((bar.current / bar.total) * 100);
        output += `  ${color}[${'#'.repeat(Math.floor(percentage / 5))}${'.'.repeat(20 - Math.floor(percentage / 5))}] ${percentage}%${reset}\n`;
      }
    });
    
    process.stdout.write(output);
  }
  
  /**
   * 完成所有步骤
   */
  complete() {
    this.progressBars[this.currentStep].complete();
    process.stdout.write('\n');
  }
}

/**
 * 流式输出控制器
 */
export class StreamOutputController {
  constructor(options = {}) {
    this.buffer = '';
    this.isPrinting = false;
    this.resolveIdle = null;
    this.timer = null;
    this.progressBar = null;
    this.showProgress = options.showProgress || false;
    
    // 动态速度控制配置
    this.speedConfig = options.speedConfig || {
      bufferSizeThresholds: [
        { threshold: 200, count: 50, delay: 1 },
        { threshold: 50, count: 10, delay: 2 },
        { threshold: 20, count: 5, delay: 3 },
        { threshold: 5, count: 2, delay: 4 }
      ],
      defaultCount: 1,
      defaultDelay: 5
    };
  }
  
  /**
   * 添加文本到缓冲区
   */
  add(text) {
    if (!text) return;
    this.buffer += text;
    this.start();
  }
  
  /**
   * 开始输出
   */
  start() {
    if (this.isPrinting) return;
    this.isPrinting = true;
    this.printLoop();
  }
  
  /**
   * 输出循环
   */
  printLoop() {
    if (this.buffer.length === 0) {
      this.isPrinting = false;
      if (this.resolveIdle) {
        this.resolveIdle();
        this.resolveIdle = null;
      }
      return;
    }
    
    // 动态速度控制
    const len = this.buffer.length;
    let count = this.speedConfig.defaultCount;
    let delay = this.speedConfig.defaultDelay;
    
    for (const config of this.speedConfig.bufferSizeThresholds) {
      if (len > config.threshold) {
        count = config.count;
        delay = config.delay;
        break;
      }
    }
    
    // 使用迭代器确保不切断 Unicode 字符
    let charIndex = 0;
    let charCount = 0;
    for (const char of this.buffer) {
      charIndex += char.length;
      charCount++;
      if (charCount >= count) break;
    }
    
    const splitIndex = charIndex;
    const chunk = this.buffer.slice(0, splitIndex);
    this.buffer = this.buffer.slice(splitIndex);
    
    process.stdout.write(chunk);
    
    this.timer = setTimeout(() => this.printLoop(), delay);
  }
  
  /**
   * 停止输出
   */
  stop() {
    if (this.isPrinting) {
      this.isPrinting = false;
      this.buffer = '';
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      if (this.resolveIdle) {
        this.resolveIdle();
        this.resolveIdle = null;
      }
    }
  }
  
  /**
   * 等待输出完成
   */
  async waitIdle() {
    if (!this.isPrinting && this.buffer.length === 0) return;
    return new Promise(resolve => {
      this.resolveIdle = resolve;
    });
  }
  
  /**
   * 显示进度条
   */
  showProgressBar(options) {
    if (this.progressBar) {
      this.progressBar.stop();
    }
    this.progressBar = new ProgressBar(options);
    this.progressBar.start();
    this.showProgress = true;
  }
  
  /**
   * 更新进度条
   */
  updateProgress(current) {
    if (this.progressBar && this.showProgress) {
      this.progressBar.update(current);
    }
  }
  
  /**
   * 隐藏进度条
   */
  hideProgressBar() {
    if (this.progressBar) {
      this.progressBar.stop();
      this.progressBar = null;
    }
    this.showProgress = false;
  }
  
  /**
   * 完成进度条
   */
  completeProgress() {
    if (this.progressBar) {
      this.progressBar.complete();
      this.progressBar = null;
    }
    this.showProgress = false;
  }
}

/**
 * 智能流式输出优化器
 */
export class StreamOptimizer {
  constructor(options = {}) {
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 50;
    this.adaptiveMode = options.adaptiveMode !== false;
    
    this.buffer = '';
    this.lastFlushTime = Date.now();
    this.currentThroughput = 0;
    this.throughputHistory = [];
    
    this.controller = new StreamOutputController({
      speedConfig: this.getAdaptiveSpeedConfig()
    });
  }
  
  /**
   * 添加文本
   */
  add(text) {
    if (!text) return;
    this.buffer += text;
    
    // 缓冲区满或间隔到达时刷新
    const now = Date.now();
    if (this.buffer.length >= this.bufferSize || 
        now - this.lastFlushTime >= this.flushInterval) {
      this.flush();
    }
  }
  
  /**
   * 刷新缓冲区
   */
  flush() {
    if (this.buffer.length === 0) return;
    
    const chunkSize = this.buffer.length;
    const now = Date.now();
    
    // 计算吞吐量
    if (this.lastFlushTime > 0) {
      const elapsed = now - this.lastFlushTime;
      this.currentThroughput = chunkSize / elapsed;
      this.throughputHistory.push(this.currentThroughput);
      
      // 保持历史记录在合理范围内
      if (this.throughputHistory.length > 10) {
        this.throughputHistory.shift();
      }
    }
    
    // 如果启用自适应模式,动态调整配置
    if (this.adaptiveMode) {
      this.adjustSpeedConfig();
    }
    
    this.controller.add(this.buffer);
    this.buffer = '';
    this.lastFlushTime = now;
  }
  
  /**
   * 自适应速度配置
   */
  getAdaptiveSpeedConfig() {
    const avgThroughput = this.getAverageThroughput();
    
    if (avgThroughput > 20) {
      // 高吞吐量 - 快速输出
      return {
        bufferSizeThresholds: [
          { threshold: 200, count: 100, delay: 1 },
          { threshold: 50, count: 20, delay: 1 }
        ],
        defaultCount: 10,
        defaultDelay: 1
      };
    } else if (avgThroughput > 10) {
      // 中等吞吐量
      return {
        bufferSizeThresholds: [
          { threshold: 200, count: 50, delay: 1 },
          { threshold: 50, count: 10, delay: 2 },
          { threshold: 20, count: 5, delay: 3 }
        ],
        defaultCount: 5,
        defaultDelay: 2
      };
    } else {
      // 低吞吐量 - 慢速输出
      return {
        bufferSizeThresholds: [
          { threshold: 50, count: 5, delay: 3 },
          { threshold: 20, count: 2, delay: 5 }
        ],
        defaultCount: 1,
        defaultDelay: 5
      };
    }
  }
  
  /**
   * 调整速度配置
   */
  adjustSpeedConfig() {
    const config = this.getAdaptiveSpeedConfig();
    this.controller.speedConfig = config;
  }
  
  /**
   * 获取平均吞吐量
   */
  getAverageThroughput() {
    if (this.throughputHistory.length === 0) return 0;
    
    const sum = this.throughputHistory.reduce((a, b) => a + b, 0);
    return sum / this.throughputHistory.length;
  }
  
  /**
   * 完成输出
   */
  async complete() {
    this.flush();
    await this.controller.waitIdle();
  }
  
  /**
   * 停止输出
   */
  stop() {
    this.buffer = '';
    this.controller.stop();
  }
}

/**
 * 快捷函数 - 创建进度条
 */
export function createProgressBar(options) {
  return new ProgressBar(options);
}

/**
 * 快捷函数 - 创建下载进度条
 */
export function createDownloadProgressBar(options) {
  return new DownloadProgressBar(options);
}

/**
 * 快捷函数 - 创建流式输出控制器
 */
export function createStreamController(options) {
  return new StreamOutputController(options);
}

/**
 * 快捷函数 - 创建流式优化器
 */
export function createStreamOptimizer(options) {
  return new StreamOptimizer(options);
}

export default ProgressBar;
