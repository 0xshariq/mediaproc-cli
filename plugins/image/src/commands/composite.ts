import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import { validatePaths, resolveOutputPaths, MediaExtensions } from '@mediaproc/cli';
import type { CompositeOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

interface CompositeOptionsExtended extends CompositeOptions {
  help?: boolean;
}

export function compositeCommand(imageCmd: Command): void {
  imageCmd
    .command('composite <input>')
    .description('Overlay/composite one image on top of another')
    .requiredOption('--overlay <path>', 'Overlay image to composite')
    .option('-o, --output <path>', 'Output file path')
    .option('--gravity <position>', 'Position: center, north, south, east, west, northeast, northwest, southeast, southwest', 'center')
    .option('--blend <mode>', 'Blend mode: over, multiply, screen, overlay, darken, lighten, add, saturate, etc.', 'over')
    .option('--left <pixels>', 'X position in pixels (overrides gravity)', parseInt)
    .option('--top <pixels>', 'Y position in pixels (overrides gravity)', parseInt)
    .option('--opacity <value>', 'Opacity 0-1 (default: 1)', parseFloat, 1)
    .option('--tile', 'Tile the overlay across the image')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for composite command')
    .action(async (input: string, options: CompositeOptionsExtended) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'composite',
          emoji: '🎨',
          description: 'Layer images on top of each other with precise positioning and blending modes. Perfect for watermarks, overlays, and creative compositions.',
          usage: ['composite <input> --overlay <overlay>', 'composite <input> --overlay <overlay> --gravity center', 'composite <input> --overlay logo.png --blend multiply'],
          options: [
            { flag: '--overlay <path>', description: 'Overlay image file (required)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--gravity <position>', description: 'Position: center, north, south, east, west, etc. (default: center)' },
            { flag: '--blend <mode>', description: 'Blend mode: over, multiply, screen, overlay, darken, lighten (default: over)' },
            { flag: '--left <pixels>', description: 'X position in pixels (overrides gravity)' },
            { flag: '--top <pixels>', description: 'Y position in pixels (overrides gravity)' },
            { flag: '--opacity <value>', description: 'Opacity 0-1 (default: 1)' },
            { flag: '--tile', description: 'Tile the overlay across the entire image' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'composite photo.jpg --overlay watermark.png --gravity southeast', description: 'Add watermark to bottom-right' },
            { command: 'composite image.jpg --overlay logo.png --opacity 0.5', description: 'Semi-transparent overlay' },
            { command: 'composite bg.jpg --overlay texture.png --blend multiply', description: 'Multiply blend for texture effect' },
            { command: 'composite photo.jpg --overlay pattern.png --tile', description: 'Tile pattern across image' },
            { command: 'composite image.jpg --overlay badge.png --left 50 --top 50', description: 'Position at exact coordinates' }
          ],
          additionalSections: [
            {
              title: 'Blend Modes',
              items: [
                'over - Default, overlay on top',
                'multiply - Darkens, good for shadows/textures',
                'screen - Lightens, good for glow effects',
                'overlay - Combination of multiply and screen',
                'darken - Keep darker of two colors',
                'lighten - Keep lighter of two colors',
                'add - Add pixel values together',
                'saturate - Increase color intensity'
              ]
            },
            {
              title: 'Gravity Positions',
              items: [
                'center - Center of image',
                'north - Top center',
                'south - Bottom center',
                'east - Right center',
                'west - Left center',
                'northeast - Top right',
                'northwest - Top left',
                'southeast - Bottom right',
                'southwest - Bottom left'
              ]
            }
          ],
          tips: [
            'Use --opacity for subtle watermarks',
            'Multiply blend mode great for textures',
            'Use --tile for repeating patterns',
            'PNG overlays preserve transparency'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing composite...').start();

      try {
        // Validate overlay file exists (single file)
        if (!fs.existsSync(options.overlay)) {
          spinner.fail(chalk.red(`Overlay file not found: ${options.overlay}`));
          process.exit(1);
        }

        // Validate input paths (can be multiple)
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
          suffix: '-composite',
          preserveStructure: inputFiles.length > 1,
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Overlay: ${options.overlay}`));
          console.log(chalk.dim(`  Output directory: ${outputDir}`));
          console.log(chalk.dim(`  Gravity: ${options.gravity}`));
          console.log(chalk.dim(`  Blend: ${options.blend}`));
          if (options.opacity !== 1) console.log(chalk.dim(`  Opacity: ${options.opacity}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would composite ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          console.log(chalk.dim(`  Overlay: ${options.overlay}`));
          console.log(chalk.dim(`  Position: ${options.left !== undefined && options.top !== undefined ? `${options.left}x${options.top}` : options.gravity}`));
          return;
        }

        // Preload and prepare overlay buffer once
        let overlayBuffer = await createSharpInstance(options.overlay).toBuffer();

        if (options.opacity !== undefined && options.opacity < 1) {
          overlayBuffer = await createSharpInstance(overlayBuffer)
            .ensureAlpha()
            .modulate({ brightness: 1, saturation: 1 })
            .linear(options.opacity, 0)
            .toBuffer();
        }

        // Build composite options
        const compositeOptions: any = {
          input: overlayBuffer,
          blend: options.blend || 'over',
        };

        if (options.left !== undefined && options.top !== undefined) {
          compositeOptions.left = options.left;
          compositeOptions.top = options.top;
        } else if (options.gravity) {
          compositeOptions.gravity = options.gravity;
        }

        if (options.tile) {
          compositeOptions.tile = true;
        }

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = path.basename(inputFile);
            const outputPath = outputPaths.get(inputFile)!;

            await createSharpInstance(inputFile).composite([compositeOptions]).toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} composited`));
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
