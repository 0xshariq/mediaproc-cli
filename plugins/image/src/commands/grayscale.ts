import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

export function grayscaleCommand(imageCmd: Command): void {
  imageCmd
    .command('grayscale <input>')
    .alias('greyscale')
    .description('Convert image to grayscale (black and white)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for grayscale command')
    .action(async (input: string, options: FilterOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'grayscale',
          emoji: '⚫',
          description: 'Convert color images to grayscale (black and white). Perfect for creating artistic effects, reducing file size, or preparing images for print.',
          usage: ['grayscale <input>', 'grayscale <input> -o <output>', 'greyscale <input>'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-grayscale.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'grayscale photo.jpg', description: 'Convert to grayscale with default settings' },
            { command: 'grayscale image.png -o bw.png', description: 'Convert with custom output name' },
            { command: 'greyscale portrait.jpg -q 95', description: 'Convert with high quality (UK spelling)' }
          ],
          tips: ['Grayscale images are typically smaller than color images', 'Both "grayscale" and "greyscale" commands work identically']
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-grayscale${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would convert image to grayscale:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).grayscale();

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

        spinner.succeed(chalk.green('✓ Converted to grayscale successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(inputStats.size / 1024).toFixed(2)}KB → ${(outputStats.size / 1024).toFixed(2)}KB (${sizeDiff > '0' ? '+' : ''}${sizeDiff}%)`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to convert image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
