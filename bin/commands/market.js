import marketManager from '../../lib/utils/market.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'search':
        return await handleSearch(rest);
      case 'install':
        return await handleInstall(rest);
      case 'uninstall':
        return await handleUninstall(rest);
      case 'update':
        return await handleUpdate(rest);
      case 'update-all':
        return await handleUpdateAll();
      case 'list':
      case 'ls':
        return await handleList(rest);
      case 'info':
        return await handleInfo(rest);
      case 'enable':
        return await handleEnable(rest);
      case 'disable':
        return await handleDisable(rest);
      case 'categories':
        return await handleCategories();
      case 'trending':
        return await handleTrending(rest);
      case 'top-rated':
        return await handleTopRated(rest);
      case 'featured':
        return await handleFeatured();
      case 'reviews':
        return await handleReviews(rest);
      case 'review':
        return await handleSubmitReview(rest);
      case 'stats':
        return await handleStats();
      case 'recommend':
        return await handleRecommend();
      case 'check-updates':
        return await handleCheckUpdates();
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleSearch(args) {
  let query = '';
  const filters = {};

  // 解析参数
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--category' && args[i + 1]) {
      filters.category = args[++i];
    } else if (arg === '--tag' && args[i + 1]) {
      if (!filters.tags) filters.tags = [];
      filters.tags.push(args[++i]);
    } else if (arg === '--min-rating' && args[i + 1]) {
      filters.minRating = parseFloat(args[++i]);
    } else if (arg === '--featured') {
      filters.featured = true;
    } else if (arg === '--sort' && args[i + 1]) {
      filters.sortBy = args[++i];
    } else {
      query = arg;
    }
  }

  console.log(`🔍 正在搜索插件...`);
  const results = await marketManager.search(query, filters);
  
  if (results.length === 0) {
    return `🔍 未找到匹配的插件`;
  }

  let output = `🔍 搜索结果 (${results.length})\n\n`;
  
  results.forEach((plugin, index) => {
    output += `${index + 1}. ${plugin.name}\n`;
    output += `   ID: ${plugin.id}\n`;
    output += `   作者: ${plugin.author}\n`;
    output += `   版本: ${plugin.version}\n`;
    output += `   分类: ${plugin.category}\n`;
    output += `   下载: ${plugin.downloads.toLocaleString()}\n`;
    output += `   评分: ${plugin.rating} ⭐ (${plugin.reviewCount} 评论)\n`;
    output += `   标签: ${plugin.tags?.join(', ') || 'N/A'}\n`;
    output += `   ${plugin.description.substring(0, 80)}...\n\n`;
  });

  return output;
}

async function handleInstall(args) {
  const [pluginId, ...options] = args;
  
  if (!pluginId) {
    return '❌ 用法: /market install <plugin-id>';
  }

  console.log(`📦 正在安装插件 ${pluginId}...`);
  const result = await marketManager.install(pluginId);
  
  return `✅ 插件安装成功\n\n` +
         `名称: ${result.name}\n` +
         `版本: ${result.version}\n` +
         `大小: ${result.size}\n` +
         `安装路径: ${result.installPath}`;
}

async function handleUninstall(args) {
  const [pluginId, ...options] = args;
  
  if (!pluginId) {
    return '❌ 用法: /market uninstall <plugin-id> [options]';
  }

  const opts = {
    removeData: !options.includes('--keep-data'),
    confirm: !options.includes('--no-confirm')
  };

  if (opts.confirm) {
    console.log(`⚠️  将卸载插件 ${pluginId}`);
    console.log(`使用 --no-confirm 跳过确认`);
  }

  await marketManager.uninstall(pluginId, opts);
  return `✅ 插件已卸载`;
}

async function handleUpdate(args) {
  const [pluginId] = args;
  
  if (!pluginId) {
    return '❌ 用法: /market update <plugin-id>';
  }

  console.log(`🔄 正在更新插件...`);
  const result = await marketManager.update(pluginId);
  
  return `✅ 插件更新成功\n\n` +
         `名称: ${result.name}\n` +
         `新版本: ${result.version}`;
}

async function handleUpdateAll() {
  console.log(`🔄 检查所有插件更新...`);
  const results = await marketManager.updateAll();
  
  if (results.length === 0) {
    return `✅ 所有插件已是最新版本`;
  }

  let output = `🔄 批量更新完成\n\n`;
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  output += `总计: ${results.length} 个插件\n`;
  output += `成功: ${successCount}\n`;
  output += `失败: ${failCount}\n\n`;
  
  if (failCount > 0) {
    output += `失败的插件:\n`;
    results.filter(r => !r.success).forEach(r => {
      output += `  ❌ ${r.plugin}: ${r.error}\n`;
    });
  }
  
  return output;
}

async function handleList(args) {
  const [enabledOnly] = args;
  const options = { enabledOnly: enabledOnly === '--enabled' };
  
  console.log(`📋 正在加载已安装插件...`);
  const plugins = await marketManager.listInstalled(options);
  
  if (plugins.length === 0) {
    return `📋 ${options.enabledOnly ? '暂无启用的插件' : '暂无已安装的插件'}`;
  }

  let output = `📋 已安装插件 (${plugins.length})\n\n`;
  
  plugins.forEach((plugin, index) => {
    const status = plugin.enabled ? '✅' : '⏸️';
    output += `${index + 1}. ${status} ${plugin.name}\n`;
    output += `   ID: ${plugin.id}\n`;
    output += `   版本: ${plugin.version}\n`;
    output += `   作者: ${plugin.author}\n`;
    output += `   安装时间: ${plugin.installedAt}\n\n`;
  });

  return output;
}

async function handleInfo(args) {
  const [pluginId] = args;
  
  if (!pluginId) {
    return '❌ 用法: /market info <plugin-id>';
  }

  const plugin = await marketManager.getPluginDetails(pluginId);
  
  let output = `📦 ${plugin.name}\n\n`;
  output += `ID: ${plugin.id}\n`;
  output += `版本: ${plugin.latestVersion}`;
  if (plugin.currentVersion) {
    output += ` (当前: ${plugin.currentVersion}${plugin.needsUpdate ? ' - 有更新' : ' - 最新'})\n`;
  } else {
    output += `\n`;
  }
  output += `作者: ${plugin.author}\n`;
  output += `分类: ${plugin.category}\n`;
  output += `下载: ${plugin.downloads.toLocaleString()}\n`;
  output += `评分: ${plugin.rating} ⭐ (${plugin.reviewCount} 评论)\n`;
  output += `许可: ${plugin.license}\n`;
  output += `大小: ${plugin.size}\n`;
  output += `最低版本: ${plugin.minVersion}\n`;
  output += `更新时间: ${plugin.lastUpdated}\n`;
  output += `状态: ${plugin.installed ? '已安装' : '未安装'}\n\n`;
  output += `描述:\n${plugin.description}\n\n`;
  
  if (plugin.tags && plugin.tags.length > 0) {
    output += `标签: ${plugin.tags.join(', ')}\n\n`;
  }
  
  if (plugin.features && plugin.features.length > 0) {
    output += `功能:\n`;
    plugin.features.forEach(f => output += `  • ${f}\n`);
    output += '\n';
  }
  
  output += `链接:\n`;
  output += `  首页: ${plugin.homepage}\n`;
  output += `  仓库: ${plugin.repository}`;
  
  return output;
}

async function handleEnable(args) {
  const [pluginId] = args;
  
  if (!pluginId) {
    return '❌ 用法: /market enable <plugin-id>';
  }

  const result = await marketManager.togglePlugin(pluginId, true);
  return `✅ 插件已启用\n\n名称: ${result.name}`;
}

async function handleDisable(args) {
  const [pluginId] = args;
  
  if (!pluginId) {
    return '❌ 用法: /market disable <plugin-id>';
  }

  const result = await marketManager.togglePlugin(pluginId, false);
  return `⏸️  插件已禁用\n\n名称: ${result.name}`;
}

async function handleCategories() {
  const categories = await marketManager.getCategories();
  
  let output = `📂 插件分类\n\n`;
  categories.forEach(cat => {
    output += `  ${cat.id.padEnd(20)} ${cat.name} (${cat.count})\n`;
  });
  
  return output;
}

async function handleTrending(args) {
  const [limitStr] = args;
  const limit = limitStr ? parseInt(limitStr) : 10;
  
  console.log(`🔥 正在获取热门插件...`);
  const plugins = await marketManager.getTrending(limit);
  
  let output = `🔥 热门插件 (Top ${plugins.length})\n\n`;
  
  plugins.forEach((plugin, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    output += `${medal} ${plugin.name}\n`;
    output += `    下载: ${plugin.downloads.toLocaleString()}\n`;
    output += `    评分: ${plugin.rating} ⭐\n\n`;
  });
  
  return output;
}

async function handleTopRated(args) {
  const [limitStr] = args;
  const limit = limitStr ? parseInt(limitStr) : 10;
  
  console.log(`⭐ 正在获取高评分插件...`);
  const plugins = await marketManager.getTopRated(limit);
  
  let output = `⭐ 高评分插件 (Top ${plugins.length})\n\n`;
  
  plugins.forEach((plugin, index) => {
    output += `${index + 1}. ${plugin.name}\n`;
    output += `    评分: ${plugin.rating} ⭐ (${plugin.reviewCount} 评论)\n`;
    output += `    下载: ${plugin.downloads.toLocaleString()}\n\n`;
  });
  
  return output;
}

async function handleFeatured() {
  console.log(`✨ 正在获取精选插件...`);
  const plugins = await marketManager.getFeatured();
  
  let output = `✨ 精选插件\n\n`;
  
  plugins.forEach((plugin, index) => {
    output += `${index + 1}. ${plugin.name}\n`;
    output += `    ${plugin.description.substring(0, 100)}...\n`;
    output += `    评分: ${plugin.rating} ⭐\n\n`;
  });
  
  return output;
}

async function handleReviews(args) {
  const [pluginId] = args;
  
  if (!pluginId) {
    return '❌ 用法: /market reviews <plugin-id>';
  }

  const reviews = await marketManager.getReviews(pluginId);
  
  if (reviews.length === 0) {
    return `💬 "${pluginId}" 暂无评论`;
  }

  let output = `💬 评论 (${pluginId})\n\n`;
  
  reviews.forEach((review, index) => {
    output += `${index + 1}. ${'⭐'.repeat(review.rating)}\n`;
    if (review.title) {
      output += `   ${review.title}\n`;
    }
    if (review.comment) {
      output += `   ${review.comment}\n`;
    }
    output += `   ${review.createdAt}\n\n`;
  });
  
  return output;
}

async function handleSubmitReview(args) {
  const [pluginId, ratingStr, ...commentParts] = args;
  
  if (!pluginId || !ratingStr) {
    return '❌ 用法: /market review <plugin-id> <rating-1-5> [comment]';
  }

  const rating = parseInt(ratingStr);
  if (rating < 1 || rating > 5) {
    return '❌ 评分必须在 1-5 之间';
  }

  const review = {
    rating,
    comment: commentParts.join(' ')
  };

  const result = await marketManager.submitReview(pluginId, review);
  
  return `✅ 评论已提交\n\n` +
         `评分: ${'⭐'.repeat(result.rating)}\n` +
         `评论: ${result.comment || '(无)'}`;
}

async function handleStats() {
  const stats = await marketManager.getStatistics();
  
  let output = `📊 市场统计\n\n`;
  output += `总插件数: ${stats.totalPlugins}\n`;
  output += `总下载量: ${stats.totalDownloads.toLocaleString()}\n`;
  output += `平均评分: ${stats.averageRating} ⭐\n`;
  output += `活跃作者: ${stats.activeAuthors}\n\n`;
  output += `个人统计:\n`;
  output += `已安装: ${stats.installedCount}\n`;
  output += `已启用: ${stats.enabledCount}`;
  
  return output;
}

async function handleRecommend() {
  console.log(`💡 正在生成推荐...`);
  const plugins = await marketManager.getRecommendations();
  
  if (plugins.length === 0) {
    return `💡 暂无推荐 (安装更多插件后可获得个性化推荐)`;
  }

  let output = `💡 为您推荐\n\n`;
  
  plugins.forEach((plugin, index) => {
    output += `${index + 1}. ${plugin.name}\n`;
    output += `    ${plugin.description.substring(0, 80)}...\n`;
    output += `    下载: ${plugin.downloads.toLocaleString()}\n\n`;
  });
  
  return output;
}

async function handleCheckUpdates() {
  console.log(`🔍 正在检查更新...`);
  const updates = await marketManager.checkUpdates();
  
  if (updates.length === 0) {
    return `✅ 所有插件已是最新版本`;
  }

  let output = `🔍 发现 ${updates.length} 个更新\n\n`;
  
  updates.forEach(update => {
    output += `${update.name}\n`;
    output += `  当前版本: ${update.currentVersion}\n`;
    output += `  最新版本: ${update.latestVersion}\n`;
    output += `  大小: ${update.size}\n`;
    output += `  发布时间: ${update.releaseDate}\n\n`;
  });
  
  output += `使用 /market update <plugin-id> 进行更新`;
  
  return output;
}

function showHelp() {
  return `🏪 插件市场 (完整版)

用法:
  搜索和浏览:
    /market search <query> [filters]          搜索插件
    /market categories                        查看分类
    /market trending [limit]                  热门插件
    /market top-rated [limit]                 高评分插件
    /market featured                         精选插件
    /market recommend                         个性化推荐
  
  插件管理:
    /market info <plugin-id>                  插件详情
    /market install <plugin-id>               安装插件
    /market uninstall <plugin-id> [options]   卸载插件
    /market update <plugin-id>                更新插件
    /market update-all                        更新所有插件
    /market list [options]                    已安装插件
    /market enable <plugin-id>               启用插件
    /market disable <plugin-id>              禁用插件
    /market check-updates                    检查更新
  
  评论和评分:
    /market reviews <plugin-id>               查看评论
    /market review <id> <rating> [comment]   提交评论
  
  统计:
    /market stats                            市场统计

搜索过滤器:
  --category <name>       按分类筛选
  --tag <tag>            按标签筛选 (可多次)
  --min-rating <n>       最低评分
  --featured             仅显示精选
  --sort <field>         排序 (downloads|rating|updated|name)

卸载选项:
  --keep-data           保留插件数据
  --no-confirm          跳过确认

示例:
  /market search ai review
  /market search code --category Development --min-rating 4.5
  /market info ai-code-review
  /market install ai-code-review
  /market install ai-code-review auto-docs git-flow
  /market update ai-code-review
  /market update-all
  /market list
  /market list --enabled
  /market enable ai-code-review
  /market reviews ai-code-review
  /market review ai-code-review 5 "非常好用的插件！"
  /market trending
  /market check-updates`;
}
