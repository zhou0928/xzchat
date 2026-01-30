/**
 * 工作管道管理器 - 自动化流程和流水线
 */

const fs = require('fs').promises;
const path = require('path');

class PipelineManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/pipelines.json');
    this.pipelines = [];
    this.runs = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.pipelines = parsed.pipelines || [];
      this.runs = parsed.runs || [];
    } catch (err) {
      this.pipelines = [];
      this.runs = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify({ pipelines: this.pipelines, runs: this.runs }, null, 2));
  }

  add(name, stages, description = '', trigger = 'manual') {
    const pipeline = {
      id: Date.now().toString(),
      name,
      stages, // [{ id, name, type, config, timeout }]
      description,
      trigger, // 'manual', 'webhook', 'schedule'
      status: 'active',
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      runCount: 0,
      successCount: 0,
      failureCount: 0
    };
    this.pipelines.push(pipeline);
    this.save();
    return pipeline;
  }

  get(id) {
    return this.pipelines.find(p => p.id === id);
  }

  getAll() {
    return this.pipelines;
  }

  getByStatus(status) {
    return this.pipelines.filter(p => p.status === status);
  }

  update(id, updates) {
    const index = this.pipelines.findIndex(p => p.id === id);
    if (index !== -1) {
      this.pipelines[index] = {
        ...this.pipelines[index],
        ...updates
      };
      this.save();
      return this.pipelines[index];
    }
    return null;
  }

  remove(id) {
    const index = this.pipelines.findIndex(p => p.id === id);
    if (index !== -1) {
      const removed = this.pipelines.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  async run(id, inputs = {}) {
    const pipeline = this.get(id);
    if (!pipeline) return { success: false, message: '流水线不存在' };

    const run = {
      id: Date.now().toString(),
      pipelineId: id,
      pipelineName: pipeline.name,
      status: 'running',
      inputs,
      outputs: {},
      stages: pipeline.stages.map(s => ({
        id: s.id,
        name: s.name,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        output: null,
        error: null
      })),
      startedAt: new Date().toISOString(),
      completedAt: null,
      duration: null
    };

    this.runs.push(run);
    await this.save();

    // 执行流水线
    try {
      for (const stage of pipeline.stages) {
        const stageRun = run.stages.find(s => s.id === stage.id);
        stageRun.status = 'running';
        stageRun.startedAt = new Date().toISOString();
        await this.save();

        // 模拟执行阶段
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

        stageRun.status = 'completed';
        stageRun.completedAt = new Date().toISOString();
        stageRun.output = { success: true, data: {} };
        run.outputs[stage.id] = stageRun.output;
        await this.save();
      }

      run.status = 'success';
      run.completedAt = new Date().toISOString();
      run.duration = new Date(run.completedAt) - new Date(run.startedAt);
    } catch (err) {
      run.status = 'failed';
      run.completedAt = new Date().toISOString();
      run.duration = new Date(run.completedAt) - new Date(run.startedAt);
      run.error = err.message;
    }

    // 更新流水线统计
    pipeline.lastRunAt = run.completedAt;
    pipeline.runCount++;
    if (run.status === 'success') {
      pipeline.successCount++;
    } else {
      pipeline.failureCount++;
    }

    await this.save();

    return {
      success: true,
      message: `流水线 "${pipeline.name}" ${run.status === 'success' ? '执行成功' : '执行失败'}`,
      data: run
    };
  }

  getRuns(pipelineId = null, limit = 20) {
    let runs = pipelineId
      ? this.runs.filter(r => r.pipelineId === pipelineId)
      : this.runs;
    return runs.slice(-limit).reverse();
  }

  getRun(id) {
    return this.runs.find(r => r.id === id);
  }

  cancelRun(id) {
    const run = this.getRun(id);
    if (!run) return { success: false, message: '运行记录不存在' };

    if (run.status === 'completed') {
      return { success: false, message: '运行已完成，无法取消' };
    }

    run.status = 'cancelled';
    run.completedAt = new Date().toISOString();
    run.duration = new Date(run.completedAt) - new Date(run.startedAt);

    this.save();
    return { success: true, message: '运行已取消' };
  }

  getStats() {
    return {
      total: this.pipelines.length,
      active: this.pipelines.filter(p => p.status === 'active').length,
      totalRuns: this.runs.length,
      byStatus: {
        success: this.runs.filter(r => r.status === 'success').length,
        failed: this.runs.filter(r => r.status === 'failed').length,
        cancelled: this.runs.filter(r => r.status === 'cancelled').length,
        running: this.runs.filter(r => r.status === 'running').length
      },
      avgDuration: this.runs.length > 0
        ? Math.floor(this.runs.reduce((sum, r) => sum + (r.duration || 0), 0) / this.runs.length)
        : 0
    };
  }
}

module.exports = PipelineManager;
