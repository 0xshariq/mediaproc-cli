import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { BorderOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface BorderOptionsExtended extends BorderOptions {
  help?: boolean;
}

export function borderCommand(imageCmd: Command): void {
  imageCmd
    .command('border <input>')
    .description('Add decorative border/frame around image')
    .option('-w, --width <pixels>', 'Border width in pixels', parseInt, 10)
    .option('--color <color>', 'Border color (hex, rgb, or name)', '#000000')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for border command')
    .action(async (input: string, options: BorderOptionsExtended) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'border',
          emoji: '🖼️',
          description: 'Add solid color borders or decorative frames around images. Perfect for presentations, galleries, and social media posts.',
          usage: ['border <input>', 'border <input> --width 20 --color white', 'border <input> -w 50 --color "#FF0000"'],
          options: [
            { flag: '-w, --width <pixels>', description: 'Border width in pixels (default: 10)' },
            { flag: '--color <color>', description: 'Border color - hex (#FF0000), rgb (rgb(255,0,0)), or name (red) (default: #000000)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'border photo.jpg', description: 'Add default 10px black border' },
            { command: 'border image.png --width 20 --color white', description: 'Add 20px white border' },
            { command: 'border pic.jpg -w 5 --color "#FF5733"', description: 'Add 5px orange border' },
            { command: 'border photo.jpg --width 30 --color "rgb(100,100,100)"', description: 'Add 30px gray border' },
            { command: 'border image.png --width 15 --color gold', description: 'Add 15px gold border' }
          ],
          additionalSections: [
            {
              title: 'Color Formats',
              items: [
                'Hex: #FF0000 (red), #00FF00 (green), #0000FF (blue)',
                'RGB: rgb(255, 0, 0) or rgba(255, 0, 0, 0.5)',
                'Named: white, black, red, blue, gold, silver, etc.',
                'Transparent: rgba(0, 0, 0, 0) for transparent border'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Frame images for presentations',
                'Add white space around photos',
                'Create Instagram-style borders',
                'Separate images in galleries',
                'Professional photo finishing'
              ]
            }
          ],
          tips: [
            'Use white borders for clean, modern look',
            'Black borders work well for galleries',
            'Colored borders can match brand identity',
            'Larger borders create emphasis'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Adding border...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-border${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Border width: ${options.width}px`));
          console.log(chalk.dim(`  Border color: ${options.color}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would add border:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Width: ${options.width}px`));
          console.log(chalk.dim(`  Color: ${options.color}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();

        await createSharpInstance(input)
          .extend({
            top: options.width || 10,
            bottom: options.width || 10,
            left: options.width || 10,
            right: options.width || 10,
            background: options.color || '#000000'
          })
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);
        const outputMetadata = await createSharpInstance(outputPath).metadata();

        spinner.succeed(chalk.green('✓ Border added successfully!'));
        console.log(chalk.dim(`  Input: ${input} (${metadata.width}x${metadata.height})`));
        console.log(chalk.dim(`  Output: ${outputPath} (${outputMetadata.width}x${outputMetadata.height})`));
        console.log(chalk.dim(`  Border: ${options.width}px ${options.color}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to add border'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
