/**
 * 进度条和流式输出优化系统单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
} from '../../lib/utils/progress.js';

// Mock process.stdout.write
const originalWrite = process.stdout.write;
let writeOutput = [];

describe('ProgressBar System', () => {
  beforeEach(() => {
    writeOutput = [];
    process.stdout.write = vi.fn((data) => {
      writeOutput.push(data);
      return true;
    });
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  describe('ProgressBar', () => {
    it('should create instance with default options', () => {
      const bar = new ProgressBar();
      expect(bar.total).toBe(100);
      expect(bar.current).toBe(0);
      expect(bar.width).toBe(40);
    });

    it('should create instance with custom options', () => {
      const bar = new ProgressBar({
        total: 200,
        current: 50,
        width: 30
      });
      expect(bar.total).toBe(200);
      expect(bar.current).toBe(50);
      expect(bar.width).toBe(30);
    });

    it('should start progress bar', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      expect(bar.isActive).toBe(true);
      expect(bar.startTime).toBeDefined();
    });

    it('should update progress', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      bar.update(50);
      expect(bar.current).toBe(50);
    });

    it('should increment progress', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      bar.increment(10);
      expect(bar.current).toBe(10);
      bar.increment();
      expect(bar.current).toBe(11);
    });

    it('should clamp current to total', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      bar.increment(150);
      expect(bar.current).toBe(100);
    });

    it('should complete progress bar', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      bar.complete();
      expect(bar.current).toBe(100);
      expect(bar.isActive).toBe(false);
    });

    it('should stop progress bar', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      bar.stop();
      expect(bar.isActive).toBe(false);
    });

    it('should render progress bar', () => {
      const bar = new ProgressBar({ 
        total: 100, 
        current: 50, 
        width: 20 
      });
      bar.render();
      
      const output = writeOutput.join('');
      expect(output).toContain('█');
      expect(output).toContain('░');
      expect(output).toContain('50%');
    });

    it('should render with custom style', () => {
      const bar = new ProgressBar({ 
        total: 100, 
        current: 50, 
        style: 'dots' 
      });
      bar.render();
      
      const output = writeOutput.join('');
      expect(output).toContain('●');
      expect(output).toContain('○');
    });

    it('should format time correctly', () => {
      const bar = new ProgressBar();
      
      expect(bar.formatTime(1000)).toBe('1s');
      expect(bar.formatTime(60000)).toBe('1m 0s');
      expect(bar.formatTime(3600000)).toBe('1h 0m');
      expect(bar.formatTime(3661000)).toBe('1h 1m');
    });

    it('should reset progress bar', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      bar.update(50);
      bar.reset();
      expect(bar.current).toBe(0);
      expect(bar.startTime).toBeNull();
    });
  });

  describe('DownloadProgressBar', () => {
    it('should create instance', () => {
      const bar = new DownloadProgressBar({ total: 1000 });
      expect(bar).toBeInstanceOf(DownloadProgressBar);
      expect(bar.downloaded).toBe(0);
      expect(bar.speed).toBe(0);
    });

    it('should update download progress', () => {
      const bar = new DownloadProgressBar({ total: 1000 });
      bar.start();
      bar.updateDownload(500, 1000);
      expect(bar.downloaded).toBe(500);
      expect(bar.current).toBe(500);
      expect(bar.total).toBe(1000);
    });

    it('should calculate download speed', (done) => {
      const bar = new DownloadProgressBar({ total: 1000 });
      bar.start();
      
      bar.updateDownload(100, 1000);
      
      // 等待一段时间以计算速度
      setTimeout(() => {
        bar.updateDownload(200, 1000);
        // 速度应该被计算
        expect(bar.speed).toBeGreaterThanOrEqual(0);
        done();
      }, 600);
    });

    it('should format bytes correctly', () => {
      const bar = new DownloadProgressBar();
      
      expect(bar.formatBytes(100)).toBe('100.00 B');
      expect(bar.formatBytes(1024)).toBe('1.00 KB');
      expect(bar.formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(bar.formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
  });

  describe('MultiStepProgressBar', () => {
    it('should create instance', () => {
      const steps = [
        { label: 'Step 1', total: 100 },
        { label: 'Step 2', total: 200 }
      ];
      const bar = new MultiStepProgressBar(steps);
      expect(bar.steps).toEqual(steps);
      expect(bar.currentStep).toBe(0);
    });

    it('should start specific step', () => {
      const steps = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      const bar = new MultiStepProgressBar(steps);
      bar.startStep(1);
      expect(bar.currentStep).toBe(1);
    });

    it('should throw error for invalid step', () => {
      const steps = [
        { label: 'Step 1' }
      ];
      const bar = new MultiStepProgressBar(steps);
      
      expect(() => bar.startStep(5)).toThrow('Invalid step index');
    });

    it('should update current step', () => {
      const steps = [
        { label: 'Step 1', total: 100 }
      ];
      const bar = new MultiStepProgressBar(steps);
      bar.startStep(0);
      bar.update(50);
      expect(bar.progressBars[0].current).toBe(50);
    });

    it('should complete step and move to next', () => {
      const steps = [
        { label: 'Step 1', total: 100 },
        { label: 'Step 2', total: 100 }
      ];
      const bar = new MultiStepProgressBar(steps);
      bar.startStep(0);
      bar.completeStep();
      expect(bar.currentStep).toBe(1);
    });

    it('should render all steps', () => {
      const steps = [
        { label: 'Step 1', total: 100 },
        { label: 'Step 2', total: 100 }
      ];
      const bar = new MultiStepProgressBar(steps);
      bar.startStep(0);
      bar.update(50);
      bar.render();
      
      const output = writeOutput.join('');
      expect(output).toContain('Step 1');
      expect(output).toContain('Step 2');
      expect(output).toContain('→');
    });

    it('should complete all steps', () => {
      const steps = [
        { label: 'Step 1', total: 100 }
      ];
      const bar = new MultiStepProgressBar(steps);
      bar.startStep(0);
      bar.complete();
      expect(bar.progressBars[0].current).toBe(100);
    });
  });

  describe('StreamOutputController', () => {
    it('should create instance', () => {
      const controller = new StreamOutputController();
      expect(controller.buffer).toBe('');
      expect(controller.isPrinting).toBe(false);
    });

    it('should add text to buffer', () => {
      const controller = new StreamOutputController();
      controller.add('Hello');
      expect(controller.buffer).toBe('Hello');
    });

    it('should start printing', () => {
      const controller = new StreamOutputController();
      controller.add('Hello');
      expect(controller.isPrinting).toBe(true);
    });

    it('should stop printing', () => {
      const controller = new StreamOutputController();
      controller.add('Hello');
      controller.stop();
      expect(controller.buffer).toBe('');
      expect(controller.isPrinting).toBe(false);
    });

    it('should wait for idle', async () => {
      const controller = new StreamOutputController();
      controller.add('Hello');
      await controller.waitIdle();
      expect(controller.isPrinting).toBe(false);
    });

    it('should show progress bar', () => {
      const controller = new StreamOutputController();
      controller.showProgressBar({ total: 100 });
      expect(controller.progressBar).toBeInstanceOf(ProgressBar);
      expect(controller.showProgress).toBe(true);
    });

    it('should update progress', () => {
      const controller = new StreamOutputController();
      controller.showProgressBar({ total: 100 });
      controller.updateProgress(50);
      expect(controller.progressBar?.current).toBe(50);
    });

    it('should hide progress bar', () => {
      const controller = new StreamOutputController();
      controller.showProgressBar({ total: 100 });
      controller.hideProgressBar();
      expect(controller.progressBar).toBeNull();
      expect(controller.showProgress).toBe(false);
    });

    it('should complete progress', () => {
      const controller = new StreamOutputController();
      controller.showProgressBar({ total: 100 });
      controller.completeProgress();
      expect(controller.progressBar).toBeNull();
      expect(controller.showProgress).toBe(false);
    });
  });

  describe('StreamOptimizer', () => {
    it('should create instance', () => {
      const optimizer = new StreamOptimizer();
      expect(optimizer.bufferSize).toBe(100);
      expect(optimizer.flushInterval).toBe(50);
      expect(optimizer.adaptiveMode).toBe(true);
    });

    it('should add text', () => {
      const optimizer = new StreamOptimizer({ bufferSize: 50 });
      optimizer.add('Hello World');
      expect(optimizer.buffer).toBe('Hello World');
    });

    it('should flush when buffer is full', () => {
      const optimizer = new StreamOptimizer({ bufferSize: 10 });
      optimizer.add('Hello World!');
      expect(optimizer.buffer).toBe('');
    });

    it('should track throughput', () => {
      const optimizer = new StreamOptimizer();
      optimizer.add('Hello');
      optimizer.flush();
      expect(optimizer.currentThroughput).toBeGreaterThan(0);
    });

    it('should calculate average throughput', () => {
      const optimizer = new StreamOptimizer();
      optimizer.throughputHistory = [10, 20, 30];
      expect(optimizer.getAverageThroughput()).toBe(20);
    });

    it('should complete', async () => {
      const optimizer = new StreamOptimizer();
      optimizer.add('Hello');
      await optimizer.complete();
      expect(optimizer.buffer).toBe('');
    });

    it('should stop', () => {
      const optimizer = new StreamOptimizer();
      optimizer.add('Hello');
      optimizer.stop();
      expect(optimizer.buffer).toBe('');
    });
  });

  describe('ProgressBarStyles', () => {
    it('should have all predefined styles', () => {
      expect(ProgressBarStyles.standard).toBeDefined();
      expect(ProgressBarStyles.dots).toBeDefined();
      expect(ProgressBarStyles.blocks).toBeDefined();
      expect(ProgressBarStyles.arrow).toBeDefined();
      expect(ProgressBarStyles.double).toBeDefined();
      expect(ProgressBarStyles.circles).toBeDefined();
    });

    it('should have correct structure', () => {
      const style = ProgressBarStyles.standard;
      expect(style).toHaveProperty('complete');
      expect(style).toHaveProperty('incomplete');
      expect(style).toHaveProperty('length');
      expect(typeof style.complete).toBe('string');
      expect(typeof style.incomplete).toBe('string');
      expect(typeof style.length).toBe('number');
    });
  });

  describe('Helper Functions', () => {
    it('should create progress bar', () => {
      const bar = createProgressBar({ total: 100 });
      expect(bar).toBeInstanceOf(ProgressBar);
    });

    it('should create stream controller', () => {
      const controller = createStreamController();
      expect(controller).toBeInstanceOf(StreamOutputController);
    });

    it('should create stream optimizer', () => {
      const optimizer = createStreamOptimizer();
      expect(optimizer).toBeInstanceOf(StreamOptimizer);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const controller = new StreamOutputController();
      controller.add('');
      expect(controller.buffer).toBe('');
    });

    it('should handle zero total', () => {
      const bar = new ProgressBar({ total: 0 });
      bar.start();
      bar.update(10);
      expect(bar.current).toBe(0);
    });

    it('should handle negative increment', () => {
      const bar = new ProgressBar({ total: 100 });
      bar.start();
      bar.increment(-10);
      expect(bar.current).toBe(0);
    });

    it('should handle Unicode characters', () => {
      const controller = new StreamOutputController();
      controller.add('你好世界');
      expect(controller.buffer).toBe('你好世界');
    });

    it('should handle very large numbers', () => {
      const bar = new ProgressBar({ total: Number.MAX_SAFE_INTEGER });
      bar.start();
      bar.update(Number.MAX_SAFE_INTEGER / 2);
      expect(bar.current).toBeGreaterThan(0);
    });
  });
});
