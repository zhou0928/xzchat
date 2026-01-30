import path from "node:path";
import { sanitizePath } from "../config.js";
import { loadFileContent, formatFileContent } from "../utils/file-loader.js";
import { getFileList, scanDir } from "../tools.js";
import { isSensitiveFile } from "../utils/security.js";

export async function handleLoadCommand(input, rl, addToContext) {
  let file = input.slice(5).trim();

  // 交互式选择文件
  if (!file) {
    console.log("📂 正在扫描文件...");
    const files = getFileList(process.cwd());

    if (files.length === 0) {
      console.log("⚠️  当前目录没有可加载的文件");
      return;
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

      const answer = await rl.question("\n请输入序号或操作: ");
      const choice = answer.trim().toLowerCase();

      if (choice === 'q') {
        console.log("🚫 已取消");
        return;
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
    return;
  }

  const fs = await import("node:fs");

  if (!fs.existsSync(filepath)) {
    console.log("❌ 文件不存在");
    return;
  }

  // 敏感文件警告
  if (isSensitiveFile(filepath)) {
    const ans = await rl.question(`⚠️  警告: 这是一个敏感文件，确定要加载吗? (y/n) `);

    if (ans.trim().toLowerCase() !== 'y') {
      console.log("🚫 已取消");
      return;
    }
  }

  try {
    const content = await loadFileContent(filepath, { askQuestion: rl.question.bind(rl) });
    addToContext(formatFileContent(file, content));
    console.log(`✅ 已加载文件: ${file}`);
  } catch (e) {
    console.log(`❌ 加载失败: ${e.message}`);
  }
}

export async function handleScanCommand(rl, addToContext) {
  console.log("🔍 正在扫描项目结构...");
  const structure = scanDir(process.cwd());

  // 简单的 token 估算（假设 1 字符 ≈ 0.5 token）
  const estimatedTokens = Math.ceil(structure.length / 2);

  if (estimatedTokens > 3000) {
    const ans = await rl.question(`⚠️  项目结构较大 (~${estimatedTokens} tokens)，确定要加载吗? (y/n) `);

    if (ans.trim().toLowerCase() === 'y') {
      addToContext(`(Current Project Structure):\n\`\`\`\n${structure}\n\`\`\``);
      console.log("✅ 项目结构已加载");
      console.log(structure);
    } else {
      console.log("🚫 已取消");
    }
    return;
  }

  addToContext(`(Current Project Structure):\n\`\`\`\n${structure}\n\`\`\``);
  console.log("✅ 项目结构已加载");
  console.log(structure);
}

export async function handleOpenCommand(input, rl) {
  const file = input.slice(6).trim();

  if (!file) {
    console.log("用法: /open <file>");
    return;
  }

  let filepath;
  try {
    filepath = sanitizePath(file);
  } catch (e) {
    console.log(`❌ 路径错误: ${e.message}`);
    return;
  }

  const fs = await import("node:fs");
  const { spawn } = await import("node:child_process");

  if (!fs.existsSync(filepath)) {
    console.log("❌ 文件不存在");
    return;
  }

  try {
    await new Promise((resolve, reject) => {
      const proc = spawn('open', [filepath], { stdio: 'ignore' });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Exit code ${code}`));
      });
      proc.on('error', reject);
    });
    console.log(`✅ 已打开: ${file}`);
  } catch (e) {
    console.error("❌ 打开失败:", e.message);
  }
}

export async function handlePasteMode(setInputMode, setPasteBuffer, rl) {
  setInputMode("paste");
  setPasteBuffer([]);
  console.log("📝 进入粘贴模式 (输入 '---' 结束)");
  rl.setPrompt("... ");
}

export async function handleEditorCommand(rl, mainChat) {
  console.log("📝 正在打开编辑器...");
  const editor = process.env.EDITOR || "vi";
  const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
  const path = await import('node:path');
  const fs = await import('node:fs');
  const { execSync } = await import('node:child_process');

  const tempFile = path.join(tmpDir, `xzchat-editor-${Date.now()}.md`);

  try {
    fs.writeFileSync(tempFile, "", "utf-8");
    execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });

    if (fs.existsSync(tempFile)) {
      const content = fs.readFileSync(tempFile, "utf-8").trim();
      fs.unlinkSync(tempFile);

      if (content) {
        console.log(`✅ 已读取 ${content.length} 字符`);
        console.log("--------------------------------------------------");
        console.log(content.slice(0, 100) + (content.length > 100 ? "..." : ""));
        console.log("--------------------------------------------------");

        const ans = await rl.question("发送此内容? (y/n) ");

        if (ans.trim().toLowerCase() === 'y') {
          await mainChat(content);
        } else {
          console.log("🚫 已取消发送");
        }
      } else {
        console.log("⚠️  内容为空，未发送");
      }
    }
  } catch (e) {
    console.error(`❌ 启动编辑器失败: ${e.message}`);
  }
}
