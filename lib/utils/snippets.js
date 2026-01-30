import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 代码片段管理器
 */
class SnippetManager {
  constructor() {
    this.snippetsPath = path.join(os.homedir(), '.xzchat-snippets.json');
    this.snippets = {};
    this.defaultSnippets = {
      'react-hook': {
        name: 'React Hook 模板',
        code: `import { useState, useEffect } from 'react';

function use{{HookName}}() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Your effect here
  }, []);

  return { state, loading, error };
}

export default use{{HookName}};`,
        language: 'javascript',
        tags: ['react', 'hook', 'template'],
        category: 'React'
      },
      'express-route': {
        name: 'Express 路由模板',
        code: `const express = require('express');
const router = express.Router();

// GET /{{resource}}
router.get('/', async (req, res) => {
  try {
    const results = await // your query here;
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /{{resource}}/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await // your query here;
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: 'Not found' });
  }
});

// POST /{{resource}}
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const result = await // your insert here;
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /{{resource}}/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const result = await // your update here;
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /{{resource}}/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await // your delete here;
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;`,
        language: 'javascript',
        tags: ['express', 'rest', 'api'],
        category: 'Backend'
      },
      'python-async': {
        name: 'Python 异步函数模板',
        code: `import asyncio

async def {{function_name}}():
    """
    {{description}}
    """
    try:
        # Your async code here
        result = await some_async_operation()
        return result
    except Exception as e:
        print(f"Error: {e}")
        raise

# Usage
async def main():
    result = await {{function_name}}()
    print(result)

if __name__ == "__main__":
    asyncio.run(main())`,
        language: 'python',
        tags: ['python', 'async', 'template'],
        category: 'Python'
      },
      'sql-select': {
        name: 'SQL 查询模板',
        code: `-- {{description}}
SELECT 
    column1,
    column2,
    COUNT(*) as count
FROM {{table}}
WHERE condition = 'value'
GROUP BY column1, column2
HAVING count > 1
ORDER BY count DESC
LIMIT 10;`,
        language: 'sql',
        tags: ['sql', 'query', 'select'],
        category: 'Database'
      },
      'dockerfile': {
        name: 'Dockerfile 模板',
        code: `# {{description}}
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE {{port}}

# Start application
CMD ["npm", "start"]`,
        language: 'dockerfile',
        tags: ['docker', 'container', 'devops'],
        category: 'DevOps'
      },
      'gitignore': {
        name: '通用 .gitignore 模板',
        code: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.log

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
.cache/`,
        language: 'gitignore',
        tags: ['git', 'version-control'],
        category: 'Config'
      }
    };
  }

  /**
   * 加载代码片段
   */
  async load() {
    try {
      const data = await fs.readFile(this.snippetsPath, 'utf-8');
      this.snippets = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，初始化为默认片段
        this.snippets = { ...this.defaultSnippets };
        await this.save();
      } else {
        throw error;
      }
    }
  }

  /**
   * 保存代码片段
   */
  async save() {
    await fs.writeFile(
      this.snippetsPath,
      JSON.stringify(this.snippets, null, 2),
      'utf-8'
    );
  }

  /**
   * 添加代码片段
   */
  async add(key, name, code, language = 'javascript', tags = [], category = 'Custom') {
    await this.load();
    const newSnippet = {
      id: key,
      name,
      code,
      language,
      tags: Array.isArray(tags) ? tags : [tags],
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.snippets[key] = newSnippet;
    await this.save();
    return newSnippet;
  }

  /**
   * 删除代码片段
   */
  async remove(key) {
    await this.load();
    if (this.snippets[key]) {
      delete this.snippets[key];
      await this.save();
      return true;
    }
    return false;
  }

  /**
   * 获取代码片段
   */
  async get(key) {
    await this.load();
    return this.snippets[key];
  }

  /**
   * 搜索代码片段
   */
  async search(query, options = {}) {
    await this.load();
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [key, snippet] of Object.entries(this.snippets)) {
      let matches = false;

      // 搜索名称
      if (snippet.name.toLowerCase().includes(queryLower)) {
        matches = true;
      }

      // 搜索代码内容
      if (snippet.code.toLowerCase().includes(queryLower)) {
        matches = true;
      }

      // 搜索标签
      if (snippet.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        matches = true;
      }

      // 搜索分类
      if (snippet.category.toLowerCase().includes(queryLower)) {
        matches = true;
      }

      // 按语言过滤
      if (options.language && snippet.language !== options.language) {
        matches = false;
      }

      // 按分类过滤
      if (options.category && snippet.category !== options.category) {
        matches = false;
      }

      if (matches) {
        results.push({ key, ...snippet });
      }
    }

    return results;
  }

  /**
   * 列出所有代码片段
   */
  async list(options = {}) {
    await this.load();
    let results = Object.entries(this.snippets).map(([key, snippet]) => ({
      key,
      ...snippet
    }));

    // 按分类过滤
    if (options.category) {
      results = results.filter(s => s.category === options.category);
    }

    // 按语言过滤
    if (options.language) {
      results = results.filter(s => s.language === options.language);
    }

    return results;
  }

  /**
   * 按分类获取代码片段
   */
  async getByCategory(category) {
    return await this.list({ category });
  }

  /**
   * 获取所有分类
   */
  async getCategories() {
    await this.load();
    const categories = new Set();
    for (const snippet of Object.values(this.snippets)) {
      categories.add(snippet.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * 获取所有语言
   */
  async getLanguages() {
    await this.load();
    const languages = new Set();
    for (const snippet of Object.values(this.snippets)) {
      languages.add(snippet.language);
    }
    return Array.from(languages).sort();
  }

  /**
   * 更新代码片段
   */
  async update(key, updates) {
    await this.load();
    if (this.snippets[key]) {
      this.snippets[key] = {
        ...this.snippets[key],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await this.save();
      return this.snippets[key];
    }
    return null;
  }

  /**
   * 清空所有代码片段（保留默认）
   */
  async clear() {
    this.snippets = { ...this.defaultSnippets };
    await this.save();
  }

  /**
   * 导出代码片段
   */
  async export(filePath) {
    await this.load();
    await fs.writeFile(
      filePath,
      JSON.stringify(this.snippets, null, 2),
      'utf-8'
    );
  }

  /**
   * 导入代码片段
   */
  async import(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    const importedSnippets = JSON.parse(data);
    this.snippets = {
      ...this.defaultSnippets,
      ...importedSnippets
    };
    await this.save();
  }

  /**
   * 格式化代码片段列表
   */
  formatList(snippets) {
    if (snippets.length === 0) {
      return '暂无代码片段';
    }

    let output = '';
    const grouped = snippets.reduce((acc, snippet) => {
      if (!acc[snippet.category]) {
        acc[snippet.category] = [];
      }
      acc[snippet.category].push(snippet);
      return acc;
    }, {});

    for (const [category, items] of Object.entries(grouped)) {
      output += `\n📁 ${category}\n`;
      items.forEach(snippet => {
        output += `  • ${snippet.name} (${snippet.key})`;
        if (snippet.tags.length > 0) {
          output += ` [${snippet.tags.join(', ')}]`;
        }
        output += '\n';
      });
    }

    return output.trim();
  }

  /**
   * 格式化代码片段详情
   */
  formatDetail(snippet) {
    return `
📝 ${snippet.name}
🔑 Key: ${snippet.key}
🌐 Language: ${snippet.language}
📂 Category: ${snippet.category}
🏷️ Tags: ${snippet.tags.join(', ') || 'None'}
⏰ Updated: ${snippet.updatedAt}

Code:
${'─'.repeat(60)}
${snippet.code}
${'─'.repeat(60)}
`.trim();
  }
}

// 创建单例实例
const snippetManager = new SnippetManager();

export default snippetManager;
export { SnippetManager };
