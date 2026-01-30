import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const MIGRATIONS_FILE = path.join(DATA_DIR, 'migrations.json');

/**
 * 数据迁移管理器
 * 管理数据迁移和版本升级
 */
export class MigrationManager {
  constructor() {
    this.migrations = [];
    this.history = [];
    this.loadMigrations();
  }

  async loadMigrations() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(MIGRATIONS_FILE, 'utf-8');
      const saved = JSON.parse(data);
      this.migrations = saved.migrations || [];
      this.history = saved.history || [];
    } catch (error) {
      this.migrations = [];
      this.history = [];
      await this.saveMigrations();
    }
  }

  async saveMigrations() {
    await fs.writeFile(
      MIGRATIONS_FILE,
      JSON.stringify({ migrations: this.migrations, history: this.history }, null, 2),
      'utf-8'
    );
  }

  registerMigration(name, version, description) {
    const migration = {
      id: Date.now().toString(),
      name,
      version,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.migrations.push(migration);
    this.saveMigrations();
    return { success: true, migration };
  }

  async executeMigration(id) {
    const migration = this.migrations.find(m => m.id === id);
    if (!migration) {
      return { success: false, error: '迁移不存在' };
    }

    migration.status = 'running';
    migration.startedAt = new Date().toISOString();
    this.saveMigrations();

    // 模拟迁移执行
    await new Promise(resolve => setTimeout(resolve, 100));

    migration.status = 'completed';
    migration.completedAt = new Date().toISOString();

    this.history.push({
      ...migration,
      executionId: Date.now().toString()
    });

    this.saveMigrations();
    return { success: true };
  }

  listMigrations(status) {
    return status
      ? this.migrations.filter(m => m.status === status)
      : this.migrations;
  }

  getHistory() {
    return this.history;
  }

  rollback(id) {
    const index = this.history.findIndex(h => h.id === id);
    if (index === -1) {
      return { success: false, error: '迁移记录不存在' };
    }

    this.history[index].status = 'rolledback';
    this.history[index].rolledbackAt = new Date().toISOString();
    this.saveMigrations();
    return { success: true };
  }

  getStatus() {
    const total = this.migrations.length;
    const pending = this.migrations.filter(m => m.status === 'pending').length;
    const running = this.migrations.filter(m => m.status === 'running').length;
    const completed = this.migrations.filter(m => m.status === 'completed').length;
    const failed = this.migrations.filter(m => m.status === 'failed').length;

    return { total, pending, running, completed, failed };
  }
}
