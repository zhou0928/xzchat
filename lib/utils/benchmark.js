import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const BENCHMARKS_FILE = path.join(DATA_DIR, 'benchmarks.json');

/**
 * 基准测试管理器
 * 管理基准测试结果
 */
export class BenchmarkManager {
  constructor() {
    this.benchmarks = [];
    this.loadBenchmarks();
  }

  async loadBenchmarks() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(BENCHMARKS_FILE, 'utf-8');
      this.benchmarks = JSON.parse(data);
    } catch (error) {
      this.benchmarks = [];
      await this.saveBenchmarks();
    }
  }

  async saveBenchmarks() {
    await fs.writeFile(BENCHMARKS_FILE, JSON.stringify(this.benchmarks, null, 2), 'utf-8');
  }

  createBenchmark(name, results) {
    this.benchmarks.push({
      id: Date.now().toString(),
      name,
      results,
      timestamp: new Date().toISOString()
    });
    this.saveBenchmarks();
    return { success: true };
  }

  listBenchmarks() { return this.benchmarks; }

  compareBenchmark(id1, id2) {
    const b1 = this.benchmarks.find(b => b.id === id1);
    const b2 = this.benchmarks.find(b => b.id === id2);
    if (!b1 || !b2) return null;

    return {
      name1: b1.name,
      name2: b2.name,
      comparison: b1.results.map((r1, i) => ({
        name: r1.name,
        value1: r1.value,
        value2: b2.results[i]?.value,
        diff: b2.results[i] ? r1.value - b2.results[i].value : 0
      }))
    };
  }
}
