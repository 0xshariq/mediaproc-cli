import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

export function blurCommand(imageCmd: Command): void {
  imageCmd
    .command('blur <input>')
    .description('Apply blur effect to image')
    .option('-s, --sigma <sigma>', 'Blur strength (0.3-1000, default: 10)', parseFloat, 10)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for blur command')
    .action(async (input: string, options: FilterOptions) => {
      // Show help if requested
      if (options.help) {
        createStandardHelp({
          commandName: 'blur',
          emoji: '🌫️',
          description: 'Apply Gaussian blur effect to images. Control the blur intensity with sigma parameter for subtle to extreme blur effects.',
          usage: [
            'blur <input>',
            'blur <input> -s <sigma>',
            'blur <input> -s <sigma> -o <output>'
          ],
          options: [
            { flag: '-s, --sigma <sigma>', description: 'Blur strength (0.3-1000, default: 10)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-blurred.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'blur photo.jpg', description: 'Apply default blur (sigma: 10)' },
            { command: 'blur image.png -s 5', description: 'Apply light blur' },
            { command: 'blur pic.jpg -s 50', description: 'Apply heavy blur' },
            { command: 'blur photo.jpg -s 20 -o blurred.jpg', description: 'Blur with custom output' },
            { command: 'blur background.png -s 30 -q 95', description: 'Blur with high quality' }
          ],
          additionalSections: [
            {
              title: 'Blur Strength Guide',
              items: [
                'Light blur: 1-5 (subtle effect)',
                'Medium blur: 5-15 (noticeable but detailed)',
                'Strong blur: 15-30 (background blur effect)',
                'Heavy blur: 30+ (privacy/anonymization)'
              ]
            }
          ],
          tips: [
            'Use sigma 3-5 for portrait background blur',
            'Use sigma 20+ for privacy/face obscuring',
            'Higher sigma values increase processing time'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        if (options.sigma && (options.sigma < 0.3 || options.sigma > 1000)) {
          spinner.fail(chalk.red('Sigma must be between 0.3 and 1000'));
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
          suffix: '-blurred',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Sigma: ${options.sigma || 10}`));
          console.log(chalk.dim(`  Quality: ${options.quality || 90}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would blur ${inputFiles.length} image(s):`));
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
            const pipeline = createSharpInstance(inputFile).blur(options.sigma || 10);

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} blurred`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed to blur ${fileName}`));
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

        console.log(chalk.dim(`  Output directory: ${outputDir}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to blur images'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
