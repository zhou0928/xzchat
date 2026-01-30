import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const ANALYZES_FILE = path.join(DATA_DIR, 'analyzes.json');

/**
 * 项目分析管理器
 * 分析代码和项目结构
 */
export class AnalyzeManager {
  constructor() {
    this.analyzes = [];
    this.loadAnalyzes();
  }

  async loadAnalyzes() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(ANALYZES_FILE, 'utf-8');
      this.analyzes = JSON.parse(data);
    } catch (error) {
      this.analyzes = [];
      await this.saveAnalyzes();
    }
  }

  async saveAnalyzes() {
    await fs.writeFile(ANALYZES_FILE, JSON.stringify(this.analyzes, null, 2), 'utf-8');
  }

  createAnalyze(name, type, results) {
    this.analyzes.push({
      id: Date.now().toString(),
      name,
      type,
      results,
      timestamp: new Date().toISOString()
    });
    this.saveAnalyzes();
    return { success: true };
  }

  listAnalyzes() { return this.analyzes; }

  getAnalyze(id) { return this.analyzes.find(a => a.id === id) || null; }

  deleteAnalyze(id) {
    this.analyzes = this.analyzes.filter(a => a.id !== id);
    this.saveAnalyzes();
    return { success: true };
  }
}
