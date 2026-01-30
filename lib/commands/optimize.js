
import fs from "node:fs";
import path from "node:path";
import { loadConfig, getActiveConfig } from "../config.js";
import { chatStream } from "../chat.js";
import { sanitizePath } from "../utils.js";
import { logger } from "../utils/logger.js";

export async function handleOptimizeCommand(targetPath, options = {}) {
  if (!targetPath) {
    logger.error("用法: xiaozhou-chat optimize <file>");
    process.exit(1);
  }

  let potentialPath;
  try {
    potentialPath = sanitizePath(targetPath);
  } catch (e) {
    logger.error(`❌ 路径错误: ${e.message}`);
    process.exit(1);
  }

  if (!fs.existsSync(potentialPath)) {
    logger.error(`❌ 文件不存在: ${targetPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(potentialPath);
  if (stats.isDirectory()) {
    logger.error(`❌ 目标是一个目录，请指定具体文件`);
    process.exit(1);
  }

  let content = fs.readFileSync(potentialPath, "utf-8");
  if (content.length > 50000) {
    content = content.slice(0, 50000) + "\n...(truncated)";
    logger.warn("⚠️  文件过大，已截取前 50KB 进行分析");
  }

  logger.info(`🤔 正在分析 ${path.basename(potentialPath)} ...`);

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

  const context = { messages: [], toolHandlers: {} };

  try {
    // Load config strictly for this command
    let config = loadConfig();
    let activeConfig = getActiveConfig(config);

    if (options.apiKey) activeConfig.apiKey = options.apiKey;
    if (options.baseUrl) activeConfig.baseUrl = options.baseUrl;
    if (options.model) activeConfig.model = options.model;

    if (!activeConfig.apiKey || activeConfig.apiKey === "sk-..." || activeConfig.apiKey === "") {
      logger.error("❌ 未配置 API Key。请编辑 ~/.newapi-chat-config.json 或使用 /config 设置。");
      process.exit(1);
    }

    // Assign config to context
    context.config = activeConfig;

    await chatStream(context, prompt, { isRecursion: false });
    process.exit(0);
  } catch (e) {
    logger.error("执行出错:", { error: e.message });
    process.exit(1);
  }
}
