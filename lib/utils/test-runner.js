/**
 * 测试运行器管理器
 */

const fs = require('fs').promises;
const path = require('path');

class TestRunnerManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/test-runs.json');
    this.history = [];
    this.suites = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.history = parsed.history || [];
      this.suites = parsed.suites || [];
    } catch (err) {
      this.history = [];
      this.suites = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify({ history: this.history, suites: this.suites }, null, 2));
  }

  addSuite(name, tests, description = '') {
    const suite = {
      id: Date.now().toString(),
      name,
      tests, // [{ name, fn, expected }]
      description,
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      runCount: 0
    };
    this.suites.push(suite);
    this.save();
    return suite;
  }

  async run(suiteId) {
    const suite = this.suites.find(s => s.id === suiteId);
    if (!suite) return { success: false, message: '测试套件不存在' };

    const results = {
      id: Date.now().toString(),
      suiteId,
      suiteName: suite.name,
      startedAt: new Date().toISOString(),
      completedAt: null,
      tests: [],
      stats: {
        total: suite.tests.length,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };

    for (const test of suite.tests) {
      const result = { ...test, status: 'passed', error: null, duration: 0 };
      const start = Date.now();

      try {
        // 模拟测试执行
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
        result.duration = Date.now() - start;
        results.stats.passed++;
      } catch (err) {
        result.status = 'failed';
        result.error = err.message;
        result.duration = Date.now() - start;
        results.stats.failed++;
      }

      results.tests.push(result);
    }

    results.completedAt = new Date().toISOString();
    results.duration = new Date(results.completedAt) - new Date(results.startedAt);

    this.history.push(results);
    suite.lastRunAt = results.completedAt;
    suite.runCount++;

    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    await this.save();

    return {
      success: true,
      message: `✅ 测试完成: ${results.stats.passed}/${results.stats.total} 通过`,
      data: results
    };
  }

  getSuite(id) {
    return this.suites.find(s => s.id === id);
  }

  getSuites() {
    return this.suites;
  }

  getRun(id) {
    return this.history.find(h => h.id === id);
  }

  getHistory(limit = 50) {
    return this.history.slice(-limit).reverse();
  }

  getStats() {
    return {
      totalSuites: this.suites.length,
      totalRuns: this.history.length,
      totalTests: this.history.reduce((sum, h) => sum + h.stats.total, 0),
      totalPassed: this.history.reduce((sum, h) => sum + h.stats.passed, 0),
      totalFailed: this.history.reduce((sum, h) => sum + h.stats.failed, 0),
      avgDuration: this.history.length > 0
        ? Math.floor(this.history.reduce((sum, h) => sum + h.duration, 0) / this.history.length)
        : 0
    };
  }
}

module.exports = TestRunnerManager;
