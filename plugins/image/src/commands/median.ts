import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface MedianOptions extends FilterOptions {
  size?: number;
  help?: boolean;
}

export function medianCommand(imageCmd: Command): void {
  imageCmd
    .command('median <input>')
    .description('Apply median filter (noise reduction)')
    .option('-s, --size <size>', 'Filter size (1-50, default: 3)', parseInt, 3)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for median command')
    .action(async (input: string, options: MedianOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'median',
          emoji: '🔇',
          description: 'Apply median filter to reduce noise while preserving edges. Excellent for removing salt-and-pepper noise, scanner artifacts, and compression noise.',
          usage: ['median <input>', 'median <input> -s <size>', 'median <input> -s 5'],
          options: [
            { flag: '-s, --size <size>', description: 'Filter size 1-50 (default: 3, higher = more smoothing)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-median.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'median photo.jpg', description: 'Apply default median filter (size 3)' },
            { command: 'median noisy-image.png -s 5', description: 'Stronger noise reduction' },
            { command: 'median scan.jpg -s 7', description: 'Remove scanner artifacts' },
            { command: 'median compressed.jpg -s 3', description: 'Reduce compression noise' }
          ],
          additionalSections: [
            {
              title: 'Filter Size Guide',
              items: [
                'Size 1 - Minimal smoothing',
                'Size 3 - Default (balanced)',
                'Size 5-7 - Strong noise reduction',
                'Size 10+ - Heavy smoothing (may blur)'
              ]
            },
            {
              title: 'Best For',
              items: [
                'Salt-and-pepper noise removal',
                'Scanner artifacts',
                'JPEG compression noise',
                'Old photo restoration',
                'Low-light camera noise'
              ]
            },
            {
              title: 'vs Blur',
              items: [
                'Median preserves edges better than blur',
                'Better for noise, blur better for softness',
                'Median maintains sharpness',
                'Blur creates smooth gradient effect'
              ]
            }
          ],
          tips: [
            'Start with size 3 and increase if needed',
            'Better edge preservation than Gaussian blur',
            'Perfect for restoring old scanned photos',
            'Combine with sharpen for optimal results'
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
          suffix: '-median',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Filter size: ${options.size || 3}`));
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
            const pipeline = createSharpInstance(inputFile).median(options.size || 3);

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
        spinner.fail(chalk.red('Failed to apply median filter'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
