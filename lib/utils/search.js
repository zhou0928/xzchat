import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const INDEX_FILE = path.join(DATA_DIR, 'search-index.json');

/**
 * 搜索引擎类
 */
export class SearchEngine {
  constructor() {
    this.index = {};
    this.searchCount = 0;
    this.loadIndex();
  }

  async loadIndex() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(INDEX_FILE, 'utf-8');
      this.index = JSON.parse(data);
    } catch (error) {
      this.index = {};
    }
  }

  async saveIndex() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(INDEX_FILE, JSON.stringify(this.index, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存索引失败:', error.message);
    }
  }

  async search(query, searchPath = '.') {
    this.searchCount++;

    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const file in this.index) {
      if (!this.index[file].content) continue;

      const content = this.index[file].content.toLowerCase();
      const matches = (content.match(new RegExp(lowerQuery, 'g')) || []).length;

      if (matches > 0) {
        results.push({
          file,
          matches,
          relevance: Math.min(100, matches * 10)
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  async semanticSearch(query) {
    const keywords = this.extractKeywords(query);
    const results = [];

    for (const file in this.index) {
      if (!this.index[file].content) continue;

      const content = this.index[file].content.toLowerCase();
      let score = 0;

      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          score += 20;
        }
      });

      if (score > 0) {
        results.push({
          file,
          semantic: Math.min(100, score),
          summary: this.index[file].content.substring(0, 50) + '...'
        });
      }
    }

    return results.sort((a, b) => b.semantic - a.semantic);
  }

  extractKeywords(text) {
    return text.split(/\s+/)
      .filter(w => w.length > 1)
      .slice(0, 5);
  }

  async findReferences(target) {
    const refs = [];

    for (const file in this.index) {
      if (!this.index[file].content) continue;

      const lines = this.index[file].content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes(target)) {
          refs.push({
            file,
            line: index + 1,
            context: line.trim()
          });
        }
      });
    }

    return refs.slice(0, 20);
  }

  async traceDependencies(file) {
    const dependencies = [];
    const dependents = [];

    const filePath = path.resolve(file);

    for (const f in this.index) {
      if (!this.index[f].content) continue;

      if (f === filePath) {
        const imports = this.extractImports(this.index[f].content);
        dependencies.push(...imports);
      } else {
        if (this.index[f].content.includes(path.basename(file))) {
          dependents.push(f);
        }
      }
    }

    return { dependencies, dependents };
  }

  extractImports(content) {
    const imports = [];

    const patterns = [
      /import\s+.*from\s+['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });

    return [...new Set(imports)];
  }

  async buildIndex(searchPath = '.') {
    const startTime = Date.now();
    let fileCount = 0;

    try {
      const files = await this.getFiles(searchPath);

      for (const file of files) {
        if (file.match(/\.(js|ts|jsx|tsx)$/)) {
          try {
            const content = await fs.readFile(file, 'utf-8');
            this.index[file] = {
              content,
              indexedAt: new Date().toISOString()
            };
            fileCount++;
          } catch (error) {
            console.error(`无法索引 ${file}: ${error.message}`);
          }
        }
      }

      await this.saveIndex();

      return {
        files: fileCount,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return { files: 0, duration: 0 };
    }
  }

  async getFiles(dir) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...await this.getFiles(fullPath));
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`读取目录失败 ${dir}: ${error.message}`);
    }

    return files;
  }

  async rebuildIndex() {
    this.index = {};
    return await this.buildIndex('.');
  }

  getStats() {
    const indexedFiles = Object.keys(this.index).length;
    const indexSize = JSON.stringify(this.index).length / 1024;

    return {
      indexedFiles,
      totalSearches: this.searchCount,
      indexSize: indexSize.toFixed(2)
    };
  }
}
