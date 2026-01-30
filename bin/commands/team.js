import { TeamManager } from '../../lib/utils/team.js';

const teamManager = new TeamManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'add-member':
        handleAddMember(params);
        break;
      case 'list-members':
        handleListMembers();
        break;
      case 'add-project':
        handleAddProject(params);
        break;
      case 'list-projects':
        handleListProjects();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`团队操作失败: ${error.message}`);
  }
};

function handleAddMember(params) {
  if (params.length < 2) {
    console.error('错误: 请提供姓名和邮箱');
    console.log('用法: /team add-member <name> <email> [role]');
    return;
  }
  teamManager.addMember(params[0], params[1], params[2] || '成员');
  console.log('\n✅ 成员添加成功\n');
}

function handleListMembers() {
  const members = teamManager.listMembers();
  console.log('\n👥 团队成员:\n');
  members.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name}`);
    console.log(`     邮箱: ${m.email}`);
    console.log(`     角色: ${m.role}`);
    console.log('');
  });
}

function handleAddProject(params) {
  if (params.length < 2) {
    console.error('错误: 请提供项目名称和描述');
    console.log('用法: /team add-project <name> <description>');
    return;
  }
  teamManager.addProject(params[0], params[1]);
  console.log('\n✅ 项目添加成功\n');
}

function handleListProjects() {
  const projects = teamManager.listProjects();
  console.log('\n📁 团队项目:\n');
  projects.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     描述: ${p.description}`);
    console.log('');
  });
}

function showHelp() {
  console.log(`
👥 团队管理 - 帮助

管理团队成员和项目。

子命令:
  /team add-member <name> <email> [role]    添加成员
  /team list-members                       列出成员
  /team add-project <name> <description>    添加项目
  /team list-projects                      列出项目

示例:
  /team add-member 张三 zhangsan@example.com 前端开发
  /team add-project xzChat "AI聊天工具"
  /team list-members

文档: /team help
`);
}
