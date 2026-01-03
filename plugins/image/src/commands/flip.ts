import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
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

      const spinner = ora('Validating inputs...').start();

      try {
        if (!options.horizontal && !options.vertical && !options.both) {
          options.horizontal = true;
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

        const flipType = options.both ? 'both' : options.vertical ? 'vertical' : 'horizontal';

        const outputPaths = resolveOutputPaths(inputFiles, outputDir, {
          suffix: '-flipped',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Mode: ${flipType}`));
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
            let pipeline = createSharpInstance(inputFile);

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
            
            spinner.succeed(chalk.green(`✓ ${fileName} processed`));
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
