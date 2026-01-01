import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ErodeOptions extends ImageOptions {
  help?: boolean;
}

export function erodeCommand(imageCmd: Command): void {
  imageCmd
    .command('erode <input>')
    .description('Erode image (expand dark regions)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for erode command')
    .action(async (input: string, options: ErodeOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'erode',
          emoji: '⚫',
          description: 'Apply morphological erosion to expand dark regions and shrink bright areas. Useful for removing noise and separating objects.',
          usage: ['erode <input>', 'erode <input> -o eroded.png'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-eroded.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'erode mask.png', description: 'Erode binary mask' },
            { command: 'erode document.jpg -o clean.jpg', description: 'Remove small bright spots' },
            { command: 'erode text.png --verbose', description: 'Thin text with details' }
          ],
          additionalSections: [
            {
              title: 'What is Erosion?',
              items: [
                'Morphological operation from image processing',
                'Expands dark (low-value) regions',
                'Shrinks bright (high-value) regions',
                'Opposite of dilation',
                'Uses 3x3 kernel by default'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Remove small bright noise/spots',
                'Separate touching objects',
                'Thin bright features (text, lines)',
                'Create borders around objects',
                'Clean up binary masks'
              ]
            },
            {
              title: 'Common Workflows',
              items: [
                'Noise removal: erode → dilate (opening)',
                'Edge detection: subtract eroded from original',
                'Object separation: multiple erosions',
                'Text processing: thin characters',
                'Mask refinement in image segmentation'
              ]
            },
            {
              title: 'Tips',
              items: [
                'Works best on binary or high-contrast images',
                'Multiple erosions = stronger effect',
                'Combine with dilate for morphological opening',
                'Useful before object counting/separation'
              ]
            }
          ],
          tips: [
            'Opposite effect of dilate command',
            'Use on binary/grayscale images',
            'Apply multiple times for stronger effect',
            'Useful for separating connected objects'
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
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-eroded${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Operation: Morphological erosion (3x3 kernel)`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply erosion:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).erode();

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

        spinner.succeed(chalk.green('✓ Erosion applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)} KB`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to apply erosion'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
