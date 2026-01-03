import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ClaheOptions {
  input: string;
  output?: string;
  width?: number;
  height?: number;
  maxSlope?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function claheCommand(imageCmd: Command): void {
  imageCmd
    .command('clahe <input>')
    .description('Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)')
    .option('-w, --width <size>', 'Tile width in pixels (default: 3)', parseInt, 3)
    .option('-h, --height <size>', 'Tile height in pixels (default: 3)', parseInt, 3)
    .option('--max-slope <value>', 'Maximum slope for contrast limiting (default: 3)', parseFloat, 3)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for clahe command')
    .action(async (input: string, options: ClaheOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'clahe',
          emoji: '✨',
          description: 'Apply Contrast Limited Adaptive Histogram Equalization to enhance local contrast. Especially useful for medical imaging, underwater photos, and low-light conditions.',
          usage: ['clahe <input>', 'clahe <input> --width 5 --height 5', 'clahe <input> --max-slope 2'],
          options: [
            { flag: '-w, --width <size>', description: 'Tile width in pixels (default: 3)' },
            { flag: '-h, --height <size>', description: 'Tile height in pixels (default: 3)' },
            { flag: '--max-slope <value>', description: 'Maximum slope for contrast limiting 1-5 (default: 3)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'clahe photo.jpg', description: 'Apply default CLAHE enhancement' },
            { command: 'clahe dark.jpg --max-slope 2', description: 'Subtle enhancement' },
            { command: 'clahe medical.png --width 5 --height 5', description: 'Larger tiles for smoother result' },
            { command: 'clahe underwater.jpg --max-slope 4', description: 'Strong enhancement' }
          ],
          additionalSections: [
            {
              title: 'Parameter Guide',
              items: [
                'Width/Height: Smaller = more local, Larger = more global',
                'Max Slope: Lower = subtle, Higher = dramatic',
                'Typical range: 2-4 for most images',
                'Medical imaging: 3-5 for detail enhancement'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Enhance low-light photographs',
                'Medical and scientific imaging',
                'Underwater photography correction',
                'Improve visibility in shadows',
                'Historical photo restoration',
                'Satellite/aerial imagery'
              ]
            }
          ],
          tips: [
            'Start with default values and adjust',
            'Lower max-slope for natural results',
            'Great for revealing shadow details',
            'Works best on grayscale or low-contrast images'
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
          suffix: '-clahe',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Tile size: ${options.width || 3}x${options.height || 3}`));
          console.log(chalk.dim(`  Max slope: ${options.maxSlope || 3}`));
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
            await createSharpInstance(inputFile)
              .clahe({
                width: options.width || 3,
                height: options.height || 3,
                maxSlope: options.maxSlope || 3
              })
              .toFile(outputPath);
            
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
        spinner.fail(chalk.red('Failed to apply CLAHE'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
