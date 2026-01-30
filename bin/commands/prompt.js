import { PresetManager } from '../../lib/utils/presets.js';

/**
 * 预设提示词管理
 */
export async function handlePromptCommand(args, context) {
  const { rl, askQuestion, addToContext } = context;

  const subCommand = args[0];
  const presetManager = new PresetManager();

  if (!subCommand || subCommand === 'help' || subCommand === 'list') {
    // 显示所有预设
    console.log('\n📝 可用预设提示词:\n');

    const presets = presetManager.list();
    presets.forEach(([name, preset], index) => {
      const desc = preset.description || '无描述';
      console.log(`${index + 1}. ${name}`);
      console.log(`   ${desc}\n`);
    });

    console.log(`用法:`);
    console.log(`  /prompt use <name>            - 使用预设提示词`);
    console.log(`  /prompt add <name> [desc]    - 添加新预设（会进入编辑模式）`);
    console.log(`  /prompt remove <name>           - 删除预设`);
    console.log(`  /prompt edit <name>            - 编辑预设`);
    console.log(`  /prompt list                   - 列出所有预设 (当前命令)`);
    console.log(`  /prompt export                 - 导出所有预设到文件`);
    console.log(`  /prompt import                 - 导入预设文件`);

    return true;
  }

  if (subCommand === 'use') {
    const name = args[1];

    if (!name) {
      console.log('❌ 用法: /prompt use <name>');
      return true;
    }

    const preset = presetManager.get(name);
    if (!preset) {
      console.log(`❌ 预设不存在: ${name}`);
      console.log('💡 使用 /prompt list 查看所有预设');
      return true;
    }

    // 直接使用预设作为用户输入
    console.log(`✅ 已加载预设: ${name}`);
    console.log(`📝 ${preset.description}\n`);

    // 将预设提示词添加到上下文
    const userInput = await askQuestion('请补充内容（或直接回车使用预设）: ');
    if (userInput.trim()) {
      addToContext(preset.prompt + userInput);
    } else {
      addToContext(preset.prompt);
    }

    return { handled: true };
  }

  if (subCommand === 'add') {
    const name = args[1];
    const description = args.slice(2).join(' ') || '自定义预设';

    if (!name) {
      console.log('❌ 用法: /prompt add <name> [description]');
      return true;
    }

    if (presetManager.get(name)) {
      console.log(`⚠️ 预设已存在: ${name}，将覆盖`);
    }

    console.log(`📝 请输入预设提示词内容（输入 /end 结束）:`);

    const lines = [];
    while (true) {
      const line = await askQuestion('> ');
      if (line === '/end') break;
      lines.push(line);
    }

    const promptText = lines.join('\n');
    presetManager.add(name, promptText, description);
    console.log(`✅ 预设已添加: ${name}`);
    return true;
  }

  if (subCommand === 'remove' || subCommand === 'rm') {
    const name = args[1];

    if (!name) {
      console.log('❌ 用法: /prompt remove <name>');
      return true;
    }

    if (!presetManager.get(name)) {
      console.log(`❌ 预设不存在: ${name}`);
      return true;
    }

    // 检查是否为内置预设
    const defaultPresets = new PresetManager().getDefaultPresets();
    if (name in defaultPresets) {
      const ans = await askQuestion('⚠️ 这是内置预设，确定要删除吗? (y/n) ');
      if (ans.trim().toLowerCase() !== 'y') {
        console.log('已取消');
        return true;
      }
    }

    presetManager.remove(name);
    console.log(`✅ 预设已删除: ${name}`);
    return true;
  }

  if (subCommand === 'edit') {
    const name = args[1];

    if (!name) {
      console.log('❌ 用法: /prompt edit <name>');
      return true;
    }

    const preset = presetManager.get(name);
    if (!preset) {
      console.log(`❌ 预设不存在: ${name}`);
      return true;
    }

    console.log(`📝 当前内容:`);
    console.log(preset.prompt);
    console.log(`\n请输入新内容（输入 /end 结束）:`);

    const lines = [];
    while (true) {
      const line = await askQuestion('> ');
      if (line === '/end') break;
      lines.push(line);
    }

    const promptText = lines.join('\n');
    presetManager.add(name, promptText, preset.description);
    console.log(`✅ 预设已更新: ${name}`);
    return true;
  }

  if (subCommand === 'export') {
    const presets = presetManager.list();
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '2.4.0',
      presets: Object.fromEntries(presets)
    };

    console.log('\n' + JSON.stringify(exportData, null, 2));
    console.log('\n💡 复制以上内容保存为文件');
    return true;
  }

  if (subCommand === 'import') {
    console.log('📝 请粘贴预设 JSON 内容（输入 /end 结束）:');

    const lines = [];
    while (true) {
      const line = await askQuestion('> ');
      if (line === '/end') break;
      lines.push(line);
    }

    try {
      const data = JSON.parse(lines.join('\n'));
      if (data.presets) {
        Object.entries(data.presets).forEach(([name, preset]) => {
          presetManager.add(name, preset.prompt, preset.description);
        });
        console.log(`✅ 已导入 ${Object.keys(data.presets).length} 个预设`);
      } else {
        console.log('❌ 无效的预设格式');
      }
    } catch (error) {
      console.log('❌ JSON 解析失败:', error.message);
    }

    return true;
  }

  console.log(`❌ 未知子命令: ${subCommand}`);
  console.log('使用 /prompt help 查看帮助');
  return true;
}

/**
 * 注册提示词命令
 */
export const promptCommands = [
  {
    name: 'prompt',
    aliases: ['preset', 'template'],
    description: '管理预设提示词',
    usage: '/prompt [use|add|remove|edit|list] [args]',
    handler: handlePromptCommand
  }
];
