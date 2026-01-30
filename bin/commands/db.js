import { DatabaseHelper } from "../../lib/utils/db.js";

/**
 * 数据库工具
 * SQL查询辅助和数据模型设计
 */

const dbHelper = new DatabaseHelper();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'query':
        await handleQuery(params[0]);
        break;

      case 'model':
        await handleModel(params[0], params[1]);
        break;

      case 'migration':
        await handleMigration(params[0], params[1]);
        break;

      case 'schema':
        await handleSchema(params[0]);
        break;

      case 'validate':
        await handleValidate(params[0]);
        break;

      case 'history':
        await handleHistory(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`数据库操作失败: ${error.message}`);
  }
};

async function handleQuery(sql) {
  const result = dbHelper.analyzeQuery(sql || '');

  console.log(`\n💾 SQL 分析\n`);
  console.log(`类型: ${result.type}`);
  console.log(`复杂度: ${result.complexity}`);
  console.log(`建议:\n`);

  result.suggestions.forEach(s => console.log(`  - ${s}`));
  console.log('');
}

async function handleModel(name, fields) {
  if (!name) {
    console.error('错误: 请提供模型名称');
    return;
  }

  const result = dbHelper.generateModel(name, fields);

  console.log(`\n📊 模型定义: ${name}\n`);
  console.log(result.schema);
  console.log(`\n生成的代码:\n${result.code}\n`);
}

async function handleMigration(action, table) {
  const result = dbHelper.generateMigration(action, table);

  console.log(`\n🔄 迁移脚本\n`);
  console.log(result.script);
  console.log('');
}

async function handleSchema(file) {
  if (!file) {
    console.error('错误: 请提供文件路径');
    return;
  }

  const result = await dbHelper.analyzeSchema(file);

  console.log(`\n📐 数据库架构分析\n`);
  console.log(`表数量: ${result.tables}`);
  console.log(`关系: ${result.relations}`);
  console.log(`索引: ${result.indexes}`);
  console.log('');
}

async function handleValidate(sql) {
  const result = dbHelper.validateQuery(sql || '');

  console.log(`\n✅ SQL 验证\n`);

  if (result.valid) {
    console.log('查询有效');
  } else {
    console.log('查询无效');
    console.log('错误:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log('');
}

async function handleHistory(limit) {
  const history = dbHelper.getHistory(parseInt(limit) || 10);

  console.log(`\n📜 操作历史\n`);
  history.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.timestamp}`);
    console.log(`     ${h.type}: ${h.sql}\n`);
  });
}

function showHelp() {
  console.log(`
💾 数据库工具 - 帮助

SQL查询辅助和数据模型设计。

子命令:
  /db query <sql>                分析SQL查询
  /db model <name> [fields]      生成数据模型
  /db migration <action> <table>  生成迁移脚本
  /db schema <file>               分析数据库架构
  /db validate <sql>              验证SQL
  /db history [limit]             查看历史

示例:
  /db query "SELECT * FROM users"
  /db model User "name:string,age:int"
  /db migration create users
  /db validate "SELECT * FROM"
`);
}
