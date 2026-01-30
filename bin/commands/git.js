import { execSync } from "node:child_process";
import { gitCommit } from "../utils/helpers.js";

/**
 * /commit 命令 - 生成 Git Commit Message
 */
export async function handleCommit(activeConfig, generateCompletion, askQuestion) {
  console.log("🔍 正在检查 Git 变更...");
  try {
    // Check staged
    let diff = "";
    try {
      diff = execSync("git diff --cached", { encoding: "utf-8" });
    } catch (e) {
      // Git 命令执行失败，可能是目录不是 Git 仓库
    }

    if (!diff.trim()) {
      // Check unstaged
      let unstaged = "";
      try {
        unstaged = execSync("git diff", { encoding: "utf-8" });
      } catch (e) {
        // Git 命令执行失败
      }

      if (!unstaged.trim()) {
        console.log("⚠️  没有检测到任何变更 (Git working directory is clean)");
        return true;
      }

      const ans = await askQuestion("⚠️  暂存区为空，但有未暂存的变更。是否先暂存所有变更 (git add .)? (y/n) ");
      if (ans.trim().toLowerCase() === 'y') {
        execSync("git add .");
        diff = execSync("git diff --cached", { encoding: "utf-8" });
      } else {
        console.log("🚫 已取消");
        return true;
      }
    }

    if (!diff.trim()) {
      console.log("⚠️  变更内容为空");
      return true;
    }

    console.log("🤖 正在生成提交信息...");
    const prompt = `请根据以下 Git 变更生成一个符合 Conventional Commits 规范的提交信息。
只返回提交信息本身，不要包含解释或其他内容。
格式: <type>(<scope>): <subject>

${diff.slice(0, 5000)}`;

    const commitMsg = await generateCompletion(activeConfig, [{role: "user", content: prompt}]);

    console.log("\n--------------------------------------------------");
    console.log(commitMsg.trim());
    console.log("--------------------------------------------------");

    const ans = await askQuestion("以此信息提交? (y: 提交 / e: 编辑 / n: 取消) ");
    const choice = ans.trim().toLowerCase();

    if (choice === 'y') {
      await gitCommit(commitMsg.trim());
      console.log("✅ 提交成功!");
    } else if (choice === 'e') {
      const newMsg = await askQuestion("请输入新的提交信息: ");
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
    console.error("❌ 操作失败:", e.message);
  }
  return true;
}
