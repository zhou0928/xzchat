#!/usr/bin/env node

/**
 * 功能可用性测试脚本
 * 快速检测哪些命令功能可用，哪些是占位符实现
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 命令列表（基于 command-registry.js）
const commands = [
  // P0 - 核心功能
  { name: '/ask', file: 'bin/commands/ask.js', priority: 'P0' },
  { name: '/secret', file: 'bin/commands/secret.js', priority: 'P0' },
  { name: '/audit', file: 'bin/commands/audit.js', priority: 'P0' },
  { name: '/review', file: 'bin/commands/review.js', priority: 'P0' },
  { name: '/notification', file: 'bin/commands/notification.js', priority: 'P0' },

  // P1 - 高优先级
  { name: '/docker', file: 'bin/commands/docker.js', priority: 'P1' },
  { name: '/k8s', file: 'bin/commands/k8s.js', priority: 'P1' },
  { name: '/ci-cd', file: 'bin/commands/ci-cd.js', priority: 'P1' },
  { name: '/integration', file: 'bin/commands/integration.js', priority: 'P1' },
  { name: '/pipeline', file: 'bin/commands/pipeline.js', priority: 'P1' },
  { name: '/webhook', file: 'bin/commands/webhook.js', priority: 'P1' },

  // P2 - 中优先级
  { name: '/scheduler', file: 'bin/commands/scheduler.js', priority: 'P2' },
  { name: '/theme-custom', file: 'bin/commands/theme-custom.js', priority: 'P2' },
  { name: '/layout', file: 'bin/commands/layout.js', priority: 'P2' },
  { name: '/import', file: 'bin/commands/import.js', priority: 'P2' },
  { name: '/export-advanced', file: 'bin/commands/export-advanced.js', priority: 'P2' },
  { name: '/archive', file: 'bin/commands/archive.js', priority: 'P2' },

  // P3 - 低优先级
  { name: '/test-runner', file: 'bin/commands/test-runner.js', priority: 'P3' },
  { name: '/coverage', file: 'bin/commands/coverage.js', priority: 'P3' },
  { name: '/mock', file: 'bin/commands/mock.js', priority: 'P3' },
  { name: '/fixture', file: 'bin/commands/fixture.js', priority: 'P3' },
  { name: '/docs', file: 'bin/commands/docs.js', priority: 'P3' },
  { name: '/api-docs', file: 'bin/commands/api-docs.js', priority: 'P3' },
  { name: '/changelog', file: 'bin/commands/changelog.js', priority: 'P3' },
  { name: '/release-notes', file: 'bin/commands/release-notes.js', priority: 'P3' },
];

// 检测占位符实现的关键词
const placeholderPatterns = [
  /TODO|FIXME|NotImplemented/i,
  /setTimeout.*\d+\s*\)/, // 模拟延时
  /console\.log.*模拟|placeholder|占位/i,
  /\/\/\s*.*模拟|mock\s*=\s*true/i,
  /throw new Error\(['"]Not implemented/i,
  /console\.(log|info|warn).*\[.*功能未实现/i,
];

// 检测真实实现的关键词
const realImplementationPatterns = [
  /import\s+.*from\s+['"]\.\/utils\/|['"]\.\.\/lib\/utils\//,
  /execSync\(|spawn\(/,
  /fetch\(|axios|http\.request/,
  /await\s+\w+\.execute\(|\.run\(|\.send\(/,
  /new \w+Manager\(\)/,
];

function analyzeCommand(cmd) {
  const filePath = join(projectRoot, cmd.file);

  if (!existsSync(filePath)) {
    return {
      ...cmd,
      status: 'MISSING',
      reason: '文件不存在'
    };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');

    // 检查是否有占位符
    const hasPlaceholder = placeholderPatterns.some(pattern => pattern.test(content));
    const hasRealImplementation = realImplementationPatterns.some(pattern => pattern.test(content));

    // 分析实际功能
    let status = 'PARTIAL';
    let reason = '';

    if (hasPlaceholder && !hasRealImplementation) {
      status = 'PLACEHOLDER';
      reason = '仅占位符实现';
    } else if (hasRealImplementation) {
      status = 'FUNCTIONAL';
      reason = '有实际实现';
    } else {
      status = 'PARTIAL';
      reason = '部分实现';
    }

    return {
      ...cmd,
      status,
      reason,
      hasPlaceholder,
      hasRealImplementation
    };
  } catch (error) {
    return {
      ...cmd,
      status: 'ERROR',
      reason: `读取失败: ${error.message}`
    };
  }
}

function printReport(results) {
  console.log('\n📊 xzChat 功能可用性测试报告\n');
  console.log('=' .repeat(80));

  const p0Results = results.filter(r => r.priority === 'P0');
  const p1Results = results.filter(r => r.priority === 'P1');
  const p2Results = results.filter(r => r.priority === 'P2');
  const p3Results = results.filter(r => r.priority === 'P3');

  // P0 - 核心功能
  console.log('\n🔴 P0 - 核心功能（必须修复）\n');
  printCategory(p0Results);

  // P1 - 高优先级
  console.log('\n🟡 P1 - 高优先级（建议修复）\n');
  printCategory(p1Results);

  // P2 - 中优先级
  console.log('\n🟢 P2 - 中优先级（增强功能）\n');
  printCategory(p2Results);

  // P3 - 低优先级
  console.log('\n⚪ P3 - 低优先级（辅助功能）\n');
  printCategory(p3Results);

  // 统计
  const stats = {
    total: results.length,
    functional: results.filter(r => r.status === 'FUNCTIONAL').length,
    placeholder: results.filter(r => r.status === 'PLACEHOLDER').length,
    partial: results.filter(r => r.status === 'PARTIAL').length,
    missing: results.filter(r => r.status === 'MISSING').length,
    error: results.filter(r => r.status === 'ERROR').length,
  };

  console.log('\n' + '='.repeat(80));
  console.log('\n📈 统计摘要\n');
  console.log(`  总计:         ${stats.total} 个命令`);
  console.log(`  ✅ 可用:       ${stats.functional} 个 (${((stats.functional/stats.total)*100).toFixed(1)}%)`);
  console.log(`  ⚠️  占位符:      ${stats.placeholder} 个 (${((stats.placeholder/stats.total)*100).toFixed(1)}%)`);
  console.log(`  🔶 部分实现:    ${stats.partial} 个 (${((stats.partial/stats.total)*100).toFixed(1)}%)`);
  console.log(`  ❌ 缺失/错误:   ${stats.missing + stats.error} 个`);

  if (stats.placeholder > 0 || stats.partial > 0) {
    console.log('\n💡 建议:');
    console.log('  1. 优先修复 P0 和 P1 级别的命令');
    console.log('  2. 查看占位符标记的命令实现');
    console.log('  3. 补充真实的 API 调用和业务逻辑');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

function printCategory(results) {
  if (results.length === 0) {
    console.log('  (无命令)\n');
    return;
  }

  results.forEach(result => {
    const statusIcon = {
      'FUNCTIONAL': '✅',
      'PARTIAL': '🔶',
      'PLACEHOLDER': '⚠️',
      'MISSING': '❌',
      'ERROR': '💥'
    }[result.status];

    console.log(`  ${statusIcon} ${result.name.padEnd(20)} ${result.status.padEnd(12)} - ${result.reason}`);
  });
}

// 主函数
function main() {
  const results = commands.map(analyzeCommand);
  printReport(results);

  // 退出码
  const hasIssues = results.some(r =>
    r.status === 'PLACEHOLDER' ||
    r.status === 'MISSING' ||
    r.status === 'ERROR'
  );

  process.exit(hasIssues ? 1 : 0);
}

main();
