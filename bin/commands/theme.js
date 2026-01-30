/**
 * 主题命令处理器
 * 支持主题切换和自定义
 */

import {
  getThemeInstance,
  PREDEFINED_THEMES
} from '../../lib/utils/themes.js';

/**
 * 处理主题命令
 * /theme [list|set|create|info]
 */
export async function handleTheme(args) {
  const [action, ...rest] = args;

  if (!action || action === 'list') {
    return handleThemeList();
  }

  switch (action) {
    case 'set':
      return handleThemeSet(rest);
    case 'info':
      return handleThemeInfo(rest);
    case 'create':
      return handleThemeCreate(rest);
    case 'preview':
      return handleThemePreview(rest);
    default:
      console.log(`
\`/theme\` 命令使用方法:

  /theme list          列出所有可用主题
  /theme set <name>    设置主题
  /theme info <name>   查看主题详情
  /theme preview <name> 预览主题
  /theme create        创建自定义主题（交互式）
`);
      return;
  }
}

/**
 * 列出所有主题
 */
function handleThemeList() {
  const themeManager = getThemeInstance();
  const themes = themeManager.listThemes();
  const current = themeManager.getTheme();

  console.log('\n📚 可用主题:\n');

  themes.forEach(theme => {
    const isCurrent = theme.key === themeManager.currentTheme;
    const marker = isCurrent ? '👉 ' : '   ';
    const status = isCurrent ? '(当前)' : '';
    const custom = theme.isCustom ? '[自定义]' : '';

    console.log(`  ${marker}${theme.name} ${status}`);
    console.log(`      Key: ${theme.key} ${custom}`);
    console.log(`      ${theme.description}`);
    console.log('');
  });

  console.log('使用方法: /theme set <主题名称>\n');
}

/**
 * 设置主题
 */
function handleThemeSet(args) {
  const [themeName] = args;

  if (!themeName) {
    console.log('错误: 请指定主题名称');
    console.log('使用 /theme list 查看可用主题\n');
    return;
  }

  const themeManager = getThemeInstance();
  const success = themeManager.setTheme(themeName);

  if (success) {
    const theme = themeManager.getTheme();
    console.log(`\n✅ 已切换到主题: ${theme.name}\n`);

    // 显示预览
    console.log('预览效果:');
    console.log(`  ${themeManager.formatSuccess('成功消息')}`);
    console.log(`  ${themeManager.formatError('错误消息')}`);
    console.log(`  ${themeManager.formatWarning('警告消息')}`);
    console.log(`  ${themeManager.formatInfo('信息消息')}`);
    console.log(`  ${themeManager.formatCommand('/help')}`);
    console.log(`  ${themeManager.formatCode('console.log("Hello")')}`);
    console.log(`  ${themeManager.formatPath('/path/to/file.js')}`);
    console.log('');
  } else {
    console.log(`\n❌ 主题不存在: ${themeName}`);
    console.log('使用 /theme list 查看可用主题\n');
  }
}

/**
 * 查看主题详情
 */
function handleThemeInfo(args) {
  const [themeName] = args;

  if (!themeName) {
    console.log('错误: 请指定主题名称');
    return;
  }

  const theme = PREDEFINED_THEMES[themeName];

  if (!theme) {
    console.log(`\n❌ 主题不存在: ${themeName}\n`);
    return;
  }

  console.log(`\n📖 主题详情: ${theme.name}\n`);
  console.log(`描述: ${theme.description}\n`);
  console.log('图标配置:');
  Object.entries(theme.colors).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(15)}: ${value}`);
  });

  console.log('\n样式配置:');
  Object.entries(theme.styles).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(15)}: ${value}`);
  });

  console.log('');
}

/**
 * 创建自定义主题
 */
function handleThemeCreate(args) {
  console.log(`
🎨 自定义主题创建向导

此功能允许您创建自己的主题配置。
创建完成后，主题将保存在 ~/${themeManager.themeDir}/ 目录下。

手动创建步骤:
  1. 复制现有主题配置
  2. 修改图标和样式
  3. 保存为 JSON 文件

示例主题配置:
{
  "name": "我的主题",
  "description": "自定义主题描述",
  "colors": {
    "success": "✓",
    "error": "✗",
    ...
  },
  "styles": {
    "header": "bold",
    ...
  }
}

提示: 使用 /theme info default 查看默认主题的完整配置
`);
}

/**
 * 预览主题
 */
function handleThemePreview(args) {
  const [themeName] = args;

  if (!themeName) {
    // 预览当前主题
    const themeManager = getThemeInstance();
    const theme = themeManager.getTheme();
    return showThemePreview(themeManager, theme);
  }

  const theme = PREDEFINED_THEMES[themeName];

  if (!theme) {
    console.log(`\n❌ 主题不存在: ${themeName}\n`);
    return;
  }

  // 临时设置主题
  const themeManager = getThemeInstance();
  const original = themeManager.currentTheme;
  themeManager.currentTheme = themeName;

  showThemePreview(themeManager, theme);

  // 恢复原主题
  themeManager.currentTheme = original;
}

/**
 * 显示主题预览
 */
function showThemePreview(themeManager, theme) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 主题预览: ${theme.name}`);
  console.log(`${'═'.repeat(50)}\n`);

  console.log('1. 消息类型:');
  console.log(`   ${themeManager.formatSuccess('操作成功')}`);
  console.log(`   ${themeManager.formatError('操作失败')}`);
  console.log(`   ${themeManager.formatWarning('警告信息')}`);
  console.log(`   ${themeManager.formatInfo('提示信息')}`);

  console.log('\n2. 命令和代码:');
  console.log(`   命令: ${themeManager.formatCommand('/help theme')}`);
  console.log(`   代码: ${themeManager.formatCode('const hello = "world";')}`);
  console.log(`   路径: ${themeManager.formatPath('/src/lib/utils.js')}`);

  console.log('\n3. 图标:');
  console.log(`   ${theme.colors.prompt} 您`);
  console.log(`   ${theme.colors.assistant} AI`);
  console.log(`   ${theme.colors.code} 代码`);
  console.log(`   ${theme.colors.file} 文件`);
  console.log(`   ${theme.colors.folder} 文件夹`);

  console.log('\n4. 列表:');
  console.log(themeManager.createListItem('第一项', 1));
  console.log(themeManager.createListItem('第二项', 2));
  console.log(themeManager.createListItem('第三项', 3));

  console.log('\n' + '═'.repeat(50) + '\n');
}

/**
 * 处理 /th 命令（简写）
 */
export async function handleTh(args) {
  return handleTheme(args);
}

export default {
  handleTheme,
  handleTh
};
