import ChartGenerator from '../../lib/utils/chart.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'chart';
export const aliases = ['图表'];
export const description = '数据可视化';

export async function handle(args, context) {
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'bar': return await handleBar(params);
      case 'line': return await handleLine(params);
      case 'pie': return await handlePie(params);
      case 'table': return await handleTable(params);
      case 'progress': return await handleProgress(params);
      case 'histogram': return await handleHistogram(params);
      case 'demo': return showDemo();
      case 'help': default: return showHelp();
    }
  } catch (error) {
    context.logger?.error(`错误: ${error.message}`);
    return null;
  }
}

async function handleBar(params) {
  const data = parseData(params);
  if (!data || data.length < 1) { console.log(colorize.error('用法: /chart bar "label1:value1,label2:value2"')); return; }
  console.log(colorize.info('📊 柱状图\n'));
  console.log(ChartGenerator.barChart(data));
}

async function handleLine(params) {
  const data = parseData(params);
  if (!data || data.length < 1) { console.log(colorize.error('用法: /chart line "label1:value1,label2:value2"')); return; }
  console.log(colorize.info('📈 折线图\n'));
  console.log(ChartGenerator.lineChart(data));
}

async function handlePie(params) {
  const data = parseData(params);
  if (!data || data.length < 1) { console.log(colorize.error('用法: /chart pie "label1:value1,label2:value2"')); return; }
  console.log(colorize.info('🥧 饼图\n'));
  console.log(ChartGenerator.pieChart(data));
}

async function handleTable(params) {
  if (params.length < 2) { console.log(colorize.error('用法: /chart table "col1,col2,col3" "val1,val2,val3"')); return; }
  const headers = params[0].split(',');
  const rows = params.slice(1).map(p => p.split(','));
  console.log(colorize.info('📋 表格\n'));
  console.log(ChartGenerator.table(headers, rows));
}

async function handleProgress(params) {
  if (params.length < 2) { console.log(colorize.error('用法: /chart progress <value> <max> [label]')); return; }
  const [value, max, label = 'Progress'] = params;
  console.log(ChartGenerator.progressBar(parseInt(value), parseInt(max), { label }));
}

async function handleHistogram(params) {
  const values = params[0].split(',').map(v => parseFloat(v.trim()));
  if (values.some(isNaN)) { console.log(colorize.error('无效的数值')); return; }
  console.log(colorize.info('📊 直方图\n'));
  console.log(ChartGenerator.histogram(values));
}

function parseData(params) {
  if (!params[0]) return null;
  return params[0].split(',').map(item => {
    const [label, value] = item.split(':');
    return { label: label?.trim() || '', value: parseFloat(value) || 0 };
  }).filter(d => d.label);
}

function showDemo() {
  console.log(colorize.header('📊 数据可视化演示\n'));

  console.log(colorize.info('柱状图:'));
  console.log(ChartGenerator.barChart([
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 59 },
    { label: 'Mar', value: 80 },
    { label: 'Apr', value: 81 },
    { label: 'May', value: 56 },
    { label: 'Jun', value: 55 }
  ], { title: 'Monthly Sales', width: 50, height: 10 }));

  console.log('\n' + colorize.info('饼图:'));
  console.log(ChartGenerator.pieChart([
    { label: 'React', value: 45 },
    { label: 'Vue', value: 25 },
    { label: 'Angular', value: 15 },
    { label: 'Other', value: 15 }
  ], { title: 'Framework Usage' }));

  console.log('\n' + colorize.info('表格:'));
  console.log(ChartGenerator.table(
    ['Name', 'Age', 'Score'],
    [['Alice', '25', '95'], ['Bob', '30', '88'], ['Charlie', '28', '92']]
  ));

  console.log('\n' + colorize.info('进度条:'));
  console.log(ChartGenerator.progressBar(75, 100, { label: 'Upload' }));
}

function showHelp() {
  console.log(`
${colorize.header('📊 数据可视化 (Chart)')}
${colorize.info('用法:')}
  /chart bar "data"               柱状图
  /chart line "data"              折线图
  /chart pie "data"               饼图
  /chart table "cols" "rows..."   表格
  /chart progress <val> <max>     进度条
  /chart histogram "vals"         直方图
  /chart demo                     演示所有图表

${colorize.info('数据格式:')}
  "label1:value1,label2:value2,..."

${colorize.info('示例:')}
  /chart bar "Jan:65,Feb:59,Mar:80"
  /chart pie "React:45,Vue:25,Angular:15"
  /chart table "Name,Age,Score" "Alice,25,95" "Bob,30,88"
  /chart progress 75 100
  /chart demo
`);
}

export default { command, aliases, description, handle };
