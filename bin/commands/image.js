import imageManager from '../../lib/utils/image.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'describe':
        return await handleDescribe(rest, context);
      case 'ocr':
        return await handleOcr(rest, context);
      case 'chart':
        return await handleChart(rest);
      case 'generate':
        return await handleGenerate(rest);
      case 'edit':
        return await handleEdit(rest);
      case 'variations':
        return await handleVariations(rest);
      case 'batch':
        return await handleBatch(rest);
      case 'config':
        return await handleConfig(rest);
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleDescribe(args, context) {
  const [imagePath, ...promptParts] = args;
  
  if (!imagePath) {
    return '❌ 请指定图片路径\n用法: /image describe <image-path> [prompt]';
  }

  const prompt = promptParts.join(' ') || '请详细描述这张图片';
  const result = await imageManager.describe(imagePath, { prompt });
  
  return `🖼️  图片描述\n\n` +
         `提供商: ${result.provider}\n` +
         `模型: ${result.model}\n` +
         `描述:\n${result.description}\n` +
         `置信度: ${(result.confidence * 100).toFixed(0)}%`;
}

async function handleOcr(args, context) {
  const [imagePath, ...promptParts] = args;
  
  if (!imagePath) {
    return '❌ 请指定图片路径\n用法: /image ocr <image-path> [prompt]';
  }

  const prompt = promptParts.join(' ') || '请识别图片中的所有文字，按原文输出';
  const result = await imageManager.ocr(imagePath, { prompt });
  
  return `📝 文字识别 (OCR)\n\n` +
         `提供商: ${result.provider}\n` +
         `识别结果:\n${result.text}\n` +
         `置信度: ${(result.confidence * 100).toFixed(0)}%`;
}

async function handleChart(args) {
  const [imagePath] = args;
  
  if (!imagePath) {
    return '❌ 请指定图片路径\n用法: /image chart <image-path>';
  }

  const result = await imageManager.recognizeChart(imagePath);
  
  let output = `📊 图表识别\n\n`;
  output += `类型: ${result.type}\n`;
  output += `标题: ${result.title || 'N/A'}\n`;
  
  if (result.xaxis) {
    output += `X轴: ${result.xaxis}\n`;
  }
  if (result.yaxis) {
    output += `Y轴: ${result.yaxis}\n`;
  }
  if (result.data && result.data.length > 0) {
    output += `数据点: ${result.data.length} 个\n`;
  }
  output += `\n摘要: ${result.summary}`;
  
  return output;
}

async function handleGenerate(args) {
  const [prompt, size, quality] = args;
  
  if (!prompt) {
    return '❌ 请指定提示词\n用法: /image generate "<prompt>" [size] [quality]';
  }

  const options = {
    size: size || '1024x1024',
    quality: quality || 'standard'
  };

  console.log('🎨 正在生成图片...');
  const result = await imageManager.generate(prompt, options);
  
  let output = `🎨 图片生成完成\n\n`;
  output += `模型: ${result.model}\n`;
  output += `尺寸: ${result.size}\n`;
  output += `质量: ${result.quality}\n`;
  output += `数量: ${result.images.length}\n\n`;
  output += `图片链接:\n`;
  
  result.images.forEach((img, index) => {
    output += `  ${index + 1}. ${img.url}\n`;
    if (img.revised_prompt) {
      output += `     优化提示词: ${img.revised_prompt}\n`;
    }
  });
  
  return output;
}

async function handleEdit(args) {
  const [imagePath, maskPath, ...promptParts] = args;
  
  if (!imagePath) {
    return '❌ 请指定图片路径\n用法: /image edit <image-path> [mask-path] "<prompt>"';
  }

  const prompt = promptParts.join(' ');
  if (!prompt) {
    return '❌ 请指定编辑提示词';
  }

  const options = {
    maskPath: maskPath || null
  };

  console.log('🖌️  正在编辑图片...');
  const result = await imageManager.edit(imagePath, prompt, options.maskPath, options);
  
  let output = `🖌️  图片编辑完成\n\n`;
  output += `模型: ${result.model}\n`;
  output += `生成图片数: ${result.images.length}\n\n`;
  output += `图片链接:\n`;
  
  result.images.forEach((img, index) => {
    output += `  ${index + 1}. ${img.url}\n`;
  });
  
  return output;
}

async function handleVariations(args) {
  const [imagePath] = args;
  
  if (!imagePath) {
    return '❌ 请指定图片路径\n用法: /image variations <image-path>';
  }

  console.log('🔄 正在生成变体...');
  const result = await imageManager.variations(imagePath);
  
  let output = `🔄 图片变体生成完成\n\n`;
  output += `模型: ${result.model}\n`;
  output += `生成变体数: ${result.images.length}\n\n`;
  output += `图片链接:\n`;
  
  result.images.forEach((img, index) => {
    output += `  ${index + 1}. ${img.url}\n`;
  });
  
  return output;
}

async function handleBatch(args) {
  const [operation, ...imagePaths] = args;
  
  if (!operation || imagePaths.length === 0) {
    return '❌ 请指定操作类型和图片路径\n用法: /image batch <describe|ocr|chart> <image1> <image2> ...';
  }

  console.log(`📦 批量处理 ${imagePaths.length} 张图片...`);
  const results = await imageManager.batchProcess(imagePaths, operation);
  
  let output = `📦 批量处理完成\n\n`;
  output += `总计: ${results.length} 张图片\n`;
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  output += `成功: ${successCount} 张\n`;
  output += `失败: ${failCount} 张\n\n`;
  
  if (failCount > 0) {
    output += `失败的图片:\n`;
    results.filter(r => !r.success).forEach(r => {
      output += `  ❌ ${r.path}: ${r.error}\n`;
    });
    output += '\n';
  }
  
  if (successCount > 0) {
    output += `成功的图片:\n`;
    results.filter(r => r.success).forEach(r => {
      output += `  ✅ ${r.path}\n`;
      if (operation === 'describe') {
        output += `     ${r.description.substring(0, 100)}...\n`;
      } else if (operation === 'ocr') {
        output += `     ${r.text.substring(0, 100)}...\n`;
      }
    });
  }
  
  return output;
}

async function handleConfig(args) {
  const [action, ...rest] = args;
  
  if (action === 'show') {
    const config = imageManager.getConfig();
    let output = `⚙️  图片管理配置\n\n`;
    output += `首选提供商: ${config.provider}\n`;
    output += `Ollama URL: ${config.ollamaUrl}\n`;
    output += `OpenAI 已配置: ${config.openaiConfigured ? '是' : '否'}\n`;
    output += `支持格式: ${config.supportedFormats.join(', ')}\n`;
    output += `最大图片大小: ${(config.maxImageSize / 1024 / 1024).toFixed(0)}MB\n`;
    return output;
  }
  
  if (action === 'set') {
    const [key, ...valueParts] = rest;
    const value = valueParts.join(' ');
    
    if (!key || !value) {
      return '❌ 用法: /image config set <key> <value>\n支持的键: openaiKey, ollamaUrl, provider';
    }
    
    const options = {};
    if (key === 'openaiKey') {
      options.openaiApiKey = value;
    } else if (key === 'ollamaUrl') {
      options.ollamaUrl = value;
    } else if (key === 'provider') {
      if (!['openai', 'ollama'].includes(value)) {
        return '❌ 提供商必须是 openai 或 ollama';
      }
      options.preferredProvider = value;
    } else {
      return `❌ 不支持的配置项: ${key}`;
    }
    
    await imageManager.configure(options);
    return `✅ 配置已更新`;
  }
  
  return `⚙️  配置管理\n\n子命令:\n` +
         `  show    - 显示当前配置\n` +
         `  set     - 设置配置项\n\n` +
         `配置项:\n` +
         `  openaiKey   - OpenAI API 密钥\n` +
         `  ollamaUrl   - Ollama 服务地址\n` +
         `  provider    - 首选提供商 (openai|ollama)`;
}

function showHelp() {
  return `🖼️  多模态输入 (完整版)

支持的提供商:
  - OpenAI Vision API (GPT-4V, DALL-E 3)
  - Ollama Vision (LLaVA)

图片格式:
  ${['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].join(', ')}

用法:
  /image describe <图片路径> [prompt]      图片描述
  /image ocr <图片路径> [prompt]          文字识别 (OCR)
  /image chart <图片路径>                  图表识别
  /image generate "<prompt>" [size] [quality]  生成图片
  /image edit <图片路径> [mask] "<prompt>"     编辑图片
  /image variations <图片路径>             生成变体
  /image batch <op> <img1> <img2> ...    批量处理
  /image config show                       显示配置
  /image config set <key> <value>         设置配置

配置项:
  openaiKey   - OpenAI API 密钥
  ollamaUrl   - Ollama 服务地址 (默认: http://localhost:11434)
  provider    - 首选提供商 (openai|ollama)

生成选项:
  size     - 1024x1024, 1024x1792, 1792x1024 (默认: 1024x1024)
  quality  - standard, hd (默认: standard)

示例:
  /image describe ./screenshot.png
  /image describe ./photo.jpg "这是什么场景？"
  /image ocr ./text-image.png
  /image chart ./graph.png
  /image generate "一只可爱的猫咪在花园里" 1024x1024 hd
  /image edit ./photo.png "./mask.png" "将天空变成蓝色"
  /image variations ./photo.png
  /image batch describe img1.jpg img2.png img3.webp
  /image config set openaiKey sk-...
  /image config set provider ollama`;
}
