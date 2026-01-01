import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface DilateOptions extends ImageOptions {
  help?: boolean;
}

export function dilateCommand(imageCmd: Command): void {
  imageCmd
    .command('dilate <input>')
    .description('Dilate image (expand bright regions)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for dilate command')
    .action(async (input: string, options: DilateOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'dilate',
          emoji: '⚪',
          description: 'Apply morphological dilation to expand bright regions and fill gaps. Useful for closing holes and connecting nearby objects.',
          usage: ['dilate <input>', 'dilate <input> -o dilated.png'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-dilated.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'dilate mask.png', description: 'Expand white regions in mask' },
            { command: 'dilate document.jpg -o filled.jpg', description: 'Fill small gaps' },
            { command: 'dilate binary.png --verbose', description: 'Connect nearby objects' }
          ],
          additionalSections: [
            {
              title: 'What is Dilation?',
              items: [
                'Morphological operation from image processing',
                'Expands bright (high-value) regions',
                'Shrinks dark (low-value) regions',
                'Opposite of erosion',
                'Uses 3x3 kernel by default'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Fill small holes/gaps in objects',
                'Connect nearby components',
                'Expand boundaries of objects',
                'Remove small dark noise',
                'Strengthen weak edges'
              ]
            },
            {
              title: 'Common Workflows',
              items: [
                'Hole filling: dilate → erode (closing)',
                'Edge detection: subtract original from dilated',
                'Object joining: multiple dilations',
                'Mask expansion for compositing',
                'Feature enhancement in binary images'
              ]
            },
            {
              title: 'Tips',
              items: [
                'Works best on binary or high-contrast images',
                'Multiple dilations = stronger effect',
                'Combine with erode for morphological closing',
                'Useful before filling/connecting operations'
              ]
            }
          ],
          tips: [
            'Opposite effect of erode command',
            'Use on binary/grayscale images',
            'Apply multiple times for stronger effect',
            'Useful for connecting nearby objects'
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-dilated${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Operation: Morphological dilation (3x3 kernel)`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply dilation:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).dilate();

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

        spinner.succeed(chalk.green('✓ Dilation applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to apply dilation'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
