import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { ExtractOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface ExtractOptionsExtended extends ExtractOptions {
  help?: boolean;
}

export function extractCommand(imageCmd: Command): void {
  imageCmd
    .command('extract <input>')
    .description('Extract color channels or specific regions from image')
    .option('-c, --channel <channel>', 'Extract channel: red, green, blue, alpha')
    .option('--left <pixels>', 'X position for region extraction', parseInt)
    .option('--top <pixels>', 'Y position for region extraction', parseInt)
    .option('-w, --width <pixels>', 'Width for region extraction', parseInt)
    .option('-h, --height <pixels>', 'Height for region extraction', parseInt)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for extract command')
    .action(async (input: string, options: ExtractOptionsExtended) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'extract',
          emoji: '✂️',
          description: 'Extract specific color channels (R, G, B, alpha) or rectangular regions from images. Useful for analysis, masking, and advanced editing.',
          usage: ['extract <input> --channel red', 'extract <input> --left 100 --top 100 --width 500 --height 500', 'extract <input> --channel alpha'],
          options: [
            { flag: '-c, --channel <channel>', description: 'Extract color channel: red, green, blue, alpha' },
            { flag: '--left <pixels>', description: 'X position for region extraction' },
            { flag: '--top <pixels>', description: 'Y position for region extraction' },
            { flag: '-w, --width <pixels>', description: 'Width for region extraction' },
            { flag: '-h, --height <pixels>', description: 'Height for region extraction' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'extract photo.jpg --channel red', description: 'Extract red channel only' },
            { command: 'extract image.png --channel alpha', description: 'Extract alpha/transparency channel' },
            { command: 'extract photo.jpg --left 100 --top 100 --width 500 --height 500', description: 'Extract 500x500 region' },
            { command: 'extract image.jpg --channel blue -o blue-channel.png', description: 'Save blue channel separately' }
          ],
          additionalSections: [
            {
              title: 'Channel Extraction',
              items: [
                'red - Extract red color channel',
                'green - Extract green color channel',
                'blue - Extract blue color channel',
                'alpha - Extract transparency/alpha channel'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Analyze color distribution in images',
                'Create custom masks from channels',
                'Extract transparency for processing',
                'Crop specific regions precisely',
                'Prepare channels for compositing'
              ]
            }
          ],
          tips: [
            'Channel extraction produces grayscale images',
            'Use alpha extraction for transparency masks',
            'Region extraction preserves original colors',
            'Combine with other commands for advanced workflows'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Extracting...').start();

      try {
        // Validate input paths
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
          suffix: options.channel ? `-${options.channel}` : '-extracted',
          preserveStructure: inputFiles.length > 1,
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Output directory: ${outputDir}`));
          if (options.channel) {
            console.log(chalk.dim(`  Channel: ${options.channel}`));
          } else {
            console.log(chalk.dim(`  Region: ${options.left},${options.top} ${options.width}x${options.height}`));
          }
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would extract from ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          if (options.channel) {
            console.log(chalk.dim(`  Channel: ${options.channel}`));
          } else {
            console.log(chalk.dim(`  Region: ${options.left},${options.top} ${options.width}x${options.height}`));
          }
          return;
        }

        // Validate channel or region options once before processing
        if (options.channel) {
          const channelMap = {
            red: 0,
            green: 1,
            blue: 2,
            alpha: 3
          };
          const channelIndex = channelMap[options.channel as keyof typeof channelMap];
          if (channelIndex === undefined) {
            spinner.fail(chalk.red('Invalid channel. Use: red, green, blue, or alpha'));
            process.exit(1);
          }
        } else if (!options.left || !options.top || !options.width || !options.height) {
          spinner.fail(chalk.red('Region extraction requires --left, --top, --width, and --height'));
          process.exit(1);
        }

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = path.basename(inputFile);
            const outputPath = outputPaths.get(inputFile)!;

            let pipeline = createSharpInstance(inputFile);

            if (options.channel) {
              // Extract color channel
              const channelMap = {
                red: 0,
                green: 1,
                blue: 2,
                alpha: 3
              };
              const channelIndex = channelMap[options.channel as keyof typeof channelMap];
              
              if (channelIndex === 3) {
                pipeline = pipeline.ensureAlpha().extractChannel(channelIndex);
              } else {
                pipeline = pipeline.extractChannel(channelIndex as 0 | 1 | 2 | 3);
              }
            } else {
              // Extract region
              pipeline = pipeline.extract({
                left: options.left!,
                top: options.top!,
                width: options.width!,
                height: options.height!
              });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} extracted`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed: ${path.basename(inputFile)}`));
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
