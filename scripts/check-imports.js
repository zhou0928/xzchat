/**
 * 快速导入检查脚本 - 检查所有V3.1.1命令和工具库的导入
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

async function checkImports() {
  let commandErrors = [];
  let utilErrors = [];

  console.log('🔍 检查命令导入...\n');

  for (const cmd of commands) {
    try {
      const module = await import(`./bin/commands/${cmd}.js`);
      if (module.handle && typeof module.handle === 'function') {
        console.log(`✅ ${cmd}.js - 导入成功`);
      } else {
        commandErrors.push(`${cmd}.js - 缺少handle函数`);
        console.log(`❌ ${cmd}.js - 缺少handle函数`);
      }
    } catch (error) {
      commandErrors.push(`${cmd}.js - ${error.message}`);
      console.log(`❌ ${cmd}.js - ${error.message}`);
    }
  }

  console.log('\n🔍 检查工具库导入...\n');

  for (const util of utils) {
    try {
      const module = await import(`./lib/utils/${util}.js`);
      if (module.default && typeof module.default === 'function') {
        console.log(`✅ ${util}.js - 导入成功`);
      } else {
        utilErrors.push(`${util}.js - 缺少默认导出`);
        console.log(`❌ ${util}.js - 缺少默认导出`);
      }
    } catch (error) {
      utilErrors.push(`${util}.js - ${error.message}`);
      console.log(`❌ ${util}.js - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 统计结果:`);
  console.log(`   命令: ${commands.length - commandErrors.length}/${commands.length} 成功`);
  console.log(`   工具库: ${utils.length - utilErrors.length}/${utils.length} 成功`);
  
  if (commandErrors.length > 0 || utilErrors.length > 0) {
    console.log('\n❌ 存在以下问题:');
    if (commandErrors.length > 0) {
      console.log('命令错误:');
      commandErrors.forEach(e => console.log(`  - ${e}`));
    }
    if (utilErrors.length > 0) {
      console.log('工具库错误:');
      utilErrors.forEach(e => console.log(`  - ${e}`));
    }
    process.exit(1);
  } else {
    console.log('\n✅ 所有检查通过！');
    process.exit(0);
  }
}

checkImports().catch(console.error);
