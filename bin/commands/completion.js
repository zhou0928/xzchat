import fs from "node:fs";
import path from "node:path";
import { sanitizePath } from "../utils/helpers.js";
import { handleError } from "../../lib/utils/error-handler.js";

/**
 * 代码补全处理器
 */
export async function handleComplete(input, activeConfig, generateCompletion) {
  const parts = input.slice(9).trim().split(':');

  if (parts.length === 0) {
    console.log("用法: /complete <file>:<line>  或  /complete <file>");
    console.log("示例:");
    console.log("  /complete src/index.js:25   # 补全第25行");
    console.log("  /complete src/utils.ts       # 补全整个文件");
    return true;
  }

  let filePath = parts[0];
  let lineNumber = null;

  if (parts.length > 1) {
    lineNumber = parseInt(parts[1], 10);
    if (isNaN(lineNumber)) {
      console.log("❌ 无效的行号");
      return true;
    }
  }

  try {
    filePath = sanitizePath(filePath);
  } catch (e) {
    console.log(`❌ 路径错误: ${e.message}`);
    return true;
  }

  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return true;
  }

  // 读取文件内容
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.log(`❌ 读取文件失败: ${e.message}`);
    return true;
  }

  // 获取文件上下文
  const context = getContext(content, lineNumber);

  console.log(`🔍 正在补全: ${path.basename(filePath)}${lineNumber ? `:${lineNumber}` : ''}`);
  console.log(`📝 上下文: ${context.preview}...`);

  // 构建补全提示
  const prompt = `你是一个智能代码补全助手。请根据以下代码上下文提供补全建议。

文件: ${path.basename(filePath)}
行号: ${lineNumber || '全文'}

代码上下文:
\`\`\`
${context.before}
${context.current ? `→ ${context.current}` : ''}
${context.after}
\`\`\`

要求:
1. 只提供补全的代码，不要解释
2. 保持代码风格一致
3. 如果有语法错误，先修复再补全
4. 返回 2-3 个不同的补全方案，用 === 分隔

请提供补全:`;

  try {
    const response = await generateCompletion(activeConfig, [{role: "user", content: prompt}]);

    console.log(`\n✨ 补全建议:`);
    console.log('─'.repeat(60));

    // 分割多个补全方案
    const suggestions = response.split('===').map(s => s.trim()).filter(s => s);

    suggestions.forEach((suggestion, index) => {
      console.log(`\n【方案 ${index + 1}】`);
      console.log(suggestion);
    });

    console.log('\n' + '─'.repeat(60));

  } catch (e) {
    handleError(e, { filePath, lineNumber });
    return true;
  }

  return true;
}

/**
 * 获取代码上下文
 */
function getContext(content, lineNumber) {
  const lines = content.split('\n');

  if (lineNumber === null) {
    // 获取最后20行
    const lastLines = lines.slice(-20);
    return {
      before: lastLines.slice(0, -5).join('\n'),
      current: lastLines.slice(-5).join('\n'),
      after: '',
      preview: lastLines.slice(-3).join('\n').substring(0, 50)
    };
  }

  // 获取指定行的上下文
  const contextSize = 10;
  const startLine = Math.max(0, lineNumber - contextSize);
  const endLine = Math.min(lines.length, lineNumber + contextSize);

  const before = lines.slice(startLine, lineNumber).join('\n');
  const current = lineNumber < lines.length ? lines[lineNumber] : '';
  const after = lines.slice(lineNumber + 1, endLine).join('\n');

  // 生成预览
  const previewLines = lines.slice(Math.max(0, lineNumber - 2), Math.min(lines.length, lineNumber + 3));
  const preview = previewLines.join('\n').substring(0, 80);

  return { before, current, after, preview };
}

/**
 * 实时补全模式（用于编辑器集成）
 */
export async function handleCompleteInline(input, activeConfig, generateCompletion) {
  const content = input.slice(8).trim();

  if (!content) {
    console.log("用法: /complete-inline <code>");
    return true;
  }

  const prompt = `请补全以下代码:

\`\`\`
${content}
\`\`\`

只返回补全的代码，不要解释。`;

  try {
    const response = await generateCompletion(activeConfig, [{role: "user", content: prompt}]);
    console.log(`\n✨ 补全:`);
    console.log('─'.repeat(60));
    console.log(response);
    console.log('─'.repeat(60));
  } catch (e) {
    handleError(e, { content });
  }

  return true;
}
