import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface TintOptions extends FilterOptions {
  color?: string;
  help?: boolean;
}

export function tintCommand(imageCmd: Command): void {
  imageCmd
    .command('tint <input>')
    .description('Apply color tint to image')
    .option('-c, --color <color>', 'Tint color (hex, rgb, or name, default: #0000ff)', '#0000ff')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for tint command')
    .action(async (input: string, options: TintOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'tint',
          emoji: '🎨',
          description: 'Apply color tint overlay to images. Great for creating artistic effects, mood adjustments, or brand color filters.',
          usage: ['tint <input>', 'tint <input> -c <color>', 'tint <input> -c "#ff6600"'],
          options: [
            { flag: '-c, --color <color>', description: 'Tint color as hex (#ff0000), rgb (rgb(255,0,0)), or name (red)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-tinted.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'tint photo.jpg -c blue', description: 'Apply blue tint' },
            { command: 'tint image.png -c "#ff6600"', description: 'Apply orange tint (hex color)' },
            { command: 'tint pic.jpg -c "rgb(255, 0, 128)"', description: 'Apply pink tint (RGB)' },
            { command: 'tint photo.jpg -c red', description: 'Apply red tint' }
          ],
          additionalSections: [
            {
              title: 'Color Formats',
              items: [
                'Hex: #ff0000 or #f00 (red)',
                'RGB: rgb(255, 0, 0) (red)',
                'Names: red, blue, green, yellow, etc.',
                'Popular: sepia (#704214), cyan (#00ffff)'
              ]
            },
            {
              title: 'Common Tints',
              items: [
                'Sepia: #704214 - Vintage/warm look',
                'Blue: #0066cc - Cool/cold mood',
                'Orange: #ff6600 - Warm/sunset effect',
                'Purple: #9933cc - Creative/artistic',
                'Green: #00cc66 - Nature/fresh feel'
              ]
            }
          ],
          tips: [
            'Subtle tints work better than strong colors',
            'Use sepia (#704214) for vintage effects',
            'Blue tints create cool, calm atmospheres',
            'Orange/red tints add warmth to photos'
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-tinted${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Color: ${options.color || '#0000ff'}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply tint:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Color: ${options.color || '#0000ff'}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).tint(options.color || '#0000ff');

        const outputExt = path.extname(outputPath).toLowerCase();
        if (outputExt === '.jpg' || outputExt === '.jpeg') {
          pipeline.jpeg({ quality: options.quality || 90 });
        } else if (outputExt === '.png') {
          pipeline.png({ quality: options.quality || 90 });
        } else if (outputExt === '.webp') {
          pipeline.webp({ quality: options.quality || 90 });
        }

        await pipeline.toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ Tint applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Color: ${options.color || '#0000ff'}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to apply tint'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
