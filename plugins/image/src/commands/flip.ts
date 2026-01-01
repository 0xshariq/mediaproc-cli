import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface FlipOptions extends ImageOptions {
  horizontal?: boolean;
  vertical?: boolean;
  both?: boolean;
  help?: boolean;
}

export function flipCommand(imageCmd: Command): void {
  imageCmd
    .command('flip <input>')
    .description('Flip image horizontally, vertically, or both')
    .option('--horizontal', 'Flip horizontally (mirror left-right)')
    .option('--vertical', 'Flip vertically (mirror top-bottom)')
    .option('--both', 'Flip both horizontally and vertically (rotate 180°)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for flip command')
    .action(async (input: string, options: FlipOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'flip',
          emoji: '🔃',
          description: 'Flip (mirror) images horizontally, vertically, or both. Create mirror effects or correct image orientation.',
          usage: ['flip <input> --horizontal', 'flip <input> --vertical', 'flip <input> --both'],
          options: [
            { flag: '--horizontal', description: 'Flip horizontally (mirror left-right)' },
            { flag: '--vertical', description: 'Flip vertically (mirror top-bottom)' },
            { flag: '--both', description: 'Flip both ways (equivalent to 180° rotation)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-flipped.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'flip photo.jpg --horizontal', description: 'Create horizontal mirror effect' },
            { command: 'flip image.png --vertical', description: 'Flip image upside down' },
            { command: 'flip pic.jpg --both', description: 'Flip both directions (180° rotation)' },
            { command: 'flip selfie.jpg --horizontal', description: 'Correct selfie mirror effect' }
          ],
          tips: ['Default is horizontal flip if no option specified', 'Flip operations are very fast']
        });
        process.exit(0);
      }

      const spinner = ora('Processing image...').start();

      try {
        if (!fs.existsSync(input)) {
          spinner.fail(chalk.red(`Input file not found: ${input}`));
          process.exit(1);
        }

        if (!options.horizontal && !options.vertical && !options.both) {
          options.horizontal = true;
        }

        const inputPath = path.parse(input);
        const flipType = options.both ? 'both' : options.vertical ? 'vertical' : 'horizontal';
        const outputPath = options.output || path.join(process.cwd(), `${inputPath.name}-flipped-${flipType}${inputPath.ext}`);

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Input: ${input}`));
          console.log(chalk.dim(`  Output: ${outputPath}`));
          console.log(chalk.dim(`  Mode: ${flipType}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green('✓ Would flip image:'));
          console.log(chalk.dim(`  From: ${input}`));
          console.log(chalk.dim(`  To: ${outputPath}`));
          console.log(chalk.dim(`  Mode: ${flipType}`));
          return;
        }

        const metadata = await createSharpInstance(input).metadata();
        let pipeline = createSharpInstance(input);

        if (options.both) {
          pipeline = pipeline.flip().flop();
        } else if (options.vertical) {
          pipeline = pipeline.flip();
        } else {
          pipeline = pipeline.flop();
        }

        const outputExt = path.extname(outputPath).toLowerCase();
        if (outputExt === '.jpg' || outputExt === '.jpeg') {
          pipeline.jpeg({ quality: options.quality || 90 });
        } else if (outputExt === '.png') {
          pipeline.png({ quality: options.quality || 90 });
        } else if (outputExt === '.webp') {
          pipeline.webp({ quality: options.quality || 90 });
        }

        await pipeline.toFile(outputPath);

        spinner.succeed(chalk.green('✓ Image flipped successfully!'));
        console.log(chalk.dim(`  Input: ${input}`));
        console.log(chalk.dim(`  Output: ${outputPath}`));
        console.log(chalk.dim(`  Size: ${metadata.width}x${metadata.height}`));
        console.log(chalk.dim(`  Mode: ${flipType} flip`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to flip image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
