import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface FlattenOptions extends ImageOptions {
  background?: string;
}

export function flattenCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('flatten <input>')
    .description('Flatten alpha transparency onto background color')
    .option('--background <color>', 'Background color as hex (default: #ffffff)', '#ffffff')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output');

  cmd.addHelpText('after', () => {
    return '\n' + createStandardHelp({
      commandName: 'flatten',
      emoji: '🎨',
      description: 'Remove alpha channel by merging transparency onto a solid background color. Essential for converting PNGs with transparency to JPEGs.',
      usage: ['flatten <input>', 'flatten <input> --background #ff0000'],
      options: [
        { flag: '--background <color>', description: 'Background color as hex (default: #ffffff white)' },
        { flag: '-o, --output <path>', description: 'Output file path (default: <input>-flat.<ext>)' },
        { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
        { flag: '--dry-run', description: 'Preview changes without executing' },
        { flag: '-v, --verbose', description: 'Show detailed output' }
      ],
      examples: [
        { command: 'flatten logo.png', description: 'Flatten onto white background' },
        { command: 'flatten image.png --background #000000', description: 'Flatten onto black' },
        { command: 'flatten graphic.png --background #ff0000 -o red-bg.jpg', description: 'Flatten onto red and save as JPG' }
      ],
      additionalSections: [
        {
          title: 'Use Cases',
          items: [
            'Convert PNG with transparency to JPEG',
            'Prepare images for platforms that don\'t support transparency',
            'Composite transparent images onto colored backgrounds',
            'Remove alpha channel to reduce file size'
          ]
        },
        {
          title: 'Color Formats',
          items: [
            '#ffffff - White (default)',
            '#000000 - Black',
            '#ff0000 - Red',
            '#00ff00 - Green',
            '#0000ff - Blue',
            'Use 6-digit hex format'
          ]
        }
      ],
      tips: [
        'Required when converting PNG to JPEG',
        'White background is default',
        'Choose background color that matches your design',
        'Flattened images have smaller file sizes'
      ]
    });
  });

  cmd.action(async (input: string, options: FlattenOptions) => {
    const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        // Parse background color
        const bgColor = options.background || '#ffffff';
        const bgHex = bgColor.replace('#', '');
        
        if (!/^[0-9A-Fa-f]{6}$/.test(bgHex)) {
          spinner.fail(chalk.red('Invalid background color format. Use 6-digit hex like #ffffff'));
          process.exit(1);
        }

        const r = parseInt(bgHex.substring(0, 2), 16);
        const g = parseInt(bgHex.substring(2, 4), 16);
        const b = parseInt(bgHex.substring(4, 6), 16);

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-flat${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Background: ${bgColor} (R:${r}, G:${g}, B:${b})`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would flatten image:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Background: ${bgColor}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).flatten({
          background: { r, g, b }
        });

        const outputExt = path.extname(outputPath).toLowerCase();
        if (outputExt === '.jpg' || outputExt === '.jpeg') {
          pipeline.jpeg({ quality: options.quality || 90 });
        } else if (outputExt === '.png') {
          pipeline.png({ quality: options.quality || 90 });
        } else if (outputExt === '.webp') {
          pipeline.webp({ quality: options.quality || 90 });
        }

        await pipeline.toFile(outputPath);

        const inputStats = fs.statSync(input);
        const outputStats = fs.statSync(outputPath);
        const sizeDiff = ((outputStats.size - inputStats.size) / inputStats.size * 100).toFixed(2);

        spinner.succeed(chalk.green('✓ Image flattened successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Background: ${bgColor}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB (${sizeDiff}%)`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to flatten image'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
