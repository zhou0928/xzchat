import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PRESETS_FILE = path.join(os.homedir(), '.xzchat-presets.json');

/**
 * 预设提示词管理工具
 */
export class PresetManager {
  constructor() {
    this.presets = this.load();
  }

  /**
   * 加载预设
   */
  load() {
    try {
      if (fs.existsSync(PRESETS_FILE)) {
        const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ 加载预设失败，使用默认配置');
    }
    return this.getDefaultPresets();
  }

  /**
   * 保存预设
   */
  save() {
    try {
      fs.writeFileSync(PRESETS_FILE, JSON.stringify(this.presets, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`保存预设失败: ${error.message}`);
    }
  }

  /**
   * 添加预设
   */
  add(name, prompt, description) {
    this.presets[name] = {
      prompt,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    this.save();
  }

  /**
   * 删除预设
   */
  remove(name) {
    delete this.presets[name];
    this.save();
  }

  /**
   * 获取预设
   */
  get(name) {
    return this.presets[name];
  }

  /**
   * 列出所有预设
   */
  list() {
    return Object.entries(this.presets);
  }

  /**
   * 清空所有预设
   */
  clear() {
    this.presets = this.getDefaultPresets();
    this.save();
  }

  /**
   * 默认预设
   */
  getDefaultPresets() {
    return {
      'code-review': {
        prompt: '请作为代码审查专家，帮我检查这段代码。请指出：\n1. 潜在的 bug\n2. 性能问题\n3. 代码风格建议\n4. 安全性问题\n\n代码如下：\n',
        description: '代码审查提示',
        createdAt: new Date().toISOString()
      },
      'explain-code': {
        prompt: '请用简单易懂的方式解释这段代码的功能，并给出使用示例：\n',
        description: '代码解释提示',
        createdAt: new Date().toISOString()
      },
      'refactor': {
        prompt: '请帮我重构这段代码，要求：\n1. 提高代码可读性\n2. 优化性能\n3. 添加必要的注释\n4. 遵循最佳实践\n\n代码如下：\n',
        description: '代码重构提示',
        createdAt: new Date().toISOString()
      },
      'test': {
        prompt: '请为以下代码编写完整的单元测试，包括：\n1. 正常情况测试\n2. 边界情况测试\n3. 异常情况测试\n\n代码如下：\n',
        description: '编写测试提示',
        createdAt: new Date().toISOString()
      },
      'doc': {
        prompt: '请为以下代码编写清晰的文档，包括：\n1. 功能说明\n2. 参数说明\n3. 返回值说明\n4. 使用示例\n\n代码如下：\n',
        description: '编写文档提示',
        createdAt: new Date().toISOString()
      },
      'translate': {
        prompt: '请将以下内容翻译成中文（保持专业术语）：\n',
        description: '翻译提示',
        createdAt: new Date().toISOString()
      },
      'debug': {
        prompt: '请帮我调试以下问题，分析可能的原因并提供解决方案：\n',
        description: '调试提示',
        createdAt: new Date().toISOString()
      }
    };
  }
}
