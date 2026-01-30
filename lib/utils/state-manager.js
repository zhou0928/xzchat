import { EventEmitter } from "node:events";

/**
 * 状态管理器 - 统一管理应用状态
 */
class StateManager extends EventEmitter {
  constructor() {
    super();

    // 输入模式
    this._inputMode = 'chat';

    // 粘贴缓冲区
    this._pasteBuffer = [];

    // 处理状态
    this._isProcessing = false;

    // TTS 状态
    this._ttsEnabled = false;

    // 当前会话
    this._currentSession = 'default';

    // 消息历史
    this._messages = [];

    // 中止控制器
    this._abortController = null;

    // 用户配置
    this._userConfig = {};

    // 激活的配置
    this._activeConfig = {};

    // MCP 客户端
    this._mcpClients = new Map();
  }

  // -------------------------------------------------------------------------
  // 输入模式
  // -------------------------------------------------------------------------

  get inputMode() {
    return this._inputMode;
  }

  set inputMode(mode) {
    const oldMode = this._inputMode;
    this._inputMode = mode;
    this.emit('inputModeChanged', { oldMode, newMode: mode });
  }

  // -------------------------------------------------------------------------
  // 粘贴缓冲区
  // -------------------------------------------------------------------------

  get pasteBuffer() {
    return this._pasteBuffer;
  }

  addToPasteBuffer(content) {
    this._pasteBuffer.push(content);
  }

  clearPasteBuffer() {
    this._pasteBuffer = [];
  }

  // -------------------------------------------------------------------------
  // 处理状态
  // -------------------------------------------------------------------------

  get isProcessing() {
    return this._isProcessing;
  }

  set isProcessing(processing) {
    const oldState = this._isProcessing;
    this._isProcessing = processing;
    this.emit('processingChanged', { oldState, newState: processing });
  }

  // -------------------------------------------------------------------------
  // TTS 状态
  // -------------------------------------------------------------------------

  get ttsEnabled() {
    return this._ttsEnabled;
  }

  set ttsEnabled(enabled) {
    const oldState = this._ttsEnabled;
    this._ttsEnabled = enabled;
    this.emit('ttsChanged', { oldState, newState: enabled });
  }

  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    return this._ttsEnabled;
  }

  // -------------------------------------------------------------------------
  // 会话管理
  // -------------------------------------------------------------------------

  get currentSession() {
    return this._currentSession;
  }

  set currentSession(session) {
    const oldSession = this._currentSession;
    this._currentSession = session;
    this.emit('sessionChanged', { oldSession, newSession: session });
  }

  // -------------------------------------------------------------------------
  // 消息历史
  // -------------------------------------------------------------------------

  get messages() {
    return this._messages;
  }

  set messages(messages) {
    this._messages = messages;
  }

  addMessage(message) {
    this._messages.push(message);
    this.emit('messageAdded', message);
  }

  clearMessages() {
    this._messages = [];
    this.emit('messagesCleared');
  }

  // -------------------------------------------------------------------------
  // 中止控制器
  // -------------------------------------------------------------------------

  get abortController() {
    return this._abortController;
  }

  createAbortController() {
    this._abortController = new AbortController();
    this.emit('abortControllerCreated', this._abortController);
    return this._abortController;
  }

  abortCurrentRequest(reason) {
    if (this._abortController) {
      this._abortController.abort(reason);
      this._abortController = null;
      this.emit('requestAborted', reason);
    }
  }

  // -------------------------------------------------------------------------
  // 配置
  // -------------------------------------------------------------------------

  get userConfig() {
    return this._userConfig;
  }

  set userConfig(config) {
    this._userConfig = config;
    this.emit('configChanged', config);
  }

  get activeConfig() {
    return this._activeConfig;
  }

  set activeConfig(config) {
    this._activeConfig = config;
    this.emit('activeConfigChanged', config);
  }

  // -------------------------------------------------------------------------
  // MCP 客户端
  // -------------------------------------------------------------------------

  get mcpClients() {
    return this._mcpClients;
  }

  addMCPClient(name, client) {
    this._mcpClients.set(name, client);
    this.emit('mcpClientAdded', { name, client });
  }

  removeMCPClient(name) {
    const client = this._mcpClients.get(name);
    this._mcpClients.delete(name);
    this.emit('mcpClientRemoved', { name, client });
  }

  getMCPClient(name) {
    return this._mcpClients.get(name);
  }

  // -------------------------------------------------------------------------
  // 批量更新
  // -------------------------------------------------------------------------

  update(updates) {
    const changes = {};

    for (const [key, value] of Object.entries(updates)) {
      if (this[`_${key}`] !== undefined) {
        changes[key] = { old: this[`_${key}`], new: value };
        this[`_${key}`] = value;
      }
    }

    this.emit('stateUpdated', changes);
    return changes;
  }

  // -------------------------------------------------------------------------
  // 状态快照
  // -------------------------------------------------------------------------

  snapshot() {
    return {
      inputMode: this._inputMode,
      pasteBuffer: [...this._pasteBuffer],
      isProcessing: this._isProcessing,
      ttsEnabled: this._ttsEnabled,
      currentSession: this._currentSession,
      messagesLength: this._messages.length,
      userConfig: { ...this._userConfig },
      activeConfig: { ...this._activeConfig },
      mcpClientsCount: this._mcpClients.size
    };
  }

  // -------------------------------------------------------------------------
  // 重置
  // -------------------------------------------------------------------------

  reset(keys = []) {
    if (keys.length === 0) {
      // 重置所有状态
      this._inputMode = 'chat';
      this._pasteBuffer = [];
      this._isProcessing = false;
      this._ttsEnabled = false;
      this._currentSession = 'default';
      this._messages = [];
      this._abortController = null;
      this._mcpClients.clear();
    } else {
      // 重置指定状态
      for (const key of keys) {
        if (key === 'inputMode') this._inputMode = 'chat';
        if (key === 'pasteBuffer') this._pasteBuffer = [];
        if (key === 'isProcessing') this._isProcessing = false;
        if (key === 'ttsEnabled') this._ttsEnabled = false;
        if (key === 'messages') this._messages = [];
        if (key === 'abortController') this._abortController = null;
        if (key === 'mcpClients') this._mcpClients.clear();
      }
    }

    this.emit('stateReset', keys.length > 0 ? keys : 'all');
  }
}

/**
 * 创建全局状态管理器实例
 */
export const stateManager = new StateManager();

export default StateManager;
