import { Command } from 'commander';
import chalk from 'chalk';
import type { PluginManager } from '../plugin-manager.js';

export function listCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('list')
    .alias('ls')
    .description('List all installed mediaproc plugins')
    .action(() => {
      const plugins = pluginManager.getLoadedPlugins();

      if (plugins.length === 0) {
        console.log(chalk.yellow('No plugins installed yet'));
        console.log(chalk.dim('\n💡 Get started by installing a plugin:'));
        console.log(chalk.cyan('  mediaproc add image') + chalk.dim('    # Image processing'));
        console.log(chalk.cyan('  mediaproc add video') + chalk.dim('    # Video processing'));
        console.log(chalk.cyan('  mediaproc add audio') + chalk.dim('    # Audio processing'));
        console.log(chalk.dim('\nView all available plugins: mediaproc plugins'));
        return;
      }

      // Separate official and third-party plugins
      const official = plugins.filter(p => pluginManager.isOfficialPlugin(p));
      const thirdParty = plugins.filter(p => !pluginManager.isOfficialPlugin(p));

      // Show official plugins
      if (official.length > 0) {
        console.log(chalk.bold('\n✨ Official Plugins:\n'));
        
        official.forEach((pluginName, index) => {
          const shortName = pluginName.replace('@mediaproc/', '');
          const plugin = pluginManager.getPlugin(pluginName);
          
          console.log(`${chalk.green('✓')} ${chalk.cyan(shortName)} ${chalk.dim(`(${pluginName})`)} ${chalk.blue('★ OFFICIAL')}`);
          
          if (plugin) {
            console.log(chalk.dim(`  Version: ${plugin.version || 'unknown'}`));
          }
          
          if (index < official.length - 1) {
            console.log('');
          }
        });
      }

      // Show third-party plugins
      if (thirdParty.length > 0) {
        console.log(chalk.bold('\n🔌 Third-Party Plugins:\n'));
        
        thirdParty.forEach((pluginName, index) => {
          const shortName = pluginName.replace('@mediaproc/', '');
          const plugin = pluginManager.getPlugin(pluginName);
          
          console.log(`${chalk.green('✓')} ${chalk.cyan(shortName)} ${chalk.dim(`(${pluginName})`)}`);
          
          if (plugin) {
            console.log(chalk.dim(`  Version: ${plugin.version || 'unknown'}`));
          }
          
          if (index < thirdParty.length - 1) {
            console.log('');
          }
        });
      }

      console.log(chalk.dim('\n💡 Install more plugins: mediaproc add <plugin-name>'));
      console.log(chalk.dim('   Remove plugins: mediaproc remove <plugin-name>'));
      console.log('');
    });
}
