/**
 * 布局管理器 - 界面布局和组件配置
 */

const fs = require('fs').promises;
const path = require('path');

class LayoutManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/layouts.json');
    this.layouts = [];
    this.activeLayoutId = null;
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.layouts = parsed.layouts || [];
      this.activeLayoutId = parsed.activeLayoutId || null;
    } catch (err) {
      this.layouts = [];
      this.activeLayoutId = null;
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify({ layouts: this.layouts, activeLayoutId: this.activeLayoutId }, null, 2));
  }

  add(name, components, description = '') {
    const layout = {
      id: Date.now().toString(),
      name,
      components, // [{ id, type, position, size, config }]
      description,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      isActive: false
    };
    this.layouts.push(layout);
    this.save();
    return layout;
  }

  get(id) {
    return this.layouts.find(l => l.id === id);
  }

  getAll() {
    return this.layouts;
  }

  getActive() {
    return this.get(this.activeLayoutId);
  }

  update(id, updates) {
    const index = this.layouts.findIndex(l => l.id === id);
    if (index !== -1) {
      this.layouts[index] = {
        ...this.layouts[index],
        ...updates
      };
      this.save();
      return this.layouts[index];
    }
    return null;
  }

  remove(id) {
    const index = this.layouts.findIndex(l => l.id === id);
    if (index !== -1) {
      if (this.activeLayoutId === id) {
        this.activeLayoutId = null;
      }
      const removed = this.layouts.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  setActive(id) {
    const layout = this.get(id);
    if (!layout) return null;

    // 取消之前的激活状态
    this.layouts.forEach(l => l.isActive = false);
    layout.isActive = true;
    layout.usageCount++;
    this.activeLayoutId = id;

    this.save();
    return layout;
  }

  addComponent(layoutId, component) {
    const layout = this.get(layoutId);
    if (!layout) return null;

    layout.components.push({
      ...component,
      id: component.id || `comp_${Date.now()}`
    });

    this.save();
    return layout;
  }

  removeComponent(layoutId, componentId) {
    const layout = this.get(layoutId);
    if (!layout) return null;

    const index = layout.components.findIndex(c => c.id === componentId);
    if (index !== -1) {
      layout.components.splice(index, 1);
      this.save();
    }

    return layout;
  }

  moveComponent(layoutId, componentId, newPosition) {
    const layout = this.get(layoutId);
    if (!layout) return null;

    const component = layout.components.find(c => c.id === componentId);
    if (component) {
      component.position = newPosition;
      this.save();
    }

    return layout;
  }

  resizeComponent(layoutId, componentId, newSize) {
    const layout = this.get(layoutId);
    if (!layout) return null;

    const component = layout.components.find(c => c.id === componentId);
    if (component) {
      component.size = newSize;
      this.save();
    }

    return layout;
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.layouts.filter(l =>
      l.name.toLowerCase().includes(lower) ||
      l.description.toLowerCase().includes(lower)
    );
  }

  getStats() {
    return {
      total: this.layouts.length,
      active: this.activeLayoutId ? 1 : 0,
      totalUsage: this.layouts.reduce((sum, l) => sum + l.usageCount, 0),
      totalComponents: this.layouts.reduce((sum, l) => sum + l.components.length, 0)
    };
  }
}

module.exports = LayoutManager;
