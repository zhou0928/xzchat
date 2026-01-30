import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { sanitizePath } from "../utils/helpers.js";
import { loadConfig, getActiveConfig } from "../../lib/config.js";

/**
 * /auto 命令 - 智能体模式
 */
export async function handleAuto(input, mainChat) {
  const goal = input.slice(5).trim();
  if (!goal) {
    console.log("用法: /auto <复杂任务描述>");
    return true;
  }

  console.log("🤖 进入智能体模式 (Agent Mode)...");
  const agentPrompt = `[Agent Mode Activated]
Target Goal: ${goal}

Instructions:
1. Break down this goal into clear, executable steps.
2. Use available tools to execute each step (write code, run commands, read files).
3. Verify your work after each step.
4. If you encounter errors, debug and fix them autonomously.
5. Do not stop until the goal is fully achieved.
6. When finished, report the final result.

Please start by planning the steps.`;

  await mainChat(agentPrompt);
  return true;
}

/**
 * /open 命令 - 用系统默认程序打开文件
 */
export async function handleOpen(input) {
  const file = input.slice(6).trim();
  if (!file) {
    console.log("用法: /open <file>");
  } else {
    let filepath;
    try {
      filepath = sanitizePath(file);
    } catch (e) {
      console.log(`❌ 路径错误: ${e.message}`);
      return true;
    }
    if (!fs.existsSync(filepath)) {
      console.log("❌ 文件不存在");
    } else {
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
  }
  return true;
}

/**
 * /context 命令 - 显示当前上下文文件
 */
export function handleContext(messages) {
  console.log("\n📂 当前上下文文件:");
  let found = false;
  messages.forEach((m, idx) => {
    if (m.role === 'user' && m.content.startsWith('(File Content of')) {
      const match = m.content.match(/\(File Content of (.*?)\)/);
      const filename = match ? match[1] : "Unknown";
      const preview = m.content.slice(0, 100).replace(/\n/g, ' ');
      console.log(`  [${idx}] ${filename}`);
      console.log(`      ${preview}...`);
      found = true;
    }
  });
  if (!found) {
    console.log("  (没有加载文件)");
  }
  return true;
}

/**
 * /token 命令 - 估算 Token 消耗
 */
export function handleToken(messages, estimateTokens, calculateCost) {
  const currentTokens = estimateTokens(JSON.stringify(messages));
  const cost = calculateCost(currentTokens);

  console.log(`\n📊 Token 统计:`);
  console.log(`  总计: ${currentTokens.toLocaleString()} tokens`);
  console.log(`  预估成本: ${cost} USD`);
  console.log(`  消息数: ${messages.length}`);

  return true;
}

/**
 * /compress 命令 - 压缩对话历史
 */
export async function handleCompress(messages, currentSession, saveHistory, silent = false) {
  if (!silent) console.log("🤏 正在压缩对话历史...");

  if (messages.length < 4) {
    if (!silent) console.log("⚠️ 历史记录太短，无需压缩。");
    return false;
  }

  // 过滤掉无效的消息（content 为 null/undefined）
  const validMessages = messages.filter(m => {
    if (typeof m.content === "string") {
      return m.content.trim().length > 0;
    } else if (Array.isArray(m.content)) {
      return m.content.length > 0 && m.content.some(c => c.type === "text" && c.text);
    }
    return false;
  });

  if (validMessages.length < 4) {
    if (!silent) console.log("⚠️ 有效历史记录太短，无需压缩。");
    return false;
  }

  const toCompress = validMessages.slice(0, -2);
  const recent = validMessages.slice(-2);

  // 估算 token 数量
  const estimatedTokens = JSON.stringify(toCompress).length / 3; // 粗略估算：1 token ≈ 3 字符

  // 如果内容过大，只压缩最近的部分
  let messagesToCompress = toCompress;
  if (estimatedTokens > 100000) {
    if (!silent) console.log("⚠️  对话历史过长，只压缩最近的部分...");
    // 从 toCompress 的末尾开始，取大约 100k tokens 的内容
    const targetLength = Math.floor(toCompress.length * 100000 / estimatedTokens);
    messagesToCompress = toCompress.slice(-targetLength);
  }

  // 优化: 将 JSON 转换为更紧凑的文本格式以节省 Token
  const conversationText = messagesToCompress.map(m => {
    let text = "";
    if (typeof m.content === "string") {
      text = m.content;
    } else if (Array.isArray(m.content)) {
      text = m.content.map(c => {
        if (c.type === "text") return c.text || "";
        if (c.type === "image_url") return "[Image]";
        return "";
      }).filter(t => t.length > 0).join(" ");
    }
    return `[${m.role.toUpperCase()}]: ${text}`;
  }).filter(text => text.length > 10).join("\n\n");

  // 如果转换后内容太少，无法压缩
  if (conversationText.length < 100) {
    if (!silent) console.log("⚠️  有效对话内容太少，无法压缩。");
    return false;
  }

  const summaryPrompt = `
请总结以下对话的主要内容，提取关键信息、代码片段和决策。
摘要应简洁明了，以便作为后续对话的上下文。
保留所有重要的技术细节。

对话内容:
${conversationText}
`;

  try {
    const { generateCompletion } = await import("../../lib/chat.js");
    const activeConfig = getActiveConfig(loadConfig());
    const summary = await generateCompletion(activeConfig, [{role: "user", content: summaryPrompt}]);

    const newMessages = [
      { role: "system", content: `Previous conversation summary:\n${summary}` },
      ...recent
    ];

    saveHistory(newMessages, currentSession);
    if (!silent) {
      console.log("✅ 历史记录已压缩");
      console.log("摘要预览:", summary.slice(0, 100).replace(/\n/g, ' ') + "...");
    } else {
      console.log(`✅ 历史记录已自动压缩 (摘要: ${summary.slice(0, 50)}...)`);
    }
    return { newMessages, success: true };
  } catch (e) {
    console.error("❌ 压缩失败:", e.message);
    return { success: false };
  }
}

/**
 * /tools 命令 - 显示可用工具
 */
export async function handleTools(mcpClients) {
  const { builtInTools } = await import("../../lib/tools.js");

  console.log("\n🛠️  可用工具列表:");

  console.log("\n内置工具:");
  builtInTools.forEach(t => {
    console.log(`  - ${t.name}: ${t.description || "(无描述)"}`);
  });

  if (mcpClients.size > 0) {
    console.log("\nMCP 工具:");
    for (const [name, client] of mcpClients.entries()) {
      if (client.initialized && client.tools.length > 0) {
        console.log(`  ${name}:`);
        client.tools.forEach(t => {
          console.log(`    - ${t.name}: ${t.description || "(无描述)"}`);
        });
      }
    }
  }

  return true;
}

/**
 * /editor 命令 - 调用系统编辑器
 */
export function handleEditor() {
  console.log(`
✏️  编辑器模式
请在下面输入多行内容。
输入完成后，请在新的一行输入 /end 结束编辑。
------------------------------------------------------------------
`);
  return { inputMode: "editor" };
}

/**
 * /review 命令 - AI Code Review
 */
export async function handleReview(activeConfig, generateCompletion, askQuestion) {
  console.log("🔍 正在检查 Git 变更...");
  try {
    let diff = "";
    try {
      diff = require("node:child_process").execSync("git diff --cached", { encoding: "utf-8" });
    } catch (e) {
      // Git 命令执行失败，可能是目录不是 Git 仓库
    }

    if (!diff.trim()) {
      let unstaged = "";
      try {
        unstaged = require("node:child_process").execSync("git diff", { encoding: "utf-8" });
      } catch (e) {
        // Git 命令执行失败
      }

      if (!unstaged.trim()) {
        console.log("⚠️  没有检测到任何变更");
        return true;
      }

      const ans = await askQuestion("暂存区为空，是否使用未暂存的变更? (y/n) ");
      if (ans.trim().toLowerCase() === 'y') {
        diff = unstaged;
      } else {
        console.log("🚫 已取消");
        return true;
      }
    }

    if (!diff.trim()) {
      console.log("⚠️  变更内容为空");
      return true;
    }

    console.log("🤖 正在进行 Code Review...");
    const prompt = `请对以下代码变更进行全面的代码审查。
关注以下方面：
1. 代码质量和最佳实践
2. 潜在的安全问题
3. 性能优化建议
4. 可读性和可维护性
5. Bug 检测

代码变更:
\`\`\`diff
${diff.slice(0, 10000)}
\`\`\``;

    await generateCompletion(activeConfig, [{role: "user", content: prompt}]);
  } catch (e) {
    console.error("❌ Code Review 失败:", e.message);
  }
  return true;
}
