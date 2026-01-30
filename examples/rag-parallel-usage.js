#!/usr/bin/env node

/**
 * RAG 并行优化使用示例
 * 
 * 展示如何使用优化后的 RAG 模块进行高效的代码库索引和搜索
 */

import { indexCodebase, searchCodebase, clearRAGCache, getRAGStats } from '../lib/rag.js';
import { getActiveConfig } from '../lib/config.js';
import { printAllCacheStats } from '../lib/utils/cache.js';

/**
 * 示例 1：基本索引（默认并发度）
 */
async function basicIndexing() {
    console.log('\n📚 示例 1：基本索引');
    console.log('===================');
    
    const config = getActiveConfig();
    const targetDir = process.cwd();
    
    try {
        const chunkCount = await indexCodebase(targetDir, config);
        console.log(`✅ 索引完成，共 ${chunkCount} 个块`);
    } catch (error) {
        console.error('❌ 索引失败:', error.message);
    }
}

/**
 * 示例 2：高并发索引（适用于大型代码库）
 */
async function highConcurrencyIndexing() {
    console.log('\n🚀 示例 2：高并发索引');
    console.log('=====================');
    
    const config = getActiveConfig();
    const targetDir = process.cwd();
    
    try {
        const chunkCount = await indexCodebase(targetDir, config, {
            concurrency: 5,        // 5 个并发文件处理
            showProgress: true      // 显示进度
        });
        console.log(`✅ 高并发索引完成，共 ${chunkCount} 个块`);
    } catch (error) {
        console.error('❌ 索引失败:', error.message);
    }
}

/**
 * 示例 3：静默索引（无进度显示）
 */
async function silentIndexing() {
    console.log('\n🤫 示例 3：静默索引');
    console.log('==================');
    
    const config = getActiveConfig();
    const targetDir = process.cwd();
    
    try {
        const chunkCount = await indexCodebase(targetDir, config, {
            concurrency: 3,
            showProgress: false
        });
        console.log(`✅ 静默索引完成，共 ${chunkCount} 个块`);
    } catch (error) {
        console.error('❌ 索引失败:', error.message);
    }
}

/**
 * 示例 4：基本搜索
 */
async function basicSearch() {
    console.log('\n🔍 示例 4：基本搜索');
    console.log('==================');
    
    const config = getActiveConfig();
    const targetDir = process.cwd();
    const query = '如何配置 API Key';
    
    try {
        const results = await searchCodebase(query, targetDir, config);
        console.log(`\n找到 ${results.length} 个相关结果：\n`);
        
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.file}`);
            console.log(`   相似度: ${result.score.toFixed(4)}`);
            console.log(`   内容: ${result.content.substring(0, 100)}...\n`);
        });
    } catch (error) {
        console.error('❌ 搜索失败:', error.message);
    }
}

/**
 * 示例 5：自定义搜索参数
 */
async function customSearch() {
    console.log('\n⚙️  示例 5：自定义搜索');
    console.log('====================');
    
    const config = getActiveConfig();
    const targetDir = process.cwd();
    const query = '异步函数';
    
    try {
        const results = await searchCodebase(query, targetDir, config, {
            topK: 10,       // 返回前 10 个结果
            useCache: true  // 使用缓存
        });
        console.log(`\n找到 ${results.length} 个相关结果\n`);
    } catch (error) {
        console.error('❌ 搜索失败:', error.message);
    }
}

/**
 * 示例 6：不使用缓存的搜索
 */
async function noCacheSearch() {
    console.log('\n🔄 示例 6：不使用缓存的搜索');
    console.log('========================');
    
    const config = getActiveConfig();
    const targetDir = process.cwd();
    const query = 'API 调用';
    
    try {
        const results = await searchCodebase(query, targetDir, config, {
            topK: 5,
            useCache: false  // 不使用缓存，强制重新计算
        });
        console.log(`\n找到 ${results.length} 个相关结果（无缓存）\n`);
    } catch (error) {
        console.error('❌ 搜索失败:', error.message);
    }
}

/**
 * 示例 7：查看 RAG 缓存统计
 */
async function viewRAGStats() {
    console.log('\n📊 示例 7：查看 RAG 缓存统计');
    console.log('==========================');
    
    try {
        const stats = getRAGStats();
        console.log('\n嵌入缓存:');
        console.log(`  大小: ${stats.embedding.size}`);
        console.log(`  命中率: ${stats.embedding.hitRate}`);
        
        console.log('\n索引缓存:');
        console.log(`  大小: ${stats.index.size}`);
        console.log(`  命中率: ${stats.index.hitRate}`);
    } catch (error) {
        console.error('❌ 获取统计失败:', error.message);
    }
}

/**
 * 示例 8：清空 RAG 缓存
 */
async function clearRAGCacheDemo() {
    console.log('\n🧹 示例 8：清空 RAG 缓存');
    console.log('=======================');
    
    try {
        console.log('清空前:');
        await viewRAGStats();
        
        clearRAGCache();
        console.log('\n✅ RAG 缓存已清空');
        
        console.log('\n清空后:');
        await viewRAGStats();
    } catch (error) {
        console.error('❌ 清空缓存失败:', error.message);
    }
}

/**
 * 示例 9：查看所有缓存统计
 */
async function viewAllCacheStats() {
    console.log('\n📦 示例 9：查看所有缓存统计');
    console.log('========================');
    
    printAllCacheStats();
}

/**
 * 主函数
 */
async function main() {
    console.log('=================================================');
    console.log('  RAG 并行优化示例');
    console.log('=================================================');
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('\n使用方法:');
        console.log('  node examples/rag-parallel-usage.js <示例编号>');
        console.log('\n可用示例:');
        console.log('  1 - 基本索引');
        console.log('  2 - 高并发索引');
        console.log('  3 - 静默索引');
        console.log('  4 - 基本搜索');
        console.log('  5 - 自定义搜索参数');
        console.log('  6 - 不使用缓存的搜索');
        console.log('  7 - 查看 RAG 缓存统计');
        console.log('  8 - 清空 RAG 缓存');
        console.log('  9 - 查看所有缓存统计');
        console.log('\n示例:');
        console.log('  node examples/rag-parallel-usage.js 1');
        return;
    }
    
    const example = args[0];
    
    switch (example) {
        case '1':
            await basicIndexing();
            break;
        case '2':
            await highConcurrencyIndexing();
            break;
        case '3':
            await silentIndexing();
            break;
        case '4':
            await basicSearch();
            break;
        case '5':
            await customSearch();
            break;
        case '6':
            await noCacheSearch();
            break;
        case '7':
            await viewRAGStats();
            break;
        case '8':
            await clearRAGCacheDemo();
            break;
        case '9':
            await viewAllCacheStats();
            break;
        default:
            console.log(`❌ 未知的示例编号: ${example}`);
    }
}

main().catch(console.error);
