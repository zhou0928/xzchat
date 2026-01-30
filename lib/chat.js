
import { Spinner, StreamPrinter } from "./ui.js";
import { sleep, calculateCost } from "./utils.js";
import { updateConfig, setProfileValue, loadCcSwitchActiveEndpoint, clearCcSwitchCache, mapCcSwitchProvider } from "./config.js";
import { builtInTools } from "./tools.js";
import fetch from "node-fetch";
import { logger } from "./utils/logger.js";

// 上一次的 CC Switch 配置快照（用于检测变化）
let lastCcSwitchConfig = {
    appType: null,
    name: null,
    baseUrl: null,
    apiKey: null,
    model: null,
    timestamp: 0
};

/**
 * 检测 CC Switch 配置是否发生变化
 */
function hasCcSwitchChanged() {
    try {
        const currentEndpoint = loadCcSwitchActiveEndpoint();
        const now = Date.now();

        // 如果没有 CC Switch 配置，返回 false
        if (!currentEndpoint) {
            return false;
        }

        // 获取当前配置的关键字段
        const currentConfig = {
            appType: currentEndpoint.appType,
            name: currentEndpoint.name,
            baseUrl: currentEndpoint.baseUrl,
            apiKey: currentEndpoint.apiKey,
            model: currentEndpoint.model
        };

        // 比较关键字段
        const hasChanged =
            lastCcSwitchConfig.appType !== currentConfig.appType ||
            lastCcSwitchConfig.name !== currentConfig.name ||
            lastCcSwitchConfig.baseUrl !== currentConfig.baseUrl ||
            lastCcSwitchConfig.apiKey !== currentConfig.apiKey ||
            lastCcSwitchConfig.model !== currentConfig.model;

        if (hasChanged) {
            // 更新快照
            lastCcSwitchConfig = {
                ...currentConfig,
                timestamp: now
            };
            return true;
        }

        return false;
    } catch (error) {
        logger.warn('检测 CC Switch 配置变化时出错:', error.message);
        return false;
    }
}

/**
 * 检查是否为 Claude/Anthropic 模型
 */
function isAnthropicModel(model) {
  return model && (
    model.toLowerCase().includes('claude') ||
    model.toLowerCase().includes('anthropic')
  );
}

/**
 * 验证和规范化工具格式
 * 确保所有工具都符合 OpenAI 标准格式: { type: "function", function: { name, description, parameters } }
 */
function validateAndNormalizeTools(tools) {
  if (!tools || !Array.isArray(tools)) {
    return [];
  }

  return tools.filter(tool => {
    // 检查必需字段
    if (!tool || typeof tool !== 'object') {
      return false;
    }

    // 如果是扁平格式，转换为嵌套格式
    if (tool.type === 'function' && tool.name && !tool.function) {
      tool.function = {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      };
      delete tool.name;
      delete tool.description;
      delete tool.parameters;
    }

    // 验证嵌套格式
    if (!tool.type || tool.type !== 'function') {
      return false;
    }

    if (!tool.function || !tool.function.name) {
      return false;
    }

    return true;
  });
}

/**
 * 根据模型和 baseUrl 构建正确的 API 端点
 */
function buildApiEndpoint(config) {
  let baseUrl = config.baseUrl || '';
  const model = config.model || '';

  // 移除末尾斜杠
  baseUrl = baseUrl.replace(/\/$/, '');

  // 如果 baseUrl 已经包含完整路径（例如 /v1/messages），直接返回
  if (baseUrl.includes('/messages') || baseUrl.includes('/chat/completions')) {
    return baseUrl;
  }

  // 检测是否为需要特殊处理的 API 提供商
  // 某些 API 聚合平台（如 tribiosapi.top）对 Claude 模型也使用 /v1/chat/completions
  const isAggregatorProvider = baseUrl.includes('tribiosapi.top') ||
                                 baseUrl.includes('one-api') ||
                                 baseUrl.includes('openai-forward') ||
                                 baseUrl.includes('api2d');

  // 对于 API 聚合平台，统一使用 /v1/chat/completions
  if (isAggregatorProvider) {
    // 确保有 /v1
    if (!baseUrl.endsWith('/v1') && !baseUrl.includes('/v1/')) {
      baseUrl = `${baseUrl}/v1`;
    }
    return `${baseUrl}/chat/completions`;
  }

  // Claude/Anthropic 模型使用 /v1/messages（仅限官方 API）
  if (isAnthropicModel(model)) {
    // 确保有 /v1
    if (!baseUrl.endsWith('/v1') && !baseUrl.includes('/v1/')) {
      baseUrl = `${baseUrl}/v1`;
    }
    return `${baseUrl}/messages`;
  }

  // 其他模型使用 /v1/chat/completions
  // 确保有 /v1
  if (!baseUrl.endsWith('/v1') && !baseUrl.includes('/v1/')) {
    baseUrl = `${baseUrl}/v1`;
  }
  return `${baseUrl}/chat/completions`;
}

// 尝试加载 Markdown 渲染库
let marked;
try {
  marked = (await import('marked')).marked;
  const TerminalRenderer = (await import('marked-terminal')).default;
  marked.setOptions({ renderer: new TerminalRenderer() });
} catch (e) {
  logger.debug('Markdown 渲染库加载失败，将使用纯文本', { error: e.message });
}

export async function requestWithRetry(url, options, maxRetries = 3) {
    let lastError;
    let useNoProxy = false;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            let res;
            if (useNoProxy) {
                // node-fetch 不支持 undici 的 dispatcher，这里简化处理
                res = await fetch(url, options);
            } else {
                res = await fetch(url, options);
            }

            if (!res.ok) {
                const text = await res.text();
                // 4xx errors: do not retry
                if (res.status >= 400 && res.status < 500) {
                     if (res.status === 400) {
                        console.log(`\n❌ API请求参数错误 (400)。调试信息:`);
                        console.log(`- Endpoint: ${url}`);
                        
                        try {
                             const bodyObj = options.body ? JSON.parse(options.body) : {};
                             console.log(`- Model: ${bodyObj.model}`);
                             console.log(`- Max Tokens: ${bodyObj.max_tokens}`);
                             console.log(`- Stream: ${bodyObj.stream}`);
                             console.log(`- Messages Count: ${bodyObj.messages?.length}`);
                             // 打印出前3条消息的角色，帮助排查是否有异常角色 (如 'tool' 但没有对应的 call_id)
                             if (bodyObj.messages?.length > 0) {
                                 console.log(`- Msg Roles (first 3): ${bodyObj.messages.slice(0, 3).map(m => m.role).join(', ')}`);
                                 console.log(`- Msg Roles (last 3): ${bodyObj.messages.slice(-3).map(m => m.role).join(', ')}`);
                             }
                         } catch (e) {
                             console.log(`- Body Parsing Failed: ${e.message}`);
                         }

                        // 尝试解析并打印更友好的错误
                        try {
                            const errJson = JSON.parse(text);
                            console.log(`- Server Message: ${errJson.error?.message || text}`);
                        } catch {
                            console.log(`- Server Response: ${text}`);
                        }
                        
                        // 提示用户检查配置
                        if (url.includes("tribiosapi")) {
                            console.log("- 提示: 默认模型 'claude-sonnet-4-5-20250929' 可能已过期或不可用。");
                            console.log("  请尝试运行 'npx xiaozhou-chat config --model=gpt-4o' 切换模型。");
                        } else {
                            console.log("- 提示: 请检查当前模型名称是否与您的 API 提供商兼容。");
                        }
                        console.log(`- Config Source: 检查当前目录或 ~ 目录下是否存在 .newapi-chat-config.json`);
                     }
                     throw new Error(`API Error (${res.status}): ${text}`);
                }
                // 5xx errors: retry
                throw new Error(`Server Error (${res.status}): ${text}`);
            }
            return res;
        } catch (e) {
            lastError = e;
            if (e.name === 'AbortError') throw e;

            // 智能代理 fallback: 如果失败且环境中有代理配置，尝试直连
            const isNetworkError = e.message.includes("fetch failed") || e.cause?.code === 'ECONNREFUSED' || e.cause?.code === 'ETIMEDOUT';
            const hasProxyEnv = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.ALL_PROXY;

            if (isNetworkError && hasProxyEnv && !useNoProxy) {
                console.log(`\n⚠️  检测到网络错误，且存在代理环境变量 (${process.env.HTTPS_PROXY || process.env.HTTP_PROXY})`);
                console.log("🔄 自动尝试忽略代理进行直连...");
                useNoProxy = true;
                // 不计入重试次数，立即重试
                i--; 
                continue;
            }

            if (i === maxRetries) break;
            
            const delay = 1000 * Math.pow(2, i);
            // console.log(`⚠️  请求失败，${delay}ms 后重试...`); // Optional: callback for logging?
            
            if (options.signal?.aborted) throw new Error("Aborted during retry wait");
            await sleep(delay);
        }
    }
    throw lastError;
}

export async function generateCompletion(config, messages, options = {}) {
    const {
        model = config.model,
        max_tokens = 4096,
        jsonMode = false
    } = options;

    // 使用智能端点构建
    const requestUrl = buildApiEndpoint({ ...config, model });
    const finalUrl = (requestUrl.includes("/v1/") || requestUrl.endsWith("/v1")) 
        ? requestUrl 
        : requestUrl.replace("/chat/completions", "/v1/chat/completions");

    const body = {
        model,
        messages,
        stream: false,
        max_tokens
    };
    
    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const res = await requestWithRetry(finalUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
}

export async function fetchModels(config) {
    let base = config.baseUrl || "";
    if (!base) throw new Error("Base URL is empty");
    let url;
    if (base.endsWith("/v1") || base.endsWith("/v1/")) {
        url = `${base}/models`;
    } else {
        url = `${base.replace(/\/$/, "")}/v1/models`;
    }
    const res = await requestWithRetry(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${config.apiKey}`
        }
    });
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.models)) return data.models;
    return data;
}

export async function chatStream(context, userInput = null, options = {}) {
    const {
        messages,
        config,
        mcpClients,
        toolHandlers, // Function: (name, args) => result
        signal
    } = context;

    const { isRecursion = false, recursionDepth = 0 } = options;

    // 防止无限递归
    if (recursionDepth > 15) {
        console.log("\n⚠️  达到最大工具调用深度限制 (15)，停止自动执行。");
        return "Max recursion depth reached.";
    }

    // 初始化 CC Switch 配置快照（第一次调用时）
    if (lastCcSwitchConfig.timestamp === 0) {
        const ccEndpoint = loadCcSwitchActiveEndpoint(true); // 强制刷新
        if (ccEndpoint) {
            lastCcSwitchConfig = {
                appType: ccEndpoint.appType,
                name: ccEndpoint.name,
                baseUrl: ccEndpoint.baseUrl,
                apiKey: ccEndpoint.apiKey,
                model: ccEndpoint.model,
                timestamp: Date.now()
            };

            // 如果当前使用的是 tribiosapi.top，强制应用 CC Switch 配置
            // 这样可以确保启动时就使用正确的配置
            if (ccEndpoint.baseUrl && (config.baseUrl?.includes('tribiosapi.top') || !config.baseUrl || config.providerName !== ccEndpoint.name)) {
                logger.debug('应用 CC Switch 配置到当前 session');
                if (ccEndpoint.baseUrl) config.baseUrl = ccEndpoint.baseUrl;
                if (ccEndpoint.apiKey) config.apiKey = ccEndpoint.apiKey;
                if (ccEndpoint.model) config.model = ccEndpoint.model;
                const ccProvider = mapCcSwitchProvider(ccEndpoint?.appType, ccEndpoint?.name);
                if (ccProvider) config.provider = ccProvider;
                config.providerName = ccEndpoint.name;

                logger.debug('初始化应用 CC Switch 配置:', {
                    baseUrl: config.baseUrl,
                    model: config.model,
                    provider: config.provider,
                    providerName: config.providerName
                });

                // 持久化保存配置
                updateConfig("baseUrl", ccEndpoint.baseUrl);
                updateConfig("apiKey", ccEndpoint.apiKey);
                updateConfig("model", ccEndpoint.model);
                updateConfig("provider", ccProvider);

                if (config.currentProfile) {
                    setProfileValue(config.currentProfile, "baseUrl", ccEndpoint.baseUrl);
                    setProfileValue(config.currentProfile, "apiKey", ccEndpoint.apiKey);
                    setProfileValue(config.currentProfile, "model", ccEndpoint.model);
                }

                console.log(`\n🔄 已同步 CC Switch 配置:`);
                console.log(`   模型: ${ccEndpoint.name || ccEndpoint.model}`);
                console.log(`   模型ID: ${ccEndpoint.model}`);
                console.log(`   提供商: ${ccEndpoint.appType}`);
                console.log();
            }
        }
    }

    // 自动检测 CC Switch 配置变化
    if (hasCcSwitchChanged()) {
        console.log("\n🔄 检测到 CC Switch 配置已更新，自动重新加载配置...\n");

        // 清除 CC Switch 缓存并强制重新加载
        clearCcSwitchCache();
        const ccEndpoint = loadCcSwitchActiveEndpoint(true); // 强制刷新
        const ccProvider = mapCcSwitchProvider(ccEndpoint?.appType, ccEndpoint?.name);

        logger.debug('重新加载的 CC Endpoint:', ccEndpoint);

        // 更新内存中的配置（只更新非空字段）
        if (ccEndpoint) {
            if (ccEndpoint.baseUrl) config.baseUrl = ccEndpoint.baseUrl;
            if (ccEndpoint.apiKey) config.apiKey = ccEndpoint.apiKey;
            if (ccEndpoint.model) config.model = ccEndpoint.model;
            if (ccProvider) config.provider = ccProvider;
            config.providerName = ccEndpoint.name;

            logger.debug('更新后的配置:', {
                baseUrl: config.baseUrl,
                model: config.model,
                provider: config.provider,
                providerName: config.providerName
            });

            // 持久化保存配置（只更新非空字段）
            if (ccEndpoint.baseUrl) updateConfig("baseUrl", ccEndpoint.baseUrl);
            if (ccEndpoint.apiKey) updateConfig("apiKey", ccEndpoint.apiKey);
            if (ccEndpoint.model) updateConfig("model", ccEndpoint.model);
            if (ccProvider) updateConfig("provider", ccProvider);

            // 同时更新当前 Profile
            if (config.currentProfile) {
                if (ccEndpoint.baseUrl) setProfileValue(config.currentProfile, "baseUrl", ccEndpoint.baseUrl);
                if (ccEndpoint.apiKey) setProfileValue(config.currentProfile, "apiKey", ccEndpoint.apiKey);
                if (ccEndpoint.model) setProfileValue(config.currentProfile, "model", ccEndpoint.model);
            }

            console.log("✅ 配置已自动更新:");
            console.log(`   模型: ${ccEndpoint.name || ccEndpoint.model}`);
            console.log(`   模型ID: ${ccEndpoint.model}`);
            console.log(`   提供商: ${ccEndpoint.appType}`);
            console.log();
        } else {
            console.log("⚠️  未能加载 CC Switch 配置");
        }
    }

    if (userInput) {
        messages.push({ role: "user", content: userInput });
    }

    // 构造 Tools 定义
    let tools = context.tools || [];
    // 验证和规范化工具格式
    tools = validateAndNormalizeTools(tools);

    // 调试: 打印工具信息
    if (tools.length > 0) {
        logger.debug('Tools info', { 
            count: tools.length, 
            firstToolName: tools[0].function?.name,
            firstToolFormat: tools[0].function ? 'nested' : 'flat'
        });
    }

    // 处理 System Prompt
    let requestMessages = messages;

    // 构建基础 System Prompt（包含模型信息）
    let baseSystemPrompt = "";
    if (config.model) {
        const modelName = config.model;

        // 根据 model ID 友好显示模型名称
        let friendlyName = modelName;
        if (modelName.includes('claude')) {
            if (modelName.includes('3.5') || modelName.includes('3-5')) {
                friendlyName = "Claude 3.5 Sonnet";
            } else if (modelName.includes('opus')) {
                friendlyName = "Claude 3 Opus";
            } else if (modelName.includes('4.5') || modelName.includes('4-5')) {
                friendlyName = "Claude Sonnet 4.5";
            } else {
                friendlyName = modelName;
            }
        } else if (modelName.includes('gpt')) {
            if (modelName.includes('4')) {
                friendlyName = "GPT-4";
            } else if (modelName.includes('3.5')) {
                friendlyName = "GPT-3.5 Turbo";
            } else if (modelName.includes('5')) {
                friendlyName = "GPT-5";
            } else {
                friendlyName = modelName;
            }
        } else if (modelName.includes('codex')) {
            friendlyName = modelName;
        } else if (modelName.includes('deepseek')) {
            if (modelName.includes('coder')) {
                friendlyName = "DeepSeek Coder";
            } else {
                friendlyName = "DeepSeek";
            }
        } else if (modelName.includes('moonshot')) {
            friendlyName = "Moonshot";
        } else {
            friendlyName = modelName;
        }

        // 根据 modelName 判断实际的提供商
        let actualProvider = "未知提供商";
        if (modelName.includes('claude')) {
            actualProvider = "Anthropic (Claude)";
        } else if (modelName.includes('gpt') || modelName.includes('codex')) {
            actualProvider = "OpenAI (GPT/Codex)";
        } else if (modelName.includes('deepseek')) {
            actualProvider = "DeepSeek";
        } else if (modelName.includes('moonshot')) {
            actualProvider = "Moonshot AI";
        }

        baseSystemPrompt = `你使用的是 ${friendlyName} 模型，模型 ID 是 ${modelName}。提供商是 ${actualProvider}。`;

        // 如果是 tribiosapi.top，说明是通过 CC Switch
        if (config.baseUrl?.includes('tribiosapi.top')) {
            baseSystemPrompt += " 此配置来自 CC Switch。";
        }
        baseSystemPrompt += "\n\n";
    }

    if (config.systemPrompt) {
         // 合并基础提示和用户自定义提示
         const finalSystemPrompt = baseSystemPrompt + config.systemPrompt;
         const sysMsg = { role: "system", content: finalSystemPrompt };
         if (messages.length > 0 && messages[0].role === "system") {
             requestMessages = [sysMsg, ...messages.filter(m => m.role !== "system")];
         } else {
             requestMessages = [sysMsg, ...messages];
         }
    } else if (baseSystemPrompt) {
        // 即使用户没有配置 system prompt，也添加模型信息
        const sysMsg = { role: "system", content: baseSystemPrompt };
        if (messages.length > 0 && messages[0].role === "system") {
            requestMessages = [sysMsg, ...messages.filter(m => m.role !== "system")];
        } else {
            requestMessages = [sysMsg, ...messages];
        }
    }

    // 构造请求 Body
    const createBody = (withTools = true) => {
        let safeMessages = requestMessages;

        // 如果禁用工具，必须清理消息历史中的工具相关字段，否则会导致 400 错误
        if (!withTools) {
            safeMessages = requestMessages
                .filter(m => m.role !== 'tool') // 移除工具输出
                .map(m => {
                    if (m.role === 'assistant' && m.tool_calls) {
                        // 移除 tool_calls 字段
                        const { tool_calls, ...rest } = m;
                        return rest;
                    }
                    return m;
                })
                .filter(m => {
                    // 移除可能变为空的助手消息 (既没内容也没工具调用)
                    if (m.role === 'assistant' && !m.content) return false;
                    return true;
                });
        }

        const body = {
            model: config.model,
            messages: safeMessages,
            stream: true, 
            max_tokens: 8192
        };
        // 只有当 withTools 为 true 且确实有工具时才添加 tools 字段
        // 注意: 某些 API (如 gpt-4-0314, claude-2 等) 可能不支持空的 tools 数组或不支持 tools 字段
        if (withTools && tools && tools.length > 0) {
            body.tools = tools;
        }
        return body;
    };

    const spinner = new Spinner(isRecursion ? "AI 正在分析工具结果..." : "AI 正在思考...");
    spinner.start();

    const printer = new StreamPrinter();

    // 使用智能端点构建
    let requestUrl = buildApiEndpoint(config);

    let shouldRetryWithV1 = false;
    let fallbackToChatCompletions = false;

    // 多次尝试不同端点和配置
    const attempts = [
        { url: requestUrl, withTools: true, description: "默认配置（带工具）" },
        { url: requestUrl, withTools: false, description: "禁用工具" },
    ];

    // 如果是 Claude 端点 (/v1/messages)，添加回退到 /v1/chat/completions
    if (requestUrl.includes('/messages')) {
        attempts.push({
            url: requestUrl.replace('/messages', '/chat/completions'),
            withTools: false,
            description: "切换到 /v1/chat/completions 端点"
        });
    }

    let res;
    let usedTools = true;

    for (const attempt of attempts) {
        try {
            requestUrl = attempt.url;
            const body = createBody(attempt.withTools);
            usedTools = attempt.withTools;

            logger.debug(`尝试请求: ${attempt.description}`, { url: requestUrl });

            res = await requestWithRetry(requestUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(body),
                signal: signal
            }, 1);

            // 请求成功，跳出循环
            break;
        } catch (e) {
            logger.debug(`请求失败: ${attempt.description}`, { error: e.message });
            // 继续下一次尝试
            if (attempt === attempts[attempts.length - 1]) {
                // 最后一次尝试也失败了，抛出错误
                throw e;
            }
        }
    }

    try {
        // 智能检测 HTML (404/BaseUrl 错误)
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            if (!config.baseUrl.endsWith("/v1") && !config.baseUrl.endsWith("/v1/")) {
                requestUrl = `${config.baseUrl}/v1/chat/completions`;
                shouldRetryWithV1 = true;
                // 重试 (保持降级状态)
                res = await requestWithRetry(requestUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${config.apiKey}`
                    },
                    body: JSON.stringify(createBody(usedTools)),
                    signal: signal
                });
            }
        }

        // 停止 Spinner
        spinner.stop();

        // 检查是否是非流式响应 (JSON)
        if (contentType && contentType.includes("application/json") && !createBody().stream) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content || "";
            printer.print(content);
            printer.stop();
            return { content };
        }

        // 准备流式输出
        // spinner.stop(); // 移到上面了
        
        if (shouldRetryWithV1 && res.ok && !res.headers.get("content-type")?.includes("text/html")) {
             // 静默保存配置
             try {
                 const correctBaseUrl = config.baseUrl.endsWith("/") 
                    ? config.baseUrl + "v1" 
                    : config.baseUrl + "/v1";
                 
                 // 1. 更新内存配置
                 config.baseUrl = correctBaseUrl;
                 
                 // 2. 永久保存配置 (同时更新顶层和当前 Profile)
                 updateConfig("baseUrl", correctBaseUrl);
                 if (config.currentProfile) {
                     setProfileValue(config.currentProfile, "baseUrl", correctBaseUrl);
                 }
             } catch (e) {
                 // ignore save error
             }
        }

        if (!res.body) throw new Error("Response body is empty");
        
        // Node-fetch body is a Node.js stream, not a Web ReadableStream
        // We need to handle it accordingly
        const reader = res.body; 
        const decoder = new TextDecoder("utf-8");
        let reply = "";
        let buffer = "";
        let currentToolCalls = {}; 
        let usageInfo = null;
        let hasReceivedContent = false;
        
        // DeepSeek Thinking State
        let isThinking = false;
        let thinkBuffer = "";

        for await (const chunk of reader) {
            const value = chunk; // node-fetch returns Buffer
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.trim()) continue;
                
                if (!line.startsWith("data:")) {
                    // 尝试检测非流式错误返回
                    try {
                        const json = JSON.parse(line);
                        if (json.error) {
                            throw new Error(json.error.message || JSON.stringify(json.error));
                        }
                    } catch (e) {
                        if (e.message.includes("JSON")) {
                            // ignore json parse error, just bad format
                        } else {
                            throw e; // rethrow actual API error
                        }
                    }
                    continue;
                }

                const data = line.slice(5).trim();
                if (data === "[DONE]") break;

                try {
                    const json = JSON.parse(data);
                    if (json.usage) {
                        usageInfo = json.usage;
                        continue;
                    }
                    const delta = json.choices?.[0]?.delta;
                    
                    if (delta?.content) {
                        let content = delta.content;
                        
                        // Detect <think> start
                        if (!isThinking && content.includes("<think>")) {
                            isThinking = true;
                            const parts = content.split("<think>");
                            if (parts[0]) printer.add(parts[0]); // content before think
                            
                            // Check config to show/hide thinking
                            if (config.showThinking !== false) {
                                printer.stop(); // Flush current line
                                console.log("\x1b[90m🤔 思考过程:\x1b[0m"); // Gray header
                                process.stdout.write("\x1b[90m"); // Start gray
                            }
                            
                            content = parts[1] || "";
                        }

                        if (isThinking) {
                            thinkBuffer += content;
                            const endTagIndex = thinkBuffer.indexOf("</think>");
                            
                            if (endTagIndex !== -1) {
                                isThinking = false;
                                // Calculate where the tag ends relative to the current content chunk
                                const endOfTag = endTagIndex + 8; // length of </think>
                                const currentChunkStart = thinkBuffer.length - content.length;
                                const splitPoint = endOfTag - currentChunkStart;
                                
                                if (splitPoint > 0) {
                                    // Print the part of content that belongs to the thought (or closing tag)
                                    if (config.showThinking !== false) {
                                        process.stdout.write(content.slice(0, splitPoint));
                                    }
                                }
                                
                                if (config.showThinking !== false) {
                                    // Reset color
                                    process.stdout.write("\x1b[0m\n"); 
                                    console.log(""); // Empty line separator
                                }
                                
                                // Print the rest as normal content
                                const remaining = content.slice(splitPoint);
                                if (remaining) {
                                    printer.add(remaining);
                                }
                            } else {
                                // Still thinking, just print gray if enabled
                                if (config.showThinking !== false) {
                                    process.stdout.write(content);
                                }
                            }
                        } else {
                            printer.add(content);
                        }
                        
                        // Always save full content to history (including thinking process)
                        // This ensures /export works as expected and we have faithful history.
                        reply += delta.content;
                        hasReceivedContent = true;
                    }
                    
                    if (delta?.tool_calls) {
                        hasReceivedContent = true;
                        for (const tc of delta.tool_calls) {
                            if (!currentToolCalls[tc.index]) {
                                currentToolCalls[tc.index] = { 
                                    id: tc.id, 
                                    type: "function", 
                                    function: { name: "", arguments: "" } 
                                };
                            }
                            if (tc.function?.name) currentToolCalls[tc.index].function.name += tc.function.name;
                            if (tc.function?.arguments) currentToolCalls[tc.index].function.arguments += tc.function.arguments;
                        }
                    }
                } catch {}
            }
        }
        
        // 检查是否收到了有效内容
        if (!hasReceivedContent && reply.length === 0) {
            console.log(`\n🔍 调试信息: Status=${res.status}, Headers=${JSON.stringify([...res.headers.entries()])}`);

            // 检查 buffer 中是否残留了错误信息（针对非 SSE 格式的错误返回）
            if (buffer.trim()) {
                try {
                    const json = JSON.parse(buffer);
                    if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
                } catch {}
                throw new Error(`API 响应无法解析 (Raw: ${buffer.slice(0, 100)}...)`);
            }

            // 如果连 buffer 都是空的，但 status 是 200
            // 尝试最后的回退：切换到 /v1/chat/completions（如果当前是 /v1/messages）
            if (requestUrl.includes('/messages') && !fallbackToChatCompletions) {
                console.log("\n⚠️  /v1/messages 端点返回空内容，尝试切换到 /v1/chat/completions 端点...");
                const fallbackUrl = requestUrl.replace('/messages', '/chat/completions');

                try {
                    const body = createBody(false);
                    res = await requestWithRetry(fallbackUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${config.apiKey}`
                        },
                        body: JSON.stringify(body),
                        signal: signal
                    }, 2);

                    // 重新读取流
                    const fallbackReader = res.body;
                    const fallbackDecoder = new TextDecoder("utf-8");
                    let fallbackBuffer = "";
                    let fallbackReply = "";
                    let fallbackHasContent = false;

                    for await (const chunk of fallbackReader) {
                        fallbackBuffer += fallbackDecoder.decode(chunk, { stream: true });
                        const lines = fallbackBuffer.split("\n");
                        fallbackBuffer = lines.pop() || "";

                        for (const line of lines) {
                            if (line.startsWith("data: ") && line !== "data: [DONE]") {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.choices?.[0]?.delta?.content) {
                                        fallbackReply += data.choices[0].delta.content;
                                        fallbackHasContent = true;
                                    }
                                } catch {}
                            }
                        }
                    }

                    if (fallbackHasContent) {
                        printer.print(fallbackReply);
                        printer.stop();
                        return { content: fallbackReply };
                    }
                } catch (fallbackError) {
                    logger.debug("回退端点失败", { error: fallbackError.message });
                }
            }

            throw new Error("API 返回了空内容 (Content-Length: 0)。请检查 Base URL 是否正确，或尝试更换 Model。");
        }

        await printer.waitIdle();
        console.log("");

        // Add assistant message
        const assistantMsg = { role: "assistant", content: reply };
        const toolCalls = Object.values(currentToolCalls);
        if (toolCalls.length > 0) {
            assistantMsg.tool_calls = toolCalls;
        }
        messages.push(assistantMsg);

        // Usage stats
        if (usageInfo) {
             const { prompt_tokens, completion_tokens, total_tokens } = usageInfo;
             const cost = calculateCost(config.model, prompt_tokens, completion_tokens);
             console.log(`\x1b[90m(Tokens: ${prompt_tokens} + ${completion_tokens} = ${total_tokens} | Cost: ~$${cost.total})\x1b[0m`);
        }

        // Handle Tool Calls
        if (toolCalls.length > 0) {
            // 提取已知工具名
            const knownToolNames = builtInTools.map(t => t.function.name);
            
            for (const tc of toolCalls) {
                let funcName = tc.function.name;
                
                // 自动修正工具名粘连 (例如: read_fileread_file -> read_file)
                if (!knownToolNames.includes(funcName)) {
                     // 按长度降序排序，优先匹配更长的工具名
                     const matched = knownToolNames
                        .sort((a, b) => b.length - a.length)
                        .find(name => funcName.includes(name));
                     
                     if (matched) {
                         console.log(`⚠️  检测到工具名异常 "${funcName}"，自动修正为 "${matched}"`);
                         funcName = matched;
                         tc.function.name = matched; // 修正原始对象，这对后续消息历史至关重要
                     }
                }

                const argsStr = tc.function.arguments;
                
                let result = null;
                try {
                    let args;
                    try {
                        args = JSON.parse(argsStr);
                        // Pretty print the tool call
                        console.log(`🛠️  调用工具: ${funcName}`);
                        console.dir(args, { depth: null, colors: true, maxStringLength: 500 });
                    } catch (e) {
                        console.log(`🛠️  调用工具: ${funcName}(${argsStr})`); // Fallback to raw
                        
                        // 尝试修复常见的 JSON 粘连问题 (例如: {"a":1}{"b":2})
                        if (argsStr.includes("}{")) {
                            console.log("⚠️ 检测到 JSON 粘连，尝试修复...");
                            // 简单策略：只取第一个 JSON
                            const fixStr = argsStr.split("}{")[0] + "}";
                            args = JSON.parse(fixStr);
                        } else {
                            throw e;
                        }
                    }

                    // 1. Try built-in
                    result = await toolHandlers(funcName, args);
                    
                    // 2. Try MCP
                    if (!result && mcpClients) {
                         for (const client of mcpClients.values()) {
                             // Optimization: Check if client has the tool before calling
                             if (!client.tools.some(t => t.name === funcName)) continue;
                             
                             try {
                                 const mcpRes = await client.callTool(funcName, args);
                                 if (mcpRes) {
                                     result = JSON.stringify(mcpRes);
                                     break;
                                 }
                             } catch (e) {
                                 console.error(`MCP Call Error (${funcName}):`, e.message);
                             }
                         }
                    }
                } catch (e) {
                    result = `Error: ${e.message}`;
                }

                if (result === null) {
                    result = "Error: Tool not found or failed.";
                }

                messages.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: result
                });
            }
            
            // Recursive call
            return await chatStream(context, null, { isRecursion: true, recursionDepth: recursionDepth + 1 });
        }

    } catch (e) {
        spinner.stop();
        printer.stop();
        if (e.name === 'AbortError' || e.message === "Aborted during retry wait") {
            console.log("\n🛑 已中断生成");
        } else {
            process.stdout.write("\n");
            console.error("❌ 请求失败:", e.message || e);
        }
    }
}

// 导出辅助函数用于测试
export { isAnthropicModel, buildApiEndpoint };

