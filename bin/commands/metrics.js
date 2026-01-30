import { MetricsManager } from '../../lib/utils/metrics.js';

const metricsManager = new MetricsManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'record':
        handleRecord(params[0], parseFloat(params[1]), params[2]);
        break;
      case 'get':
        handleGet(params[0], params[1]);
        break;
      case 'stats':
        handleStats(params[0], params[1]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`指标操作失败: ${error.message}`);
  }
};

function handleRecord(name, value, tags) {
  if (!name || isNaN(value)) {
    console.error('错误: 请提供名称和数值');
    console.log('用法: /metrics record <name> <value> [tags]');
    return;
  }
  const tagObj = tags ? JSON.parse(tags) : {};
  metricsManager.recordMetric(name, value, tagObj);
  console.log('\n✅ 指标记录成功\n');
}

function handleGet(name, timeRange) {
  const metrics = metricsManager.getMetrics(name, timeRange);
  console.log(`\n📊 指标数据 (${metrics.length}条):\n`);
  metrics.slice(0, 20).forEach(m => {
    console.log(`  ${m.name}: ${m.value} (${new Date(m.timestamp).toLocaleString('zh-CN')})`);
  });
  console.log('');
}

function handleStats(name, timeRange) {
  const stats = metricsManager.getStats(name, timeRange);
  if (!stats) {
    console.log('\n暂无统计数据\n');
    return;
  }
  console.log('\n📈 统计信息:\n');
  console.log(`  数量: ${stats.count}`);
  console.log(`  最小: ${stats.min}`);
  console.log(`  最大: ${stats.max}`);
  console.log(`  平均: ${stats.avg.toFixed(2)}`);
  console.log(`  总和: ${stats.sum}`);
  console.log('');
}

function showHelp() {
  console.log(`
📊 性能指标 - 帮助

记录和分析性能指标。

子命令:
  /metrics record <name> <value> [tags]   记录指标
  /metrics get [name] [range]              获取指标
  /metrics stats [name] [range]            查看统计

时间范围: 1h, 24h, 7d

示例:
  /metrics record response_time 120
  /metrics stats response_time 24h
  /metrics get

文档: /metrics help
`);
}
