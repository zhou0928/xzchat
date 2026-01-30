import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

/**
 * 性能分析管理器
 * 记录和管理性能分析数据
 */
export class ProfileManager {
  constructor() {
    this.profiles = [];
    this.loadProfiles();
  }

  async loadProfiles() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(PROFILES_FILE, 'utf-8');
      this.profiles = JSON.parse(data);
    } catch (error) {
      this.profiles = [];
      await this.saveProfiles();
    }
  }

  async saveProfiles() {
    await fs.writeFile(PROFILES_FILE, JSON.stringify(this.profiles, null, 2), 'utf-8');
  }

  createProfile(name, samples) {
    this.profiles.push({
      id: Date.now().toString(),
      name,
      samples,
      timestamp: new Date().toISOString()
    });
    this.saveProfiles();
    return { success: true };
  }

  listProfiles() { return this.profiles; }

  getProfile(id) { return this.profiles.find(p => p.id === id) || null; }
}
