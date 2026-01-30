/**
 * API文档管理器
 */

const fs = require('fs').promises;
const path = require('path');

class ApiDocsManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/api-docs.json');
    this.apis = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.apis = JSON.parse(data);
    } catch (err) {
      this.apis = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.apis, null, 2));
  }

  add(name, method, path, description = '', config = {}) {
    const api = {
      id: Date.now().toString(),
      name,
      method, // 'GET', 'POST', 'PUT', 'DELETE', etc.
      path,
      description,
      config: {
        authRequired: false,
        rateLimit: 100,
        version: 'v1',
        tags: [],
        ...config
      },
      params: config.params || [],
      responses: config.responses || [],
      examples: config.examples || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.apis.push(api);
    this.save();
    return api;
  }

  get(id) {
    return this.apis.find(a => a.id === id);
  }

  getByName(name) {
    return this.apis.find(a => a.name === name);
  }

  getAll() {
    return this.apis;
  }

  getByMethod(method) {
    return this.apis.filter(a => a.method.toUpperCase() === method.toUpperCase());
  }

  update(id, updates) {
    const index = this.apis.findIndex(a => a.id === id);
    if (index !== -1) {
      this.apis[index] = {
        ...this.apis[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.apis[index];
    }
    return null;
  }

  remove(id) {
    const index = this.apis.findIndex(a => a.id === id);
    if (index !== -1) {
      const removed = this.apis.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.apis.filter(a =>
      a.name.toLowerCase().includes(lower) ||
      a.path.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower)
    );
  }

  exportOpenAPI() {
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0'
      },
      paths: {}
    };

    this.apis.forEach(api => {
      if (!openapi.paths[api.path]) {
        openapi.paths[api.path] = {};
      }

      openapi.paths[api.path][api.method.toLowerCase()] = {
        summary: api.name,
        description: api.description,
        tags: api.config.tags,
        parameters: api.params,
        responses: {
          '200': {
            description: 'Success'
          }
        }
      };
    });

    return openapi;
  }

  getStats() {
    return {
      total: this.apis.length,
      byMethod: {
        GET: this.apis.filter(a => a.method === 'GET').length,
        POST: this.apis.filter(a => a.method === 'POST').length,
        PUT: this.apis.filter(a => a.method === 'PUT').length,
        DELETE: this.apis.filter(a => a.method === 'DELETE').length
      }
    };
  }
}

module.exports = ApiDocsManager;
