import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface UnflattenOptions extends ImageOptions {
}

export function unflattenCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('unflatten <input>')
    .description('Add alpha channel to RGB image (inverse of flatten)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output');

  cmd.addHelpText('after', () => {
    return '\n' + createStandardHelp({
      commandName: 'unflatten',
      emoji: '🔓',
      description: 'Add alpha channel to image (convert RGB to RGBA). Opposite of flatten command.',
      usage: ['unflatten <input>', 'unflatten <input> -o transparent.png'],
      options: [
        { flag: '-o, --output <path>', description: 'Output file path (default: <input>-unflat.png)' },
        { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
        { flag: '--dry-run', description: 'Preview changes without executing' },
        { flag: '-v, --verbose', description: 'Show detailed output' }
      ],
      examples: [
        { command: 'unflatten image.jpg', description: 'Add alpha channel' },
        { command: 'unflatten photo.jpg -o with-alpha.png', description: 'Convert JPG to PNG with alpha' }
      ],
      additionalSections: [
        {
          title: 'Use Cases',
          items: [
            'Prepare image for compositing operations',
            'Convert JPEG to PNG with transparency support',
            'Add alpha channel before applying transparency',
            'Prepare for further alpha manipulations'
          ]
        }
      ],
      tips: [
        'All pixels will be fully opaque after unflatten',
        'Use PNG format to preserve alpha channel',
        'Required before some compositing operations',
        'Increases file size (adds alpha data)'
      ]
    });
  });

  cmd.action(async (input: string, options: UnflattenOptions) => {
    const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-unflat.png`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would unflatten image:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).unflatten();

        // Unflatten typically outputs PNG to preserve alpha
        const outputExt = path.extname(outputPath).toLowerCase();
        if (outputExt === '.png') {
          pipeline.png({ quality: options.quality || 90 });
        } else if (outputExt === '.webp') {
          pipeline.webp({ quality: options.quality || 90 });
        } else {
          // Force PNG if no extension or unsupported format
          pipeline.png({ quality: options.quality || 90 });
        }

        await pipeline.toFile(outputPath);

        const inputStats = fs.statSync(input);
        const outputStats = fs.statSync(outputPath);
        const sizeDiff = ((outputStats.size - inputStats.size) / inputStats.size * 100).toFixed(2);

        spinner.succeed(chalk.green('✓ Image unflattened successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB (${sizeDiff}%)`));
        console.log(chalk.cyan('ℹ  Alpha channel added (all pixels fully opaque)'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to unflatten image'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
