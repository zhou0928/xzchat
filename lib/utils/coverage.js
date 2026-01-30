/**
 * 代码覆盖率管理器
 */

const fs = require('fs').promises;
const path = require('path');

class CoverageManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/coverage.json');
    this.reports = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.reports = JSON.parse(data);
    } catch (err) {
      this.reports = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.reports, null, 2));
  }

  generate(files, summary = {}) {
    const report = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      files: files.map(f => ({
        path: f.path,
        statements: {
          total: f.statements || 0,
          covered: f.coveredStatements || 0,
          percentage: f.statements > 0 ? ((f.coveredStatements || 0) / f.statements * 100).toFixed(2) : 0
        },
        branches: {
          total: f.branches || 0,
          covered: f.coveredBranches || 0,
          percentage: f.branches > 0 ? ((f.coveredBranches || 0) / f.branches * 100).toFixed(2) : 0
        },
        functions: {
          total: f.functions || 0,
          covered: f.coveredFunctions || 0,
          percentage: f.functions > 0 ? ((f.coveredFunctions || 0) / f.functions * 100).toFixed(2) : 0
        },
        lines: {
          total: f.lines || 0,
          covered: f.coveredLines || 0,
          percentage: f.lines > 0 ? ((f.coveredLines || 0) / f.lines * 100).toFixed(2) : 0
        }
      })),
      summary: {
        statements: {
          total: files.reduce((sum, f) => sum + (f.statements || 0), 0),
          covered: files.reduce((sum, f) => sum + (f.coveredStatements || 0), 0),
          percentage: 0
        },
        branches: {
          total: files.reduce((sum, f) => sum + (f.branches || 0), 0),
          covered: files.reduce((sum, f) => sum + (f.coveredBranches || 0), 0),
          percentage: 0
        },
        functions: {
          total: files.reduce((sum, f) => sum + (f.functions || 0), 0),
          covered: files.reduce((sum, f) => sum + (f.coveredFunctions || 0), 0),
          percentage: 0
        },
        lines: {
          total: files.reduce((sum, f) => sum + (f.lines || 0), 0),
          covered: files.reduce((sum, f) => sum + (f.coveredLines || 0), 0),
          percentage: 0
        },
        ...summary
      }
    };

    // 计算百分比
    ['statements', 'branches', 'functions', 'lines'].forEach(key => {
      if (report.summary[key].total > 0) {
        report.summary[key].percentage = (report.summary[key].covered / report.summary[key].total * 100).toFixed(2);
      }
    });

    this.reports.push(report);
    if (this.reports.length > 1000) {
      this.reports = this.reports.slice(-1000);
    }
    this.save();

    return report;
  }

  get(id) {
    return this.reports.find(r => r.id === id);
  }

  getLatest() {
    return this.reports[this.reports.length - 1];
  }

  getAll(limit = 50) {
    return this.reports.slice(-limit).reverse();
  }

  getStats() {
    const latest = this.getLatest();

    return {
      totalReports: this.reports.length,
      latestCoverage: latest ? latest.summary : null,
      avgCoverage: this.reports.length > 0
        ? (this.reports.reduce((sum, r) => sum + parseFloat(r.summary.lines.percentage), 0) / this.reports.length).toFixed(2)
        : 0
    };
  }
}

module.exports = CoverageManager;
