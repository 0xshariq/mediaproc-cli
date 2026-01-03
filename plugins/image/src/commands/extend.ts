import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ExtendOptions extends ImageOptions {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  background?: string;
  help?: boolean;
}

export function extendCommand(imageCmd: Command): void {
  imageCmd
    .command('extend <input>')
    .description('Add padding/border around image')
    .option('--top <pixels>', 'Top padding in pixels', parseInt, 0)
    .option('--bottom <pixels>', 'Bottom padding in pixels', parseInt, 0)
    .option('--left <pixels>', 'Left padding in pixels', parseInt, 0)
    .option('--right <pixels>', 'Right padding in pixels', parseInt, 0)
    .option('--all <pixels>', 'All sides padding in pixels', parseInt)
    .option('--background <color>', 'Background color (default: white)', 'white')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for extend command')
    .action(async (input: string, options: ExtendOptions & { all?: number }) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'extend',
          emoji: '🖼️',
          description: 'Add padding or borders around images. Perfect for creating frames, adding space, or preparing images for specific aspect ratios.',
          usage: ['extend <input> --all <pixels>', 'extend <input> --top 50 --bottom 50', 'extend <input> --all 20 --background black'],
          options: [
            { flag: '--all <pixels>', description: 'Padding on all sides (shortcut)' },
            { flag: '--top <pixels>', description: 'Top padding in pixels' },
            { flag: '--bottom <pixels>', description: 'Bottom padding in pixels' },
            { flag: '--left <pixels>', description: 'Left padding in pixels' },
            { flag: '--right <pixels>', description: 'Right padding in pixels' },
            { flag: '--background <color>', description: 'Background color (default: white, accepts hex/rgb/names)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-extended.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'extend photo.jpg --all 50', description: 'Add 50px padding on all sides' },
            { command: 'extend image.png --all 20 --background black', description: 'Add black border' },
            { command: 'extend pic.jpg --top 100 --bottom 100', description: 'Add padding top/bottom only' },
            { command: 'extend photo.jpg --all 30 --background "#ff0000"', description: 'Add red border' }
          ],
          additionalSections: [
            {
              title: 'Use Cases',
              items: [
                'Adding borders/frames to images',
                'Creating letterbox/pillarbox effect',
                'Preparing images for specific dimensions',
                'Adding space for text overlay',
                'Social media post formatting'
              ]
            },
            {
              title: 'Color Options',
              items: [
                'white - Default white background',
                'black - Black border',
                'transparent - Transparent padding (PNG)',
                '#ff0000 - Hex colors',
                'rgb(255,0,0) - RGB colors'
              ]
            }
          ],
          tips: [
            'Use --all for uniform padding',
            'Combine with watermark for branded images',
            'Use transparent background for PNGs',
            'Match background to image for seamless look'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        const { inputFiles, outputDir, errors } = validatePaths(input, options.output, {
          allowedExtensions: MediaExtensions.IMAGE,
          recursive: true,
        });

        if (errors.length > 0) {
          spinner.fail(chalk.red('Validation failed:'));
          errors.forEach(err => console.log(chalk.red(`  ✗ ${err}`)));
          process.exit(1);
        }

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid image files found'));
          process.exit(1);
        }

        const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
          suffix: '-extended',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        const top = options.all !== undefined ? options.all : (options.top || 0);
        const bottom = options.all !== undefined ? options.all : (options.bottom || 0);
        const left = options.all !== undefined ? options.all : (options.left || 0);
        const right = options.all !== undefined ? options.all : (options.right || 0);

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Padding: top=${top}, bottom=${bottom}, left=${left}, right=${right}`));
          console.log(chalk.dim(`  Background: ${options.background || 'white'}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would extend ${inputFiles.length} image(s):`));
          inputFiles.forEach((inputFile, index) => {
            const outputPath = outputPaths.get(inputFile);
            console.log(chalk.dim(`  ${index + 1}. ${path.basename(inputFile)} → ${path.basename(outputPath!)}`));
          });
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          const fileName = path.basename(inputFile);
          
          spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

          try {
            const pipeline = createSharpInstance(inputFile).extend({
              top,
              bottom,
              left,
              right,
              background: options.background || 'white'
            });

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} extended`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed: ${fileName}`));
            if (options.verbose && error instanceof Error) {
              console.log(chalk.red(`    Error: ${error.message}`));
            }
            failCount++;
          }
        }

        console.log(chalk.bold('\nSummary:'));
        console.log(chalk.green(`  ✓ Success: ${successCount}`));
        if (failCount > 0) {
          console.log(chalk.red(`  ✗ Failed: ${failCount}`));
        }
        console.log(chalk.dim(`  Output directory: ${outputDir}`));

      } catch (error) {
        spinner.fail(chalk.red('Processing failed'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
