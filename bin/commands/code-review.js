import { CodeReviewManager } from '../../lib/utils/code-review.js';

/**
 * 代码审查命令
 * 智能代码审查，支持规则配置和问题跟踪
 */

const reviewManager = new CodeReviewManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'create':
        await handleCreate(params[0], params.slice(1).join(' '));
        break;

      case 'add-issue':
        await handleAddIssue(params);
        break;

      case 'report':
        await handleReport(params[0]);
        break;

      case 'list':
        await handleList();
        break;

      case 'rules':
        await handleRules();
        break;

      case 'enable':
        await handleEnableRule(params[0]);
        break;

      case 'disable':
        await handleDisableRule(params[0]);
        break;

      case 'suggestions':
        await handleSuggestions(params[0]);
        break;

      case 'stats':
        await handleStats();
        break;

      case 'delete':
        await handleDelete(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`代码审查操作失败: ${error.message}`);
  }
};

/**
 * 创建审查
 */
async function handleCreate(file, code) {
  if (!file || !code) {
    console.error('错误: 请提供文件路径和代码');
    console.log('用法: /code-review create <file> <code>');
    return;
  }

  const review = await reviewManager.createReview(file, code);
  console.log(`\n✅ 审查创建成功 (ID: ${review.id})\n`);
  console.log(`  文件: ${review.file}`);
  console.log(`  代码长度: ${code.length} 字符`);
  console.log(`  启用规则: ${review.rules.map(r => r.name).join(', ')}`);
  console.log(`  下一步: 使用 /code-review add-issue ${review.id} 添加问题\n`);
}

/**
 * 添加问题
 */
async function handleAddIssue(params) {
  const reviewId = params[0];
  const ruleId = params[1];
  const description = params.slice(2).join(' ');

  if (!reviewId || !ruleId || !description) {
    console.error('错误: 参数不足');
    console.log('用法: /code-review add-issue <reviewId> <ruleId> <severity> <description>');
    console.log('示例: /code-review add-issue 123 security high 存在SQL注入风险');
    return;
  }

  const issue = {
    ruleId,
    severity: params[2] || 'medium',
    description,
    line: params[3] ? parseInt(params[3]) : null,
    code: params[4] || ''
  };

  const result = await reviewManager.addIssue(reviewId, issue);
  if (result.success) {
    console.log('\n✅ 问题添加成功\n');
    console.log(`  问题ID: ${result.issue.id}`);
    console.log(`  严重性: ${result.issue.severity}`);
    console.log(`  描述: ${result.issue.description}`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 生成报告
 */
async function handleReport(reviewId) {
  if (!reviewId) {
    console.error('错误: 请提供审查ID');
    console.log('用法: /code-review report <reviewId>');
    return;
  }

  const report = reviewManager.getReport(reviewId);

  if (!report.success) {
    console.error(`\n❌ ${report.error}\n`);
    return;
  }

  const { review, issuesBySeverity } = report;

  console.log('\n📋 代码审查报告:\n');
  console.log(`  文件: ${review.file}`);
  console.log(`  评分: ${review.score}/100`);
  console.log(`  问题总数: ${review.issues.length}\n`);

  console.log('  按严重性分类:');
  console.log(`    🔴 严重: ${issuesBySeverity.critical.length}`);
  console.log(`    🟠 高: ${issuesBySeverity.high.length}`);
  console.log(`    🟡 中: ${issuesBySeverity.medium.length}`);
  console.log(`    🟢 低: ${issuesBySeverity.low.length}`);

  if (review.issues.length > 0) {
    console.log('\n  问题详情:');
    review.issues.forEach((issue, index) => {
      const severityIcons = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      };
      console.log(`    ${index + 1}. ${severityIcons[issue.severity]} ${issue.description}`);
      if (issue.line) console.log(`       位置: 第${issue.line}行`);
      if (issue.code) console.log(`       代码: ${issue.code}`);
    });
  }

  console.log('');
}

/**
 * 列出所有审查
 */
async function handleList() {
  const reviews = reviewManager.listReviews();

  if (reviews.length === 0) {
    console.log('\n暂无审查记录。\n');
    return;
  }

  console.log('\n📚 审查列表:\n');
  reviews.forEach((review, index) => {
    console.log(`  ${index + 1}. ${review.file}`);
    console.log(`     ID: ${review.id}`);
    console.log(`     评分: ${review.score}/100`);
    console.log(`     问题数: ${review.issuesCount}`);
    console.log(`     时间: ${new Date(review.timestamp).toLocaleString('zh-CN')}`);
    console.log('');
  });
}

/**
 * 列出规则
 */
async function handleRules() {
  const rules = reviewManager.getRules();

  console.log('\n⚙️  审查规则:\n');
  rules.forEach((rule, index) => {
    const status = rule.enabled ? '✅' : '❌';
    console.log(`  ${index + 1}. ${status} ${rule.name}`);
    console.log(`     ID: ${rule.id}`);
    console.log(`     描述: ${rule.description}`);
    console.log('');
  });
}

/**
 * 启用规则
 */
async function handleEnableRule(ruleId) {
  if (!ruleId) {
    console.error('错误: 请提供规则ID');
    console.log('用法: /code-review enable <ruleId>');
    return;
  }

  const result = await reviewManager.updateRule(ruleId, { enabled: true });
  if (result.success) {
    console.log(`\n✅ 规则 "${result.rule.name}" 已启用\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 禁用规则
 */
async function handleDisableRule(ruleId) {
  if (!ruleId) {
    console.error('错误: 请提供规则ID');
    console.log('用法: /code-review disable <ruleId>');
    return;
  }

  const result = await reviewManager.updateRule(ruleId, { enabled: false });
  if (result.success) {
    console.log(`\n✅ 规则 "${result.rule.name}" 已禁用\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 生成改进建议
 */
async function handleSuggestions(reviewId) {
  if (!reviewId) {
    console.error('错误: 请提供审查ID');
    console.log('用法: /code-review suggestions <reviewId>');
    return;
  }

  const result = reviewManager.generateSuggestions(reviewId);

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  if (result.suggestions.length === 0) {
    console.log('\n暂无改进建议。\n');
    return;
  }

  console.log('\n💡 改进建议:\n');
  result.suggestions.forEach((suggestion, index) => {
    console.log(`  ${index + 1}. ${suggestion.message}`);
    console.log(`     优先级: ${'⭐'.repeat(suggestion.priority)}`);
    console.log('');
  });
}

/**
 * 统计信息
 */
async function handleStats() {
  const stats = reviewManager.getStats();

  console.log('\n📊 代码审查统计:\n');
  console.log(`  总审查数: ${stats.totalReviews}`);
  console.log(`  总问题数: ${stats.totalIssues}`);
  console.log(`  平均评分: ${stats.averageScore}/100`);
  console.log(`  活跃规则数: ${stats.activeRules}`);
  console.log('');
}

/**
 * 删除审查
 */
async function handleDelete(reviewId) {
  if (!reviewId) {
    console.error('错误: 请提供审查ID');
    console.log('用法: /code-review delete <reviewId>');
    return;
  }

  const result = await reviewManager.deleteReview(reviewId);
  if (result.success) {
    console.log('\n✅ 审查已删除\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
🔍 代码审查 - 帮助

智能代码审查，支持规则配置和问题跟踪。

子命令:
  /code-review create <file> <code>          创建新审查
  /code-review add-issue <id> <rule> <sev> <desc>  添加问题
  /code-review report <id>                   生成审查报告
  /code-review list                          列出所有审查
  /code-review rules                         查看审查规则
  /code-review enable <ruleId>               启用规则
  /code-review disable <ruleId>              禁用规则
  /code-review suggestions <id>              生成改进建议
  /code-review stats                         查看统计信息
  /code-review delete <id>                   删除审查

示例:
  /code-review create app.js "function test() { return 1; }"
  /code-review add-issue 123 security high 存在SQL注入风险
  /code-review report 123
  /code-review list

提示:
  - 严重性级别: critical, high, medium, low
  - 支持自定义审查规则
  - 问题可按严重性分类查看
  - 自动计算代码质量评分

文档: /code-review help
`);
}
