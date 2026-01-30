/**
 * xzChat 真实场景示例
 * 
 * 本示例展示了 xzChat 在真实项目中的典型应用场景
 */

import { chatStream, generateCompletion } from '../lib/chat.js';
import { loadConfig } from '../lib/config.js';
import { SessionManager } from '../lib/utils/session-manager.js';
import { Cache } from '../lib/utils/cache.js';
import { CostTracker } from '../lib/utils/cost-tracker.js';
import { logger } from '../lib/utils/logger.js';
import { ConcurrencyController } from '../lib/utils/connection-pool.js';
import { ProgressBar } from '../lib/utils/progress.js';
import { indexCodebase, searchCodebase } from '../lib/rag.js';

// =============================================================================
// 场景 1: 代码审查助手
// =============================================================================

class CodeReviewAssistant {
  constructor(config) {
    this.config = config;
    this.sessionManager = new SessionManager();
    this.cache = new Cache({ ttl: 3600000 });
  }
  
  async reviewCode(diff) {
    logger.info('开始代码审查', { diffLength: diff.length });
    
    const cacheKey = `review:${Buffer.from(diff).toString('base64').substring(0, 50)}`;
    
    // 检查缓存
    let review = this.cache.get(cacheKey);
    if (review) {
      logger.info('使用缓存的审查结果');
      return review;
    }
    
    // 生成审查提示
    const prompt = `
请审查以下代码变更,重点关注:
1. 潜在的 bug
2. 代码风格问题
3. 性能优化建议
4. 安全性问题
5. 可维护性

代码变更:
${diff}

请以结构化的方式返回审查结果。
    `;
    
    // 调用 AI
    const response = await generateCompletion(this.config, [
      { role: 'system', content: '你是一个经验丰富的代码审查员。' },
      { role: 'user', content: prompt }
    ]);
    
    review = response.choices[0].message.content;
    
    // 缓存结果
    this.cache.set(cacheKey, review);
    
    logger.info('代码审查完成');
    return review;
  }
  
  async reviewPullRequest(prUrl) {
    logger.info('审查 Pull Request', { prUrl });
    
    // 创建会话
    const session = await this.sessionManager.createSession(`pr-review-${Date.now()}`);
    
    // 模拟获取 PR diff
    const diff = `
diff --git a/src/utils.js b/src/utils.js
index 1234567..abcdefg 100644
--- a/src/utils.js
+++ b/src/utils.js
@@ -10,7 +10,9 @@ export function formatData(data) {
   return JSON.stringify(data, null, 2);
 }
 
+export function processData(data) {
+  return data.map(item => item.value * 2);
+}
    `;
    
    // 进行审查
    const review = await this.reviewCode(diff);
    
    // 保存历史
    await this.sessionManager.saveHistory([
      { role: 'user', content: `审查 PR: ${prUrl}` },
      { role: 'assistant', content: review }
    ]);
    
    return review;
  }
}

// =============================================================================
// 场景 2: 文档生成器
// =============================================================================

class DocumentationGenerator {
  constructor(config) {
    this.config = config;
    this.progress = new ProgressBar({ total: 100, showPercent: true });
  }
  
  async generateFromCode(codebasePath) {
    logger.info('开始生成文档', { path: codebasePath });
    
    try {
      // 1. 索引代码库
      this.progress.update(10);
      console.log('\n索引代码库...');
      
      const config = await loadConfig();
      await indexCodebase(codebasePath, config, {
        concurrency: 3,
        showProgress: true
      });
      
      // 2. 分析代码结构
      this.progress.update(30);
      console.log('\n分析代码结构...');
      
      const structure = await this.analyzeStructure(codebasePath);
      
      // 3. 生成文档
      this.progress.update(50);
      console.log('\n生成文档...');
      
      const documentation = await this.generateDocumentation(structure);
      
      // 4. 保存文档
      this.progress.update(90);
      console.log('\n保存文档...');
      
      await this.saveDocumentation(documentation);
      
      this.progress.complete('文档生成完成!');
      
      return documentation;
    } catch (error) {
      logger.error('文档生成失败', { error: error.message });
      throw error;
    }
  }
  
  async analyzeStructure(codebasePath) {
    // 模拟结构分析
    return {
      modules: ['utils', 'api', 'models'],
      functions: ['formatData', 'processData', 'fetchData'],
      classes: ['User', 'Product', 'Order']
    };
  }
  
  async generateDocumentation(structure) {
    const prompt = `
基于以下项目结构生成完整的 API 文档:

项目结构:
${JSON.stringify(structure, null, 2)}

请生成 Markdown 格式的文档,包括:
1. 项目概述
2. 安装指南
3. API 参考
4. 使用示例
5. 常见问题
    `;
    
    const response = await generateCompletion(this.config, [
      { role: 'system', content: '你是一个技术文档专家。' },
      { role: 'user', content: prompt }
    ]);
    
    return response.choices[0].message.content;
  }
  
  async saveDocumentation(documentation) {
    // 保存到文件
    // ...
    logger.info('文档已保存');
  }
}

// =============================================================================
// 场景 3: 自动化测试生成
// =============================================================================

class TestGenerator {
  constructor(config) {
    this.config = config;
    this.cache = new Cache({ ttl: 7200000 }); // 2 小时
  }
  
  async generateTests(sourceCode) {
    logger.info('生成测试用例', { codeLength: sourceCode.length });
    
    const prompt = `
为以下源代码生成完整的单元测试:

源代码:
\`\`\`javascript
${sourceCode}
\`\`\`

要求:
1. 使用 Vitest 框架
2. 覆盖所有函数和分支
3. 包含正常和异常情况测试
4. 添加描述性的测试名称
5. 每个测试都是独立的
    `;
    
    const response = await generateCompletion(this.config, [
      { role: 'system', content: '你是一个测试工程专家。' },
      { role: 'user', content: prompt }
    ]);
    
    return response.choices[0].message.content;
  }
  
  async generateForFunction(functionName, functionCode) {
    logger.info('为函数生成测试', { functionName });
    
    const cacheKey = `test:${functionName}`;
    
    // 检查缓存
    let tests = this.cache.get(cacheKey);
    if (tests) {
      return tests;
    }
    
    // 生成测试
    const prompt = `
为以下函数生成完整的测试套件:

\`\`\`javascript
${functionCode}
\`\`\`
    `;
    
    const response = await generateCompletion(this.config, [
      { role: 'system', content: '你是一个测试工程专家。' },
      { role: 'user', content: prompt }
    ]);
    
    tests = response.choices[0].message.content;
    
    // 缓存结果
    this.cache.set(cacheKey, tests);
    
    return tests;
  }
}

// =============================================================================
// 场景 4: 智能问答系统
// =============================================================================

class QAAssistant {
  constructor(config) {
    this.config = config;
    this.sessionManager = new SessionManager();
    this.cache = new Cache({ ttl: 1800000 }); // 30 分钟
  }
  
  async initialize(codebasePath) {
    logger.info('初始化问答系统', { path: codebasePath });
    
    // 索引代码库
    console.log('索引代码库...');
    await indexCodebase(codebasePath, this.config, {
      concurrency: 5,
      showProgress: true
    });
    
    // 创建会话
    this.session = await this.sessionManager.createSession('qa-session');
    
    logger.info('问答系统初始化完成');
  }
  
  async answer(query) {
    logger.info('回答问题', { query });
    
    const cacheKey = `qa:${query}`;
    
    // 检查缓存
    let answer = this.cache.get(cacheKey);
    if (answer) {
      logger.info('使用缓存的回答');
      return answer;
    }
    
    // 搜索相关代码
    const results = await searchCodebase(query, this.config, {
      topK: 5
    });
    
    // 构建上下文
    const context = results.map((r, i) => 
      `[代码 ${i + 1}] ${r.filepath}\n${r.content}`
    ).join('\n\n');
    
    // 生成回答
    const prompt = `
基于以下代码上下文回答问题:

问题: ${query}

相关代码:
${context}

如果代码中没有相关信息,请明确说明。
    `;
    
    const response = await generateCompletion(this.config, [
      { role: 'system', content: '你是一个代码专家,善于回答技术问题。' },
      { role: 'user', content: prompt }
    ]);
    
    answer = response.choices[0].message.content;
    
    // 保存会话
    await this.sessionManager.saveHistory([
      { role: 'user', content: query },
      { role: 'assistant', content: answer }
    ]);
    
    // 缓存回答
    this.cache.set(cacheKey, answer);
    
    return answer;
  }
}

// =============================================================================
// 场景 5: 成本优化的批量处理
// =============================================================================

class BatchProcessor {
  constructor(config) {
    this.config = config;
    this.costTracker = new CostTracker();
    this.controller = new ConcurrencyController({ maxConcurrent: 3 });
    this.cache = new Cache({ ttl: 86400000 }); // 24 小时
  }
  
  async processBatch(queries) {
    logger.info('批量处理查询', { count: queries.length });
    
    const results = [];
    const progress = new ProgressBar({ total: queries.length });
    
    for (const query of queries) {
      const result = await this.controller.add(async () => {
        return await this.processQuery(query);
      });
      
      results.push(result);
      progress.update(results.length);
    }
    
    progress.complete('批量处理完成!');
    
    // 输出成本统计
    const stats = this.costTracker.getStats();
    console.log(`\n成本统计: $${stats.totalCost.toFixed(4)}`);
    
    return results;
  }
  
  async processQuery(query) {
    const cacheKey = `batch:${Buffer.from(query).toString('base64').substring(0, 50)}`;
    
    // 检查缓存
    let result = this.cache.get(cacheKey);
    if (result) {
      logger.info('缓存命中', { query: query.substring(0, 30) });
      return result;
    }
    
    // 处理查询
    const response = await generateCompletion(this.config, [
      { role: 'user', content: query }
    ]);
    
    result = response.choices[0].message.content;
    
    // 记录使用情况
    const usage = response.usage;
    this.costTracker.trackUsage(
      this.config.model,
      usage.prompt_tokens,
      usage.completion_tokens
    );
    
    // 缓存结果
    this.cache.set(cacheKey, result);
    
    return result;
  }
}

// =============================================================================
// 场景 6: 流式代码生成
// =============================================================================

class CodeGenerator {
  constructor(config) {
    this.config = config;
  }
  
  async generateCodeStreaming(prompt) {
    logger.info('生成代码', { prompt: prompt.substring(0, 50) });
    
    console.log('\n生成的代码:\n');
    
    const stream = await chatStream(this.config, [
      { 
        role: 'system', 
        content: '你是一个专业的程序员,能够生成高质量的代码。' 
      },
      { role: 'user', content: prompt }
    ]);
    
    let code = '';
    
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        code += content;
        process.stdout.write(content);
      }
    }
    
    console.log('\n');
    
    return code;
  }
}

// =============================================================================
// 主函数 - 演示所有场景
// =============================================================================

async function main() {
  console.log('========================================');
  console.log('  xzChat 真实场景示例');
  console.log('========================================\n');
  
  try {
    const config = await loadConfig();
    
    // 场景 1: 代码审查
    console.log('\n--- 场景 1: 代码审查助手 ---\n');
    const codeReview = new CodeReviewAssistant(config);
    await codeReview.reviewPullRequest('https://github.com/user/repo/pull/123');
    
    // 场景 2: 文档生成
    console.log('\n--- 场景 2: 文档生成器 ---\n');
    const docGenerator = new DocumentationGenerator(config);
    // await docGenerator.generateFromCode('./lib');
    console.log('文档生成示例跳过(需要实际代码库)');
    
    // 场景 3: 测试生成
    console.log('\n--- 场景 3: 自动化测试生成 ---\n');
    const testGen = new TestGenerator(config);
    
    const sampleCode = `
export function add(a, b) {
  return a + b;
}

export function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}
    `;
    
    const tests = await testGen.generateTests(sampleCode);
    console.log('生成的测试:\n');
    console.log(tests);
    
    // 场景 4: 智能问答
    console.log('\n--- 场景 4: 智能问答系统 ---\n');
    const qa = new QAAssistant(config);
    // await qa.initialize('./lib');
    console.log('问答系统示例跳过(需要索引代码库)');
    
    // 场景 5: 批量处理
    console.log('\n--- 场景 5: 成本优化的批量处理 ---\n');
    const batchProcessor = new BatchProcessor(config);
    
    const queries = [
      '什么是闭包?',
      '解释 JavaScript 的事件循环',
      '什么是 React Hooks?'
    ];
    
    await batchProcessor.processBatch(queries);
    
    // 场景 6: 流式代码生成
    console.log('\n--- 场景 6: 流式代码生成 ---\n');
    const codeGen = new CodeGenerator(config);
    
    await codeGen.generateCodeStreaming(
      '写一个 JavaScript 函数,用于验证邮箱地址格式'
    );
    
    console.log('\n========================================');
    console.log('  所有场景演示完成!');
    console.log('========================================\n');
    
  } catch (error) {
    logger.error('运行失败', { error: error.message });
    console.error('错误:', error);
  }
}

// 运行主函数
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
