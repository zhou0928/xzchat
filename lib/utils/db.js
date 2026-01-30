import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'db-history.json');

/**
 * 数据库助手类
 */
export class DatabaseHelper {
  constructor() {
    this.history = [];
    this.loadHistory();
  }

  async loadHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(data);
    } catch (error) {
      this.history = [];
    }
  }

  async saveHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存历史失败:', error.message);
    }
  }

  analyzeQuery(sql) {
    const suggestions = [];
    const upperSql = sql.toUpperCase();
    let complexity = 'low';

    if (upperSql.includes('SELECT')) {
      suggestions.push('检查是否需要使用索引');
      suggestions.push('考虑添加LIMIT限制结果集');
      complexity = 'medium';
    }

    if (upperSql.includes('JOIN')) {
      suggestions.push('确认JOIN条件有索引');
      suggestions.push('考虑使用EXPLAIN分析执行计划');
      complexity = 'high';
    }

    if (upperSql.includes('GROUP BY')) {
      suggestions.push('检查聚合函数使用');
      suggestions.push('考虑添加HAVING子句');
    }

    const type = upperSql.includes('SELECT') ? 'SELECT' :
                 upperSql.includes('INSERT') ? 'INSERT' :
                 upperSql.includes('UPDATE') ? 'UPDATE' :
                 upperSql.includes('DELETE') ? 'DELETE' : 'UNKNOWN';

    this.logHistory(type, sql);

    return { type, complexity, suggestions };
  }

  generateModel(name, fields = '') {
    const fieldArray = fields.split(',').map(f => f.trim());
    const schema = fieldArray.map(f => {
      const [fieldName, fieldType] = f.split(':');
      return `  ${fieldName}: ${fieldType || 'string'}`;
    }).join('\n');

    const code = `class ${name} {\n${schema || '  id: number;\n  createdAt: Date;\n  updatedAt: Date;'}\n\n  constructor(data: any) {\n    Object.assign(this, data);\n  }\n}`;

    return { schema, code };
  }

  generateMigration(action, table) {
    const timestamp = Date.now();

    if (action === 'create') {
      return `// ${timestamp}_create_${table}.ts\n\nexport async function up(db: any) {\n  await db.schema.createTable('${table}', (table: any) => {\n    table.increments('id').primary();\n    table.timestamps(true, true);\n  });\n}\n\nexport async function down(db: any) {\n  await db.schema.dropTable('${table}');\n}`;
    }

    return `// ${timestamp}_${action}_${table}.ts\nexport async function up(db: any) {\n  // TODO\n}\n\nexport async function down(db: any) {\n  // TODO\n}`;
  }

  async analyzeSchema(file) {
    try {
      const content = await fs.readFile(file, 'utf-8');

      let tables = (content.match(/CREATE TABLE/g) || []).length;
      let relations = (content.match(/FOREIGN KEY/g) || []).length;
      let indexes = (content.match(/INDEX/g) || []).length;

      return { tables, relations, indexes };
    } catch (error) {
      return { tables: 0, relations: 0, indexes: 0 };
    }
  }

  validateQuery(sql) {
    const errors = [];

    if (!sql.trim()) {
      errors.push('SQL语句为空');
    }

    const balanced = this.checkBrackets(sql);
    if (!balanced) {
      errors.push('括号不匹配');
    }

    const upperSql = sql.toUpperCase();
    if (upperSql.includes('SELECT') && !upperSql.includes('FROM')) {
      errors.push('SELECT缺少FROM');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  checkBrackets(sql) {
    let count = 0;
    for (const char of sql) {
      if (char === '(') count++;
      if (char === ')') count--;
      if (count < 0) return false;
    }
    return count === 0;
  }

  logHistory(type, sql) {
    this.history.unshift({
      timestamp: new Date().toISOString(),
      type,
      sql
    });

    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveHistory();
  }

  getHistory(limit) {
    return this.history.slice(0, limit);
  }
}
