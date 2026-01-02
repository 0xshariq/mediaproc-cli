import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { extname } from 'path';
import type { PluginManager } from '../plugin-manager.js';

/**
 * Universal file conversion command - shows suggestions based on detected file type
 */
export function convertCommand(program: Command, pluginManager?: PluginManager): void {
  program
    .command('convert <input> <output>')
    .description('Universal file conversion - auto-detects and converts between formats')
    .option('-q, --quality <number>', 'Output quality (for lossy formats)', '85')
    .option('--preset <preset>', 'Conversion preset (fast, balanced, quality)')
    .option('-v, --verbose', 'Verbose output')
    .action((input: string, output: string, options: { quality?: string; preset?: string; verbose?: boolean }) => {
      if (!existsSync(input)) {
        console.error(chalk.red(`✗ Input file not found: ${input}`));
        process.exit(1);
      }

      const inputExt = extname(input).toLowerCase().slice(1);
      const outputExt = extname(output).toLowerCase().slice(1);

      // Detect media type and suggest appropriate plugin
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif'];
      const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v'];
      const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
      const documentExts = ['pdf', 'docx', 'pptx', 'txt', 'md'];
      const modelExts = ['gltf', 'glb', 'obj', 'fbx'];

      let pluginName = '';
      let mediaType = '';
      let suggestedCommand = '';

      if (imageExts.includes(inputExt)) {
        pluginName = 'image';
        mediaType = 'Image';
        suggestedCommand = `mediaproc image convert ${input} ${output}`;
        if (options.quality) {
          suggestedCommand += ` --quality ${options.quality}`;
        }
      } else if (videoExts.includes(inputExt)) {
        pluginName = 'video';
        mediaType = 'Video';
        suggestedCommand = `mediaproc video convert ${input} ${output}`;
      } else if (audioExts.includes(inputExt)) {
        pluginName = 'audio';
        mediaType = 'Audio';
        suggestedCommand = `mediaproc audio convert ${input} ${output}`;
      } else if (documentExts.includes(inputExt)) {
        pluginName = 'document';
        mediaType = 'Document';
        suggestedCommand = `mediaproc document convert ${input} ${output}`;
      } else if (modelExts.includes(inputExt)) {
        pluginName = '3d';
        mediaType = '3D Model';
        suggestedCommand = `mediaproc 3d convert ${input} ${output}`;
      } else {
        console.error(chalk.red(`✗ Unsupported input format: .${inputExt}`));
        console.log(chalk.yellow('\n💡 Supported formats:'));
        console.log(chalk.dim('  Images:    jpg, png, webp, gif, bmp, tiff, avif, heif'));
        console.log(chalk.dim('  Videos:    mp4, webm, mkv, avi, mov, flv, wmv'));
        console.log(chalk.dim('  Audio:     mp3, wav, ogg, flac, aac, m4a, wma, opus'));
        console.log(chalk.dim('  Documents: pdf, docx, pptx, txt, md'));
        console.log(chalk.dim('  3D Models: gltf, glb, obj, fbx'));
        process.exit(1);
      }

      console.log('');
      console.log(chalk.blue(`🔄 ${mediaType} Conversion`));
      console.log(chalk.dim('─'.repeat(50)));
      console.log(chalk.cyan('Input:  ') + input + chalk.dim(` (.${inputExt})`));
      console.log(chalk.cyan('Output: ') + output + chalk.dim(` (.${outputExt})`));
      console.log(chalk.cyan('Plugin: ') + chalk.yellow(pluginName));
      console.log('');

      // Check plugin status
      const pluginPackage = `@mediaproc/${pluginName}`;
      const isLoaded = pluginManager?.isPluginLoaded(pluginPackage);
      const isInstalled = pluginManager?.isPluginInstalled(pluginPackage);

      console.log(chalk.yellow('💡 Suggested command:'));
      console.log(chalk.cyan(`   ${suggestedCommand}`));
      console.log('');

      if (isLoaded) {
        console.log(chalk.green(`✓ ${pluginName} plugin is loaded - command is ready`));
      } else if (isInstalled) {
        console.log(chalk.yellow(`⚠️  ${pluginName} plugin is installed but not loaded`));
        console.log(chalk.dim(`   Load it: ${chalk.cyan(`mediaproc add ${pluginName}`)}`));
      } else {
        console.log(chalk.red(`✗ ${pluginName} plugin not installed`));
        console.log(chalk.dim(`   Install: ${chalk.cyan(`mediaproc add ${pluginName}`)}`));
      }
      console.log('');
    });
}
