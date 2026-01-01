import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface LinearOptions extends ImageOptions {
  a?: number;
  b?: number;
}

export function linearCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('linear <input>')
    .description('Apply linear formula: output = (a * input) + b')
    .option('-a, --a <value>', 'Multiplier (default: 1)', parseFloat, 1)
    .option('-b, --b <value>', 'Offset (default: 0)', parseFloat, 0)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output');
  
  cmd.addHelpText('after', () => {
    return '\n' +
        createStandardHelp({
          commandName: 'linear',
          emoji: '📐',
          description: 'Apply linear transformation to pixel values. Formula: output = (a * input) + b. Control brightness and contrast precisely.',
          usage: ['linear <input> -a 1.5 -b 10', 'linear <input> -a 0.5 -b 50'],
          options: [
            { flag: '-a, --a <value>', description: 'Multiplier (default: 1, contrast control)' },
            { flag: '-b, --b <value>', description: 'Offset (default: 0, brightness control)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-linear.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'linear image.jpg -a 1.5 -b 0', description: 'Increase contrast by 50%' },
            { command: 'linear photo.jpg -a 1 -b 50', description: 'Increase brightness by 50' },
            { command: 'linear pic.jpg -a 0.8 -b 20', description: 'Reduce contrast, add brightness' },
            { command: 'linear dark.jpg -a 2 -b 0', description: 'Double pixel values (brighten)' }
          ],
          additionalSections: [
            {
              title: 'Parameters',
              items: [
                'a = 1, b = 0: No change (identity)',
                'a > 1: Increase contrast',
                'a < 1: Decrease contrast',
                'b > 0: Increase brightness',
                'b < 0: Decrease brightness'
              ]
            },
            {
              title: 'Common Operations',
              items: [
                'Brighten: a=1, b=50',
                'Darken: a=1, b=-50',
                'More contrast: a=1.5, b=0',
                'Less contrast: a=0.5, b=0',
                'Invert: a=-1, b=255',
                'High key: a=0.5, b=128'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Precise brightness/contrast control',
                'Color grading with exact values',
                'Exposure correction',
                'Scientific image processing',
                'Batch processing with consistent values'
              ]
            }
          ],
          tips: [
            'More precise than modulate command',
            'Values can be negative',
            'Results clamped to 0-255',
            'Use for reproducible adjustments'
          ]
        });
  });
  
  cmd.action(async (input: string, options: LinearOptions) => {
      const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const a = options.a ?? 1;
        const b = options.b ?? 0;

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-linear${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Formula: (${a} * input) + ${b}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply linear transformation:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Formula: (${a} * input) + ${b}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).linear(a, b);

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

        spinner.succeed(chalk.green('✓ Linear transformation applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Formula: (${a} * input) + ${b}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to apply linear transformation'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
