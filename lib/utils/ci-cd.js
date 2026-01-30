import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const CICD_FILE = path.join(DATA_DIR, 'ci-cd-pipelines.json');

/**
 * CI/CD管理器
 * 管理CI/CD流程和配置
 */
export class CiCdManager {
  constructor() {
    this.pipelines = [];
    this.loadPipelines();
  }

  async loadPipelines() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(CICD_FILE, 'utf-8');
      this.pipelines = JSON.parse(data);
    } catch (error) {
      this.pipelines = [];
      await this.savePipelines();
    }
  }

  async savePipelines() {
    await fs.writeFile(CICD_FILE, JSON.stringify(this.pipelines, null, 2), 'utf-8');
  }

  createPipeline(name, stages) {
    this.pipelines.push({
      id: Date.now().toString(),
      name,
      stages,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    this.savePipelines();
    return { success: true };
  }

  listPipelines() { return this.pipelines; }

  updatePipeline(id, updates) {
    const pipeline = this.pipelines.find(p => p.id === id);
    if (pipeline) {
      Object.assign(pipeline, updates);
      this.savePipelines();
    }
    return { success: !!pipeline };
  }

  deletePipeline(id) {
    this.pipelines = this.pipelines.filter(p => p.id !== id);
    this.savePipelines();
    return { success: true };
  }
}
