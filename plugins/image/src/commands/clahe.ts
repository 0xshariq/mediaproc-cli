import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ClaheOptions {
  input: string;
  output?: string;
  width?: number;
  height?: number;
  maxSlope?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function claheCommand(imageCmd: Command): void {
  imageCmd
    .command('clahe <input>')
    .description('Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)')
    .option('-w, --width <size>', 'Tile width in pixels (default: 3)', parseInt, 3)
    .option('-h, --height <size>', 'Tile height in pixels (default: 3)', parseInt, 3)
    .option('--max-slope <value>', 'Maximum slope for contrast limiting (default: 3)', parseFloat, 3)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for clahe command')
    .action(async (input: string, options: ClaheOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'clahe',
          emoji: '✨',
          description: 'Apply Contrast Limited Adaptive Histogram Equalization to enhance local contrast. Especially useful for medical imaging, underwater photos, and low-light conditions.',
          usage: ['clahe <input>', 'clahe <input> --width 5 --height 5', 'clahe <input> --max-slope 2'],
          options: [
            { flag: '-w, --width <size>', description: 'Tile width in pixels (default: 3)' },
            { flag: '-h, --height <size>', description: 'Tile height in pixels (default: 3)' },
            { flag: '--max-slope <value>', description: 'Maximum slope for contrast limiting 1-5 (default: 3)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'clahe photo.jpg', description: 'Apply default CLAHE enhancement' },
            { command: 'clahe dark.jpg --max-slope 2', description: 'Subtle enhancement' },
            { command: 'clahe medical.png --width 5 --height 5', description: 'Larger tiles for smoother result' },
            { command: 'clahe underwater.jpg --max-slope 4', description: 'Strong enhancement' }
          ],
          additionalSections: [
            {
              title: 'Parameter Guide',
              items: [
                'Width/Height: Smaller = more local, Larger = more global',
                'Max Slope: Lower = subtle, Higher = dramatic',
                'Typical range: 2-4 for most images',
                'Medical imaging: 3-5 for detail enhancement'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Enhance low-light photographs',
                'Medical and scientific imaging',
                'Underwater photography correction',
                'Improve visibility in shadows',
                'Historical photo restoration',
                'Satellite/aerial imagery'
              ]
            }
          ],
          tips: [
            'Start with default values and adjust',
            'Lower max-slope for natural results',
            'Great for revealing shadow details',
            'Works best on grayscale or low-contrast images'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Applying CLAHE...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(inputPath.dir, `${inputPath.name}-clahe${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Tile size: ${options.width}x${options.height}`));
          console.log(chalk.dim(`  Max slope: ${options.maxSlope}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would apply CLAHE:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Tile: ${options.width}x${options.height}, Max slope: ${options.maxSlope}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();

        await createSharpInstance(input)
          .clahe({
            width: options.width || 3,
            height: options.height || 3,
            maxSlope: options.maxSlope || 3
          })
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);

        spinner.succeed(chalk.green('✓ CLAHE applied successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Tile: ${options.width}x${options.height}, Max slope: ${options.maxSlope}`));
        console.log(chalk.dim(`  File size: ${(outputStats.size / 1024).toFixed(2)}KB`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to apply CLAHE'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
