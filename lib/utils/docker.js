import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DOCKER_FILE = path.join(DATA_DIR, 'docker-commands.json');

/**
 * Docker管理器
 * 管理Docker容器、镜像和命令
 */
export class DockerManager {
  constructor() {
    this.commands = [];
    this.containers = [];
    this.loadCommands();
  }

  async loadCommands() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(DOCKER_FILE, 'utf-8');
      this.commands = JSON.parse(data);
    } catch (error) {
      this.commands = this.getDefaultCommands();
      await this.saveCommands();
    }
  }

  async saveCommands() {
    await fs.writeFile(DOCKER_FILE, JSON.stringify(this.commands, null, 2), 'utf-8');
  }

  getDefaultCommands() {
    return [
      { id: 'ps', name: '查看容器', template: 'docker ps -a' },
      { id: 'images', name: '查看镜像', template: 'docker images' },
      { id: 'build', name: '构建镜像', template: 'docker build -t {name} .' },
      { id: 'run', name: '运行容器', template: 'docker run -d --name {name} {image}' },
      { id: 'stop', name: '停止容器', template: 'docker stop {container}' },
      { id: 'rm', name: '删除容器', template: 'docker rm {container}' },
      { id: 'logs', name: '查看日志', template: 'docker logs {container}' },
      { id: 'exec', name: '执行命令', template: 'docker exec -it {container} {command}' },
      { id: 'compose-up', name: '启动服务', template: 'docker-compose up -d' },
      { id: 'compose-down', name: '停止服务', template: 'docker-compose down' }
    ];
  }

  listCommands() { return this.commands; }

  getCommand(id) { return this.commands.find(c => c.id === id) || null; }

  async addCommand(cmd) {
    this.commands.push({ ...cmd, id: Date.now().toString() });
    await this.saveCommands();
    return { success: true };
  }

  async removeCommand(id) {
    this.commands = this.commands.filter(c => c.id !== id);
    await this.saveCommands();
    return { success: true };
  }

  async executeCommand(template, vars) {
    let cmd = template;
    Object.entries(vars).forEach(([k, v]) => {
      cmd = cmd.replace(`{${k}}`, v);
    });
    try {
      const result = execSync(cmd, { encoding: 'utf-8' });
      return { success: true, output: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
