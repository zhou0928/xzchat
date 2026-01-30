
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import { chunkText, calculateCosineSimilarity } from "./utils.js";
import { getFileList } from "./tools.js";
import { embeddingCache } from "./utils/cache.js";
import { logger } from "./utils/logger.js";

const INDEX_FILE = ".newapi-chat-index.json";

// Simple embedding fetcher with fallback
async function fetchEmbedding(text, config) {
    if (!config.apiKey) throw new Error("API Key required for embeddings");
    
    let baseUrl = config.baseUrl || "https://api.openai.com/v1";
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    
    // Adjust for /v1
    let url = baseUrl;
    // Remove /chat/completions if present
    if (url.endsWith("/chat/completions")) url = url.replace("/chat/completions", "");
    // Ensure /v1
    if (!url.endsWith("/v1")) url += "/v1";
    // Append /embeddings
    url += "/embeddings";

    // Handle duplicate v1
    if (url.includes("/v1/v1")) url = url.replace("/v1/v1", "/v1");

    const modelsToTry = config.embeddingModel 
        ? [config.embeddingModel] 
        : ["text-embedding-3-small", "text-embedding-ada-002"];

    let lastError = null;

    for (const model of modelsToTry) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    input: text,
                    model: model
                })
            });

            if (!response.ok) {
                const err = await response.text();
                // If it's a model error (404 or specific 500s), try next model
                if (response.status === 404 || response.status >= 500 || err.includes("model_not_found")) {
                    logger.warn(`Embedding model '${model}' failed, trying next...`);
                    lastError = new Error(`Embedding API Error (${response.status}): ${err}`);
                    continue; 
                }
                throw new Error(`Embedding API Error (${response.status}): ${err}`);
            }

            const data = await response.json();
            if (!data.data || !data.data[0] || !data.data[0].embedding) {
                throw new Error("Invalid embedding response format");
            }
            return data.data[0].embedding;

        } catch (e) {
            lastError = e;
            // If network error, maybe retry? For now just continue to next model if applicable
            if (modelsToTry.length > 1 && model !== modelsToTry[modelsToTry.length - 1]) {
                continue;
            }
        }
    }
    
    throw lastError;
}

/**
 * 获取文本的嵌入向量（带缓存）
 */
async function getCachedEmbedding(text, config) {
    const cacheKey = `embed:${text.substring(0, 100)}:${text.length}`;
    
    // 检查缓存
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
        logger.debug('使用缓存的嵌入向量');
        return cached;
    }
    
    // 获取新的嵌入向量
    const embedding = await fetchEmbedding(text, config);
    embeddingCache.set(cacheKey, embedding);
    
    return embedding;
}

/**
 * 批量获取嵌入向量（并行处理）
 */
async function batchFetchEmbeddings(texts, config, options = {}) {
    const {
        concurrency = 5,
        delay = 100,
        retryCount = 2,
        retryDelay = 2000
    } = options;
    
    const results = new Array(texts.length).fill(null);
    const errors = [];
    let completed = 0;
    
    // 使用并发控制器
    async function processBatch(startIndex) {
        for (let i = startIndex; i < texts.length; i += concurrency) {
            const text = texts[i];
            let lastError = null;
            
            for (let retry = 0; retry <= retryCount; retry++) {
                try {
                    const embedding = await getCachedEmbedding(text, config);
                    results[i] = embedding;
                    completed++;
                    
                    if (completed % 10 === 0) {
                        process.stdout.write(`[${completed}/${texts.length}]`);
                    }
                    
                    break;
                } catch (e) {
                    lastError = e;
                    
                    // 如果是429错误，等待更长时间
                    if (e.message.includes("429")) {
                        logger.warn(`遇到速率限制，等待 ${retryDelay}ms 后重试...`);
                        await new Promise(r => setTimeout(r, retryDelay));
                    } else if (retry < retryCount) {
                        await new Promise(r => setTimeout(r, delay));
                    }
                }
            }
            
            if (results[i] === null && lastError) {
                errors.push({ index: i, error: lastError.message });
                logger.error(`嵌入获取失败 [${i}]`, { error: lastError.message });
            }
            
            // 添加延迟避免速率限制
            await new Promise(r => setTimeout(r, delay));
        }
    }
    
    // 并发处理
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push(processBatch(i));
    }
    
    await Promise.all(workers);
    
    return { results, errors };
}

/**
 * 为单个文件创建嵌入向量
 */
async function processFile(filePath, dir, config) {
    const fullPath = path.join(dir, filePath);
    
    if (!fs.existsSync(fullPath)) return [];
    
    // 跳过大文件或二进制文件
    const stats = fs.statSync(fullPath);
    if (stats.size > 100 * 1024) return []; // Skip > 100KB
    
    const ext = path.extname(filePath).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".gif", ".lock", ".bin", ".mp3", ".wav"].includes(ext)) return [];
    
    try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const chunks = chunkText(content, 500); // 500 tokens ~ 2000 chars
        
        // 批量获取嵌入向量
        const { results: embeddings, errors } = await batchFetchEmbeddings(
            chunks.filter(c => c.trim()),
            config,
            { concurrency: 3, delay: 100 }
        );
        
        const validChunks = [];
        let embedIndex = 0;
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk.trim()) continue;
            
            const embedding = embeddings[embedIndex];
            if (embedding) {
                validChunks.push({
                    file: filePath,
                    chunkIndex: i,
                    content: chunk,
                    embedding
                });
            }
            embedIndex++;
        }
        
        if (errors.length > 0) {
            logger.warn(`文件 ${filePath} 部分块嵌入失败`, { failedChunks: errors.length });
        }
        
        return validChunks;
    } catch (e) {
        logger.error(`处理文件失败: ${filePath}`, { error: e.message });
        return [];
    }
}

export async function indexCodebase(dir, config, options = {}) {
    const {
        concurrency = 3,
        showProgress = true
    } = options;
    
    const files = getFileList(dir);
    const validFiles = files.filter(f => f !== INDEX_FILE);
    
    logger.info(`开始索引，找到 ${validFiles.length} 个文件`, { concurrency });
    
    if (showProgress) {
        process.stdout.write(`📚 找到 ${validFiles.length} 个文件。开始并行索引...\n`);
    }
    
    let allChunks = [];
    let processed = 0;
    const errors = [];
    
    // 并发处理文件
    async function processFilesBatch(startIndex) {
        for (let i = startIndex; i < validFiles.length; i += concurrency) {
            const file = validFiles[i];
            try {
                const chunks = await processFile(file, dir, config);
                allChunks.push(...chunks);
                processed++;
                
                if (showProgress && processed % 5 === 0) {
                    process.stdout.write(".");
                }
            } catch (e) {
                errors.push({ file, error: e.message });
                logger.error(`文件处理失败: ${file}`, { error: e.message });
            }
        }
    }
    
    // 启动并发工作线程
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push(processFilesBatch(i));
    }
    
    await Promise.all(workers);
    
    if (showProgress) {
        process.stdout.write(`\n💾 保存索引...\n`);
    }
    
    // 保存索引
    fs.writeFileSync(
        path.join(dir, INDEX_FILE), 
        JSON.stringify(allChunks, null, 2)
    );
    
    logger.info('索引完成', { totalChunks: allChunks.length, processedFiles: processed, errors: errors.length });
    
    if (showProgress) {
        process.stdout.write(`✅ 索引完成！从 ${processed} 个文件中创建了 ${allChunks.length} 个块。\n`);

        if (errors.length > 0) {
            process.stdout.write(`⚠️  ${errors.length} 个文件处理失败\n`);
        }
    }
    
    return allChunks.length;
}

export async function loadIndex(dir) {
    const indexPath = path.join(dir, INDEX_FILE);
    if (!fs.existsSync(indexPath)) return null;
    try {
        const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        logger.info('加载索引', { indexPath, chunks: index.length });
        return index;
    } catch (e) {
        logger.error('加载索引失败', { error: e.message });
        return null;
    }
}

export async function searchCodebase(query, dir, config, options = {}) {
    const {
        topK = 5,
        useCache = true
    } = options;
    
    const index = await loadIndex(dir);
    if (!index) {
        throw new Error("Index not found. Please run indexing first.");
    }
    
    logger.info('搜索代码库', { query, indexSize: index.length, topK });
    
    // 使用缓存的查询嵌入
    const queryEmbedding = useCache 
        ? await getCachedEmbedding(query, config)
        : await fetchEmbedding(query, config);
    
    // 并行计算相似度（对于大索引）
    const scored = await Promise.all(
        index.map(async (item) => ({
            ...item,
            score: calculateCosineSimilarity(queryEmbedding, item.embedding)
        }))
    );
    
    // 排序并返回前 topK
    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, topK);
    
    logger.info('搜索完成', { resultsCount: results.length });
    
    return results;
}

/**
 * 清除 RAG 相关缓存
 */
export async function clearRAGCache() {
    const { embeddingCache } = await import('./utils/cache.js');
    embeddingCache.clear();
    logger.info('RAG 缓存已清空');
}

/**
 * 获取 RAG 统计信息
 */
export async function getRAGStats() {
    const { embeddingCache, ragIndexCache } = await import('./utils/cache.js');
    return {
        embedding: embeddingCache.getStats(),
        index: ragIndexCache.getStats()
    };
}
