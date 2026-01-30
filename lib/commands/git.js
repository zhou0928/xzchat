import { execSync, spawn } from "node:child_process";
import { generateCompletion } from "../chat.js";
import { logger } from "../utils/logger.js";

function gitCommit(message) {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['commit', '-m', message], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Git commit failed with code ${code}`));
    });
  });
}

export async function handleCommitCommand(activeConfig, rl) {
  console.log("🔍 正在检查 Git 变更...");

  try {
    let diff = "";
    let source = "staged";

    try {
      diff = execSync("git diff --cached", { encoding: "utf-8" });
    } catch (e) {
      logger.debug('获取暂存区 diff 失败', { error: e.message });
    }

    if (!diff.trim()) {
      let unstaged = "";
      try {
        unstaged = execSync("git diff", { encoding: "utf-8" });
      } catch (e) {
        logger.debug('获取工作区 diff 失败', { error: e.message });
      }

      if (!unstaged.trim()) {
        console.log("⚠️  没有检测到任何变更 (Git working directory is clean)");
        return;
      }

      const ans = await rl.question("⚠️  暂存区为空，但有未暂存的变更。是否先暂存所有变更 (git add .)? (y/n) ");

      if (ans.trim().toLowerCase() === 'y') {
        execSync("git add .");
        diff = execSync("git diff --cached", { encoding: "utf-8" });
      } else {
        console.log("🚫 已取消");
        return;
      }
    }

    if (!diff.trim()) {
      console.log("⚠️  变更内容为空");
      return;
    }

    console.log("🤖 正在生成提交信息...");
    const prompt = `请根据以下 Git 变更生成一个符合 Conventional Commits 规范的提交信息。
只返回提交信息本身，不要包含解释或其他内容。
格式: <type>(<scope>): <subject>

${diff.slice(0, 5000)}`;

    const commitMsg = await generateCompletion(activeConfig, [{ role: "user", content: prompt }]);

    console.log("\n--------------------------------------------------");
    console.log(commitMsg.trim());
    console.log("--------------------------------------------------");

    const ans = await rl.question("以此信息提交? (y: 提交 / e: 编辑 / n: 取消) ");
    const choice = ans.trim().toLowerCase();

    if (choice === 'y') {
      await gitCommit(commitMsg.trim());
      console.log("✅ 提交成功!");
    } else if (choice === 'e') {
      const newMsg = await rl.question("请输入新的提交信息: ");

      if (newMsg.trim()) {
        await gitCommit(newMsg.trim());
        console.log("✅ 提交成功!");
      } else {
        console.log("🚫 内容为空，取消提交");
      }
    } else {
      console.log("🚫 已取消");
    }

  } catch (e) {
    console.error(`❌ 操作失败: ${e.message}`);
  }
}

export async function handleReviewCommand(activeConfig, mainChat, rl) {
  try {
    let diff = "";
    let source = "staged";

    try {
      diff = execSync("git diff --cached", { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (!diff) {
        diff = execSync("git diff", { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        source = "working tree";
      }
    } catch (e) {
      console.log("❌ 获取 git diff 失败，请确认当前目录是 git 仓库");
      return;
    }

    if (!diff) {
      console.log("⚠️  没有检测到代码变更 (Staged or Unstaged)");
      return;
    }

    console.log(`🤖 正在 Review 代码 (${source} changes)...`);
    const prompt = `
请作为资深技术专家 (Code Reviewer) 审查以下代码变更。
关注点：
1. 潜在 Bug 或逻辑错误
2. 代码风格与最佳实践
3. 安全隐患与性能问题
4. 可读性与维护性

Diff 内容:
\`\`\`diff
${diff.slice(0, 12000)}
\`\`\`
`;

    await mainChat(prompt);

  } catch (e) {
    console.error("❌ Review 失败:", e.message);
  }
}

export async function handleGitLogCommand(activeConfig, mainChat, rl) {
  try {
    const log = execSync("git log --oneline -10", { encoding: "utf-8" });

    if (!log.trim()) {
      console.log("没有 Git 提交历史");
      return;
    }

    console.log("\n📜 最近 10 次提交:");
    console.log("--------------------------------------------------");
    console.log(log);
    console.log("--------------------------------------------------\n");

    const ans = await rl.question("选择一个提交序号查看详情 (或按 Enter 跳过): ");

    if (!ans.trim()) return;

    const idx = parseInt(ans);

    if (isNaN(idx)) {
      console.log("无效的序号");
      return;
    }

    const commitHash = execSync(`git log --format="%H" -${idx} -1`, { encoding: "utf-8" }).trim();
    const diff = execSync(`git show ${commitHash}`, { encoding: "utf-8" });

    console.log(`\n📝 提交详情:`);
    console.log("--------------------------------------------------");
    console.log(diff.slice(0, 3000));
    console.log("--------------------------------------------------\n");

    const shouldAnalyze = await rl.question("是否让 AI 分析这次提交? (y/n) ");

    if (shouldAnalyze.trim().toLowerCase() === 'y') {
      await mainChat(`请分析以下 Git 提交，说明这次变更的目的和影响：\n\n${diff.slice(0, 5000)}`);
    }

  } catch (e) {
    console.error("❌ 获取 Git 历史失败:", e.message);
  }
}
