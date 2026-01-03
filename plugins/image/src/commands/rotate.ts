import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface RotateOptions extends ImageOptions {
  angle?: number;
  background?: string;
  help?: boolean;
}

export function rotateCommand(imageCmd: Command): void {
  imageCmd
    .command('rotate <input>')
    .description('Rotate image by specified angle')
    .option('-a, --angle <degrees>', 'Rotation angle in degrees (default: 90)', parseFloat, 90)
    .option('--background <color>', 'Background color for areas outside image (default: transparent)', 'transparent')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for rotate command')
    .action(async (input: string, options: RotateOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'rotate',
          emoji: '🔄',
          description: 'Rotate images by any angle. Use positive values for clockwise rotation, negative for counter-clockwise.',
          usage: ['rotate <input>', 'rotate <input> -a <angle>', 'rotate <input> -a <angle> --background <color>'],
          options: [
            { flag: '-a, --angle <degrees>', description: 'Rotation angle in degrees (default: 90)' },
            { flag: '--background <color>', description: 'Background color for empty areas (default: transparent)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-rotated.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'rotate photo.jpg', description: 'Rotate 90° clockwise (default)' },
            { command: 'rotate image.png -a 180', description: 'Rotate 180° (upside down)' },
            { command: 'rotate pic.jpg -a -90', description: 'Rotate 90° counter-clockwise' },
            { command: 'rotate photo.jpg -a 45', description: 'Rotate 45° clockwise' },
            { command: 'rotate image.png -a 30 --background white', description: 'Rotate with white background' }
          ],
          tips: ['Use transparent background for PNGs', 'Negative angles rotate counter-clockwise']
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
          suffix: '-rotated',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Angle: ${options.angle || 90}°`));
          console.log(chalk.dim(`  Background: ${options.background || 'transparent'}`));
          console.log(chalk.dim(`  Quality: ${options.quality || 90}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would process ${inputFiles.length} image(s):`));
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
            const pipeline = createSharpInstance(inputFile).rotate(options.angle || 90, {
              background: options.background || 'transparent'
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
            
            if (options.verbose) {
              spinner.succeed(chalk.green(`✓ ${fileName} processed (${metadata.width}x${metadata.height})`));
            } else {
              spinner.succeed(chalk.green(`✓ ${fileName} processed`));
            }
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
