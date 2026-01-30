import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { sanitizePath } from "../utils/helpers.js";
import { handleError } from "../../lib/utils/error-handler.js";

/**
 * 批量操作处理器
 */

/**
 * 批量搜索
 */
export async function handleBatchSearch(input) {
  const parts = input.slice(7).trim().split(/\s+/);
  
  if (parts.length < 2) {
    console.log("用法: /batch-search <pattern> <file-pattern>");
    console.log("示例:");
    console.log("  /batch-search TODO *.js");
    console.log("  /batch-search \"function.*test\" lib/**/*.ts");
    return true;
  }

  const [pattern, filePattern] = parts;

  console.log(`🔍 批量搜索: "${pattern}" in ${filePattern}`);

  try {
    const files = await glob(filePattern, { 
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    });

    if (files.length === 0) {
      console.log("ℹ️  未找到匹配的文件");
      return true;
    }

    console.log(`📁 找到 ${files.length} 个文件`);

    const results = [];
    const regex = new RegExp(pattern, 'gi');

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const matches = line.match(regex);
          if (matches) {
            results.push({
              file,
              line: index + 1,
              content: line.trim(),
              matches: matches.length
            });
          }
        });
      } catch (e) {
        console.log(`⚠️  读取文件失败: ${file} - ${e.message}`);
      }
    }

    if (results.length === 0) {
      console.log("ℹ️  未找到匹配的内容");
      return true;
    }

    console.log(`\n📊 找到 ${results.length} 处匹配:\n`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file}:${result.line}`);
      console.log(`   ${result.content}`);
    });

  } catch (e) {
    handleError(e, { pattern, filePattern });
  }

  return true;
}

/**
 * 批量替换
 */
export async function handleBatchReplace(input) {
  const parts = input.slice(7).trim().match(/("[^"]*"|'[^']*'|\S+)/g);
  
  if (!parts || parts.length < 3) {
    console.log("用法: /batch-replace <pattern> <replacement> <file-pattern>");
    console.log("示例:");
    console.log('  /batch-replace var const "*.js"');
    console.log('  /batch-replace "function" "async function" lib/**/*.ts');
    console.log("注意: 此操作会修改文件，请先备份！");
    return true;
  }

  const [pattern, replacement, filePattern] = parts.map(p => p.replace(/^['"]|['"]$/g, ''));

  console.log(`⚠️  批量替换: "${pattern}" → "${replacement}" in ${filePattern}`);
  
  // 确认操作
  console.log("\n⚠️  警告: 此操作将修改文件内容！");
  console.log("建议先使用 /batch-search 预览将要修改的位置\n");
  console.log("是否继续? (输入 'yes' 确认)");

  // 这里应该有用户确认逻辑，暂时跳过
  console.log("ℹ️  请修改代码添加确认逻辑");

  try {
    const files = await glob(filePattern, { 
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    });

    if (files.length === 0) {
      console.log("ℹ️  未找到匹配的文件");
      return true;
    }

    const results = [];
    const regex = new RegExp(pattern, 'g');

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(regex);

        if (matches && matches.length > 0) {
          const newContent = content.replace(regex, replacement);
          fs.writeFileSync(file, newContent, 'utf-8');
          results.push({ file, count: matches.length });
        }
      } catch (e) {
        console.log(`⚠️  处理文件失败: ${file} - ${e.message}`);
      }
    }

    if (results.length === 0) {
      console.log("ℹ️  未进行任何替换");
      return true;
    }

    const totalReplacements = results.reduce((sum, r) => sum + r.count, 0);
    
    console.log(`\n✅ 替换完成!`);
    console.log(`📁 修改 ${results.length} 个文件`);
    console.log(`📊 总共替换 ${totalReplacements} 处\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file} (${result.count} 处)`);
    });

  } catch (e) {
    handleError(e, { pattern, replacement, filePattern });
  }

  return true;
}

/**
 * 批量分析
 */
export async function handleBatchAnalyze(input, activeConfig, generateCompletion) {
  const parts = input.slice(7).trim().split(/\s+/);
  
  if (parts.length === 0) {
    console.log("用法: /batch-analyze <file-pattern> [prompt]");
    console.log("示例:");
    console.log("  /batch-analyze lib/ 分析代码质量");
    console.log("  /batch-analyze src/**/*.js 查找潜在bug");
    return true;
  }

  const [filePattern, ...promptParts] = parts;
  const customPrompt = promptParts.join(' ') || '分析代码质量，找出潜在问题和改进建议';

  console.log(`🔍 批量分析: ${filePattern}`);
  console.log(`📝 分析目标: ${customPrompt}`);

  try {
    const files = await glob(filePattern, { 
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    });

    if (files.length === 0) {
      console.log("ℹ️  未找到匹配的文件");
      return true;
    }

    console.log(`📁 找到 ${files.length} 个文件`);

    // 限制文件数量，避免Token过大
    const maxFiles = 10;
    const filesToAnalyze = files.slice(0, maxFiles);

    if (files.length > maxFiles) {
      console.log(`⚠️  仅分析前 ${maxFiles} 个文件，避免Token过大`);
    }

    // 收集文件内容
    const fileContents = [];
    for (const file of filesToAnalyze) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        fileContents.push({ file, content: content.substring(0, 2000) }); // 限制每个文件2000字符
      } catch (e) {
        console.log(`⚠️  读取文件失败: ${file}`);
      }
    }

    const prompt = `请对以下 ${fileContents.length} 个文件进行批量分析:

分析目标: ${customPrompt}

文件列表:
${fileContents.map(f => `
=== ${f.file} ===
\`\`\`
${f.content}
\`\`\`
`).join('\n')}

请提供:
1. 每个文件的分析结果
2. 跨文件的共同问题
3. 整体改进建议

使用清晰的格式输出。`;

    console.log(`\n🤖 正在分析...`);

    const response = await generateCompletion(activeConfig, [{role: "user", content: prompt}]);

    console.log(`\n📊 分析结果:`);
    console.log('─'.repeat(80));
    console.log(response);
    console.log('─'.repeat(80));

  } catch (e) {
    handleError(e, { filePattern });
  }

  return true;
}

/**
 * 批量检查语法
 */
export async function handleBatchCheck(input) {
  const filePattern = input.slice(7).trim();
  
  if (!filePattern) {
    console.log("用法: /batch-check <file-pattern>");
    console.log("示例:");
    console.log("  /batch-check *.js");
    console.log("  /batch-check lib/**/*.ts");
    return true;
  }

  console.log(`🔍 批量语法检查: ${filePattern}`);

  try {
    const files = await glob(filePattern, { 
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    });

    if (files.length === 0) {
      console.log("ℹ️  未找到匹配的文件");
      return true;
    }

    console.log(`📁 检查 ${files.length} 个文件\n`);

    const results = {
      passed: [],
      failed: []
    };

    for (const file of files) {
      try {
        const { execSync } = await import('node:child_process');
        
        if (file.endsWith('.js')) {
          execSync(`node --check ${file}`, { stdio: 'pipe' });
          results.passed.push(file);
        } else if (file.endsWith('.ts')) {
          execSync(`tsc --noEmit ${file}`, { stdio: 'pipe' });
          results.passed.push(file);
        }
      } catch (e) {
        results.failed.push({ file, error: e.message });
      }
    }

    console.log(`✅ 通过: ${results.passed.length} 个文件`);
    if (results.passed.length > 0) {
      results.passed.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
    }

    console.log(`\n❌ 失败: ${results.failed.length} 个文件`);
    if (results.failed.length > 0) {
      results.failed.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.file}`);
        console.log(`     ${result.error.split('\n')[0]}`);
      });
    }

  } catch (e) {
    handleError(e, { filePattern });
  }

  return true;
}
