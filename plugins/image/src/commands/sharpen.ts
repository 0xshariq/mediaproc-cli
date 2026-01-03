import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface SharpenOptions extends FilterOptions {
  sigma?: number;
  flat?: number;
  jagged?: number;
  help?: boolean;
}

export function sharpenCommand(imageCmd: Command): void {
  imageCmd
    .command('sharpen <input>')
    .description('Sharpen image')
    .option('-s, --sigma <sigma>', 'Sharpening strength (0.01-10, default: 1)', parseFloat, 1)
    .option('--flat <flat>', 'Level of sharpening for flat areas (default: 1)', parseFloat, 1)
    .option('--jagged <jagged>', 'Level of sharpening for jagged areas (default: 2)', parseFloat, 2)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for sharpen command')
    .action(async (input: string, options: SharpenOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'sharpen',
          emoji: '🔪',
          description: 'Sharpen images to enhance details and edges. Perfect for improving slightly blurry photos or enhancing image clarity.',
          usage: ['sharpen <input>', 'sharpen <input> -s <sigma>', 'sharpen <input> -s <sigma> --flat <flat> --jagged <jagged>'],
          options: [
            { flag: '-s, --sigma <sigma>', description: 'Sharpening strength 0.01-10 (default: 1)' },
            { flag: '--flat <flat>', description: 'Sharpening for flat areas (default: 1)' },
            { flag: '--jagged <jagged>', description: 'Sharpening for jagged areas (default: 2)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-sharpened.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'sharpen photo.jpg', description: 'Apply default sharpening' },
            { command: 'sharpen image.png -s 2', description: 'Strong sharpening' },
            { command: 'sharpen pic.jpg -s 0.5', description: 'Subtle sharpening' },
            { command: 'sharpen photo.jpg -s 1.5 --flat 1.5 --jagged 2.5', description: 'Custom sharpening parameters' }
          ],
          additionalSections: [
            {
              title: 'Sharpening Guide',
              items: [
                'Subtle: sigma 0.3-0.7 (slight enhancement)',
                'Normal: sigma 1.0-1.5 (standard sharpening)',
                'Strong: sigma 2.0-3.0 (heavy sharpening)',
                'Extreme: sigma 3.0+ (risk of artifacts)'
              ]
            }
          ],
          tips: [
            'Start with default values and adjust as needed',
            'Too much sharpening creates halos and artifacts',
            'Sharpen after resizing for best results',
            'Use lower values for portraits, higher for landscapes'
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
          suffix: '-sharpened',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Sigma: ${options.sigma || 1}`));
          console.log(chalk.dim(`  Flat: ${options.flat || 1}`));
          console.log(chalk.dim(`  Jagged: ${options.jagged || 2}`));
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
            const pipeline = createSharpInstance(inputFile).sharpen({
              sigma: options.sigma || 1,
              m1: options.flat || 1,
              m2: options.jagged || 2
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
