import { DebugHelper } from "../../lib/utils/debug.js";

/**
 * 调试助手
 * 智能错误分析和调试工具
 */

const debugHelper = new DebugHelper();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'analyze':
        await handleAnalyze(params[0], params[1]);
        break;

      case 'trace':
        await handleTrace(params[0]);
        break;

      case 'breakpoint':
        await handleBreakpoint(params[0], params[1]);
        break;

      case 'log':
        await handleLog(params[0], params[1]);
        break;

      case 'history':
        await handleHistory(params[0]);
        break;

      case 'suggest':
        await handleSuggest(params[0]);
        break;

      case 'fix':
        await handleFix(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`调试操作失败: ${error.message}`);
  }
};

async function handleAnalyze(error, code) {
  const result = debugHelper.analyzeError(error, code);

  console.log(`\n🔍 错误分析\n`);
  console.log(`类型: ${result.type}`);
  console.log(`位置: ${result.location}`);
  console.log(`描述: ${result.description}\n`);

  if (result.suggestions.length > 0) {
    console.log('建议解决方案:');
    result.suggestions.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s}`);
    });
    console.log('');
  }
}

async function handleTrace(file) {
  if (!file) {
    console.error('错误: 请提供文件路径');
    return;
  }

  const trace = await debugHelper.generateTrace(file);

  console.log(`\n📜 代码追踪: ${file}\n`);
  trace.lines.forEach(line => {
    console.log(`  ${line.number}: ${line.code}`);
  });

  console.log(`\n函数调用路径:`);
  trace.calls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${call}`);
  });
  console.log('');
}

async function handleBreakpoint(file, line) {
  if (!file || !line) {
    console.error('错误: 请提供文件和行号');
    console.log('用法: /debug breakpoint <file> <line>');
    return;
  }

  const result = debugHelper.addBreakpoint(file, parseInt(line));

  if (result.success) {
    console.log(`\n✅ 断点已设置: ${file}:${line}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleLog(type, content) {
  if (!type || !content) {
    console.error('错误: 请提供日志类型和内容');
    console.log('用法: /debug log <type> <content>');
    return;
  }

  debugHelper.log(type, content);
  console.log(`\n📝 日志已记录: [${type}] ${content}\n`);
}

async function handleHistory(limit) {
  const history = debugHelper.getHistory(parseInt(limit) || 10);

  if (history.length === 0) {
    console.log('\n暂无调试历史\n');
    return;
  }

  console.log(`\n📜 调试历史\n`);
  history.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.timestamp}`);
    console.log(`     ${h.type}: ${h.message}\n`);
  });
}

async function handleSuggest(error) {
  const suggestions = debugHelper.getFixSuggestions(error);

  console.log(`\n💡 修复建议\n`);
  suggestions.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.title}`);
    console.log(`     ${s.description}\n`);
  });
}

async function handleFix(error) {
  const fix = debugHelper.generateFix(error);

  if (!fix) {
    console.error('\n❌ 无法生成修复方案\n');
    return;
  }

  console.log(`\n🔧 修复方案\n`);
  console.log(fix.code);
  console.log(`\n说明: ${fix.explanation}\n`);
}

function showHelp() {
  console.log(`
🐛 调试助手 - 帮助

智能错误分析和调试工具。

子命令:
  /debug analyze <error> [code]   分析错误
  /debug trace <file>             生成代码追踪
  /debug breakpoint <file> <line>  设置断点
  /debug log <type> <content>      记录日志
  /debug history [limit]           查看历史
  /debug suggest <error>           获取修复建议
  /debug fix <error>               生成修复代码

示例:
  /debug analyze "ReferenceError"
  /debug trace src/index.js
  /debug breakpoint src/utils.js 42
  /debug log error "Something went wrong"
`);
}
