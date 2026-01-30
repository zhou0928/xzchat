/**
 * TypeScript 类型定义使用示例
 * 演示如何在 JavaScript 项目中使用 JSDoc 注释来获得类型提示
 */

import { chat } from '../lib/chat.js';
import { searchCodebase } from '../lib/rag.js';
import { loadConfig } from '../lib/config.js';

// ============================================================================
// 示例 1: 使用 JSDoc 定义配置类型
// ============================================================================

/**
 * @type {import('../types/config').Config}
 */
const config = {
  apiKey: 'sk-xxx',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  provider: 'openai',
  profiles: {
    default: {
      apiKey: 'sk-xxx',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      systemPrompt: '你是一个有用的助手'
    }
  },
  currentProfile: 'default',
  roles: {
    coder: '你是一个资深的工程师',
    writer: '你是一个专业的作家'
  }
};

// ============================================================================
// 示例 2: 定义聊天消息
// ============================================================================

/**
 * @type {import('../types/chat').ChatMessage[]}
 */
const messages = [
  {
    role: 'system',
    content: '你是一个有用的助手'
  },
  {
    role: 'user',
    content: '你好，请介绍一下 TypeScript 类型定义'
  }
];

// ============================================================================
// 示例 3: 定义聊天选项
// ============================================================================

/**
 * @type {import('../types/chat').ChatOptions}
 */
const chatOptions = {
  stream: true,
  temperature: 0.7,
  maxTokens: 2000,
  showThinking: true,
  tools: [
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: '读取文件',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string' }
          },
          required: ['path']
        }
      }
    }
  ]
};

// ============================================================================
// 示例 4: 发起聊天并处理响应
// ============================================================================

/**
 * 处理聊天响应
 * @param {import('../types/chat').ChatResponse} response
 */
function handleChatResponse(response) {
  const message = response.message;
  const usage = response.usage;
  const cost = response.cost;

  console.log('AI 回复:', message.content);

  if (usage) {
    console.log(`Tokens: ${usage.prompt_tokens} + ${usage.completion_tokens} = ${usage.total_tokens}`);
  }

  if (cost) {
    console.log(`Cost: $${cost.total.toFixed(6)}`);
  }
}

// 使用示例
async function example1() {
  try {
    const response = await chat(messages, config, chatOptions);
    handleChatResponse(response);
  } catch (error) {
    console.error('聊天失败:', error.message);
  }
}

// ============================================================================
// 示例 5: RAG 搜索
// ============================================================================

/**
 * RAG 搜索选项
 * @type {import('../types/rag').RAGSearchOptions}
 */
const searchOptions = {
  topK: 5,
  useCache: true
};

/**
 * 执行 RAG 搜索
 * @param {string} query - 搜索查询
 * @param {string} dir - 搜索目录
 */
async function example2(query, dir) {
  try {
    /** @type {import('../types/rag').RAGSearchResult[]} */
    const results = await searchCodebase(query, dir, config, searchOptions);

    console.log(`找到 ${results.length} 个相关片段:`);
    results.forEach((result, index) => {
      console.log(`\n[${index + 1}] ${result.file} (score: ${result.score.toFixed(4)})`);
      console.log(result.content.substring(0, 200) + '...');
    });
  } catch (error) {
    console.error('搜索失败:', error.message);
  }
}

// ============================================================================
// 示例 6: 错误处理
// ============================================================================

/**
 * 处理 xzChat 错误
 * @param {Error} error
 */
function handleError(error) {
  // 检查是否是 xzChat 错误
  if (error.code) {
    console.error(`[${error.code}] ${error.message}`);

    if (error.details) {
      console.error('Details:', error.details);
    }

    // 根据错误类型处理
    switch (error.code) {
      case 'CONFIG_ERROR':
        console.error('请检查配置文件');
        break;
      case 'API_ERROR':
        console.error('API 请求失败，请检查网络和 API Key');
        break;
      case 'FILESYSTEM_ERROR':
        console.error(`文件操作失败: ${error.path}`);
        break;
      case 'NETWORK_ERROR':
        console.error('网络连接失败');
        break;
      case 'VALIDATION_ERROR':
        console.error(`参数验证失败: ${error.field}`);
        break;
    }
  } else {
    console.error('未知错误:', error.message);
  }
}

// ============================================================================
// 示例 7: 使用缓存
// ============================================================================

/**
 * @type {import('../types/cache').LRUCache<number[]>}
 */
let cache = null;

async function example3() {
  const { LRUCache } = await import('../lib/utils/cache.js');

  cache = new LRUCache({
    maxSize: 1000,
    ttl: 3600000 // 1 hour
  });

  // 缓存数据
  cache.set('key1', [1, 2, 3, 4, 5]);
  cache.set('key2', [6, 7, 8, 9, 10], 7200000); // 2 hours

  // 获取数据
  const data1 = cache.get('key1');
  const data2 = cache.get('key2');

  console.log('Cached data:', data1, data2);

  // 查看统计信息
  const stats = cache.getStats();
  console.log('Cache stats:', {
    size: stats.size,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${stats.hitRate.toFixed(2)}%`
  });
}

// ============================================================================
// 示例 8: 使用日志
// ============================================================================

/**
 * @type {import('../types/logger').Logger}
 */
let logger = null;

async function example4() {
  const { logger: log } = await import('../lib/utils/logger.js');

  logger = log;

  // 不同级别的日志
  logger.debug('调试信息', { userId: '123', action: 'login' });
  logger.info('普通信息', '用户登录成功');
  logger.warn('警告信息', 'API 速率限制接近');
  logger.error('错误信息', new Error('API 请求失败'));

  // 设置日志级别
  logger.setLevel('DEBUG');

  // 带上下文的日志
  logger.info('处理文件', {
    file: '/path/to/file.js',
    size: 1024,
    lines: 100
  });
}

// ============================================================================
// 示例 9: 流式聊天
// ============================================================================

/**
 * 流式聊天回调
 * @callback StreamCallback
 * @param {string} chunk - 接收的文本块
 * @returns {void}
 */

/**
 * @param {import('../types/chat').ChatMessage[]} messages
 * @param {import('../types/config').Config} config
 * @param {StreamCallback} onChunk
 */
async function streamChatExample(messages, config, onChunk) {
  const { streamChat } = await import('../lib/chat.js');

  const response = await streamChat(
    messages,
    config,
    { stream: true },
    onChunk
  );

  console.log('\n完成!');
  handleChatResponse(response);
}

// 使用流式聊天
async function example5() {
  await streamChatExample(
    messages,
    config,
    (chunk) => {
      process.stdout.write(chunk);
    }
  );
}

// ============================================================================
// 示例 10: 完整的工作流程
// ============================================================================

/**
 * 完整的工作流程示例
 */
async function completeWorkflow() {
  try {
    // 1. 加载配置
    const loadedConfig = await loadConfig();
    console.log('配置加载成功');

    // 2. 发起聊天
    const chatMessages = [
      { role: 'system', content: '你是一个代码助手' },
      { role: 'user', content: '帮我解释一下 TypeScript 的类型系统' }
    ];

    const response = await chat(chatMessages, loadedConfig, {
      temperature: 0.7,
      maxTokens: 1000
    });

    console.log('AI 回复:', response.message.content);

    // 3. 处理结果
    if (response.usage) {
      console.log(`使用 Tokens: ${response.usage.total_tokens}`);
    }

    if (response.cost) {
      console.log(`花费: $${response.cost.total.toFixed(6)}`);
    }

  } catch (error) {
    handleError(error);
  }
}

// ============================================================================
// 导出示例函数
// ============================================================================

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  completeWorkflow,
  handleChatResponse,
  handleError
};

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('TypeScript 类型定义使用示例');
  console.log('================================\n');

  // 运行示例
  // await completeWorkflow();
  console.log('取消注释示例函数来运行它们');
}
