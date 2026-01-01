import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface TrimOptions extends ImageOptions {
  threshold?: number;
  help?: boolean;
}

export function trimCommand(imageCmd: Command): void {
  imageCmd
    .command('trim <input>')
    .description('Trim/remove border edges from image')
    .option('-t, --threshold <value>', 'Threshold for edge detection (1-100, default: 10)', parseInt, 10)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for trim command')
    .action(async (input: string, options: TrimOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'trim',
          emoji: '✂️',
          description: 'Automatically trim/remove boring border edges from images. Perfect for removing whitespace, borders, or uniform backgrounds.',
          usage: ['trim <input>', 'trim <input> -t <threshold>', 'trim <input> -t 20'],
          options: [
            { flag: '-t, --threshold <value>', description: 'Edge detection threshold 1-100 (default: 10, higher = more aggressive)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-trimmed.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'trim photo.jpg', description: 'Auto-trim with default threshold (10)' },
            { command: 'trim image.png -t 5', description: 'Gentle trim (sensitive)' },
            { command: 'trim pic.jpg -t 20', description: 'Aggressive trim' },
            { command: 'trim screenshot.png', description: 'Remove screenshot borders' }
          ],
          additionalSections: [
            {
              title: 'Threshold Guide',
              items: [
                '1-5 - Very sensitive (removes slight differences)',
                '10 - Default (balanced)',
                '15-25 - Aggressive (removes more)',
                '25+ - Very aggressive (may over-trim)'
              ]
            },
            {
              title: 'Best For',
              items: [
                'Scanned documents with borders',
                'Screenshots with padding',
                'Images with solid color borders',
                'Product photos on white backgrounds',
                'Auto-cropping uniform edges'
              ]
            }
          ],
          tips: [
            'Start with default threshold (10)',
            'Lower threshold for subtle edges',
            'Higher threshold for obvious borders',
            'Perfect for batch processing scans'
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-trimmed${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Threshold: ${options.threshold || 10}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would trim image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Threshold: ${options.threshold || 10}`));
          return;
        }

        const originalMetadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).trim({ threshold: options.threshold || 10 });

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

        spinner.succeed(chalk.green('✓ Image trimmed successfully!'));
        console.log(chalk.dim(`  Input: ${input} (${originalMetadata.width}x${originalMetadata.height})`));
        console.log(chalk.dim(`  Output: ${outputPath} (${outputMetadata.width}x${outputMetadata.height})`));
        console.log(chalk.dim(`  Threshold: ${options.threshold || 10}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to trim image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
