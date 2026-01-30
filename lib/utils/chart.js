/**
 * 数据可视化工具
 */

class ChartGenerator {
  /**
   * 生成柱状图（ASCII）
   */
  static barChart(data, options = {}) {
    const { width = 60, height = 20, title = '' } = options;
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values, 1);

    let output = title ? `${title}\n${'─'.repeat(width)}\n` : '';

    // 生成图表
    for (let i = height - 1; i >= 0; i--) {
      const threshold = (i + 1) * maxValue / height;
      let line = `${Math.round(threshold).toString().padStart(6)} │`;

      values.forEach((v, idx) => {
        const barLength = Math.floor((v / maxValue) * (width - 15));
        const fill = v >= threshold ? '█' : ' ';
        line += `${fill.repeat(barLength)} `;
      });
      output += line + '\n';
    }

    // 底线
    output += '       └' + '─'.repeat(width - 10) + '\n';

    // 标签
    let labelLine = '         ';
    labels.forEach(label => {
      const labelText = label.substring(0, Math.floor((width - 15) / values.length));
      labelLine += labelText.padEnd(Math.floor((width - 15) / values.length) + 1);
    });
    output += labelLine + '\n';

    return output;
  }

  /**
   * 生成折线图（ASCII）
   */
  static lineChart(data, options = {}) {
    const { width = 60, height = 20, title = '' } = options;
    const values = data.map(d => d.value);
    const labels = data.map(d => d.label);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    let output = title ? `${title}\n${'─'.repeat(width)}\n` : '';

    const grid = Array(height).fill(null).map(() => Array(width - 10).fill(' '));

    // 绘制折线
    for (let i = 0; i < values.length; i++) {
      const x = Math.floor(i * (width - 10) / values.length);
      const y = Math.floor((values[i] - minValue) / range * (height - 1));
      if (y >= 0 && y < height && x >= 0 && x < width - 10) {
        grid[height - 1 - y][x] = '●';
      }
    }

    // 绘制网格
    for (let i = 0; i < height; i++) {
      const value = minValue + (i * range / (height - 1));
      let line = `${value.toFixed(1).padStart(5)} │`;
      line += grid[i].join('');
      output += line + '\n';
    }

    output += '       └' + '─'.repeat(width - 10) + '\n';

    return output;
  }

  /**
   * 生成饼图（ASCII）
   */
  static pieChart(data, options = {}) {
    const { title = '' } = options;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    let output = title ? `${title}\n${'─'.repeat(40)}\n` : '';

    const symbols = ['█', '▓', '▒', '░', '●', '○', '◆', '◇'];
    let pos = 0;
    let angle = 0;

    data.forEach((item, index) => {
      const percentage = (item.value / total * 100).toFixed(1);
      const symbol = symbols[index % symbols.length];

      output += `${symbol} ${item.label.padEnd(15)} ${percentage}%\n`;
    });

    return output;
  }

  /**
   * 生成表格
   */
  static table(headers, rows, options = {}) {
    const { maxWidth = 30 } = options;
    const colWidths = headers.map((h, i) => {
      const maxRowWidth = Math.max(...rows.map(r => String(r[i] || '').length));
      return Math.min(Math.max(h.length, maxRowWidth), maxWidth);
    });

    let output = '';

    // 表头
    output += '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐\n';
    output += '│' + headers.map((h, i) => ` ${h.padEnd(colWidths[i])} │`).join('') + '\n';
    output += '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┤\n';

    // 数据行
    rows.forEach(row => {
      output += '│' + row.map((cell, i) => {
        let text = String(cell || '');
        if (text.length > colWidths[i]) text = text.substring(0, colWidths[i] - 3) + '...';
        return ` ${text.padEnd(colWidths[i])} │`;
      }).join('') + '\n';
    });

    output += '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┐\n';

    return output;
  }

  /**
   * 生成进度条
   */
  static progressBar(value, max, options = {}) {
    const { width = 40, label = '', showPercent = true } = options;
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const filled = Math.floor((percent / 100) * width);
    const empty = width - filled;

    let bar = '█'.repeat(filled) + '░'.repeat(empty);
    if (label) bar = `${label} [${bar}]`;
    if (showPercent) bar += ` ${percent.toFixed(1)}%`;

    return bar;
  }

  /**
   * 生成直方图
   */
  static histogram(data, options = {}) {
    const { bins = 10, title = '' } = options;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const binSize = range / bins;

    const binsArray = Array(bins).fill(0);
    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      binsArray[binIndex]++;
    });

    const maxBin = Math.max(...binsArray, 1);
    let output = title ? `${title}\n` : '';

    for (let i = 0; i < bins; i++) {
      const binMin = (min + i * binSize).toFixed(2);
      const binMax = (min + (i + 1) * binSize).toFixed(2);
      const barLength = Math.floor((binsArray[i] / maxBin) * 40);
      output += `${binMin} - ${binMax}: ${'█'.repeat(barLength)} (${binsArray[i]})\n`;
    }

    return output;
  }
}

export default ChartGenerator;
export { ChartGenerator };
