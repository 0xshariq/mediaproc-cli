import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ThresholdOptions extends FilterOptions {
  threshold?: number;
  grayscale?: boolean;
}

export function thresholdCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('threshold <input>')
    .description('Apply threshold to image (convert to binary black/white)')
    .option('-t, --threshold <value>', 'Threshold value 0-255 (default: 128)', parseInt, 128)
    .option('--grayscale', 'Convert to grayscale first (recommended)', true)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output');

  cmd.addHelpText('after', () => {
    return '\n' + createStandardHelp({
      commandName: 'threshold',
      emoji: '⚫⚪',
      description: 'Convert image to pure black and white using threshold value. Pixels above threshold become white, below become black.',
      usage: ['threshold <input>', 'threshold <input> -t 100'],
      options: [
        { flag: '-t, --threshold <value>', description: 'Threshold value 0-255 (default: 128)' },
        { flag: '--grayscale', description: 'Convert to grayscale first (default: true)' },
        { flag: '-o, --output <path>', description: 'Output file path (default: <input>-threshold.<ext>)' },
        { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
        { flag: '--dry-run', description: 'Preview changes without executing' },
        { flag: '-v, --verbose', description: 'Show detailed output' }
      ],
      examples: [
        { command: 'threshold document.jpg', description: 'Binary threshold at 128' },
        { command: 'threshold scan.jpg -t 180', description: 'Higher threshold (more white)' },
        { command: 'threshold image.jpg -t 80', description: 'Lower threshold (more black)' },
        { command: 'threshold photo.jpg -t 128 -o bw.png', description: 'Save as PNG' }
      ],
      additionalSections: [
        {
          title: 'Threshold Guide',
          items: [
            '0: All pixels become white',
            '128: Middle threshold (default)',
            '255: All pixels become black',
            'Lower value = more white pixels',
            'Higher value = more black pixels'
          ]
        },
        {
          title: 'Use Cases',
          items: [
            'Document scanning - clean text',
            'OCR preprocessing',
            'Binary image masks',
            'Edge detection prep',
            'QR code/barcode cleanup'
          ]
        }
      ],
      tips: [
        'Use 128 for balanced results',
        'Try 180-200 for dark text on light background',
        'Try 60-80 for light text on dark background',
        'Combine with scan-enhance for best document results'
      ]
    });
  });

  cmd.action(async (input: string, options: ThresholdOptions) => {
    const spinner = ora('Validating inputs...').start();

      try {
        const thresholdValue = Math.max(0, Math.min(255, options.threshold || 128));

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
          suffix: '-threshold',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Threshold: ${thresholdValue}`));
          console.log(chalk.dim(`  Grayscale: ${options.grayscale !== false}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would apply threshold to ${inputFiles.length} image(s):`));
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
            let pipeline = createSharpInstance(inputFile);

            if (options.grayscale !== false) {
              pipeline = pipeline.grayscale();
            }

            pipeline = pipeline.threshold(thresholdValue);

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
        spinner.fail(chalk.red('Failed to apply threshold'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
