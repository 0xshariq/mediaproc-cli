#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PluginManager } from './plugin-manager.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { pluginsCommand } from './commands/plugins.js';
import { helpCommand } from './commands/help.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { runCommand } from './commands/run.js';
import { validateCommand } from './commands/validate.js';
import { convertCommand } from './commands/convert.js';
import { infoCommand } from './commands/info.js';
import { optimizeCommand } from './commands/optimize.js';

const program = new Command();
const pluginManager = new PluginManager();

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

export async function cli(): Promise<void> {
  program
    .name('mediaproc')
    .description('Modern, plugin-based media processing CLI')
    .version(packageJson.version);

  // Plugin management commands
  addCommand(program, pluginManager);
  removeCommand(program, pluginManager);
  listCommand(program, pluginManager);
  pluginsCommand(program, pluginManager);
  helpCommand(program);
  
  // Project management commands
  initCommand(program);
  configCommand(program);
  
  // Universal commands (work without plugins)
  convertCommand(program);
  infoCommand(program);
  optimizeCommand(program);
  
  // Utility commands
  runCommand(program);
  validateCommand(program);

  // Load and register all installed plugins
  try {
    await pluginManager.loadPlugins(program);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('Error loading plugins:'), errorMessage);
  }

  // Parse arguments
  program.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// Run CLI if this is the main module
cli().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
