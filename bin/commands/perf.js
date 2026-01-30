import { PerformanceMonitor } from "../../lib/utils/perf.js";

/**
 * 性能分析器
 * 监控命令执行时间和资源使用
 */

const perfMonitor = new PerformanceMonitor();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'start':
        await handleStart(params[0]);
        break;

      case 'stop':
        await handleStop(params[0]);
        break;

      case 'report':
        await handleReport(params[0]);
        break;

      case 'history':
        await handleHistory(params[0]);
        break;

      case 'compare':
        await handleCompare(params[0], params[1]);
        break;

      case 'analyze':
        await handleAnalyze(params[0]);
        break;

      case 'bottlenecks':
        await handleBottlenecks();
        break;

      case 'export':
        await handleExport(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`性能分析操作失败: ${error.message}`);
  }
};

async function handleStart(label) {
  const result = perfMonitor.start(label || 'session');
  console.log(`\n🚀 性能监控已启动: ${result.label}\n`);
}

async function handleStop(label) {
  const result = perfMonitor.stop(label || 'session');

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  console.log(`\n📊 性能报告: ${result.label}`);
  console.log(`  执行时间: ${result.duration.toFixed(2)}ms`);
  console.log(`  CPU 使用: ${result.cpu}%`);
  console.log(`  内存使用: ${result.memory}MB`);
  console.log('');
}

async function handleReport(label) {
  const report = perfMonitor.getReport(label || 'latest');

  if (!report) {
    console.error('\n❌ 未找到报告\n');
    return;
  }

  console.log(`\n📈 性能报告: ${report.label}\n`);
  console.log(`开始时间: ${new Date(report.startTime).toLocaleString('zh-CN')}`);
  console.log(`结束时间: ${new Date(report.endTime).toLocaleString('zh-CN')}`);
  console.log(`执行时间: ${report.duration}ms`);
  console.log(`CPU 使用: ${report.cpu}%`);
  console.log(`内存峰值: ${report.memory}MB`);
  console.log(`操作数量: ${report.operations}`);
  console.log('');
}

async function handleHistory(limit) {
  const history = perfMonitor.getHistory(parseInt(limit) || 10);

  if (history.length === 0) {
    console.log('\n暂无历史记录\n');
    return;
  }

  console.log(`\n📜 性能历史 (最近 ${history.length} 条):\n`);
  history.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.label}`);
    console.log(`     时间: ${new Date(record.startTime).toLocaleString('zh-CN')}`);
    console.log(`     耗时: ${record.duration}ms\n`);
  });
}

async function handleCompare(label1, label2) {
  const comparison = perfMonitor.compareSessions(label1, label2);

  if (!comparison) {
    console.error('\n❌ 无法比较，会话不存在\n');
    return;
  }

  console.log(`\n⚖️  性能对比:\n`);
  console.log(`会话1: ${comparison.session1.label} (${comparison.session1.duration}ms)`);
  console.log(`会话2: ${comparison.session2.label} (${comparison.session2.duration}ms)\n`);

  const diff = comparison.diff;
  console.log(`差异: ${diff.timeDiff}ms (${diff.percentDiff > 0 ? '+' : ''}${diff.percentDiff}%)`);

  if (diff.percentDiff > 0) {
    console.log('结论: 会话2 更慢');
  } else if (diff.percentDiff < 0) {
    console.log('结论: 会话2 更快');
  } else {
    console.log('结论: 性能相当');
  }
  console.log('');
}

async function handleAnalyze(label) {
  const analysis = perfMonitor.analyzePerformance(label);

  if (!analysis) {
    console.error('\n❌ 未找到会话\n');
    return;
  }

  console.log(`\n🔍 性能分析: ${analysis.label}\n`);
  console.log(`评分: ${analysis.score}/100`);

  if (analysis.score >= 80) {
    console.log('评级: ✅ 优秀');
  } else if (analysis.score >= 60) {
    console.log('评级: ⚠️  良好');
  } else {
    console.log('评级: ❌ 需要优化');
  }

  console.log(`\n建议:`);
  analysis.recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });
  console.log('');
}

async function handleBottlenecks() {
  const bottlenecks = perfMonitor.identifyBottlenecks();

  console.log(`\n🔍 性能瓶颈:\n`);

  if (bottlenecks.length === 0) {
    console.log('✅ 未发现明显瓶颈\n');
    return;
  }

  bottlenecks.forEach((b, index) => {
    console.log(`  ${index + 1}. ${b.type}`);
    console.log(`     严重度: ${b.severity}`);
    console.log(`     影响: ${b.impact}`);
    console.log(`     建议: ${b.suggestion}\n`);
  });
}

async function handleExport(filePath) {
  const path = filePath || 'perf-report.json';
  const result = perfMonitor.exportReport(path);

  if (result.success) {
    console.log(`\n✅ 报告已导出到: ${path}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function showHelp() {
  console.log(`
📊 性能分析器 - 帮助

监控命令执行时间和资源使用情况，识别性能瓶颈。

子命令:
  /perf start [label]           开始性能监控
  /perf stop [label]             停止监控并显示报告
  /perf report [label]           查看详细报告
  /perf history [limit]          查看历史记录
  /perf compare <label1> <lbl2>  比较两个会话
  /perf analyze [label]          分析性能并提供建议
  /perf bottlenecks              识别性能瓶颈
  /perf export [file]            导出报告

示例:
  /perf start session1
  /perf stop session1
  /perf report session1
  /perf compare session1 session2
  /perf bottlenecks

提示:
  - 使用label区分不同的监控会话
  - 定期检查瓶颈以优化性能
  - 对比不同版本的性能变化
`);
}
