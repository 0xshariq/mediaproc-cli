import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ModulateOptions extends FilterOptions {
  brightness?: number;
  saturation?: number;
  hue?: number;
  help?: boolean;
}

export function modulateCommand(imageCmd: Command): void {
  imageCmd
    .command('modulate <input>')
    .description('Adjust brightness, saturation, and hue')
    .option('-b, --brightness <value>', 'Brightness multiplier (0.1-10, default: 1)', parseFloat, 1)
    .option('-s, --saturation <value>', 'Saturation multiplier (0.1-10, default: 1)', parseFloat, 1)
    .option('--hue <degrees>', 'Hue rotation in degrees (-360 to 360, default: 0)', parseInt, 0)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for modulate command')
    .action(async (input: string, options: ModulateOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'modulate',
          emoji: '🎚️',
          description: 'Adjust brightness, saturation, and hue of images. Fine-tune colors and lighting for perfect image appearance.',
          usage: ['modulate <input>', 'modulate <input> -b <brightness>', 'modulate <input> -b 1.2 -s 1.5 --hue 30'],
          options: [
            { flag: '-b, --brightness <value>', description: 'Brightness multiplier 0.1-10 (1 = no change, >1 = brighter, <1 = darker)' },
            { flag: '-s, --saturation <value>', description: 'Saturation multiplier 0.1-10 (1 = no change, >1 = more vibrant, <1 = less vibrant)' },
            { flag: '--hue <degrees>', description: 'Hue rotation -360 to 360 degrees (0 = no change)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-modulated.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'modulate photo.jpg -b 1.2', description: 'Increase brightness by 20%' },
            { command: 'modulate image.png -s 1.5', description: 'Boost saturation by 50%' },
            { command: 'modulate pic.jpg --hue 180', description: 'Rotate hue by 180 degrees' },
            { command: 'modulate photo.jpg -b 0.8 -s 1.3', description: 'Darker but more saturated' },
            { command: 'modulate pic.jpg -b 1.2 -s 1.2 --hue 30', description: 'Adjust all three parameters' }
          ],
          additionalSections: [
            {
              title: 'Brightness Guide',
              items: [
                '0.5 - Much darker (50% brightness)',
                '0.8 - Slightly darker',
                '1.0 - No change (default)',
                '1.2 - Slightly brighter',
                '1.5 - Much brighter (150% brightness)',
                '2.0 - Double brightness'
              ]
            },
            {
              title: 'Saturation Guide',
              items: [
                '0.0 - Completely desaturated (grayscale)',
                '0.5 - Half saturation (muted colors)',
                '1.0 - No change (default)',
                '1.5 - 50% more vibrant',
                '2.0 - Double saturation (very vivid)'
              ]
            },
            {
              title: 'Hue Rotation Effects',
              items: [
                '0° - No change',
                '30° - Subtle color shift',
                '60° - Noticeable shift',
                '90° - Quarter rotation (e.g., blue → magenta)',
                '180° - Opposite colors (e.g., blue → yellow)',
                '360° - Full circle (back to original)'
              ]
            }
          ],
          tips: [
            'Start with small adjustments (±0.1-0.2)',
            'Brightness 1.2 and saturation 1.3 often work well together',
            'Use saturation 0 for grayscale effect',
            'Hue rotation creates artistic color effects'
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
          suffix: '-modulated',
          preserveStructure: inputFiles.length > 1,
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Brightness: ${options.brightness || 1}`));
          console.log(chalk.dim(`  Saturation: ${options.saturation || 1}`));
          console.log(chalk.dim(`  Hue: ${options.hue || 0}°`));
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
            const pipeline = createSharpInstance(inputFile).modulate({
              brightness: options.brightness || 1,
              saturation: options.saturation || 1,
              hue: options.hue || 0
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
        spinner.fail(chalk.red('Failed to modulate image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
