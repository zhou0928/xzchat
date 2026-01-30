import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { glob } from "glob";

/**
 * RAG 增量索引管理器
 * 支持文件变更检测和增量更新
 */
export class RAGIncrementalIndexer {
  constructor(indexPath = '.rag-index') {
    this.indexPath = path.resolve(indexPath);
    this.indexFile = path.join(this.indexPath, 'file-hashes.json');
    this.lastBuildTime = path.join(this.indexPath, 'last-build.txt');
    
    // 确保索引目录存在
    if (!fs.existsSync(this.indexPath)) {
      fs.mkdirSync(this.indexPath, { recursive: true });
    }
    
    this.fileHashes = this.loadFileHashes();
  }

  /**
   * 计算文件哈希值
   */
  computeFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (e) {
      console.log(`⚠️  无法计算哈希: ${filePath} - ${e.message}`);
      return null;
    }
  }

  /**
   * 加载文件哈希记录
   */
  loadFileHashes() {
    try {
      if (fs.existsSync(this.indexFile)) {
        const data = fs.readFileSync(this.indexFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.log(`⚠️  加载哈希记录失败: ${e.message}`);
    }
    return {};
  }

  /**
   * 保存文件哈希记录
   */
  saveFileHashes() {
    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(this.fileHashes, null, 2), 'utf-8');
    } catch (e) {
      console.log(`❌ 保存哈希记录失败: ${e.message}`);
    }
  }

  /**
   * 记录最后构建时间
   */
  saveLastBuildTime() {
    try {
      const now = new Date().toISOString();
      fs.writeFileSync(this.lastBuildTime, now, 'utf-8');
    } catch (e) {
      console.log(`❌ 保存构建时间失败: ${e.message}`);
    }
  }

  /**
   * 获取最后构建时间
   */
  getLastBuildTime() {
    try {
      if (fs.existsSync(this.lastBuildTime)) {
        return fs.readFileSync(this.lastBuildTime, 'utf-8');
      }
    } catch (e) {
      console.log(`⚠️  读取构建时间失败: ${e.message}`);
    }
    return null;
  }

  /**
   * 扫描文件，检测变更
   */
  async scanFiles(filePatterns, options = {}) {
    const { ignore = [] } = options;
    const defaultIgnore = ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/.rag-index/**'];
    const allIgnore = [...defaultIgnore, ...ignore];

    const files = [];
    for (const pattern of Array.isArray(filePatterns) ? filePatterns : [filePatterns]) {
      const matched = await glob(pattern, {
        cwd: process.cwd(),
        ignore: allIgnore,
        absolute: true
      });
      files.push(...matched);
    }

    // 去重
    const uniqueFiles = [...new Set(files)];

    const changes = {
      added: [],      // 新增文件
      modified: [],   // 修改文件
      deleted: [],    // 删除文件
      unchanged: []   // 未变更文件
    };

    const currentFiles = new Set();

    for (const file of uniqueFiles) {
      currentFiles.add(file);
      
      const stat = fs.statSync(file);
      if (!stat.isFile()) continue;

      const hash = this.computeFileHash(file);
      if (!hash) continue;

      const record = this.fileHashes[file];
      
      if (!record) {
        // 新增文件
        changes.added.push({ file, hash, size: stat.size });
      } else if (record.hash !== hash) {
        // 文件已修改
        changes.modified.push({ file, hash, oldHash: record.hash, size: stat.size });
      } else {
        // 文件未变更
        changes.unchanged.push({ file, hash });
      }

      // 更新哈希记录
      this.fileHashes[file] = {
        hash,
        mtime: stat.mtimeMs,
        size: stat.size
      };
    }

    // 检测删除的文件
    for (const file in this.fileHashes) {
      if (!currentFiles.has(file)) {
        changes.deleted.push({ file });
        delete this.fileHashes[file];
      }
    }

    return changes;
  }

  /**
   * 增量更新索引
   */
  async incrementalUpdate(filePatterns, options = {}) {
    const { verbose = false } = options;
    
    if (verbose) {
      console.log(`\n🔍 扫描文件变更...`);
      console.log(`📅 最后构建时间: ${this.getLastBuildTime() || '从未构建'}`);
    }

    const changes = await this.scanFiles(filePatterns, options);

    if (verbose) {
      console.log(`\n📊 变更统计:`);
      console.log(`  ➕ 新增: ${changes.added.length} 个文件`);
      console.log(`  ✏️  修改: ${changes.modified.length} 个文件`);
      console.log(`  🗑️  删除: ${changes.deleted.length} 个文件`);
      console.log(`  ✓ 未变: ${changes.unchanged.length} 个文件`);
    }

    const totalChanges = changes.added.length + changes.modified.length + changes.deleted.length;

    if (totalChanges === 0) {
      if (verbose) {
        console.log(`\n✅ 无需更新，所有文件都是最新的`);
      }
      return { changes, updated: false };
    }

    // 保存哈希记录
    this.saveFileHashes();
    this.saveLastBuildTime();

    if (verbose) {
      console.log(`\n✅ 索引记录已更新`);
      console.log(`💡 建议执行增量索引重建`);
    }

    return { changes, updated: true };
  }

  /**
   * 获取需要重新索引的文件列表
   */
  async getFilesToReindex(filePatterns, options = {}) {
    const changes = await this.scanFiles(filePatterns, options);
    
    return {
      files: [
        ...changes.added.map(f => f.file),
        ...changes.modified.map(f => f.file)
      ],
      deleted: changes.deleted.map(f => f.file)
    };
  }

  /**
   * 清理索引
   */
  cleanIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        fs.unlinkSync(this.indexFile);
        console.log(`✅ 索引已清理`);
      }
      this.fileHashes = {};
    } catch (e) {
      console.log(`❌ 清理索引失败: ${e.message}`);
    }
  }

  /**
   * 获取索引统计信息
   */
  getStats() {
    const files = Object.keys(this.fileHashes);
    const totalSize = Object.values(this.fileHashes).reduce((sum, f) => sum + (f.size || 0), 0);
    
    return {
      totalFiles: files.length,
      totalSize: totalSize,
      lastBuildTime: this.getLastBuildTime(),
      indexFile: this.indexFile
    };
  }
}

/**
 * 创建增量索引器实例
 */
export function createIncrementalIndexer(indexPath) {
  return new RAGIncrementalIndexer(indexPath);
}

/**
 * 命令处理：增量索引检查
 */
export async function handleRAGIncrementalCheck(input) {
  const parts = input.slice(7).trim().split(/\s+/);
  const filePatterns = parts[0] ? parts : ['**/*.{js,ts,jsx,tsx,md}'];
  
  console.log(`\n🔍 检查文件变更...\n`);

  const indexer = new RAGIncrementalIndexer();
  const changes = await indexer.scanFiles(filePatterns);

  console.log(`📊 变更统计:`);
  console.log(`  ➕ 新增: ${changes.added.length} 个文件`);
  console.log(`  ✏️  修改: ${changes.modified.length} 个文件`);
  console.log(`  🗑️  删除: ${changes.deleted.length} 个文件`);
  console.log(`  ✓ 未变: ${changes.unchanged.length} 个文件`);

  if (changes.added.length > 0) {
    console.log(`\n➕ 新增文件:`);
    changes.added.forEach(f => console.log(`  - ${f.file}`));
  }

  if (changes.modified.length > 0) {
    console.log(`\n✏️  修改文件:`);
    changes.modified.forEach(f => console.log(`  - ${f.file}`));
  }

  if (changes.deleted.length > 0) {
    console.log(`\n🗑️  删除文件:`);
    changes.deleted.forEach(f => console.log(`  - ${f.file}`));
  }

  const totalChanges = changes.added.length + changes.modified.length + changes.deleted.length;
  
  if (totalChanges > 0) {
    console.log(`\n💡 检测到 ${totalChanges} 个变更，建议执行 /rag-rebuild`);
  } else {
    console.log(`\n✅ 无变更，无需更新`);
  }

  return true;
}

/**
 * 命令处理：增量索引更新
 */
export async function handleRAGIncrementalUpdate(input, rebuildFunction) {
  const parts = input.slice(7).trim().split(/\s+/);
  const filePatterns = parts[0] ? parts : ['**/*.{js,ts,jsx,tsx,md}'];
  
  console.log(`\n🔄 增量更新索引...\n`);

  const indexer = new RAGIncrementalIndexer();
  const { changes, updated } = await indexer.incrementalUpdate(filePatterns, { verbose: true });

  if (!updated) {
    return true;
  }

  // 如果有重建函数，调用它
  if (rebuildFunction && typeof rebuildFunction === 'function') {
    const filesToReindex = [
      ...changes.added.map(f => f.file),
      ...changes.modified.map(f => f.file)
    ];

    if (filesToReindex.length > 0) {
      console.log(`\n🔨 重建 ${filesToReindex.length} 个文件的索引...\n`);
      
      try {
        await rebuildFunction(filesToReindex);
        console.log(`\n✅ 增量更新完成`);
      } catch (e) {
        console.log(`\n❌ 重建失败: ${e.message}`);
      }
    }
  }

  return true;
}

/**
 * 命令处理：清理索引
 */
export async function handleRAGIndexClean() {
  console.log(`\n🗑️  清理 RAG 索引...`);

  const indexer = new RAGIncrementalIndexer();
  indexer.cleanIndex();

  return true;
}

/**
 * 命令处理：索引统计
 */
export async function handleRAGIndexStats() {
  console.log(`\n📊 RAG 索引统计:\n`);

  const indexer = new RAGIncrementalIndexer();
  const stats = indexer.getStats();

  console.log(`📁 总文件数: ${stats.totalFiles}`);
  console.log(`💾 总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🕐 最后构建: ${stats.lastBuildTime || '从未构建'}`);
  console.log(`📄 索引文件: ${stats.indexFile}`);

  return true;
}
