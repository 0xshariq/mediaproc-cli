import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface TrimOptions extends ImageOptions {
  threshold?: number;
  help?: boolean;
}

export function trimCommand(imageCmd: Command): void {
  imageCmd
    .command('trim <input>')
    .description('Trim/remove border edges from image')
    .option('-t, --threshold <value>', 'Threshold for edge detection (1-100, default: 10)', parseInt, 10)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for trim command')
    .action(async (input: string, options: TrimOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'trim',
          emoji: '✂️',
          description: 'Automatically trim/remove boring border edges from images. Perfect for removing whitespace, borders, or uniform backgrounds.',
          usage: ['trim <input>', 'trim <input> -t <threshold>', 'trim <input> -t 20'],
          options: [
            { flag: '-t, --threshold <value>', description: 'Edge detection threshold 1-100 (default: 10, higher = more aggressive)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-trimmed.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'trim photo.jpg', description: 'Auto-trim with default threshold (10)' },
            { command: 'trim image.png -t 5', description: 'Gentle trim (sensitive)' },
            { command: 'trim pic.jpg -t 20', description: 'Aggressive trim' },
            { command: 'trim screenshot.png', description: 'Remove screenshot borders' }
          ],
          additionalSections: [
            {
              title: 'Threshold Guide',
              items: [
                '1-5 - Very sensitive (removes slight differences)',
                '10 - Default (balanced)',
                '15-25 - Aggressive (removes more)',
                '25+ - Very aggressive (may over-trim)'
              ]
            },
            {
              title: 'Best For',
              items: [
                'Scanned documents with borders',
                'Screenshots with padding',
                'Images with solid color borders',
                'Product photos on white backgrounds',
                'Auto-cropping uniform edges'
              ]
            }
          ],
          tips: [
            'Start with default threshold (10)',
            'Lower threshold for subtle edges',
            'Higher threshold for obvious borders',
            'Perfect for batch processing scans'
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
          suffix: '-trimmed',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Threshold: ${options.threshold || 10}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would trim ${inputFiles.length} image(s):`));
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
            const pipeline = createSharpInstance(inputFile).trim({ threshold: options.threshold || 10 });

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} trimmed`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed to trim ${fileName}`));
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
        spinner.fail(chalk.red('Failed to trim images'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
