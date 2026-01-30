export async function handleUndoCommand(messages, setMessages, rl) {
  if (messages.length < 2) {
    console.log('⚠️  没有可以撤销的消息');
    return;
  }

  const lastMsg = messages[messages.length - 1];

  if (lastMsg.role === 'tool') {
    // 撤销工具调用相关消息（包括助手消息和工具输出）
    const toolCallIndex = messages.findIndex(m => m.tool_calls);

    if (toolCallIndex !== -1) {
      const removed = messages.splice(toolCallIndex, messages.length - toolCallIndex);
      setMessages(messages);
      console.log(`✅ 已撤销 ${removed.length} 条消息（工具调用）`);
      return;
    }
  }

  // 撤销最后一条消息
  const removed = messages.pop();
  setMessages(messages);
  console.log(`✅ 已撤销一条 ${removed.role === 'user' ? '用户' : '助手'}消息`);
}

export async function handleRetryCommand(messages, setMessages, mainChat, rl) {
  // 查找最后一条用户消息
  const lastUserIndex = messages.map(m => m.role).lastIndexOf('user');

  if (lastUserIndex === -1) {
    console.log('⚠️  没有找到用户消息');
    return;
  }

  // 移除最后的助手消息和工具调用
  const messagesToKeep = messages.slice(0, lastUserIndex + 1);

  setMessages(messagesToKeep);

  console.log('🔄 重新生成上一条回复...');
  await mainChat(messages[messagesToKeep.length - 1].content);
}

export async function handleContinueCommand(messages, setMessages, mainChat, rl) {
  if (messages.length === 0) {
    console.log('⚠️  没有消息可以继续');
    return;
  }

  const lastMsg = messages[messages.length - 1];

  if (lastMsg.role !== 'assistant') {
    console.log('⚠️  最后一条消息不是助手的回复');
    return;
  }

  console.log('▶️  让助手继续生成...');
  await mainChat(null); // 不添加新消息，直接请求继续
}

export async function handleEditCommand(input, messages, setMessages, mainChat, rl) {
  const parts = input.trim().split(/\s+/);

  if (parts.length < 2) {
    console.log('用法: /edit <索引>');
    console.log('示例: /edit 2  (编辑第 3 条消息)');
    return;
  }

  const index = parseInt(parts[1]);

  if (isNaN(index) || index < 0 || index >= messages.length) {
    console.log(`无效的索引。有效范围: 0 - ${messages.length - 1}`);
    return;
  }

  const msg = messages[index];

  console.log(`\n当前内容 (${msg.role}):`);
  console.log('--------------------------------------------------');
  console.log(msg.content);
  console.log('--------------------------------------------------\n');

  const editor = process.env.EDITOR || 'vi';
  const tmpDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
  const path = await import('node:path');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const { execSync } = await import('node:child_process');

  const tempFile = path.join(tmpDir, `xzchat-edit-${Date.now()}.md`);

  try {
    fs.writeFileSync(tempFile, msg.content, 'utf-8');
    execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });

    const newContent = fs.readFileSync(tempFile, 'utf-8').trim();
    fs.unlinkSync(tempFile);

    if (newContent === msg.content) {
      console.log('内容未修改');
      return;
    }

    const ans = await rl.question('确认修改? (y/n) ');

    if (ans.trim().toLowerCase() === 'y') {
      messages[index].content = newContent;
      setMessages(messages);
      console.log('✅ 消息已更新');

      // 如果编辑的是用户消息，询问是否重新生成
      if (msg.role === 'user') {
        const shouldRetry = await rl.question('是否重新生成回复? (y/n) ');

        if (shouldRetry.trim().toLowerCase() === 'y') {
          // 移除该消息之后的回复
          const newMessages = messages.slice(0, index + 1);
          setMessages(newMessages);
          await mainChat(newContent);
        }
      }
    } else {
      console.log('已取消');
    }
  } catch (error) {
    console.error(`编辑失败: ${error.message}`);
  }
}
