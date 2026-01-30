import fs from "node:fs";
import path from "node:path";
import { sanitizePath } from "../utils/helpers.js";
import { getFileList } from "../../lib/tools.js";

/**
 * /scan 或 /当前项目结构 命令
 */
export async function handleScan(input, askQuestion, addToContext) {
  const parts = input.split(/\s+/);
  let scanPath = parts.slice(1).join(" ").trim();

  if (!scanPath) {
    const answer = await askQuestion("扫描当前目录? (y/n) ");
    if (answer.trim().toLowerCase() !== 'y') {
      console.log("🚫 已取消");
      return true;
    }
    scanPath = process.cwd();
  } else {
    try {
      scanPath = sanitizePath(scanPath);
    } catch (e) {
      console.log(`❌ 路径错误: ${e.message}`);
      return true;
    }
  }

  try {
    const structure = await (await import("../../lib/tools.js")).scanDir(scanPath);
    const answer = await askQuestion("加载到上下文? (y/n) ");
    if (answer.trim().toLowerCase() === 'y') {
      addToContext(`(Current Project Structure):\n\`\`\`\n${structure}\n\`\`\``);
      console.log("✅ 项目结构已加载");
      console.log(structure);
    } else {
      console.log("🚫 已取消");
    }
  } catch (e) {
    console.error("❌ 扫描失败:", e.message);
  }
  return true;
}

/**
 * /load 命令 - 加载文件
 */
export async function handleLoad(input, askQuestion, addToContext, rl) {
  let file = input.slice(5).trim();

  // 交互式选择文件
  if (!file) {
    console.log("📂 正在扫描文件...");
    const files = getFileList(process.cwd());
    if (files.length === 0) {
      console.log("⚠️  当前目录没有可加载的文件");
      return true;
    }

    // 分页显示文件
    const pageSize = 20;
    const totalPages = Math.ceil(files.length / pageSize);
    let currentPage = 1;

    while (true) {
      console.log(`\n📄 文件列表 (第 ${currentPage}/${totalPages} 页):`);
      const start = (currentPage - 1) * pageSize;
      const end = Math.min(start + pageSize, files.length);

      for (let i = start; i < end; i++) {
        console.log(`[${i + 1}] ${files[i]}`);
      }

      if (totalPages > 1) {
        console.log("\n(n: 下一页, p: 上一页, q: 取消)");
      }

      const answer = await askQuestion("\n请输入序号或操作: ");
      const choice = answer.trim().toLowerCase();

      if (choice === 'q') {
        console.log("🚫 已取消");
        return true;
      } else if (choice === 'n' && currentPage < totalPages) {
        currentPage++;
      } else if (choice === 'p' && currentPage > 1) {
        currentPage--;
      } else {
        const idx = parseInt(choice);
        if (!isNaN(idx) && idx >= 1 && idx <= files.length) {
          file = files[idx - 1];
          break;
        } else {
          console.log("❌ 无效的选择");
        }
      }
    }
  }

  let filepath;
  try {
    filepath = sanitizePath(file);
  } catch (e) {
    console.log(`❌ 路径错误: ${e.message}`);
    return true;
  }
  if (!fs.existsSync(filepath)) {
    console.log("❌ 文件不存在");
    return true;
  }

  const ext = path.extname(filepath).toLowerCase();
  let content = "";

  if (ext === ".pdf") {
    console.log("📄 正在解析 PDF...");
    try {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const buffer = fs.readFileSync(filepath);
      const data = await pdfParse(buffer);
      content = data.text.trim();
      if (!content) {
        console.log("⚠️  PDF 内容为空或无法提取文本");
        return true;
      }
    } catch (e) {
      console.log(`❌ PDF 解析失败: ${e.message}`);
      return true;
    }
  } else {
    const stats = fs.statSync(filepath);
    if (stats.size > 50 * 1024) { // 50KB
      console.log(`⚠️  文件较大 (${(stats.size/1024).toFixed(1)}KB)`);
      console.log("1. 加载前 10KB (推荐)");
      console.log("2. 加载全部 (可能消耗大量 Token)");

      const ans = await askQuestion("请选择 (1/2): ");
      if (ans.trim() === '1') {
        content = fs.readFileSync(filepath, "utf-8").slice(0, 10240);
      } else {
        content = fs.readFileSync(filepath, "utf-8");
      }
    } else {
      content = fs.readFileSync(filepath, "utf-8");
    }
  }

  addToContext(`(File Content of ${path.basename(filepath)}):\n\`\`\`\n${content}\n\`\`\``);
  console.log(`✅ 已加载: ${path.basename(filepath)} (${content.length} 字符)`);
  return true;
}

/**
 * /paste 命令 - 多行粘贴模式
 */
export function handlePaste() {
  console.log(`
📋 多行粘贴模式
输入完成后，请在新的一行输入 /end 结束粘贴。
------------------------------------------------------------------
`);
  return { inputMode: "paste" };
}

/**
 * /copy 命令 - 复制内容到剪贴板
 */
export async function handleCopy(input, messages, copyToClipboard) {
  const parts = input.split(/\s+/);
  let idx = parts[1];
  let textToCopy = "";

  if (idx) {
    // 复制指定代码块
    const lastMsg = messages.slice().reverse().find(m => m.role === 'assistant' && m.content);
    if (!lastMsg) {
      console.log("⚠️  没有可复制的内容");
      return true;
    }

    const matches = lastMsg.content.match(/```[\s\S]*?\n([\s\S]*?)```/g);
    if (!matches) {
      console.log("⚠️  没有找到代码块");
      return true;
    }

    const index = parseInt(idx);
    if (index > 0 && index <= matches.length) {
      textToCopy = matches[index - 1].replace(/```[\s\S]*?\n/, '').replace(/```$/, '');
      console.log(`📝 已提取第 ${index} 个代码块`);
    } else {
      console.log(`❌ 无效的索引 (1-${matches.length})`);
      return true;
    }
  } else {
    // 复制最后一个 AI 回复
    const lastMsg = messages.slice().reverse().find(m => m.role === 'assistant' && m.content);
    if (!lastMsg) {
      console.log("⚠️  没有可复制的内容");
      return true;
    }

    // 检查是否有代码块
    const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)```/g;
    const matches = lastMsg.content.match(codeBlockRegex);

    if (matches && matches.length > 0) {
      // 如果有多个代码块，复制最后一个
      textToCopy = matches[matches.length - 1][1] || matches[matches.length - 1].replace(/```[\s\S]*?\n/, '').replace(/```$/, '');
      console.log("📝 已提取最后一个代码块");
    } else {
      console.log("⚠️  未找到代码块，复制全部内容");
      textToCopy = lastMsg.content;
    }
  }

  await copyToClipboard(textToCopy);
  console.log("✅ 已复制到剪贴板");
  return true;
}

/**
 * /optimize 或 /opt 命令 - 优化文件
 */
export async function handleOptimize(input, activeConfig, generateCompletion, mainChat) {
  const parts = input.split(/\s+/);
  const targetPath = parts[1];

  if (!targetPath) {
    console.log("用法: /optimize <file>");
    return true;
  }

  let potentialPath;
  try {
    potentialPath = sanitizePath(targetPath);
  } catch (e) {
    console.log(`❌ 路径错误: ${e.message}`);
    return true;
  }

  if (!fs.existsSync(potentialPath)) {
    console.log(`❌ 文件不存在: ${targetPath}`);
    return true;
  }

  const stats = fs.statSync(potentialPath);
  if (stats.isDirectory()) {
    console.log(`❌ 目标是一个目录，请指定具体文件`);
    return true;
  }

  // 读取文件内容
  let content = fs.readFileSync(potentialPath, "utf-8");
  // 简单截断防止过大
  if (content.length > 50000) {
    content = content.slice(0, 50000) + "\n...(truncated)";
    console.log("⚠️  文件过大，已截取前 50KB 进行分析");
  }

  console.log(`🤔 正在分析 ${path.basename(potentialPath)} ...`);

  const prompt = `请作为一位资深代码专家，对以下文件进行深度分析和优化。
文件名: ${path.basename(potentialPath)}
文件内容:
\`\`\`
${content}
\`\`\`

请从以下几个维度进行评估：
1. **代码质量**: 是否存在冗余、逻辑混乱或不符合最佳实践的地方？
2. **性能优化**: 是否有潜在的性能瓶颈？
3. **安全性**: 是否存在安全漏洞（如注入风险、敏感信息硬编码等）？
4. **可维护性**: 命名是否规范，注释是否清晰？

请给出具体的优化建议，如果可能，请提供重构后的代码片段。`;

  await mainChat(prompt);
  return true;
}
