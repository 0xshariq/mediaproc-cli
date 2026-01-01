import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
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

      const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        const inputPath = path.parse(input);
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-rotated${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Angle: ${options.angle || 90}°`));
          console.log(chalk.dim(`  Background: ${options.background || 'transparent'}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would rotate image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Angle: ${options.angle || 90}°`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        const pipeline = createSharpInstance(input).rotate(options.angle || 90, {
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
        const outputMetadata = await createSharpInstance(outputPath).metadata();

        spinner.succeed(chalk.green('✓ Image rotated successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Original size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  New size: ${outputMetadata.width}x${outputMetadata.height}`));
        console.log(chalk.dim(`  Angle: ${options.angle || 90}°`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to rotate image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
