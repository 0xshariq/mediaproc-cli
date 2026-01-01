import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface NormalizeOptions extends FilterOptions {
  help?: boolean;
}

export function normalizeCommand(imageCmd: Command): void {
  imageCmd
    .command('normalize <input>')
    .description('Normalize image (enhance contrast)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for normalize command')
    .action(async (input: string, options: NormalizeOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'normalize',
          emoji: '📊',
          description: 'Normalize image by enhancing contrast using histogram stretching. Automatically adjusts brightness and contrast for optimal image quality.',
          usage: ['normalize <input>', 'normalize <input> -o output.jpg', 'normalize photo.jpg -q 95'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-normalized.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'normalize photo.jpg', description: 'Enhance contrast automatically' },
            { command: 'normalize dark-image.png', description: 'Fix underexposed image' },
            { command: 'normalize washed-out.jpg', description: 'Fix overexposed/washed out image' },
            { command: 'normalize pic.jpg -q 95', description: 'Normalize with high quality' }
          ],
          additionalSections: [
            {
              title: 'How It Works',
              items: [
                'Stretches histogram to use full dynamic range',
                'Enhances contrast by spreading pixel values',
                'Darkest pixels become black, brightest become white',
                'Improves visibility of details',
                'Non-destructive automatic adjustment'
              ]
            },
            {
              title: 'Best For',
              items: [
                'Underexposed photos (too dark)',
                'Overexposed photos (too bright/washed out)',
                'Low contrast images (flat/dull)',
                'Scanned documents',
                'Images with poor lighting'
              ]
            }
          ],
          tips: [
            'Works best on images with poor exposure',
            'May not improve well-exposed images',
            'Great for batch processing old photos',
            'Combine with sharpen for best results'
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-normalized${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would normalize image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).normalize();

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

        spinner.succeed(chalk.green('✓ Image normalized successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to normalize image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
