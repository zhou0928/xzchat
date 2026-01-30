
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

export function estimateTokens(str) {
  // 简易 Token 估算策略
  // ASCII 字符 (英文/数字/符号): 约 0.25 Token (4 chars ~= 1 token)
  // CJK 字符 (中文/日文/韩文): 约 1.5 Token (1 char ~= 1.5 token)
  // 这是一个保守估计，确保不会轻易超出 limits
  let tokens = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 128) {
      tokens += 0.25;
    } else {
      tokens += 1.5;
    }
  }
  return Math.ceil(tokens);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command;
    let args = [];

    if (platform === "darwin") {
      command = "pbcopy";
    } else if (platform === "win32") {
      command = "clip";
    } else {
      // Linux usually requires xclip or xsel, skipping for now or fallback
      return reject(new Error("Clipboard not supported on this platform"));
    }

    const proc = spawn(command, args);
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Clipboard command failed with code ${code}`));
    });
    proc.stdin.write(text);
    proc.stdin.end();
  });
}

export function calculateCost(model, inputTokens, outputTokens) {
  // 简易价格表 (美元/1M tokens)
  // 参考: OpenAI / Anthropic 公开价格 (2024-2025)
  const prices = {
    // Claude 3.5 Sonnet
    "claude-3-5-sonnet": { in: 3.0, out: 15.0 },
    "claude-sonnet": { in: 3.0, out: 15.0 },
    // GPT-4o
    "gpt-4o": { in: 2.5, out: 10.0 },
    "gpt-4o-mini": { in: 0.15, out: 0.6 },
    // GPT-4 Turbo
    "gpt-4-turbo": { in: 10.0, out: 30.0 },
    // DeepSeek
    "deepseek-chat": { in: 0.14, out: 0.28 }, // approximate (1rmb/2rmb)
    "deepseek-coder": { in: 0.14, out: 0.28 },
    // Default fallback (assume mid-tier)
    "default": { in: 3.0, out: 15.0 }
  };

  let p = prices["default"];
  // 模糊匹配
  const lower = (model || "").toLowerCase();
  if (lower.includes("sonnet") || lower.includes("claude-3-5")) p = prices["claude-3-5-sonnet"];
  else if (lower.includes("gpt-4o-mini")) p = prices["gpt-4o-mini"];
  else if (lower.includes("gpt-4o")) p = prices["gpt-4o"];
  else if (lower.includes("deepseek")) p = prices["deepseek-chat"];

  const inputCost = (inputTokens / 1000000) * p.in;
  const outputCost = (outputTokens / 1000000) * p.out;
  const total = inputCost + outputCost;

  return {
    total: total.toFixed(6),
    currency: "USD"
  };
}

export function calculateCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function chunkText(text, maxTokens = 500) {
    // 简易分块，按段落分割，然后合并直到达到 limit
    // 假设 1 char ~= 0.5 token (保守估计，兼顾中文)
    const limit = maxTokens * 2; 
    const lines = text.split('\n');
    const chunks = [];
    let currentChunk = "";
    
    for (const line of lines) {
        if (currentChunk.length + line.length > limit) {
            chunks.push(currentChunk.trim());
            currentChunk = line + "\n";
        } else {
            currentChunk += line + "\n";
        }
    }
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}

export function sanitizePath(inputPath, baseDir = process.cwd()) {
  let safePath = inputPath;
  if (safePath.startsWith("~")) {
    safePath = path.join(os.homedir(), safePath.slice(1));
  }
  if (!path.isAbsolute(safePath)) {
    safePath = path.resolve(baseDir, safePath);
  }
  safePath = path.normalize(safePath);

  // 允许访问当前工作目录、用户主目录和临时目录
  const allowedDirs = [baseDir, os.homedir(), os.tmpdir()];
  const isAllowed = allowedDirs.some(dir => {
    const relative = path.relative(dir, safePath);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  });

  if (!isAllowed) {
    throw new Error(`Access denied: ${safePath} is outside allowed directories`);
  }
  return safePath;
}
