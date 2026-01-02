import { Command } from 'commander';
import chalk from 'chalk';
import { PLUGIN_REGISTRY, getPluginsByCategory } from '../plugin-registry.js';
import type { PluginManager } from '../plugin-manager.js';

export function pluginsCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('plugins')
    .alias('marketplace')
    .description('Show all available plugins from registry')
    .action(() => {
      const grouped = getPluginsByCategory();
      const loadedPlugins = new Set(pluginManager.getLoadedPlugins());

      console.log(chalk.bold('\n📦 Available MediaProc Plugins\n'));
      console.log(chalk.dim('Official plugins from the MediaProc ecosystem\n'));

      // Core plugins
      if (grouped.core && grouped.core.length > 0) {
        console.log(chalk.bold('🎯 Core Media Plugins:\n'));
        
        const seen = new Set<string>();
        grouped.core.forEach((entry) => {
          if (seen.has(entry.package)) return;
          seen.add(entry.package);
          
          const isInstalled = loadedPlugins.has(entry.package);
          const status = isInstalled ? chalk.green('✓ INSTALLED') : chalk.dim('Not installed');
          const builtInPlugin = pluginManager.getPlugin(entry.package);
          const isBuiltIn = builtInPlugin?.isBuiltIn === true;
          
          console.log(`${chalk.cyan(entry.name.padEnd(12))} ${status} ${isBuiltIn ? chalk.magenta('★ BUILT-IN') : ''}`);
          console.log(chalk.dim(`  ${entry.description}`));
          
          if (entry.systemRequirements && entry.systemRequirements.length > 0) {
            console.log(chalk.yellow(`  Requirements: ${entry.systemRequirements.join(', ')}`));
          }
          
          console.log(chalk.dim(`  Install: ${chalk.white(`mediaproc add ${entry.name}`)}`));
          console.log('');
        });
      }

      // Advanced plugins
      if (grouped.advanced && grouped.advanced.length > 0) {
        console.log(chalk.bold('🚀 Advanced Plugins:\n'));
        
        const seen = new Set<string>();
        grouped.advanced.forEach((entry) => {
          if (seen.has(entry.package)) return;
          seen.add(entry.package);
          
          const isInstalled = loadedPlugins.has(entry.package);
          const status = isInstalled ? chalk.green('✓ INSTALLED') : chalk.dim('Not installed');
          
          console.log(`${chalk.cyan(entry.name.padEnd(12))} ${status}`);
          console.log(chalk.dim(`  ${entry.description}`));
          
          if (entry.systemRequirements && entry.systemRequirements.length > 0) {
            console.log(chalk.yellow(`  Requirements: ${entry.systemRequirements.join(', ')}`));
          }
          
          console.log(chalk.dim(`  Install: ${chalk.white(`mediaproc add ${entry.name}`)}`));
          console.log('');
        });
      }

      // Future-proof plugins
      if (grouped['future-proof'] && grouped['future-proof'].length > 0) {
        console.log(chalk.bold('🔮 Future-Proof Plugins:\n'));
        
        const seen = new Set<string>();
        grouped['future-proof'].forEach((entry) => {
          if (seen.has(entry.package)) return;
          seen.add(entry.package);
          
          const isInstalled = loadedPlugins.has(entry.package);
          const status = isInstalled ? chalk.green('✓ INSTALLED') : chalk.dim('Not installed');
          
          console.log(`${chalk.cyan(entry.name.padEnd(12))} ${status}`);
          console.log(chalk.dim(`  ${entry.description}`));
          
          if (entry.systemRequirements && entry.systemRequirements.length > 0) {
            console.log(chalk.yellow(`  Requirements: ${entry.systemRequirements.join(', ')}`));
          }
          
          console.log(chalk.dim(`  Install: ${chalk.white(`mediaproc add ${entry.name}`)}`));
          console.log('');
        });
      }

      console.log(chalk.dim('💡 Plugin Types:'));
      console.log(chalk.dim('   🎁 Built-in: Bundled with CLI (pre-installed)'));
      console.log(chalk.dim('   ✨ Official: @mediaproc/* packages'));
      console.log(chalk.dim('   🌐 Community: mediaproc-* packages'));
      console.log(chalk.dim('   📦 Third-party: Other npm packages'));
      console.log(chalk.dim('\n📥 Install any plugin: ') + chalk.white('mediaproc add <plugin-name>'));
      console.log(chalk.dim('📋 Show installed plugins: ') + chalk.white('mediaproc list'));
      console.log('');
    });
}
