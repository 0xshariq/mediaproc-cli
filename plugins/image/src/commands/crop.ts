import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface CropOptions extends ImageOptions {
  x?: number;
  y?: number;
  help?: boolean;
}

export function cropCommand(imageCmd: Command): void {
  imageCmd
    .command('crop <input>')
    .description('Crop image to specified dimensions and position')
    .option('-x, --x <x>', 'X position (left offset in pixels)', parseInt, 0)
    .option('-y, --y <y>', 'Y position (top offset in pixels)', parseInt, 0)
    .option('-w, --width <width>', 'Crop width in pixels', parseInt)
    .option('-h, --height <height>', 'Crop height in pixels', parseInt)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for crop command')
    .action(async (input: string, options: CropOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'crop',
          emoji: '✂️',
          description: 'Crop images to specific dimensions and position. Extract a rectangular region from your image with pixel-perfect precision.',
          usage: ['crop <input> -w <width> -h <height>', 'crop <input> -x <x> -y <y> -w <width> -h <height>'],
          options: [
            { flag: '-x, --x <x>', description: 'X position - left offset in pixels (default: 0)' },
            { flag: '-y, --y <y>', description: 'Y position - top offset in pixels (default: 0)' },
            { flag: '-w, --width <width>', description: 'Crop width in pixels (required)' },
            { flag: '-h, --height <height>', description: 'Crop height in pixels (required)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-cropped.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'crop photo.jpg -w 800 -h 600', description: 'Crop 800x600 from top-left corner' },
            { command: 'crop image.png -x 100 -y 100 -w 500 -h 500', description: 'Crop square from specific position' },
            { command: 'crop pic.jpg -w 1920 -h 1080 -o thumbnail.jpg', description: 'Crop to Full HD dimensions' }
          ],
          tips: ['Use --dry-run to verify crop dimensions', 'Crop dimensions must fit within source image']
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        if (!options.width || !options.height) {
          spinner.fail(chalk.red('Both width and height are required for cropping'));
          process.exit(1);
        }

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
          suffix: '-cropped',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Position: (${options.x || 0}, ${options.y || 0})`));
          console.log(chalk.dim(`  Size: ${options.width}x${options.height}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would crop ${inputFiles.length} image(s):`));
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
            const metadata = await createSharpInstance(inputFile).metadata();

            if ((options.x || 0) + options.width > (metadata.width || 0)) {
              throw new Error(`Crop width exceeds image bounds`);
            }
            if ((options.y || 0) + options.height > (metadata.height || 0)) {
              throw new Error(`Crop height exceeds image bounds`);
            }

            const pipeline = createSharpInstance(inputFile).extract({
              left: options.x || 0,
              top: options.y || 0,
              width: options.width,
              height: options.height
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

            spinner.succeed(chalk.green(`✓ ${fileName} cropped`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed to crop ${fileName}`));
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
        spinner.fail(chalk.red('Failed to crop images'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
