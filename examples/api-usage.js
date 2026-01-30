/**
 * xzChat API 使用示例
 * 
 * 本示例展示了 xzChat 核心功能的完整使用方法
 */

import {
  chatStream,
  generateCompletion,
  fetchModels
} from '../lib/chat.js';
import {
  loadConfig,
  updateConfig,
  getActiveConfig
} from '../lib/config.js';
import {
  indexCodebase,
  searchCodebase
} from '../lib/rag.js';
import {
  SessionManager
} from '../lib/utils/session-manager.js';
import {
  BranchManager
} from '../lib/utils/branch-manager.js';
import {
  Cache
} from '../lib/utils/cache.js';
import {
  CostTracker
} from '../lib/utils/cost-tracker.js';
import {
  logger
} from '../lib/utils/logger.js';
import {
  ConnectionPool,
  ConcurrencyController
} from '../lib/utils/connection-pool.js';
import {
  ProgressBar
} from '../lib/utils/progress.js';

// =============================================================================
// 示例 1: 基础聊天
// =============================================================================

async function example1_basicChat() {
  console.log('\n=== 示例 1: 基础聊天 ===\n');
  
  try {
    const config = await loadConfig();
    
    const messages = [
      { role: 'system', content: '你是一个有帮助的助手。' },
      { role: 'user', content: '请介绍一下 xzChat 项目。' }
    ];
    
    const response = await generateCompletion(config, messages);
    
    console.log('回复:', response.choices[0].message.content);
    console.log('使用的 tokens:', response.usage.total_tokens);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 2: 流式输出
// =============================================================================

async function example2_streamingChat() {
  console.log('\n=== 示例 2: 流式输出 ===\n');
  
  try {
    const config = await loadConfig();
    
    const messages = [
      { role: 'user', content: '请写一个关于人工智能的短篇故事(200字)' }
    ];
    
    const stream = await chatStream(config, messages);
    
    console.log('AI 回复: ');
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        process.stdout.write(content);
      }
    }
    
    console.log('\n');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 3: 会话管理
// =============================================================================

async function example3_sessionManagement() {
  console.log('\n=== 示例 3: 会话管理 ===\n');
  
  try {
    const sessionManager = new SessionManager();
    
    // 创建会话
    const session = await sessionManager.createSession('api-demo', {
      description: 'API 演示会话',
      tags: ['demo', 'api']
    });
    
    console.log('会话 ID:', session.id);
    console.log('会话名称:', session.name);
    
    // 添加消息
    const messages = [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好! 有什么可以帮你的吗?' },
      { role: 'user', content: '介绍一下 Node.js' }
    ];
    
    await sessionManager.saveHistory(messages);
    console.log('消息已保存');
    
    // 加载历史
    const history = await sessionManager.loadHistory();
    console.log('历史记录数量:', history.length);
    
    // 列出所有会话
    const sessions = await sessionManager.listSessions();
    console.log('总会话数:', sessions.length);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 4: 分支管理
// =============================================================================

async function example4_branchManagement() {
  console.log('\n=== 示例 4: 分支管理 ===\n');
  
  try {
    const sessionManager = new SessionManager();
    const branchManager = new BranchManager(sessionManager);
    
    // 创建会话
    const session = await sessionManager.createSession('branch-demo');
    
    // 添加消息
    const messages = [
      { role: 'user', content: '如何实现快速排序?' },
      { role: 'assistant', content: '快速排序是一种高效的排序算法...' }
    ];
    
    await sessionManager.saveHistory(messages);
    
    // 创建分支
    const branch = await branchManager.createBranch(1, 'javascript-implementation');
    console.log('分支 ID:', branch.id);
    console.log('分支名称:', branch.name);
    
    // 列出分支
    const branches = await branchManager.listBranches();
    console.log('分支数量:', branches.length);
    branches.forEach(b => {
      console.log(`  - ${b.name} (${b.id})`);
    });
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 5: 缓存使用
// =============================================================================

async function example5_caching() {
  console.log('\n=== 示例 5: 缓存使用 ===\n');
  
  try {
    // 创建缓存
    const cache = new Cache({
      ttl: 3600000, // 1 小时
      persistent: true,
      storagePath: './.cache'
    });
    
    // 设置缓存
    cache.set('user:123', { name: 'Alice', age: 30 });
    cache.set('temp:456', { data: 'temporary' }, 60000); // 1 分钟
    
    // 获取缓存
    const user = cache.get('user:123');
    console.log('缓存命中:', user);
    
    // 检查缓存是否存在
    console.log('user:123 存在:', cache.has('user:123'));
    console.log('nonexistent 存在:', cache.has('nonexistent'));
    
    // 获取缓存统计
    console.log('缓存大小:', cache.size);
    
    // 删除缓存
    cache.delete('temp:456');
    console.log('temp:456 已删除');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 6: 成本追踪
// =============================================================================

async function example6_costTracking() {
  console.log('\n=== 示例 6: 成本追踪 ===\n');
  
  try {
    const costTracker = new CostTracker();
    const config = await loadConfig();
    
    // 模拟多次请求
    const requests = [
      { inputTokens: 1000, outputTokens: 500 },
      { inputTokens: 1500, outputTokens: 800 },
      { inputTokens: 800, outputTokens: 400 }
    ];
    
    requests.forEach((req, index) => {
      costTracker.trackUsage(config.model, req.inputTokens, req.outputTokens);
      console.log(`请求 ${index + 1}: 输入 ${req.inputTokens}, 输出 ${req.outputTokens}`);
    });
    
    // 获取统计信息
    const stats = costTracker.getStats();
    console.log('\n统计信息:');
    console.log('  总请求数:', stats.totalRequests);
    console.log('  总 token 数:', stats.totalTokens);
    console.log('  总成本:', `$${stats.totalCost.toFixed(4)}`);
    console.log('  按模型统计:', stats.byModel);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 7: 连接池管理
// =============================================================================

async function example7_connectionPool() {
  console.log('\n=== 示例 7: 连接池管理 ===\n');
  
  try {
    // 创建连接池
    const pool = new ConnectionPool({
      maxConnections: 5,
      minConnections: 2,
      idleTimeout: 30000,
      connectionTimeout: 10000
    });
    
    // 使用连接池
    const results = await Promise.all([
      pool.use(async (connection) => {
        console.log('使用连接:', connection.id);
        await new Promise(resolve => setTimeout(resolve, 100));
        return '结果 1';
      }),
      pool.use(async (connection) => {
        console.log('使用连接:', connection.id);
        await new Promise(resolve => setTimeout(resolve, 150));
        return '结果 2';
      })
    ]);
    
    console.log('任务结果:', results);
    
    // 获取统计信息
    const stats = pool.getStats();
    console.log('\n连接池统计:');
    console.log('  活跃连接:', stats.activeConnections);
    console.log('  空闲连接:', stats.idleConnections);
    console.log('  总请求数:', stats.totalRequests);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 8: 并发控制
// =============================================================================

async function example8_concurrencyControl() {
  console.log('\n=== 示例 8: 并发控制 ===\n');
  
  try {
    const controller = new ConcurrencyController({
      maxConcurrent: 3
    });
    
    // 添加多个任务
    const tasks = Array.from({ length: 10 }, (_, i) =>
      controller.add(async () => {
        console.log(`任务 ${i + 1} 开始`);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        console.log(`任务 ${i + 1} 完成`);
        return `结果 ${i + 1}`;
      })
    );
    
    const results = await Promise.all(tasks);
    console.log('\n所有任务完成:', results.length);
    
    // 获取统计信息
    const stats = controller.getStats();
    console.log('\n统计信息:');
    console.log('  总任务数:', stats.totalTasks);
    console.log('  已完成任务:', stats.completedTasks);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 9: RAG 索引和搜索
// =============================================================================

async function example9_ragIndexSearch() {
  console.log('\n=== 示例 9: RAG 索引和搜索 ===\n');
  
  try {
    const config = await loadConfig();
    
    // 索引代码库
    console.log('索引代码库...');
    const chunkCount = await indexCodebase('./lib', config, {
      concurrency: 3,
      showProgress: true,
      chunkSize: 500,
      chunkOverlap: 50
    });
    
    console.log(`\n索引完成,共 ${chunkCount} 个块\n`);
    
    // 搜索代码
    console.log('搜索相关代码...');
    const results = await searchCodebase(
      '如何使用缓存?',
      config,
      { topK: 5 }
    );
    
    console.log('\n搜索结果:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.filepath}`);
      console.log(`相似度: ${result.score.toFixed(2)}`);
      console.log(result.content.substring(0, 100) + '...');
    });
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 10: 进度条
// =============================================================================

async function example10_progressBar() {
  console.log('\n=== 示例 10: 进度条 ===\n');
  
  try {
    const progress = new ProgressBar({
      total: 100,
      width: 40,
      showPercent: true,
      showETA: true
    });
    
    // 模拟任务
    for (let i = 0; i <= 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      progress.update(i);
    }
    
    console.log('\n任务完成!');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 11: 错误处理
// =============================================================================

async function example11_errorHandling() {
  console.log('\n=== 示例 11: 错误处理 ===\n');
  
  try {
    const config = await loadConfig();
    
    // 使用无效的 API Key
    const invalidConfig = {
      ...config,
      apiKey: 'invalid-key'
    };
    
    try {
      await generateCompletion(invalidConfig, [
        { role: 'user', content: 'Hello' }
      ]);
    } catch (error) {
      console.error('捕获到错误:');
      console.error('  错误类型:', error.constructor.name);
      console.error('  错误消息:', error.message);
      
      // 记录错误
      logger.error('API 请求失败', {
        error: error.message,
        statusCode: error.statusCode
      });
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 12: 配置管理
// =============================================================================

async function example12_configManagement() {
  console.log('\n=== 示例 12: 配置管理 ===\n');
  
  try {
    // 加载配置
    const config = await loadConfig();
    console.log('当前配置:');
    console.log('  API Base URL:', config.baseUrl);
    console.log('  模型:', config.model);
    console.log('  温度:', config.temperature);
    
    // 更新配置
    await updateConfig('temperature', 0.8);
    console.log('\n温度已更新为: 0.8');
    
    // 获取更新后的配置
    const updatedConfig = getActiveConfig();
    console.log('更新后的温度:', updatedConfig.temperature);
    
    // 创建 Profile
    await updateConfig('model', 'gpt-4-turbo', 'dev');
    await updateConfig('temperature', 0.5, 'dev');
    console.log('\n开发环境 Profile 已创建');
    
    // 加载指定 Profile
    const devConfig = await loadConfig('dev');
    console.log('开发环境配置:');
    console.log('  模型:', devConfig.model);
    console.log('  温度:', devConfig.temperature);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 13: 日志记录
// =============================================================================

async function example13_logging() {
  console.log('\n=== 示例 13: 日志记录 ===\n');
  
  try {
    // 设置日志级别
    logger.setLevel('debug');
    
    // 记录不同级别的日志
    logger.debug('调试信息', { requestId: 123 });
    logger.info('一般信息', { action: 'login', userId: 456 });
    logger.warn('警告信息', { responseTime: 5000, threshold: 3000 });
    logger.error('错误信息', { error: 'Timeout', statusCode: 504 });
    
    console.log('\n日志已记录到控制台和文件');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 示例 14: 综合应用
// =============================================================================

async function example14_comprehensive() {
  console.log('\n=== 示例 14: 综合应用 ===\n');
  
  try {
    // 1. 初始化
    const config = await loadConfig();
    const sessionManager = new SessionManager();
    const costTracker = new CostTracker();
    const cache = new Cache({ ttl: 3600000 });
    
    // 2. 创建会话
    const session = await sessionManager.createSession('comprehensive-demo');
    console.log('会话创建:', session.id);
    
    // 3. 发送消息
    const messages = [
      { role: 'system', content: '你是一个有帮助的助手。' },
      { role: 'user', content: '请用一句话介绍 JavaScript。' }
    ];
    
    // 4. 检查缓存
    const cacheKey = 'response:javascript-intro';
    let response = cache.get(cacheKey);
    
    if (!response) {
      console.log('缓存未命中,调用 API...');
      
      // 5. 发送请求
      const apiResponse = await generateCompletion(config, messages);
      response = apiResponse.choices[0].message.content;
      
      // 6. 记录使用情况
      const usage = apiResponse.usage;
      costTracker.trackUsage(config.model, usage.prompt_tokens, usage.completion_tokens);
      
      // 7. 缓存结果
      cache.set(cacheKey, response);
    } else {
      console.log('缓存命中!');
    }
    
    console.log('\n回复:', response);
    
    // 8. 保存历史
    await sessionManager.saveHistory(messages);
    
    // 9. 显示统计
    const stats = costTracker.getStats();
    console.log('\n成本统计:');
    console.log('  总 tokens:', stats.totalTokens);
    console.log('  总成本:', `$${stats.totalCost.toFixed(4)}`);
    
    console.log('\n缓存统计:');
    console.log('  缓存大小:', cache.size);
  } catch (error) {
    console.error('错误:', error.message);
  }
}

// =============================================================================
// 主函数
// =============================================================================

async function main() {
  console.log('========================================');
  console.log('  xzChat API 使用示例集');
  console.log('========================================');
  
  // 运行所有示例
  await example1_basicChat();
  await example2_streamingChat();
  await example3_sessionManagement();
  await example4_branchManagement();
  await example5_caching();
  await example6_costTracking();
  await example7_connectionPool();
  await example8_concurrencyControl();
  // await example9_ragIndexSearch(); // 需要实际代码库
  await example10_progressBar();
  await example11_errorHandling();
  await example12_configManagement();
  await example13_logging();
  await example14_comprehensive();
  
  console.log('\n========================================');
  console.log('  所有示例运行完成!');
  console.log('========================================\n');
}

// 运行主函数
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
