import fs from 'fs/promises';
import path from 'path';

class ProjectManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-projects.json');
    this.projects = {};
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.projects = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载项目配置失败: ${error.message}`);
      }
    }
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify(this.projects, null, 2));
  }

  async list() {
    await this.load();
    return Object.values(this.projects);
  }

  async add(id, name, options = {}) {
    await this.load();
    
    if (this.projects[id]) {
      throw new Error(`项目 "${id}" 已存在`);
    }

    const project = {
      id,
      name,
      description: options.description || '',
      techStack: options.techStack || [],
      members: options.members || [],
      milestones: options.milestones || [],
      tasks: options.tasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects[id] = project;
    await this.save();

    return project;
  }

  async remove(id) {
    await this.load();
    
    if (!this.projects[id]) {
      throw new Error(`项目 "${id}" 不存在`);
    }

    delete this.projects[id];
    await this.save();

    return true;
  }

  async update(id, updates) {
    await this.load();
    
    if (!this.projects[id]) {
      throw new Error(`项目 "${id}" 不存在`);
    }

    this.projects[id] = {
      ...this.projects[id],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.save();
    return this.projects[id];
  }

  async get(id) {
    await this.load();
    return this.projects[id] || null;
  }

  async addMilestone(id, milestone) {
    await this.load();
    const project = this.projects[id];
    
    if (!project) {
      throw new Error(`项目 "${id}" 不存在`);
    }

    project.milestones.push({
      id: Date.now().toString(),
      ...milestone,
      createdAt: new Date().toISOString()
    });

    await this.save();
    return project;
  }

  async addTask(id, task) {
    await this.load();
    const project = this.projects[id];
    
    if (!project) {
      throw new Error(`项目 "${id}" 不存在`);
    }

    project.tasks.push({
      id: Date.now().toString(),
      ...task,
      createdAt: new Date().toISOString()
    });

    await this.save();
    return project;
  }

  async getProgress(id) {
    await this.load();
    const project = this.projects[id];
    
    if (!project) {
      throw new Error(`项目 "${id}" 不存在`);
    }

    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;

    return {
      project: id,
      name: project.name,
      taskProgress: project.tasks.length > 0 ? (completedTasks / project.tasks.length * 100).toFixed(0) : 0,
      milestoneProgress: project.milestones.length > 0 ? (completedMilestones / project.milestones.length * 100).toFixed(0) : 0,
      totalTasks: project.tasks.length,
      completedTasks,
      totalMilestones: project.milestones.length,
      completedMilestones
    };
  }
}

export default new ProjectManager();
