import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ALIAS_FILE = path.join(os.homedir(), '.xzchat-aliases.json');

/**
 * 别名管理工具
 */
export class AliasManager {
  constructor() {
    this.aliases = this.load();
  }

  /**
   * 加载别名配置
   */
  load() {
    try {
      if (fs.existsSync(ALIAS_FILE)) {
        const data = fs.readFileSync(ALIAS_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ 加载别名失败，使用默认配置');
    }
    return {};
  }

  /**
   * 保存别名配置
   */
  save() {
    try {
      fs.writeFileSync(ALIAS_FILE, JSON.stringify(this.aliases, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`保存别名失败: ${error.message}`);
    }
  }

  /**
   * 添加别名
   */
  add(name, command) {
    this.aliases[name] = command;
    this.save();
  }

  /**
   * 删除别名
   */
  remove(name) {
    delete this.aliases[name];
    this.save();
  }

  /**
   * 获取别名对应的命令
   */
  get(name) {
    return this.aliases[name];
  }

  /**
   * 列出所有别名
   */
  list() {
    return Object.entries(this.aliases);
  }

  /**
   * 清空所有别名
   */
  clear() {
    this.aliases = {};
    this.save();
  }

  /**
   * 检查别名是否存在
   */
  has(name) {
    return name in this.aliases;
  }
}

/**
 * 预设别名
 */
export const BUILTIN_ALIASES = {
  'c': '/clear',
  'h': '/help',
  'q': '/quit',
  'e': '/exit',
  's': '/scan',
  'l': '/load',
  'cm': '/commit',
  'rv': '/review',
  'hi': '你好！我需要帮助',
  'bye': '谢谢你的帮助',
  'code': '请帮我写一段代码：',
  'fix': '请帮我修复以下错误：',
  'explain': '请解释一下：',
  'summary': '请总结一下：'
};
