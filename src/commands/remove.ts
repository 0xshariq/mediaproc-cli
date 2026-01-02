import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import type { PluginManager } from '../plugin-manager.js';

export function removeCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('remove <plugin>')
    .alias('rm')
    .description('Uninstall a mediaproc plugin')
    .option('-g, --global', 'Uninstall plugin globally')
    .action(async (plugin: string, options: { global?: boolean }) => {
      const spinner = ora(`Removing ${chalk.cyan(plugin)}...`).start();

      try {
        // Ensure plugin name starts with @mediaproc/
        const pluginName = plugin.startsWith('@mediaproc/') 
          ? plugin 
          : `@mediaproc/${plugin}`;

        // Check if plugin is built-in (cannot be removed)
        const pluginInstance = pluginManager.getPlugin(pluginName);
        if (pluginInstance?.isBuiltIn) {
          spinner.fail(chalk.red(`Cannot remove built-in plugin: ${pluginName}`));
          console.log(chalk.dim('Built-in plugins are part of the core CLI and cannot be removed'));
          process.exit(1);
        }

        // Check if plugin is currently loaded
        const wasLoaded = pluginManager.isPluginLoaded(pluginName);
        if (wasLoaded) {
          spinner.info(chalk.dim(`Unloading plugin ${pluginName}...`));
          pluginManager.unloadPlugin(pluginName);
          spinner.start(`Removing ${chalk.cyan(pluginName)}...`);
        }

        // Determine package manager (prefer pnpm, fallback to npm)
        let packageManager = 'pnpm';
        try {
          await execa('pnpm', ['--version'], { stdio: 'pipe' });
        } catch {
          packageManager = 'npm';
        }

        // Build uninstall command
        const args: string[] = [];
        if (packageManager === 'pnpm') {
          args.push('remove');
          if (options.global) args.push('-g');
        } else {
          args.push('uninstall');
          if (options.global) args.push('-g');
        }
        args.push(pluginName);
        
        await execa(packageManager, args, {
          stdio: 'pipe'
        });

        spinner.succeed(chalk.green(`✓ Successfully removed ${pluginName}`));
        
        if (wasLoaded) {
          console.log(chalk.green('✓ Plugin unloaded and cleaned up'));
        }
        
        console.log(chalk.dim('\nPlugin has been completely removed'));
        console.log(chalk.dim('View remaining plugins: ') + chalk.white('mediaproc list'));

      } catch (error) {
        spinner.fail(chalk.red(`Failed to remove ${plugin}`));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
