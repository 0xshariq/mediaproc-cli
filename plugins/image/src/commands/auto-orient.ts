import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface AutoOrientOptions extends ImageOptions {
  help?: boolean;
}

export function autoOrientCommand(imageCmd: Command): void {
  imageCmd
    .command('auto-orient <input>')
    .alias('rotate-auto')
    .description('Auto-rotate image based on EXIF orientation')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for auto-orient command')
    .action(async (input: string, options: AutoOrientOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'auto-orient',
          emoji: '🧭',
          description: 'Automatically rotate image based on EXIF orientation metadata. Corrects photos taken with rotated cameras.',
          usage: ['auto-orient <input>', 'rotate-auto <input>'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-oriented.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'auto-orient photo.jpg', description: 'Auto-correct orientation' },
            { command: 'rotate-auto image.jpg', description: 'Fix camera rotation (using alias)' },
            { command: 'auto-orient *.jpg', description: 'Batch fix orientation for all JPGs' }
          ],
          additionalSections: [
            {
              title: 'EXIF Orientation',
              items: [
                '1: No rotation needed',
                '3: 180° rotation',
                '6: 90° clockwise (vertical photo)',
                '8: 90° counter-clockwise',
                'Also handles horizontal/vertical flips'
              ]
            }
          ],
          tips: [
            'Essential for photos from cameras/phones',
            'Removes EXIF orientation tag after correction',
            'Safe to run on already-oriented images'
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-oriented${inputPath.ext}`);

        const metadata = await createSharpInstance(input).metadata();
        const orientation = metadata.orientation || 1;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  EXIF Orientation: ${orientation}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would auto-orient image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Current orientation: ${orientation}`));
          return;
        }

        const pipeline = createSharpInstance(input).rotate(); // rotate() with no args uses EXIF

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

        spinner.succeed(chalk.green('✓ Image auto-oriented successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Original EXIF orientation: ${orientation}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to auto-orient image'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
