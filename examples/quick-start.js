#!/usr/bin/env node
/**
 * xzChat Quick Start Example
 *
 * This example demonstrates the basic usage of xzChat
 */

import { ChatEngine } from '../lib/core/chat-engine.js';
import { ConfigManager } from '../lib/core/config.js';

console.log('🚀 xzChat Quick Start Example\n');

// Example 1: Initialize configuration
console.log('📝 Step 1: Initialize configuration');
const config = new ConfigManager();
console.log('✅ Configuration loaded');

// Example 2: Start a simple chat session
console.log('\n🤖 Step 2: Start chat session');
const chat = new ChatEngine(config);

// Example 3: Send a message
console.log('\n💬 Step 3: Send a message to AI');
chat.sendMessage('Hello! Can you help me understand how to use xzChat?')
  .then(response => {
    console.log('📤 AI Response:');
    console.log(response.content);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });

// Example 4: Use Git integration
console.log('\n🔧 Step 4: Git integration');
console.log('You can use commands like:');
console.log('  - /commit: Generate commit message');
console.log('  - /review: Review staged changes');
console.log('  - /git log: View commit history');

// Example 5: Use RAG
console.log('\n🧠 Step 5: RAG knowledge base');
console.log('You can use commands like:');
console.log('  - /rag index: Build code index');
console.log('  - /rag search: Search in code');
console.log('  - /scan: Scan project structure');

// Example 6: Use plugins
console.log('\n🔌 Step 6: Plugin system');
console.log('Available commands:');
console.log('  - /plugin list: List all plugins');
console.log('  - /plugin load <name>: Load a plugin');
console.log('  - /plugin validate <name>: Validate plugin quality');

// Example 7: Session management
console.log('\n📁 Step 7: Session management');
console.log('Available commands:');
console.log('  - /session list: List all sessions');
console.log('  - /session new <name>: Create new session');
console.log('  - /session clone <src> <tgt>: Clone session');

// Example 8: Branch system
console.log('\n🌳 Step 8: Branch system');
console.log('Available commands:');
console.log('  - /branch create <desc>: Create conversation branch');
console.log('  - /branch list: List all branches');
console.log('  - /branch merge <src> <dst>: Merge branches');

console.log('\n✨ For more information, run: xzchat --help');
console.log('📚 Documentation: https://github.com/zhou0928/xzchat#readme\n');
