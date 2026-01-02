import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import { join } from 'path';
import { resolvePluginPackage, PLUGIN_REGISTRY, detectPluginType } from '../plugin-registry.js';
import type { PluginManager } from '../plugin-manager.js';

/**
 * Detect if mediaproc core is installed globally or locally
 */
function isGlobalInstall(): boolean {
  // Check if we're running from global node_modules
  const globalPaths = process.env.NODE_PATH?.split(':') || [];
  const execPath = process.argv[1];
  
  for (const globalPath of globalPaths) {
    if (execPath.includes(globalPath)) {
      return true;
    }
  }
  
  // Check common global installation paths
  const globalDirs = [
    '/usr/local/lib/node_modules',
    '/usr/lib/node_modules',
    join(process.env.HOME || '', '.nvm'),
    join(process.env.HOME || '', '.npm-global'),
  ];
  
  return globalDirs.some(dir => execPath.includes(dir));
}

export function addCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('add <plugin>')
    .description('Install a mediaproc plugin')
    .option('-g, --global', 'Force global installation')
    .option('-l, --local', 'Force local installation')
    .option('--save-dev', 'Save as dev dependency (local only)')
    .action(async (plugin: string, options: { global?: boolean; local?: boolean; saveDev?: boolean }) => {
      try {
        // Resolve plugin name using registry
        const pluginName = resolvePluginPackage(plugin);
        const registryEntry = Object.values(PLUGIN_REGISTRY).find(e => e.package === pluginName);
        
        // Check if plugin is already loaded (built-in)
        if (pluginManager.isPluginLoaded(pluginName)) {
          ora().info(chalk.blue(`Plugin ${chalk.cyan(pluginName)} is already available (built-in)`));
          console.log(chalk.dim(`You can use: ${chalk.white(`mediaproc ${plugin.replace('@mediaproc/', '')} <command>`)}`));
          return;
        }
        
        const spinner = ora(`Installing ${chalk.cyan(pluginName)}...`).start();
        
        // Detect plugin type
        const pluginType = detectPluginType(pluginName);
        const typeLabel = pluginType === 'official' ? chalk.blue('★ OFFICIAL') 
          : pluginType === 'community' ? chalk.green('🌐 COMMUNITY')
          : chalk.yellow('📦 THIRD-PARTY');
        
        // Show plugin info
        if (registryEntry) {
          spinner.info(chalk.dim(`Type: ${typeLabel}`));
          spinner.info(chalk.dim(`Description: ${registryEntry.description}`));
          if (registryEntry.systemRequirements && registryEntry.systemRequirements.length > 0) {
            spinner.info(chalk.yellow(`System requirements: ${registryEntry.systemRequirements.join(', ')}`));
          }
        } else {
          // Not in registry - show type
          spinner.info(chalk.dim(`Type: ${typeLabel}`));
          if (pluginType === 'third-party') {
            spinner.info(chalk.yellow(`Warning: Third-party plugin not in official registry`));
          }
        }
        spinner.start(`Installing ${chalk.cyan(pluginName)}...`);
        
        // Determine installation scope
        let installGlobally = false;
        if (options.global) {
          installGlobally = true;
        } else if (options.local) {
          installGlobally = false;
        } else {
          // Auto-detect based on how core was installed
          installGlobally = isGlobalInstall();
        }
        
        // Determine package manager (prefer pnpm, fallback to npm)
        let packageManager = 'pnpm';
        try {
          await execa('pnpm', ['--version'], { stdio: 'pipe' });
        } catch {
          packageManager = 'npm';
        }
        
        // Build install command
        const args: string[] = [];
        
        if (packageManager === 'pnpm') {
          args.push(installGlobally ? 'add' : 'add');
          if (installGlobally) args.push('-g');
          if (options.saveDev) args.push('-D');
        } else {
          args.push('install');
          if (installGlobally) args.push('-g');
          if (options.saveDev) args.push('--save-dev');
        }
        
        args.push(pluginName);
        
        // Execute installation
        await execa(packageManager, args, {
          stdio: 'pipe',
          cwd: installGlobally ? undefined : process.cwd(),
        });

        spinner.succeed(chalk.green(`✓ Successfully installed ${pluginName}`));
        
        const scope = installGlobally ? 'globally' : 'locally';
        console.log(chalk.dim(`\nInstalled ${scope} using ${packageManager}`));
        
        // Try to load the plugin immediately if installed locally
        if (!installGlobally) {
          try {
            const loadSpinner = ora('Loading plugin...').start();
            const loaded = await pluginManager.loadPlugin(pluginName, program);
            if (loaded) {
              loadSpinner.succeed(chalk.green('Plugin loaded and ready to use'));
            } else {
              loadSpinner.info(chalk.yellow('Plugin installed but requires restart to use'));
            }
          } catch (loadError) {
            // Not critical if loading fails - user can restart CLI
            console.log(chalk.yellow('Note: Restart the CLI to use the new plugin'));
          }
        }
        
        console.log(chalk.dim(`You can now use: ${chalk.white(`mediaproc ${plugin.replace('@mediaproc/', '')} <command>`)}`));
        
        // Show example commands
        if (registryEntry) {
          console.log(chalk.dim('\nExample commands:'));
          const shortName = registryEntry.name;
          
          // Show category-specific examples
          switch (registryEntry.package) {
            case '@mediaproc/image':
              console.log(chalk.dim(`  mediaproc ${shortName} resize photo.jpg -w 800`));
              console.log(chalk.dim(`  mediaproc ${shortName} convert image.png --format webp`));
              break;
            case '@mediaproc/video':
              console.log(chalk.dim(`  mediaproc ${shortName} compress movie.mp4 --quality high`));
              console.log(chalk.dim(`  mediaproc ${shortName} transcode video.avi --format mp4`));
              break;
            case '@mediaproc/audio':
              console.log(chalk.dim(`  mediaproc ${shortName} convert song.wav --format mp3`));
              console.log(chalk.dim(`  mediaproc ${shortName} normalize audio.mp3`));
              break;
            case '@mediaproc/document':
              console.log(chalk.dim(`  mediaproc ${shortName} compress report.pdf --quality ebook`));
              console.log(chalk.dim(`  mediaproc ${shortName} ocr scanned.pdf`));
              break;
            case '@mediaproc/animation':
              console.log(chalk.dim(`  mediaproc ${shortName} gifify video.mp4 --fps 15`));
              break;
            case '@mediaproc/3d':
              console.log(chalk.dim(`  mediaproc ${shortName} optimize model.glb`));
              console.log(chalk.dim(`  mediaproc ${shortName} compress textures/`));
              break;
            case '@mediaproc/metadata':
              console.log(chalk.dim(`  mediaproc ${shortName} inspect video.mp4`));
              console.log(chalk.dim(`  mediaproc ${shortName} strip-metadata image.jpg`));
              break;
            case '@mediaproc/stream':
              console.log(chalk.dim(`  mediaproc ${shortName} pack video.mp4 --hls`));
              break;
            case '@mediaproc/ai':
              console.log(chalk.dim(`  mediaproc ${shortName} blur-faces video.mp4`));
              console.log(chalk.dim(`  mediaproc ${shortName} caption audio.wav`));
              break;
            case '@mediaproc/pipeline':
              console.log(chalk.dim(`  mediaproc ${shortName} run workflow.yaml`));
              break;
          }
        }

      } catch (error) {
        if (error instanceof Error && error.message.includes('Unknown plugin')) {
          console.error(chalk.red(`\n${error.message}`));
        } else {
          console.error(chalk.red(`\nFailed to install ${plugin}`));
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(chalk.red(errorMessage));
        }
        process.exit(1);
      }
    });
}
