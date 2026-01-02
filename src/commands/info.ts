import { Command } from 'commander';
import chalk from 'chalk';
import { statSync, existsSync } from 'fs';
import { resolve, extname, basename } from 'path';
import type { PluginManager } from '../plugin-manager.js';

/**
 * Universal info command - shows basic file information and suggests plugin for detailed info
 */
export function infoCommand(program: Command, pluginManager?: PluginManager): void {
  program
    .command('info <file>')
    .description('Show file information for any media type')
    .option('--json', 'Output as JSON')
    .action((file: string, options: { json?: boolean }) => {
      if (!existsSync(file)) {
        console.error(chalk.red(`✗ File not found: ${file}`));
        process.exit(1);
      }

      const absolutePath = resolve(file);
      const ext = extname(file).toLowerCase().slice(1);
      const name = basename(file);
      const stats = statSync(file);
      const sizeInBytes = stats.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      const modified = stats.mtime.toLocaleString();
      const created = stats.birthtime.toLocaleString();

      // Detect media type
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif', 'svg'];
      const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'];
      const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
      const documentExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'epub'];
      const modelExts = ['gltf', 'glb', 'obj', 'fbx', 'usdz'];

      let mediaType = 'Unknown';
      let suggestedPlugin = '';
      let icon = '📄';

      if (imageExts.includes(ext)) {
        mediaType = 'Image';
        suggestedPlugin = 'image';
        icon = '🖼️';
      } else if (videoExts.includes(ext)) {
        mediaType = 'Video';
        suggestedPlugin = 'video';
        icon = '🎬';
      } else if (audioExts.includes(ext)) {
        mediaType = 'Audio';
        suggestedPlugin = 'audio';
        icon = '🎵';
      } else if (documentExts.includes(ext)) {
        mediaType = 'Document';
        suggestedPlugin = 'document';
        icon = '📄';
      } else if (modelExts.includes(ext)) {
        mediaType = '3D Model';
        suggestedPlugin = '3d';
        icon = '🎨';
      }

      if (options.json) {
        const info = {
          name,
          path: absolutePath,
          type: mediaType,
          extension: ext,
          size: {
            bytes: sizeInBytes,
            kb: parseFloat(sizeInKB),
            mb: parseFloat(sizeInMB),
          },
          dates: {
            created,
            modified,
          },
          suggestedPlugin,
        };
        console.log(JSON.stringify(info, null, 2));
      } else {
        console.log('');
        console.log(chalk.bold(`${icon} File Information`));
        console.log(chalk.dim('─'.repeat(50)));
        console.log(chalk.cyan('Name:         ') + name);
        console.log(chalk.cyan('Type:         ') + chalk.yellow(mediaType) + chalk.dim(` (.${ext})`));
        console.log(chalk.cyan('Size:         ') + `${sizeInMB} MB ${chalk.dim(`(${sizeInKB} KB, ${sizeInBytes} bytes)`)}`);
        console.log(chalk.cyan('Path:         ') + chalk.dim(absolutePath));
        console.log(chalk.cyan('Created:      ') + created);
        console.log(chalk.cyan('Modified:     ') + modified);
        console.log('');

        if (suggestedPlugin) {
          console.log(chalk.yellow('💡 Get detailed info with:'));
          console.log(chalk.cyan(`   mediaproc ${suggestedPlugin} info ${file}`));
          console.log('');

          // Check plugin status
          const pluginPackage = `@mediaproc/${suggestedPlugin}`;
          const isLoaded = pluginManager?.isPluginLoaded(pluginPackage);
          const isInstalled = pluginManager?.isPluginInstalled(pluginPackage);

          if (isLoaded) {
            console.log(chalk.green(`   ✓ ${suggestedPlugin} plugin is loaded - command is ready`));
          } else if (isInstalled) {
            console.log(chalk.yellow(`   ⚠️  ${suggestedPlugin} plugin is installed but not loaded`));
            console.log(chalk.dim(`   Load it: ${chalk.cyan(`mediaproc add ${suggestedPlugin}`)}`));
          } else {
            console.log(chalk.red(`   ✗ ${suggestedPlugin} plugin not installed`));
            console.log(chalk.dim(`   Install: ${chalk.cyan(`mediaproc add ${suggestedPlugin}`)}`));
          }
        } else {
          console.log(chalk.yellow('⚠️  Unknown media type - no plugin available'));
        }
        console.log('');
      }
    });
}
