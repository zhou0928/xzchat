/**
 * 多模态输入管理器（完整版本）
 * 支持图片描述、OCR文字识别、图表识别、图像生成等
 */
import fs from 'fs/promises';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

class ImageManager {
  constructor() {
    this.configPath = this.getHomeDir() + '/.xzchat-image.json';
    this.config = {
      // OpenAI Vision API
      openaiApiKey: '',
      ollamaUrl: 'http://localhost:11434',
      preferredProvider: 'ollama', // 'openai', 'ollama', 'local'
      maxImageSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
    };
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  /**
   * 加载配置
   */
  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(data) };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载图片管理配置失败: ${error.message}`);
      }
    }
  }

  /**
   * 保存配置
   */
  async save() {
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * 验证图片文件
   */
  async validateImage(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      
      if (!stats.isFile()) {
        throw new Error(`路径不是文件: ${imagePath}`);
      }

      if (stats.size > this.config.maxImageSize) {
        throw new Error(`图片过大 (${(stats.size / 1024 / 1024).toFixed(2)}MB)，最大支持 20MB`);
      }

      const ext = imagePath.split('.').pop().toLowerCase();
      if (!this.config.supportedFormats.includes(ext)) {
        throw new Error(`不支持的图片格式: ${ext}，支持格式: ${this.config.supportedFormats.join(', ')}`);
      }

      // 读取图片内容并转换为 Base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64 = imageBuffer.toString('base64');
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      return { base64, mimeType, size: stats.size };
    } catch (error) {
      throw new Error(`图片验证失败: ${error.message}`);
    }
  }

  /**
   * 使用 OpenAI Vision API 描述图片
   */
  async describeWithOpenAI(base64, mimeType, prompt = '请详细描述这张图片') {
    if (!this.config.openaiApiKey) {
      throw new Error('未配置 OpenAI API Key');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API 错误: ${error}`);
    }

    const data = await response.json();
    return {
      description: data.choices[0].message.content,
      provider: 'openai',
      confidence: 0.95,
      model: 'gpt-4-vision-preview'
    };
  }

  /**
   * 使用 Ollama Vision 描述图片
   */
  async describeWithOllama(base64, mimeType, prompt = '请详细描述这张图片') {
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llava',
          prompt: prompt,
          images: [base64],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API 错误: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        description: data.response,
        provider: 'ollama',
        confidence: 0.85,
        model: 'llava'
      };
    } catch (error) {
      throw new Error(`Ollama 请求失败: ${error.message}`);
    }
  }

  /**
   * 描述图片（自动选择提供商）
   */
  async describe(imagePath, options = {}) {
    const { prompt, provider } = options;
    await this.load();

    const { base64, mimeType } = await this.validateImage(imagePath);

    const selectedProvider = provider || this.config.preferredProvider;

    if (selectedProvider === 'openai') {
      return await this.describeWithOpenAI(base64, mimeType, prompt);
    } else if (selectedProvider === 'ollama') {
      return await this.describeWithOllama(base64, mimeType, prompt);
    } else {
      throw new Error(`不支持的提供商: ${selectedProvider}`);
    }
  }

  /**
   * OCR 文字识别（使用 OpenAI Vision）
   */
  async ocr(imagePath, options = {}) {
    const { prompt = '请识别图片中的所有文字，按原文输出' } = options;
    
    const result = await this.describe(imagePath, {
      prompt,
      provider: 'openai'
    });

    return {
      text: result.description,
      confidence: result.confidence,
      provider: result.provider,
      format: 'text'
    };
  }

  /**
   * 识别图表
   */
  async recognizeChart(imagePath, options = {}) {
    const prompt = `
    请分析这张图表，并以 JSON 格式返回以下信息：
    - type: 图表类型 (bar, line, pie, scatter, etc.)
    - title: 图表标题
    - xaxis: X轴标签
    - yaxis: Y轴标签
    - data: 数据点数组
    - summary: 图表摘要说明
    
    请只返回 JSON，不要其他文字。
    `;

    const result = await this.describe(imagePath, { prompt });

    try {
      // 尝试提取 JSON
      const jsonMatch = result.description.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const chartData = JSON.parse(jsonMatch[0]);
        return {
          ...chartData,
          summary: result.description,
          provider: result.provider
        };
      }
    } catch (error) {
      // JSON 解析失败，返回原始描述
    }

    return {
      type: 'unknown',
      data: [],
      summary: result.description,
      provider: result.provider
    };
  }

  /**
   * 生成图片（使用 DALL-E）
   */
  async generate(prompt, options = {}) {
    if (!this.config.openaiApiKey) {
      throw new Error('未配置 OpenAI API Key');
    }

    const { size = '1024x1024', quality = 'standard', n = 1 } = options;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: n,
        size: size,
        quality: quality
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DALL-E API 错误: ${error}`);
    }

    const data = await response.json();
    return {
      images: data.data.map(img => ({
        url: img.url,
        revised_prompt: img.revised_prompt
      })),
      provider: 'openai',
      model: 'dall-e-3',
      size: size,
      quality: quality
    };
  }

  /**
   * 图片编辑（使用 DALL-E）
   */
  async edit(imagePath, prompt, maskPath = null, options = {}) {
    if (!this.config.openaiApiKey) {
      throw new Error('未配置 OpenAI API Key');
    }

    const { size = '1024x1024', n = 1 } = options;
    const imageBuffer = await fs.readFile(imagePath);
    const formData = new FormData();

    formData.append('image', imageBuffer, 'image.png');
    formData.append('prompt', prompt);
    formData.append('n', n.toString());
    formData.append('size', size);

    if (maskPath) {
      const maskBuffer = await fs.readFile(maskPath);
      formData.append('mask', maskBuffer, 'mask.png');
    }

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DALL-E Edit API 错误: ${error}`);
    }

    const data = await response.json();
    return {
      images: data.data.map(img => ({ url: img.url })),
      provider: 'openai',
      model: 'dall-e-2'
    };
  }

  /**
   * 图片变体生成
   */
  async variations(imagePath, options = {}) {
    if (!this.config.openaiApiKey) {
      throw new Error('未配置 OpenAI API Key');
    }

    const { size = '1024x1024', n = 1 } = options;
    const imageBuffer = await fs.readFile(imagePath);
    const formData = new FormData();

    formData.append('image', imageBuffer, 'image.png');
    formData.append('n', n.toString());
    formData.append('size', size);

    const response = await fetch('https://api.openai.com/v1/images/variations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DALL-E Variations API 错误: ${error}`);
    }

    const data = await response.json();
    return {
      images: data.data.map(img => ({ url: img.url })),
      provider: 'openai',
      model: 'dall-e-2'
    };
  }

  /**
   * 批量处理图片
   */
  async batchProcess(imagePaths, operation, options = {}) {
    const results = [];

    for (const imagePath of imagePaths) {
      try {
        let result;
        switch (operation) {
          case 'describe':
            result = await this.describe(imagePath, options);
            break;
          case 'ocr':
            result = await this.ocr(imagePath, options);
            break;
          case 'chart':
            result = await this.recognizeChart(imagePath, options);
            break;
          default:
            throw new Error(`不支持的操作: ${operation}`);
        }
        results.push({ path: imagePath, success: true, ...result });
      } catch (error) {
        results.push({ path: imagePath, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 配置 API 密钥
   */
  async configure(options = {}) {
    await this.load();

    if (options.openaiApiKey !== undefined) {
      this.config.openaiApiKey = options.openaiApiKey;
    }
    if (options.ollamaUrl !== undefined) {
      this.config.ollamaUrl = options.ollamaUrl;
    }
    if (options.preferredProvider !== undefined) {
      this.config.preferredProvider = options.preferredProvider;
    }

    await this.save();
    return this.config;
  }

  /**
   * 获取配置信息
   */
  getConfig() {
    return {
      provider: this.config.preferredProvider,
      ollamaUrl: this.config.ollamaUrl,
      openaiConfigured: !!this.config.openaiApiKey,
      supportedFormats: this.config.supportedFormats,
      maxImageSize: this.config.maxImageSize
    };
  }
}

export default new ImageManager();
