#!/usr/bin/env node
/**
 * xzChat Plugin Example
 *
 * This is a simple example plugin for xzChat
 * demonstrating the plugin system architecture.
 */

export default {
  // Plugin metadata
  metadata: {
    name: 'example-plugin',
    version: '1.0.0',
    author: 'xzChat Team',
    description: 'Example plugin demonstrating xzChat plugin system',
    license: 'MIT',
    keywords: ['example', 'demo', 'tutorial'],
    category: 'examples',
    minAppVersion: '2.0.0',
    maxAppVersion: '3.0.0'
  },

  // Plugin initialization
  init(engine) {
    console.log(`[${this.metadata.name}] Plugin initialized`);

    // Register commands
    this.registerCommands(engine);
  },

  // Register plugin commands
  registerCommands(engine) {
    engine.registerCommand('hello', {
      description: 'Say hello from the plugin',
      usage: '/hello [name]',
      handler: this.helloCommand.bind(this)
    });

    engine.registerCommand('count', {
      description: 'Count words in a message',
      usage: '/count <text>',
      handler: this.countCommand.bind(this)
    });
  },

  // Command: hello
  helloCommand(args, context) {
    const name = args[0] || 'World';
    return `Hello, ${name}! This is from the ${this.metadata.name} plugin.`;
  },

  // Command: count
  countCommand(args, context) {
    const text = args.join(' ');
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    return `Word count: ${wordCount}`;
  },

  // Plugin cleanup
  cleanup() {
    console.log(`[${this.metadata.name}] Plugin cleaned up`);
  },

  // Plugin settings (optional)
  settings: {
    enabled: true,
    config: {
      greeting: 'Hello'
    }
  }
};

// Export plugin metadata separately for validation
export const metadata = {
  name: 'example-plugin',
  version: '1.0.0',
  author: 'xzChat Team',
  description: 'Example plugin demonstrating xzChat plugin system',
  license: 'MIT',
  keywords: ['example', 'demo', 'tutorial'],
  category: 'examples',
  minAppVersion: '2.0.0',
  maxAppVersion: '3.0.0'
};
