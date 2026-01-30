#!/usr/bin/env node
/**
 * Chat Session Example
 *
 * This example shows how to create and manage chat sessions
 */

import { SessionManager } from '../lib/core/session-manager.js';
import { ConfigManager } from '../lib/core/config.js';

console.log('🎭 Chat Session Example\n');

// Initialize
const config = new ConfigManager();
const sessionManager = new SessionManager(config);

// Example 1: Create a new session
console.log('📝 Step 1: Create a new session');
const session = sessionManager.createSession('demo-session');
console.log('✅ Session created:', session.id);

// Example 2: Add messages to session
console.log('\n💬 Step 2: Add messages to session');
session.addMessage({
  role: 'user',
  content: 'Hello, how are you?'
});

session.addMessage({
  role: 'assistant',
  content: 'I am doing great! How can I help you today?'
});

console.log('✅ Messages added:', session.messages.length);

// Example 3: Search within session
console.log('\n🔍 Step 3: Search within session');
const searchResults = session.search('help');
console.log('✅ Found', searchResults.length, 'messages containing "help"');

// Example 4: Clone session
console.log('\n📋 Step 4: Clone session');
const clonedSession = sessionManager.cloneSession(session.id, 'cloned-session');
console.log('✅ Session cloned:', clonedSession.id);

// Example 5: List all sessions
console.log('\n📁 Step 5: List all sessions');
const allSessions = sessionManager.listSessions();
console.log('✅ Total sessions:', allSessions.length);

// Example 6: Switch sessions
console.log('\n🔄 Step 6: Switch to another session');
const currentSession = sessionManager.useSession(clonedSession.id);
console.log('✅ Current session:', currentSession.id);

// Example 7: Delete session
console.log('\n🗑️ Step 7: Delete session');
sessionManager.deleteSession(session.id);
console.log('✅ Session deleted');

console.log('\n✨ Session management is powerful!');
console.log('💡 Tip: Use /session commands in xzChat for session management\n');
