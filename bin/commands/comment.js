import { CommentManager } from '../../lib/utils/comment.js';

const commentManager = new CommentManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'add':
        handleAdd(params);
        break;
      case 'get':
        handleGet(params[0]);
        break;
      case 'delete':
        handleDelete(params[0]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`评论操作失败: ${error.message}`);
  }
};

function handleAdd(params) {
  if (params.length < 3) {
    console.error('错误: 参数不足');
    console.log('用法: /comment add <target> <author> <content>');
    return;
  }
  commentManager.addComment(params[0], params[1], params.slice(2).join(' '));
  console.log('\n✅ 评论添加成功\n');
}

function handleGet(target) {
  if (!target) {
    console.error('错误: 请提供目标');
    console.log('用法: /comment get <target>');
    return;
  }
  const comments = commentManager.getComments(target);
  if (comments.length === 0) {
    console.log('\n暂无评论\n');
    return;
  }
  console.log('\n💬 评论列表:\n');
  comments.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.author}: ${c.content}`);
    console.log(`     ${new Date(c.timestamp).toLocaleString('zh-CN')}`);
    console.log('');
  });
}

function handleDelete(id) {
  if (!id) {
    console.error('错误: 请提供评论ID');
    return;
  }
  commentManager.deleteComment(id);
  console.log('\n✅ 评论已删除\n');
}

function showHelp() {
  console.log(`
💬 评论管理 - 帮助

管理代码和文档评论。

子命令:
  /comment add <target> <author> <content>  添加评论
  /comment get <target>                    获取评论
  /comment delete <id>                      删除评论

示例:
  /comment add PR#123 张三 代码质量很好
  /comment get PR#123

文档: /comment help
`);
}
