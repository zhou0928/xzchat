import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const TEAM_FILE = path.join(DATA_DIR, 'team.json');

export class TeamManager {
  constructor() {
    this.members = [];
    this.projects = [];
    this.loadTeam();
  }

  async loadTeam() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(TEAM_FILE, 'utf-8');
      const saved = JSON.parse(data);
      this.members = saved.members || [];
      this.projects = saved.projects || [];
    } catch (error) {
      this.members = [];
      this.projects = [];
      await this.saveTeam();
    }
  }

  async saveTeam() {
    await fs.writeFile(TEAM_FILE, JSON.stringify({ members: this.members, projects: this.projects }, null, 2), 'utf-8');
  }

  addMember(name, email, role) {
    this.members.push({ id: Date.now().toString(), name, email, role, joinedAt: new Date().toISOString() });
    this.saveTeam();
    return { success: true };
  }

  listMembers() { return this.members; }

  addProject(name, description) {
    this.projects.push({ id: Date.now().toString(), name, description, createdAt: new Date().toISOString() });
    this.saveTeam();
    return { success: true };
  }

  listProjects() { return this.projects; }
}
