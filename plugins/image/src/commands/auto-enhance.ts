import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface AutoEnhanceOptions {
  input: string;
  output?: string;
  level?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function autoEnhanceCommand(imageCmd: Command): void {
  imageCmd
    .command('auto-enhance <input>')
    .description('Automatically enhance image with intelligent adjustments')
    .option('-l, --level <level>', 'Enhancement level: low, medium, high (default: medium)', 'medium')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for auto-enhance command')
    .action(async (input: string, options: AutoEnhanceOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'auto-enhance',
          emoji: '✨',
          description: 'Automatically enhance images with intelligent adjustments. Applies normalization, sharpening, and contrast optimization in one command.',
          usage: ['auto-enhance <input>', 'auto-enhance <input> --level high', 'auto-enhance <input> -l low -o enhanced.jpg'],
          options: [
            { flag: '-l, --level <level>', description: 'Enhancement level: low, medium, high (default: medium)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'auto-enhance photo.jpg', description: 'Apply medium enhancement' },
            { command: 'auto-enhance dark.jpg --level high', description: 'Strong enhancement for poor lighting' },
            { command: 'auto-enhance image.png -l low', description: 'Subtle enhancement' },
            { command: 'auto-enhance pic.jpg -o enhanced.jpg', description: 'Save enhanced version' }
          ],
          additionalSections: [
            {
              title: 'Enhancement Levels',
              items: [
                'low - Subtle: Normalize + Light sharpen',
                'medium - Balanced: Normalize + Moderate sharpen + Contrast (recommended)',
                'high - Aggressive: Normalize + Strong sharpen + High contrast + CLAHE'
              ]
            },
            {
              title: 'What Gets Enhanced',
              items: [
                'Color normalization - Balance histogram',
                'Sharpness - Enhance edge definition',
                'Contrast - Improve dynamic range',
                'Brightness - Auto-level exposure',
                'Clarity - Reduce dullness',
                'Detail - Enhance fine features'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Quick photo fixes for social media',
                'Old/faded photo restoration',
                'Low-light image improvement',
                'Batch processing automation',
                'Smartphone photo enhancement',
                'Scan cleanup and improvement'
              ]
            }
          ],
          tips: [
            'Start with medium and adjust if needed',
            'High level great for dark/dull images',
            'Low level for already good photos',
            'Combine with other commands for custom workflows'
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
          suffix: '-enhanced',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        const level = ['low', 'medium', 'high'].includes(options.level || 'medium') ? options.level : 'medium';

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Enhancement level: ${level}`));
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
            let pipeline = createSharpInstance(inputFile);

            // Apply enhancements based on level
            switch (level) {
              case 'low':
                // Subtle enhancement
                pipeline = pipeline
                  .normalize()  // Histogram normalization
                  .sharpen({ sigma: 0.5 });  // Light sharpen
                break;

              case 'medium':
                // Balanced enhancement (default)
                pipeline = pipeline
                  .normalize()  // Histogram normalization
                  .modulate({ brightness: 1.05, saturation: 1.1 })  // Slight boost
                  .sharpen({ sigma: 1.0 });  // Moderate sharpen
                break;

              case 'high':
                // Aggressive enhancement
                pipeline = pipeline
                  .normalize()  // Histogram normalization
                  .clahe({ width: 3, height: 3, maxSlope: 3 })  // Local contrast
                  .modulate({ brightness: 1.1, saturation: 1.2, hue: 0 })  // Boost colors
                  .sharpen({ sigma: 1.5 });  // Strong sharpen
                break;
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
        spinner.fail(chalk.red('Auto-enhancement failed'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
