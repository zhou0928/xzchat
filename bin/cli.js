#!/usr/bin/env node

// -------------------------------------------------------------------------
// 🛡️ 环境净化区：在加载任何依赖前，清理可能导致冲突的环境变量
// -------------------------------------------------------------------------
(function sanitizeEnvironment() {
  const proxyVars = [
    'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY',
    'http_proxy', 'https_proxy', 'all_proxy', 'no_proxy'
  ];

  let cleaned = [];
  for (const key of proxyVars) {
    if (process.env[key]) {
      delete process.env[key];
      cleaned.push(key);
    }
  }

  // 同时清理可能干扰的通用 API 配置（防止 .env 污染）
  const conflictVars = ['API_KEY', 'BASE_URL', 'MODEL', 'OPENAI_API_KEY'];
  for (const key of conflictVars) {
    if (process.env[key]) {
      delete process.env[key];
      cleaned.push(key);
    }
  }

  if (cleaned.length > 0) {
    // 仅在调试模式或检测到显式代理时提示，避免干扰正常输出
    // 但为了响应用户需求，我们这里打印一个温和的提示
    // console.log(`\n🛡️  已自动屏蔽潜在冲突的环境变量: ${cleaned.join(', ')}`);
  }
})();
// -------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { execSync, spawn } from "node:child_process";
import minimist from "minimist";
import { MCPClient } from "../lib/mcp-lite.js";
import {
  initConfigFile,
  initProjectConfigFile,
  loadConfig,
  updateConfig,
  getActiveConfig,
  setProfileValue,
  setRole,
  getCcSwitchProviders
} from "../lib/config.js";
import {
  loadHistory,
  saveHistory,
  clearHistory,
  exportHistory,
  listSessions
} from "../lib/history.js";
import {
  chatStream,
  generateCompletion,
  fetchModels
} from "../lib/chat.js";
import {
  builtInTools,
  handleBuiltInTool,
  scanDir,
  getFileList
} from "../lib/tools.js";
import { estimateTokens, copyToClipboard, calculateCost } from "../lib/utils.js";
import { indexCodebase, searchCodebase } from "../lib/rag.js";
import { printFarewell, checkUpdate, sanitizePath } from "./utils/helpers.js";
import { commands } from "./utils/constants.js";
import { logger } from "../lib/utils/logger.js";
import { handleOptimizeCommand } from "../lib/commands/optimize.js";
import { handleConfigCommand } from "../lib/commands/config-cmd.js";

function completer(line) {
  const hits = commands.filter((c) => c.startsWith(line));
  return [hits.length ? hits : commands, line];
}
import { executeCommand } from "./commands/index.js";

const args = minimist(process.argv.slice(2));

// -------------------------------------------------------------------------
// 状态变量
// -------------------------------------------------------------------------

let inputMode = "chat";
let pasteBuffer = [];
let isProcessing = false;
let ttsEnabled = false;

// -------------------------------------------------------------------------
// 主函数
// -------------------------------------------------------------------------

(async function main() {

  // 处理 optimize/opt 命令 (CLI 模式)
  if (args._[0] === "optimize" || args._[0] === "opt") {
    initConfigFile();
    handleOptimizeCommand(args._[1]);
    return;
  }

  // 处理 config 命令 (CLI 模式)
  if (args._[0] === "config") {
    await handleConfigCommand(args);
    return;
  }

  // -------------------------------------------------------------------------
  // 初始化
  // -------------------------------------------------------------------------

  initConfigFile();
  let config = loadConfig();
  let activeConfig = getActiveConfig(config);
  let currentSession = config.currentSession || "default";

  // 覆盖配置 (命令行参数 > 配置文件)
  if (args["api-key"]) activeConfig.apiKey = args["api-key"];
  if (args["base-url"]) activeConfig.baseUrl = args["base-url"];
  if (args["model"]) activeConfig.model = args["model"];
  if (args["system-prompt"]) activeConfig.systemPrompt = args["system-prompt"];

  // 默认显示思考过程
  if (config.showThinking === undefined) {
    config.showThinking = true;
    activeConfig.showThinking = true;
  }

  // 检查 Key
  if (!activeConfig.apiKey || activeConfig.apiKey === "sk-..." || activeConfig.apiKey === "") {
    logger.error("❌ 未配置 API Key。请编辑 ~/.newapi-chat-config.json 或使用 /config 设置。");
    // Don't exit, let user set it via command
  }

  // MCP Clients
  const mcpClients = new Map();
  async function initMCPServers() {
    if (!config.mcpServers) return;
    logger.info("🔄 正在初始化 MCP Servers...");
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      try {
        const client = new MCPClient(serverConfig.command, serverConfig.args || [], serverConfig.env || {});
        await client.connect();
        mcpClients.set(name, client);
      } catch (e) {
        logger.error(`❌ MCP Server '${name}' 连接失败:`, { error: e.message });
      }
    }
  }
  initMCPServers().catch(e => logger.error("MCP Init Error", e));

  // 历史记录
  let messages = loadHistory(currentSession);

  // -------------------------------------------------------------------------
  // Readline 设置
  // -------------------------------------------------------------------------

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "小周> ",
    completer: (line) => completer(line, commands)
  });

  // 全局 AbortController，用于中断生成
  let abortController = null;

  // 工具上下文
  const toolContext = {
    confirmCommand: async (cmd) => {
      const ans = await askQuestion(`\n⚠️  AI 请求执行命令: \x1b[33m${cmd}\x1b[0m\n允许吗? (y/n) `);
      const input = ans.trim().toLowerCase();
      if (input === 'y' || input === 'yes') {
        return true;
      } else {
        console.log("🚫 已拒绝执行");
        return false;
      }
    }
  };

  // -------------------------------------------------------------------------
  // 辅助函数
  // -------------------------------------------------------------------------

  function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
  }

  function addToContext(content) {
    messages.push({ role: "user", content });
    saveHistory(messages, currentSession);
  }

  // -------------------------------------------------------------------------
  // 主聊天函数
  // -------------------------------------------------------------------------

  async function mainChat(input) {
    // 每次对话前重新加载配置，确保用户手动修改文件后生效
    config = loadConfig();
    activeConfig = getActiveConfig(config);

    // 1. 严格检查 API Key
    if (!activeConfig.apiKey || activeConfig.apiKey === "sk-..." || activeConfig.apiKey.trim() === "") {
      console.log("❌ 错误: 未配置 API Key。");
      console.log("👉 请使用命令: /config apiKey sk-xxxxxxxx");
      console.log("   或者编辑配置文件: ~/.newapi-chat-config.json");
      return;
    }

    // 2. 严格检查 Base URL
    if (!activeConfig.baseUrl) {
      console.log("❌ 错误: 未配置 Base URL。");
      return;
    }

    // 自动上下文压缩检查 (Token > 10000)
    const currentTokens = estimateTokens(JSON.stringify(messages));
    if (currentTokens > 10000) {
      console.log(`\n⚠️  当前上下文 Token (${currentTokens}) 已超过阈值 (10000)，触发自动压缩...`);
      const { handleCompress } = await import("./commands/advanced.js");
      const compressResult = await handleCompress(messages, currentSession, saveHistory, true);

      // 如果压缩失败，直接清空历史，只保留最近的几条消息
      if (compressResult && compressResult.success && compressResult.newMessages) {
        messages = compressResult.newMessages;
        console.log(`✅ 压缩完成，当前消息数: ${messages.length}`);
      } else {
        console.log(`⚠️  压缩失败，清空历史记录...`);
        // 只保留最近的 4 条消息
        messages = messages.slice(-4);
        console.log(`✅ 已清空历史，保留最近 ${messages.length} 条消息`);
      }
    }

    // 准备 Tools
    const tools = [...builtInTools];

    // 合并 MCP Tools
    for (const client of mcpClients.values()) {
      if (client.initialized && client.tools.length > 0) {
        tools.push(...client.getOpenAITools());
      }
    }

    abortController = new AbortController();

    const ctx = {
      messages,
      config: activeConfig,
      mcpClients,
      toolHandlers: (name, args) => handleBuiltInTool(name, args, toolContext),
      tools,
      signal: abortController.signal
    };

    // 图像处理逻辑 (Multimodal Support)
    let finalInput = input;
    if (typeof input === "string") {
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      if (imgRegex.test(input)) {
        const parts = [];
        let match;
        let lastIndex = 0;

        while ((match = imgRegex.exec(input)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: "text", text: input.slice(lastIndex, match.index) });
          }

          try {
            const imgPath = sanitizePath(match[2]);
            const imgBuffer = fs.readFileSync(imgPath);
            const imgBase64 = imgBuffer.toString("base64");
            const imgType = path.extname(imgPath).slice(1) || "png";

            parts.push({
              type: "image_url",
              image_url: {
                url: `data:image/${imgType};base64,${imgBase64}`
              }
            });
          } catch (e) {
            console.warn(`⚠️  无法加载图片 ${match[2]}:`, e.message);
          }

          lastIndex = imgRegex.lastIndex;
        }

        if (lastIndex < input.length) {
          parts.push({ type: "text", text: input.slice(lastIndex) });
        }

        if (parts.length > 0) {
          finalInput = parts;
        }
      }
    }

    try {
      const response = await chatStream(ctx, finalInput, { isRecursion: false });

      // TTS 输出
      if (ttsEnabled && response) {
        try {
          const { textToSpeech, playAudio } = await import("../lib/audio.js");
          const file = await textToSpeech(response, activeConfig);
          await playAudio(file);
          if (fs.existsSync(file)) fs.unlinkSync(file);
        } catch (e) {
          console.error("❌ TTS 失败:", e.message);
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log("\n🛑 生成已中断");
      } else {
        console.error("\n❌ 错误:", e.message);
      }
    } finally {
      abortController = null;
    }
  }

  // -------------------------------------------------------------------------
  // 监听按键事件
  // -------------------------------------------------------------------------

  process.stdin.on('keypress', (str, key) => {
    if (key && key.name === 'escape') {
      if (abortController) {
        abortController.abort();
        abortController = null;
        process.stdout.write("\n🛑 已中断 (Esc)\n");
      } else {
        if (rl.line && rl.line.length > 0) {
          rl.write(null, { ctrl: true, name: 'u' });
        } else {
          printFarewell();
          process.exit(0);
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // Signal handling
  // -------------------------------------------------------------------------

  rl.on("SIGINT", () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      console.log("\n🛑 请求已中断");
      setTimeout(() => rl.prompt(), 100);
    } else {
      rl.question('\n确定要退出吗? (y/n) ', (ans) => {
        if (ans.match(/^y/i)) {
          rl.close();
          process.exit(0);
        } else {
          rl.prompt();
        }
      });
    }
  });

  // -------------------------------------------------------------------------
  // 主输入循环
  // -------------------------------------------------------------------------

  rl.on('line', async (input) => {
    // 跳过空行
    if (!input || !input.trim()) {
      rl.prompt();
      return;
    }

    // 处理特殊输入模式
    if (inputMode === "paste") {
      if (input === "/end") {
        inputMode = "chat";
        const pasteContent = pasteBuffer.join('\n');
        pasteBuffer = [];
        console.log("✅ 粘贴结束，开始处理...");
        isProcessing = true;
        try {
          await mainChat(pasteContent);
        } finally {
          isProcessing = false;
          rl.prompt();
          saveHistory(messages, currentSession);
        }
      } else {
        pasteBuffer.push(input);
      }
      return;
    }

    if (inputMode === "editor") {
      if (input === "/end") {
        inputMode = "chat";
        const editorContent = pasteBuffer.join('\n');
        pasteBuffer = [];
        console.log("✅ 编辑结束，开始处理...");
        isProcessing = true;
        try {
          await mainChat(editorContent);
        } finally {
          isProcessing = false;
          rl.prompt();
          saveHistory(messages, currentSession);
        }
      } else {
        pasteBuffer.push(input);
      }
      return;
    }

    // 构建命令执行上下文
    const context = {
      messages,
      config,
      activeConfig,
      currentSession,
      mcpClients,
      ttsEnabled,
      inputMode,
      pasteBuffer,
      rl,
      askQuestion,
      addToContext,

      // 配置相关
      loadConfig,
      updateConfig,
      getActiveConfig,
      setProfileValue,
      setRole,
      getCcSwitchProviders,

      // 历史记录
      saveHistory,
      loadHistory,
      clearHistory,
      exportHistory,
      listSessions,

      // 聊天相关
      mainChat,
      generateCompletion,
      fetchModels,
      chatStream,

      // 工具
      builtInTools,
      estimateTokens,
      copyToClipboard,
      calculateCost,
      handleBuiltInTool,
      getFileList,
      scanDir,

      // 初始化
      initConfigFile,
      initProjectConfigFile
    };

    // 尝试执行命令
    const { handled, result, error } = await executeCommand(input, context);

    if (error) {
      console.error(error);
      rl.prompt();
      return;
    }

    if (handled) {
      // 处理命令返回的特殊状态
      if (result) {
        if (result.inputMode) {
          inputMode = result.inputMode;
        }
        if (result.newSession) {
          currentSession = result.newSession;
        }
        if (result.newMessages) {
          messages = result.newMessages;
        }
        if (result.activeConfig) {
          activeConfig = result.activeConfig;
        }
      }

      // 如果命令返回 true，需要调用 rl.prompt()
      if (result === true || !result) {
        rl.prompt();
      }
      return;
    }

    // 如果不是命令，则作为聊天输入处理
    isProcessing = true;
    try {
      await mainChat(input);
    } finally {
      isProcessing = false;
      rl.prompt();
      saveHistory(messages, currentSession);
    }
  });

  // 检查更新
  checkUpdate();

  console.log("✅ AI助手 已启动 (输入 /help 查看命令)");
  rl.prompt();

})();
