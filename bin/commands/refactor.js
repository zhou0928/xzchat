import { RefactorEngine } from "../../lib/utils/refactor.js";

/**
 * 代码重构助手
 * 智能识别代码异味并提供重构建议
 */

const refactorEngine = new RefactorEngine();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'analyze':
        await handleAnalyze(params[0]);
        break;

      case 'suggest':
        await handleSuggest(params[0], params[1]);
        break;

      case 'apply':
        await handleApply(params[0], params[1], params[2]);
        break;

      case 'dry-run':
        await handleDryRun(params[0]);
        break;

      case 'patterns':
        await handlePatterns();
        break;

      case 'history':
        await handleHistory(params[0]);
        break;

      case 'stats':
        await handleStats();
        break;

      case 'check':
        await handleCheck(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`代码重构操作失败: ${error.message}`);
  }
};

/**
 * 分析代码
 */
async function handleAnalyze(filePath) {
  if (!filePath) {
    console.error('错误: 请提供文件路径');
    console.log('用法: /refactor analyze <filepath>');
    return;
  }

  const result = await refactorEngine.analyzeFile(filePath);

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  console.log(`\n📊 代码分析结果: ${filePath}\n`);
  console.log(`文件大小: ${result.stats.lines} 行, ${result.stats.size} 字节`);
  console.log(`函数数量: ${result.stats.functions}`);
  console.log(`类数量: ${result.stats.classes}`);
  console.log(`复杂度: ${result.stats.complexity}\n`);

  if (result.smells.length === 0) {
    console.log('✅ 未发现代码异味\n');
    return;
  }

  console.log(`发现 ${result.smells.length} 个问题:\n`);
  result.smells.forEach((smell, index) => {
    console.log(`  ${index + 1}. ${smell.type}`);
    console.log(`     位置: ${smell.location}`);
    console.log(`     严重度: ${smell.severity}`);
    console.log(`     描述: ${smell.message}\n`);
  });

  console.log('提示: 使用 /refactor suggest <file> 查看重构建议');
}

/**
 * 获取重构建议
 */
async function handleSuggest(filePath, pattern) {
  if (!filePath) {
    console.error('错误: 请提供文件路径');
    console.log('用法: /refactor suggest <filepath> [pattern]');
    console.log('提示: 使用 /refactor patterns 查看所有可用模式');
    return;
  }

  const result = await refactorEngine.suggestRefactor(filePath, pattern);

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  console.log(`\n💡 重构建议: ${filePath}\n`);

  if (result.suggestions.length === 0) {
    console.log('✅ 当前代码质量良好，无需重构\n');
    return;
  }

  result.suggestions.forEach((suggestion, index) => {
    console.log(`\n${index + 1}. ${suggestion.pattern}`);
    console.log(`   原因: ${suggestion.reason}`);
    console.log(`   难度: ${suggestion.difficulty}`);
    console.log(`   影响: ${suggestion.impact}`);

    if (suggestion.preview) {
      console.log(`   预览:\n${suggestion.preview}`);
    }
  });

  console.log('\n提示: 使用 /refactor apply <file> <pattern> 执行重构');
}

/**
 * 应用重构
 */
async function handleApply(filePath, pattern, mode) {
  if (!filePath || !pattern) {
    console.error('错误: 请提供文件路径和重构模式');
    console.log('用法: /refactor apply <filepath> <pattern> [--backup] [--dry-run]');
    return;
  }

  const options = {
    backup: mode === '--backup',
    dryRun: mode === '--dry-run'
  };

  if (options.dryRun) {
    const result = await refactorEngine.dryRun(filePath, pattern);
    if (result.success) {
      console.log('\n🔍 预览模式:\n');
      console.log(result.diff);
    }
    return;
  }

  const result = await refactorEngine.applyRefactor(filePath, pattern, options);

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  console.log(`\n✅ 重构完成！\n`);
  console.log(`模式: ${pattern}`);
  console.log(`修改: ${result.changes} 处`);

  if (result.backupPath) {
    console.log(`备份: ${result.backupPath}`);
  }

  console.log('');
}

/**
 * 预览模式
 */
async function handleDryRun(filePath) {
  if (!filePath) {
    console.error('错误: 请提供文件路径');
    console.log('用法: /refactor dry-run <filepath>');
    return;
  }

  const result = await refactorEngine.getFullAnalysis(filePath);

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  console.log(`\n🔍 完整分析预览: ${filePath}\n`);
  console.log('代码异味:');
  result.smells.forEach(s => {
    console.log(`  - ${s.type}: ${s.message}`);
  });

  console.log('\n可用重构:');
  result.suggestions.forEach(s => {
    console.log(`  - ${s.pattern}: ${s.reason}`);
  });

  console.log('');
}

/**
 * 列出所有重构模式
 */
async function handlePatterns() {
  const patterns = refactorEngine.getAvailablePatterns();

  console.log('\n📚 可用重构模式:\n');
  patterns.forEach(pattern => {
    console.log(`  • ${pattern.name}`);
    console.log(`    描述: ${pattern.description}`);
    console.log(`    适用: ${pattern.applicable}`);
    console.log('');
  });
}

/**
 * 查看历史记录
 */
async function handleHistory(limit) {
  const history = refactorEngine.getHistory(parseInt(limit) || 10);

  if (history.length === 0) {
    console.log('\n暂无重构历史\n');
    return;
  }

  console.log(`\n📜 重构历史 (最近 ${history.length} 条):\n`);
  history.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.timestamp}`);
    console.log(`     文件: ${record.file}`);
    console.log(`     模式: ${record.pattern}`);
    console.log(`     状态: ${record.status}`);
    console.log('');
  });
}

/**
 * 查看统计信息
 */
async function handleStats() {
  const stats = refactorEngine.getStats();

  console.log('\n📊 重构统计:\n');
  console.log(`  分析文件: ${stats.filesAnalyzed}`);
  console.log(`  应用重构: ${stats.refactorsApplied}`);
  console.log(`  发现问题: ${stats.issuesFound}`);
  console.log(`  成功率: ${stats.successRate}%`);
  console.log(`  最常用模式: ${stats.topPattern}`);
  console.log('');
}

/**
 * 快速检查
 */
async function handleCheck(filePath) {
  if (!filePath) {
    console.error('错误: 请提供文件路径');
    console.log('用法: /refactor check <filepath>');
    return;
  }

  const result = await refactorEngine.quickCheck(filePath);

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  console.log(`\n✨ 快速检查: ${filePath}\n`);
  console.log(`健康评分: ${result.score}/100`);
  console.log(`问题: ${result.issues} 个`);
  console.log(`建议: ${result.suggestions} 个`);

  if (result.score >= 80) {
    console.log('\n状态: ✅ 优秀');
  } else if (result.score >= 60) {
    console.log('\n状态: ⚠️  需要改进');
  } else {
    console.log('\n状态: ❌ 需要重构');
  }

  console.log('');
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🔧 代码重构助手 - 帮助

智能识别代码异味并提供重构建议，提升代码质量。

子命令:
  /refactor analyze <file>         分析代码质量
  /refactor suggest <file> [pat]   获取重构建议
  /refactor apply <file> <pat>     应用重构
                                    选项: --backup, --dry-run
  /refactor dry-run <file>         预览所有可能的变更
  /refactor patterns                列出所有重构模式
  /refactor history [limit]        查看重构历史
  /refactor stats                   统计信息
  /refactor check <file>            快速质量检查

重构模式:
  - extract-function      提取函数
  - inline-variable       内联变量
  - extract-variable      提取变量
  - rename-variable       重命名变量
  - simplify-conditional  简化条件
  - reduce-nesting        减少嵌套
  - eliminate-duplication 消除重复
  - improve-readability   提升可读性

示例:
  /refactor analyze src/utils.js
  /refactor suggest src/utils.js extract-function
  /refactor apply src/utils.js reduce-nesting --backup
  /refactor check src/utils.js

提示:
  - 使用 --dry-run 预览变更
  - 使用 --backup 创建备份
  - 建议先分析再应用重构
  - 重构前运行 /refactor check 评估影响

文档: /refactor help
`);
}
