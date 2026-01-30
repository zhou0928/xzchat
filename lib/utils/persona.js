import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class PersonaManager {
  constructor() {
    this.personasPath = path.join(os.homedir(), '.xzchat-personas.json');
    this.personas = {
      default: {
        name: '默认助手',
        prompt: '你是一个有帮助的AI助手，用简洁清晰的方式回答问题。',
        tone: 'professional'
      },
      creative: {
        name: '创意专家',
        prompt: '你是一个富有创意的专家，喜欢用新颖的思维方式解决问题，语言生动有趣。',
        tone: 'creative'
      },
      tech: {
        name: '技术专家',
        prompt: '你是一个技术专家，专注于提供准确、深入的技术解答，代码示例要清晰。',
        tone: 'professional'
      },
      teacher: {
        name: '老师',
        prompt: '你是一个耐心的老师，会用通俗易懂的方式解释复杂概念，并给出实例。',
        tone: 'friendly'
      },
      concise: {
        name: '简洁助手',
        prompt: '你是一个简洁高效的助手，直接给出答案，不废话。',
        tone: 'professional'
      }
    };
    this.activePersona = 'default';
  }

  async load() {
    try {
      const data = await fs.readFile(this.personasPath, 'utf-8');
      const loaded = JSON.parse(data);
      this.personas = { ...this.personas, ...loaded.personas };
      this.activePersona = loaded.activePersona || 'default';
    } catch (error) {
      if (error.code === 'ENOENT') await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.personasPath, JSON.stringify({
      personas: this.personas,
      activePersona: this.activePersona
    }, null, 2), 'utf-8');
  }

  async add(id, name, prompt, tone = 'professional') {
    await this.load();
    this.personas[id] = { name, prompt, tone };
    await this.save();
    return this.personas[id];
  }

  async remove(id) {
    await this.load();
    if (id === 'default' || id === 'creative') {
      throw new Error('不能删除默认人格');
    }
    if (this.personas[id]) {
      delete this.personas[id];
      if (this.activePersona === id) this.activePersona = 'default';
      await this.save();
      return true;
    }
    return false;
  }

  async setActive(id) {
    await this.load();
    if (!this.personas[id]) throw new Error(`未找到人格: ${id}`);
    this.activePersona = id;
    await this.save();
    return this.personas[id];
  }

  async getActive() {
    await this.load();
    return this.personas[this.activePersona];
  }

  async get(id) {
    await this.load();
    return this.personas[id];
  }

  async list() {
    await this.load();
    return Object.entries(this.personas).map(([id, p]) => ({
      id,
      ...p,
      active: id === this.activePersona
    }));
  }

  async update(id, updates) {
    await this.load();
    if (this.personas[id]) {
      this.personas[id] = { ...this.personas[id], ...updates };
      await this.save();
      return this.personas[id];
    }
    return null;
  }

  formatList(personas) {
    if (personas.length === 0) return '暂无人格';
    let output = '';
    personas.forEach(p => {
      const active = p.active ? '✅' : '⬜';
      const preview = p.prompt.length > 60 ? p.prompt.substring(0, 60) + '...' : p.prompt;
      output += `${active} ${p.name} (${p.id}) [${p.tone}]\n   ${preview}\n\n`;
    });
    return output.trim();
  }
}

const personaManager = new PersonaManager();
export default personaManager;
export { PersonaManager };
