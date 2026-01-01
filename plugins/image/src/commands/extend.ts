import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ExtendOptions extends ImageOptions {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  background?: string;
  help?: boolean;
}

export function extendCommand(imageCmd: Command): void {
  imageCmd
    .command('extend <input>')
    .description('Add padding/border around image')
    .option('--top <pixels>', 'Top padding in pixels', parseInt, 0)
    .option('--bottom <pixels>', 'Bottom padding in pixels', parseInt, 0)
    .option('--left <pixels>', 'Left padding in pixels', parseInt, 0)
    .option('--right <pixels>', 'Right padding in pixels', parseInt, 0)
    .option('--all <pixels>', 'All sides padding in pixels', parseInt)
    .option('--background <color>', 'Background color (default: white)', 'white')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for extend command')
    .action(async (input: string, options: ExtendOptions & { all?: number }) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'extend',
          emoji: '🖼️',
          description: 'Add padding or borders around images. Perfect for creating frames, adding space, or preparing images for specific aspect ratios.',
          usage: ['extend <input> --all <pixels>', 'extend <input> --top 50 --bottom 50', 'extend <input> --all 20 --background black'],
          options: [
            { flag: '--all <pixels>', description: 'Padding on all sides (shortcut)' },
            { flag: '--top <pixels>', description: 'Top padding in pixels' },
            { flag: '--bottom <pixels>', description: 'Bottom padding in pixels' },
            { flag: '--left <pixels>', description: 'Left padding in pixels' },
            { flag: '--right <pixels>', description: 'Right padding in pixels' },
            { flag: '--background <color>', description: 'Background color (default: white, accepts hex/rgb/names)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-extended.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'extend photo.jpg --all 50', description: 'Add 50px padding on all sides' },
            { command: 'extend image.png --all 20 --background black', description: 'Add black border' },
            { command: 'extend pic.jpg --top 100 --bottom 100', description: 'Add padding top/bottom only' },
            { command: 'extend photo.jpg --all 30 --background "#ff0000"', description: 'Add red border' }
          ],
          additionalSections: [
            {
              title: 'Use Cases',
              items: [
                'Adding borders/frames to images',
                'Creating letterbox/pillarbox effect',
                'Preparing images for specific dimensions',
                'Adding space for text overlay',
                'Social media post formatting'
              ]
            },
            {
              title: 'Color Options',
              items: [
                'white - Default white background',
                'black - Black border',
                'transparent - Transparent padding (PNG)',
                '#ff0000 - Hex colors',
                'rgb(255,0,0) - RGB colors'
              ]
            }
          ],
          tips: [
            'Use --all for uniform padding',
            'Combine with watermark for branded images',
            'Use transparent background for PNGs',
            'Match background to image for seamless look'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-extended${inputPath.ext}`);

        // Handle --all shortcut
        const top = options.all !== undefined ? options.all : (options.top || 0);
        const bottom = options.all !== undefined ? options.all : (options.bottom || 0);
        const left = options.all !== undefined ? options.all : (options.left || 0);
        const right = options.all !== undefined ? options.all : (options.right || 0);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Padding: top=${top}, bottom=${bottom}, left=${left}, right=${right}`));
          console.log(chalk.dim(`  Background: ${options.background || 'white'}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would extend image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Padding: ${top}/${right}/${bottom}/${left} (top/right/bottom/left)`));
          return;
        }

        const originalMetadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).extend({
          top,
          bottom,
          left,
          right,
          background: options.background || 'white'
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

        const outputMetadata = await createSharpInstance(outputPath).metadata();
        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Image extended successfully!'));
        console.log(chalk.dim(`  Input: ${input} (${originalMetadata.width}x${originalMetadata.height})`));
        console.log(chalk.dim(`  Output: ${outputPath} (${outputMetadata.width}x${outputMetadata.height})`));
        console.log(chalk.dim(`  Padding: top=${top}, bottom=${bottom}, left=${left}, right=${right}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to extend image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
