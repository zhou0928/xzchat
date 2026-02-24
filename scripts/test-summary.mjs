#!/usr/bin/env node

/**
 * 测试摘要脚本
 * 运行测试并生成简洁的摘要报告
 */

import { execSync } from 'node:child_process';

console.log('\n🔍 开始运行完整测试套件...\n');

try {
  // 运行测试
  const output = execSync('npm test -- --run', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

  // 解析输出
  const testFileMatch = output.match(/Test Files\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed\s*\((\d+)\)/);
  const testMatch = output.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed\s*\((\d+)\)/);
  const errorMatch = output.match(/Errors\s+(\d+)\s+errors/);

  if (testFileMatch && testMatch) {
    const [, failedFiles, passedFiles, totalFiles] = testFileMatch;
    const [, failedTests, passedTests, totalTests] = testMatch;
    const errorCount = errorMatch ? errorMatch[1] : 0;

    console.log('\n' + '='.repeat(80));
    console.log('📊 测试结果摘要');
    console.log('='.repeat(80));

    // 测试文件
    console.log('\n📁 测试文件:');
    console.log(`   总计:     ${totalFiles}`);
    console.log(`   ✅ 通过:   ${passedFiles}`);
    console.log(`   ❌ 失败:   ${failedFiles}`);
    console.log(`   📊 通过率: ${((passedFiles / totalFiles) * 100).toFixed(1)}%`);

    // 测试用例
    console.log('\n🧪 测试用例:');
    console.log(`   总计:     ${totalTests}`);
    console.log(`   ✅ 通过:   ${passedTests}`);
    console.log(`   ❌ 失败:   ${failedTests}`);
    console.log(`   📊 通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    // 错误
    if (errorCount > 0) {
      console.log(`\n⚠️  错误:     ${errorCount}`);
    }

    // 状态判断
    console.log('\n' + '='.repeat(80));
    const allPassed = failedFiles === '0' && failedTests === '0';
    if (allPassed) {
      console.log('\n✅ 所有测试通过！\n');
    } else {
      console.log('\n❌ 存在失败的测试，请查看详细日志。\n');
    }
    console.log('='.repeat(80) + '\n');

    process.exit(allPassed ? 0 : 1);
  } else {
    console.log('\n❌ 无法解析测试输出\n');
    process.exit(1);
  }
} catch (error) {
  console.log('\n❌ 测试执行失败:\n');
  console.log(error.message);
  console.log('\n请检查完整的测试输出。\n');
  process.exit(1);
}
