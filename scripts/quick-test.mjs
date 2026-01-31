#!/usr/bin/env node
/**
 * 快速测试脚本 - 测试所有V3.1.1命令的导入
 */

const commands = [
  'scheduler', 'pipeline', 'integration', 'webhook', 'secret', 'audit',
  'theme-custom', 'layout',
  'import', 'export-advanced', 'archive',
  'test-runner', 'coverage', 'mock', 'fixture',
  'docs', 'api-docs', 'changelog', 'release-notes',
  'review', 'notification'
];

const utils = [
  'scheduler', 'pipeline', 'integration', 'webhook', 'secret', 'audit',
  'theme-custom', 'layout',
  'import', 'export-advanced', 'archive',
  'test-runner', 'coverage', 'mock', 'fixture',
  'docs', 'api-docs', 'changelog', 'release-notes',
  'review', 'notification'
];

async function testCommand(cmd) {
  try {
    const module = await import(`../bin/commands/${cmd}.js`);
    if (module.handle && typeof module.handle === 'function') {
      return { success: true, name: cmd };
    }
    return { success: false, name: cmd, error: 'Missing handle function' };
  } catch (error) {
    return { success: false, name: cmd, error: error.message };
  }
}

async function testUtil(util) {
  try {
    const module = await import(`../lib/utils/${util}.js`);
    if (module.default && typeof module.default === 'function') {
      return { success: true, name: util };
    }
    return { success: false, name: util, error: 'Missing default export' };
  } catch (error) {
    return { success: false, name: util, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 快速测试 - V3.1.1 命令和工具库\n');

  console.log('测试命令导入...');
  const cmdResults = [];
  for (const cmd of commands) {
    const result = await testCommand(cmd);
    cmdResults.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${cmd}.js ${result.error ? '- ' + result.error.substring(0, 50) : ''}`);
  }

  console.log('\n测试工具库导入...');
  const utilResults = [];
  for (const util of utils) {
    const result = await testUtil(util);
    utilResults.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${util}.js ${result.error ? '- ' + result.error.substring(0, 50) : ''}`);
  }

  console.log('\n' + '='.repeat(60));
  const cmdSuccess = cmdResults.filter(r => r.success).length;
  const utilSuccess = utilResults.filter(r => r.success).length;

  console.log(`📊 测试结果:`);
  console.log(`   命令: ${cmdSuccess}/${commands.length} 成功 (${Math.round(cmdSuccess/commands.length*100)}%)`);
  console.log(`   工具库: ${utilSuccess}/${utils.length} 成功 (${Math.round(utilSuccess/utils.length*100)}%)`);

  if (cmdSuccess < commands.length || utilSuccess < utils.length) {
    console.log('\n❌ 失败的测试:');
    [...cmdResults, ...utilResults]
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.name}: ${r.error.substring(0, 80)}`));
    process.exit(1);
  } else {
    console.log('\n✅ 所有测试通过！');
    process.exit(0);
  }
}

runTests().catch(console.error);
